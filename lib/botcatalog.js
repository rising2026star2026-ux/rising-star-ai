// بيعرف أنهي موديلات متاحة فعلاً دلوقتي (على السيرفر بس).
// بيسأل OpenRouter وGroq عن قايمتهم، والنتيجة بتتحفظ 6 ساعات عشان الصفحة تفضل سريعة.
import { BOTS, getBot } from "@/lib/bots";

const SIX_HOURS = 6 * 3600;

async function openRouterModels() {
  try {
    // قايمة الموديلات عند OpenRouter عامة ومش محتاجة مفتاح
    const res = await fetch("https://openrouter.ai/api/v1/models", { next: { revalidate: SIX_HOURS } });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.data) ? data.data : null;
  } catch {
    return null;
  }
}

export async function groqModels() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      next: { revalidate: SIX_HOURS },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.data) ? new Set(data.data.map((m) => m.id)) : null;
  } catch {
    return null;
  }
}

// "Anthropic: Claude Opus 5.5" → "Claude Opus 5.5"
const cleanName = (n = "") => String(n).replace(/^[^:]{1,40}:\s*/, "").replace(/\s*\(.*\)\s*$/, "").trim();

// الموديلات العالمية مفتوحة للكل بدون كود. للقفل من جديد: PRO_OPEN=0 في Vercel
export const proOpen = () => process.env.PRO_OPEN !== "0";

/** كود الاشتراك صالح؟ الأكواد في PRO_CODES مفصولة بفاصلة */
export function validProCode(code) {
  if (proOpen()) return true;
  const list = String(process.env.PRO_CODES || "")
    .split(",")
    .map((c) => c.trim())
    .filter((c) => c.length >= 4);
  return !!code && list.includes(String(code).trim());
}

/**
 * كل الموديلات ومعاها: id الفعلي، الاسم الحالي، ومتاح ولا لأ.
 * available=false معناه إن الموديل مش موجود دلوقتي أو مفتاح المزود مش متضاف.
 */
export async function resolveBots() {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY;
  const [orList, groqSet] = await Promise.all([hasOpenRouter ? openRouterModels() : null, groqModels()]);

  const hasGemini = !!process.env.GEMINI_API_KEY;
  return BOTS.map((b) => {
    // المساعدين والبحث شغالين على سلسلة الموقع الأساسية، فدايماً متاحين
    if (b.provider === "site") return { ...b, available: true };
    // Gemini مباشر بمفتاح الموقع
    if (b.provider === "gemini") return { ...b, available: hasGemini };
    if (b.provider === "groq") {
      const available = groqSet ? groqSet.has(b.id) : true;
      return { ...b, available };
    }
    if (!hasOpenRouter) return { ...b, id: b.fallbackId || null, available: false, reason: "soon" };
    if (!orList) return { ...b, id: b.fallbackId || null, available: !!b.fallbackId };

    const re = new RegExp(b.match);
    const found = orList
      .filter((m) => re.test(m.id))
      .sort((x, y) => (y.created || 0) - (x.created || 0))[0];
    if (!found) return { ...b, id: null, available: false };
    const live = cleanName(found.name);
    // اسم البحث بيفضل زي ما هو («Claude Sonnet + بحث»)، والباقي بياخد الاسم الحالي
    const name = b.web ? b.name.replace(/^[^+]+/, `${live} `) : live || b.name;
    return { ...b, id: found.id, name, available: true };
  });
}

/** موديل واحد جاهز للاستخدام في الشات، أو null */
export async function resolveBot(key) {
  const b = getBot(key);
  if (!b) return null;
  const all = await resolveBots();
  return all.find((x) => x.key === key) || null;
}

// ألوان كارت الموديل لو مالوش ألوان خاصة: من ألوان شركته
const MAKER_COLORS = {
  OpenAI: ["#3a3f4a", "#121418"], Anthropic: ["#e08a5f", "#9c4325"], Google: ["#5b8cf0", "#4a2bb0"], xAI: ["#4b4b52", "#0b0b0c"],
  "Moonshot AI": ["#4a4fb8", "#1a1d3a"], DeepSeek: ["#4d7cf5", "#1e3fa8"], Alibaba: ["#9b6bff", "#5b2bd0"], Mistral: ["#f7a531", "#d9480f"],
  "Z.ai": ["#22b5c9", "#0c5a6e"], Meta: ["#5aa0ff", "#0b57d0"], MiniMax: ["#ff6f9e", "#c2185b"], Perplexity: ["#20a6a6", "#0d4a4a"],
};
const makerColors = (m) => MAKER_COLORS[m] || ["#4a5266", "#151821"];

/** اللي بيتبعت للمتصفح بس (من غير تفاصيل داخلية) */
export function publicBot(b) {
  return {
    key: b.key, name: b.name, maker: b.maker, section: b.section, tier: b.tier,
    desc: b.desc, mono: b.mono, logo: b.logo || null, glyph: b.glyph || null, tint: b.tint || null, colors: b.colors || makerColors(b.maker),
    available: b.available, reason: b.reason || null,
  };
}
