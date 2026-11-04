// الباحث الأكاديمي: بحث في مكتبات أبحاث وكتب حقيقية مجانية (على السيرفر بس، ومن غير مفاتيح).
//   OpenAlex          — أكتر من 250 مليون بحث وكتاب ورسالة، بالملخص والمؤلفين وعدد الاستشهادات (api.openalex.org)
//   Semantic Scholar  — أبحاث بالملخص وروابط PDF المفتوحة (الحصة المجانية مشتركة وممكن ترد 429، فبنكمّل من غيرها)
//   arXiv             — أبحاث العلوم والتقنية والرياضيات (نصها الكامل مفتوح)
//   Open Library      — بيانات الكتب (العنوان والمؤلف وسنة النشر والموضوعات)
// المصادر بترجع موحّدة: { n, kind, title, authors, year, venue, url, doi, abstract, cites, oa, lib }
import { completeOnce, quickChain } from "@/lib/groq";
import { extractJson } from "@/lib/llmjson";

const UA = "RisingStarAi/1.0 (+https://rising-star-ai.vercel.app)";
const clip = (t, n) => String(t || "").replace(/\s+/g, " ").trim().slice(0, n);
const normTitle = (t) => clip(t, 300).toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();

async function getJson(url, { timeout = 9000, headers = {} } = {}) {
  try {
    const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json", ...headers }, signal: AbortSignal.timeout(timeout) });
    if (!r.ok) return null;
    return await r.json();
  } catch {
    return null;
  }
}

/** من سؤال المستخدم: جملة بحث إنجليزي (أغلب الأبحاث بالإنجليزي) + جملة عربي + المجال */
export async function researchQueries(topic) {
  const messages = [
    { role: "system", content: 'You prepare academic database searches. From the user topic (often Arabic), return JSON only: {"en":"precise English search query, 3-8 keywords","ar":"short Arabic search query","field":"one of: humanities, social, science, medicine, tech, business, law, education, other"}' },
    { role: "user", content: clip(topic, 600) },
  ];
  for (const m of quickChain().slice(0, 4)) {
    const j = extractJson(await completeOnce(m, { messages, temperature: 0.1, maxTokens: 300 }));
    if (j?.en) return { en: clip(j.en, 160), ar: clip(j.ar || topic, 160), field: String(j.field || "other") };
  }
  return { en: clip(topic, 160), ar: clip(topic, 160), field: "other" };
}

/** OpenAlex بيرجّع الملخص كفهرس كلمات: { word: [positions] } */
function openAlexAbstract(inv) {
  if (!inv || typeof inv !== "object") return "";
  const words = [];
  for (const [w, pos] of Object.entries(inv)) for (const p of pos) words[p] = w;
  return clip(words.filter(Boolean).join(" "), 1600);
}

async function openAlex(query, n = 10) {
  const url = new URL("https://api.openalex.org/works");
  url.searchParams.set("search", query);
  url.searchParams.set("per-page", String(n));
  url.searchParams.set("filter", "has_abstract:true");
  url.searchParams.set("select", "id,doi,display_name,publication_year,authorships,primary_location,cited_by_count,abstract_inverted_index,open_access,type");
  const d = await getJson(url);
  return (d?.results || []).map((w) => ({
    kind: /book/.test(w.type || "") ? "book" : w.type === "dissertation" ? "thesis" : "paper",
    title: clip(w.display_name || w.title, 300),
    authors: (w.authorships || []).slice(0, 4).map((a) => clip(a.author?.display_name, 60)).filter(Boolean),
    year: w.publication_year || null,
    venue: clip(w.primary_location?.source?.display_name, 120),
    doi: w.doi ? String(w.doi).replace(/^https?:\/\/doi\.org\//, "") : "",
    url: w.doi || w.primary_location?.landing_page_url || w.id,
    abstract: openAlexAbstract(w.abstract_inverted_index),
    cites: w.cited_by_count || 0,
    oa: w.open_access?.oa_url || "",
    lib: "OpenAlex",
  }));
}

async function semanticScholar(query, n = 8) {
  const url = new URL("https://api.semanticscholar.org/graph/v1/paper/search");
  url.searchParams.set("query", query);
  url.searchParams.set("limit", String(n));
  url.searchParams.set("fields", "title,abstract,year,authors,venue,citationCount,externalIds,url,openAccessPdf");
  const d = await getJson(url, { timeout: 7000 });
  return (d?.data || []).filter((p) => p.abstract).map((p) => ({
    kind: "paper",
    title: clip(p.title, 300),
    authors: (p.authors || []).slice(0, 4).map((a) => clip(a.name, 60)),
    year: p.year || null,
    venue: clip(p.venue, 120),
    doi: p.externalIds?.DOI || "",
    url: p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : p.url,
    abstract: clip(p.abstract, 1600),
    cites: p.citationCount || 0,
    oa: p.openAccessPdf?.url || "",
    lib: "Semantic Scholar",
  }));
}

const xml = (s, tag) => (s.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)) || [])[1] || "";
async function arxiv(query, n = 5) {
  try {
    const url = `https://export.arxiv.org/api/query?search_query=${encodeURIComponent(`all:${query}`)}&start=0&max_results=${n}`;
    const r = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(8000) });
    if (!r.ok) return [];
    const text = await r.text();
    return [...text.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].map(([, e]) => ({
      kind: "paper",
      title: clip(xml(e, "title"), 300),
      authors: [...e.matchAll(/<name>([\s\S]*?)<\/name>/g)].slice(0, 4).map((m) => clip(m[1], 60)),
      year: Number(xml(e, "published").slice(0, 4)) || null,
      venue: "arXiv",
      doi: "",
      url: clip(xml(e, "id"), 300),
      abstract: clip(xml(e, "summary"), 1600),
      cites: 0,
      oa: clip(xml(e, "id"), 300).replace("/abs/", "/pdf/"),
      lib: "arXiv",
    })).filter((x) => x.title && x.abstract);
  } catch {
    return [];
  }
}

async function openLibrary(query, n = 6) {
  const url = new URL("https://openlibrary.org/search.json");
  url.searchParams.set("q", query);
  url.searchParams.set("limit", String(n));
  url.searchParams.set("fields", "key,title,author_name,first_publish_year,subject,publisher,number_of_pages_median,edition_count");
  const d = await getJson(url);
  return (d?.docs || []).filter((b) => b.title).map((b) => ({
    kind: "book",
    title: clip(b.title, 300),
    authors: (b.author_name || []).slice(0, 3).map((a) => clip(a, 60)),
    year: b.first_publish_year || null,
    venue: clip((b.publisher || [])[0], 100),
    doi: "",
    url: `https://openlibrary.org${b.key}`,
    abstract: (b.subject || []).length ? `كتاب عن: ${(b.subject || []).slice(0, 10).join("، ")}${b.number_of_pages_median ? ` • حوالي ${b.number_of_pages_median} صفحة` : ""}` : "",
    cites: (b.edition_count || 0) * 3, // عدد الطبعات كمؤشر بسيط على أهمية الكتاب
    oa: "",
    lib: "Open Library",
  }));
}

const STEM = ["science", "tech", "medicine"];

/** كل المكتبات بالتوازي، ودمج وترتيب وإزالة التكرار. بيرجّع { queries, sources, libs } */
export async function findSources(topic, { max = 18 } = {}) {
  const q = await researchQueries(topic);
  const [oaEn, oaAr, s2, ax, books] = await Promise.all([
    openAlex(q.en, 12),
    q.ar && q.ar !== q.en ? openAlex(q.ar, 6) : Promise.resolve([]),
    semanticScholar(q.en, 8),
    STEM.includes(q.field) ? arxiv(q.en, 5) : Promise.resolve([]),
    openLibrary(q.en, 6),
  ]);
  const libs = { OpenAlex: oaEn.length + oaAr.length, "Semantic Scholar": s2.length, arXiv: ax.length, "Open Library": books.length };

  // ترتيب: الأقرب للبحث الأول من كل مكتبة، مع أفضلية بسيطة للأكثر استشهاداً
  const ranked = [];
  const push = (list, w) => list.forEach((x, i) => ranked.push({ ...x, score: w - i * 0.6 + Math.log10((x.cites || 0) + 1) * 1.2 }));
  push(oaEn, 12);
  push(s2, 11);
  push(oaAr, 10.5);
  push(ax, 10);
  push(books, 8.5);
  ranked.sort((a, b) => b.score - a.score);

  const seen = new Set();
  const out = [];
  for (const x of ranked) {
    if (!x.title || x.title.length < 4) continue;
    const key = x.doi ? `doi:${x.doi.toLowerCase()}` : `t:${normTitle(x.title)}`;
    const tkey = `t:${normTitle(x.title)}`;
    if (seen.has(key) || seen.has(tkey)) continue;
    seen.add(key);
    seen.add(tkey);
    out.push(x);
  }
  // كتب كفاية في القايمة (لحد 4) حتى لو ترتيبها متأخر
  const papers = out.filter((x) => x.kind !== "book").slice(0, max - Math.min(4, out.filter((x) => x.kind === "book").length));
  const bookList = out.filter((x) => x.kind === "book").slice(0, max - papers.length);
  const sources = [...papers, ...bookList].map(({ score, ...x }, i) => ({ ...x, n: i + 1 }));
  return { queries: q, sources, libs };
}
