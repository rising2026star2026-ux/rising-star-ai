// محرك مقارنة الأنشطة التجارية: كل الأرقام بتتحسب هنا بمعادلات ثابتة من أرقام العميل.
// مفيش أي رقم سوق أو سعر منافس بيتخترع: المدخلات كلها افتراضات العميل، والتقييمات (1 إلى 5) تقديره الشخصي.

export const MAX_BIZ = 5;
export const MIN_BIZ = 2;
export const WORKING_CAPITAL_MONTHS = 3;

/** معايير التقييم الشخصي: القيمة من 1 لـ 5. higherBetter: الأعلى أحسن */
export const RATINGS = [
  { key: "demand", label: "حجم الطلب", higherBetter: true, hint: "1 ضعيف، 5 طلب كبير ومستمر" },
  { key: "competition", label: "مستوى المنافسة", higherBetter: false, hint: "1 منافسة خفيفة، 5 منافسة شرسة" },
  { key: "risk", label: "المخاطر", higherBetter: false, hint: "1 مخاطر قليلة، 5 مخاطر عالية" },
  { key: "ease", label: "سهولة التشغيل", higherBetter: true, hint: "1 صعب، 5 سهل" },
  { key: "scale", label: "قابلية التوسع", higherBetter: true, hint: "1 محدود، 5 سهل التوسع" },
];

export const emptyBiz = (i = 1) => ({
  id: `b${Date.now().toString(36)}${i}`,
  name: "", capital: "", setup: "", fixed: "", price: "", unitCost: "", units: "", tax: "",
  demand: 3, competition: 3, risk: 3, ease: 3, scale: 3,
});

const n = (v) => {
  const x = Number(String(v ?? "").replace(/[٬,\s]/g, ""));
  return Number.isFinite(x) && x > 0 ? x : 0;
};
const rate = (v) => Math.min(5, Math.max(1, Math.round(Number(v) || 3)));

/** حساب نشاط واحد. بيرجّع null في أي مؤشر مش قابل للحساب بدل ما يخمّن */
export function computeBiz(b) {
  const setup = n(b.setup), fixed = n(b.fixed), price = n(b.price), unitCost = n(b.unitCost), units = n(b.units);
  const taxPct = Math.min(100, n(b.tax)) / 100;
  const capital = n(b.capital);
  const invest = setup + fixed * WORKING_CAPITAL_MONTHS;
  const revenue = price * units;
  const variable = unitCost * units;
  const tax = revenue * taxPct;
  const net = revenue - variable - fixed - tax;
  const unitMargin = price * (1 - taxPct) - unitCost;
  const ready = price > 0 && units > 0;
  return {
    id: b.id, name: (b.name || "").trim() || "نشاط بدون اسم", ready,
    capital, setup, fixedMonthly: fixed, invest,
    revenue: ready ? revenue : null,
    grossMarginPct: price > 0 ? (price - unitCost) / price : null,
    net: ready ? net : null,
    expectedSales: ready ? revenue : null,
    breakEvenUnits: unitMargin > 0 ? fixed / unitMargin : null,
    breakEvenRevenue: unitMargin > 0 && price > 0 ? (fixed / unitMargin) * price : null,
    paybackMonths: ready && net > 0 && invest > 0 ? invest / net : null,
    fundingGap: capital > 0 ? Math.max(0, invest - capital) : null,
    demand: rate(b.demand), competition: rate(b.competition), risk: rate(b.risk), ease: rate(b.ease), scale: rate(b.scale),
  };
}

/** صفوف جدول المقارنة. best: رقم الأفضل في الصف (أو -1 لو مفيش مقارنة ممكنة) */
export const METRICS = [
  { key: "invest", label: "رأس المال المطلوب", fmt: "egp", higherBetter: false, note: "تكاليف التأسيس + مصاريف 3 شهور ثابتة" },
  { key: "setup", label: "تكاليف التأسيس", fmt: "egp", higherBetter: false },
  { key: "fixedMonthly", label: "المصاريف الشهرية", fmt: "egp", higherBetter: false },
  { key: "demand", label: "حجم الطلب", fmt: "score", higherBetter: true },
  { key: "competition", label: "مستوى المنافسة", fmt: "score", higherBetter: false },
  { key: "grossMarginPct", label: "هامش الربح", fmt: "pct", higherBetter: true, note: "(السعر − تكلفة الوحدة) ÷ السعر" },
  { key: "expectedSales", label: "المبيعات المتوقعة شهرياً", fmt: "egp", higherBetter: true, note: "السعر × الكمية الشهرية" },
  { key: "net", label: "صافي الربح الشهري", fmt: "egp", higherBetter: true, note: "المبيعات − تكلفة البضاعة − المصاريف − الضريبة" },
  { key: "breakEvenUnits", label: "نقطة التعادل (وحدات شهرياً)", fmt: "num", higherBetter: false, note: "المصاريف الثابتة ÷ ربح الوحدة" },
  { key: "paybackMonths", label: "فترة استرداد رأس المال", fmt: "months", higherBetter: false, note: "رأس المال ÷ صافي الربح الشهري" },
  { key: "risk", label: "المخاطر", fmt: "score", higherBetter: false },
  { key: "ease", label: "سهولة التشغيل", fmt: "score", higherBetter: true },
  { key: "scale", label: "قابلية التوسع", fmt: "score", higherBetter: true },
];

export function bestIndex(list, key, higherBetter) {
  let best = -1, bv = null;
  list.forEach((r, i) => {
    const v = r[key];
    if (v === null || v === undefined || !Number.isFinite(v)) return;
    if (bv === null || (higherBetter ? v > bv : v < bv)) { bv = v; best = i; }
  });
  // لو كل القيم متساوية مفيش أفضل
  if (best >= 0 && list.every((r) => r[key] === bv)) return -1;
  return best;
}

export function compareAll(bizList) {
  const rows = bizList.map(computeBiz);
  const best = Object.fromEntries(METRICS.map((m) => [m.key, bestIndex(rows, m.key, m.higherBetter)]));
  const wins = rows.map((_, i) => METRICS.filter((m) => best[m.key] === i).length);
  return { rows, best, wins };
}

const ar = (v, o) => Number(v).toLocaleString("ar-EG", o);
export const fmt = {
  egp: (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${ar(Math.round(v))} ج`),
  num: (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : ar(Math.ceil(v))),
  pct: (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${ar(Math.round(v * 100))}٪`),
  months: (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${ar(Math.ceil(v))} شهر`),
  score: (v) => (v === null || v === undefined ? "—" : `${ar(v)} من ٥`),
};
