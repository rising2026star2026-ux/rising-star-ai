// طلب من الموديل يرجّع JSON منظم (على السيرفر بس).
// بيجرب الموديلات بالترتيب لحد ما يرجع JSON سليم ويعدّي التحقق، فالمستخدم دايماً بياخد نتيجة مكتملة.
import { completeOnce, chainFor, visionChain } from "@/lib/groq";
import { getModel } from "@/lib/models";

/** بيطلّع أول كائن JSON من نص (حتى لو الموديل كتب كلام قبله أو بعده أو حطه في ```json) */
export function extractJson(text) {
  if (!text) return null;
  const t = String(text).replace(/```(?:json)?/gi, "").trim();
  const start = t.indexOf("{");
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < t.length; i++) {
    const c = t[i];
    if (inStr) {
      if (esc) esc = false;
      else if (c === "\\") esc = true;
      else if (c === '"') inStr = false;
      continue;
    }
    if (c === '"') inStr = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0) {
      const raw = t.slice(start, i + 1);
      try { return JSON.parse(raw); } catch {}
      // إصلاحات بسيطة: فواصل زيادة قبل الأقواس
      try { return JSON.parse(raw.replace(/,\s*([}\]])/g, "$1")); } catch { return null; }
    }
  }
  return null;
}

/**
 * @param {object} o
 * @param {Array} o.messages
 * @param {(obj:any)=>any} o.normalize  بيرجّع الكائن بعد التنظيف، أو null لو مش صالح
 * @param {string} [o.mode]  مفتاح موديل من lib/models.js
 */
export async function askJson({ messages, normalize, mode = "balanced", effort, temperature = 0.6, maxTokens = 2600, signal, tries = 4 }) {
  const m = getModel(mode);
  const chain = chainFor(effort ? { ...m, effort } : m).slice(0, tries + 3);
  let attempts = 0;
  for (const model of chain) {
    if (signal?.aborted) return null;
    const text = await completeOnce(model, { messages, temperature, maxTokens, signal });
    if (!text) continue;
    attempts++;
    const obj = extractJson(text);
    const clean = obj ? normalize(obj) : null;
    if (clean) return clean;
    if (attempts >= tries) break;
  }
  return null;
}

/** وصف صورة بكلام (للمراجعة التسويقية أو التعرّف على المنتج). بيرجّع نص أو "" لو فشل */
export async function describeImage(image, instruction, { signal } = {}) {
  const messages = [
    { role: "system", content: "أنت خبير تصوير منتجات وتسويق. رد بالعربي في نقاط قصيرة ومحددة، واعتمد على اللي ظاهر في الصورة بس. ممنوع تخمّن هوية أشخاص." },
    { role: "user", content: [{ type: "text", text: instruction }, { type: "image_url", image_url: { url: image } }] },
  ];
  for (const m of visionChain()) {
    const text = await completeOnce(m, { messages, temperature: 0.2, maxTokens: 700, signal });
    if (text) return text.slice(0, 2000);
  }
  return "";
}

export const DATA_IMAGE = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;
export const MAX_IMAGE = 3_500_000;

/** أدوات تنظيف صغيرة للمخرجات */
export const str = (v, max = 400) => String(v ?? "").replace(/\s+\n/g, "\n").trim().slice(0, max);
export const int = (v, lo, hi, d = lo) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d;
};
export const list = (v, max, fn) => (Array.isArray(v) ? v.map(fn).filter(Boolean).slice(0, max) : []);
