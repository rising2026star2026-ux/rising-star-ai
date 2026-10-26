// الاختيارات الـ6 اللي المستخدم بيختار منها في الشات (وبتستخدمها الأدوات كمان).
//
// مهم: Groq بيغيّر الموديلات المتاحة كل فترة. في أكتوبر 2026 الموديلات المجانية المعروفة كانت
// openai/gpt-oss-120b و openai/gpt-oss-20b، وموديلات تانية كتير اتقفلت.
// لو ظهر خطأ أو الرد بقى بطيء: افتح console.groq.com ← Models، وغيّر قيمة id هنا.
// لو الموديل المختار فشل، الموقع بيجرب البدائل اللي في FALLBACK_IDS تلقائياً، فالمستخدم مش هيحس.
//
// effort: قد إيه الموديل يفكر قبل ما يرد (low سريع، medium أدق، high أعمق وأبطأ)
// hint:  توجيه إضافي بيتبعت مع الموديل ده بس
// tier:  free متاح للكل، pro للباقات المدفوعة (لما نضيف الاشتراكات)

export const MODEL_OPTIONS = [
  {
    key: "fusion",
    id: "openai/gpt-oss-120b",
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
    id: "openai/gpt-oss-120b",
    effort: "low",
    name: "متوازن",
    tagline: "الأفضل للاستخدام اليومي",
    desc: "جودة عالية وسرعة كويسة. ابدأ بيه لو مش عارف تختار.",
    icon: "⚖️",
    tier: "free",
  },
  {
    key: "fast",
    id: "openai/gpt-oss-20b",
    effort: "low",
    name: "سريع جداً",
    tagline: "رد فوري",
    desc: "أسرع اختيار. للأسئلة القصيرة والتلخيص والترجمة السريعة.",
    icon: "⚡",
    tier: "free",
  },
  {
    key: "strong",
    id: "openai/gpt-oss-120b",
    effort: "medium",
    name: "قوي",
    tagline: "للمهام الصعبة",
    desc: "بيفكر أكتر قبل ما يرد. للتحليل والنصوص الطويلة والكتابة الاحترافية.",
    icon: "🏆",
    tier: "free",
  },
  {
    key: "thinking",
    id: "openai/gpt-oss-120b",
    effort: "high",
    name: "تفكير عميق",
    tagline: "بيفكر خطوة بخطوة",
    desc: "للمسائل والرياضيات والمنطق. أبطأ شوية لكن أدق في الحل.",
    icon: "🧠",
    tier: "free",
  },
  {
    key: "coding",
    id: "openai/gpt-oss-120b",
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

// لو الموديل المختار فشل أو اتزحم، نجرب دول بالترتيب
export const FALLBACK_IDS = ["openai/gpt-oss-120b", "openai/gpt-oss-20b"];

// طبقة احتياطية اختيارية من OpenRouter (openrouter.ai) — بتشتغل بس لو حطيت
// OPENROUTER_API_KEY في إعدادات Vercel. المستخدم مش بيحس بيها خالص؛ هي بس
// بتزوّد عدد المحاولات لو Groq كله مشغول أو موديلاته اتقفلت.
//
// مهم: زي موديلات Groq، قايمة موديلات OpenRouter المجانية (اللي بتنتهي بـ:free)
// بتتغيّر كتير وبدون سابق إنذار. قبل ما تفعّل المفتاح، تأكد من القايمة الحالية على
// openrouter.ai/models?max_price=0 وعدّل القايمة دي لو لازم.
export const OPENROUTER_FALLBACK_IDS = [
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "google/gemma-4-31b-it:free",
];
