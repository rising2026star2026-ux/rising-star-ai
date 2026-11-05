// الباحث العقاري: محرك الحسابات (بيشتغل في المتصفح والسيرفر). كل الأرقام هنا بتتحسب بالكود، مش بالنموذج.
// الحاسبات: تقسيط المطوّر، المقارنة بين الكاش والتقسيط والإيجار، العائد الإيجاري، الإيجار القديم، تكاليف نقل الملكية.

export const PURPOSES = {
  live: { name: "سكن ليا", hint: "أسكن فيها أنا وأسرتي" },
  invest: { name: "استثمار", hint: "أشتري وأبيع بعد سنين" },
  rent: { name: "أأجّرها", hint: "دخل شهري من الإيجار" },
};

export const UNIT_TYPES = {
  apartment: "شقة",
  duplex: "دوبلكس",
  villa: "فيلا أو تاون هاوس",
  chalet: "شاليه",
  shop: "محل تجاري",
  office: "مكتب إداري",
  clinic: "عيادة",
  land: "أرض",
};

export const MODES = { sale: "شراء", rent: "إيجار" };

export const egp = (n) => (Number.isFinite(n) ? `${Math.round(n).toLocaleString("en-US")} جنيه` : "—");
export const n0 = (n) => (Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—");
export const pct = (n, d = 1) => (Number.isFinite(n) ? `${(Math.round(n * 10 ** d) / 10 ** d).toLocaleString("en-US")}%` : "—");
const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

/** الوسيط والربعين لقايمة أرقام */
export function stats(list) {
  const a = (list || []).map(Number).filter((x) => Number.isFinite(x) && x > 0).sort((x, y) => x - y);
  if (!a.length) return null;
  const q = (p) => {
    const i = (a.length - 1) * p;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return a[lo] + (a[hi] - a[lo]) * (i - lo);
  };
  // بنشيل الأرقام الشاذة جداً (أكبر من 3 أضعاف الوسيط أو أقل من ثلثه)
  const med = q(0.5);
  const b = a.filter((x) => x <= med * 3 && x >= med / 3);
  const q2 = (p) => {
    const i = (b.length - 1) * p;
    const lo = Math.floor(i), hi = Math.ceil(i);
    return b[lo] + (b[hi] - b[lo]) * (i - lo);
  };
  return { n: b.length, low: q2(0.25), mid: q2(0.5), high: q2(0.75), min: b[0], max: b[b.length - 1] };
}

/**
 * تقسيط المطوّر: مقدم + أقساط متساوية (شهرية أو ربع سنوية) + وديعة صيانة عند الاستلام.
 * بيحسب كمان «التكلفة الحقيقية» بقيمة فلوس النهارده: كل قسط مخصوم بالتضخم، لأن الجنيه بعد سنين بيشتري أقل.
 */
export function installmentPlan({ price, downPct = 10, years = 7, perYear = 4, maintenancePct = 8, deliveryYears = 3, inflation = 15 } = {}) {
  price = Math.max(0, num(price));
  downPct = clamp(num(downPct, 10), 0, 100);
  years = clamp(Math.round(num(years, 7)), 0, 15);
  perYear = [1, 2, 4, 12].includes(Number(perYear)) ? Number(perYear) : 4;
  maintenancePct = clamp(num(maintenancePct, 8), 0, 25);
  deliveryYears = clamp(num(deliveryYears, 3), 0, 10);
  const infl = clamp(num(inflation, 15), 0, 80) / 100;

  const down = (price * downPct) / 100;
  const count = years * perYear;
  const rest = price - down;
  const each = count ? rest / count : 0;
  const maintenance = (price * maintenancePct) / 100;
  const total = price + maintenance;

  const disc = (t) => 1 / Math.pow(1 + infl, t);
  let realTotal = down;
  const schedule = [];
  for (let k = 1; k <= count; k++) {
    const t = k / perYear;
    realTotal += each * disc(t);
    if (k % perYear === 0 || k === count) schedule.push({ year: Math.ceil(t), paid: down + each * k });
  }
  if (!count) realTotal = price;
  realTotal += maintenance * disc(deliveryYears);
  const realPrice = realTotal - maintenance * disc(deliveryYears);
  // خصم الكاش اللي يخلّي الكاش زي التقسيط بالظبط بقيمة النهارده: لو المطوّر عرض خصم أكبر من كده، الكاش أوفر
  const breakEvenCashDiscount = price ? (1 - realPrice / price) * 100 : 0;
  return {
    price, down, downPct, count, perYear, each, years, maintenance, maintenancePct, deliveryYears,
    total, realTotal, realPrice, breakEvenCashDiscount, inflation: infl * 100,
    monthlyEquivalent: years ? rest / (years * 12) : 0,
    schedule,
  };
}

/**
 * مقارنة على عدد سنين: كاش (بخصم) ضد تقسيط ضد إيجار مع استثمار الفرق.
 * القيمة في الآخر = قيمة العقار المتوقعة (أو المدخرات للإيجار) ناقص كل اللي اتدفع، والكل بقيمة فلوس النهارده.
 */
export function compareOptions({ price, cashDiscountPct = 0, plan = {}, rentMonthly = 0, rentGrowth = 10, appreciation = 15, inflation = 15, savingsReturn = 0, horizon = 7 } = {}) {
  price = Math.max(0, num(price));
  horizon = clamp(Math.round(num(horizon, 7)), 1, 20);
  const infl = clamp(num(inflation, 15), 0, 80) / 100;
  const appr = clamp(num(appreciation, 15), -20, 80) / 100;
  const rg = clamp(num(rentGrowth, 10), 0, 60) / 100;
  const sr = clamp(num(savingsReturn, 0), 0, 60) / 100;
  const disc = (t) => 1 / Math.pow(1 + infl, t);
  const futureValue = price * Math.pow(1 + appr, horizon);
  const futureValueReal = futureValue * disc(horizon);

  const cashPaid = price * (1 - clamp(num(cashDiscountPct, 0), 0, 60) / 100);
  const p = installmentPlan({ price, inflation: infl * 100, ...plan });

  // إيجار: بتدفع إيجار كل شهر، والفلوس اللي كنت هتدفعها كاش بتتحط في ادخار بعائد savingsReturn (من غير فوايد ربوية لو حطيتها صفر)
  let rentPaidReal = 0;
  let r = num(rentMonthly);
  for (let y = 0; y < horizon; y++) {
    rentPaidReal += r * 12 * disc(y + 0.5);
    r *= 1 + rg;
  }
  const savedReal = cashPaid * Math.pow(1 + sr, horizon) * disc(horizon);

  return {
    horizon,
    futureValue,
    cash: { paid: cashPaid, endValueReal: futureValueReal, net: futureValueReal - cashPaid },
    installments: { paid: p.total, paidReal: p.realTotal, endValueReal: futureValueReal, net: futureValueReal - p.realTotal, plan: p },
    rent: rentMonthly > 0 ? { paidReal: rentPaidReal, savedReal, net: savedReal - cashPaid - rentPaidReal } : null,
  };
}

/** العائد الإيجاري: إجمالي وصافي، وعدد السنين اللي الإيجار يرجّع فيها التمن */
export function rentalYield({ price, rentMonthly, vacancyMonths = 1, costsYearly = 0, furnishing = 0 } = {}) {
  price = Math.max(0, num(price));
  const rent = Math.max(0, num(rentMonthly));
  const months = 12 - clamp(num(vacancyMonths, 1), 0, 12);
  const grossYear = rent * 12;
  const netYear = rent * months - Math.max(0, num(costsYearly));
  const invest = price + Math.max(0, num(furnishing));
  return {
    grossYear, netYear,
    gross: price ? (grossYear / price) * 100 : 0,
    net: invest ? (netYear / invest) * 100 : 0,
    paybackYears: netYear > 0 ? invest / netYear : Infinity,
  };
}

/**
 * الإيجار القديم (القانون 164 لسنة 2025):
 * السكني: المتميزة 20 ضعف (حد أدنى 1000)، المتوسطة 10 أضعاف (حد أدنى 400)، الاقتصادية 10 أضعاف (حد أدنى 250).
 * غير السكني: 5 أضعاف. بعدها زيادة سنوية تراكمية 15% على آخر قيمة.
 * الفترة الانتقالية: 7 سنين للسكني (لحد أغسطس 2032) و5 للغير سكني (لحد أغسطس 2030).
 */
export const OLD_RENT_ZONES = {
  prime: { name: "منطقة متميزة", mult: 20, min: 1000, years: 7 },
  mid: { name: "منطقة متوسطة", mult: 10, min: 400, years: 7 },
  econ: { name: "منطقة اقتصادية", mult: 10, min: 250, years: 7 },
  nonres: { name: "غير سكني (محل، مكتب، عيادة)", mult: 5, min: 0, years: 5 },
};
export const OLD_RENT_LAW = {
  name: "القانون رقم 164 لسنة 2025",
  start: "أغسطس 2025",
  firstIncrease: "سبتمبر 2026",
  increase: 15,
  provisional: 250,
};

export function oldRent({ zone = "mid", current = 0 } = {}) {
  const z = OLD_RENT_ZONES[zone] || OLD_RENT_ZONES.mid;
  const cur = Math.max(0, num(current));
  const base = Math.max(cur * z.mult, z.min);
  const rows = [{ label: `من ${OLD_RENT_LAW.start}`, year: 2025, rent: base }];
  let v = base;
  for (let i = 1; i < z.years; i++) {
    v *= 1 + OLD_RENT_LAW.increase / 100;
    rows.push({ label: `من سبتمبر ${2025 + i}`, year: 2025 + i, rent: v });
  }
  const total = rows.reduce((a, r) => a + r.rent * 12, 0);
  return { zone: z, base, rows, total, endYear: 2025 + z.years };
}

/** تكاليف نقل الملكية: ضريبة التصرفات العقارية 2.5% من قيمة البيع (على البايع، حسب المادة 42 من قانون الضريبة على الدخل) */
export function transferCosts({ price, commissionPct = 2.5 } = {}) {
  price = Math.max(0, num(price));
  return {
    disposalTax: price * 0.025,
    commission: (price * clamp(num(commissionPct, 2.5), 0, 10)) / 100,
  };
}

/** نص الأرقام المحسوبة اللي بيتبعت للنموذج عشان يكتب التقرير ويرد في الشات من غيرها ما يتغيّر */
export function factsText(form, market, calc) {
  const L = [];
  L.push(`الطلب: ${MODES[form.mode] || "شراء"} ${UNIT_TYPES[form.type] || "وحدة"}${form.area ? ` ${form.area} متر` : ""} في ${[form.district, form.city].filter(Boolean).join("، ")}. الهدف: ${PURPOSES[form.purpose]?.name || "سكن"}. الميزانية: ${form.budget ? egp(Number(form.budget)) : "مش محددة"}.`);
  if (market?.salePpm) L.push(`سعر المتر للبيع (من الإعلانات): من ${n0(market.salePpm.low)} لـ ${n0(market.salePpm.high)} جنيه، والوسط ${n0(market.salePpm.mid)}${market.salePpm.n ? ` (${market.salePpm.n} عينة)` : ""}${market.salePpm.src?.length ? ` [${market.salePpm.src.join("][")}]` : ""}.`);
  if (market?.rent) L.push(`الإيجار الشهري لوحدة مشابهة: من ${n0(market.rent.low)} لـ ${n0(market.rent.high)} جنيه، والوسط ${n0(market.rent.mid)}${market.rent.src?.length ? ` [${market.rent.src.join("][")}]` : ""}.`);
  if (market?.inflation) L.push(`التضخم المتوقع لمصر ${market.inflation.value}% (${market.inflation.year}) من صندوق النقد الدولي.`);
  if (calc?.price) L.push(`السعر التقديري للوحدة: ${egp(calc.price)}.`);
  if (calc?.plan) {
    const p = calc.plan;
    L.push(`التقسيط: مقدم ${pct(p.downPct, 0)} = ${egp(p.down)}، و${p.count} قسط كل واحد ${egp(p.each)} على ${p.years} سنين، ووديعة صيانة ${egp(p.maintenance)}. الإجمالي ${egp(p.total)}، وبقيمة فلوس النهارده ${egp(p.realTotal)}. أي خصم كاش أكبر من ${pct(p.breakEvenCashDiscount)} يخلّي الكاش أوفر.`);
  }
  if (calc?.yield) L.push(`العائد الإيجاري: إجمالي ${pct(calc.yield.gross)}، وصافي ${pct(calc.yield.net)}، والإيجار يرجّع التمن في ${Number.isFinite(calc.yield.paybackYears) ? `${calc.yield.paybackYears.toFixed(1)} سنة` : "—"}.`);
  if (calc?.compare) {
    const c = calc.compare;
    L.push(`مقارنة على ${c.horizon} سنين (بقيمة فلوس النهارده): الكاش صافي ${egp(c.cash.net)}، التقسيط صافي ${egp(c.installments.net)}${c.rent ? `، الإيجار مع ادخار التمن صافي ${egp(c.rent.net)}` : ""}.`);
  }
  if (calc?.costs) L.push(`ضريبة التصرفات العقارية 2.5% على البايع ≈ ${egp(calc.costs.disposalTax)}. عمولة السمسار (لو فيه) ≈ ${egp(calc.costs.commission)}.`);
  if (market?.places?.length) L.push(`خدمات قريبة من الخرائط: ${market.places.map((p) => `${p.label} ${p.count}`).join("، ")}.`);
  return L.join("\n");
}

export const REPORT_SECTIONS = [
  { key: "summary", title: "الخلاصة" },
  { key: "prices", title: "الأسعار في المنطقة" },
  { key: "payment", title: "كاش ولا تقسيط ولا إيجار" },
  { key: "area", title: "المنطقة والخدمات" },
  { key: "legal", title: "الأوراق والتكاليف القانونية" },
  { key: "risks", title: "المخاطر وإزاي تتجنبها" },
  { key: "next", title: "خطواتك الجاية" },
];

export const DISCLAIMER = "الأرقام دي تقديرية من إعلانات منشورة ومؤشرات عامة، مش أسعار بيع فعلية مسجلة، ومش تقييم معتمد. قبل أي دفع: عاين الوحدة بنفسك، وراجع الأوراق مع محامي.";
