// مساعد الدعم: بيرد من قاعدة معرفة الموقع (lib/supportkb.js) وبيحوّل للدعم البشري لما مايعرفش.
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";
import { getModel } from "@/lib/models";
import { str, list } from "@/lib/llmjson";
import { SUPPORT_KB, SUPPORT_RULES } from "@/lib/supportkb";

export const maxDuration = 30;
const tooMany = rateLimiter(40);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  if (tooMany(clientIp(req))) return fail("وصلت لحد الرسايل الساعة دي. جرّب بعد شوية أو كلّم الدعم مباشرة.", 429);
  const messages = list(body.messages, 30, (m) => {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const content = str(m?.content, 1500);
    return role && content ? { role, content } : null;
  }).slice(-8);
  if (!messages.some((m) => m.role === "user")) return fail("اكتب سؤالك الأول.", 400);
  return streamFromGroq({
    chain: chainFor(getModel("strong")),
    messages: [{ role: "system", content: `${SUPPORT_RULES}\n\nقاعدة المعرفة:\n${SUPPORT_KB}` }, ...messages],
    temperature: 0.2,
    maxTokens: 700,
    signal: req.signal,
    headers: {},
  });
}
