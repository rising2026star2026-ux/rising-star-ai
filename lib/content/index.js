// محتوى صفحات الأدوات: شرح، استخدامات، مثال جاهز، وأسئلة شائعة لكل أداة.
// كل تصنيف في ملف لوحده عشان يبقى سهل التعديل.
import writing from "./writing";
import marketing from "./marketing";
import social from "./social";
import business from "./business";
import ecommerce from "./ecommerce";
import education from "./education";
import language from "./language";
import code from "./code";
import career from "./career";
import productivity from "./productivity";
import communication from "./communication";
import creative from "./creative";
import design from "./design";
import analysis from "./analysis";
import lifestyle from "./lifestyle";
import studio from "./studio";

const ALL = {
  ...writing, ...marketing, ...social, ...business, ...ecommerce,
  ...education, ...language, ...code, ...career, ...productivity,
  ...communication, ...creative, ...design, ...analysis, ...lifestyle, ...studio,
};

/** محتوى أداة واحدة، أو null لو مش موجود. */
export function getContent(id) {
  return ALL[id] || null;
}

// سؤال بيظهر في كل صفحات الأدوات. عدّله من هنا مرة واحدة.
export const SHARED_FAQ = [
  [
    "اللي بكتبه بيتحفظ فين؟",
    "نتايجك بتتحفظ في «السجل» على جهازك انت بس. اللي بتكتبه بيتبعت لمزوّد الذكاء الاصطناعي عشان يطلع النتيجة، فمتكتبش كلمات سر أو أرقام حسابات أو كروت.",
  ],
];

// سؤال بيظهر في كل أدوات «استوديو التصميم» (اللي بتشتغل على جهاز المستخدم)
export const STUDIO_FAQ = [
  [
    "ملفاتي بتترفع على الموقع؟",
    "لا. الأداة دي بتشتغل جوه المتصفح بتاعك بالكامل، والصور والملفات ما بتطلعش من جهازك خالص، ومش بتستهلك من حد الاستخدام بتاعك.",
  ],
];
