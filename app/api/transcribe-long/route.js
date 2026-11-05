// التفريغ الطويل: جزء واحد من التسجيل (WAV مونو 16 كيلوهرتز، حوالي 100 ثانية) بيتفرّغ بـ Gemini
// مع تمييز المتكلمين والتوقيت. الواجهة بتبعت الجزء كملف خام في جسم الطلب، والسياق (المتكلمين اللي ظهروا قبل كده
// وآخر جملة) في هيدر x-ctx. التوقيت اللي راجع نسبةً لبداية الجزء، والواجهة بتضيف بداية الجزء.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { extractJson } from "@/lib/llmjson";
import { MAX_BODY, CHUNK_SECONDS, normalizeSegments } from "@/lib/longaudio";

export const maxDuration = 60;
export const runtime = "nodejs";

// 70 جزء في الساعة لكل زائر ≈ ساعتين تسجيل
const tooMany = rateLimiter(Number(process.env.LONG_TRANSCRIBE_LIMIT) || 70);

export async function GET() {
  return Response.json({ enabled: !!process.env.GEMINI_API_KEY });
}

function readCtx(req) {
  try {
    const j = JSON.parse(decodeURIComponent(req.headers.get("x-ctx") || "") || "{}");
    const speakers = Array.isArray(j.speakers) ? j.speakers.map((x) => String(x).slice(0, 40)).filter(Boolean).slice(0, 12) : [];
    const last = String(j.last || "").slice(0, 300);
    const lang = ["ar", "en", "mix"].includes(j.lang) ? j.lang : "ar";
    return { speakers, last, lang };
  } catch {
    return { speakers: [], last: "", lang: "ar" };
  }
}

function prompt({ speakers, last, lang }, seconds) {
  const langLine = lang === "en"
    ? "The recording is mostly English. Transcribe in English exactly as spoken."
    : lang === "mix"
      ? "التسجيل فيه عربي وإنجليزي. اكتب كل كلمة باللغة اللي اتقالت بيها (العربي بحروف عربي والإنجليزي بحروف إنجليزي)."
      : "التسجيل عربي (ممكن عامية مصرية أو خليجية أو فصحى). اكتب الكلام بالحرف زي ما اتقال باللهجة نفسها، من غير ما تحوّله لفصحى.";
  return [
    `فرّغ التسجيل ده (حوالي ${Math.round(seconds)} ثانية) تفريغ كامل بالحرف، من غير تلخيص ولا شرح ولا إضافة.`,
    langLine,
    "قسّم الكلام لمقاطع: مقطع جديد كل ما المتكلم يتغير أو كل جملة أو جملتين طويلين.",
    "ميّز المتكلمين بصوتهم وسمّيهم دايماً بنفس الشكل بالظبط: المتكلم 1، المتكلم 2، وهكذا، من غير أسماء ولا أي إضافة.",
    speakers.length ? `المتكلمين اللي ظهروا في الأجزاء اللي قبل كده: ${speakers.join("، ")}. حافظ على نفس التسمية لنفس الصوت، وما تخترعش متكلم جديد إلا لو صوت جديد فعلاً.` : "",
    last ? `آخر جملة في الجزء اللي قبل ده (للسياق بس، ما تكتبهاش تاني): «${last}»` : "",
    "توقيت كل مقطع بالدقايق والثواني من بداية الجزء ده (start بشكل MM:SS).",
    "تجاهل الصمت والمزيكا. لو فيه كلام مش مفهوم اكتب [غير واضح].",
    'رجّع JSON بس: {"segments":[{"start":"00:00","speaker":"المتكلم 1","text":"..."}]}. لو مفيش كلام خالص رجّع {"segments":[]}.',
  ].filter(Boolean).join("\n");
}

async function callGemini(model, key, text, data, signal) {
  return fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      contents: [{ parts: [{ text }, { inline_data: { mime_type: "audio/wav", data } }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens: 8192 },
    }),
    signal,
  });
}

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fail("التفريغ الطويل مش مفعّل دلوقتي.", 503);
  if (tooMany(clientIp(req))) return fail("وصلت لحد التفريغ الساعة دي. استنى شوية وكمّل من نفس المكان.", 429);

  let bytes;
  try { bytes = new Uint8Array(await req.arrayBuffer()); } catch { return fail("الجزء ما وصلش.", 400); }
  if (bytes.length < 100 || bytes.length > MAX_BODY) return fail("حجم الجزء مش مظبوط.", 413);
  const isWav = bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 && bytes[8] === 0x57;
  if (!isWav) return fail("الجزء لازم يكون WAV.", 415);

  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const rate = dv.getUint32(24, true) || 16000;
  const seconds = Math.min(CHUNK_SECONDS + 15, (bytes.length - 44) / (rate * 2));
  const ctx = readCtx(req);
  const text = prompt(ctx, seconds);
  const data = Buffer.from(bytes).toString("base64");

  let status = 502;
  const models = [process.env.GEMINI_AUDIO_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"];
  for (const model of models) {
    try {
      const r = await callGemini(model, key, text, data, AbortSignal.any ? AbortSignal.any([req.signal, AbortSignal.timeout(50000)]) : req.signal);
      if (!r.ok) { status = r.status; if (r.status === 401 || r.status === 403) break; continue; }
      const j = await r.json();
      const out = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("");
      const obj = extractJson(out);
      if (!obj || !Array.isArray(obj.segments)) { status = 502; continue; }
      return Response.json({ segments: normalizeSegments(obj.segments, 0, seconds + 2), seconds });
    } catch { /* مهلة: جرّب النموذج التاني */ }
  }
  if (status === 429) return fail("خدمة التفريغ وصلت لحدها دلوقتي. استنى دقيقة وكمّل من نفس المكان.", 429);
  return fail("الجزء ده ما اتفرّغش. دوس «كمّل» وهيحاول تاني.", 502);
}
