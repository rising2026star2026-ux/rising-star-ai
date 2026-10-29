// قارئ الصور: يوصف الصورة أو يقرا النص اللي فيها ويرد على سؤال المستخدم عنها
import { fail, clientIp, rateLimiter, completeOnce, visionChain } from "@/lib/groq";

export const maxDuration = 60;

const tooMany = rateLimiter(15); // 15 صورة في الساعة لكل زائر
const MAX_DATA_URL = 3_500_000; // الصورة بتتصغّر في المتصفح قبل الرفع، فده حد أمان
const DATA_URL = /^data:image\/(png|jpe?g|webp);base64,[A-Za-z0-9+/=]+$/;

const SYSTEM = [
  "أنت مساعد في موقع Rising StarAi بيحلل الصور للمستخدم.",
  "رد بالعربي المبسط (ولو المستخدم كتب بالمصري رد بمصري خفيف).",
  "اعتمد على اللي ظاهر في الصورة فقط، ولا تخمّن أسماء أشخاص من وجوههم ولا تذكر هويتهم.",
  "لو طُلب منك قراءة نص فانقله كما هو بلغته الأصلية، ولو في جزء مش واضح قل إنه مش واضح بدل ما تخمّنه.",
  "لو مفيش سؤال: اوصف الصورة في نقاط قصيرة، واذكر أي نص مكتوب فيها.",
  "نسّق الرد بماركداون بسيط.",
].join("\n");

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }

  const image = String(body.image || "");
  const question = String(body.question || "").trim().slice(0, 1500);
  if (!image) return fail("ارفع صورة الأول.", 400);
  if (image.length > MAX_DATA_URL || !DATA_URL.test(image)) return fail("الصورة لازم تكون PNG أو JPG أو WebP وبحجم معقول.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  const messages = [
    { role: "system", content: SYSTEM },
    {
      role: "user",
      content: [
        { type: "text", text: question || "اوصف الصورة واقرا أي نص فيها." },
        { type: "image_url", image_url: { url: image } },
      ],
    },
  ];

  const chain = visionChain();

  for (const m of chain) {
    const text = await completeOnce(m, { messages, temperature: 0.3, maxTokens: 1500, signal: req.signal });
    if (text) return Response.json({ text });
  }
  return fail("مقدرناش نقرا الصورة دلوقتي. جرّب تاني بعد شوية.", 503);
}
