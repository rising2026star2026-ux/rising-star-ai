// مصادر الأخبار. kind: company = مدونة شركة رسمية، news = موقع أخبار، arabic = موقع عربي
// ai:false يعني الموقع عام، فبنصفّي منه المواضيع اللي عن الذكاء الاصطناعي بس.
export const FEEDS = [
  { id: "openai", name: "OpenAI", kind: "company", url: "https://openai.com/news/rss.xml" },
  { id: "google-ai", name: "Google AI", kind: "company", url: "https://blog.google/technology/ai/rss/" },
  { id: "deepmind", name: "Google DeepMind", kind: "company", url: "https://deepmind.google/blog/rss.xml" },
  { id: "microsoft", name: "Microsoft AI", kind: "company", url: "https://blogs.microsoft.com/ai/feed/" },
  { id: "meta", name: "Meta AI", kind: "company", url: "https://ai.meta.com/blog/rss/" },
  { id: "nvidia", name: "NVIDIA", kind: "company", url: "https://blogs.nvidia.com/feed/" },
  { id: "huggingface", name: "Hugging Face", kind: "company", url: "https://huggingface.co/blog/feed.xml" },
  { id: "aws", name: "Amazon AWS", kind: "company", url: "https://aws.amazon.com/blogs/machine-learning/feed/" },
  { id: "apple", name: "Apple ML", kind: "company", url: "https://machinelearning.apple.com/rss.xml" },
  { id: "techcrunch", name: "TechCrunch", kind: "news", url: "https://techcrunch.com/category/artificial-intelligence/feed/" },
  { id: "verge", name: "The Verge", kind: "news", url: "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml" },
  { id: "venturebeat", name: "VentureBeat", kind: "news", url: "https://venturebeat.com/category/ai/feed/" },
  { id: "marktechpost", name: "MarkTechPost", kind: "news", url: "https://www.marktechpost.com/feed/" },
  { id: "arstechnica", name: "Ars Technica", kind: "news", url: "https://arstechnica.com/ai/feed/" },
  { id: "aitnews", name: "البوابة العربية للأخبار التقنية", kind: "arabic", url: "https://aitnews.com/feed/", ai: false },
  { id: "techwd", name: "تك وورلد", kind: "arabic", url: "https://www.tech-wd.com/wd/feed/", ai: false },
];
export const AI_RE = /ذكاء\s*اصطناعي|الذكاء الاصطناعي|\bAI\b|ChatGPT|OpenAI|Gemini|Claude|GPT|Copilot|نموذج لغوي|روبوت/i;
