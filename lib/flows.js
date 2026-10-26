// المهام الكاملة: طلب واحد بيشغّل كذا أداة ورا بعض.
//
// كل خطوة بتستخدم أداة من lib/tools.js. في نص الخطوة:
//   {input} = اللي كتبه المستخدم
//   {1} {2} ... = نتيجة الخطوة رقم 1 أو 2 ...
// option = اختيار الأداة (لازم يكون من اختياراتها في lib/tools.js)
// كل خطوة بتتحسب طلب واحد من حد الاستخدام.

export const FLOWS = [
  {
    id: "product-launch",
    name: "إطلاق منتج على السوشيال",
    icon: "🚀",
    color: "#ff6b6b",
    desc: "وصف المنتج، وإعلان فيسبوك، ومنشور إنستجرام، وهاشتاجات، وردود جاهزة على التعليقات.",
    placeholder: "المنتج أو الخدمة، والسعر، والمدينة، والجمهور اللي عايز توصله...",
    example: "شنط جلد طبيعي حريمي صناعة مصرية، السعر من 650 لـ 1200 جنيه، توصيل لكل المحافظات، الجمهور بنات من 20 لـ 35 سنة",
    steps: [
      { tool: "product-desc", title: "وصف المنتج", input: "{input}" },
      { tool: "ad-copy", title: "إعلان فيسبوك", option: "فيسبوك", input: "{input}\n\nوصف المنتج:\n{1}" },
      { tool: "post", title: "منشور إنستجرام", option: "إنستجرام", input: "{input}\n\nوصف المنتج:\n{1}" },
      { tool: "hashtags", title: "هاشتاجات", input: "{input}" },
      {
        tool: "reply-comments",
        title: "ردود على التعليقات",
        option: "ودود",
        input: "المنتج: {input}\n\nاكتب ردوداً جاهزة على أكثر التعليقات المتوقعة: السعر كام؟ التوصيل بكام وبياخد قد إيه؟ فيه ألوان أو مقاسات تانية؟ الخامة إيه؟ ينفع أرجّع أو أبدّل؟",
      },
    ],
  },
  {
    id: "short-video",
    name: "فيديو قصير (ريلز وتيك توك)",
    icon: "🎬",
    color: "#ff4fa3",
    desc: "بدايات تشد من أول ثانية، وسكريبت كامل، وكابشن، وهاشتاجات، وأفكار للغلاف.",
    placeholder: "الفيديو عن إيه، ولمين، وعايز توصل إيه...",
    example: "فيديو لمطعم كشري في وسط البلد بيعرض طريقة التحضير، الجمهور شباب وطلبة",
    steps: [
      { tool: "reel-hooks", title: "بدايات تشد", input: "{input}" },
      { tool: "tiktok-script", title: "سكريبت الفيديو", input: "{input}\n\nاختار أقوى بداية من دول وابدأ بيها:\n{1}" },
      { tool: "caption", title: "الكابشن", input: "{input}" },
      { tool: "hashtags", title: "هاشتاجات", input: "{input}" },
      { tool: "thumbnail-ideas", title: "أفكار الغلاف", input: "{input}" },
    ],
  },
  {
    id: "youtube-video",
    name: "فيديو يوتيوب",
    icon: "▶️",
    color: "#ff5e3a",
    desc: "عناوين قوية، ووصف متوافق مع البحث، وأفكار للصورة المصغرة، ومنشور يروّج للفيديو.",
    placeholder: "موضوع الفيديو والقناة والجمهور...",
    example: "فيديو عن تجربتي في الطبخ لمدة أسبوع بميزانية 500 جنيه، قناة طبخ اقتصادي للطلبة",
    steps: [
      { tool: "youtube-title", title: "العناوين", input: "{input}" },
      { tool: "youtube-desc", title: "وصف الفيديو", input: "{input}\n\nاستخدم أول عنوان من دول:\n{1}" },
      { tool: "thumbnail-ideas", title: "الصورة المصغرة", input: "{input}" },
      { tool: "post", title: "منشور للترويج", option: "فيسبوك", input: "اكتب منشوراً يروّج لفيديو يوتيوب جديد عن: {input}" },
    ],
  },
  {
    id: "job-apply",
    name: "التقديم على وظيفة",
    icon: "💼",
    color: "#a66bff",
    desc: "سيرة ذاتية، وخطاب تقديم مبني عليها، وأسئلة المقابلة بإجاباتها، ونبذة للينكدإن.",
    placeholder: "الوظيفة اللي بتقدم عليها، وخبرتك، ومؤهلك، ومهاراتك...",
    example: "محاسب، خبرة 3 سنين في شركة مقاولات، بكالوريوس تجارة جامعة عين شمس، بشتغل على Excel وبرنامج أودو، بقدم على وظيفة محاسب أول في شركة أدوية",
    steps: [
      { tool: "cv", title: "السيرة الذاتية", input: "{input}" },
      { tool: "cover-letter", title: "خطاب التقديم", input: "{input}\n\nالسيرة الذاتية:\n{1}" },
      { tool: "interview-qs", title: "أسئلة المقابلة", input: "{input}" },
      { tool: "linkedin-about", title: "نبذة لينكدإن", input: "{input}\n\nالسيرة الذاتية:\n{1}" },
    ],
  },
  {
    id: "study-lesson",
    name: "مذاكرة درس",
    icon: "📚",
    color: "#4f8cff",
    desc: "ملخص الدرس، وبطاقات مراجعة، واختبار تقيس بيه نفسك، ونصايح للامتحان.",
    placeholder: "الصق الدرس، أو اكتب اسم الدرس والمرحلة...",
    example: "الجهاز الهضمي في الإنسان، للصف الثاني الإعدادي",
    steps: [
      { tool: "lesson-summary", title: "ملخص الدرس", input: "{input}" },
      { tool: "flashcards", title: "بطاقات المراجعة", input: "{input}" },
      { tool: "quiz", title: "اختبر نفسك", input: "{input}" },
      { tool: "exam-tips", title: "نصايح الامتحان", input: "{input}" },
    ],
  },
  {
    id: "business-idea",
    name: "من فكرة لمشروع",
    icon: "💡",
    color: "#2fb5a3",
    desc: "خطة عمل، وتحليل SWOT، وأسماء وشعارات للمشروع، وخطة تسويق للبداية.",
    placeholder: "فكرة المشروع، والمدينة، والميزانية التقريبية...",
    example: "كافيه صغير جنب جامعة في المنصورة، ميزانية حوالي 300 ألف جنيه، الجمهور طلبة",
    steps: [
      { tool: "business-plan", title: "خطة العمل", input: "{input}" },
      { tool: "swot", title: "تحليل SWOT", input: "{input}\n\nخطة العمل:\n{1}" },
      { tool: "brand-name", title: "أسماء مقترحة", input: "{input}" },
      { tool: "slogan", title: "شعارات", input: "{input}" },
      { tool: "marketing-plan", title: "خطة التسويق", input: "{input}\n\nخطة العمل:\n{1}" },
    ],
  },
  {
    id: "seo-blog",
    name: "مقال يتصدر جوجل",
    icon: "📝",
    color: "#7c5cff",
    desc: "كلمات مفتاحية، ومقال كامل متوافق مع جوجل، ووصف للبحث، ومنشور يروّج للمقال.",
    placeholder: "موضوع المقال وموقعك أو مجالك...",
    example: "أفضل طرق تعلم الإنجليزي من البيت مجاناً، لمدونة تعليمية مصرية",
    steps: [
      { tool: "keywords", title: "الكلمات المفتاحية", input: "{input}" },
      { tool: "seo-article", title: "المقال", input: "الموضوع: {input}\n\nالكلمات المفتاحية المقترحة:\n{1}" },
      { tool: "meta-desc", title: "وصف جوجل", input: "{input}" },
      { tool: "linkedin-post", title: "منشور للترويج", input: "اكتب منشوراً يروّج لمقال جديد عن: {input}" },
    ],
  },
  {
    id: "online-store",
    name: "متجر أونلاين جاهز",
    icon: "🛍️",
    color: "#ff9f43",
    desc: "اسم المتجر، وصفحة من نحن، ووصف الأقسام، وسياسة الاسترجاع، ورسايل واتساب للبيع.",
    placeholder: "المتجر بيبيع إيه، ولمين، وفي أنهي مدينة...",
    example: "متجر أونلاين لمنتجات العناية بالبشرة الطبيعية، توصيل لكل مصر، الجمهور ستات من 25 لـ 45 سنة",
    steps: [
      { tool: "store-name", title: "اسم المتجر", input: "{input}" },
      { tool: "store-about", title: "من نحن", input: "{input}" },
      { tool: "category-desc", title: "وصف الأقسام", input: "{input}" },
      { tool: "return-policy", title: "سياسة الاسترجاع", input: "{input}" },
      { tool: "whatsapp-sales", title: "رسايل واتساب للبيع", input: "{input}" },
    ],
  },
  {
    id: "event",
    name: "تنظيم مناسبة",
    icon: "🎉",
    color: "#8bc34a",
    desc: "خطة المناسبة بالأنشطة والجدول، ونص الدعوة، وقائمة بكل التجهيزات.",
    placeholder: "المناسبة، والمكان، وعدد الضيوف، والميزانية...",
    example: "عيد ميلاد بنتي السابع في البيت، حوالي 15 طفل، يوم الجمعة الساعة 5",
    steps: [
      { tool: "party-plan", title: "خطة المناسبة", input: "{input}" },
      { tool: "invitation", title: "نص الدعوة", input: "{input}" },
      { tool: "checklist", title: "قائمة التجهيزات", input: "{input}\n\nخطة المناسبة:\n{1}" },
    ],
  },
];

export const getFlow = (id) => FLOWS.find((f) => f.id === id);

const MAX_INPUT = 5900;   // حد الأداة 6000 حرف
const MAX_PREVIOUS = 2500; // من نتيجة كل خطوة سابقة

/** نص الخطوة بعد ما نحط فيه طلب المستخدم ونتايج الخطوات اللي قبلها */
export function fillStep(template, input, outputs) {
  const text = template
    .replace(/\{input\}/g, input.trim())
    .replace(/\{(\d+)\}/g, (_, n) => {
      const out = outputs[Number(n) - 1] || "";
      return out.length > MAX_PREVIOUS ? `${out.slice(0, MAX_PREVIOUS)}…` : out;
    });
  return text.slice(0, MAX_INPUT);
}
