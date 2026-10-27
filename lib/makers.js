// قسم «صانع الصور والفيديو»: 38 أداة مجانية أو فيها جزء مجاني (أكتوبر 2026).
// معلومات الحدود من مقالات منشورة في 2026 وبتتغير بسرعة، والصفحة بتقول للمستخدم يتأكد من الموقع الرسمي.
// بيانات الفحص الآلي (الشعار، وهل الموقع بيتفتح جوه إطار) في data/makers-probe.json وبيعملها scripts/makers/probe.mjs
import PROBE from "@/data/makers-probe.json";
import { MAKERS } from "@/scripts/makers/list.mjs";

export const MAKER_KINDS = [
  { id: "image", title: "صانع الصور", sub: "صور من وصف مكتوب" },
  { id: "video", title: "صانع الفيديو", sub: "مقاطع فيديو من وصف أو صورة" },
  { id: "editor", title: "المونتاج والفيديو الجاهز", sub: "مونتاج وفيديوهات من قوالب" },
];

// free: الحد المجاني. login: محتاج تسجيل؟ ar: دعم العربي حسب مقالات منشورة (مش اختبار مننا)
const D = {
  pollinations: { free: "مجاني بدون تسجيل", login: false, note: "بنستخدمه جوه موقعنا: اكتب وصفك واطلع الصورة هنا." },
  perchance: { free: "مجاني، بإعلانات", login: false },
  "raphael-ai": { free: "مجاني، بإعلانات", login: false },
  dezgo: { free: "مجاني، بحد على المعدل وإعلانات", login: false },
  craiyon: { free: "مجاني، بإعلانات وعلامة مائية", login: false },
  deepai: { free: "مجاني، بإعلانات", login: "اختياري" },
  "flux-space": { free: "مجاني، وساعات فيه طابور انتظار", login: "اختياري", note: "موديل Flux على منصة Hugging Face." },
  "lm-arena": { free: "مجاني بحد كبير", login: false },
  "meta-ai": { free: "مجاني بحد كبير", login: true },
  "bing-image-creator": { free: "مجاني: توليد سريع بحد يومي وبعدها أبطأ", login: "حساب مايكروسوفت" },
  imagefx: { free: "مجاني، وبيختلف حسب البلد", login: "حساب جوجل" },
  "gemini-image": { free: "حوالي 10 لـ15 صورة في اليوم", login: "حساب جوجل" },
  ideogram: { free: "توليدات بطيئة يومية مجانية (حوالي 25 في اليوم حسب مقال)", login: true },
  leonardo: { free: "حوالي 150 رصيد يومياً", login: true },
  krea: { free: "حوالي 100 وحدة حساب يومياً", login: true },
  playground: { free: "الحد بيختلف حسب المصدر: من 10 صور كل كام ساعة لحد 100 صورة يومياً", login: true },
  recraft: { free: "حوالي 50 رصيد يومياً", login: true },
  "freepik-ai": { free: "من 3 لـ20 صورة يومياً (المصادر مش متفقة)", login: true },
  "mage-space": { free: "حد كبير، وبعض الموديلات محتاجة حساب", login: "اختياري" },
  seaart: { free: "رصيد يومي", login: true },
  "tensor-art": { free: "رصيد يومي", login: true },
  firefly: { free: "25 توليد في الشهر", login: true, ar: "بيكتب نص عربي جوه الصور حسب مقال منشور" },
  "canva-magic": { free: "حوالي 50 توليد مدى الحياة على الخطة المجانية", login: true, ar: "واجهة عربية وبيفهم وصف عربي حسب مقال منشور" },
  pixlr: { free: "رصيد يومي مع إعلانات", login: true },
  fotor: { free: "رصيد يومي وتصدير محدود", login: true },
  "google-flow": { free: "50 رصيد يومياً: حوالي 5 مقاطع Veo 3.1 Lite، كل مقطع لحد 8 ثواني", login: "حساب جوجل" },
  dreamina: { free: "رصيد يومي مجاني، وممكن تظهر علامة مائية", login: true },
  kling: { free: "حوالي 66 رصيد يومياً: مقاطع 5 ثواني بعلامة مائية، وللاستخدام الشخصي", login: true, ar: "بيفهم الوصف العربي كويس حسب مقال منشور" },
  pixverse: { free: "60 رصيد يومياً: حوالي مقطعين قصيرين بعلامة مائية", login: true },
  vidu: { free: "حوالي 40 رصيد شهرياً بعلامة مائية", login: true },
  hailuo: { free: "رصيد ترحيبي بينتهي بعد 3 أيام تقريباً، يعني تجربة مش مجاني دائم", login: true },
  "wan-space": { free: "موديل مفتوح المصدر، وتجربته مجاناً على Hugging Face بطابور انتظار", login: "اختياري", note: "الموديل نفسه مجاني تماماً لو شغلته على جهاز قوي." },
  genmo: { free: "تجربة سحابية بتطلب إضافة وسيلة دفع من غير خصم، والموديل مفتوح المصدر", login: true },
  "canva-video": { free: "مقاطع من غير علامة مائية، والحد مش واضح", login: true, ar: "واجهة عربية وبيفهم وصف عربي حسب مقال منشور" },
  renderforest: { free: "تفاصيل الخطة المجانية مش واضحة، شوفها من الموقع", login: true, ar: "بيدعم العربي وتعليق صوتي بلهجات حسب مقال منشور" },
  clipchamp: { free: "مونتاج مجاني بتصدير 1080p من غير حد", login: true, note: "مونتاج مش توليد فيديو بالذكاء الاصطناعي." },
  capcut: { free: "محرر مجاني، لكن الخطة المجانية مفيهاش رصيد توليد فيديو", login: true, note: "مونتاج مش توليد فيديو بالذكاء الاصطناعي." },
  "vn-editor": { free: "محرر مجاني بدون علامة مائية", login: false, note: "مونتاج مش توليد فيديو بالذكاء الاصطناعي." },
  lumen5: { free: "5 فيديوهات في الشهر بمدة 2 دقيقة بحد أقصى", login: true, note: "فيديوهات من مواد جاهزة مش توليد بالذكاء الاصطناعي." },
};

const probeBy = Object.fromEntries((PROBE.tools || []).map((t) => [t.slug, t]));

export const MAKER_LIST = MAKERS.map(([slug, name, kind, url]) => {
  const p = probeBy[slug] || {};
  return {
    slug, name, kind, url: p.finalUrl && p.status && p.status < 400 ? url : url,
    logo: p.logo || null,
    embed: p.embed === "maybe" ? "frame" : "open",
    reachable: p.status ? p.status < 400 : null,
    ...D[slug],
    href: `/maker/${slug}`,
  };
});

export const getMaker = (slug) => MAKER_LIST.find((m) => m.slug === slug);
export const makersIn = (kind) => MAKER_LIST.filter((m) => m.kind === kind);
export const POLL = PROBE.pollinations || {};
