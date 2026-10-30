// تحويل نص لصوت (MP3) بصوت Microsoft Edge العصبي. بيرجّع ملف صوت، والعميل بيفضل مسؤول عن الباقي.
// الخدمة دي غير رسمية من مايكروسوفت، فلو اتحجبت بنرجّع 502 والعميل بيروح للصوت البديل.
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { VOICES } from "@/lib/voices";

export const maxDuration = 20;
export const runtime = "nodejs";
const tooMany = rateLimiter(150); // ~15 فيديو في الساعة لكل زائر (10 مشاهد لكل فيديو)

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const text = String(body.text || "").replace(/\s+/g, " ").trim().slice(0, 400);
  const voice = body.voice in VOICES ? body.voice : "ar-EG-SalmaNeural";
  if (!text) return fail("مفيش نص.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  try {
    const tts = new MsEdgeTTS({ connectionTimeoutMs: 8000, synthesisTimeoutMs: 15000 });
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(esc(text));
    const chunks = [];
    await new Promise((resolve, reject) => {
      audioStream.on("data", (c) => chunks.push(c));
      audioStream.on("error", reject);
      audioStream.on("close", resolve);
      audioStream.on("end", resolve);
    });
    const buf = Buffer.concat(chunks);
    try { tts.close(); } catch {}
    if (buf.length < 500) return Response.json({ error: "tts_empty" }, { status: 502 });
    return new Response(buf, { headers: { "Content-Type": "audio/mpeg", "Cache-Control": "private, max-age=3600" } });
  } catch (e) {
    return Response.json({ error: "tts_unavailable", detail: String(e?.message || e).slice(0, 120) }, { status: 502 });
  }
}
