// تفريغ فويس البياع لنص (عربي ومصري). Whisper على Groq، ولو مش متاح بنجرب Gemini (بيسمع الصوت مباشرة).
import { fail, clientIp, rateLimiter } from "@/lib/groq";

export const runtime = "nodejs";
export const maxDuration = 60;
const tooMany = rateLimiter(20);
const MAX = 4_000_000; // Vercel بيقبل لحد 4.5 ميجا في الطلب
const HINT = "بياع مصري بيوصف منتج بيبيعه أونلاين: اسم المنتج، السعر بالجنيه، المقاسات والألوان، الشحن والتوصيل، والدفع عند الاستلام.";

async function groq(file, model, signal) {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  const fd = new FormData();
  fd.append("file", file, file.name || "voice.webm");
  fd.append("model", model);
  fd.append("language", "ar");
  fd.append("temperature", "0");
  fd.append("response_format", "json");
  fd.append("prompt", HINT);
  try {
    const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", { method: "POST", headers: { Authorization: `Bearer ${key}` }, body: fd, signal });
    if (!r.ok) return null;
    const j = await r.json();
    return String(j.text || "").trim() || null;
  } catch { return null; }
}

// Gemini بيفهم الصوت لو اتبعت كملف جوه الطلب
async function gemini(file, signal) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  const mime = (file.type || "audio/webm").split(";")[0];
  const data = Buffer.from(await file.arrayBuffer()).toString("base64");
  for (const model of [process.env.GEMINI_AUDIO_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"]) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [
            { text: `فرّغ الكلام اللي في التسجيل ده بالحرف زي ما اتقال بالعامية المصرية، من غير ما تلخص أو تزود أو تشرح. ${HINT} رجّع الكلام المتفرّغ بس.` },
            { inline_data: { mime_type: mime, data } },
          ] }],
          generationConfig: { temperature: 0 },
        }),
        signal,
      });
      if (!r.ok) continue;
      const j = await r.json();
      const text = (j?.candidates?.[0]?.content?.parts || []).map((p) => p.text || "").join("").trim();
      if (text) return text;
    } catch {}
  }
  return null;
}

export async function POST(req) {
  let form;
  try { form = await req.formData(); } catch { return fail("ابعت الفويس كملف.", 400); }
  const file = form.get("audio");
  if (!file || typeof file === "string") return fail("مفيش تسجيل.", 400);
  if (file.size < 1500) return fail("التسجيل قصير أوي. اتكلم كام ثانية عن المنتج.", 400);
  if (file.size > MAX) return fail("الفويس أكبر من 4 ميجا. سجّل حاجة أقصر (أقل من 3 دقايق).", 400);
  const audioExt = /\.(ogg|opus|oga|m4a|mp3|mp4|mpeg|mpga|wav|webm|aac|flac|amr)$/i.test(file.name || "");
  if (!/^(audio|video)\//.test(file.type || "audio/") && !audioExt) return fail("الملف ده مش صوت.", 400);
  if (tooMany(clientIp(req))) return fail("سجّلت كتير الساعة دي. استنى شوية.", 429);

  const text =
    (await groq(file, "whisper-large-v3-turbo", req.signal)) ||
    (await groq(file, "whisper-large-v3", req.signal)) ||
    (await gemini(file, req.signal));
  if (!text) return fail("ما قدرناش نسمع التسجيل دلوقتي. جرّب تاني، أو اكتب الكلام بإيدك.", 503);
  return Response.json({ text: text.slice(0, 4000) });
}
