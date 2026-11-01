// «مولّد البرومبتات»: بيبني برومبت منظم من فكرة + معايير بتختارها (بالكود، فوري ومن غير تكلفة ذكاء اصطناعي).
// كل نوع (شات، إعلان، ريلز، صورة، فيديو) ليه حقول، وكل حقل ليه اختيارات. الاختيارات × الأنواع = آلاف التركيبات
// بدل 75 برومبت ثابت. الملف ده من غير أي اعتماد خارجي عشان نقدر نختبره لوحده.

const o = (v, label, text) => ({ v, label, text: text ?? label });

/* ---------------- اختيارات مشتركة ---------------- */
const DIALECT = [
  o("msa", "فصحى مبسطة", "بالعربية الفصحى المبسطة"),
  o("eg", "مصرية", "باللهجة المصرية العامية"),
  o("sa", "سعودية", "باللهجة السعودية البيضاء"),
  o("gulf", "خليجية", "باللهجة الخليجية"),
  o("lev", "شامية", "باللهجة الشامية"),
  o("en", "إنجليزي", "باللغة الإنجليزية"),
];
const TONE = [
  o("formal", "رسمي", "رسمية"),
  o("friendly", "ودود", "ودودة"),
  o("enthusiastic", "حماسي", "حماسية"),
  o("calm", "هادي", "هادئة"),
  o("persuasive", "مقنع", "مقنعة"),
  o("simple", "بسيط", "بسيطة وسهلة الفهم"),
  o("humor", "فكاهة خفيفة", "خفيفة الظل من غير مبالغة"),
];
const LENGTH = [
  o("xs", "قصير جداً", "قصير جداً (من 3 لـ 4 أسطر)"),
  o("s", "متوسط", "متوسط (فقرتين أو تلاتة)"),
  o("l", "مفصّل", "مفصّل وشامل"),
];
const ASK = o("ask", "اسألني لو ناقص معلومة", "لو ناقصك أي معلومة مهمة قبل ما تكتب، اسألني الأول بدل ما تخمّن");
const CONS_COMMON = [
  o("nocliche", "بدون كليشيهات", "تجنّب العبارات المكررة والكليشيهات"),
  o("nofake", "لا تخترع معلومات", "ممنوع تخترع أرقام أو أسعار أو ضمانات أو معلومات مش موجودة في كلامي"),
  o("nohype", "بدون مبالغة", "من غير مبالغة أو وعود مش مضمونة"),
  o("result1", "ابدأ بالنتيجة", "ابدأ بالنتيجة أو الخلاصة الأول وبعدها التفاصيل"),
  o("alt3", "3 بدائل", "اديني 3 بدائل مختلفة أختار منها"),
  o("example", "أضف مثال", "ضيف مثال عملي واحد على الأقل"),
  ASK,
];

/* ---------------- الأنواع والحقول ---------------- */
// kind: text (كتابة حرة) | single (اختيار واحد) | multi (لحد max اختيارات)
export const TYPES = [
  {
    id: "chat", name: "شات وكتابة", lang: "ar",
    hint: "للشات (ChatGPT وClaude وغيرهم) ولأي كتابة: تحليل، شرح، تلخيص، رسايل، أفكار",
    ideaLabel: "عايز الشات يعمل إيه؟", ideaPlaceholder: "مثلاً: اكتب لي خطة محتوى أسبوع لمتجر ملابس أطفال",
    fields: [
      { id: "role", label: "الدور", kind: "single", w: 12, options: [
        o("mkt", "خبير تسويق رقمي", "خبير تسويق رقمي بخبرة عملية في السوق العربي"),
        o("copy", "كاتب إعلانات", "كاتب إعلانات محترف"),
        o("teacher", "مدرّس صبور", "مدرّس صبور بيشرح بخطوات بسيطة"),
        o("biz", "مستشار أعمال", "مستشار أعمال للمشاريع الصغيرة"),
        o("data", "محلل بيانات", "محلل بيانات بيوضّح استنتاجاته"),
        o("editor", "محرر لغوي", "محرر لغوي دقيق"),
        o("coach", "مدرّب شخصي", "مدرّب بيحفّز ويحاسب بلطف"),
      ] },
      { id: "context", label: "السياق (اختياري)", kind: "text", w: 12, placeholder: "معلومات عن مشروعك أو موقفك: النشاط، البلد، السعر، اللي جربته قبل كده…" },
      { id: "audience", label: "الجمهور", kind: "single", w: 10, options: [
        o("all", "ناس عاديين", "ناس عاديين من غير خلفية تقنية"),
        o("owners", "أصحاب مشاريع", "أصحاب مشاريع صغيرة"),
        o("students", "طلاب", "طلاب"),
        o("staff", "موظفين", "موظفين ومهنيين"),
        o("moms", "أمهات", "أمهات"),
        o("youth", "شباب", "شباب من 18 لـ 30 سنة"),
      ] },
      { id: "tone", label: "النبرة", kind: "multi", max: 2, w: 8, options: TONE },
      { id: "dialect", label: "اللغة أو اللهجة", kind: "single", w: 10, options: DIALECT },
      { id: "format", label: "شكل الإجابة", kind: "single", w: 10, options: [
        o("para", "فقرات قصيرة", "فقرات قصيرة"),
        o("bullets", "نقاط", "نقاط مختصرة"),
        o("steps", "خطوات مرقمة", "خطوات مرقمة"),
        o("table", "جدول", "جدول منظم"),
        o("post", "بوست جاهز", "بوست جاهز للنشر"),
        o("email", "إيميل", "إيميل جاهز للإرسال"),
        o("faq", "أسئلة وأجوبة", "قائمة أسئلة وأجوبة"),
      ] },
      { id: "length", label: "الطول", kind: "single", w: 6, options: LENGTH },
      { id: "constraints", label: "التزامات", kind: "multi", max: 4, w: 10, options: CONS_COMMON },
    ],
  },
  {
    id: "ad", name: "إعلان ومحتوى تسويقي", lang: "ar",
    hint: "نص إعلان أو بوست لمنتج أو خدمة على فيسبوك أو إنستجرام أو واتساب أو أمازون",
    ideaLabel: "إيه المنتج أو الخدمة؟", ideaPlaceholder: "مثلاً: طقم حلل جرانيت تركي 10 قطع، غير لاصق، لونه رمادي",
    fields: [
      { id: "platform", label: "هيتنشر فين؟", kind: "single", w: 12, options: [
        o("fb", "فيسبوك", "بوست إعلاني على فيسبوك"),
        o("ig", "إنستجرام", "كابشن إنستجرام"),
        o("tt", "تيك توك", "وصف ونص فيديو تيك توك"),
        o("wa", "واتساب", "رسالة واتساب أو حالة"),
        o("amz", "أمازون", "ليستنج أمازون (عنوان ونقاط ووصف) بدون أي ادعاءات ممنوعة"),
        o("ggl", "إعلان جوجل", "إعلان نصي قصير على جوجل"),
      ] },
      { id: "goal", label: "الهدف", kind: "single", w: 12, options: [
        o("sales", "مبيعات مباشرة", "تحويل القارئ لطلب مباشر"),
        o("wa", "رسائل واتساب", "دفع القارئ لإرسال رسالة على واتساب"),
        o("engage", "تفاعل", "رفع التفاعل والتعليقات والمشاركات"),
        o("brand", "تعريف بالبراند", "تعريف الناس بالبراند وبناء ثقة"),
      ] },
      { id: "offer", label: "تفاصيل العرض (اختياري)", kind: "text", w: 10, placeholder: "السعر، الخصم، مدة العرض، الشحن… اكتب اللي حقيقي بس" },
      { id: "audience", label: "الجمهور", kind: "single", w: 10, options: [
        o("women", "ستات", "ستات من 22 لـ 50 سنة"),
        o("men", "رجالة", "رجالة من 22 لـ 55 سنة"),
        o("youth", "شباب وطلاب", "شباب وطلاب"),
        o("moms", "أمهات", "أمهات عندهم أطفال"),
        o("biz", "أصحاب محلات", "أصحاب محلات وتجار"),
        o("all", "الجمهور العام", "الجمهور العام"),
      ] },
      { id: "structure", label: "هيكل النص", kind: "single", w: 8, options: [
        o("aida", "انتباه ← اهتمام ← رغبة ← إجراء", "إطار AIDA (انتباه، اهتمام، رغبة، إجراء)"),
        o("pas", "مشكلة ← تفاقم ← حل", "إطار PAS (المشكلة، تضخيمها، الحل)"),
        o("story", "قصة قصيرة", "قصة قصيرة بتنتهي بالمنتج كحل"),
        o("benefits", "قائمة فوائد", "قائمة فوائد واضحة بترتيب الأهمية"),
      ] },
      { id: "tone", label: "النبرة", kind: "multi", max: 2, w: 8, options: TONE },
      { id: "dialect", label: "اللغة أو اللهجة", kind: "single", w: 10, options: DIALECT },
      { id: "cta", label: "دعوة للإجراء", kind: "single", w: 6, options: [
        o("dm", "كلمنا خاص", "اختم بدعوة للتواصل على الخاص"),
        o("wa", "اطلب واتساب", "اختم بدعوة لطلب المنتج على واتساب"),
        o("link", "اضغط الرابط", "اختم بدعوة لضغط الرابط"),
        o("comment", "اكتب في التعليقات", "اختم بدعوة للتعليق بكلمة محددة"),
      ] },
      { id: "length", label: "الطول", kind: "single", w: 4, options: LENGTH },
      { id: "constraints", label: "التزامات", kind: "multi", max: 4, w: 10, options: [
        o("nofake", "لا تخترع سعر أو ضمان", "ممنوع تخترع سعر أو خصم أو ضمان أو معلومة مش موجودة في كلامي"),
        o("nocliche", "بدون كليشيهات", "تجنّب كليشيهات زي «لا تفوت الفرصة» و«عرض لفترة محدودة»"),
        o("hook", "أول سطر قوي", "خلي أول سطر قادر يوقف القارئ وهو بيسكرول"),
        o("emoji", "إيموجي بحساب", "استخدم إيموجي بحساب (3 كحد أقصى)"),
        o("alt3", "3 نسخ مختلفة", "اديني 3 نسخ مختلفة الزاوية"),
        ASK,
      ] },
    ],
  },
  {
    id: "reels", name: "ريلز وتيك توك (سكريبت)", lang: "ar",
    hint: "سكريبت فيديو قصير بمشاهد وكلام ونص على الشاشة",
    ideaLabel: "الريل عن إيه؟", ideaPlaceholder: "مثلاً: 3 أخطاء بيعملها أصحاب المتاجر الأونلاين في الإعلانات",
    fields: [
      { id: "platform", label: "المنصة", kind: "single", w: 8, options: [o("reels", "ريلز إنستجرام", "ريلز إنستجرام"), o("tt", "تيك توك", "تيك توك"), o("yt", "يوتيوب شورتس", "يوتيوب شورتس")] },
      { id: "duration", label: "المدة", kind: "single", w: 8, options: [o("15", "15 ثانية", "15 ثانية"), o("30", "30 ثانية", "30 ثانية"), o("60", "60 ثانية", "60 ثانية")] },
      { id: "hook", label: "نوع الافتتاحية (الهوك)", kind: "single", w: 12, options: [
        o("question", "سؤال صادم", "سؤال صادم أو استفزازي بيخلي المشاهد يكمل"),
        o("number", "رقم أو حقيقة", "رقم أو حقيقة مفاجئة"),
        o("mistake", "خطأ شائع", "تنبيه من خطأ شائع بيعمله المشاهد"),
        o("beforeafter", "قبل وبعد", "مقارنة قبل وبعد"),
        o("secret", "سر", "كشف سر أو حاجة محدش بيقولها"),
      ] },
      { id: "structure", label: "هيكل الفيديو", kind: "single", w: 10, options: [
        o("ps", "مشكلة ← حل", "مشكلة ثم حل"),
        o("steps", "خطوات", "خطوات سريعة مرقمة"),
        o("story", "قصة", "قصة قصيرة"),
        o("list", "قائمة", "قائمة نقاط سريعة"),
      ] },
      { id: "audience", label: "الجمهور (اختياري)", kind: "text", w: 8, placeholder: "مثلاً: أصحاب متاجر صغيرة على فيسبوك" },
      { id: "dialect", label: "اللغة أو اللهجة", kind: "single", w: 10, options: DIALECT },
      { id: "tone", label: "النبرة", kind: "multi", max: 2, w: 8, options: TONE },
      { id: "cta", label: "الخاتمة", kind: "single", w: 6, options: [o("follow", "تابعني", "دعوة للمتابعة"), o("save", "احفظ الفيديو", "دعوة لحفظ الفيديو"), o("comment", "علّق بكلمة", "دعوة للتعليق بكلمة محددة"), o("dm", "ابعتلي رسالة", "دعوة لإرسال رسالة")] },
    ],
  },
  {
    id: "image", name: "صورة", lang: "en",
    hint: "برومبت لمولّدات الصور (بالإنجليزي لأن الموديلات بتفهمه أدق)",
    ideaLabel: "إيه موضوع الصورة؟", ideaPlaceholder: "A cup of Arabic coffee with dates on a wooden tray",
    ideaNote: "اكتب الموضوع بالإنجليزي، أو اكتبه بالعربي واضغط «حوّل للإنجليزي».",
    fields: [
      { id: "style", label: "الأسلوب", kind: "single", w: 12, options: [
        o("photo", "صورة واقعية", "photorealistic photograph"),
        o("cinematic", "لقطة سينمائية", "cinematic film still"),
        o("product", "تصوير منتجات", "professional studio product photography"),
        o("watercolor", "رسم مائي", "soft watercolor illustration"),
        o("render3d", "3D", "polished 3D render"),
        o("vector", "فلات فيكتور", "clean flat vector illustration"),
        o("anime", "أنمي", "anime style illustration"),
        o("iso", "أيزومتري", "isometric 3D illustration"),
        o("poster", "بوستر مينيمال", "minimalist graphic poster"),
      ] },
      { id: "lighting", label: "الإضاءة", kind: "single", w: 10, options: [
        o("window", "ضوء نافذة ناعم", "soft natural window light"),
        o("golden", "ساعة ذهبية", "warm golden hour backlight"),
        o("rim", "إضاءة درامية", "dramatic rim light"),
        o("softbox", "سوفت بوكس", "studio softbox lighting"),
        o("lowkey", "إضاءة غامقة", "moody low-key lighting"),
        o("neon", "نيون ليلي", "neon night lighting"),
      ] },
      { id: "camera", label: "الكاميرا والعدسة", kind: "single", w: 10, options: [
        o("portrait", "بورتريه 85mm", "85mm lens, shallow depth of field"),
        o("wide", "واسعة 24mm", "24mm wide angle lens"),
        o("std", "عادية 50mm", "50mm lens"),
        o("macro", "ماكرو", "macro lens, extreme close-up"),
        o("top", "من فوق", "overhead top-down view"),
        o("low", "زاوية منخفضة", "low angle shot"),
        o("drone", "درون", "aerial drone view"),
      ] },
      { id: "palette", label: "الألوان", kind: "single", w: 8, options: [
        o("warm", "دافية ترابية", "warm earthy color palette"),
        o("cool", "باردة زرقا", "cool blue and teal color palette"),
        o("pastel", "باستيل", "soft pastel color palette"),
        o("bw", "أبيض وأسود", "black and white"),
        o("vivid", "زاهية", "vibrant saturated colors"),
        o("muted", "هادية", "muted neutral tones"),
      ] },
      { id: "background", label: "الخلفية", kind: "single", w: 8, options: [
        o("white", "بيضا صافية", "pure white background"),
        o("bokeh", "مموّهة", "blurred bokeh background"),
        o("dark", "داكنة متدرجة", "dark gradient background"),
        o("outdoor", "طبيعة", "natural outdoor setting"),
        o("studio", "استوديو مينيمال", "minimal studio backdrop"),
        o("wall", "جدار بملمس", "textured wall backdrop"),
      ] },
      { id: "mood", label: "الإحساس", kind: "multi", max: 2, w: 6, options: [o("calm", "هادي", "calm"), o("lux", "فخم", "luxurious"), o("energy", "حيوي", "energetic"), o("nostalgic", "حنين", "nostalgic"), o("mystery", "غامض", "mysterious")] },
      { id: "aspect", label: "النسبة", kind: "single", w: 8, options: [o("11", "1:1", "1:1"), o("45", "4:5", "4:5"), o("916", "9:16 (ستوري)", "9:16"), o("169", "16:9", "16:9")] },
      { id: "quality", label: "الجودة", kind: "multi", max: 3, w: 4, options: [o("detail", "تفاصيل عالية", "ultra detailed"), o("sharp", "حدة", "sharp focus"), o("res", "دقة عالية", "high resolution"), o("grain", "حبيبات فيلم", "subtle film grain")] },
      { id: "avoid", label: "تجنّب", kind: "multi", max: 4, w: 6, options: [o("text", "كتابة وعلامات", "text, watermark, logo"), o("blur", "ضبابية", "blurry, low quality"), o("hands", "تشوه اليدين", "extra fingers, deformed hands"), o("sat", "ألوان مبالغ فيها", "oversaturated colors")] },
    ],
  },
  {
    id: "video", name: "فيديو", lang: "en",
    hint: "برومبت لمولّدات الفيديو (بالإنجليزي)",
    ideaLabel: "إيه اللي بيحصل في المشهد؟", ideaPlaceholder: "A potter shaping a clay vase on a spinning wheel",
    ideaNote: "اكتب المشهد بالإنجليزي، أو اكتبه بالعربي واضغط «حوّل للإنجليزي».",
    fields: [
      { id: "camera", label: "حركة الكاميرا", kind: "single", w: 12, options: [
        o("push", "تقريب بطيء", "slow smooth push-in toward the subject"),
        o("pull", "ابتعاد وكشف", "slow pull-back revealing the whole scene"),
        o("orbit", "دوران حوالين الموضوع", "camera orbits around the subject"),
        o("track", "تتبّع", "tracking shot following the subject"),
        o("hand", "كاميرا محمولة", "natural handheld camera with subtle shake"),
        o("drone", "درون ينزل", "high drone shot descending slowly"),
        o("static", "ثابتة", "static tripod shot"),
        o("slowmo", "سلو موشن", "ultra slow motion"),
      ] },
      { id: "style", label: "الأسلوب", kind: "single", w: 10, options: [o("cine", "سينمائي", "cinematic"), o("doc", "وثائقي", "documentary style"), o("ad", "إعلان تجاري", "high-end commercial look"), o("anim3d", "أنيميشن 3D", "3D animation"), o("anime", "أنمي", "anime style"), o("vintage", "فيلم قديم", "vintage film look")] },
      { id: "setting", label: "المكان (اختياري)", kind: "text", w: 8, placeholder: "A sunlit pottery workshop with shelves of clay pots" },
      { id: "lighting", label: "الإضاءة", kind: "single", w: 8, options: [o("golden", "ساعة ذهبية", "warm golden hour light"), o("window", "ضوء نافذة", "soft window light"), o("rim", "درامية", "dramatic rim light"), o("neon", "نيون", "neon night lighting"), o("overcast", "غيم ناعم", "soft overcast light")] },
      { id: "mood", label: "الإحساس", kind: "multi", max: 2, w: 6, options: [o("calm", "هادي", "calm"), o("epic", "ملحمي", "epic"), o("warm", "دافي", "warm and intimate"), o("tense", "مشدود", "tense"), o("joy", "بهجة", "joyful")] },
      { id: "duration", label: "المدة", kind: "single", w: 6, options: [o("5", "5 ثواني", "5 seconds"), o("10", "10 ثواني", "10 seconds"), o("15", "15 ثانية", "15 seconds")] },
      { id: "aspect", label: "النسبة", kind: "single", w: 8, options: [o("169", "16:9", "16:9"), o("916", "9:16", "9:16"), o("11", "1:1", "1:1")] },
    ],
  },
];

export const TYPE_BY_ID = Object.fromEntries(TYPES.map((t) => [t.id, t]));

/* ---------------- الحالة والتجميع ---------------- */
export const emptyState = (type = "chat") => ({ type, idea: "", values: {} });

const pick = (field, val) => {
  if (field.kind === "text") return String(val || "").trim();
  const list = field.kind === "multi" ? (Array.isArray(val) ? val : []) : val ? [val] : [];
  return list.map((v) => field.options.find((x) => x.v === v)).filter(Boolean);
};
const texts = (field, val) => { const r = pick(field, val); return field.kind === "text" ? (r ? [r] : []) : r.map((x) => x.text); };
const lc1 = (s) => (/^(A|An|The) [a-z]/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);
const joinAr = (a) => (a.length <= 1 ? a.join("") : `${a.slice(0, -1).join("، ")} و${a[a.length - 1]}`);

/** بيجمع القيم المختارة في كائن مقروء: { fieldId: ["نص", ...] } */
function resolved(state) {
  const t = TYPE_BY_ID[state.type];
  const out = {};
  for (const f of t.fields) out[f.id] = texts(f, state.values?.[f.id]);
  return out;
}

/** الناتج: { prompt, negative?, lang } */
export function compile(state) {
  const t = TYPE_BY_ID[state.type];
  if (!t) return { prompt: "", lang: "ar" };
  const idea = String(state.idea || "").trim();
  const r = resolved(state);
  const one = (id) => r[id]?.[0] || "";

  if (state.type === "chat") {
    const lines = [];
    lines.push(`أنت ${one("role") || "مساعد خبير بيشرح بوضوح"}.`);
    lines.push("", `المهمة: ${idea || "[اكتب مهمتك هنا]"}`);
    if (one("context")) lines.push("", `السياق: ${one("context")}`);
    if (one("audience")) lines.push(`الجمهور المستهدف: ${one("audience")}.`);
    const style = [r.tone.length ? `النبرة ${joinAr(r.tone)}` : "", one("dialect") ? `اكتب ${one("dialect")}` : ""].filter(Boolean);
    if (style.length) lines.push("", `الأسلوب: ${style.join(". ")}.`);
    const shape = [one("format") ? `الشكل: ${one("format")}` : "", one("length") ? `الطول: ${one("length")}` : ""].filter(Boolean);
    if (shape.length) lines.push(shape.join("، ") + ".");
    if (r.constraints.length) lines.push("", "التزم بالآتي:", ...r.constraints.map((c) => `- ${c}`));
    return { prompt: lines.join("\n"), lang: "ar" };
  }

  if (state.type === "ad") {
    const lines = [];
    lines.push(`أنت كاتب إعلانات محترف في السوق العربي. اكتب ${one("platform") || "بوست إعلاني"}.`);
    lines.push("", `المنتج أو الخدمة: ${idea || "[اكتب منتجك هنا]"}`);
    if (one("offer")) lines.push(`تفاصيل العرض: ${one("offer")}`);
    if (one("goal")) lines.push(`الهدف: ${one("goal")}.`);
    if (one("audience")) lines.push(`الجمهور: ${one("audience")}.`);
    if (one("structure")) lines.push("", `الهيكل: ${one("structure")}.`);
    const style = [r.tone.length ? `النبرة ${joinAr(r.tone)}` : "", one("dialect") ? `اكتب ${one("dialect")}` : "", one("length") ? `الطول ${one("length")}` : ""].filter(Boolean);
    if (style.length) lines.push(`الأسلوب: ${style.join("، ")}.`);
    if (one("cta")) lines.push(one("cta") + ".");
    if (r.constraints.length) lines.push("", "التزم بالآتي:", ...r.constraints.map((c) => `- ${c}`));
    return { prompt: lines.join("\n"), lang: "ar" };
  }

  if (state.type === "reels") {
    const dur = one("duration") || "30 ثانية";
    const lines = [];
    lines.push(`أنت كاتب سكريبتات ${one("platform") || "ريلز"} بتجيب مشاهدات حقيقية. اكتب سكريبت فيديو مدته ${dur}.`);
    lines.push("", `الموضوع: ${idea || "[اكتب موضوع الفيديو]"}`);
    if (one("audience")) lines.push(`الجمهور: ${one("audience")}.`);
    if (one("hook")) lines.push("", `الافتتاحية (أول 3 ثواني): ${one("hook")}.`);
    if (one("structure")) lines.push(`الهيكل: ${one("structure")}.`);
    const style = [r.tone.length ? `النبرة ${joinAr(r.tone)}` : "", one("dialect") ? `اكتب ${one("dialect")}` : ""].filter(Boolean);
    if (style.length) lines.push(`الأسلوب: ${style.join("، ")}.`);
    if (one("cta")) lines.push(`الخاتمة: ${one("cta")}.`);
    lines.push("", "اكتب الناتج في جدول أعمدته: رقم المشهد، الزمن، الكلام المنطوق، وصف اللقطة، النص على الشاشة.", "- جمل قصيرة مناسبة للنطق.", "- ممنوع تخترع أرقام أو إحصائيات مش مؤكدة.");
    return { prompt: lines.join("\n"), lang: "ar" };
  }

  if (state.type === "image") {
    const mood = r.mood.length ? `${r.mood.join(" and ")} mood` : "";
    const parts = [
      idea || "[describe the subject]",
      one("style"), one("lighting"), one("camera"),
      one("palette"), one("background") ? `${one("background")}` : "", mood,
      ...(r.quality || []),
    ].filter(Boolean);
    const prompt = parts.join(", ") + (one("aspect") ? `. Aspect ratio ${one("aspect")}.` : ".");
    const negative = (r.avoid || []).join(", ");
    return { prompt, negative, lang: "en" };
  }

  if (state.type === "video") {
    const parts = [
      idea || "[describe the scene and action]",
      lc1(one("setting")), one("camera"), one("style"), one("lighting"),
      r.mood.length ? `${r.mood.join(" and ")} mood` : "",
    ].filter(Boolean);
    const tail = [one("duration") ? `Duration ${one("duration")}` : "", one("aspect") ? `aspect ratio ${one("aspect")}` : ""].filter(Boolean).join(", ");
    return { prompt: parts.join(", ") + "." + (tail ? ` ${tail}.` : ""), lang: "en" };
  }
  return { prompt: "", lang: "ar" };
}

/* ---------------- تقييم جودة البرومبت ---------------- */
// كل حقل ليه وزن (w). الدرجة = نسبة الأوزان المكتملة. والنصايح بترتب بالأهم.
export function score(state) {
  const t = TYPE_BY_ID[state.type];
  if (!t) return { score: 0, tips: [], level: "weak" };
  const idea = String(state.idea || "").trim();
  const words = idea.split(/\s+/).filter(Boolean).length;
  const IDEA_W = 30;
  let got = 0;
  let total = IDEA_W;
  const tips = [];
  if (words >= 4) got += IDEA_W;
  else if (words >= 2) { got += IDEA_W * 0.5; tips.push({ w: IDEA_W / 2, text: `${t.ideaLabel} اكتب تفاصيل أكتر (على الأقل 4 كلمات).` }); }
  else tips.push({ w: IDEA_W, text: `${t.ideaLabel} ده أهم حقل، اكتبه الأول.` });

  for (const f of t.fields) {
    total += f.w;
    const v = state.values?.[f.id];
    const filled = f.kind === "text" ? String(v || "").trim().length > 2 : f.kind === "multi" ? Array.isArray(v) && v.length > 0 : !!v;
    if (filled) got += f.w;
    else tips.push({ w: f.w, text: `حدّد «${f.label.replace(/ \(اختياري\)/, "")}» عشان النتيجة تبقى أدق.` });
  }
  const sc = Math.round((got / total) * 100);
  tips.sort((a, b) => b.w - a.w);
  return { score: sc, tips: tips.slice(0, 3).map((x) => x.text), level: sc >= 80 ? "great" : sc >= 55 ? "good" : "weak" };
}

/* ---------------- عشوائي (فاجئني) ---------------- */
// مولّد أرقام بسيط بالبذرة عشان النتيجة تتكرر بنفس البذرة (للاختبار)
function rng(seed) { let s = seed >>> 0 || 1; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }

export function randomize(state, seed = Date.now()) {
  const t = TYPE_BY_ID[state.type];
  const rand = rng(seed);
  const values = { ...(state.values || {}) };
  for (const f of t.fields) {
    if (f.kind === "text") continue;
    const opts = f.options;
    if (f.kind === "single") values[f.id] = opts[Math.floor(rand() * opts.length)].v;
    else {
      const n = Math.min(f.max || 2, Math.max(1, 1 + Math.floor(rand() * Math.min(2, opts.length))));
      const pool = [...opts];
      const out = [];
      while (out.length < n && pool.length) out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0].v);
      values[f.id] = out;
    }
  }
  return { ...state, values };
}

/* ---------------- مشاركة بالرابط ---------------- */
const b64 = {
  enc: (s) => { const bin = String.fromCharCode(...new TextEncoder().encode(s)); return (typeof btoa === "function" ? btoa(bin) : Buffer.from(bin, "binary").toString("base64")).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""); },
  dec: (s) => { const p = s.replace(/-/g, "+").replace(/_/g, "/"); const bin = typeof atob === "function" ? atob(p + "=".repeat((4 - (p.length % 4)) % 4)) : Buffer.from(p, "base64").toString("binary"); return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0))); },
};

export const encodeState = (state) => b64.enc(JSON.stringify({ t: state.type, i: state.idea, v: state.values }));

/** بيفك الرابط ويقبل فقط الأنواع والحقول والاختيارات المعروفة (أي حاجة تانية بتتشال) */
export function decodeState(str) {
  try {
    const j = JSON.parse(b64.dec(String(str || "")));
    const t = TYPE_BY_ID[j.t];
    if (!t) return null;
    const values = {};
    for (const f of t.fields) {
      const raw = j.v?.[f.id];
      if (raw == null) continue;
      if (f.kind === "text") { const s = String(raw).slice(0, 400); if (s.trim()) values[f.id] = s; }
      else if (f.kind === "single") { if (f.options.some((x) => x.v === raw)) values[f.id] = raw; }
      else if (Array.isArray(raw)) { const ok = raw.filter((x) => f.options.some((y) => y.v === x)).slice(0, f.max || 2); if (ok.length) values[f.id] = ok; }
    }
    return { type: t.id, idea: String(j.i || "").slice(0, 600), values };
  } catch { return null; }
}

/** كلام مختصر عن المعايير المختارة، بنبعته للذكاء الاصطناعي في وضع «ولّد لي أفكار» */
export function criteriaSummary(state) {
  const t = TYPE_BY_ID[state.type];
  const r = resolved(state);
  return t.fields.map((f) => (r[f.id]?.length ? `${f.label.replace(/ \(اختياري\)/, "")}: ${r[f.id].join(" + ")}` : "")).filter(Boolean).join("\n");
}

/** عدد التركيبات الممكنة لنوع (للعرض في الصفحة) */
export function combinations(typeId) {
  const t = TYPE_BY_ID[typeId];
  return t.fields.reduce((n, f) => (f.kind === "single" ? n * (f.options.length + 1) : f.kind === "multi" ? n * (f.options.length + 1) : n), 1);
}
