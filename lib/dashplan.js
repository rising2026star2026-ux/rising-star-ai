// لوحة التحكم حسب العميل (PRD 1.0، النظام الأول): الخطوات الجاية بتتحدد من حالة النشاط ونوعه واللي اتحفظ فعلاً.
// مفيش أرقام مبيعات أو أرباح بتظهر هنا: بس خطوات ليها صفحات شغالة.
const STEP = {
  profile: { href: "/brand", label: "كمّل ملف نشاطك", why: "المساعد والجدوى والأدوات بيشتغلوا عليه" },
  compare: { href: "/compare-business", label: "قارن الأفكار اللي في دماغك", why: "من نشاطين لخمسة بأرقامك" },
  feasibility: { href: "/feasibility", label: "ادرس جدوى مشروعك", why: "أرقام السوق مع تعادل واسترداد" },
  feasibilityGo: { href: "/feasibility", label: "كمّل دراسة الجدوى المفتوحة", why: "الافتراضات محفوظة على جهازك" },
  market: { href: "/market-check", label: "افحص سعر منتجك في السوق", why: "أسعار منشورة في أمازون ونون وجوميا" },
  profit: { href: "/amazon/profit", label: "احسب ربحك الصافي", why: "بعد العمولة والشحن والمرتجع" },
  catalog: { href: "/catalog", label: "اعمل كتالوج منتجاتك", why: "PDF بزرار طلب واتساب" },
  photo: { href: "/photo-ad", label: "صوّر منتجك وخد إعلان", why: "صور استوديو من صورة موبايل" },
  plan: { href: "/tool/marketing-plan", label: "اعمل خطة تسويق الشهر", why: "على مقاس نشاطك وميزانيتك" },
  calendar: { href: "/tool/content-calendar", label: "جدول محتوى 30 يوم", why: "منشورات جاهزة لكل يوم" },
  proposal: { href: "/tool/proposal", label: "اكتب عرض سعر لعميل", why: "عرض منظم بشروطك" },
  whatsapp: { href: "/tool/whatsapp-sales", label: "رسائل بيع ومتابعة واتساب", why: "للعملاء الجداد والقدام" },
  reviews: { href: "/tool/review-reply", label: "رد على تقييمات عملائك", why: "ردود مهنية بنبرة نشاطك" },
  test: { href: "/test-ad", label: "اختبر إعلانك قبل ما تدفع", why: "على 100 عميل افتراضي" },
  assistant: { href: "/s/seller", label: "اسأل مساعد الأعمال", why: "على ملف نشاطك ودراساتك" },
};

// لكل نوع نشاط قائم: أهم الخطوات بالترتيب
const BY_KIND = {
  retail: ["market", "photo", "whatsapp", "plan"],
  local: ["whatsapp", "photo", "plan", "reviews"],
  distributor: ["proposal", "whatsapp", "profit", "catalog"],
  ecommerce: ["market", "profit", "photo", "test"],
  maker: ["profit", "catalog", "proposal", "market"],
  food: ["photo", "reviews", "calendar", "test"],
  services: ["proposal", "plan", "reviews", "calendar"],
  home: ["photo", "catalog", "whatsapp", "profit"],
  creator: ["calendar", "test", "plan", "photo"],
  other: ["plan", "market", "whatsapp", "test"],
};

/**
 * الخطوات الجاية (بحد أقصى 4).
 * input: { brand, status, hasStudy, comparisons }
 */
export function nextSteps({ brand = null, status = null, hasStudy = false, comparisons = 0 } = {}) {
  const st = brand?.status || status || "existing";
  const keys = [];
  if (!brand?.name || !brand?.kind) keys.push("profile");
  if (st === "new") {
    if (hasStudy) keys.push("feasibilityGo");
    if (!comparisons) keys.push("compare");
    if (!hasStudy) keys.push("feasibility");
    keys.push("market", "assistant");
  } else {
    if (hasStudy) keys.push("feasibilityGo");
    keys.push(...(BY_KIND[brand?.kind] || BY_KIND.other));
  }
  return [...new Set(keys)].slice(0, 4).map((k) => ({ id: k, ...STEP[k] }));
}

export const STEP_IDS = Object.keys(STEP);
export const stepHref = (id) => STEP[id]?.href;
