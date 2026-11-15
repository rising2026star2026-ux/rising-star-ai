// رابط الموقع الأساسي: بيستخدم في جوجل وخريطة الموقع وتوقيع المشاركة.
// على Vercel ضيف NEXT_PUBLIC_SITE_URL بالدومين بتاعك (مثلاً https://risingbusiness.ai).
// لو مش موجود، بيستخدم رابط Vercel تلقائياً.
const fromVercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || fromVercel || "http://localhost:3000").replace(/\/+$/, "");
export const BRAND = "Rising Business";
// الوصف الموحد للمنصة (الشاشة الافتتاحية، العناوين، Metadata)
export const TAGLINE = "مساحة عمل التاجر وصاحب النشاط، بالعربي";
export const AUDIENCE = ["التجار وأصحاب المحلات", "المصنّعين والورش", "الموزعين وتجار الجملة", "المتاجر الإلكترونية", "صناع المحتوى التجاري", "الشركات الصغيرة والخدمات"];
export const SITE_DESCRIPTION = "منصة عربية للتجار وأصحاب الأنشطة والمصنّعين والموزعين والمتاجر الإلكترونية وصناع المحتوى التجاري: مقارنة أنشطة، دراسة جدوى بأرقام محسوبة، ملف نشاط، مساعد أعمال، وأدوات للمنتجات والتسويق والمبيعات.";
