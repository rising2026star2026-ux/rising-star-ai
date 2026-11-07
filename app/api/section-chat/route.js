// شات القسم: كل قسم له شخصية ومفاتيح وسقف خاص بيه (انظر lib/sectioninfo.js و lib/sectionkeys.js).
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";
import { getModel } from "@/lib/models";
import { str, list } from "@/lib/llmjson";
import { SECTION_INFO, sectionSystemPrompt } from "@/lib/sectioninfo";
import { withSection } from "@/lib/sectionkeys";

export const maxDuration = 60;
const tooMany = rateLimiter(40);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const id = String(body?.section || "");
  if (!Object.hasOwn(SECTION_INFO, id)) return fail("قسم غير معروف.", 400);
  if (tooMany(clientIp(req))) return fail("وصلت لحد الرسايل الساعة دي. جرّب بعد شوية.", 429);
  const messages = list(body.messages, 30, (m) => {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const content = str(m?.content, 2000);
    return role && content ? { role, content } : null;
  }).slice(-10);
  if (!messages.some((m) => m.role === "user")) return fail("اكتب سؤالك الأول.", 400);
  // مفاتيح وسقف القسم المطلوب
  return withSection(id, () => streamFromGroq({
    chain: chainFor(getModel("balanced")),
    messages: [{ role: "system", content: sectionSystemPrompt(id) }, ...messages],
    temperature: 0.4,
    maxTokens: 900,
    signal: req.signal,
    headers: {},
  }))(req);
}
