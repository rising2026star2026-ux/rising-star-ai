// «هوية نشاطي»: بيانات النشاط اللي العميل بيكتبها مرة واحدة وبتتحفظ على جهازه،
// والأدوات بتبعتها مع الطلب (لو العميل سابها شغالة) عشان النتيجة تطلع على مقاس نشاطه.
export const BRAND_TONES = [["friendly", "ودود"], ["formal", "رسمي"], ["energetic", "حماسي"], ["luxury", "فاخر"], ["playful", "مرح"]];
export const BRAND_DIALECTS = [["egy", "مصري"], ["gulf", "خليجي"], ["fusha", "فصحى مبسطة"]];

// التصنيفات اللي مربع «استخدم هوية نشاطي» بيظهر فيها (الأدوات اللي الهوية بتفيدها فعلاً)
export const BRAND_CATS = ["marketing", "social", "business", "ecommerce", "writing", "communication", "creative", "design"];

// نوع النشاط: المنصة لكل أنواع التجارة، مش المحلات بس
export const BIZ_KINDS = [["retail", "تجزئة ومحلات"], ["distributor", "جملة وتوزيع"], ["ecommerce", "تجارة إلكترونية"], ["maker", "تصنيع وورش"], ["food", "أغذية ومطاعم"], ["services", "خدمات"], ["local", "تجارة محلية"], ["home", "مشروع منزلي"], ["creator", "صناعة محتوى تجاري"], ["other", "نشاط آخر"]];
const KIND_IDS = BIZ_KINDS.map(([k]) => k);
export const BIZ_STATUS = [["existing", "نشاط قائم"], ["new", "مشروع جديد"]];
export const CUSTOMER_TYPES = [["b2c", "أفراد"], ["b2b", "شركات ومحلات"], ["both", "الاتنين"]];
export const SALES_CHANNELS = ["محل فعلي", "فيسبوك وإنستجرام", "واتساب", "تيك توك", "متجر إلكتروني", "أمازون ونون", "جملة وموزعين"];

export const EMPTY_BRAND = {
  status: "existing", kind: "", country: "مصر", region: "", city: "", capital: "", staff: "", customerType: "b2c", products: "", channels: [], budget: "", goals: "",
  name: "", latin: "", field: "", audience: "", tone: "friendly", dialect: "egy",
  tagline: "", whatsapp: "", notes: "", colors: { c1: "#26364d", c2: "#c6a04b", c3: "#111827" },
};

const TONE_TEXT = { friendly: "ودود وقريب", formal: "رسمي ومحترم", energetic: "حماسي ومشجّع", luxury: "فاخر وراقي", playful: "مرح وخفيف" };
const DIALECT_TEXT = { egy: "العامية المصرية", gulf: "اللهجة الخليجية", fusha: "الفصحى المبسطة" };
const isHex = (h) => /^#[0-9a-f]{6}$/i.test(h || "");

// بيتنضّف على السيرفر قبل ما يدخل أي تعليمات للموديل: نص عادي بطول محدد من غير أسطر جديدة
const clean = (v, max) => String(v ?? "").replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s{2,}/g, " ").trim().slice(0, max);

export function cleanBrand(raw) {
  if (!raw || typeof raw !== "object") return null;
  const name = clean(raw.name, 60);
  if (!name) return null;
  const c = raw.colors && typeof raw.colors === "object" ? raw.colors : {};
  return {
    status: raw.status === "new" ? "new" : "existing",
    kind: KIND_IDS.includes(raw.kind) ? raw.kind : "",
    country: clean(raw.country, 40),
    region: clean(raw.region, 60),
    city: clean(raw.city, 60),
    capital: clean(raw.capital, 60),
    staff: clean(raw.staff, 20),
    customerType: ["b2c", "b2b", "both"].includes(raw.customerType) ? raw.customerType : "b2c",
    products: clean(raw.products, 300),
    channels: Array.isArray(raw.channels) ? raw.channels.map((c) => clean(c, 40)).filter((c) => SALES_CHANNELS.includes(c)).slice(0, 7) : [],
    budget: clean(raw.budget, 60),
    goals: clean(raw.goals, 300),
    name,
    latin: clean(raw.latin, 60),
    field: clean(raw.field, 240),
    audience: clean(raw.audience, 200),
    tone: TONE_TEXT[raw.tone] ? raw.tone : "friendly",
    dialect: DIALECT_TEXT[raw.dialect] ? raw.dialect : "egy",
    tagline: clean(raw.tagline, 80),
    whatsapp: clean(raw.whatsapp, 40),
    notes: clean(raw.notes, 300),
    colors: { c1: isHex(c.c1) ? c.c1 : EMPTY_BRAND.colors.c1, c2: isHex(c.c2) ? c.c2 : EMPTY_BRAND.colors.c2, c3: isHex(c.c3) ? c.c3 : EMPTY_BRAND.colors.c3 },
  };
}

/** نص بيتضاف لتعليمات الموديل */
export function brandBlock(b) {
  if (!b) return "";
  const lines = [
    `الاسم: ${b.name}${b.latin ? ` (${b.latin})` : ""}`,
    b.status && `الحالة: ${b.status === "new" ? "مشروع جديد" : "نشاط قائم"}`,
    b.kind && `نوع النشاط: ${Object.fromEntries(BIZ_KINDS)[b.kind]}`,
    b.field && `النشاط: ${b.field}`,
    (b.country || b.region || b.city) && `المكان: ${[b.city, b.region, b.country].filter(Boolean).join("، ")}`,
    b.capital && `رأس المال: ${b.capital}`,
    b.staff && `عدد العاملين: ${b.staff}`,
    b.customerType && `نوع العملاء: ${{ b2c: "أفراد", b2b: "شركات ومحلات", both: "أفراد وشركات" }[b.customerType]}`,
    b.products && `المنتجات والخدمات: ${b.products}`,
    b.channels?.length ? `قنوات البيع: ${b.channels.join("، ")}` : "",
    b.budget && `الميزانية: ${b.budget}`,
    b.goals && `الأهداف التجارية: ${b.goals}`,
    b.audience && `الجمهور: ${b.audience}`,
    `النبرة: ${TONE_TEXT[b.tone]}`,
    `اللهجة: ${DIALECT_TEXT[b.dialect]}`,
    b.tagline && `الشعار: ${b.tagline}`,
    b.whatsapp && `رقم التواصل: ${b.whatsapp}`,
    b.notes && `ملاحظات من العميل: ${b.notes}`,
  ].filter(Boolean);
  return [
    "هوية نشاط العميل (استخدمها لما تناسب الطلب، ومتخترعش أي معلومة مش مكتوبة هنا زي أسعار أو عروض أو عناوين):",
    ...lines.map((l) => `- ${l}`),
  ].join("\n");
}

/** تركيب الأسلوب البصري المناسب للوجو من نبرة النشاط */
export const TONE_TO_LOGO_STYLE = { friendly: "modern", formal: "classic", energetic: "bold", luxury: "luxury", playful: "playful" };
