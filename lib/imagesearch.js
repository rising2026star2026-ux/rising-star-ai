// صور توثيقية للإجابة (خيار «صور توضيحية»): صور وخرائط حقيقية من Wikimedia Commons (مجاني ومن غير مفتاح)،
// ولو فيه SERPER_API_KEY بنضيف صور من بحث جوجل كمان. على السيرفر بس.
// Commons فيه صور تاريخية وخرائط ولوحات بتراخيص مفتوحة، وكل صورة بتفتح صفحتها الأصلية (المصدر والترخيص).
import { completeOnce, quickChain } from "@/lib/groq";

const MAX = 8;
const UA = "RisingStarAi/1.0 (https://rising-star-ai.vercel.app)";

const clip = (t, n) => String(t || "").replace(/\s+/g, " ").trim().slice(0, n);
const nameOf = (title) => clip(String(title || "").replace(/^File:/i, "").replace(/\.(jpe?g|png|gif|svg|tiff?|webp)$/i, "").replace(/[_-]+/g, " "), 90);

/** كلمات بحث إنجليزي قصيرة (Commons أغلبه بالإنجليزي) */
async function englishKeywords(question, signal) {
  const messages = [
    { role: "system", content: "Turn the user's question into a short English image-search phrase about its main subject (2-5 words, names and places only, no verbs). Output the phrase only." },
    { role: "user", content: clip(question, 300) },
  ];
  for (const m of quickChain().slice(0, 3)) {
    const out = await completeOnce(m, { messages, temperature: 0.1, maxTokens: 60, signal });
    const kw = clip(out, 60).replace(/["«»'.]/g, "");
    if (kw && /[a-z]/i.test(kw)) return kw;
  }
  return "";
}

async function commons(query, signal) {
  const url = new URL("https://commons.wikimedia.org/w/api.php");
  Object.entries({
    action: "query", format: "json", origin: "*", generator: "search", gsrnamespace: "6", gsrlimit: "10",
    gsrsearch: `${query} filetype:bitmap|drawing`, prop: "imageinfo", iiprop: "url|mime", iiurlwidth: "480",
  }).forEach(([k, v]) => url.searchParams.set(k, v));
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal });
    if (!r.ok) return [];
    const pages = Object.values((await r.json())?.query?.pages || {}).sort((a, b) => (a.index || 0) - (b.index || 0));
    return pages
      .map((p) => {
        const ii = p.imageinfo?.[0];
        if (!ii?.thumburl || !/^image\//.test(ii.mime || "")) return null;
        return { s: ii.thumburl, h: ii.descriptionurl || ii.url, a: nameOf(p.title), src: "Wikimedia Commons" };
      })
      .filter(Boolean);
  } catch {
    return [];
  }
}

async function serperImages(query, signal) {
  if (!process.env.SERPER_API_KEY) return [];
  try {
    const r = await fetch("https://google.serper.dev/images", {
      method: "POST",
      headers: { "X-API-KEY": process.env.SERPER_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ q: query, gl: "eg", hl: "ar", num: 10 }),
      signal,
    });
    if (!r.ok) return [];
    return ((await r.json())?.images || [])
      .filter((im) => /^https:\/\//.test(im.imageUrl || "") && im.imageUrl.length < 400)
      .map((im) => ({ s: im.thumbnailUrl && /^https:/.test(im.thumbnailUrl) ? im.thumbnailUrl : im.imageUrl, h: im.link || im.imageUrl, a: clip(im.title, 90), src: im.source || "" }));
  } catch {
    return [];
  }
}

/** صور وخرائط توثيقية للسؤال: [{ s: الصورة, h: صفحة المصدر, a: وصف, src: اسم المصدر }] */
export async function documentImages(question, { existing = [] } = {}) {
  const signal = AbortSignal.timeout(9000);
  const wantsMap = /خريط|خرائط|حدود|موقع\s|مكان|فين|أين|اين|ولد|اتولد|حرب|معرك|حمل[ةه]|دول[ةه]|إمبراطوري|امبراطوري|map/i.test(question);
  const kw = await englishKeywords(question, signal);
  const [g, c, maps] = await Promise.all([
    serperImages(clip(question, 200), signal),
    kw ? commons(kw, signal) : Promise.resolve([]),
    kw && wantsMap ? commons(`${kw} map`, signal) : Promise.resolve([]),
  ]);
  const out = [];
  const seen = new Set(existing.map((x) => x.s));
  // خريطة أو اتنين الأول لو السؤال عن مكان أو حدث، وبعدها صور Commons، وبعدها صور البحث
  for (const im of [...maps.slice(0, 2), ...c, ...g, ...maps.slice(2)]) {
    if (out.length >= MAX || seen.has(im.s)) continue;
    seen.add(im.s);
    out.push(im);
  }
  return out;
}
