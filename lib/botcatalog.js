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

export const proOpen = () => process.env.PRO_OPEN === "1";

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

  return BOTS.map((b) => {
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

/** اللي بيتبعت للمتصفح بس (من غير تفاصيل داخلية) */
export function publicBot(b) {
  return {
    key: b.key, name: b.name, maker: b.maker, section: b.section, tier: b.tier,
    desc: b.desc, mono: b.mono, logo: b.logo || null, glyph: b.glyph || null, tint: b.tint || null,
    available: b.available, reason: b.reason || null,
  };
}
