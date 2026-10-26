// سكريبت فيديو قصير لأداة «صانع الريلز» — الفيديو نفسه بيترسم في متصفح المستخدم ببلاش
import { getModel } from "@/lib/models";
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";

const tooMany = rateLimiter(20); // 20 سكريبت في الساعة لكل زائر
const DIALECTS = { egy: "بالعامية المصرية", fusha: "بالفصحى المبسطة", gulf: "باللهجة الخليجية" };
const GOALS = {
  tips: "نصايح أو معلومات مفيدة، كل مشهد معلومة واحدة",
  ad: "إعلان لمنتج أو خدمة: مشكلة ثم الحل ثم الميزة ثم العرض",
  story: "قصة قصيرة مشوقة بتتصاعد",
  quote: "كلام تحفيزي أو حكمة مؤثرة",
};

export const maxDuration = 30;

export async function POST(req) {
  if (!process.env.GROQ_API_KEY) return fail("مفتاح Groq غير مضاف في إعدادات Vercel.", 500);
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const topic = String(body.topic || "").trim().slice(0, 600);
  if (!topic) return fail("اكتب فكرة الفيديو الأول.", 400);
  const count = Math.min(10, Math.max(3, parseInt(body.count, 10) || 6));
  const dialect = DIALECTS[body.dialect] || DIALECTS.egy;
  const goal = GOALS[body.goal] || GOALS.tips;
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  const system = [
    "أنت كاتب فيديوهات قصيرة (ريلز وتيك توك) عربية محترف.",
    `اكتب ${dialect} سكريبت لفيديو نوعه: ${goal}.`,
    "الشكل المطلوب بالظبط، من غير أي كلام قبله أو بعده ومن غير Markdown:",
    "السطر الأول: «عنوان:» وبعده هوك قوي أقل من 7 كلمات يشد من أول ثانية.",
    `بعده ${count - 1} سطر، كل سطر يبدأ بـ «- » وفيه مشهد واحد أقل من 14 كلمة.`,
    "آخر سطر دعوة واضحة لإجراء (تابع، اطلب، احفظ الفيديو...).",
    "لا تخترع أرقاماً أو أسعاراً أو أسماء غير موجودة في طلب المستخدم. ممنوع الإيموجي الكتير: إيموجي واحد في السطر بالكتير.",
  ].join("\n");

  return streamFromGroq({
    chain: chainFor(getModel("balanced")),
    messages: [{ role: "system", content: system }, { role: "user", content: topic }],
    temperature: 0.8,
    maxTokens: 1400,
    signal: req.signal,
  });
}
