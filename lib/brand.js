// «هوية نشاطي»: بيانات النشاط اللي العميل بيكتبها مرة واحدة وبتتحفظ على جهازه،
// والأدوات بتبعتها مع الطلب (لو العميل سابها شغالة) عشان النتيجة تطلع على مقاس نشاطه.
export const BRAND_TONES = [["friendly", "ودود"], ["formal", "رسمي"], ["energetic", "حماسي"], ["luxury", "فاخر"], ["playful", "مرح"]];
export const BRAND_DIALECTS = [["egy", "مصري"], ["gulf", "خليجي"], ["fusha", "فصحى مبسطة"]];

// التصنيفات اللي مربع «استخدم هوية نشاطي» بيظهر فيها (الأدوات اللي الهوية بتفيدها فعلاً)
export const BRAND_CATS = ["marketing", "social", "business", "ecommerce", "writing", "communication", "creative", "design"];

export const EMPTY_BRAND = {
  name: "", latin: "", field: "", audience: "", tone: "friendly", dialect: "egy",
  tagline: "", whatsapp: "", notes: "", colors: { c1: "#1f4dff", c2: "#ffd21f", c3: "#111827" },
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
    b.field && `النشاط: ${b.field}`,
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
