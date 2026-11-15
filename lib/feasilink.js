// ربط دراسة الجدوى بالمقارنات المحفوظة: تبدأ الدراسة من نشاط في مقارنة، وتقارن أرقامك بأرقام السوق وتستخدمها.
// كله كود من أرقام العميل، من غير موديل.

export const HANDOFF_KEY = "feasibility-from-compare";

const toNum = (v) => {
  const x = Number(String(v ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[٬,\s]/g, "").replace(/٫/g, "."));
  return Number.isFinite(x) && x > 0 ? x : 0;
};

/** أرقام النشاط من المقارنة بعد التنضيف */
export function bizNumbers(b) {
  return {
    name: String(b?.name || "").trim().slice(0, 120),
    capital: toNum(b?.capital), setup: toNum(b?.setup), fixed: toNum(b?.fixed),
    price: toNum(b?.price), unitCost: toNum(b?.unitCost), units: toNum(b?.units),
    tax: Math.min(100, toNum(b?.tax)),
  };
}

/** الأنشطة اللي ينفع تبدأ منها دراسة: ليها اسم وسعر وكمية */
export function compareCandidates(saved = []) {
  const out = [];
  for (const c of Array.isArray(saved) ? saved : []) {
    for (const b of Array.isArray(c?.list) ? c.list : []) {
      const x = bizNumbers(b);
      if (x.name.length >= 3 && x.price > 0 && x.units > 0) out.push({ key: `${c.id}:${b.id}`, from: String(c.name || "مقارنة").slice(0, 60), biz: x });
    }
  }
  return out.slice(0, 30);
}

/** بيانات أول الدراسة من النشاط */
export function prefillFromBiz(x, from) {
  const out = { activity: x.name };
  if (x.capital) out.capital = String(Math.round(x.capital));
  out.notes = `من مقارنة «${from}»: سعر ${Math.round(x.price)} ج، و${Math.round(x.units)} وحدة في الشهر، ومصاريف ثابتة ${Math.round(x.fixed)} ج.`.slice(0, 300);
  return out;
}

const sumMid = (items) => (items || []).reduce((t, i) => t + (Number(i.mid) || 0), 0);

// بند فيه مدى: المتوقع يبقى رقم العميل، والأقل والأعلى بنفس نسبتهم للمتوقع القديم
function rangeTo(r, value) {
  const mid = Number(r?.mid) || 0;
  const lo = mid > 0 ? (Number(r.low) || mid) / mid : 0.85;
  const hi = mid > 0 ? (Number(r.high) || mid) / mid : 1.15;
  return { ...r, low: Math.round(value * lo), mid: Math.round(value), high: Math.round(value * hi), est: false, src: [], yours: true };
}

// مجموعة بنود (تجهيز أو ثابت): بنكبّر أو نصغّر كل بند بنفس النسبة عشان المجموع المتوقع يساوي رقم العميل
function scaleItems(items, total, label) {
  const cur = sumMid(items);
  if (!(total > 0)) return items;
  if (!(cur > 0)) return [{ name: label, low: Math.round(total * 0.9), mid: Math.round(total), high: Math.round(total * 1.15), est: false, src: [], yours: true }];
  const k = total / cur;
  return items.map((i) => ({ ...i, low: Math.round((Number(i.low) || 0) * k), mid: Math.round((Number(i.mid) || 0) * k), high: Math.round((Number(i.high) || 0) * k), est: false, src: [], yours: true }));
}

/** مقارنة أرقام العميل بالمتوقع في الدراسة: [{key,label,yours,market}] */
export function numbersDiff(a, x) {
  if (!a || !x) return [];
  const rows = [
    ["setup", "تكلفة التجهيز", x.setup, sumMid(a.capex)],
    ["fixed", "المصاريف الثابتة في الشهر", x.fixed, sumMid(a.fixed)],
    ["price", "سعر البيع", x.price, Number(a.price?.mid) || 0],
    ["unitCost", "تكلفة الوحدة", x.unitCost, Number(a.unitCost?.mid) || 0],
    ["units", "المبيعات في الشهر", x.units, Number(a.units?.mid) || 0],
  ];
  return rows.filter(([, , y]) => y > 0).map(([key, label, yours, market]) => ({ key, label, yours, market, gap: market > 0 ? (yours - market) / market : null }));
}

/** تطبيق أرقام العميل على افتراضات الدراسة (الأرقام اللي كتبها بس) */
export function applyBizNumbers(a, x) {
  if (!a || !x) return a;
  const out = { ...a };
  if (x.price > 0) out.price = rangeTo(a.price, x.price);
  if (x.unitCost > 0) out.unitCost = rangeTo(a.unitCost, x.unitCost);
  if (x.units > 0) out.units = rangeTo(a.units, x.units);
  if (x.setup > 0) out.capex = scaleItems(a.capex, x.setup, "تجهيز (من مقارنتك)");
  if (x.fixed > 0) out.fixed = scaleItems(a.fixed, x.fixed, "مصاريف ثابتة (من مقارنتك)");
  if (x.tax > 0) out.taxPct = x.tax;
  return out;
}
