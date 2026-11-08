// شات القسم: كل قسم له شخصية ومفاتيح وسقف خاص بيه (انظر lib/sectioninfo.js و lib/sectionkeys.js).
// وضع «ابحث في الإنترنت» (الباحث الصوتي بيستخدمه): المصادر والروابط بتيجي من نتايج البحث نفسها، مش من الموديل.
// العقاري: كل رسالة فيها طلب وحدة بتدوّر في مواقع الإعلانات كلها (lib/listings.js)، والكروت بتتبعت في أول سطر من الرد (JSON)
// قبل كلام الموديل، والموديل بيقارن ويرشّح من أرقام الكروت بس.
import { fail, clientIp, rateLimiter, chainFor, streamFromGroq } from "@/lib/groq";
import { getModel } from "@/lib/models";
import { str, list } from "@/lib/llmjson";
import { SECTION_INFO, sectionSystemPrompt } from "@/lib/sectioninfo";
import { withSection } from "@/lib/sectionkeys";
import { searchProvider, searchQuery, webSearchFull, resultsBlock } from "@/lib/websearch";
import { findListings, listingsBlock, wantsListings, isRent } from "@/lib/listings";
import { PORTALS } from "@/lib/portals";

export const maxDuration = 60;
const tooMany = rateLimiter(40);
const tooManySearches = rateLimiter(15);
const enc = new TextEncoder();

// الكارت اللي بيروح للمتصفح: الحقول اللي بتتعرض بس (من غير المقطع الطويل)
const pub = (c) => {
  const out = { n: c.n, url: c.url, site: c.site, title: c.title };
  for (const k of ["type", "price", "rent", "down", "area", "rooms", "ppm", "img"]) if (c[k]) out[k] = c[k];
  if (c.page) out.page = true;
  return out;
};

/** الرد بأول سطر JSON فيه الكروت، وبعده كلام الموديل زي ما هو */
function withMeta(res, meta) {
  const reader = res.body.getReader();
  const body = new ReadableStream({
    start(c) { c.enqueue(enc.encode(`${JSON.stringify(meta)}\n`)); },
    async pull(c) {
      try {
        const { done, value } = await reader.read();
        if (done) c.close(); else c.enqueue(value);
      } catch (e) { c.error(e); }
    },
    cancel(r) { reader.cancel(r).catch(() => {}); },
  });
  const headers = new Headers(res.headers);
  headers.set("x-meta", "1");
  return new Response(body, { status: res.status, headers });
}

async function finder(req, messages, ip) {
  let system = sectionSystemPrompt("realestate");
  const last = [...messages].reverse().find((m) => m.role === "user")?.content || "";
  const meta = { status: "skip", searched: PORTALS.map((p) => p.name), cards: [] };
  // جملة البحث بسياق المحادثة (زي «طب في الرحاب؟» بعد طلب شقة)
  const q = wantsListings(last) || messages.filter((m) => m.role === "user").length > 1 ? await searchQuery(messages) : last;
  if (wantsListings(last) || wantsListings(q)) {
    if (tooManySearches(ip)) meta.status = "limit";
    else {
      const { cards } = await findListings(q, { rent: isRent(q) || isRent(last) });
      meta.status = cards.length ? "ok" : "empty";
      system += `\n\n${listingsBlock({ status: meta.status, cards, searched: meta.searched })}`;
      meta.cards = cards.map(pub);
    }
  }
  if (meta.status !== "ok" && meta.status !== "empty") system += `\n\n${listingsBlock(meta)}`;
  const res = await streamFromGroq({
    chain: chainFor(getModel("balanced")),
    messages: [{ role: "system", content: system }, ...messages],
    temperature: 0.45,
    maxTokens: 1100,
    signal: req.signal,
  });
  return res.ok && res.body ? withMeta(res, meta) : res;
}

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return fail("طلب غير صالح.", 400); }
  const id = String(body?.section || "");
  if (!Object.hasOwn(SECTION_INFO, id)) return fail("قسم غير معروف.", 400);
  const ip = clientIp(req);
  if (tooMany(ip)) return fail("وصلت لحد الرسايل الساعة دي. جرّب بعد شوية.", 429);
  const messages = list(body.messages, 30, (m) => {
    const role = m?.role === "assistant" ? "assistant" : m?.role === "user" ? "user" : null;
    // أرقام الكروت القديمة ([2]) ملهاش معنى مع نتايج بحث جديدة
    const content = str(role === "assistant" ? String(m?.content || "").replace(/\s*\[\d{1,2}\]/g, "") : m?.content, 2000);
    return role && content ? { role, content } : null;
  }).slice(-10);
  if (!messages.some((m) => m.role === "user")) return fail("اكتب سؤالك الأول.", 400);

  // مفاتيح وسقف القسم المطلوب (البحث كمان بيستخدمها)
  return withSection(id, async () => {
    if (id === "realestate") return finder(req, messages, ip);
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
