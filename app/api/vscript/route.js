// سكريبت فيديو بمشاهد، وكل مشهد معاه كلمة بحث إنجليزية للفيديو المناسب (من سلسلة الموديلات المعتادة)
import { getModel } from "@/lib/models";
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";

export const maxDuration = 40;
const tooMany = rateLimiter(25);
const DIALECTS = { egy: "بالعامية المصرية", fusha: "بالفصحى المبسطة", gulf: "باللهجة الخليجية" };

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const topic = String(body.topic || "").trim().slice(0, 500);
  if (!topic) return fail("اكتب فكرة الفيديو.", 400);
  const count = Math.min(8, Math.max(3, parseInt(body.count, 10) || 6));
  const dialect = DIALECTS[body.dialect] || DIALECTS.egy;
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  const system = [
    "انت كاتب فيديوهات قصيرة عربية محترف (ريلز وتيك توك) بتكتب كلام هيتقال بصوت معلّق.",
    `اكتب ${dialect} سكريبت من ${count} مشاهد عن الموضوع اللي المستخدم يطلبه، مدته الكلية حوالي 30 ثانية.`,
    "كل مشهد جملة أو جملتين، من 8 لـ 18 كلمة، مكتوبة زي ما بتتقال بالظبط (من غير إيموجي ولا رموز ولا أرقام بالحروف الغريبة).",
    "أول مشهد هوك قوي يشد، وآخر مشهد دعوة لإجراء (تابع، احفظ، جرّب...).",
    "الشكل المطلوب بالظبط، سطر لكل مشهد، من غير أي كلام تاني ومن غير ترقيم:",
    "الجملة العربية | english search keywords",
    "كلمات البحث 2-3 كلمات إنجليزي بسيطة بتوصف لقطة فيديو حقيقية مناسبة للمشهد (مثلاً: coffee pouring, busy street, person typing laptop). ممنوع أسماء أشخاص أو ماركات.",
    "لا تخترع أرقام أو إحصائيات أو أسعار.",
  ].join("\n");

  const res = await streamFromGroq({
    chain: chainFor(getModel("balanced")),
    messages: [{ role: "system", content: system }, { role: "user", content: topic }],
    temperature: 0.8,
    maxTokens: 1500,
    signal: req.signal,
  });
  if (!res.ok) return res;
  const raw = await res.text();
  const scenes = raw.split("\n").map((l) => l.replace(/^[\s\-•*\d.)]+/, "").trim()).filter((l) => l.includes("|")).map((l) => {
    const i = l.lastIndexOf("|");
    return { text: l.slice(0, i).trim(), kw: l.slice(i + 1).trim().replace(/[^A-Za-z0-9 ,'-]/g, "").slice(0, 60) };
  }).filter((s) => s.text.length > 3).slice(0, 8);
  if (scenes.length < 2) return fail("ما طلعش سكريبت مناسب. اكتب الفكرة بتفاصيل أكتر وجرّب تاني.", 502);
  return Response.json({ scenes });
}
