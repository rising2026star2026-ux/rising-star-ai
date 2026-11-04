// الاختيارات الـ6 اللي المستخدم بيختار منها في الشات (وبتستخدمها الأدوات كمان).
//
// نوفمبر 2026: شلنا GPT-OSS (120B و20B) من الموقع كله لأنه بيخترع معلومات بثقة في الأسئلة الواقعية بالعربي.
// الترتيب دلوقتي: Gemini Flash الأول (مفتاح GEMINI_API_KEY، أقوى بكتير في المعلومات والعربي)،
// وبعده موديلات Groq المفتوحة التانية (GROQ_IDS) لو حصة Gemini خلصت، وفي الآخر الطبقات الاحتياطية المشتركة.
// Groq بيغيّر الموديلات المتاحة كل فترة: لو موديل اتقفل الموقع بيعدّي عليه للي بعده تلقائياً.
//
// lead:   أول موديلات بتتجرب للاختيار ده (قبل Groq)
// id:     موديل Groq الأساسي للاختيار ده لو Gemini مش متاح
// effort: قد إيه الموديل يفكر قبل ما يرد (low سريع، medium أدق، high أعمق وأبطأ)
// hint:   توجيه إضافي بيتبعت مع الموديل ده بس
// tier:   free متاح للكل، pro للباقات المدفوعة (لما نضيف الاشتراكات)

export const GEMINI_STRONG = process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest";
export const GEMINI_FAST = process.env.GEMINI_MODEL || "gemini-flash-lite-latest";
const G = (id) => ({ id, effort: null, provider: "gemini" });

export const MODEL_OPTIONS = [
  {
    key: "fusion",
    id: "moonshotai/kimi-k2-instruct-0905",
    lead: [G(GEMINI_STRONG), G(GEMINI_FAST)],
    effort: "medium",
    name: "دمج 4 نماذج",
    tagline: "أقوى إجابة",
    desc: "سؤالك بيروح لـ 4 نماذج قوية مع بعض، وبيتجمع منهم رد واحد أدق، ومتدقق لغوياً.",
    icon: "✨",
    tier: "free",
    fusion: true,
  },
  {
    key: "balanced",
    id: "moonshotai/kimi-k2-instruct-0905",
    lead: [G(GEMINI_STRONG), G(GEMINI_FAST)],
    effort: "low",
    name: "متوازن",
    tagline: "الأفضل للاستخدام اليومي",
    desc: "جودة عالية وسرعة كويسة. ابدأ بيه لو مش عارف تختار.",
    icon: "⚖️",
    tier: "free",
  },
  {
    key: "fast",
    id: "llama-3.3-70b-versatile",
    lead: [G(GEMINI_FAST)],
    effort: "low",
    name: "سريع جداً",
    tagline: "رد فوري",
    desc: "أسرع اختيار. للأسئلة القصيرة والتلخيص والترجمة السريعة.",
    icon: "⚡",
    tier: "free",
  },
  {
    key: "strong",
    id: "moonshotai/kimi-k2-instruct-0905",
    lead: [G(GEMINI_STRONG), G(GEMINI_FAST)],
    effort: "medium",
    name: "قوي",
    tagline: "للمهام الصعبة",
    desc: "بيفكر أكتر قبل ما يرد. للتحليل والنصوص الطويلة والكتابة الاحترافية.",
    icon: "🏆",
    tier: "free",
  },
  {
    key: "thinking",
    id: "qwen/qwen3-32b",
    lead: [G(GEMINI_STRONG), G(GEMINI_FAST)],
    effort: "high",
    name: "تفكير عميق",
    tagline: "بيفكر خطوة بخطوة",
    desc: "للمسائل والرياضيات والمنطق. أبطأ شوية لكن أدق في الحل.",
    icon: "🧠",
    tier: "free",
  },
  {
    key: "coding",
    id: "moonshotai/kimi-k2-instruct-0905",
    lead: [],
    effort: "medium",
    name: "برمجة",
    tagline: "للأكواد والتقنية",
    desc: "مضبوط لكتابة الكود وتصحيح الأخطاء وشرح البرمجة.",
    icon: "💻",
    tier: "free",
    hint: "أنت مبرمج خبير. اكتب كوداً كاملاً قابلاً للتشغيل داخل كتل كود مع اسم اللغة، واشرح بالعربي باختصار. نبّه لأي مشكلة أمان.",
  },
  {
    key: "arabic",
    id: "qwen/qwen3.8-27b",
    lead: [G(GEMINI_STRONG), G(GEMINI_FAST)],
    effort: null,
    name: "عربي متقدم",
    tagline: "صياغة عربية أدق",
    desc: "للفصحى والصياغة الأدبية والترجمة. لو مش متاح، بيرد المتوازن بداله.",
    icon: "🕌",
    tier: "free",
    hint: "اهتم جداً بسلامة اللغة العربية: النحو والإملاء وعلامات الترقيم واختيار الألفاظ الدقيقة.",
  },
];

export const DEFAULT_MODEL_KEY = "fusion";

export const getModel = (key) =>
  MODEL_OPTIONS.find((m) => m.key === key) || MODEL_OPTIONS.find((m) => m.key === DEFAULT_MODEL_KEY);

// موديلات Groq بالترتيب (بعد Gemini). من غير GPT-OSS
export const GROQ_IDS = [
  "moonshotai/kimi-k2-instruct-0905",
  "llama-3.3-70b-versatile",
  "qwen/qwen3.8-27b",
  "meta-llama/llama-4-maverick-17b-128e-instruct",
  "qwen/qwen3-32b",
  "llama-3.1-8b-instant",
];
// اسم قديم لنفس القايمة (مستخدم في أماكن تانية)
export const FALLBACK_IDS = GROQ_IDS;

// طبقة احتياطية اختيارية من OpenRouter (openrouter.ai) — بتشتغل بس لو حطيت
// OPENROUTER_API_KEY في إعدادات Vercel. المستخدم مش بيحس بيها خالص؛ هي بس
// بتزوّد عدد المحاولات لو Groq كله مشغول أو موديلاته اتقفلت.
//
// مهم: زي موديلات Groq، قايمة موديلات OpenRouter المجانية (اللي بتنتهي بـ:free)
// بتتغيّر كتير وبدون سابق إنذار. قبل ما تفعّل المفتاح، تأكد من القايمة الحالية على
// openrouter.ai/models?max_price=0 وعدّل القايمة دي لو لازم.
export const OPENROUTER_FALLBACK_IDS = [
  "google/gemma-4-31b-it:free",
  "z-ai/glm-4.5-air:free",
  "meta-llama/llama-3.3-70b-instruct:free",
  "nvidia/nemotron-3-super-120b-a12b:free",
];
