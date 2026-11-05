// كل موديلات OpenRouter اللي الموقع بيفتحها (على السيرفر بس):
//   text   → موديلات الشات (نص)
//   image  → توليد وتعديل الصور
//   speech → تحويل النص لصوت (TTS)
//   audio  → موديلات بترد بصوت (محادثة صوتية / موسيقى)
// موديلات الفيديو مستبعدة بالكامل، وكمان أي موديل مخرجاته مش واحد من دول (embeddings وغيرها).
// المدفوع بيتحاسب من رصيد OpenRouter. OR_MAX_PRICE_PER_M (اختياري) بيشيل موديلات الشات الأغلى منه.
const SIX_HOURS = 6 * 3600;
const BASE = "https://openrouter.ai/api/v1/models";

const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

async function getList(url) {
  try {
    const res = await fetch(url, { next: { revalidate: SIX_HOURS } });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : [];
  } catch {
    return [];
  }
}

/** نوع الموديل من مخرجاته، أو null لو مستبعد */
export function kindOf(m) {
  const out = Array.isArray(m?.architecture?.output_modalities) ? m.architecture.output_modalities : ["text"];
  if (out.includes("video")) return null;
  if (out.includes("image")) return "image";
  if (out.includes("speech")) return "speech";
  if (out.includes("audio")) return "audio";
  if (out.length === 1 && out[0] === "text") return "text";
  return null;
}

function shape(m, kind) {
  const p = m.pricing || {};
  const values = Object.values(p).map(num).filter((v) => v !== null);
  const free = values.length > 0 && values.every((v) => v === 0);
  const clean = String(m.name || m.id).replace(/\s*\(free\)\s*$/i, "");
  const colon = clean.indexOf(":");
  const hasMaker = colon > 0 && colon < 40;
  const inputs = Array.isArray(m.architecture?.input_modalities) ? m.architecture.input_modalities : ["text"];
  const outs = Array.isArray(m.architecture?.output_modalities) ? m.architecture.output_modalities : ["text"];
  const c = num(p.completion);
  return {
    id: m.id,
    kind,
    name: hasMaker ? clean.slice(colon + 1).trim() : clean,
    maker: hasMaker ? clean.slice(0, colon).trim() : String(m.id).split("/")[0],
    context: m.context_length || 0,
    vision: inputs.includes("image"),
    inputs,
    textOut: outs.includes("text"),
    free,
    // سعر الخروج لكل مليون توكن (لموديلات الشات بس، الصور والصوت تسعيرها مختلف)
    out: kind === "text" && !free && c !== null ? Math.round(c * 1e6 * 100) / 100 : 0,
    params: Array.isArray(m.supported_parameters) ? m.supported_parameters.slice(0, 40) : [],
    created: m.created || 0,
  };
}

export async function allModels() {
  // القايمة الافتراضية فيها موديلات النص، وموديلات الصور والصوت بنطلبها بالفلتر عشان ما تفوتش
  const lists = await Promise.all([
    getList(BASE),
    getList(`${BASE}?output_modalities=image`),
    getList(`${BASE}?output_modalities=speech`),
    getList(`${BASE}?output_modalities=audio`),
  ]);
  const cap = num(process.env.OR_MAX_PRICE_PER_M);
  const seen = new Map();
  for (const list of lists) {
    for (const m of list) {
      if (!m?.id || seen.has(m.id)) continue;
      const kind = kindOf(m);
      if (!kind) continue;
      const p = m.pricing || {};
      // أسعار متغيرة (الراوترات الأوتوماتيك): مفيش سعر ثابت، فبنسيبها
      if (Object.values(p).some((v) => num(v) !== null && num(v) < 0)) continue;
      if (kind === "text") {
        const c = num(p.completion);
        if (num(p.prompt) === null || c === null) continue;
        if (cap !== null && cap > 0 && c * 1e6 > cap) continue;
      }
      seen.set(m.id, shape(m, kind));
    }
  }
  return [...seen.values()].sort((a, b) => (b.created || 0) - (a.created || 0));
}

export async function findModel(id) {
  if (typeof id !== "string" || !id || id.length > 120) return null;
  const list = await allModels();
  return list.find((m) => m.id === id) || null;
}
