// توليد صورة من وصف عربي من متصفح الزائر: الرسم على Hugging Face بحصة الزائر نفسه (من غير تكلفة علينا)،
// ولو خلصت الحصة أو الموديل مشغول بنحوّل لمولّد السيرفر الاحتياطي.
import { callSpace, fileUrl, withTimeout } from "@/lib/hfspace";

const FLUX = "https://black-forest-labs-flux-1-schnell.hf.space";
const DIMS = { "1024x1024": [1024, 1024], "768x1024": [768, 1024], "1024x768": [1024, 768] };

export async function genImageBlob(idea, { size = "1024x1024", signal } = {}) {
  const res = await fetch("/api/prompt-en", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: idea, kind: "image" }), signal });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "حصل خطأ، جرّب تاني.");
  const prompt = data.prompt;

  const [w, h] = DIMS[size] || DIMS["1024x1024"];
  const t = withTimeout(120_000, signal);
  try {
    const { out, base } = await callSpace(FLUX, "infer", [prompt, 0, true, w, h, 4], { signal: t.signal });
    const url = fileUrl(out?.[0], base);
    if (url) {
      const r = await fetch(url, { signal: t.signal });
      if (r.ok) return await r.blob();
    }
  } catch (e) {
    if (signal?.aborted) throw e;
  } finally {
    t.done();
  }

  const r = await fetch("/api/image", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt, size }), signal });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || "المولّد مشغول دلوقتي. جرّب بعد دقيقة.");
  }
  return await r.blob();
}
