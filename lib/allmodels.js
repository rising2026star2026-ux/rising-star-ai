// كل موديلات OpenRouter النصية (المجاني والمدفوع) ما عدا الفيديو وتوليد الصور.
// المدفوع بيتحاسب من رصيد OpenRouter، فبنحميه بحد سعر اختياري (OR_MAX_PRICE_PER_M دولار لكل مليون توكن خروج).
const SIX_HOURS = 6 * 3600;

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export async function allModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { next: { revalidate: SIX_HOURS } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    const cap = num(process.env.OR_MAX_PRICE_PER_M);
    return list
      .filter((m) => {
        if (!m?.id) return false;
        const out = m.architecture?.output_modalities;
        // نص بس: من غير فيديو ولا توليد صور/صوت
        if (Array.isArray(out) ? !(out.length === 1 && out[0] === "text") : false) return false;
        const p = num(m.pricing?.prompt), c = num(m.pricing?.completion);
        if (p === null || c === null || p < 0 || c < 0) return false; // أسعار متغيرة (راوترات): بنسيبها
        if (cap !== null && cap > 0 && c * 1e6 > cap) return false;
        return true;
      })
      .map((m) => {
        const free = num(m.pricing.prompt) === 0 && num(m.pricing.completion) === 0;
        const clean = String(m.name || m.id).replace(/\s*\(free\)\s*$/i, "");
        const colon = clean.indexOf(":");
        return {
          id: m.id,
          name: colon > 0 && colon < 40 ? clean.slice(colon + 1).trim() : clean,
          maker: colon > 0 && colon < 40 ? clean.slice(0, colon).trim() : String(m.id).split("/")[0],
          context: m.context_length || 0,
          vision: Array.isArray(m.architecture?.input_modalities) && m.architecture.input_modalities.includes("image"),
          free,
          out: free ? 0 : Math.round(num(m.pricing.completion) * 1e6 * 100) / 100,
          created: m.created || 0,
        };
      })
      .sort((a, b) => (b.created || 0) - (a.created || 0));
  } catch {
    return [];
  }
}

export async function findModel(id) {
  if (typeof id !== "string" || !id) return null;
  const list = await allModels();
  return list.find((m) => m.id === id) || null;
}
