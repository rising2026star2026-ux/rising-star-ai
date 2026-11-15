// صفحات الأنظمة في PRD 1.0: ذكاء السوق، إدارة المنتجات، التسويق والمبيعات، استوديو الإنتاج التجاري.
// كل عنصر بيشاور على صفحة أو أداة موجودة وشغالة فعلاً (scripts/test/hubs.test.mjs + scripts/linkaudit.mjs بيتأكدوا).
// الأدوات متنظمة حسب المهمة التجارية، مش حسب التقنية.
export const HUBS = {
  market: {
    title: "ذكاء السوق",
    sub: "اعرف سوقك ومنافسيك قبل ما تصرف: أسعار منشورة بروابطها وتاريخها، ومنافسين، وإعلاناتهم.",
    sections: [
      { title: "الأسعار والمنتجات", items: [
        { href: "/market-check", label: "فحص سوق المنتج", desc: "أسعار المنافسين المنشورة في أمازون مصر ونون وجوميا، وهامشك، ومؤشر الفرصة" },
        { href: "/amazon/competitor", label: "تحليل منافس على أمازون", desc: "شكاوي عملاء المنافس والكلمات الناقصة في صفحته" },
      ] },
      { title: "المنافسين والإعلانات", items: [
        { tool: "adspy" },
        { href: "/feasibility", label: "المنافسين القريبين من موقعك", desc: "من خرائط جوجل داخل دراسة الجدوى" },
      ] },
      { title: "الفرص والقرار", items: [
        { href: "/compare-business", label: "مقارنة الأنشطة", desc: "قارن من نشاطين لخمسة بأرقامك" },
        { href: "/feasibility", label: "دراسة الجدوى", desc: "أرقام السوق مع تعادل واسترداد وسيناريوهات" },
        { tool: "business-ideas" },
      ] },
      { title: "الثقة في البيانات", items: [
        { href: "/data-sources", label: "مصادر البيانات وتاريخها", desc: "كل رقم جاي منين واتجمع إمتى" },
      ] },
    ],
  },
  products: {
    title: "إدارة المنتجات",
    sub: "جهّز منتجاتك واحسب أرباحها: وصف وصور وأسعار وكتالوج.",
    sections: [
      { title: "التسعير والأرباح", items: [
        { href: "/amazon/profit", label: "حاسبة الربح الصافي", desc: "بعد العمولة والشحن والإعلانات والمرتجع والضريبة" },
        { tool: "percent-calc" },
      ] },
      { title: "بيانات المنتج", items: [
        { tool: "product-desc" },
        { href: "/amazon/listing", label: "صفحة منتج أمازون", desc: "عنوان ونقاط ووصف بالعربي والإنجليزي" },
        { href: "/amazon/check", label: "فحص قبول المنتج", desc: "الكلمات والحروف الممنوعة قبل الرفع" },
      ] },
      { title: "صور المنتج والكتالوج", items: [
        { tool: "remove-bg" }, { tool: "image-enhance" }, { tool: "photo-editor" },
        { href: "/catalog", label: "كتالوج في دقيقة", desc: "كل منتجاتك في PDF بزرار طلب واتساب" },
      ] },
    ],
  },
  marketing: {
    title: "التسويق والمبيعات",
    sub: "من الخطة للإعلان للرد على العميل، على مقاس ملف نشاطك.",
    sections: [
      { title: "الخطة", items: [{ tool: "marketing-plan" }, { tool: "content-calendar" }] },
      { title: "الإعلانات", items: [
        { tool: "ad-copy" }, { tool: "landing-page" },
        { href: "/test-ad", label: "اختبر إعلانك", desc: "على 100 عميل افتراضي قبل ما تدفع" },
      ] },
      { title: "المحتوى", items: [
        { tool: "post" }, { tool: "caption" }, { tool: "tiktok-script" },
        { href: "/voice-post", label: "منشورات من تسجيل صوتي", desc: "اتكلم عن منتجك وخد بوست لكل منصة" },
        { tool: "seo-article" },
      ] },
      { title: "المبيعات وخدمة العملاء", items: [
        { tool: "whatsapp-sales" }, { tool: "review-reply" }, { tool: "email-writer" }, { tool: "proposal" },
      ] },
      { title: "مهمة كاملة", items: [
        { href: "/seller", label: "ستوديو البيّاع", desc: "6 مراحل من فحص السوق للنشر" },
        { href: "/seller/agent", label: "وكيل التاجر", desc: "اكتب المهمة وهو يخلّص المراحل" },
      ] },
    ],
  },
  studio: {
    title: "استوديو الإنتاج التجاري",
    sub: "صور ومنشورات وهوية لنشاطك، متنظمة حسب اللي عايز تعمله.",
    sections: [
      { title: "صور المنتجات", items: [
        { href: "/photo-ad", label: "صور استوديو وإعلان من صورة موبايل", desc: "صورة عادية تبقى 6 صور وبوستات وفيديو قصير" },
        { tool: "remove-bg" }, { tool: "image-enhance" }, { tool: "photo-editor" },
      ] },
      { title: "تصميم المنشورات والإعلانات", items: [
        { tool: "poster-maker" },
        { href: "/maker/create", label: "صورة من وصف", desc: "اكتب الفكرة بالعربي وخد صورة" },
      ] },
      { title: "الشعار والهوية", items: [{ tool: "logo-maker" }, { tool: "logo-ideas" }, { tool: "color-extract" }, { tool: "watermark" }] },
    ],
  },
};
