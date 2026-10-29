// صفحات المهام: «أداة ذكاء اصطناعي لـ...» بالعربي. كل مهمة بتجمع أدوات موقعنا وأنسب أدوات الدليل ليها.
// الأدوات بتتختار تلقائي من الدليل (cats = المجالات، kw = كلمات بتتقدّم)، فلما الدليل يكبر الصفحات تتحدث لوحدها.
// عشان تضيف مهمة: انسخ سطر وعدّل فيه. strict = ما تعرضش غير الأدوات اللي فيها الكلمات (لمجالات واسعة زي البرمجة).
// T(المعرّف, العنوان بعد «أداة ذكاء اصطناعي لـ», وصف, [أدوات موقعنا], [مجالات الدليل], "كلمات|بتفصلها", strict)
const T = (slug, title, intro, site, cats, kw = "", strict = false) => ({ slug, title, intro, site, cats, kw: kw ? kw.split("|") : [], strict });

export const TASKS = [
  T("logo", "عمل شعار", "شعار لمشروعك أو صفحتك في دقايق من وصف بسيط، من غير ما تحتاج مصمم.", ["logo-ideas", "image-prompt"], ["logo", "design", "image-gen"], "logo|شعار|لوجو|brand", true),
  T("resume", "كتابة سيرة ذاتية", "اكتب سي في احترافي وخطاب تقديم وجهّز لمقابلة الشغل بمساعدة الذكاء الاصطناعي.", ["cv", "cover-letter", "interview-qs"], ["hr", "writing", "productivity"], "resume|cv|سيرة|وظيف|cover letter|job", true),
  T("translate", "الترجمة", "ترجمة نصوص ومستندات بين العربي واللغات التانية، بلهجة مناسبة.", ["translate", "translate-dialect", "english-correct"], ["languages", "writing", "chatbots", "productivity"], "translat|ترجم|language|لغة", true),
  T("summarize", "تلخيص النصوص وملفات PDF", "لخّص مقال أو كتاب أو ملف PDF في نقاط، وسأله أسئلة عنه.", ["summarize", "video-qa"], ["documents", "research", "chatbots"], "pdf|summar|تلخيص|ملخص|document|مستند|read", true),
  T("image", "توليد الصور", "حوّل وصف بالكلام لصورة، بأنماط مختلفة ومن غير ما تعرف تصمم.", ["image-prompt"], ["image-gen"], ""),
  T("remove-background", "إزالة خلفية الصورة", "شيل خلفية أي صورة منتج أو شخصية بضغطة، وجهّزها للمتجر أو التصميم.", [], ["image-edit", "design"], "background|خلفية|remove|edit|تعديل|photo|صور", true),
  T("video", "توليد فيديو من نص أو صورة", "اعمل مقاطع فيديو قصيرة من وصف مكتوب أو من صورة.", ["video-prompt"], ["video-gen"], "text-to-video|runway|kling|veo|luma|pika|hailuo|vidu|pixverse|hedra|sora|generat|توليد"),
  T("video-editing", "مونتاج الفيديو", "قصّ وركّب ونزّل ترجمة وعدّل فيديوهاتك بأدوات ذكية بدل المونتاج اليدوي.", [], ["video-edit", "video-gen"], "edit|مونتاج|capcut|davinci|vn |clipchamp|caption|cut|قص", true),
  T("voice-over", "التعليق الصوتي وتحويل النص لصوت", "حوّل أي نص لصوت طبيعي للفيديوهات والبودكاست والشرح.", [], ["voice"], "voice|tts|speech|صوت|تعليق|elevenlabs|fish|narrat|dubb"),
  T("transcription", "تفريغ الصوت لنص", "حوّل التسجيلات والمحاضرات والفيديوهات لنص مكتوب.", [], ["transcription", "meetings", "voice"], "transcri|تفريغ|speech|نص|meeting|اجتماع|note", true),
  T("music", "توليد الموسيقى والأغاني", "اعمل موسيقى أو أغنية كاملة من وصف مكتوب.", [], ["music"], ""),
  T("presentation", "عمل عرض تقديمي", "جهّز سلايدات كاملة من فكرة أو نص، بتصميم جاهز.", ["report"], ["presentations", "design", "productivity"], "slide|presentation|عرض|ppt|deck", true),
  T("article", "كتابة المقالات والمحتوى", "اكتب مقالات ومدونات ومحتوى كامل، وراجعه وحسّنه.", ["article", "rewrite", "proofread"], ["writing"], ""),
  T("ad-copy", "كتابة الإعلانات", "نصوص إعلانات وصفحات بيع بتجذب العميل وتحثه يشتري.", ["ad-copy", "landing-page"], ["copywriting", "marketing"], ""),
  T("seo", "تحسين السيو وترتيب الموقع في جوجل", "كلمات مفتاحية ومقالات متوافقة مع محركات البحث.", ["seo-article"], ["seo", "marketing", "writing"], "seo|keyword|كلمات|ranking|search", true),
  T("social-media", "إدارة السوشيال ميديا", "بوستات وكابشنز وجدول محتوى لحساباتك.", ["post", "caption", "content-calendar", "tiktok-script"], ["social", "marketing"], ""),
  T("email", "كتابة الإيميلات والردود", "اكتب إيميلات ورسائل رسمية وردود بسرعة وبأسلوب مناسب.", ["email-writer", "email-reply"], ["email", "writing", "productivity"], "email|mail|إيميل|بريد|reply", true),
  T("coding", "البرمجة وكتابة الكود", "اكتب كود وصلّح أخطاء واشرح أي كود، كمبتدئ أو محترف.", ["code-gen", "debug", "code-explain"], ["coding", "productivity"], "code|coding|developer|كود|برمج|ide|editor|copilot|programming", true),
  T("website", "إنشاء موقع أو تطبيق من غير كود", "ابني موقع أو متجر أو تطبيق بالوصف الكلامي، من غير ما تكتب كود.", ["html-css"], ["no-code", "coding", "productivity"], "website|site|موقع|landing|no-code|builder|بدون كود|web app|lovable|v0|bolt", true),
  T("data-analysis", "تحليل البيانات والجداول", "حلّل أرقامك وجداولك، واكتب معادلات وارسم النتائج.", ["sheet-analyst", "excel-formula"], ["data"], "data|analy|sheet|excel|chart|بيانات|تحليل|spreadsheet|sql|visual|insight|julius", true),
  T("research", "البحث وجمع المعلومات", "إجابات بمصادر وأبحاث ومقارنات سريعة بدل ساعات من البحث.", ["compare", "report"], ["research", "chatbots"], "research|بحث|search|source|مصادر|answer", true),
  T("study", "المذاكرة والتعلّم", "اشرح أي درس، واعمل اختبارات وبطاقات مراجعة وخطة مذاكرة.", ["explain", "quiz", "study-plan", "math-solver"], ["education", "research"], "learn|study|تعلم|مذاكر|ذاكر|notebook|tutor|student|طلاب|lesson|درس|course", true),
  T("chatbot", "المحادثة والمساعد الذكي", "مساعد تسأله في أي حاجة: كتابة وشرح وأفكار وتحليل.", ["gem-assistant", "brainstorm"], ["chatbots"], ""),
  T("automation", "أتمتة الشغل", "خلّي الذكاء الاصطناعي يعمل المهام المتكررة بدالك من غير تدخل.", [], ["automation", "agents", "productivity"], "automat|workflow|أتمت|zap|agent|وكيل|task", true),
  T("meetings", "تلخيص الاجتماعات", "سجّل اجتماعاتك واستخرج الملخص والمهام والقرارات.", [], ["meetings", "transcription", "productivity"], "meeting|اجتماع|note|minutes|record", true),
  T("customer-support", "خدمة العملاء", "ردود تلقائية وشات بوت يرد على عملائك ٢٤ ساعة.", ["review-reply", "whatsapp-sales"], ["support", "chatbots", "business"], "support|customer|عملاء|chatbot|help|agent|desk", true),
  T("ecommerce", "المتاجر الإلكترونية ووصف المنتجات", "اكتب وصف منتجاتك وحسّن صورها وجهّز متجرك.", ["product-desc", "product-faq"], ["ecommerce", "marketing", "image-edit"], "product|منتج|store|متجر|shop|ecommerce|commerce", true),
  T("design", "التصميم", "تصميمات وبوسترات وسوشيال بدون خبرة في التصميم.", ["image-prompt"], ["design", "image-gen", "image-edit"], "design|تصميم|poster|canva|graphic|template", true),

  T("business", "إدارة الأعمال والمشاريع", "خطة مشروع ودراسة جدوى وتحليل منافسين وأفكار بيزنس.", ["business-plan", "business-ideas", "compare"], ["business"], ""),
  T("3d", "التصميم ثلاثي الأبعاد والعمارة", "نماذج 3D وتصميمات معمارية وألعاب.", [], ["3d-games", "architecture", "design"], "3d|model|architect|عمار|render|game|لعب", true),
];

export const getTask = (slug) => TASKS.find((t) => t.slug === slug);

const lc = (s) => String(s || "").toLowerCase();
/** أنسب أدوات الدليل للمهمة. items = [{slug,name,cat,summary,ar?,votes?,featured?,pricing?}] */
export function pickTools(items, task, limit = 12) {
  const scored = [];
  for (const t of items) {
    const ci = task.cats.indexOf(t.cat);
    if (ci < 0) continue;
    const hay = lc(`${t.name} ${t.summary} ${t.ar?.what || ""}`);
    const hit = task.kw.some((k) => hay.includes(k));
    if (task.strict && task.kw.length && !hit) continue;
    const score = (hit ? 20 : 0) + (t.featured ? 12 : 0) + Math.min(t.votes || 0, 10) + (task.cats.length - ci) * 3 + (t.logo ? 1 : 0);
    scored.push([score, t]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map((x) => x[1]);
}
