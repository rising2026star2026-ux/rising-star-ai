// تصنيف الأدوات التجارية في 8 مجموعات (Rising Business). كل أداة ظاهرة لازم تتحط في مجموعة واحدة بس
// (scripts/test/bizgroups.test.mjs بيتأكد). صفحات المنصة (مقارنة، جدوى، سوق…) بتظهر كروابط جوه مجموعتها.
export const BIZ_GROUPS = [
  { id: "manage", name: "إدارة النشاط التجاري", glyph: "briefcase", desc: "خطة عمل، أفكار مشروعات، عروض، جداول وقراءة المستندات والفواتير.",
    tools: ["business-plan", "business-ideas", "proposal", "sheet-analyst", "image-reader", "image-to-text", "number-words"], links: [{ href: "/brand", label: "ملف النشاط" }, { href: "/my-work", label: "مشروعاتي" }] },
  { id: "market", name: "ذكاء السوق وتحليل المنافسين", glyph: "chart", desc: "فحص السوق والمنافسين وإعلاناتهم.",
    tools: ["adspy"], links: [{ href: "/market-check", label: "فحص السوق" }, { href: "/amazon/competitor", label: "تحليل منافس أمازون" }, { href: "/survey", label: "استبيان العملاء" }] },
  { id: "feasibility", name: "مقارنة الأنشطة ودراسة الجدوى", glyph: "chart", desc: "قارن الفرص وادرس مشروعك بأرقام محسوبة.",
    tools: [], links: [{ href: "/compare-business", label: "مقارنة الأنشطة" }, { href: "/feasibility", label: "دراسة الجدوى" }] },
  { id: "products", name: "المنتجات والتسعير", glyph: "cart", desc: "وصف المنتجات وصورها، الأرباح والأسعار والكتالوج.",
    tools: ["product-desc", "photo-editor", "remove-bg", "image-enhance", "percent-calc", "image-resize", "image-compress", "image-convert"], links: [{ href: "/amazon/profit", label: "حاسبة الربح" }, { href: "/catalog", label: "كتالوج في دقيقة" }, { href: "/amazon/listing", label: "صفحة منتج أمازون" }, { href: "/amazon/check", label: "فحص قبول المنتج" }] },
  { id: "marketing", name: "التسويق والإعلانات", glyph: "megaphone", desc: "إعلانات وصفحات هبوط وخطط تسويق.",
    tools: ["ad-copy", "landing-page", "seo-article", "marketing-plan", "qr-code"], links: [{ href: "/test-ad", label: "اختبر إعلانك" }, { href: "/photo-ad", label: "إعلان من صورة" }] },
  { id: "content", name: "صناعة المحتوى التجاري", glyph: "pen", desc: "منشورات وسكربتات وتقويم محتوى وأفكار صور وفيديو.",
    tools: ["post", "caption", "tiktok-script", "youtube-title", "content-calendar", "image-prompt", "video-prompt"], links: [{ href: "/voice-post", label: "منشورات من تسجيل صوتي" }, { href: "/maker", label: "صانع الصور والفيديو" }, { href: "/prompts/studio", label: "استوديو البرومبتات" }] },
  { id: "identity", name: "الهوية والتصميم", glyph: "palette", desc: "لوجو وبوستر وألوان نشاطك وعلامته على الصور.",
    tools: ["logo-maker", "logo-ideas", "poster-maker", "watermark", "color-extract", "images-to-pdf"], links: [] },
  { id: "sales", name: "المبيعات وخدمة العملاء", glyph: "mail", desc: "ردود واتساب وإيميلات وتقييمات العملاء.",
    tools: ["whatsapp-sales", "review-reply", "email-writer", "email-reply"], links: [{ href: "/seller/agent", label: "وكيل التاجر" }] },
];

const BY_TOOL = Object.fromEntries(BIZ_GROUPS.flatMap((g) => g.tools.map((t) => [t, g.id])));
export const groupOf = (toolId) => BY_TOOL[toolId] || "manage";
export const GROUP_BY_ID = Object.fromEntries(BIZ_GROUPS.map((g) => [g.id, g]));
