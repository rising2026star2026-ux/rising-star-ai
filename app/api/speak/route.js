// مولد الأصوات والكتاب المسموع: بيحوّل فقرة نص (حتى 600 حرف) لصوت MP3 بأصوات Microsoft Edge العصبية.
// الواجهة بتقسّم الكتاب فقرات وبتطلبها واحدة واحدة، فالطلب الواحد دايماً سريع.
// الخدمة دي غير رسمية من مايكروسوفت، فلو اتحجبت بنرجّع 502 برسالة واضحة.
// النبرة والصوت بيتحددوا بمفاتيح من قوائم ثابتة (lib/speech.js)، مفيش حاجة من الزائر بتدخل SSML غير النص نفسه بعد تهريبه.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { VOICE_IDS, TONES, prosodyFor, cleanForSpeech, MAX_CHARS_PER_REQUEST } from "@/lib/speech";

export const maxDuration = 25;
export const runtime = "nodejs";
// 300 فقرة في الساعة لكل زائر: حوالي ساعتين ونص من الصوت، يكفي قراءة كتاب كبير وتنزيل فصول منه
const tooMany = rateLimiter(300);

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

async function synth(text, voice, prosody) {
  const tts = new MsEdgeTTS({ connectionTimeoutMs: 8000, synthesisTimeoutMs: 18000 });
  try {
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(esc(text), prosody);
    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on("data", (c) => chunks.push(c));
      audioStream.on("error", reject);
      audioStream.on("close", resolve);
      audioStream.on("end", resolve);
    });
    return Buffer.concat(chunks);
  } finally {
    try { tts.close(); } catch {}
  }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }

  const text = cleanForSpeech(body?.text).replace(/\s+/g, " ");
  if (!text) return fail("مفيش نص.", 400);
  if (text.length > MAX_CHARS_PER_REQUEST) return fail(`الفقرة أطول من ${MAX_CHARS_PER_REQUEST} حرف.`, 413);
  if (!VOICE_IDS.has(body?.voice)) return fail("الصوت ده مش متاح.", 400);
  const tone = Object.hasOwn(TONES, body?.tone) ? body.tone : "normal";
  const prosody = prosodyFor(tone, body?.pitch);

  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  let buf = null;
  for (let attempt = 0; attempt < 2 && !buf; attempt++) {
    try {
      const out = await synth(text, body.voice, prosody);
      if (out.length >= 500) buf = out;
    } catch { /* بنحاول مرة كمان */ }
  }
  if (!buf) return Response.json({ error: "الصوت مش متاح دلوقتي. جرّب بعد شوية." }, { status: 502 });
  return new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" } });
}
