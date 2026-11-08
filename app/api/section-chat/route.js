// شات القسم: كل قسم له شخصية ومفاتيح وسقف خاص بيه (انظر lib/sectioninfo.js و lib/sectionkeys.js).
// وضع «ابحث في الإنترنت» (الباحث الصوتي بيستخدمه): المصادر والروابط بتيجي من نتايج البحث نفسها، مش من الموديل.
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";
import { getModel } from "@/lib/models";
import { str, list } from "@/lib/llmjson";
import { SECTION_INFO, sectionSystemPrompt } from "@/lib/sectioninfo";
import { withSection } from "@/lib/sectionkeys";
import { searchProvider, searchQuery, webSearchFull, resultsBlock } from "@/lib/websearch";

export const maxDuration = 60;
const tooMany = rateLimiter(40);
const tooManySearches = rateLimiter(15);

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const id = String(body?.section || "");
  if (!Object.hasOwn(SECTION_INFO, id)) return fail("قسم غير معروف.", 400);
  const ip = clientIp(req);
  if (tooMany(ip)) return fail("وصلت لحد الرسايل الساعة دي. جرّب بعد شوية.", 429);
  const messages = list(body.messages, 30, (m) => {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    const content = str(m?.content, 2000);
    return role && content ? { role, content } : null;
  }).slice(-10);
  if (!messages.some((m) => m.role === "user")) return fail("اكتب سؤالك الأول.", 400);

  // مفاتيح وسقف القسم المطلوب (البحث كمان بيستخدمها)
  return withSection(id, async () => {
    let system = sectionSystemPrompt(id);
    const headers = {};
    if (body.search === true) {
      if (!searchProvider()) headers["x-search"] = "nokey";
      else if (tooManySearches(ip)) headers["x-search"] = "limit";
      else {
        const query = await searchQuery(messages);
        const { results, notes } = await webSearchFull(query);
        const safe = results.filter((r) => /^https?:\/\//i.test(r.url || ""));
        if (safe.length) {
          system += `\n\n${resultsBlock(query, safe, notes)}`;
          headers["x-search"] = "ok";
          headers["x-sources"] = encodeURIComponent(JSON.stringify(safe.map((r) => ({ t: String(r.title || "").slice(0, 160), u: r.url, ...(r.domain ? { d: r.domain } : {}) }))));
        } else {
          headers["x-search"] = "empty";
          system += "\n\nتنبيه: المستخدم طلب بحث في الإنترنت ومفيش نتايج. ما تذكرش أرقام أو أخبار حالية من ذاكرتك؛ قل إنك مش قادر تتأكد دلوقتي وقدّم معلومة عامة بس.";
        }
      }
    }
    return streamFromGroq({
      chain: chainFor(getModel("balanced")),
      messages: [{ role: "system", content: system }, ...messages],
      temperature: 0.4,
      maxTokens: 1100,
      signal: req.signal,
      headers,
    });
  })(req);
}
