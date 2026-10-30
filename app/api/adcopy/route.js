// نص إعلان قصير لمنتج: شعار + 3 مميزات (من سلسلة الموديلات المعتادة)
import { getModel } from "@/lib/models";
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";

export const maxDuration = 40;
const tooMany = rateLimiter(30);
const DIALECTS = { egy: "بالعامية المصرية", fusha: "بالفصحى المبسطة", gulf: "باللهجة الخليجية" };

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const name = String(body.name || "").trim().slice(0, 120);
  const desc = String(body.desc || "").trim().slice(0, 500);
  if (!name) return fail("اكتب اسم المنتج الأول.", 400);
  const dialect = DIALECTS[body.dialect] || DIALECTS.egy;
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  const system = [
    `انت كاتب إعلانات قصيرة ${dialect} لفيديو ترويجي لمنتج.`,
    "اكتب شعار إعلاني واحد (من 3 لـ 8 كلمات) و3 مميزات (كل ميزة من 2 لـ 5 كلمات).",
    "اعتمد على اسم المنتج والوصف اللي المستخدم كتبه بس. ممنوع تخترع أرقام أو نسب خصم أو ضمانات أو خامات أو شهادات مش مذكورة.",
    "من غير إيموجي ولا علامات تنسيق. الشكل المطلوب بالظبط، 4 سطور فقط:",
    "شعار: ...",
    "ميزة: ...",
    "ميزة: ...",
    "ميزة: ...",
  ].join("\n");

  const res = await streamFromGroq({
    chain: chainFor(getModel("balanced")),
    messages: [{ role: "system", content: system }, { role: "user", content: `المنتج: ${name}${desc ? `\nالوصف: ${desc}` : ""}` }],
    temperature: 0.7,
    maxTokens: 400,
    signal: req.signal,
  });
  if (!res.ok) return res;
  const raw = await res.text();
  const clean = (t) => t.replace(/[*_#"«»]/g, "").trim().slice(0, 60);
  let tagline = "";
  const features = [];
  for (const line of raw.split("\n")) {
    const m = line.match(/^[\s\-•*\d.)]*(شعار|ميزة)\s*[:：]\s*(.+)$/);
    if (!m) continue;
    if (m[1] === "شعار" && !tagline) tagline = clean(m[2]);
    else if (m[1] === "ميزة" && features.length < 3) features.push(clean(m[2]));
  }
  if (!tagline && !features.length) return fail("ما طلعش نص مناسب. زوّد وصف المنتج وجرّب تاني.", 502);
  return Response.json({ tagline, features });
}
