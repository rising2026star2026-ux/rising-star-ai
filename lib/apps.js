// برامج الذكاء الاصطناعي المشهورة: كل برنامج بلوجو شركته واسمه، والكارت بيفتح الموقع الرسمي.
// اللوجوهات في public/logos (من مكتبة LobeHub المفتوحة، رخصة MIT). العلامات التجارية ملك أصحابها.
// برامج الموقع نفسه (الاستوديو) بتتضاف في صفحة الموديلات من lib/tools.js.

export const APP_SECTIONS = [
  { id: "app-chat", title: "برامج المحادثة والبحث", sub: "أشهر مساعدين الذكاء الاصطناعي في العالم" },
  { id: "app-image", title: "برامج الصور والتصميم", sub: "صور وتصميمات من كلمة" },
  { id: "app-video", title: "برامج الفيديو", sub: "فيديوهات بالذكاء الاصطناعي ومونتاج" },
  { id: "app-audio", title: "برامج الصوت والموسيقى", sub: "أغاني وتعليق صوتي" },
  { id: "app-work", title: "برامج الشغل والبرمجة", sub: "ترجمة وتنظيم ومواقع وكود" },
];

const A = (section, key, name, maker, url, desc, logo = key) => ({
  key: `app-${key}`, section, name, maker, url, desc, logo: `/logos/${logo}.webp`, available: true, external: true,
});

export const APPS = [
  A("app-chat", "chatgpt", "ChatGPT", "OpenAI", "https://chatgpt.com", "أشهر مساعد ذكاء اصطناعي في العالم.", "openai"),
  A("app-chat", "claude", "Claude", "Anthropic", "https://claude.ai", "كتابة وتحليل وبرمجة بدقة عالية."),
  A("app-chat", "gemini", "Gemini", "Google", "https://gemini.google.com", "مساعد جوجل، مربوط بخدماتها."),
  A("app-chat", "grok", "Grok", "xAI", "https://grok.com", "مساعد xAI، متابع لأخبار X."),
  A("app-chat", "metaai", "Meta AI", "Meta", "https://www.meta.ai", "مساعد ميتا في واتساب وإنستجرام."),
  A("app-chat", "deepseek", "DeepSeek", "DeepSeek", "https://chat.deepseek.com", "قوي في الرياضيات والبرمجة."),
  A("app-chat", "qwen", "Qwen Chat", "Alibaba", "https://chat.qwen.ai", "مساعد علي بابا، كويس في العربي."),
  A("app-chat", "kimi", "Kimi", "Moonshot AI", "https://www.kimi.com", "ملفات طويلة ومهام خطوة بخطوة."),
  A("app-chat", "mistral", "Le Chat", "Mistral", "https://chat.mistral.ai", "المساعد الأوروبي من Mistral."),
  A("app-chat", "copilot", "Copilot", "Microsoft", "https://copilot.microsoft.com", "مساعد مايكروسوفت ومعاه أوفيس."),
  A("app-chat", "perplexity", "Perplexity", "Perplexity", "https://www.perplexity.ai", "بحث بالذكاء الاصطناعي بالمصادر."),
  A("app-chat", "notebooklm", "NotebookLM", "Google", "https://notebooklm.google.com", "ذاكر من ملفاتك واعمل منها بودكاست."),
  A("app-chat", "manus", "Manus", "Manus", "https://manus.im", "وكيل بينفّذ مهام كاملة لوحده."),
  A("app-chat", "zai", "Z.ai", "Zhipu", "https://chat.z.ai", "مساعد GLM للبرمجة والمهام المركبة."),
  A("app-chat", "minimax", "MiniMax", "MiniMax", "https://www.minimax.io", "موديلات نصوص وصوت وفيديو."),
  A("app-chat", "huggingface", "Hugging Face", "Hugging Face", "https://huggingface.co", "أكبر مكتبة موديلات مفتوحة."),

  A("app-image", "midjourney", "Midjourney", "Midjourney", "https://www.midjourney.com", "أجمل صور فنية بالذكاء الاصطناعي."),
  A("app-image", "nanobanana", "Nano Banana", "Google", "https://gemini.google.com", "تعديل الصور بالكلام جوه Gemini."),
  A("app-image", "ideogram", "Ideogram", "Ideogram", "https://ideogram.ai", "أحسن برنامج للكتابة جوه الصور."),
  A("app-image", "bfl", "FLUX", "Black Forest Labs", "https://bfl.ai", "صور واقعية جداً بتفاصيل دقيقة."),
  A("app-image", "recraft", "Recraft", "Recraft", "https://www.recraft.ai", "لوجوهات وأيقونات وصور فيكتور."),
  A("app-image", "krea", "Krea", "Krea", "https://www.krea.ai", "صور وفيديو لايف وتكبير الجودة."),
  A("app-image", "adobefirefly", "Adobe Firefly", "Adobe", "https://firefly.adobe.com", "ذكاء أدوبي الاصطناعي للصور."),
  A("app-image", "figma", "Figma", "Figma", "https://www.figma.com", "تصميم واجهات ومواقع وتطبيقات."),

  A("app-video", "runway", "Runway", "Runway", "https://runwayml.com", "فيديو سينمائي من نص أو صورة."),
  A("app-video", "kling", "Kling", "Kuaishou", "https://klingai.com", "فيديوهات واقعية بحركة طبيعية."),
  A("app-video", "luma", "Dream Machine", "Luma AI", "https://lumalabs.ai", "فيديو من صورة أو وصف."),
  A("app-video", "pika", "Pika", "Pika", "https://pika.art", "مؤثرات فيديو سريعة وممتعة."),
  A("app-video", "hailuo", "Hailuo", "MiniMax", "https://hailuoai.video", "فيديو قصير بجودة عالية."),
  A("app-video", "vidu", "Vidu", "ShengShu", "https://www.vidu.com", "فيديو من صور وشخصيات ثابتة."),
  A("app-video", "pixverse", "PixVerse", "PixVerse", "https://pixverse.ai", "فيديوهات تريند للسوشيال."),
  A("app-video", "capcut", "CapCut", "ByteDance", "https://www.capcut.com", "مونتاج ريلز وتيك توك."),

  A("app-audio", "suno", "Suno", "Suno", "https://suno.com", "أغنية كاملة من كلمة."),
  A("app-audio", "udio", "Udio", "Udio", "https://www.udio.com", "موسيقى وأغاني بجودة استوديو."),
  A("app-audio", "elevenlabs", "ElevenLabs", "ElevenLabs", "https://elevenlabs.io", "تعليق صوتي بأصوات طبيعية."),

  A("app-work", "deepl", "DeepL", "DeepL", "https://www.deepl.com", "ترجمة دقيقة للملفات والنصوص."),
  A("app-work", "notion", "Notion", "Notion", "https://www.notion.com", "ملاحظات ومشاريع ومعاها AI."),
  A("app-work", "cursor", "Cursor", "Anysphere", "https://cursor.com", "محرر كود بالذكاء الاصطناعي."),
  A("app-work", "lovable", "Lovable", "Lovable", "https://lovable.dev", "اعمل موقع كامل بالكلام."),
  A("app-work", "v0", "v0", "Vercel", "https://v0.app", "واجهات ومواقع جاهزة من وصف."),
];
