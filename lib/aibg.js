"use client";
// خلفية تصوير بالذكاء الاصطناعي (فاضية من غير منتج) عشان المنتج الحقيقي يتحط عليها.
// الرسم على Hugging Face بحصة الزائر نفسه، ولو مشغول بنروح لمولّد السيرفر الاحتياطي (/api/image).
import { callSpace, fileUrl, withTimeout } from "@/lib/hfspace";

const FLUX = "https://black-forest-labs-flux-1-schnell.hf.space";
const SUFFIX = ", empty scene, nothing in the center, no product, no objects in focus, no text, no people, professional product photography backdrop, soft natural light, shallow depth of field, high quality";

export async function aiBackground(scene, { portrait = false, signal } = {}) {
  const prompt = `${scene}${SUFFIX}`.slice(0, 1100);
  const [w, h] = portrait ? [768, 1024] : [1024, 1024];
  const t = withTimeout(90_000, signal);
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
  const r = await fetch("/api/image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, size: portrait ? "768x1024" : "1024x1024" }),
    signal,
  });
  if (!r.ok) {
    const j = await r.json().catch(() => ({}));
    throw new Error(j.error || "مولّد الخلفيات مشغول دلوقتي. جرّب بعد دقيقة.");
  }
  return await r.blob();
}
