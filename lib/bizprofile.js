// ملف النشاط كمركز للمنصة: اكتمال الملف، وتحويل بياناته لمدخلات الجدوى والمقارنة. كله كود، من غير موديل.
import { GOVERNORATES } from "./feasibility.js";

// كل بند: اسمه، ودالة بتقول هل اتملا، وأين بيتستخدم
export const PROFILE_ITEMS = [
  { id: "name", label: "اسم النشاط", ok: (b) => !!b.name, use: "كل الأدوات والمساعد" },
  { id: "kind", label: "نوع النشاط", ok: (b) => !!b.kind, use: "المساعد والجدوى" },
  { id: "field", label: "وصف النشاط", ok: (b) => !!b.field, use: "الجدوى والمساعد" },
  { id: "city", label: "المحافظة أو المدينة", ok: (b) => !!(b.region || b.city), use: "الجدوى والتسويق" },
  { id: "products", label: "المنتجات والخدمات", ok: (b) => !!b.products, use: "أدوات المنتجات والتسعير" },
  { id: "channels", label: "قنوات البيع", ok: (b) => (b.channels || []).length > 0, use: "التسويق والمبيعات" },
  { id: "audience", label: "العملاء", ok: (b) => !!b.audience, use: "الإعلانات والمحتوى" },
  { id: "budget", label: "الميزانية", ok: (b) => !!b.budget, use: "دراسة الجدوى" },
  { id: "goals", label: "الأهداف", ok: (b) => !!b.goals, use: "مساعد الأعمال" },
];

export function profileCompleteness(brand) {
  const b = brand || {};
  const items = PROFILE_ITEMS.map((i) => ({ ...i, done: !!i.ok(b) }));
  const done = items.filter((i) => i.done).length;
  return { done, total: items.length, percent: Math.round((done / items.length) * 100), items, missing: items.filter((i) => !i.done) };
}

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toLatin = (s) => String(s || "").replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[٬,،]/g, "").replace(/٫/g, ".");

// "٢٠٠ ألف جنيه" -> 200000. بيرجّع null لو مش واضح الرقم (ما بنخمّنش).
export function parseMoney(text) {
  const t = toLatin(text);
  const m = t.match(/(\d+(?:\.\d+)?)\s*(مليون|ألف|الف|k)?/i);
  if (!m) return null;
  const n = parseFloat(m[1]);
  if (!Number.isFinite(n) || n <= 0) return null;
  const mult = /مليون/.test(m[2] || "") ? 1e6 : /ألف|الف|k/i.test(m[2] || "") ? 1e3 : 1;
  const v = Math.round(n * mult);
  return v >= 1000 && v <= 1e10 ? v : null;
}

// بيعبّي فورم الجدوى من ملف النشاط (حقول فاضية بس، والعميل يعدّل)
export function feasibilityPrefill(brand) {
  if (!brand || (!brand.field && !brand.name)) return null;
  const out = {};
  // نوع النشاط ← نوع مشروع الجدوى
  const type = { retail: "shop", local: "shop", maker: "factory", home: "factory", food: "cafe", distributor: "warehouse", ecommerce: "startup", creator: "startup", services: "startup" }[brand.kind];
  if (type) out.type = type;
  const activity = (brand.field || brand.name || "").slice(0, 120);
  if (activity) out.activity = activity;
  const gov = GOVERNORATES.find((g) => `${brand.region || ""} ${brand.city || ""}`.includes(g));
  if (gov) out.governorate = gov;
  else if (brand.city) out.city = brand.city.slice(0, 60);
  const cap = parseMoney(brand.capital) || parseMoney(brand.budget);
  if (cap) out.capital = String(cap);
  const cust = [brand.audience, brand.customerType === "b2b" ? "شركات ومحلات" : ""].filter(Boolean).join("، ");
  if (cust) out.customer = cust.slice(0, 120);
  const notes = [brand.products && `المنتجات: ${brand.products}`, brand.goals && `الأهداف: ${brand.goals}`].filter(Boolean).join(". ");
  if (notes) out.notes = notes.slice(0, 300);
  return Object.keys(out).length ? out : null;
}
