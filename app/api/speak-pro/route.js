// الصوت المعبّر: بيحوّل فقرة (حتى 500 حرف) لصوت WAV بإحساس ونبرة حقيقيين عن طريق Gemini TTS.
// بيشتغل بنفس مفتاح GEMINI_API_KEY الموجود. لو المفتاح مش موجود الوضع ده بيتقفل والواجهة بتخفيه.
// اللهجة والنبرة والصوت بيتحددوا بمفاتيح من قوائم ثابتة، ونص الزائر بيتبعت كنص منطوق بس.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { DIALECTS, TONES, cleanForSpeech } from "@/lib/speech";
import { PRO_MODEL, MAX_PRO_CHARS, proVoice, proStyle, buildInteractionBody, extractWav } from "@/lib/geminitts";

export const maxDuration = 60;
export const runtime = "nodejs";

// الصوت المعبّر أغلى من العادي، فحده أقل: 60 فقرة في الساعة لكل زائر (حوالي نص ساعة صوت)
const tooMany = rateLimiter(Number(process.env.SPEAK_PRO_LIMIT) || 60);
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";

const DIALECT_IDS = new Set(DIALECTS.map((d) => d.id));

/** الواجهة بتسأل هنا هل الوضع ده شغال قبل ما تعرضه */
export async function GET() {
  return Response.json({ enabled: !!process.env.GEMINI_API_KEY, max: MAX_PRO_CHARS });
}

async function callGemini(body, key) {
  return fetch(ENDPOINT, {
    method: "POST",
    headers: { "x-goog-api-key": key, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(45000),
  });
}

export async function POST(req) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return fail("الصوت المعبّر مش مفعّل دلوقتي.", 503);

  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }

  const text = cleanForSpeech(body?.text).replace(/\s+/g, " ");
  if (!text) return fail("مفيش نص.", 400);
  if (text.length > MAX_PRO_CHARS) return fail(`الفقرة أطول من ${MAX_PRO_CHARS} حرف.`, 413);
  const dialect = DIALECT_IDS.has(body?.dialect) ? body.dialect : "eg";
  const gender = body?.gender === "m" ? "m" : "f";
  const tone = Object.hasOwn(TONES, body?.tone) ? body.tone : "normal";
  const variant = Number(body?.variant) === 1 ? 1 : 0;

  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح من الصوت المعبّر الساعة دي. جرّب بعد شوية أو استخدم الصوت العادي.", 429);

  const model = process.env.GEMINI_TTS_MODEL || PRO_MODEL;
  const payload = buildInteractionBody({ model, text, style: proStyle(dialect, tone), voice: proVoice(gender, variant) });

  let wav = null;
  let status = 502;
  for (let attempt = 0; attempt < 2 && !wav; attempt++) {
    try {
      const r = await callGemini(payload, key);
      if (r.ok) {
        wav = extractWav(await r.json());
        if (!wav) status = 502;
      } else {
        status = r.status;
        // مفتاح أو صلاحية أو طلب غلط: مفيش فايدة من إعادة المحاولة
        if (r.status === 429 || (r.status >= 400 && r.status < 500)) break;
      }
    } catch { /* انقطاع أو مهلة: نحاول مرة كمان */ }
  }

  if (!wav) {
    if (status === 429) return fail("الصوت المعبّر وصل لحده دلوقتي عند الخدمة. جرّب بعد شوية أو استخدم الصوت العادي.", 429);
    if (status === 400 || status === 401 || status === 403 || status === 404) return fail("الصوت المعبّر مش متاح دلوقتي.", 503);
    return fail("الصوت المعبّر مش متاح دلوقتي. جرّب بعد شوية.", 502);
  }
  return new Response(wav, { headers: { "Content-Type": "audio/wav", "Cache-Control": "private, max-age=3600" } });
}
