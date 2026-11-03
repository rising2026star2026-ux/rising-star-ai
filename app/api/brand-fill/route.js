// «اقترح لي الباقي» في هوية نشاطي: من اسم النشاط ووصفه بيقترح الجمهور والنبرة واللهجة وشعارات قصيرة.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { askJson, str, list } from "@/lib/llmjson";
import { BRAND_TONES, BRAND_DIALECTS } from "@/lib/brandprofile";

export const maxDuration = 40;
const tooMany = rateLimiter(20);
const TONES = BRAND_TONES.map((t) => t[0]);
const DIALECTS = BRAND_DIALECTS.map((d) => d[0]);

const SYSTEM = [
  "انت خبير هوية علامات تجارية لأنشطة صغيرة في مصر والخليج. العميل هيديك اسم نشاطه ووصفه، واقترح عليه بيانات هويته.",
  "اعتمد على اللي قاله بس. ممنوع تخترع أسعار أو أرقام أو إنجازات أو أسماء فروع.",
  `رجّع JSON بس بالشكل ده:\n{"audience":"الجمهور المستهدف في سطر (مثلاً: ستات وبنات في مصر من 20 لـ 40)","tone":"${TONES.join("|")}","dialect":"${DIALECTS.join("|")}","taglines":["شعار 2-5 كلمات","شعار","شعار"]}`,
  "dialect: مصري لو النشاط في مصر أو الوصف بالمصري، خليجي لو الوصف خليجي أو النشاط في الخليج، وإلا مصري.",
].join("\n");

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const name = str(body.name, 60);
  const field = str(body.field, 240);
  if (!name || !field) return fail("اكتب اسم النشاط ووصفه الأول.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  const out = await askJson({
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: `الاسم: ${name}\nالنشاط: ${field}` }],
    normalize: (o) => {
      const audience = str(o.audience, 200);
      if (!audience) return null;
      return {
        audience,
        tone: TONES.includes(o.tone) ? o.tone : "friendly",
        dialect: DIALECTS.includes(o.dialect) ? o.dialect : "egy",
        taglines: list(o.taglines, 3, (x) => str(x, 40).replace(/[*_#"«»]/g, "")),
      };
    },
    temperature: 0.7,
    maxTokens: 600,
    signal: req.signal,
  });
  if (!out) return fail("ما قدرناش نقترح دلوقتي. اكتب البيانات بإيدك أو جرّب تاني.", 503);
  return Response.json(out);
}
