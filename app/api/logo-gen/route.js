// مولّد اللوجو: الذكاء الاصطناعي بيفهم نشاط العميل ويختار رموز وألوان وخطوط من القوائم الجاهزة
// (من غير ما يرسم بنفسه)، ويقترح شعارات قصيرة واسم لاتيني. الرسم نفسه بيتم في المتصفح.
import { getModel } from "@/lib/models";
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";
import { SYMBOLS, PALETTES, FONTS, STYLES, TAG_IDS, cleanAiHints } from "@/lib/logostudio";

export const maxDuration = 40;
const tooMany = rateLimiter(30);

const symbolList = SYMBOLS.map((s) => `${s.id}=${s.name}`).join("، ");
const paletteList = PALETTES.map((p) => `${p.id}=${p.name}`).join("، ");
const fontList = FONTS.map((f) => `${f.id}=${f.name}(${f.styles.join("/")})`).join("، ");

function parseJson(raw) {
  const m = String(raw).match(/\{[\s\S]*\}/);
  if (!m) return null;
  try { return JSON.parse(m[0]); } catch { return null; }
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const name = String(body.name || "").trim().slice(0, 60);
  const desc = String(body.desc || "").trim().slice(0, 300);
  if (!name) return fail("اكتب اسم علامتك الأول.", 400);
  const style = STYLES.find((s) => s.id === body.style)?.name || "عصري";
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  const system = [
    "انت مصمم هوية بصرية. العميل هيديك اسم علامته ونشاطها، وانت بتختار من قوائم جاهزة بس (ممنوع تخترع معرّفات).",
    `الرموز: ${symbolList}`,
    `الألوان: ${paletteList}`,
    `الخطوط: ${fontList}`,
    `المجالات المسموحة للوسوم: ${TAG_IDS.join(", ")}`,
    "اختار 6 تصميمات مختلفة عن بعض: كل واحد برمز مناسب لنشاط العميل فعلاً، ولوحة ألوان تناسب طبيعة النشاط ونفسية العميل المستهدف، وخط يناسب الأسلوب المطلوب.",
    "layout واحد من: stacked أو horizontal أو wordmark. idea جملة قصيرة بالعربي (أقل من 10 كلمات) تشرح ليه الاختيار ده، من غير ادعاءات.",
    "latin: كتابة الاسم بحروف لاتينية (لو الاسم عربي اكتب نطقه، ولو لاتيني اكتبه كما هو). taglines: 3 شعارات قصيرة بالعربي (من 2 لـ 5 كلمات) من غير أرقام أو ادعاءات مش مذكورة.",
    "رد بـ JSON فقط من غير أي كلام تاني بالشكل:",
    '{"tags":["food"],"latin":"Noor","taglines":["..."],"concepts":[{"symbol":"plate","palette":"sunset","font":"cairo","layout":"stacked","idea":"..."}]}',
  ].join("\n");

  const res = await streamFromGroq({
    chain: chainFor(getModel("balanced")),
    messages: [
      { role: "system", content: system },
      { role: "user", content: `الاسم: ${name}\nالنشاط: ${desc || "غير محدد"}\nالأسلوب المطلوب: ${style}` },
    ],
    temperature: 0.8,
    maxTokens: 900,
    signal: req.signal,
  });
  if (!res.ok) return res;
  const hints = cleanAiHints(parseJson(await res.text()));
  if (!hints.concepts.length && !hints.taglines.length && !hints.latin) return fail("ما طلعش اقتراح مناسب. جرّب تاني.", 502);
  return Response.json(hints);
}
