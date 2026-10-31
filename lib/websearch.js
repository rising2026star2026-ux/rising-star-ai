// البحث على الإنترنت للشات والوكلاء وكاشف النصب (على السيرفر بس)
//
// بيشتغل مع أول مفتاح موجود في Vercel:
//   SERPER_API_KEY  — نتايج جوجل (serper.dev)
//   TAVILY_API_KEY  — tavily.com
//   GEMINI_API_KEY  — بحث جوجل جوه Gemini (Grounding with Google Search). ده نفس مفتاح Gemini اللي موجود أصلاً،
//                     ومجاني في حدود يومية، فالبحث بيشتغل من غير أي مفتاح زيادة.
// لو مفيش مفتاح (أو حصته خلصت) بنبحث في DuckDuckGo من غير مفتاح: نتايج وروابط من غير ملخص جاهز.

const MAX_RESULTS = 6;

export function searchProvider() {
  if (process.env.SERPER_API_KEY) return "serper";
  if (process.env.TAVILY_API_KEY) return "tavily";
  if (process.env.GEMINI_API_KEY) return "gemini";
  return "ddg";
}

const unescapeHtml = (t) => String(t || "").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#x27;|&#39;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/\s+/g, " ").trim();

/** بحث من غير مفتاح: صفحة DuckDuckGo الخفيفة. أضعف من جوجل لكنه شغال دايماً، وبيرجّع العنوان والرابط ومقطع من الصفحة. */
async function ddgSearch(query) {
  const why = [];
  try {
    const r = await fetch("https://html.duckduckgo.com/html/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "Mozilla/5.0 (compatible; RisingStarBot/1.0; +https://rising-star-ai.vercel.app)", "Accept-Language": "ar,en;q=0.8" },
      body: new URLSearchParams({ q: query, kl: "xa-ar" }).toString(),
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) return { results: [], images: [], why: `ddg: ${r.status}` };
    const html = await r.text();
    const results = [];
    const links = [...html.matchAll(/<a[^>]+class="result__a"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
    for (let i = 0; i < links.length && results.length < MAX_RESULTS; i++) {
      const m = links[i];
      const block = html.slice(m.index, links[i + 1]?.index ?? html.length);
      let url = m[1].replace(/&amp;/g, "&");
      const u = url.match(/[?&]uddg=([^&]+)/);
      if (u) url = decodeURIComponent(u[1]);
      if (url.startsWith("//")) url = "https:" + url;
      if (!/^https?:\/\//.test(url) || /duckduckgo\.com\/y\.js|ad_provider/.test(url) || results.some((x) => x.url === url)) continue;
      const sn = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
      results.push({ title: clip(unescapeHtml(m[2]), 120), url, snippet: clip(unescapeHtml(sn?.[1]), 500) });
    }
    if (!results.length) why.push(`ddg: ok but 0 results (${html.length} bytes${/captcha|anomaly/i.test(html) ? ", captcha" : ""})`);
    return { results, images: [], why: why.join(" | ") };
  } catch (e) {
    return { results: [], images: [], why: `ddg: ${String(e?.name || e).slice(0, 60)}` };
  }
}

const GEMINI_SEARCH_MODELS = [process.env.GEMINI_SEARCH_MODEL || "gemini-flash-latest", "gemini-flash-lite-latest"];

/**
 * بحث جوجل عن طريق Gemini: بيرجّع ملخص مكتوب من النتايج + المصادر اللي اعتمد عليها.
 * الروابط بتعدّي على تحويلة من جوجل (vertexaisearch) وبتفتح الصفحة الأصلية، والاسم الظاهر هو دومين الموقع.
 */
async function geminiSearch(query) {
  const key = process.env.GEMINI_API_KEY;
  const prompt = [
    `ابحث على الإنترنت عن: ${query}`,
    "اكتب بالعربي كل المعلومات المهمة اللي لقيتها: الأرقام والأسعار والتواريخ والأسماء والتفاصيل، في نقاط واضحة.",
    "اعتمد على نتايج البحث بس، ولو المصادر مختلفة في حاجة قول كده. من غير مقدمات.",
  ].join("\n");
  const why = [];
  for (const model of GEMINI_SEARCH_MODELS) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], tools: [{ google_search: {} }], generationConfig: { temperature: 0.2 } }),
        signal: AbortSignal.timeout(20000),
      });
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        why.push(`${model}: ${r.status} ${String(e?.error?.message || "").slice(0, 160)}`);
        continue;
      }
      const j = await r.json();
      const cand = j?.candidates?.[0];
      const notes = (cand?.content?.parts || []).map((p) => p.text || "").join("").trim();
      const gm = cand?.groundingMetadata || {};
      const chunks = gm.groundingChunks || [];
      if (!notes || !chunks.length) { why.push(`${model}: ok but notes=${notes.length} chunks=${chunks.length} finish=${cand?.finishReason || "-"}`); continue; }
      // المقاطع اللي كل مصدر دعمها، عشان يبقى لكل مصدر نص قصير
      const bits = chunks.map(() => []);
      for (const sup of gm.groundingSupports || []) {
        for (const i of sup.groundingChunkIndices || []) if (bits[i] && sup.segment?.text) bits[i].push(sup.segment.text);
      }
      const results = [];
      chunks.forEach((c, i) => {
        const url = c?.web?.uri;
        if (!url || results.some((x) => x.url === url)) return;
        const domain = String(c.web.title || "").replace(/^www\./, "");
        results.push({ title: domain || "مصدر", url, domain, snippet: clip(bits[i].join(" … "), 500) });
      });
      return { results: results.slice(0, 8), images: [], notes: clip(notes, 6000) };
    } catch (e) { why.push(`${model}: ${String(e?.name || e).slice(0, 60)}`); }
  }
  return { results: [], images: [], why: why.join(" | ") };
}

const clip = (t = "", n = 400) => {
  const s = String(t).replace(/\s+/g, " ").trim();
  return s.length > n ? `${s.slice(0, n)}…` : s;
};

const MAX_IMAGES = 6;
const cleanImg = (src, href, alt) => {
  try {
    const u = new URL(src);
    if (u.protocol !== "https:" || src.length > 400) return null;
    const h = href && /^https?:\/\//.test(href) && href.length < 400 ? href : src;
    return { s: src, h, a: clip(alt, 90) };
  } catch { return null; }
};

/** بيرجّع [{ title, url, snippet, date }] أو [] لو حصلت مشكلة */
export async function webSearch(query) {
  return (await webSearchFull(query)).results;
}

/** نفس البحث + صور مرتبطة بالنتايج: { results, images: [{ s: رابط الصورة, h: صفحة المصدر, a: وصف }] } */
export async function webSearchFull(query) {
  const provider = searchProvider();
  const empty = { results: [], images: [] };
  if (!provider || !query) return empty;
  const images = [];
  const addImg = (src, href, alt) => {
    if (images.length >= MAX_IMAGES || !src || images.some((x) => x.s === src)) return;
    const im = cleanImg(src, href, alt);
    if (im) images.push(im);
  };
  if (provider === "ddg") return ddgSearch(query);
  if (provider === "gemini") {
    // حصة Gemini المجانية للبحث محدودة، فلو خلصت نكمّل بالبحث من غير مفتاح
    const g = await geminiSearch(query);
    if (g.results.length) return g;
    const d = await ddgSearch(query);
    return { ...d, why: [g.why, d.why].filter(Boolean).join(" | ") };
  }
  try {
    if (provider === "serper") {
      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({ q: query, gl: "eg", hl: "ar", num: 8 }),
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) return empty;
      const data = await res.json();
      const out = [];
      for (const im of data.images || []) addImg(im.imageUrl, im.link, im.title);
      const box = data.answerBox;
      if (box && (box.answer || box.snippet) && box.link) {
        out.push({ title: box.title || "إجابة مختصرة", url: box.link, snippet: clip(box.answer || box.snippet) });
      }
      for (const r of data.organic || []) {
        if (r.link && !out.some((x) => x.url === r.link)) out.push({ title: clip(r.title, 120), url: r.link, snippet: clip(r.snippet), date: r.date });
        if (r.imageUrl) addImg(r.imageUrl, r.link, r.title);
      }
      return { results: out.slice(0, MAX_RESULTS), images };
    }

    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.TAVILY_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results: MAX_RESULTS, search_depth: "basic", include_images: true, include_image_descriptions: true }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return empty;
    const data = await res.json();
    for (const im of data.images || []) {
      if (typeof im === "string") addImg(im, "", "");
      else addImg(im?.url, "", im?.description);
    }
    const results = (data.results || [])
      .filter((r) => r.url)
      .slice(0, MAX_RESULTS)
      .map((r) => ({ title: clip(r.title, 120), url: r.url, snippet: clip(r.content, 600), date: r.published_date }));
    return { results, images };
  } catch {
    return empty;
  }
}

/**
 * جملة البحث: لو أول سؤال بنستخدمه زي ما هو.
 * لو المحادثة فيها كلام قبل كده (زي «وسعره كام؟») بنخلي موديل سريع يكتب جملة بحث واضحة.
 */
export async function searchQuery(messages, apiKey) {
  const users = messages.filter((m) => m.role === "user");
  const last = users[users.length - 1]?.content || "";
  const plain = clip(last, 300);
  if (users.length < 2) return plain;
  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        reasoning_effort: "low",
        temperature: 0.2,
        max_tokens: 300,
        messages: [
          { role: "system", content: "حوّل آخر سؤال للمستخدم لجملة بحث قصيرة وواضحة لجوجل (أقل من 12 كلمة) بنفس لغته، مستخدماً سياق المحادثة. اكتب جملة البحث بس، من غير أي شرح أو علامات تنصيص." },
          ...messages.slice(-6).map((m) => ({ role: m.role, content: clip(m.content, 800) })),
        ],
      }),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return plain;
    const q = (await res.json())?.choices?.[0]?.message?.content?.trim().replace(/^["«']|["»']$/g, "");
    return q && q.length > 1 && q.length < 200 ? q : plain;
  } catch {
    return plain;
  }
}

/** النتايج في شكل يفهمه الموديل (notes = ملخص البحث لو المزود بيرجّعه، زي Gemini) */
export function resultsBlock(query, results, notes = "") {
  const today = new Date().toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "full" });
  const lines = results.map((r, i) => `[${i + 1}] ${r.title}${r.date ? ` (${r.date})` : ""}\n${r.domain ? "" : `${r.url}\n`}${r.snippet}`).join("\n\n");
  return [
    `تاريخ النهارده: ${today}.`,
    `دي نتايج بحث على الإنترنت عن: «${query}»`,
    notes ? `ملخص اللي لقيناه في البحث:\n${notes}` : "",
    `المصادر:\n${lines}`,
    "اعتمد على النتايج دي في الإجابة، واكتب رقم المصدر بين قوسين زي [1] بعد المعلومة اللي أخدتها منه.",
    "لو النتايج مش كفاية أو متضاربة قول كده بوضوح. متخترعش معلومات أو روابط مش موجودة في النتايج.",
  ].filter(Boolean).join("\n\n");
}
