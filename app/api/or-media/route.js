// استوديو موديلات OpenRouter: توليد الصور، وتحويل النص لصوت، والموديلات اللي بترد بصوت.
// الموديل لازم يكون في القايمة (lib/allmodels) ونوعه صورة أو صوت. الفيديو مش مسموح.
// الرد بيرجع stream عشان الصور والصوت الكبيرة ما تتخطاش حد Vercel (4.5MB) وعشان الطلبات الطويلة.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { findModel } from "@/lib/allmodels";
import { validProCode } from "@/lib/botcatalog";
import { generateImages, speech, audioReply, arabicError, ASPECTS, RESOLUTIONS, QUALITIES, FORMATS, BACKGROUNDS } from "@/lib/ormedia";

export const maxDuration = 60; // Hobby بدون Fluid compute بيقبل لحد 60 ثانية بس. 300 كانت بتفشّل النشر

const tooManyImages = rateLimiter(30); // 30 صورة في الساعة لكل زائر
const tooManyAudio = rateLimiter(30);  // 30 مقطع صوت في الساعة لكل زائر
// حد عام للموقع كله في الساعة عشان رصيد OpenRouter ما يخلصش مرة واحدة
const GLOBAL = Math.max(10, Number(process.env.OR_MEDIA_PER_HOUR) || 300);
const tooManyGlobal = rateLimiter(GLOBAL);

const pick = (v, list, def) => (list.includes(v) ? v : def);
const okRef = (u) => typeof u === "string" && u.length < 1_600_000 && (/^data:image\/(png|jpe?g|webp|gif);base64,/.test(u) || /^https:\/\//.test(u));

function streamBytes(bytes, type, extra = {}) {
  const CHUNK = 256 * 1024;
  let i = 0;
  const body = new ReadableStream({
    pull(c) {
      if (i >= bytes.length) return c.close();
      c.enqueue(bytes.subarray(i, i + CHUNK));
      i += CHUNK;
    },
  });
  return new Response(body, { headers: { "Content-Type": type, "Cache-Control": "no-store", ...extra } });
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  if (!process.env.OPENROUTER_API_KEY) return fail("استوديو الموديلات هيتفعّل قريب.", 503);

  const model = await findModel(body.model);
  if (!model) return fail("الموديل ده مش موجود.", 404);
  if (model.kind === "text") return fail("الموديل ده للشات، افتحه من صفحة الشات.", 400);
  if (!model.free && !validProCode(body.pro)) return Response.json({ error: "الموديل ده هيتفعّل قريب.", code: "pro" }, { status: 402 });

  const ip = clientIp(req);

  if (model.kind === "image") {
    const prompt = typeof body.prompt === "string" ? body.prompt.trim().slice(0, 4000) : "";
    if (!prompt) return fail("اكتب وصف الصورة الأول.", 400);
    const n = Math.min(4, Math.max(1, parseInt(body.n, 10) || 1));
    const refs = (Array.isArray(body.refs) ? body.refs : []).filter(okRef).slice(0, 4);
    if (refs.length && !model.vision) return fail("الموديل ده ما بياخدش صور مرجعية. شيل الصور أو اختار موديل تاني.", 400);
    for (let k = 0; k < n; k++) if (tooManyImages(ip)) return fail("وصلت لحد الصور الساعة دي. جرّب بعد شوية.", 429);
    if (tooManyGlobal("all")) return fail("الاستوديو عليه ضغط كبير دلوقتي. جرّب بعد شوية.", 429);
    const seed = Number.isInteger(body.seed) && body.seed >= 0 ? body.seed : null;
    const opts = {
      prompt, n, refs, seed,
      aspect: pick(body.aspect, ASPECTS, "auto"),
      resolution: pick(body.resolution, RESOLUTIONS, "1K"),
      quality: pick(body.quality, QUALITIES, "auto"),
      format: pick(body.format, FORMATS, "auto"),
      background: pick(body.background, BACKGROUNDS, "auto"),
    };

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      async start(c) {
        const send = (o) => c.enqueue(enc.encode(JSON.stringify(o) + "\n"));
        // نبض كل 10 ثواني عشان الاتصال ما يتقفلش وإحنا مستنيين الموديل
        const ping = setInterval(() => { try { send({ type: "ping" }); } catch {} }, 10_000);
        try {
          const r = await generateImages(model, opts, req.signal);
          if (r.error) {
            console.error("or-media image", model.id, r.error.status, r.error.msg);
            send({ type: "error", error: r.error.status ? arabicError(r.error) : "الموديل ما رجّعش صورة. جرّب توضّح الوصف أو موديل تاني.", text: r.text || "" });
          } else {
            for (const im of r.images) send({ type: "image", media: im.media, b64: im.b64 });
            send({ type: "done", cost: r.cost, text: r.text || "" });
          }
        } catch (e) {
          if (e?.name !== "AbortError") send({ type: "error", error: "حصلت مشكلة وإحنا بنولّد. جرّب تاني." });
        } finally {
          clearInterval(ping);
          c.close();
        }
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" } });
  }

  // صوت: TTS أو موديل بيرد بصوت
  const text = typeof body.text === "string" ? body.text.trim().slice(0, 4000) : "";
  if (!text) return fail("اكتب النص الأول.", 400);
  if (tooManyAudio(ip)) return fail("وصلت لحد الصوت الساعة دي. جرّب بعد شوية.", 429);
  if (tooManyGlobal("all")) return fail("الاستوديو عليه ضغط كبير دلوقتي. جرّب بعد شوية.", 429);
  const voice = typeof body.voice === "string" ? body.voice.trim().slice(0, 60) : "";
  const instructions = typeof body.instructions === "string" ? body.instructions.trim().slice(0, 500) : "";
  const speed = Math.min(2, Math.max(0.5, Number(body.speed) || 1));

  const r = model.kind === "speech"
    ? await speech(model, { text, voice, instructions, speed }, req.signal)
    : await audioReply(model, { text, voice }, req.signal);
  if (r.error) {
    console.error("or-media audio", model.id, r.error.status, r.error.msg);
    const msg = r.error.status ? arabicError(r.error) : "الموديل ما رجّعش صوت. جرّب صوت (voice) تاني أو نص أقصر.";
    return Response.json({ error: msg, transcript: r.transcript || "" }, { status: r.error.status === 402 ? 402 : 502 });
  }
  const extra = r.transcript ? { "x-transcript": encodeURIComponent(r.transcript.slice(0, 1500)) } : {};
  return streamBytes(r.bytes, r.type, extra);
}
