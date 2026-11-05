// محرك التقييم العقاري من 100 (بالكود، بيشتغل في المتصفح). 6 معايير، وأوزان لكل هدف، والمستخدم يقدر يغيّرها.
// أي معيار بياناته مش موجودة بيتشال من الحساب، والأوزان بتتوزّع على الباقي، و«التغطية» بتقول قد إيه البيانات كاملة.
import { rentalYield } from "@/lib/realestate";

export const CRITERIA = {
  price: "سعر المتر مقارنة بالمنطقة",
  location: "الموقع والخدمات",
  yield: "العائد الإيجاري",
  developer: "المطوّر وسجل التسليم",
  resale: "سهولة إعادة البيع",
  risk: "مخاطر الشراء والتسليم",
};

export const GOALS = {
  live: { name: "الأفضل للسكن", w: { price: 20, location: 30, yield: 0, developer: 25, resale: 10, risk: 15 } },
  invest: { name: "الأفضل للاستثمار والتأجير", w: { price: 20, location: 15, yield: 30, developer: 15, resale: 10, risk: 10 } },
  resale: { name: "الأفضل لإعادة البيع", w: { price: 25, location: 20, yield: 5, developer: 20, resale: 20, risk: 10 } },
};

export const DEV_TIERS = {
  "": { name: "مش معروف", score: null },
  listed: { name: "كبير ومدرج في البورصة", score: 85 },
  known: { name: "معروف وسلّم مشاريع قبل كده", score: 72 },
  new: { name: "جديد أو أول مشروع", score: 40 },
  delayed: { name: "معروف بتأخير التسليم", score: 25 },
};

export const DOCS = {
  "": { name: "مش متأكد" },
  ok: { name: "مسجّلة أو صحة توقيع" },
  contract: { name: "عقد ابتدائي بس" },
  missing: { name: "ناقصة أو فيها مشاكل" },
};

const clamp = (v) => Math.max(0, Math.min(100, v));
const num = (v) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : null);

export const UNIT0 = { name: "", price: "", area: "", rent: "", location: "", developer: "", delivery: 0, offPlan: false, docs: "", resale: "", url: "" };

/** درجات المعايير لوحدة واحدة (0 لـ 100، أو null لو البيانات مش موجودة) */
export function criteriaScores(u, medianPpm) {
  const price = num(u.price), area = num(u.area);
  const ppm = price && area ? price / area : null;
  const med = num(medianPpm);
  const out = {};
  out.price = ppm && med ? clamp(50 + ((med - ppm) / med) * 200) : null;
  out.location = num(u.location) ? clamp(((Number(u.location) - 1) / 4) * 100) : null;
  const rent = num(u.rent);
  const y = price && rent ? rentalYield({ price, rentMonthly: rent, vacancyMonths: 1 }) : null;
  out.yield = y ? clamp((y.net / 8) * 100) : null;
  out.developer = DEV_TIERS[u.developer || ""]?.score ?? null;
  out.resale = num(u.resale) ? clamp(((Number(u.resale) - 1) / 4) * 100) : null;
  // المخاطر: بتبدأ من 100 وبتقل (بتتحسب دايماً)
  let risk = 100;
  const years = Math.max(0, Number(u.delivery) || 0);
  risk -= Math.min(40, years * 8);
  if (u.offPlan) risk -= 10;
  if (u.docs === "missing") risk -= 30;
  if (u.docs === "contract") risk -= 10;
  if (u.docs === "") risk -= 5;
  if (out.developer == null) risk -= 10;
  if (u.developer === "delayed") risk -= 10;
  out.risk = clamp(risk);
  return { scores: out, ppm, yieldNet: y?.net ?? null };
}

/** الدرجة الكلية لهدف معيّن + التغطية + أقوى وأضعف معيارين */
export function goalScore(scores, weights) {
  let sum = 0, wsum = 0, wall = 0;
  for (const [k, w] of Object.entries(weights)) {
    if (!w) continue;
    wall += w;
    if (scores[k] == null) continue;
    sum += scores[k] * w;
    wsum += w;
  }
  const ranked = Object.keys(weights).filter((k) => weights[k] && scores[k] != null).sort((a, b) => scores[b] - scores[a]);
  return {
    total: wsum ? Math.round(sum / wsum) : null,
    coverage: wall ? Math.round((wsum / wall) * 100) : 0,
    strong: ranked.slice(0, 2).filter((k) => scores[k] >= 60),
    weak: ranked.slice(-2).reverse().filter((k) => scores[k] < 60),
  };
}

/**
 * units = [{...UNIT0}], medianPpm = وسيط سعر المتر في المنطقة، weights = { live:{...}, invest:{...}, resale:{...} } (اختياري)
 * بيرجّع { rows: [{u, scores, ppm, yieldNet, goals:{live,invest,resale}}], best: { live: index, ... } }
 */
export function compareUnits(units, medianPpm, weights = {}) {
  const rows = units.map((u) => {
    const c = criteriaScores(u, medianPpm);
    const goals = {};
    for (const [g, def] of Object.entries(GOALS)) goals[g] = goalScore(c.scores, weights[g] || def.w);
    return { u, ...c, goals };
  });
  const best = {};
  for (const g of Object.keys(GOALS)) {
    let bi = -1, bv = -1;
    rows.forEach((r, i) => {
      const v = r.goals[g].total;
      if (v != null && v > bv) { bv = v; bi = i; }
    });
    best[g] = bi;
  }
  return { rows, best };
}
