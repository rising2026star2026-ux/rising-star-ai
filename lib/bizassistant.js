// مساعد الأعمال الموحد: مساعد واحد بأوضاع عمل تجارية مختلفة (مش شات منفصل لكل وظيفة).
// الأوضاع بتغيّر التعليمات وأسئلة البداية وأدوات المنصة المقترحة. الأرقام اللي بتدخل الشات بتتحسب بالكود هنا، مش بالنموذج.
import { cleanBrand, brandBlock } from "./brandprofile.js";
import { compareAll, METRICS, fmt } from "./bizcompare.js";
import { runAll, sensitivity, factsText, TYPES } from "./feasibility.js";

export const MODES = [
  { id: "advisor", label: "استشارة تجارية", ask: "اشرح موقفك التجاري واسأل", brief: "استشارة تجارية عامة لصاحب النشاط: وضّح الخيارات والمخاطر وإيه اللازم يتأكد منه قبل القرار.",
    starters: ["عندي ٢٠٠ ألف، أبدأ بإيه؟", "إزاي أعرف إن فكرتي تنجح؟", "إيه أهم أخطاء بداية المحلات؟"], tools: [["/compare-business", "قارن الأنشطة"], ["/feasibility", "دراسة جدوى"]] },
  { id: "feasibility", label: "دراسة الجدوى", ask: "اسأل عن مشروعك", brief: "ساعد في فهم دراسة الجدوى: الافتراضات، التعادل، الاسترداد، الحساسية، والمخاطر. استخدم أرقام الدراسة المرفقة لو موجودة كما هي.",
    starters: ["فسّر لي نتيجة دراستي", "إيه أخطر افتراض في دراستي؟", "إزاي أقلّل رأس المال المطلوب؟"], tools: [["/feasibility", "افتح دراسة الجدوى"]] },
  { id: "competitors", label: "تحليل المنافسين", ask: "اسأل عن منافسيك", brief: "ساعد في تحليل المنافسين والسوق: أسئلة تجمع بيها بيانات حقيقية، ونقاط تميّز. ممنوع تخترع أسماء منافسين أو أسعارهم.",
    starters: ["إزاي أحلل منافسيني بسرعة؟", "إيه أسئلة أسألها لعملائي عن المنافسين؟", "إزاي أتميّز عن المحلات اللي حواليا؟"], tools: [["/market-check", "افحص السوق"], ["/survey", "استبيان العملاء"]] },
  { id: "marketing", label: "التسويق والإعلانات", ask: "اسأل عن تسويقك", brief: "ساعد في التسويق والإعلانات: رسالة، جمهور، عروض، وتجربة صغيرة قبل الصرف. من غير وعود بنتايج.",
    starters: ["اكتبلي إعلان لمنتج عندي", "خطة تسويق أسبوع بميزانية صغيرة", "إزاي أعرف إعلاني نافع قبل ما أدفع؟"], tools: [["/test-ad", "اختبر إعلانك"], ["/photo-ad", "إعلان من صورة"]] },
  { id: "pricing", label: "التسعير والأرباح", ask: "اسأل عن أسعارك", brief: "ساعد في تسعير المنتجات وحساب الربح: تكلفة الوحدة، الهامش، التعادل. اطلب أرقام المستخدم ولا تفترض أرقام من عندك.",
    starters: ["إزاي أسعّر منتج جديد؟", "هامش الربح المناسب لنشاطي إيه؟", "هل أخفّض سعري ولا أزوّد عروض؟"], tools: [["/amazon/profit", "حاسبة الربح"], ["/compare-business", "قارن الأنشطة"]] },
  { id: "sales", label: "المبيعات وخدمة العملاء", ask: "اسأل عن مبيعاتك", brief: "ساعد في المبيعات وخدمة العملاء: ردود جاهزة، التعامل مع الاعتراضات، ومتابعة العملاء.",
    starters: ["إزاي أرد على عميل بيقول غالي؟", "رد على شكوى عميل", "رسالة متابعة لعميل سأل ومشترّاش"], tools: [["/tools?cat=sales", "أدوات الردود"]] },
  { id: "content", label: "المحتوى التجاري", ask: "اسأل عن محتواك", brief: "ساعد في المحتوى التجاري: منشورات، أوصاف منتجات، سكربتات قصيرة، وتقويم محتوى على مقاس النشاط.",
    starters: ["٥ أفكار منشورات لمحلي", "اكتبلي وصف منتج", "تقويم محتوى لأسبوع"], tools: [["/tools?cat=content", "أدوات المحتوى"], ["/voice-post", "منشورات من تسجيل صوتي"]] },
  { id: "growth", label: "تطوير نشاط قائم", ask: "اسأل عن تطوير نشاطك", brief: "ساعد في تطوير نشاط قائم: اكتشاف نقاط الضعف، زيادة المبيعات، تقليل المصاريف، وخطوات تجربة صغيرة.",
    starters: ["مبيعاتي واقفة، أعمل إيه؟", "إزاي أزوّد متوسط الفاتورة؟", "هل أفتح فرع تاني؟"], tools: [["/compare-business", "قارن الفرص"], ["/feasibility", "دراسة جدوى للتوسع"]] },
];
export const MODE_BY_ID = Object.fromEntries(MODES.map((m) => [m.id, m]));
export const DEFAULT_MODE = "advisor";

const N = (v, max = 1e12) => { const x = Number(v); return Number.isFinite(x) ? Math.min(max, Math.max(0, x)) : 0; };
const S = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").trim().slice(0, max);

/** مقارنة محفوظة: بتتنضّف وبتتحسب بالكود، والنتيجة نص أرقام جاهز */
export function compareFacts(raw) {
  if (!Array.isArray(raw)) return "";
  const list = raw.slice(0, 5).map((b, i) => ({
    id: `x${i}`, name: S(b?.name, 60), capital: N(b?.capital), setup: N(b?.setup), fixed: N(b?.fixed), price: N(b?.price), unitCost: N(b?.unitCost), units: N(b?.units), tax: N(b?.tax, 100),
    demand: N(b?.demand, 5), competition: N(b?.competition, 5), risk: N(b?.risk, 5), ease: N(b?.ease, 5), scale: N(b?.scale, 5),
  }));
  if (list.length < 2) return "";
  const { rows, best } = compareAll(list);
  const lines = METRICS.map((m) => `- ${m.label}: ${rows.map((r) => `${r.name} = ${fmt[m.fmt](r[m.key])}`).join(" | ")}${best[m.key] >= 0 ? ` (الأفضل: ${rows[best[m.key]].name})` : ""}`);
  return `مقارنة أنشطة المستخدم (أرقام افتراضات المستخدم، والحساب بالكود):\n${lines.join("\n")}`;
}

/** آخر دراسة جدوى للمستخدم: بتتحسب من جديد بالكود، ونص الأرقام جاهز */
export function studyFacts(raw) {
  try {
    const f = raw?.form, a0 = raw?.a;
    if (!f || !a0) return "";
    const items = (xs) => (Array.isArray(xs) ? xs.slice(0, 12).map((x) => ({ name: S(x?.name, 60), low: N(x?.low), mid: N(x?.mid), high: N(x?.high) })) : []);
    const rg = (x) => ({ low: N(x?.low), mid: N(x?.mid), high: N(x?.high) });
    const a = { capex: items(a0.capex), fixed: items(a0.fixed), price: rg(a0.price), unitCost: rg(a0.unitCost), units: rg(a0.units),
      rampStart: N(a0.rampStart, 1), rampMonths: N(a0.rampMonths, 36), workingCapitalMonths: N(a0.workingCapitalMonths, 12), taxPct: N(a0.taxPct, 100), inflation: N(a0.inflation, 100), discountRate: N(a0.discountRate, 200) };
    const type = TYPES[f.type] ? f.type : "shop";
    const form = { type, activity: S(f.activity, 120), governorate: S(f.governorate, 40), city: S(f.city, 60), area: S(f.area, 80), capital: N(f.capital) || "" };
    if (!form.activity) return "";
    const res = runAll(a);
    return `آخر دراسة جدوى للمستخدم (الأرقام محسوبة بالكود، استخدمها كما هي):\n${factsText(a, res, sensitivity(a), form)}`;
  } catch { return ""; }
}

/** كل إضافات تعليمات المساعد: الوضع + ملف النشاط + أرقام محسوبة */
export function assistantContext(body) {
  const mode = MODE_BY_ID[body?.mode] || MODE_BY_ID[DEFAULT_MODE];
  const parts = [`وضع العمل الحالي: ${mode.label}. ${mode.brief}`];
  const brand = brandBlock(cleanBrand(body?.brand));
  if (brand) parts.push(brand);
  const cmp = compareFacts(body?.compare);
  if (cmp) parts.push(cmp);
  const study = studyFacts(body?.study);
  if (study) parts.push(study);
  if (cmp || study) parts.push("الأرقام فوق محسوبة بالكود من مدخلات المستخدم. اشرحها وفسّرها، ولا تغيّرها ولا تحسب أرقام جديدة من عندك ولا تضيف أرقام سوق مش مكتوبة.");
  return parts.join("\n\n");
}
