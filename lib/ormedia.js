// توليد الصور والصوت من موديلات OpenRouter (على السيرفر بس).
// الصور: بنجرب واجهة الصور المخصصة (/images) الأول، ولو الموديل مش مدعوم فيها بنستخدم الشات بـ modalities.
// الصوت: موديلات TTS على /audio/speech، والموديلات اللي بترد بصوت على الشات (لازم stream).
const API = "https://openrouter.ai/api/v1";

const headers = () => ({
  Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
  "Content-Type": "application/json",
  "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "https://rising-star-ai.vercel.app",
  "X-Title": "Rising StarAi",
});

export const ASPECTS = ["auto", "1:1", "16:9", "9:16", "4:3", "3:4", "3:2", "2:3", "4:5", "5:4", "21:9", "9:21", "2:1", "1:2"];
export const RESOLUTIONS = ["1K", "2K", "4K"];
export const QUALITIES = ["auto", "low", "medium", "high"];
export const FORMATS = ["auto", "png", "jpeg", "webp", "svg"];
export const BACKGROUNDS = ["auto", "transparent", "opaque"];

/** رسالة خطأ مفهومة من رد OpenRouter */
async function errorOf(res) {
  let msg = "";
  try {
    const j = await res.json();
    msg = j?.error?.message || j?.message || "";
  } catch {}
  return { status: res.status, msg: String(msg).slice(0, 300) };
}

export function arabicError(e) {
  const s = e?.status || 0;
  if (s === 402) return "رصيد OpenRouter خلص أو مش كفاية للطلب ده.";
  if (s === 429) return "الموديل عليه ضغط دلوقتي. جرّب بعد دقيقة.";
  if (s === 401 || s === 403) return "الموديل ده مش متاح للمفتاح الحالي.";
  if (s === 408 || s === 504) return "الموديل اتأخر في الرد. جرّب تاني أو قلّل الدقة.";
  if (s === 400 || s === 422) return "الموديل رفض الإعدادات دي. جرّب تغيّر المقاس أو الدقة أو الصيغة.";
  return "الموديل ما ردّش دلوقتي. جرّب تاني بعد شوية.";
}

const dataUrlParts = (u) => {
  const m = /^data:([^;,]+);base64,(.+)$/s.exec(String(u || ""));
  return m ? { media: m[1], b64: m[2] } : null;
};

/** الصور من واجهة /images */
async function viaImagesApi(model, o, signal) {
  const body = { model: model.id, prompt: o.prompt, n: o.n };
  if (o.aspect && o.aspect !== "auto") body.aspect_ratio = o.aspect;
  if (o.resolution) body.resolution = o.resolution;
  if (o.quality && o.quality !== "auto") body.quality = o.quality;
  if (o.format && o.format !== "auto") body.output_format = o.format;
  if (o.background && o.background !== "auto") body.background = o.background;
  if (Number.isInteger(o.seed)) body.seed = o.seed;
  if (o.refs.length) body.input_references = o.refs.map((url) => ({ type: "image_url", image_url: { url } }));
  const res = await fetch(`${API}/images`, { method: "POST", headers: headers(), body: JSON.stringify(body), signal });
  if (!res.ok) return { error: await errorOf(res) };
  const j = await res.json();
  const images = (Array.isArray(j?.data) ? j.data : [])
    .map((d) => (d?.b64_json ? { media: d.media_type || "image/png", b64: d.b64_json } : dataUrlParts(d?.url)))
    .filter(Boolean);
  return { images, cost: j?.usage?.cost ?? null, text: "" };
}

/** الصور من الشات (modalities) — لموديلات زي Gemini اللي بترد بنص وصورة */
async function viaChatOnce(model, o, signal) {
  const content = o.refs.length
    ? [{ type: "text", text: o.prompt }, ...o.refs.map((url) => ({ type: "image_url", image_url: { url } }))]
    : o.prompt;
  const body = {
    model: model.id,
    messages: [{ role: "user", content }],
    modalities: model.textOut ? ["image", "text"] : ["image"],
    stream: false,
  };
  const cfg = {};
  if (o.aspect && o.aspect !== "auto") cfg.aspect_ratio = o.aspect;
  if (o.resolution) cfg.image_size = o.resolution;
  if (Object.keys(cfg).length) body.image_config = cfg;
  if (Number.isInteger(o.seed)) body.seed = o.seed;
  const res = await fetch(`${API}/chat/completions`, { method: "POST", headers: headers(), body: JSON.stringify(body), signal });
  if (!res.ok) return { error: await errorOf(res) };
  const j = await res.json();
  const msg = j?.choices?.[0]?.message || {};
  const images = (Array.isArray(msg.images) ? msg.images : [])
    .map((im) => dataUrlParts(im?.image_url?.url || im?.url))
    .filter(Boolean);
  const text = typeof msg.content === "string" ? msg.content.slice(0, 2000) : "";
  return { images, cost: j?.usage?.cost ?? null, text };
}

async function viaChat(model, o, signal) {
  // الشات بيرجع صورة واحدة في الطلب غالباً، فلعدد أكبر بنبعت طلبات متوازية
  const runs = await Promise.all(Array.from({ length: o.n }, () => viaChatOnce(model, o, signal)));
  const ok = runs.filter((r) => !r.error);
  if (!ok.length) return { error: runs[0]?.error || { status: 0, msg: "" } };
  return {
    images: ok.flatMap((r) => r.images),
    cost: ok.some((r) => r.cost !== null) ? ok.reduce((a, r) => a + (Number(r.cost) || 0), 0) : null,
    text: ok.map((r) => r.text).filter(Boolean).join("\n\n"),
  };
}

export async function generateImages(model, o, signal) {
  const first = await viaImagesApi(model, o, signal);
  if (!first.error && first.images.length) return first;
  // الرصيد أو الضغط: مفيش فايدة نجرب طريقة تانية
  if (first.error && [402, 429, 401, 403].includes(first.error.status)) return first;
  const second = await viaChat(model, o, signal);
  if (!second.error && second.images.length) return second;
  if (!second.error && !second.images.length) return { error: { status: 0, msg: second.text || "no image" }, text: second.text };
  return { error: second.error || first.error };
}

/** PCM 16-bit mono → WAV عشان المتصفح يشغّله */
export function pcmToWav(pcm, rate = 24000) {
  const len = pcm.length;
  const out = new Uint8Array(44 + len);
  const v = new DataView(out.buffer);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
  w(0, "RIFF"); v.setUint32(4, 36 + len, true); w(8, "WAVE");
  w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, len, true);
  out.set(pcm, 44);
  return out;
}

/** تحويل نص لصوت (TTS). بيرجع { bytes, type } أو { error } */
export async function speech(model, o, signal) {
  const call = async (format) => {
    const body = { model: model.id, input: o.text, response_format: format };
    if (o.voice) body.voice = o.voice;
    if (o.instructions) body.instructions = o.instructions;
    if (o.speed && o.speed !== 1) body.speed = o.speed;
    return fetch(`${API}/audio/speech`, { method: "POST", headers: headers(), body: JSON.stringify(body), signal });
  };
  let res = await call("mp3");
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    // بعض الموديلات (Gemini وHeyGen) بترجع PCM بس
    const pcmRes = await call("pcm");
    if (pcmRes.ok) {
      const pcm = new Uint8Array(await pcmRes.arrayBuffer());
      return { bytes: pcmToWav(pcm), type: "audio/wav" };
    }
    return { error: await errorOf(pcmRes) };
  }
  if (!res.ok) return { error: await errorOf(res) };
  const type = res.headers.get("content-type") || "audio/mpeg";
  const bytes = new Uint8Array(await res.arrayBuffer());
  if (type.includes("pcm")) return { bytes: pcmToWav(bytes), type: "audio/wav" };
  return { bytes, type: type.split(";")[0] };
}

const b64ToBytes = (b64) => Uint8Array.from(Buffer.from(b64, "base64"));

/** موديل بيرد بصوت على الشات (لازم stream). بيرجع { bytes, type, transcript } أو { error } */
export async function audioReply(model, o, signal) {
  const call = (format) =>
    fetch(`${API}/chat/completions`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        model: model.id,
        messages: [{ role: "user", content: o.text }],
        modalities: ["text", "audio"],
        audio: { voice: o.voice || "alloy", format },
        stream: true,
      }),
      signal,
    });
  let format = "pcm16";
  let res = await call(format);
  if (!res.ok && (res.status === 400 || res.status === 422)) {
    format = "mp3";
    res = await call(format);
  }
  if (!res.ok) return { error: await errorOf(res) };

  const chunks = [];
  let transcript = "";
  let text = "";
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      const data = line.slice(5).trim();
      if (data === "[DONE]") continue;
      try {
        const j = JSON.parse(data);
        const d = j?.choices?.[0]?.delta || {};
        if (d.audio?.data) chunks.push(b64ToBytes(d.audio.data));
        if (d.audio?.transcript) transcript += d.audio.transcript;
        if (typeof d.content === "string") text += d.content;
      } catch {}
    }
  }
  const total = chunks.reduce((a, c) => a + c.length, 0);
  if (!total) return { error: { status: 0, msg: "no audio" }, transcript: transcript || text };
  const all = new Uint8Array(total);
  let off = 0;
  for (const c of chunks) { all.set(c, off); off += c.length; }
  if (format === "pcm16") return { bytes: pcmToWav(all), type: "audio/wav", transcript: transcript || text };
  return { bytes: all, type: "audio/mpeg", transcript: transcript || text };
}
