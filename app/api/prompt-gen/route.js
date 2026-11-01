// مولّد البرومبتات بالذكاء الاصطناعي: وضعين، «ideas» لتوليد أفكار جديدة بمعاييرك، و«improve» لتحسين برومبت ضعيف.
// الحد الأقصى 15 برومبت في الطلب الواحد (البرومبتات الطويلة بتتقطع لو زودنا)، والواجهة بتبعت على دفعات لو طلبت أكتر.
import { fail, clientIp, rateLimiter } from "@/lib/groq";
import { askJson } from "@/lib/llmjson";
import { runIdeas, runImprove, VALID_TYPES } from "@/lib/promptgen";

export const maxDuration = 60;
const tooMany = rateLimiter(24);
const MAX_PER_CALL = 15;

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const type = VALID_TYPES.includes(body.type) ? body.type : "chat";
  const mode = body.mode === "improve" ? "improve" : "ideas";
  if (tooMany(clientIp(req))) return fail("وصلت للحد الساعة دي. استنى شوية وارجع تاني.", 429);
  const ask = (a) => askJson({ ...a, mode: "balanced", signal: req.signal });

  if (mode === "improve") {
    const prompt = String(body.prompt || "").trim().slice(0, 3500);
    if (prompt.length < 8) return fail("الصق البرومبت اللي عايز تحسّنه الأول.", 400);
    const res = await runImprove({ type, prompt, ask });
    if (!res) return fail("المحسّن مشغول دلوقتي 😅 جرّب تاني بعد دقيقة.", 503);
    return Response.json({ mode, ...res });
  }

  const topic = String(body.topic || "").trim().slice(0, 400);
  if (topic.length < 3) return fail("اكتب موضوع أو مجال تولّد له برومبتات (كلمتين على الأقل).", 400);
  const count = Math.max(3, Math.min(MAX_PER_CALL, Number(body.count) || 10));
  const criteria = String(body.criteria || "").slice(0, 1200);
  const avoid = (Array.isArray(body.avoid) ? body.avoid : []).slice(-40).map((a) => String(a).slice(0, 300));
  const items = await runIdeas({ type, topic, count, criteria, avoid, ask });
  if (!items) return fail("المولّد مشغول دلوقتي 😅 جرّب تاني بعد دقيقة.", 503);
  return Response.json({ mode, items });
}
