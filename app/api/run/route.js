// تشغيل أي أداة ذكاء اصطناعي: رد متدفق (كلمة بكلمة)
import { getTool } from "@/lib/tools";
import { SETTINGS, REFINES, cleanSettings } from "@/lib/settings";
import { systemFor, modelKeyFor, temperatureFor } from "@/lib/quality";
import { getModel } from "@/lib/models";
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";

const MAX_INPUT = 6000;
const MAX_PREVIOUS = 12000;
const tooMany = rateLimiter(30); // 30 طلب في الساعة لكل زائر لحد ما نضيف تسجيل الدخول

// الأدوات اللي مخرجها طويل محتاجة مساحة أكبر
const LONG = ["article", "seo-article", "business-plan", "landing-page", "content-calendar", "cv", "quiz", "study-plan", "worksheet", "short-story", "report"];

function maxTokensFor(tool, mode) {
  const base = LONG.includes(tool.id) ? 3500 : 2048;
  // التفكير بيتحسب من نفس المساحة، فالموديلات اللي بتفكر أكتر محتاجة مساحة زيادة
  return mode.effort === "high" ? base + 3000 : mode.effort === "medium" ? base + 1200 : base;
}

export const maxDuration = 60;

export async function POST(req) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) return fail("مفتاح Groq غير مضاف في إعدادات Vercel.", 500);

  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }

  const tool = getTool(body.toolId);
  if (!tool) return fail("الأداة غير موجودة.", 404);
  if (tool.local) return fail("الأداة دي بتشتغل على جهازك من غير ذكاء اصطناعي.", 400);

  const input = String(body.input || "").trim();
  if (!input) return fail("اكتب طلبك الأول.", 400);
  if (input.length > MAX_INPUT) return fail(`الطلب أطول من ${MAX_INPUT} حرف.`, 400);

  let optionLine = "";
  if (tool.option && body.option) {
    if (!tool.option.choices.includes(body.option)) return fail("خيار غير صالح.", 400);
    optionLine = `${tool.option.label}: ${body.option}`;
  }

  const refine = body.refine ? REFINES[body.refine] : null;
  if (body.refine && !refine) return fail("تعديل غير صالح.", 400);
  const previous = refine ? String(body.previous || "").slice(0, MAX_PREVIOUS) : "";

  if (tooMany(clientIp(req))) return fail("وصلت للحد المسموح الساعة دي. جرّب بعد شوية.", 429);

  // إعدادات المستخدم من لوحة التحكم ليها الأولوية على القواعد العامة
  const s = cleanSettings(body.settings);
  const userRules = [SETTINGS.voice.rule[s.voice], SETTINGS.depth.rule[s.depth]].filter(Boolean);
  let system = systemFor(tool, optionLine);
  if (userRules.length) system += `\n\nإعدادات المستخدم (أولوية أعلى من القواعد السابقة):\n${userRules.join("\n")}`;

  const messages = [{ role: "system", content: system }, { role: "user", content: input }];
  if (refine && previous) messages.push({ role: "assistant", content: previous }, { role: "user", content: refine.rule });

  // «متوازن» = درجة الإبداع المناسبة للأداة، و«دقيق» أو «مبدع» = اختيار المستخدم
  const temperature = s.style === "balanced" ? temperatureFor(tool) : SETTINGS.style.temp[s.style];
  const mode = getModel(modelKeyFor(tool));

  return streamFromGroq({
    chain: chainFor(mode),
    messages,
    temperature,
    maxTokens: maxTokensFor(tool, mode),
    signal: req.signal,
  });
}
