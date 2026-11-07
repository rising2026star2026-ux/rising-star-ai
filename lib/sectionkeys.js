// عزل مفاتيح الموديلات والحصص لكل قسم (على السيرفر بس).
// ترتيب المفاتيح لكل طلب: مفاتيح القسم الخاصة (_API_KEY ثم _API_KEY_2)، وبعدها المفتاح العام المشترك.
// المفتاح العام هو اللي بنحطه في آخر الترتيب كشبكة أمان للكل، وليه سقف يومي لكل قسم عشان قسم واحد ما يستهلكوش.
// الأسماء في Vercel بتكون زي: RE_GEMINI_API_KEY ، RE_GEMINI_API_KEY_2 ، ACAD_GROQ_API_KEY ... (قيم المفاتيح ما بتتكتبش في الكود).
import { AsyncLocalStorage } from "node:async_hooks";

export const SECTION_PREFIX = { realestate: "RE", seller: "SELL", academic: "ACAD", aiwork: "AI", chat: "CHAT" };
const PROVIDER_ENV = { groq: "GROQ", openrouter: "OPENROUTER", gemini: "GEMINI", deepinfra: "DEEPINFRA" };

const als = new AsyncLocalStorage();

/** بيلفّ معالج API عشان كل نداء موديل جواه يستخدم مفاتيح وسقف القسم ده */
export const withSection = (section, handler) => (req, ctx) => als.run(section, () => handler(req, ctx));
export const currentSection = () => als.getStore() || null;

/** أسماء متغيرات البيئة الخاصة بالقسم لمزود معين (للتوثيق والتشخيص) */
export function sectionEnvNames(provider, section) {
  const p = SECTION_PREFIX[section], v = PROVIDER_ENV[provider];
  return p && v ? [`${p}_${v}_API_KEY`, `${p}_${v}_API_KEY_2`] : [];
}

/** هل في أي مفتاح (عام أو لأي قسم) للمزود ده؟ بنستخدمها في بناء السلسلة بس */
export function hasAnyKey(provider) {
  const v = PROVIDER_ENV[provider];
  if (!v) return false;
  if (process.env[`${v}_API_KEY`]) return true;
  return Object.keys(SECTION_PREFIX).some((s) => sectionEnvNames(provider, s).some((n) => process.env[n]));
}

// مفتاح وقع في 429 أو 401 بنوقف استخدامه فترة قصيرة عشان ما نضربش عليه بلا فايدة (في ذاكرة الـ instance بس)
const cool = new Map();
export const coolDown = (label, ms = 60_000) => cool.set(label, Date.now() + ms);
const isCool = (label) => (cool.get(label) || 0) > Date.now();

// استخدام المفتاح العام لكل قسم في اليوم (تقريبي: بيتصفّر مع كل instance جديد على Vercel)
const shared = new Map();
const day = () => new Date().toISOString().slice(0, 10);
function sharedCap(section) {
  const p = SECTION_PREFIX[section];
  const n = Number((p && process.env[`${p}_SHARED_DAILY_CAP`]) || process.env.SHARED_DAILY_CAP || 0);
  return Number.isFinite(n) && n > 0 ? n : 0; // 0 = من غير سقف
}
export function sharedAllowed(section) {
  const cap = section ? sharedCap(section) : 0;
  return !cap || (shared.get(`${section}|${day()}`) || 0) < cap;
}
export function countShared(section) {
  if (!section) return;
  const k = `${section}|${day()}`;
  shared.set(k, (shared.get(k) || 0) + 1);
  if (shared.size > 100) shared.delete(shared.keys().next().value);
}

/**
 * مفاتيح المزود للقسم الحالي بالترتيب: [{ key, label, shared }].
 * label اسم المتغير فقط (مش القيمة) للتشخيص وفترات الراحة.
 */
export function credsFor(provider, section = currentSection()) {
  const out = [];
  for (const n of sectionEnvNames(provider, section)) {
    const key = process.env[n];
    if (key && !isCool(n) && !out.some((c) => c.key === key)) out.push({ key, label: n, shared: false });
  }
  const g = `${PROVIDER_ENV[provider]}_API_KEY`;
  const key = process.env[g];
  if (key && !isCool(g) && sharedAllowed(section) && !out.some((c) => c.key === key)) out.push({ key, label: g, shared: true });
  return out;
}
