// الموديلات المجانية بالكامل عند OpenRouter (سعر الدخول والخروج صفر).
// مفيش أي موديل مدفوع بيعدي من هنا، فمفيش أي استهلاك من رصيد الشحن.
const SIX_HOURS = 6 * 3600;

const zero = (v) => v !== undefined && v !== null && Number(v) === 0;

export async function freeModels() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", { next: { revalidate: SIX_HOURS } });
    if (!res.ok) return [];
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    return list
      .filter((m) => {
        if (!m?.id || !String(m.id).endsWith(":free")) return false;
        if (!zero(m.pricing?.prompt) || !zero(m.pricing?.completion)) return false;
        const out = m.architecture?.output_modalities;
        if (Array.isArray(out) && !(out.length === 1 && out[0] === "text")) return false;
        return true;
      })
      .map((m) => {
        const [maker] = String(m.id).split("/");
        const name = String(m.name || m.id).replace(/\s*\(free\)\s*$/i, "").replace(/^[^:]{1,40}:\s*/, "").trim();
        return {
          id: m.id,
          name,
          maker: String(m.name || "").includes(":") ? String(m.name).split(":")[0].trim() : maker,
          context: m.context_length || 0,
          vision: Array.isArray(m.architecture?.input_modalities) && m.architecture.input_modalities.includes("image"),
          created: m.created || 0,
        };
      })
      .sort((a, b) => (b.created || 0) - (a.created || 0));
  } catch {
    return [];
  }
}

export async function isFreeModel(id) {
  if (typeof id !== "string" || !id.endsWith(":free")) return null;
  const list = await freeModels();
  return list.find((m) => m.id === id) || null;
}
