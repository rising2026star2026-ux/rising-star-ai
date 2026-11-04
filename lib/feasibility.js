// محرك أرقام دراسة الجدوى (الباحث التجاري)
// النموذج بيجيب الافتراضات بس (كل رقم مدى: أقل / متوقع / أعلى + مصدره)، والحسابات كلها هنا بالكود.
// بيشتغل في المتصفح والسيرفر، ومن غير أي مكتبات.

export const TYPES = {
  shop: { label: "محل تجاري", hint: "ملابس، بقالة، موبايلات، صيدلية…", unit: "فاتورة", priceLabel: "متوسط الفاتورة", costLabel: "تكلفة البضاعة في الفاتورة" },
  cafe: { label: "كافيه أو مطعم", hint: "كافيه، مطعم، عصير، حلويات…", unit: "طلب", priceLabel: "متوسط سعر الطلب", costLabel: "تكلفة خامات الطلب" },
  factory: { label: "مصنع", hint: "مصنع صغير أو ورشة إنتاج", unit: "وحدة منتج", priceLabel: "سعر بيع الوحدة", costLabel: "تكلفة خامات وتشغيل الوحدة" },
  startup: { label: "شركة ناشئة", hint: "خدمة، تطبيق، متجر أونلاين", unit: "عميل مشترك", priceLabel: "متوسط إيراد العميل في الشهر", costLabel: "تكلفة خدمة العميل في الشهر" },
  warehouse: { label: "مخزن", hint: "تخزين أو توزيع", unit: "متر مربع مؤجر", priceLabel: "إيجار المتر في الشهر", costLabel: "تكلفة تشغيل المتر في الشهر" },
};

export const GOVERNORATES = [
  "القاهرة", "الجيزة", "الإسكندرية", "القليوبية", "الشرقية", "الدقهلية", "الغربية", "المنوفية", "البحيرة", "كفر الشيخ", "دمياط", "بورسعيد",
  "الإسماعيلية", "السويس", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "مطروح",
  "الوادي الجديد", "شمال سيناء", "جنوب سيناء",
];

export const MONTHS = 36;
export const SCENARIOS = [
  { key: "pess", label: "متشائم" },
  { key: "mid", label: "متوقع" },
  { key: "opt", label: "متفائل" },
];

const num = (v) => (Number.isFinite(Number(v)) ? Math.max(0, Number(v)) : 0);

/** بند فيه مدى: بيرتّب الأرقام ويملا الناقص */
export function cleanRange(x) {
  let lo = num(x?.low), mid = num(x?.mid), hi = num(x?.high);
  if (!mid) mid = lo && hi ? (lo + hi) / 2 : lo || hi;
  if (!lo) lo = mid;
  if (!hi) hi = mid;
  const [a, b, c] = [lo, mid, hi].sort((p, q) => p - q);
  return { low: a, mid: b, high: c };
}

const pick = (r, s) => num(r?.[s] ?? r?.mid);
const costSide = (scen) => (scen === "pess" ? "high" : scen === "opt" ? "low" : "mid");
const gainSide = (scen) => (scen === "pess" ? "low" : scen === "opt" ? "high" : "mid");
const sum = (a) => a.reduce((t, x) => t + x, 0);

/**
 * الحساب لسيناريو واحد.
 * a: { capex:[{name,low,mid,high}], fixed:[…شهري], price, unitCost, units (شهري عند الاستقرار), rampStart, rampMonths,
 *      workingCapitalMonths, taxPct, inflation, discountRate }
 * over: مضاعفات لتحليل الحساسية { price, units, unitCost, fixed, capex }
 */
export function runModel(a, scen = "mid", over = {}) {
  const c = costSide(scen), g = gainSide(scen);
  const capexItems = sum((a.capex || []).map((x) => pick(x, c))) * (over.capex ?? 1);
  const fixed = sum((a.fixed || []).map((x) => pick(x, c))) * (over.fixed ?? 1);
  const price = pick(a.price, g) * (over.price ?? 1);
  const unitCost = pick(a.unitCost, c) * (over.unitCost ?? 1);
  const units = pick(a.units, g) * (over.units ?? 1);
  const wcMonths = num(a.workingCapitalMonths ?? 3);
  const workingCapital = fixed * wcMonths;
  const invest = capexItems + workingCapital;
  const taxPct = num(a.taxPct) / 100;
  const inflM = Math.pow(1 + num(a.inflation) / 100, 1 / 12);
  const rampStart = Math.min(1, Math.max(0.05, Number(a.rampStart ?? 0.4)));
  const rampMonths = Math.max(1, Math.round(num(a.rampMonths ?? 6)));
  const rate = num(a.discountRate ?? 30) / 100;
  const rateM = Math.pow(1 + rate, 1 / 12) - 1;

  const rows = [];
  let cum = -invest, payback = null, npv = -invest;
  for (let m = 1; m <= MONTHS; m++) {
    const f = m >= rampMonths ? 1 : rampStart + ((1 - rampStart) * (m - 1)) / rampMonths;
    const gi = Math.pow(inflM, m - 1);
    const u = units * f;
    const revenue = u * price * gi;
    const variable = u * unitCost * gi;
    const fix = fixed * gi;
    const tax = revenue * taxPct;
    const profit = revenue - variable - fix - tax;
    const prev = cum;
    cum += profit;
    if (payback === null && prev < 0 && cum >= 0) payback = m;
    npv += profit / Math.pow(1 + rateM, m);
    rows.push({ m, units: u, revenue, variable, fixed: fix, tax, profit, cum });
  }
  const years = [0, 1, 2].map((y) => {
    const part = rows.slice(y * 12, y * 12 + 12);
    return { revenue: sum(part.map((r) => r.revenue)), profit: sum(part.map((r) => r.profit)) };
  });
  const margin = price * (1 - taxPct) - unitCost;
  const breakEvenUnits = margin > 0 ? fixed / margin : null;
  const flows = [-invest, ...rows.map((r) => r.profit)];
  const irrM = irr(flows);
  return {
    scen, capexItems, workingCapital, invest, fixed, price, unitCost, units,
    breakEvenUnits, payback, npv, irr: irrM === null ? null : Math.pow(1 + irrM, 12) - 1,
    roi3: invest > 0 ? sum(years.map((y) => y.profit)) / invest : null,
    years, rows,
  };
}

/** معدل العائد الداخلي الشهري (تقسيم المجال)، أو null لو مفيش حل */
function irr(flows) {
  const npvAt = (r) => flows.reduce((t, f, i) => t + f / Math.pow(1 + r, i), 0);
  let lo = -0.99, hi = 1;
  let fLo = npvAt(lo), fHi = npvAt(hi);
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2, fm = npvAt(mid);
    if (Math.abs(fm) < 1e-6) return mid;
    if (fLo * fm < 0) { hi = mid; fHi = fm; } else { lo = mid; fLo = fm; }
  }
  return (lo + hi) / 2;
}

export function runAll(a) {
  return Object.fromEntries(SCENARIOS.map((s) => [s.key, runModel(a, s.key)]));
}

/** الحساسية: كل عامل ±20% في السيناريو المتوقع، ومرتبين حسب أثرهم على صافي القيمة الحالية */
export function sensitivity(a, step = 0.2) {
  const base = runModel(a, "mid").npv;
  const drivers = [
    ["price", "سعر البيع"],
    ["units", "حجم المبيعات"],
    ["unitCost", "تكلفة الوحدة"],
    ["fixed", "المصاريف الثابتة"],
    ["capex", "تكلفة التجهيز"],
  ];
  return drivers
    .map(([k, label]) => {
      const up = runModel(a, "mid", { [k]: 1 + step }).npv - base;
      const down = runModel(a, "mid", { [k]: 1 - step }).npv - base;
      return { key: k, label, up, down, swing: Math.abs(up - down) };
    })
    .sort((x, y) => y.swing - x.swing);
}

// ——— تنسيق الأرقام ———
export const egp = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${Math.round(v).toLocaleString("ar-EG")} ج`);
export const n0 = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : Math.round(v).toLocaleString("ar-EG"));
export const pct = (v) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : `${(v * 100).toLocaleString("ar-EG", { maximumFractionDigits: 0 })}٪`);
export const monthsText = (m) => (m ? `${m.toLocaleString("ar-EG")} ${m >= 3 && m <= 10 ? "شهور" : "شهر"}` : `أكتر من ${MONTHS.toLocaleString("ar-EG")} شهر`);

/** جداول التقرير المالية كـ Markdown (بتتحط في التقرير كما هي، من غير ما النموذج يلمسها) */
export function financialTables(a, res, sens, type) {
  const t = TYPES[type] || TYPES.shop;
  const S = SCENARIOS.map((s) => res[s.key]);
  const row = (label, f) => `| ${label} | ${S.map(f).join(" | ")} |`;
  const lines = [
    "### ملخص المؤشرات المالية",
    "",
    `| المؤشر | ${SCENARIOS.map((s) => s.label).join(" | ")} |`,
    "| --- | --- | --- | --- |",
    row("الاستثمار المطلوب (تجهيز + رأس مال عامل)", (r) => egp(r.invest)),
    row(`نقطة التعادل (${t.unit} في الشهر)`, (r) => n0(r.breakEvenUnits)),
    row("فترة الاسترداد", (r) => monthsText(r.payback)),
    row("صافي الربح في السنة الأولى", (r) => egp(r.years[0].profit)),
    row("صافي الربح في السنة التانية", (r) => egp(r.years[1].profit)),
    row("صافي الربح في السنة التالتة", (r) => egp(r.years[2].profit)),
    row("صافي القيمة الحالية (3 سنين)", (r) => egp(r.npv)),
    row("معدل العائد الداخلي السنوي", (r) => pct(r.irr)),
    "",
    "### التكاليف الاستثمارية (السيناريو المتوقع)",
    "",
    "| البند | التكلفة |",
    "| --- | --- |",
    ...(a.capex || []).map((x) => `| ${x.name}${x.est ? " (تقدير)" : ""} | ${egp(x.mid)} |`),
    `| رأس مال عامل (${n0(a.workingCapitalMonths ?? 3)} شهور مصاريف ثابتة) | ${egp(res.mid.workingCapital)} |`,
    `| **الإجمالي** | **${egp(res.mid.invest)}** |`,
    "",
    "### المصاريف الشهرية الثابتة (السيناريو المتوقع)",
    "",
    "| البند | في الشهر |",
    "| --- | --- |",
    ...(a.fixed || []).map((x) => `| ${x.name}${x.est ? " (تقدير)" : ""} | ${egp(x.mid)} |`),
    `| **الإجمالي** | **${egp(res.mid.fixed)}** |`,
    "",
    "### تحليل الحساسية (تغيير كل عامل 20٪ في السيناريو المتوقع)",
    "",
    "| العامل | لو زاد 20٪ | لو قل 20٪ |",
    "| --- | --- | --- |",
    ...sens.map((x) => `| ${x.label} | ${egp(x.up)} | ${egp(x.down)} |`),
  ];
  return lines.join("\n");
}

/** أقسام التقرير بالترتيب. الجداول المالية بتتحط بعد قسم "finance" من الكود مش من النموذج */
export const REPORT_SECTIONS = [
  { key: "summary", title: "الملخص التنفيذي", brief: "القرار بوضوح (يدخل / يدخل بشروط / لأ) وسببه، والاستثمار المطلوب، وفترة الاسترداد، وأهم 3 مخاطر. فقرتين بالكتير." },
  { key: "project", title: "وصف المشروع", brief: "الفكرة، والمكان، والعميل المستهدف، والميزة اللي ممكن تفرّقه عن المنافسين." },
  { key: "market", title: "دراسة السوق والطلب", brief: "حجم الطلب المتوقع في المنطقة، والاتجاهات، والأسعار السائدة، من المصادر بس." },
  { key: "competition", title: "تحليل المنافسين", brief: "مين المنافسين القريبين وتقييماتهم، ونقط قوتهم وضعفهم، والفجوة اللي ممكن تدخل منها." },
  { key: "technical", title: "الدراسة الفنية", brief: "المكان والمساحة، والمعدات الأساسية، والعمالة، والتراخيص والإجراءات المطلوبة بشكل عام." },
  { key: "finance", title: "الدراسة المالية", brief: "اشرح الأرقام اللي وصلتك (من غير ما تغيّرها ولا تحسب أرقام جديدة): الاستثمار، ونقطة التعادل، والاسترداد، والفرق بين السيناريوهات، وأكتر عامل مؤثر من تحليل الحساسية." },
  { key: "risks", title: "التمويل والمخاطر", brief: "طرق تمويل من غير قروض بفايدة (ذاتي، مشاركة أو مضاربة، مرابحة للمعدات من بنك إسلامي) لو رأس المال مش كفاية، وبعدها تحليل SWOT مختصر، وكل خطر جنبه طريقة تقليله." },
  { key: "plan", title: "التوصية وخطة أول 90 يوم", brief: "التوصية النهائية، وخطوات عملية مرتبة لأول 3 شهور، وإيه اللي لازم يتأكد منه ميدانياً قبل الصرف." },
];

/** ملخص الأرقام اللي بيتبعت للنموذج عشان يكتب عليها (النموذج ممنوع يحسب أرقام جديدة) */
export function factsText(a, res, sens, form) {
  const t = TYPES[form.type] || TYPES.shop;
  const m = res.mid;
  const lines = [
    `نوع المشروع: ${t.label} — ${form.activity} — ${[form.area, form.city, form.governorate].filter(Boolean).join("، ")}`,
    form.capital ? `رأس المال المتاح عند صاحب المشروع: ${egp(Number(form.capital))}` : "رأس المال المتاح: مش محدد",
    `وحدة البيع: ${t.unit}. ${t.priceLabel}: ${egp(m.price)}. ${t.costLabel}: ${egp(m.unitCost)}. المبيعات الشهرية المتوقعة عند الاستقرار: ${n0(m.units)} ${t.unit}.`,
    `المصاريف الثابتة الشهرية: ${egp(m.fixed)}. التضخم المفترض: ${n0(a.inflation)}٪ سنوياً.`,
    ...SCENARIOS.map((s) => {
      const r = res[s.key];
      return `سيناريو ${s.label}: الاستثمار ${egp(r.invest)}، التعادل ${n0(r.breakEvenUnits)} ${t.unit} في الشهر، الاسترداد ${monthsText(r.payback)}، ربح السنة 1/2/3: ${egp(r.years[0].profit)} / ${egp(r.years[1].profit)} / ${egp(r.years[2].profit)}، صافي القيمة الحالية ${egp(r.npv)}.`;
    }),
    `أكتر العوامل تأثيراً بالترتيب: ${sens.map((x) => x.label).join("، ")}.`,
  ];
  if (form.capital && Number(form.capital) < m.invest) lines.push(`فجوة تمويل في السيناريو المتوقع: ${egp(m.invest - Number(form.capital))}.`);
  return lines.join("\n");
}
