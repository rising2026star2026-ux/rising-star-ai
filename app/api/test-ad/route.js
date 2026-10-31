// «جرّب إعلانك على 100 زبون»: الموديل بيتقمص 10 شخصيات مصرية (كل شخصية شريحة من 100 شخص)،
// وكل شخصية بتعلّق على الإعلان زي فيسبوك وتحكم: هتشتري ولا محتاجة تفكر ولا هتعدّي.
// الأرقام النهائية (نسبة الشراء والدرجة) بتتحسب هنا في الكود من الشخصيات، مش بيكتبها الموديل، عشان تبقى متسقة.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { askJson, describeImage, DATA_IMAGE, MAX_IMAGE, str, int, list } from "@/lib/llmjson";
import { PLATFORMS, AUDIENCES } from "@/lib/testad";

export const maxDuration = 60;
const tooMany = rateLimiter(12);

const VERDICTS = ["buy", "maybe", "skip"];
const REACTIONS = ["like", "love", "haha", "wow", "sad", "angry", "none"];
const SCORE_KEYS = ["hook", "clarity", "trust", "offer", "cta"];
const WEIGHTS = { hook: 0.25, clarity: 0.2, trust: 0.2, offer: 0.2, cta: 0.15 };

const SHAPE = `{
  "personas": [{"name": "أم يوسف", "age": 38, "place": "طنطا", "job": "ربة منزل", "count": 14, "verdict": "buy|maybe|skip", "reaction": "like|love|haha|wow|sad|angry|none", "comment": "تعليقها على البوست", "why": "ليه خدت القرار ده في جملة"}],
  "scores": {"hook": 0, "clarity": 0, "trust": 0, "offer": 0, "cta": 0},
  "objections": [{"text": "الاعتراض باختصار", "share": 30}],
  "fixes": ["تعديل 1", "تعديل 2", "تعديل 3"],
  "photo": ["ملاحظة على الصورة (لو فيه صورة)"],
  "rewrite": "النسخة المحسّنة كاملة",
  "verdict": "جملة تلخص رأي الجمهور"
}`;

function systemPrompt(platform, audience) {
  return [
    `انت محاكي جمهور مصري حقيقي بيختبر الإعلانات قبل ما صاحبها يدفع فلوس في نشرها على ${platform}.`,
    `اتقمص 10 شخصيات مصرية مختلفة، كل شخصية بتمثل شريحة من 100 شخص شافوا الإعلان، ومجموع count لكل الشخصيات = 100. الجمهور المستهدف: ${audience}.`,
    "",
    "القواعد:",
    "- كن صادق وناقد زي الجمهور الحقيقي بالظبط. الإعلان الضعيف ياخد رفض كتير، والقوي ياخد طلبات. ممنوع المجاملة، وممنوع تبالغ في السلبية من غير سبب.",
    "- الشخصيات متنوعة فعلاً: محافظات مختلفة (القاهرة، الجيزة، إسكندرية، المنصورة، طنطا، أسيوط، الزقازيق، بورسعيد، المنيا...)، أعمار من 18 لـ 60، ستات ورجالة، ومستويات دخل مختلفة، ومناسبة للجمهور المستهدف والمنصة.",
    "- لو الجمهور المستهدف محدد، 8 شخصيات على الأقل من 10 يبقوا منه، والباقي ناس عادية ممكن تشوف الإعلان.",
    "- الأسماء مصرية عادية أو كنية زي «أم يوسف» أو «أستاذ هاني».",
    "- خلي التعليق متسق مع الحكم: اللي حكمه buy تعليقه فيه نية طلب، واللي skip تعليقه فيه سبب عدم الاهتمام.",
    "- comment مكتوب بالظبط زي تعليقات السوشيال ميديا المصرية: قصير (من 2 لـ 18 كلمة)، عامية مصرية، أسئلة طبيعية زي «بكام؟» و«فين مكانكم؟» و«فيه توصيل للمنصورة؟» و«ده أصلي ولا كوبي؟»، أو اعتراض صريح، أو حماس. من غير شتايم ولا تنمر ولا إهانة، وإيموجي واحد بالكتير.",
    "- verdict: buy = هيطلب أو يكلم البياع دلوقتي، maybe = مهتم بس محتاج معلومة أو ثقة، skip = هيعدّي ومش مهتم.",
    "- reaction: رد الفعل على البوست زي فيسبوك، وnone لو عدّى من غير تفاعل.",
    "- اعتمد على الإعلان والصورة بس. لو معلومة مهمة ناقصة (السعر، المقاس، الشحن، طريقة الطلب، مكان المحل) خلي الجمهور يسأل عنها أو يعترض.",
    "- scores من 0 لـ 10: hook (أول سطر بيشد؟)، clarity (واضح بيبيع إيه وبكام؟)، trust (بيخلي الواحد يثق؟)، offer (العرض مغري ومناسب؟)، cta (واضح يطلب إزاي؟).",
    "- objections: أهم 3 اعتراضات، وshare = نسبتها التقريبية من الـ100.",
    "- fixes: 3 تعديلات عملية ومحددة على الإعلان ده بالذات، مش نصايح عامة.",
    "- photo: لو فيه صورة، من 1 لـ 3 ملاحظات عملية عليها. لو مفيش صورة رجّع [].",
    "- rewrite: نسخة محسّنة كاملة جاهزة للنشر، بالعامية المصرية لو الإعلان الأصلي عامية، في سطور قصيرة، أول سطر hook قوي، وبعدها المميزات والسعر، وآخرها طريقة طلب واضحة. من غير كليشيهات زي «لا تفوت الفرصة». استخدم المعلومات المكتوبة بس: ممنوع تخترع سعر أو خصم أو ضمان أو مكان أو سعر شحن. لو معلومة ناقصة الجمهور سأل عنها حط مكانها قوسين زي [اكتب سعر الشحن].",
    "- verdict: جملة واحدة قصيرة بالعامية تلخص رأي الجمهور.",
    "",
    "رجّع JSON بس، من غير أي كلام قبله أو بعده، بالشكل ده بالظبط:",
    SHAPE,
  ].join("\n");
}

/** توزيع العدد على الشخصيات بحيث المجموع = 100 بالظبط (طريقة أكبر باقي) */
function toHundred(counts) {
  const sum = counts.reduce((a, b) => a + b, 0) || 1;
  const raw = counts.map((c) => (c * 100) / sum);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((a, b) => a + b, 0);
  raw.map((r, i) => [r - Math.floor(r), i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (left > 0) { out[i]++; left--; } });
  return out.map((n) => Math.max(1, n));
}

function normalize(o, hasImage) {
  const personas = list(o.personas, 12, (p) => {
    const verdict = VERDICTS.includes(p?.verdict) ? p.verdict : null;
    const comment = str(p?.comment, 220);
    if (!verdict || !comment) return null;
    return {
      name: str(p.name, 40) || "زبون",
      age: int(p.age, 16, 80, 30),
      place: str(p.place, 30),
      job: str(p.job, 40),
      count: int(p.count, 1, 70, 10),
      verdict,
      reaction: REACTIONS.includes(p.reaction) ? p.reaction : verdict === "skip" ? "none" : "like",
      comment,
      why: str(p.why, 220),
    };
  });
  if (personas.length < 6 || !o.scores) return null;
  const hundred = toHundred(personas.map((p) => p.count));
  // لو التقريب خلّى المجموع يعدّي 100 (بسبب الحد الأدنى 1)، ننقص من أكبر شريحة
  let over = hundred.reduce((a, b) => a + b, 0) - 100;
  while (over > 0) { const i = hundred.indexOf(Math.max(...hundred)); hundred[i]--; over--; }
  personas.forEach((p, i) => { p.count = hundred[i]; });

  const scores = Object.fromEntries(SCORE_KEYS.map((k) => [k, int(o.scores?.[k], 0, 10, 5)]));
  const rewrite = str(o.rewrite, 3000);
  if (!rewrite) return null;

  const tally = { buy: 0, maybe: 0, skip: 0 };
  const reactions = Object.fromEntries(REACTIONS.map((r) => [r, 0]));
  for (const p of personas) { tally[p.verdict] += p.count; reactions[p.reaction] += p.count; }
  const score = Math.round(SCORE_KEYS.reduce((a, k) => a + scores[k] * WEIGHTS[k], 0) * 10);

  return {
    personas,
    scores,
    score,
    tally,
    reactions,
    objections: list(o.objections, 3, (x) => (str(x?.text, 120) ? { text: str(x.text, 120), share: int(x.share, 1, 100, 20) } : null)),
    fixes: list(o.fixes, 4, (x) => str(x, 300)),
    photo: hasImage ? list(o.photo, 3, (x) => str(x, 260)) : [],
    rewrite,
    verdict: str(o.verdict, 160),
  };
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const text = str(body.text, 2500);
  const extra = str(body.extra, 400);
  const image = typeof body.image === "string" ? body.image : "";
  const platformKey = PLATFORMS[body.platform] ? body.platform : "facebook";
  const audienceKey = AUDIENCES[body.audience] ? body.audience : "all";
  if (text.length < 8) return fail("اكتب نص الإعلان الأول (جملة واحدة على الأقل).", 400);
  if (image && (image.length > MAX_IMAGE || !DATA_IMAGE.test(image))) return fail("الصورة لازم تكون JPG أو PNG بحجم معقول.", 400);
  if (tooMany(clientIp(req))) return fail("جرّبت كتير الساعة دي. استنى شوية وارجع تاني.", 429);

  let photoNotes = "";
  if (image) {
    photoNotes = await describeImage(
      image,
      `دي صورة إعلان هتتنشر على ${PLATFORMS[platformKey]}. اوصف في نقاط قصيرة: 1) المنتج وشكله 2) أي كلام أو سعر مكتوب على الصورة بالنص الحرفي 3) جودة الصورة: الإضاءة والوضوح والخلفية والزحمة 4) أي حاجة بتزود أو بتقلل الثقة.`,
      { signal: req.signal },
    );
  }

  const user = [
    `نص الإعلان:\n${text}`,
    extra ? `معلومات إضافية من البياع: ${extra}` : "",
    image ? (photoNotes ? `الصورة المرفقة (وصف مراجع بصري):\n${photoNotes}` : "فيه صورة مرفقة بس ما قدرناش نقراها، فاحكم على النص بس.") : "مفيش صورة مع الإعلان.",
  ].filter(Boolean).join("\n\n");

  const result = await askJson({
    messages: [{ role: "system", content: systemPrompt(PLATFORMS[platformKey], AUDIENCES[audienceKey]) }, { role: "user", content: user }],
    normalize: (o) => normalize(o, !!(image && photoNotes)),
    mode: "balanced",
    temperature: 0.75,
    maxTokens: 4000,
    signal: req.signal,
  });
  if (!result) return fail("الزباين مشغولين دلوقتي 😅 جرّب تاني بعد دقيقة.", 503);
  return Response.json({ ...result, platform: platformKey, audience: audienceKey, sawImage: !!(image && photoNotes) });
}
