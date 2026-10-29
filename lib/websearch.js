// البحث على الإنترنت للشات (على السيرفر بس)
//
// بيشتغل مع واحد من الاتنين، حسب المفتاح اللي في Vercel:
//   SERPER_API_KEY  — نتايج جوجل (serper.dev)
//   TAVILY_API_KEY  — tavily.com
// لو مفيش مفتاح، الشات بيرد عادي من غير بحث.

const MAX_RESULTS = 6;

export function searchProvider() {
  if (process.env.SERPER_API_KEY) return "serper";
  if (process.env.TAVILY_API_KEY) return "tavily";
  return null;
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

/** النتايج في شكل يفهمه الموديل */
export function resultsBlock(query, results) {
  const today = new Date().toLocaleDateString("ar-EG", { timeZone: "Africa/Cairo", dateStyle: "full" });
  const lines = results.map((r, i) => `[${i + 1}] ${r.title}${r.date ? ` (${r.date})` : ""}\n${r.url}\n${r.snippet}`).join("\n\n");
  return [
    `تاريخ النهارده: ${today}.`,
    `دي نتايج بحث على الإنترنت عن: «${query}»`,
    lines,
    "اعتمد على النتايج دي في الإجابة، واكتب رقم المصدر بين قوسين زي [1] بعد المعلومة اللي أخدتها منه.",
    "لو النتايج مش كفاية أو متضاربة قول كده بوضوح. متخترعش معلومات أو روابط مش موجودة في النتايج.",
  ].join("\n\n");
}
