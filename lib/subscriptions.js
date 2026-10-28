// بيانات الاشتراكات: أسعار خطط أشهر أدوات الذكاء الاصطناعي.
// الأسعار بالدولار شهرياً كما هي منشورة في أكتوبر 2026 (مصادر منشورة، مش من صفحات الشركات نفسها).
// لتحديث الأسعار: عدّل الرقم هنا وزوّد DATA_VERSION، وبعدها أي مستخدم متابع للأداة هيتنبه لتغيّر السعر.
// الجنيه المصري تقريبي، ومش بيشمل رسوم البنك والضرائب.

export const USD_EGP = 55.9; // سعر البيع في البنك الأهلي 25 أكتوبر 2026 (55.87)
export const PRICES_UPDATED = "2026-10-28";
export const PRICES_UPDATED_AR = "28 أكتوبر 2026";
export const DATA_VERSION = 2;

/** احتياجات المستخدم: المفتاح، الاسم، وصف قصير */
export const NEEDS = [
  { id: "chat", name: "كتابة ومحادثة", desc: "ردود وكتابة ومساعدة يومية" },
  { id: "research", name: "بحث ومذاكرة", desc: "بحث بالمصادر وشرح ومذاكرة" },
  { id: "image", name: "صور", desc: "توليد وتعديل الصور" },
  { id: "video", name: "فيديو", desc: "فيديو من نص أو صورة" },
  { id: "voice", name: "صوت وتعليق", desc: "تعليق صوتي وتحويل نص لكلام" },
  { id: "music", name: "موسيقى وأغاني", desc: "أغاني كاملة من وصف" },
  { id: "code", name: "برمجة", desc: "كتابة وتعديل الكود" },
  { id: "design", name: "تصميم", desc: "بوسترات وسوشيال ميديا" },
  { id: "writing", name: "كتابة وتدقيق", desc: "تدقيق لغوي وكتابة تسويقية" },
  { id: "translate", name: "ترجمة", desc: "ترجمة نصوص وملفات" },
  { id: "slides", name: "عروض تقديمية", desc: "عروض ومستندات من وصف" },
  { id: "avatar", name: "فيديو بمقدّم", desc: "شخص افتراضي بيقدّم الكلام" },
  { id: "meetings", name: "تفريغ اجتماعات", desc: "تسجيل وتلخيص الاجتماعات" },
];

/** مستويات الاستخدام: 1 تجربة وخفيف، 2 منتظم، 3 كثيف واحترافي */
export const LEVELS = [
  { id: 1, name: "خفيف", desc: "كام مرة في الأسبوع" },
  { id: 2, name: "منتظم", desc: "كل يوم تقريباً" },
  { id: 3, name: "كثيف", desc: "شغل يومي طويل أو احترافي" },
];

// plans: usd = السعر الشهري، usdYear = السعر الشهري لو الدفع سنوي (لو معروف)، covers = {الاحتياج: أعلى مستوى بيغطيه}
const P = (name, usd, covers, extra = {}) => ({ name, usd, covers, ...extra });

export const SUB_TOOLS = [
  {
    id: "chatgpt", name: "ChatGPT", maker: "OpenAI", logo: "/logos/openai.webp", url: "https://chatgpt.com/pricing",
    sources: [{ t: "AI Toolbox: ChatGPT pricing (5 أكتوبر 2026)", u: "https://www.ai-toolbox.co/chatgpt-models/chatgpt-pricing" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, image: 1, code: 1 }, { note: "حدود يومية على الصور والبحث العميق" }),
      P("Go", 8, { chat: 2, research: 1, image: 1 }, { note: "سعره بيختلف حسب الدولة، وده السعر المنشور عالمياً. ثبّت سعر مصر من التطبيق" }),
      P("Plus", 20, { chat: 2, research: 2, image: 2, code: 2 }, { note: "أشهر خطة. صور وبحث عميق وبرمجة" }),
      P("Pro 100", 100, { chat: 3, research: 3, image: 3, code: 3 }, { note: "استخدام أعلى بكتير، للشغل الاحترافي" }),
      P("Pro 200", 200, { chat: 3, research: 3, image: 3, code: 3 }, { note: "ضعف حدود Pro 100" }),
    ],
  },
  {
    id: "claude", name: "Claude", maker: "Anthropic", logo: "/logos/claude.webp", url: "https://claude.com/pricing",
    sources: [{ t: "AI Toolbox: Claude pricing (12 أكتوبر 2026)", u: "https://www.ai-toolbox.co/claude-models/claude-pricing-plans-2026" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, code: 1 }, { note: "حدود يومية" }),
      P("Pro", 20, { chat: 2, research: 2, code: 2 }, { usdYear: 17, note: "كتابة وتحليل وبرمجة" }),
      P("Max", 100, { chat: 3, research: 3, code: 3 }, { note: "استخدام أعلى من Pro بمرات (السعر ابتداءً من 100 دولار)" }),
    ],
  },
  {
    id: "gemini", name: "Google AI (Gemini)", maker: "Google", logo: "/logos/gemini.webp", url: "https://one.google.com/about/google-ai-plans/",
    sources: [{ t: "The Decoder: خطط Google AI الجديدة (19 مايو 2026)", u: "https://the-decoder.com/google-overhauls-its-ai-subscriptions-at-i-o-2026-with-three-tiers-starting-at-10-a-month/" }, { t: "DEV: أسعار أدوات الذكاء الاصطناعي (7 أكتوبر 2026)", u: "https://dev.to/mckennachapman/the-ai-tools-worth-paying-for-in-2026-every-price-checked-on-the-day-of-writing-3o24" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, image: 1 }, { note: "حدود يومية" }),
      P("AI Plus", 4.99, { chat: 2, research: 1, image: 1 }, { note: "200 جيجا تخزين وحدود مضاعفة. السعر ده من مصادر أكتوبر 2026 وممكن يختلف حسب الدولة" }),
      P("AI Pro", 19.99, { chat: 2, research: 2, image: 2, video: 1 }, { note: "5 تيرا تخزين، وفيديو بـ Gemini Omni، ومعاها يوتيوب بريميوم لايت" }),
      P("AI Ultra", 99.99, { chat: 3, research: 3, image: 3, video: 3 }, { note: "ابتداءً من 99.99 دولار. استخدام أعلى 20 ضعف" }),
    ],
  },
  {
    id: "perplexity", name: "Perplexity", maker: "Perplexity", logo: "/logos/perplexity.webp", url: "https://www.perplexity.ai/pro",
    sources: [{ t: "Krater: Perplexity pricing (27 سبتمبر 2026)", u: "https://krater.ai/blog/perplexity-pricing" }],
    plans: [
      P("Free", 0, { research: 1, chat: 1 }, { note: "بحث بالمصادر بحد أسبوعي" }),
      P("Pro", 20, { research: 3, chat: 2 }, { usdYear: 17, note: "بحث عميق وكل الموديلات الكبيرة" }),
      P("Max", 200, { research: 3, chat: 3, video: 2 }, { note: "أعلى استخدام وكريدت شهري كبير" }),
    ],
  },
  {
    id: "grok", name: "Grok", maker: "xAI", logo: "/logos/grok.webp", url: "https://grok.com",
    sources: [{ t: "AI Toolbox: Grok pricing (25 أكتوبر 2026)", u: "https://ai-toolbox.co/grok-models/grok-pricing-plans-api-2026" }],
    plans: [
      P("Free", 0, { chat: 1, image: 1 }, { note: "استخدام محدود" }),
      P("Plus", 8, { chat: 2, image: 1 }, { note: "اشتراك X: استخدام أساسي" }),
      P("Premium", 30, { chat: 2, image: 2, video: 2 }, { note: "4 أضعاف Plus، وتوليد فيديو" }),
      P("Super", 100, { chat: 3, image: 3, video: 3 }, { note: "فيديو 1080p وأولوية وقت الزحمة" }),
    ],
  },
  {
    id: "midjourney", name: "Midjourney", maker: "Midjourney", logo: "/logos/midjourney.webp", url: "https://www.midjourney.com",
    sources: [{ t: "Krater: Midjourney pricing (27 سبتمبر 2026)", u: "https://krater.ai/blog/midjourney-pricing" }],
    plans: [
      P("Basic", 10, { image: 2 }, { usdYear: 8, note: "200 دقيقة سريعة في الشهر، من غير وضع Relax" }),
      P("Standard", 30, { image: 3, video: 1 }, { usdYear: 24, note: "15 ساعة سريعة وصور غير محدودة في Relax" }),
      P("Pro", 60, { image: 3, video: 2 }, { usdYear: 48, note: "30 ساعة سريعة وفيديو SD غير محدود في Relax" }),
      P("Mega", 120, { image: 3, video: 3 }, { usdYear: 96, note: "60 ساعة سريعة" }),
    ],
  },
  {
    id: "runway", name: "Runway", maker: "Runway", logo: "/logos/runway.webp", url: "https://runwayml.com/pricing",
    sources: [{ t: "Creatify: Runway pricing 2026", u: "https://creatify.ai/blog/runway-pricing-(2026)-plans-credits-and-what-you-ll-actually-pay" }],
    plans: [
      P("Free", 0, { video: 1 }, { note: "125 كريدت مرة واحدة بس" }),
      P("Standard", 15, { video: 2 }, { note: "السعر لو الدفع سنوي. رصيد الكريدت لازم تتأكد منه من الموقع" }),
      P("Pro", 35, { video: 3 }, { usdYear: 28, note: "رصيد أكبر. تأكد من الكريدت من الموقع" }),
      P("Max", 95, { video: 3 }, { usdYear: 76, note: "توليد غير محدود في الوضع البطيء" }),
    ],
  },
  {
    id: "elevenlabs", name: "ElevenLabs", maker: "ElevenLabs", logo: "/logos/elevenlabs.webp", url: "https://elevenlabs.io/pricing",
    sources: [{ t: "Smallest.ai: ElevenLabs pricing (5 أكتوبر 2026)", u: "https://smallest.ai/blog/elevenlabs-pricing-plans-cost-what-you-get-in-2026" }],
    plans: [
      P("Free", 0, { voice: 1 }, { note: "10 آلاف كريدت، ومن غير ترخيص تجاري" }),
      P("Starter", 6, { voice: 1 }, { note: "30 ألف كريدت مع ترخيص تجاري" }),
      P("Creator", 22, { voice: 2 }, { note: "121 ألف كريدت" }),
      P("Pro", 99, { voice: 3 }, { note: "600 ألف كريدت" }),
    ],
  },
  {
    id: "suno", name: "Suno", maker: "Suno", logo: "/logos/suno.webp", url: "https://suno.com",
    sources: [{ t: "Krater: Suno pricing (أكتوبر 2026)", u: "https://krater.ai/pricing/suno" }],
    plans: [
      P("Free", 0, { music: 1 }, { note: "50 كريدت يومياً (حوالي 10 أغاني) ومن غير استخدام تجاري" }),
      P("Pro", 10, { music: 2 }, { usdYear: 8, note: "2,500 كريدت في الشهر مع استخدام تجاري" }),
      P("Premier", 30, { music: 3 }, { usdYear: 24, note: "10,000 كريدت في الشهر" }),
    ],
  },
  {
    id: "cursor", name: "Cursor", maker: "Anysphere", logo: "/logos/cursor.webp", url: "https://cursor.com/pricing",
    sources: [{ t: "Krater: Cursor pricing (3 أكتوبر 2026)", u: "https://krater.ai/blog/cursor-pricing" }],
    plans: [
      P("Hobby", 0, { code: 1 }, { note: "مجاني ومحدود" }),
      P("Pro", 20, { code: 2 }, { note: "حوالي 20 دولار استخدام موديلات خارجية" }),
      P("Pro+", 60, { code: 3 }, { note: "حوالي 70 دولار استخدام" }),
      P("Ultra", 200, { code: 3 }, { note: "حوالي 400 دولار استخدام" }),
    ],
  },
  {
    id: "canva", name: "Canva", maker: "Canva", logo: null, tint: "#00a3ad", mono: "Ca", url: "https://www.canva.com/pricing",
    sources: [{ t: "Piktochart: Canva pricing (25 أغسطس 2026)", u: "https://piktochart.com/blog/canva-pricing-2026-costs-raised/" }],
    plans: [
      P("Free", 0, { design: 2 }, { note: "قوالب كتير ومجانية" }),
      P("Pro", 18, { design: 3, image: 1 }, { usdYear: 15, note: "قوالب وأدوات بريميوم وأدوات ذكاء اصطناعي" }),
    ],
  },
  // ====== أدوات اتضافت 28 أكتوبر 2026 ======
  {
    id: "deepseek", name: "DeepSeek", maker: "DeepSeek", logo: "/logos/deepseek.webp", url: "https://chat.deepseek.com",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [P("Free", 0, { chat: 2, research: 1, code: 2 }, { note: "الشات مجاني بالكامل. الدفع للـ API بس" })],
  },
  {
    id: "copilot", name: "Microsoft Copilot", maker: "Microsoft", logo: "/logos/copilot.webp", url: "https://www.microsoft.com/microsoft-365/copilot",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1, image: 1 }, { note: "استخدام محدود على الويب والتطبيق" }),
      P("Microsoft 365 Personal", 9.99, { chat: 2, research: 1, image: 1, writing: 2 }, { note: "Copilot جوه Word وExcel وPowerPoint ومعاه 1 تيرا تخزين" }),
    ],
  },
  {
    id: "mistral", name: "Le Chat", maker: "Mistral AI", logo: "/logos/mistral.webp", url: "https://mistral.ai/pricing",
    sources: [{ t: "CostBench: Le Chat (اتراجع 30 سبتمبر 2026)", u: "https://costbench.com/software/ai-chatbots/le-chat-mistral/" }],
    plans: [
      P("Free", 0, { chat: 1, research: 1 }, { note: "حدود على الرفع والمهام المجدولة" }),
      P("Pro", 14.99, { chat: 2, research: 2, code: 2 }, { note: "ومعاه Vibe للبرمجة. للطلبة 5.99 دولار" }),
    ],
  },
  {
    id: "githubcopilot", name: "GitHub Copilot", maker: "GitHub", logo: "/logos/githubcopilot.webp", url: "https://github.com/features/copilot/plans",
    sources: [{ t: "DEV: أسعار أدوات الذكاء الاصطناعي (7 أكتوبر 2026)", u: "https://dev.to/mckennachapman/the-ai-tools-worth-paying-for-in-2026-every-price-checked-on-the-day-of-writing-3o24" }],
    plans: [
      P("Free", 0, { code: 1 }, { note: "عدد محدود من الإكمال والشات في الشهر" }),
      P("Pro", 10, { code: 2 }, { note: "أرخص مساعد برمجة مدفوع" }),
      P("Pro+", 39, { code: 3 }, { note: "موديلات أقوى وطلبات أكتر" }),
      P("Max", 100, { code: 3 }, { note: "أعلى استخدام" }),
    ],
  },
  {
    id: "windsurf", name: "Windsurf", maker: "Windsurf", logo: "/logos/windsurf.webp", url: "https://windsurf.com/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { code: 1 }, { note: "استخدام محدود" }),
      P("Pro", 20, { code: 2 }),
      P("Max", 200, { code: 3 }),
    ],
  },
  {
    id: "replit", name: "Replit", maker: "Replit", logo: "/logos/replit.webp", url: "https://replit.com/pricing",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }],
    plans: [
      P("Starter", 0, { code: 1 }, { note: "تجربة محدودة لوكيل البرمجة" }),
      P("Core", 25, { code: 2 }, { usdYear: 20, note: "اعمل تطبيقات كاملة من وصف وانشرها" }),
      P("Pro", 100, { code: 3 }, { usdYear: 95 }),
    ],
  },
  {
    id: "lovable", name: "Lovable", maker: "Lovable", logo: "/logos/lovable.webp", url: "https://lovable.dev/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { code: 1, design: 1 }, { note: "5 رسايل في اليوم" }),
      P("Pro", 25, { code: 2, design: 2 }, { note: "مواقع وتطبيقات من غير برمجة" }),
      P("Business", 50, { code: 3, design: 2 }),
    ],
  },
  {
    id: "bolt", name: "Bolt.new", maker: "StackBlitz", logo: null, tint: "#1389fd", mono: "Bo", url: "https://bolt.new/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { code: 1 }, { note: "مليون توكن في الشهر" }),
      P("Pro", 25, { code: 2, design: 1 }),
    ],
  },
  {
    id: "v0", name: "v0", maker: "Vercel", logo: "/logos/v0.webp", url: "https://v0.app/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { code: 1, design: 1 }, { note: "رصيد شهري صغير" }),
      P("Plus", 30, { code: 2, design: 2 }, { note: "واجهات ومواقع من وصف" }),
    ],
  },
  {
    id: "leonardo", name: "Leonardo AI", maker: "Canva", logo: null, tint: "#7c3aed", mono: "Le", url: "https://leonardo.ai/pricing",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }],
    plans: [
      P("Free", 0, { image: 1 }, { note: "توكنز يومية محدودة" }),
      P("Apprentice", 12, { image: 2 }),
      P("Artisan Unlimited", 30, { image: 3, video: 1 }, { note: "صور غير محدودة في الوضع البطيء" }),
      P("Maestro Unlimited", 60, { image: 3, video: 2 }),
    ],
  },
  {
    id: "ideogram", name: "Ideogram", maker: "Ideogram", logo: "/logos/ideogram.webp", url: "https://ideogram.ai/pricing",
    sources: [{ t: "eesel: Ideogram pricing (5 يونيو 2026)", u: "https://eesel.ai/blog/ideogram-pricing" }],
    plans: [
      P("Free", 0, { image: 1 }, { note: "10 صور بطيئة في الأسبوع، والصور بتبقى عامة" }),
      P("Plus", 20, { image: 2, design: 2 }, { usdYear: 15, note: "الأقوى في كتابة نص جوه الصورة" }),
      P("Pro", 60, { image: 3, design: 3 }, { usdYear: 42 }),
    ],
  },
  {
    id: "firefly", name: "Adobe Firefly", maker: "Adobe", logo: "/logos/adobefirefly.webp", url: "https://www.adobe.com/products/firefly/plans.html",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }, { t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { image: 1 }, { note: "رصيد محدود" }),
      P("Standard", 9.99, { image: 2, video: 1 }, { note: "صور آمنة للاستخدام التجاري" }),
      P("Pro", 19.99, { image: 2, video: 2, design: 1 }),
      P("Pro Plus", 49.99, { image: 3, video: 2, design: 2 }),
    ],
  },
  {
    id: "recraft", name: "Recraft", maker: "Recraft", logo: "/logos/recraft.webp", url: "https://www.recraft.ai/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { image: 1, design: 1 }, { note: "رصيد يومي، والصور عامة" }),
      P("Basic", 12, { image: 2, design: 2 }, { usdYear: 10, note: "لوجوهات وأيقونات وصور فيكتور" }),
      P("Pro", 20, { image: 3, design: 3 }, { note: "السعر ابتداءً من 20 دولار" }),
    ],
  },
  {
    id: "kling", name: "Kling AI", maker: "Kuaishou", logo: "/logos/kling.webp", url: "https://klingai.com",
    sources: [{ t: "eesel: Kling AI pricing (5 يونيو 2026)", u: "https://www.eesel.ai/en/blog/kling-ai-pricing" }],
    plans: [
      P("Free", 0, { video: 1 }, { note: "66 كريدت في اليوم" }),
      P("Standard", 10, { video: 2 }, { usdYear: 6.6, note: "660 كريدت في الشهر" }),
      P("Pro", 37, { video: 3 }, { usdYear: 24.42, note: "3000 كريدت في الشهر" }),
      P("Premier", 92, { video: 3 }, { usdYear: 60.72, note: "8000 كريدت في الشهر" }),
    ],
  },
  {
    id: "hailuo", name: "Hailuo AI", maker: "MiniMax", logo: "/logos/hailuo.webp", url: "https://hailuoai.video",
    sources: [{ t: "CostBench: Pika مقابل Hailuo (أكتوبر 2026)", u: "https://costbench.com/compare/hailuo-ai-vs-pika/" }],
    plans: [
      P("Free", 0, { video: 1 }, { note: "كريدت يومي مجاني" }),
      P("Creator", 7.99, { video: 2 }, { note: "المصادر مختلفة على الأسعار، فاتأكد من الموقع" }),
      P("Fancy", 24.99, { video: 3 }),
      P("Master", 63.99, { video: 3 }),
    ],
  },
  {
    id: "pika", name: "Pika", maker: "Pika Labs", logo: "/logos/pika.webp", url: "https://pika.art/pricing",
    sources: [{ t: "CostBench: Pika مقابل Hailuo (أكتوبر 2026)", u: "https://costbench.com/compare/hailuo-ai-vs-pika/" }],
    plans: [
      P("Starter", 10, { video: 2 }, { note: "مفيش خطة مجانية" }),
      P("Creator", 35, { video: 3 }),
      P("Fancy", 95, { video: 3 }),
    ],
  },
  {
    id: "luma", name: "Luma Dream Machine", maker: "Luma AI", logo: "/logos/luma.webp", url: "https://lumalabs.ai/pricing",
    sources: [{ t: "CostBench: Luma (اتراجع 18 أغسطس 2026)", u: "https://costbench.com/software/ai-video-generators/luma-dream-machine/" }],
    plans: [
      P("Standard", 30, { video: 2, image: 2 }, { note: "120 توليد في الشهر. المصادر مختلفة على الأسعار، فاتأكد من الموقع" }),
      P("Pro", 90, { video: 3, image: 3 }, { note: "400 توليد في الشهر" }),
    ],
  },
  {
    id: "capcut", name: "CapCut", maker: "ByteDance", logo: "/logos/capcut.webp", url: "https://www.capcut.com/pricing",
    sources: [{ t: "eesel: CapCut pricing (اتعدّل 20 مايو 2026)", u: "https://eesel.ai/blog/capcut-pricing" }],
    plans: [
      P("Free", 0, { video: 1, design: 1 }, { note: "مونتاج كامل بعلامة مائية على بعض الأدوات" }),
      P("Standard", 9.99, { video: 2, design: 1 }),
      P("Pro", 19.99, { video: 3, design: 2, voice: 1 }, { usdYear: 15, note: "الاشتراك من الموقع غالباً أرخص من المتجر" }),
    ],
  },
  {
    id: "heygen", name: "HeyGen", maker: "HeyGen", logo: null, tint: "#7559ff", mono: "He", url: "https://www.heygen.com/pricing",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }],
    plans: [
      P("Free", 0, { avatar: 1, video: 1 }, { note: "فيديوهات قصيرة بعلامة مائية" }),
      P("Creator", 29, { avatar: 2, video: 2, voice: 1 }, { note: "مقدّم افتراضي بيتكلم عربي" }),
      P("Pro", 49, { avatar: 3, video: 2, voice: 2 }),
      P("Business", 149, { avatar: 3, video: 3, voice: 2 }),
    ],
  },
  {
    id: "synthesia", name: "Synthesia", maker: "Synthesia", logo: null, tint: "#2f3cff", mono: "Sy", url: "https://www.synthesia.io/pricing",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }],
    plans: [
      P("Basic", 0, { avatar: 1 }, { note: "دقايق مجانية قليلة" }),
      P("Starter", 29, { avatar: 2, video: 1 }),
      P("Creator", 89, { avatar: 3, video: 2 }),
    ],
  },
  {
    id: "descript", name: "Descript", maker: "Descript", logo: null, tint: "#00b37e", mono: "De", url: "https://www.descript.com/pricing",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }],
    plans: [
      P("Free", 0, { video: 1, voice: 1, meetings: 1 }, { note: "ساعة تفريغ في الشهر" }),
      P("Hobbyist", 24, { video: 2, voice: 2, meetings: 2 }, { usdYear: 16, note: "مونتاج الفيديو بتعديل النص" }),
      P("Creator", 35, { video: 3, voice: 3, meetings: 2 }, { usdYear: 24 }),
    ],
  },
  {
    id: "udio", name: "Udio", maker: "Udio", logo: "/logos/udio.webp", url: "https://www.udio.com/pricing",
    sources: [{ t: "CostBench: Udio (اتراجع 13 يوليو 2026)", u: "https://costbench.com/software/ai-music-generators/udio/" }],
    plans: [
      P("Free", 0, { music: 1 }, { note: "3 أغاني قصيرة في اليوم" }),
      P("Standard", 10, { music: 2 }, { usdYear: 8, note: "اتأكد من حقوق التحميل والاستخدام التجاري قبل الدفع" }),
      P("Pro", 30, { music: 3 }, { usdYear: 24 }),
    ],
  },
  {
    id: "gamma", name: "Gamma", maker: "Gamma", logo: null, tint: "#8a4dff", mono: "Ga", url: "https://gamma.app/pricing",
    sources: [{ t: "DEV: أسعار أدوات الذكاء الاصطناعي (7 أكتوبر 2026)", u: "https://dev.to/mckennachapman/the-ai-tools-worth-paying-for-in-2026-every-price-checked-on-the-day-of-writing-3o24" }],
    plans: [
      P("Free", 0, { slides: 1 }, { note: "رصيد بداية محدود" }),
      P("Plus", 9, { slides: 2 }, { note: "سعر الشهر لو الدفع سنوي" }),
      P("Pro", 18, { slides: 3, design: 1 }, { note: "سعر الشهر لو الدفع سنوي" }),
    ],
  },
  {
    id: "grammarly", name: "Grammarly", maker: "Grammarly", logo: null, tint: "#15c39a", mono: "Gm", url: "https://www.grammarly.com/plans",
    sources: [{ t: "AI Compare: أسعار 30 أداة (19 أغسطس 2026)", u: "https://aicompare.tech/ai-pricing-comparison/" }],
    plans: [
      P("Free", 0, { writing: 1 }, { note: "للإنجليزي بس" }),
      P("Pro", 30, { writing: 3 }, { usdYear: 12, note: "تدقيق وإعادة صياغة بالإنجليزي. السنوي أرخص بكتير" }),
    ],
  },
  {
    id: "quillbot", name: "QuillBot", maker: "Learneo", logo: null, tint: "#499557", mono: "Qb", url: "https://quillbot.com/premium",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { writing: 1 }, { note: "إعادة صياغة بحد كلمات" }),
      P("Premium", 8.33, { writing: 2 }, { note: "السعر ابتداءً من 8.33 دولار" }),
    ],
  },
  {
    id: "jasper", name: "Jasper", maker: "Jasper", logo: null, tint: "#ff5a5f", mono: "Ja", url: "https://www.jasper.ai/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [P("Pro", 69, { writing: 3, chat: 2 }, { note: "كتابة تسويقية بصوت البراند، للفرد" })],
  },
  {
    id: "notion", name: "Notion AI", maker: "Notion", logo: "/logos/notion.webp", url: "https://www.notion.com/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { writing: 1 }, { note: "تجربة محدودة للذكاء الاصطناعي" }),
      P("Business", 24, { writing: 2, chat: 2, meetings: 2, research: 1 }, { usdYear: 20, note: "Notion AI كامل وتلخيص الاجتماعات" }),
    ],
  },
  {
    id: "deepl", name: "DeepL", maker: "DeepL", logo: "/logos/deepl.webp", url: "https://www.deepl.com/pro",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { translate: 1 }, { note: "حد على حجم النص والملفات" }),
      P("Individual", 8.74, { translate: 3, writing: 1 }, { note: "سعر الشهر لو الدفع سنوي" }),
    ],
  },
  {
    id: "otter", name: "Otter.ai", maker: "Otter.ai", logo: null, tint: "#2563eb", mono: "Ot", url: "https://otter.ai/pricing",
    sources: [{ t: "ToolChase: أسعار أدوات الذكاء الاصطناعي (اتراجعت أكتوبر 2026)", u: "https://toolchase.com/blog/ai-tools-pricing-2026-comparison/" }],
    plans: [
      P("Free", 0, { meetings: 1 }, { note: "دقايق محدودة، وبيدعم الإنجليزي أساساً" }),
      P("Pro", 16.99, { meetings: 2 }),
      P("Business", 30, { meetings: 3 }),
    ],
  },
];

/** سجل تغيّرات الأسعار الموثّقة (الأحدث أولاً) */
export const PRICE_CHANGES = [
  { date: "2026-10-25", tool: "Grok", text: "xAI دمجت SuperGrok في اشتراكات X: Plus بـ 8 دولار، Premium بـ 30، Super بـ 100، Ultra بـ 200. الخطط القديمة مقفولة قدام العملاء الجداد.", href: "https://ai-toolbox.co/grok-models/grok-pricing-plans-api-2026" },
  { date: "2026-10-05", tool: "ChatGPT", text: "خطة Pro بقت 3 مستويات: 100 و200 و500 دولار، وفي خطة Go رخيصة سعرها بيختلف حسب الدولة.", href: "https://www.ai-toolbox.co/chatgpt-models/chatgpt-pricing" },
  { date: "2026-05-19", tool: "Google AI", text: "جوجل أعادت تنظيم الخطط: AI Plus بـ 7.99، وAI Pro بـ 19.99، وAI Ultra ابتداءً من 99.99 دولار (كانت الخطة العليا 250 وبقت 200).", href: "https://the-decoder.com/google-overhauls-its-ai-subscriptions-at-i-o-2026-with-three-tiers-starting-at-10-a-month/" },
];

export const toEgp = (usd) => Math.round(usd * USD_EGP);
export const fmtEgp = (usd) => (usd === 0 ? "مجاني" : `${toEgp(usd).toLocaleString("en-US")} ج`);
export const fmtUsd = (usd) => (usd === 0 ? "0" : `$${Number.isInteger(usd) ? usd : usd.toFixed(2)}`);

/** كل الخيارات في قايمة واحدة للحاسبة: {tool, plan, usd, covers} */
export const ALL_OPTIONS = SUB_TOOLS.flatMap((t) => t.plans.map((p) => ({ toolId: t.id, tool: t.name, logo: t.logo, plan: p.name, usd: p.usd, covers: p.covers })));

/** صورة الأسعار الحالية للمتابعة: {toolId: {planName: usd}} */
export function priceSnapshot() {
  const o = {};
  for (const t of SUB_TOOLS) { o[t.id] = {}; for (const p of t.plans) o[t.id][p.name] = p.usd; }
  return o;
}

/** أقل تكلفة لمجموعة اشتراكات تغطي الاحتياجات بالمستوى المطلوب (حل exact بالـ DP على الأقنعة) */
export function cheapestBundle(needIds, level) {
  const idx = needIds.map((n) => n);
  const full = (1 << idx.length) - 1;
  if (!full) return { picks: [], total: 0, uncovered: [] };
  const maskOf = (o) => idx.reduce((m, n, i) => (o.covers[n] >= level ? m | (1 << i) : m), 0);
  const opts = ALL_OPTIONS.map((o) => ({ o, m: maskOf(o) })).filter((x) => x.m);
  const INF = Infinity;
  const best = Array(full + 1).fill(INF);
  const from = Array(full + 1).fill(null);
  best[0] = 0;
  // مرور على كل الأقنعة مرتين كفاية لأن التكلفة موجبة، ونمنع اختيار أكتر من خطة من نفس الأداة
  for (let m = 0; m <= full; m++) {
    if (best[m] === INF) continue;
    for (const x of opts) {
      const nm = m | x.m;
      if (nm === m) continue;
      let used = false;
      for (let cur = from[m]; cur; cur = cur.prev) if (cur.opt.toolId === x.o.toolId) { used = true; break; }
      if (used) continue;
      const c = best[m] + x.o.usd;
      if (c < best[nm]) { best[nm] = c; from[nm] = { opt: x.o, prev: from[m] }; }
    }
  }
  const picks = [];
  if (best[full] === INF) {
    // مفيش خطة بتغطي كل الاحتياجات بالمستوى ده: نرجّع أحسن تغطية جزئية
    let bm = 0, bc = INF;
    for (let m = 0; m <= full; m++) {
      if (best[m] === INF) continue;
      const pc = popcount(m);
      if (pc > popcount(bm) || (pc === popcount(bm) && best[m] < bc)) { bm = m; bc = best[m]; }
    }
    for (let cur = from[bm]; cur; cur = cur.prev) picks.push(cur.opt);
    const uncovered = idx.filter((_, i) => !(bm & (1 << i)));
    return { picks: picks.reverse(), total: bc === INF ? 0 : bc, uncovered };
  }
  for (let cur = from[full]; cur; cur = cur.prev) picks.push(cur.opt);
  return { picks: picks.reverse(), total: best[full], uncovered: [] };
}

function popcount(n) { let c = 0; while (n) { c += n & 1; n >>= 1; } return c; }

/** أرخص 3 خيارات لاحتياج واحد بمستوى معين (للبدائل) */
export function alternativesFor(need, level, limit = 3) {
  return ALL_OPTIONS.filter((o) => o.covers[need] >= level).sort((a, b) => a.usd - b.usd).slice(0, limit);
}
