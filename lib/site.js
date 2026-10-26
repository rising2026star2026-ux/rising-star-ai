// رابط الموقع الأساسي: بيستخدم في جوجل وخريطة الموقع وتوقيع المشاركة.
// على Vercel ضيف NEXT_PUBLIC_SITE_URL بالدومين بتاعك (مثلاً https://risingstar.ai).
// لو مش موجود، بيستخدم رابط Vercel تلقائياً.
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || fromVercel || "http://localhost:3000").replace(/\/+$/, "");
export const BRAND = "Rising StarAi";
