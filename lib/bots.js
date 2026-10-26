// صفحة «الموديلات» (زي Poe): كل موديل كارت بأيقونة، مقسمين على أقسام.
//
// نوعين من الموديلات:
//   free → على Groq، مجانية ومتاحة للكل (بنفس مفتاح GROQ_API_KEY)
//   pro  → الموديلات العالمية الكبيرة (GPT وClaude وGemini وGrok...) عن طريق OpenRouter.
//          بتتحاسب على كل رسالة، فمحتاجة OPENROUTER_API_KEY فيه رصيد، ومقفولة للمشتركين بس
//          (كود اشتراك من PRO_CODES في Vercel). انظر README.
//
// مهم: أسماء الموديلات بتتغيّر كل شهر تقريباً. عشان كده كل موديل pro ليه «match»:
// الموقع بيسأل OpenRouter كل 6 ساعات عن الموديلات الموجودة، وبيختار أحدث موديل في العيلة
// لوحده (مثلاً لما Claude Opus 6 ينزل، الكارت هيتحول له من غير ما تعدّل حاجة).
// fallbackId بيتستخدم بس لو قايمة OpenRouter ما وصلتش.
//

export const BOT_SECTIONS = [
  { id: "official", title: "الموديلات العالمية", sub: "GPT وClaude وGemini وGrok وأقوى موديلات العالم، بالعربي" },
  { id: "free", title: "موديلات سريعة", sub: "ردود في ثواني لأسئلة كل يوم" },
  { id: "assistants", title: "مساعدين متخصصين", sub: "كل مساعد متدرّب على شغلانة واحدة وبيعملها كويس" },
  { id: "search", title: "بحث على الإنترنت", sub: "بيدوّر على النت ويرد بالمصادر" },
  { id: "apps", title: "برامج Rising StarAi", sub: "تصميم وفيديو وملفات، بتشتغل جوه المتصفح على طول" },
];

// لوجو كل موديل (أيقونات تطبيقات من مكتبة LobeHub المفتوحة، رخصة MIT — public/logos)
// العلامات التجارية ملك أصحابها، وبتتعرض عشان تعرّف كل موديل بشركته.
const LOGO = {
  openai: ["gpt-astra", "gpt-sol", "gpt-oss-120b", "gpt-oss-20b"],
  claude: ["claude-opus", "claude-sonnet", "claude-haiku", "claude-search"],
  gemini: ["gemini-pro", "gemini-flash"], grok: ["grok"], kimi: ["kimi", "kimi-k2"], deepseek: ["deepseek"],
  qwen: ["qwen-max", "qwen-27b", "qwen3-32b"], mistral: ["mistral-large"], zai: ["glm"],
  meta: ["llama-70b", "llama-8b", "llama4-scout", "llama4-maverick"], metaai: ["muse-spark"], minimax: ["minimax"],
  perplexity: ["sonar"], groq: ["compound", "compound-mini"],
};
const logoOf = (key) => {
  for (const [file, keys] of Object.entries(LOGO)) if (keys.includes(key)) return `/logos/${file}.webp`;
  return null;
};

// ألوان الأيقونات لكل شركة
const C = {
  openai: ["#1d1f24", "#3a3f4a"],
  openaiLight: ["#0f6e5c", "#20b394"],
  anthropic: ["#b4532f", "#e08a5f"],
  google: ["#2c5bd8", "#9a5cf0"],
  googleFlash: ["#1b8fd8", "#38c8e8"],
  xai: ["#0b0b0c", "#4b4b52"],
  moonshot: ["#1a1d3a", "#4a4fb8"],
  deepseek: ["#1e3fa8", "#4d7cf5"],
  qwen: ["#5b2bd0", "#9b6bff"],
  mistral: ["#d9480f", "#f7a531"],
  zai: ["#0c5a6e", "#22b5c9"],
  meta: ["#0b57d0", "#5aa0ff"],
  minimax: ["#c2185b", "#ff6f9e"],
  perplexity: ["#0d4a4a", "#20a6a6"],
  rising: ["#14120b", "#5a4a1c"],
};

const B = (o) => ({ effort: null, web: false, logo: logoOf(o.key), ...o });

export const BOTS = [
  // ===== الموديلات العالمية (pro عن طريق OpenRouter) =====
  B({ key: "gpt-astra", section: "official", tier: "pro", provider: "openrouter", name: "GPT-6 Astra", maker: "OpenAI",
      match: "^openai/gpt-\\d+(\\.\\d+)?-astra$", fallbackId: "openai/gpt-6-astra",
      mono: "G6", colors: C.openai, desc: "أقوى موديل عند OpenAI للمهام الصعبة والتحليل العميق." }),
  B({ key: "claude-opus", section: "official", tier: "pro", provider: "openrouter", name: "Claude Opus 5.5", maker: "Anthropic",
      match: "^anthropic/claude-opus-\\d+(\\.\\d+)?$", fallbackId: "anthropic/claude-opus-5.5",
      mono: "Op", colors: C.anthropic, desc: "ممتاز في الكتابة الطويلة والبرمجة والتفكير المتأني." }),
  B({ key: "claude-sonnet", section: "official", tier: "pro", provider: "openrouter", name: "Claude Sonnet 5.5", maker: "Anthropic",
      match: "^anthropic/claude-sonnet-\\d+(\\.\\d+)?$", fallbackId: "anthropic/claude-sonnet-5.5",
      mono: "So", colors: C.anthropic, desc: "توازن ممتاز بين الجودة والسرعة للشغل اليومي." }),
  B({ key: "gemini-pro", section: "official", tier: "pro", provider: "openrouter", name: "Gemini Pro", maker: "Google",
      match: "^google/gemini-\\d+(\\.\\d+)?-(pro|argon)$",
      mono: "Ge", colors: C.google, desc: "موديل جوجل الكبير، قوي في الملفات الطويلة والمعلومات العامة." }),
  B({ key: "grok", section: "official", tier: "pro", provider: "openrouter", name: "Grok 4.7", maker: "xAI",
      match: "^x-ai/grok-\\d+(\\.\\d+)?$", fallbackId: "x-ai/grok-4.7",
      mono: "Gk", colors: C.xai, desc: "سريع وجريء في الردود، كويس في الأفكار والنقاش." }),
  B({ key: "gpt-sol", section: "official", tier: "pro", provider: "openrouter", name: "GPT-6 Sol", maker: "OpenAI",
      match: "^openai/gpt-\\d+(\\.\\d+)?-sol$", fallbackId: "openai/gpt-6.1-sol",
      mono: "G6", colors: ["#26324a", "#5b7bb8"], desc: "نسخة أخف وأرخص من GPT-6، ممتازة للاستخدام اليومي." }),
  B({ key: "kimi", section: "official", tier: "pro", provider: "openrouter", name: "Kimi K3", maker: "Moonshot AI",
      match: "^moonshotai/kimi-k\\d+(\\.\\d+)?(-pro)?$", fallbackId: "moonshotai/kimi-k3",
      mono: "Ki", colors: C.moonshot, desc: "قوي في البرمجة والمهام الطويلة خطوة بخطوة." }),
  B({ key: "gemini-flash", section: "official", tier: "pro", provider: "openrouter", name: "Gemini Flash", maker: "Google",
      match: "^google/gemini-\\d+(\\.\\d+)?-flash$", fallbackId: "google/gemini-3.8-flash",
      mono: "Fl", colors: C.googleFlash, desc: "سريع جداً ورخيص، للأسئلة اليومية والتلخيص." }),
  B({ key: "claude-haiku", section: "official", tier: "pro", provider: "openrouter", name: "Claude Haiku 5.5", maker: "Anthropic",
      match: "^anthropic/claude-haiku-\\d+(\\.\\d+)?$", fallbackId: "anthropic/claude-haiku-5.5",
      mono: "Ha", colors: ["#8a4a2c", "#d9a07a"], desc: "أسرع وأخف موديلات Claude." }),
  B({ key: "deepseek", section: "official", tier: "pro", provider: "openrouter", name: "DeepSeek V4", maker: "DeepSeek",
      match: "^deepseek/deepseek-v\\d+(\\.\\d+)?-pro(-\\d+)?$", fallbackId: "deepseek/deepseek-v4-pro-0813",
      mono: "DS", colors: C.deepseek, desc: "قوي في الرياضيات والبرمجة بسعر قليل." }),
  B({ key: "qwen-max", section: "official", tier: "pro", provider: "openrouter", name: "Qwen Max", maker: "Alibaba",
      match: "^qwen/qwen\\d+(\\.\\d+)?-max(-\\d+)?$", fallbackId: "qwen/qwen3.8-max-0902",
      mono: "Qw", colors: C.qwen, desc: "موديل علي بابا الكبير، كويس جداً في العربي واللغات." }),
  B({ key: "mistral-large", section: "official", tier: "pro", provider: "openrouter", name: "Mistral Large", maker: "Mistral",
      match: "^mistralai/mistral-large(-\\d+)?$",
      mono: "Mi", colors: C.mistral, desc: "موديل أوروبي متوازن، كويس في الكتابة والترجمة." }),
  B({ key: "glm", section: "official", tier: "pro", provider: "openrouter", name: "GLM 5.3", maker: "Z.ai",
      match: "^z-ai/glm-\\d+(\\.\\d+)?$", fallbackId: "z-ai/glm-5.3",
      mono: "GL", colors: C.zai, desc: "قوي في البرمجة والمهام المركبة." }),

  // ===== مجانية (Groq) =====
  B({ key: "gpt-oss-120b", section: "free", tier: "free", provider: "groq", name: "GPT-OSS 120B", maker: "OpenAI",
      id: "openai/gpt-oss-120b", effort: "low", mono: "120", colors: C.openaiLight, desc: "الموديل الأساسي في الموقع: جودة عالية وسرعة كبيرة." }),
  B({ key: "gpt-oss-20b", section: "free", tier: "free", provider: "groq", name: "GPT-OSS 20B", maker: "OpenAI",
      id: "openai/gpt-oss-20b", effort: "low", mono: "20", colors: ["#0e5a4c", "#3fc9a8"], desc: "أسرع موديل في الموقع، للأسئلة القصيرة." }),
  B({ key: "llama-70b", section: "free", tier: "free", provider: "groq", name: "Llama 3.3 70B", maker: "Meta",
      id: "llama-3.3-70b-versatile", mono: "70", colors: C.meta, desc: "موديل ميتا المفتوح، متوازن وكويس في الكتابة." }),
  B({ key: "qwen-27b", section: "free", tier: "free", provider: "groq", name: "Qwen 3.8", maker: "Alibaba",
      id: "qwen/qwen3.8-27b", mono: "Qw", colors: ["#3e1f99", "#7d5cff"], desc: "كويس في العربي والصياغة." }),
  B({ key: "minimax", section: "free", tier: "free", provider: "groq", name: "MiniMax M2.7", maker: "MiniMax",
      id: "minimaxai/minimax-m2.7", mono: "MM", colors: C.minimax, desc: "قوي في المهام الطويلة والبرمجة." }),
  B({ key: "muse-spark", section: "free", tier: "free", provider: "groq", name: "Muse Spark", maker: "Meta",
      id: "meta-models/muse-spark-open", mono: "Mu", colors: ["#123a8c", "#6c8cff"], desc: "موديل ميتا الجديد المفتوح." }),
  B({ key: "llama-8b", section: "free", tier: "free", provider: "groq", name: "Llama 3.1 8B", maker: "Meta",
      id: "llama-3.1-8b-instant", mono: "8B", colors: ["#2a4f8f", "#7fb0ff"], desc: "خفيف جداً وفوري، للمهام البسيطة." }),

  B({ key: "kimi-k2", section: "free", tier: "free", provider: "groq", name: "Kimi K2", maker: "Moonshot AI",
      id: "moonshotai/kimi-k2-instruct-0905", mono: "K2", desc: "قوي في البرمجة والمهام اللي محتاجة خطوات كتير." }),
  B({ key: "qwen3-32b", section: "free", tier: "free", provider: "groq", name: "Qwen3 32B", maker: "Alibaba",
      id: "qwen/qwen3-32b", mono: "Qw", desc: "بيفكّر قبل ما يرد، كويس في الرياضيات والمنطق." }),
  B({ key: "llama4-scout", section: "free", tier: "free", provider: "groq", name: "Llama 4 Scout", maker: "Meta",
      id: "meta-llama/llama-4-scout-17b-16e-instruct", mono: "L4", desc: "موديل ميتا الجديد، سريع وبيفهم ملفات طويلة." }),
  B({ key: "llama4-maverick", section: "free", tier: "free", provider: "groq", name: "Llama 4 Maverick", maker: "Meta",
      id: "meta-llama/llama-4-maverick-17b-128e-instruct", mono: "L4", desc: "أكبر من Scout وأدق في الكتابة." }),
  B({ key: "allam", section: "free", tier: "free", provider: "groq", name: "ALLaM 7B", maker: "SDAIA", tint: "#047857",
      id: "allam-2-7b", mono: "AL", desc: "موديل عربي من السعودية، متدرّب على العربي من الأساس." }),
  B({ key: "compound", section: "search", tier: "free", provider: "groq", name: "Compound", maker: "Groq",
      id: "groq/compound", mono: "search", desc: "بيبحث على النت وبيحسب بنفسه، وبيرد بالمصادر." }),
  B({ key: "compound-mini", section: "search", tier: "free", provider: "groq", name: "Compound Mini", maker: "Groq",
      id: "groq/compound-mini", mono: "search", desc: "نسخة أسرع من Compound لأسئلة البحث القصيرة." }),

  // ===== مساعدين متخصصين (شغالين على GPT-OSS 120B بتعليمات خاصة) =====
  B({ key: "as-translator", section: "assistants", tint: "#4f46e5", tier: "free", provider: "groq", name: "المترجم", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "translate", persona: "مترجم محترف بين العربي والإنجليزي والفرنساوي واللهجات. ترجم المعنى مش الكلمة، وحافظ على النبرة، ولو الكلمة ليها أكتر من معنى اذكر البدايل باختصار.", desc: "ترجمة طبيعية بالمعنى بين العربي والإنجليزي واللهجات." }),
  B({ key: "as-proofreader", section: "assistants", tint: "#0ea5e9", tier: "free", provider: "groq", name: "المدقق اللغوي", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "pen", persona: "مدقق لغوي عربي. صحّح الإملاء والنحو وعلامات الترقيم، ورجّع النص مصحح كامل، وبعده قايمة قصيرة بأهم التصحيحات وسببها.", desc: "يصحّح الإملاء والنحو ويقولك غلطت فين." }),
  B({ key: "as-copywriter", section: "assistants", tint: "#f97316", tier: "free", provider: "groq", name: "كاتب الإعلانات", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "megaphone", persona: "كاتب إعلانات مصري محترف. اكتب نصوص إعلانية قصيرة ومقنعة بلهجة الجمهور، بعنوان قوي وفايدة واضحة ودعوة لاتخاذ إجراء. اقترح 3 نسخ مختلفة لما يناسب.", desc: "نصوص إعلانات فيسبوك وإنستجرام بتبيع." }),
  B({ key: "as-social", section: "assistants", tint: "#ec4899", tier: "free", provider: "groq", name: "صانع المحتوى", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "spark", persona: "صانع محتوى سوشيال ميديا عربي. اقترح أفكار بوستات وريلز وهوكات وكابشنات وهاشتاجات مناسبة للمنصة والجمهور، وخلي الكلام قريب من الناس.", desc: "أفكار بوستات وريلز وكابشنات جاهزة." }),
  B({ key: "as-coder", section: "assistants", tint: "#10b981", tier: "free", provider: "groq", name: "المبرمج", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "code", persona: "مبرمج خبير. اكتب كود نظيف وشغال مع شرح مختصر بالعربي، واسأل عن اللغة أو الإطار لو مش واضح، ونبّه للأخطاء والثغرات.", desc: "يكتب الكود ويصلّحه ويشرحه بالعربي." }),
  B({ key: "as-excel", section: "assistants", tint: "#8b5cf6", tier: "free", provider: "groq", name: "خبير إكسل", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "grid", persona: "خبير Excel وGoogle Sheets. اكتب المعادلة المطلوبة بالظبط، واشرح كل جزء فيها باختصار، واقترح طريقة أسهل لو موجودة.", desc: "معادلات إكسل وجداول جاهزة بالشرح." }),
  B({ key: "as-tutor", section: "assistants", tint: "#ef4444", tier: "free", provider: "groq", name: "المدرّس", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "book", persona: "مدرّس صبور. اشرح أي درس خطوة خطوة بأمثلة من الحياة، واسأل الطالب سؤال صغير في الآخر عشان تتأكد إنه فهم.", desc: "يشرح أي درس خطوة خطوة بأمثلة." }),
  B({ key: "as-cv", section: "assistants", tint: "#14b8a6", tier: "free", provider: "groq", name: "كاتب السيرة الذاتية", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "doc", persona: "خبير توظيف. ساعد في كتابة وتحسين السيرة الذاتية وخطاب التقديم وتجهيز المقابلات، بصياغة إنجازات بالأرقام ومناسبة لأنظمة فرز السير الذاتية.", desc: "سيرة ذاتية وخطاب تقديم يلفتوا النظر." }),
  B({ key: "as-marketer", section: "assistants", tint: "#f59e0b", tier: "free", provider: "groq", name: "مستشار التسويق", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "chart", persona: "مستشار تسويق للمشاريع الصغيرة في مصر والخليج. ادّي خطط عملية بميزانيات واقعية وخطوات واضحة، واسأل عن المنتج والجمهور والميزانية لو ناقصين.", desc: "خطط تسويق عملية للمشاريع الصغيرة." }),
  B({ key: "as-chef", section: "assistants", tint: "#2563eb", tier: "free", provider: "groq", name: "الشيف", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "chef", persona: "شيف بيطبخ أكل بيتي عربي وعالمي. ادّي وصفات بمقادير واضحة وخطوات مرقّمة ووقت التحضير، واقترح بدايل للمكونات.", desc: "وصفات بيتي بمقادير وخطوات واضحة." }),
  B({ key: "as-travel", section: "assistants", tint: "#d946ef", tier: "free", provider: "groq", name: "مخطط الرحلات", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "plane", persona: "مخطط رحلات. اعمل جدول يوم بيوم بأماكن وأوقات وتكلفة تقريبية، ونبّه إن الأسعار والمواعيد لازم تتأكد منها قبل الحجز.", desc: "جدول رحلة يوم بيوم بالتكلفة." }),
  B({ key: "as-writer", section: "assistants", tint: "#0f766e", tier: "free", provider: "groq", name: "الكاتب", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "low", glyph: "feather", persona: "كاتب عربي موهوب. اكتب مقالات وقصص وخواطر بأسلوب جذاب ولغة سليمة، والتزم بالطول والنبرة اللي المستخدم يطلبها.", desc: "مقالات وقصص وخواطر بأسلوب جذاب." }),

  // ===== بحث على الإنترنت =====
  B({ key: "search-fast", section: "search", tint: "#0ea5e9", tier: "free", provider: "groq", name: "بحث سريع", maker: "Rising StarAi",
      id: "openai/gpt-oss-20b", effort: "low", web: true, mono: "search", colors: ["#0e4d63", "#2bb3d9"], desc: "بيدوّر على جوجل ويرد في ثواني بالمصادر." }),
  B({ key: "search-deep", section: "search", tint: "#4f46e5", tier: "free", provider: "groq", name: "باحث عميق", maker: "Rising StarAi",
      id: "openai/gpt-oss-120b", effort: "medium", web: true, mono: "search", colors: C.rising, desc: "بيقرا نتايج أكتر ويرتّبها في إجابة منظمة." }),
  B({ key: "sonar", section: "search", tier: "pro", provider: "openrouter", name: "Sonar", maker: "Perplexity",
      match: "^perplexity/sonar-pro$", fallbackId: "perplexity/sonar-pro", nativeSearch: true,
      mono: "search", colors: C.perplexity, desc: "محرك بحث بالذكاء الاصطناعي، بيبحث بنفسه ويجيب المصادر." }),
  B({ key: "claude-search", section: "search", tier: "pro", provider: "openrouter", name: "Claude Sonnet + بحث", maker: "Anthropic",
      match: "^anthropic/claude-sonnet-\\d+(\\.\\d+)?$", fallbackId: "anthropic/claude-sonnet-5.5", web: true,
      mono: "search", colors: C.anthropic, desc: "Claude Sonnet ومعاه نتايج بحث جديدة من النت." }),
];

export const getBot = (key) => BOTS.find((b) => b.key === key) || null;
export const botsIn = (section) => BOTS.filter((b) => b.section === section);
