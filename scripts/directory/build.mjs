// الخطوة 2: لكل أداة من seeds.json:
//   1) نزور موقعها الرسمي (الصفحة الرئيسية + صفحة الأسعار لو موجودة)
//   2) ناخد شعارها من الموقع نفسه ونحفظه webp في public/dir-logos
//   3) الذكاء الاصطناعي بيكتب صفحة عربي من كلام الموقع بس (من غير تأليف)، ويحدد المجال ونوع التسعير
//   4) بنحفظ في data/directory/tools.json (وبنكمّل من مكان ما وقفنا لو اتشغل تاني)
//
// التشغيل: node scripts/directory/build.mjs --limit 300 --minutes 320
// المفاتيح (GitHub Secrets): GROQ_API_KEY (الأساسي) و OPENROUTER_API_KEY (احتياطي لو Groq زحمة)
import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { DIR_CATEGORIES } from "../../lib/dircats.js";

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > -1 ? process.argv[i + 1] : d; };
const LIMIT = Number(arg("limit", 300));
const MINUTES = Number(arg("minutes", 320));
const CONC = Number(arg("concurrency", 3));
const DEADLINE = Date.now() + MINUTES * 60_000;

const DIR = "data/directory";
const OUT = `${DIR}/tools.json`;
const FAILED = `${DIR}/failed.json`;
const LOGOS = "public/dir-logos";
fs.mkdirSync(LOGOS, { recursive: true });

const readJson = (f, d) => { try { return JSON.parse(fs.readFileSync(f, "utf8")); } catch { return d; } };
const seeds = readJson(`${DIR}/seeds.json`, []);
const tools = readJson(OUT, []);
const failed = readJson(FAILED, {});
const doneHosts = new Set(tools.map((t) => t.host));
const slugs = new Set(tools.map((t) => t.slug));
const names = new Set(tools.map((t) => t.name.toLowerCase()));
const CAT_IDS = DIR_CATEGORIES.map((c) => c.id);
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const today = new Date().toISOString().slice(0, 10);

function save() {
  tools.sort((a, b) => (b.votes || 0) - (a.votes || 0) || a.name.localeCompare(b.name));
  fs.writeFileSync(OUT, JSON.stringify(tools, null, 1));
  fs.writeFileSync(FAILED, JSON.stringify(failed, null, 1));
}

async function get(url, ms = 15000) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: ctl.signal });
    return r;
  } finally { clearTimeout(t); }
}

// ---------- 1) زيارة الموقع ----------
function pageText($) {
  $("script, style, noscript, svg, iframe, template").remove();
  const parts = [];
  $("h1, h2, h3, p, li, td, th, a.button, button").each((_, el) => {
    const s = $(el).text().replace(/\s+/g, " ").trim();
    if (s.length > 2 && s.length < 400) parts.push(s);
  });
  return [...new Set(parts)].join("\n");
}

// لو الموقع قافل على الزيارات الآلية: نقرا النص من خدمة r.jina.ai (بتجيب نص الصفحة العام)
async function crawlReader(seed) {
  const r = await get(`https://r.jina.ai/${seed.url}`, 30000);
  if (!r.ok) throw new Error(`reader ${r.status}`);
  const txt = (await r.text()).slice(0, 6000);
  const title = (txt.match(/^Title: (.*)$/m) || [])[1] || "";
  return { url: seed.url, title, description: "", siteName: "", icons: [], text: txt };
}

async function crawl(seed) {
  let r;
  try { r = await get(seed.url); } catch { return crawlReader(seed); }
  if (r.status === 403 || r.status === 429 || r.status === 503) return crawlReader(seed);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const finalUrl = r.url;
  const html = await r.text();
  const $ = cheerio.load(html);
  const meta = (n) => $(`meta[name="${n}"], meta[property="${n}"]`).attr("content") || "";
  const info = {
    url: finalUrl,
    title: $("title").first().text().trim(),
    description: meta("description") || meta("og:description"),
    siteName: meta("og:site_name"),
    icons: [],
  };
  $('link[rel~="icon"], link[rel="apple-touch-icon"], link[rel="apple-touch-icon-precomposed"]').each((_, el) => {
    const href = $(el).attr("href");
    if (!href) return;
    const sizes = Number(($(el).attr("sizes") || "").split("x")[0]) || ($(el).attr("rel").includes("apple") ? 180 : 32);
    try { info.icons.push({ url: new URL(href, finalUrl).href, size: sizes }); } catch {}
  });
  // صفحة الأسعار
  let pricingUrl = "";
  $("a[href]").each((_, el) => {
    if (pricingUrl) return;
    const href = $(el).attr("href");
    const txt = $(el).text().toLowerCase();
    if (/pricing|plans|price|tarif|preise|precios/.test(href.toLowerCase()) || /^(pricing|plans|prices?)$/.test(txt.trim())) {
      try {
        const u = new URL(href, finalUrl);
        if (u.hostname.replace(/^www\./, "") === new URL(finalUrl).hostname.replace(/^www\./, "")) pricingUrl = u.href;
      } catch {}
    }
  });
  info.text = pageText($).slice(0, 5000);
  if (pricingUrl) {
    try {
      const pr = await get(pricingUrl);
      if (pr.ok) info.pricingText = pageText(cheerio.load(await pr.text())).slice(0, 3500);
      info.pricingUrl = pricingUrl;
    } catch {}
  }
  return info;
}

// ---------- 2) الشعار ----------
async function logo(info, host, slug) {
  const cands = [...info.icons].sort((a, b) => b.size - a.size).map((i) => i.url);
  cands.push(new URL("/apple-touch-icon.png", info.url).href);
  cands.push(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);
  for (const u of cands) {
    if (/\.ico(\?|$)/i.test(u)) continue;
    try {
      const r = await get(u, 10000);
      if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const img = sharp(buf, { density: 300 });
      const m = await img.metadata();
      if (!m.width || m.width < 32) continue;
      const file = path.join(LOGOS, `${slug}.webp`);
      await sharp(buf, { density: 300 }).resize(128, 128, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } }).flatten({ background: "#ffffff" }).webp({ quality: 88 }).toFile(file);
      return `/dir-logos/${slug}.webp`;
    } catch {}
  }
  return null;
}

// ---------- 3) الكتابة بالعربي ----------
const SYSTEM = `أنت محرر في دليل عربي لأدوات الذكاء الاصطناعي. هتاخد نص من موقع أداة رسمي وتكتب صفحة تعريفية بالعربي.
قواعد صارمة:
- اعتمد بس على النص اللي جاي من موقع الأداة. ممنوع تأليف مميزات أو أسعار أو أسماء شركات مش مذكورة.
- لو السعر مش مذكور في النص: pricing.type = "unknown" و plans = [].
- الأسعار تتكتب زي ما هي في النص بالعملة (مثلاً "$12/شهر"). أسماء الخطط تفضل بالإنجليزي زي الموقع.
- pricing.type: "free" لو مجانية بالكامل، "freemium" لو فيه خطة مجانية وخطط مدفوعة، "trial" لو فيه تجربة مجانية بس، "paid" لو مدفوعة من غير خطة مجانية، "unknown" لو مش واضح.
- اللغة: عربي بسيط وواضح بلهجة مصرية خفيفة زي "بتعمل" و"تنفع"، من غير مبالغة ولا كلام تسويقي.
- أسماء المنتجات والشركات تفضل بالإنجليزي.
- category لازم تكون واحدة بالظبط من: ${CAT_IDS.join(", ")}.
- is_ai_tool = false لو الموقع مش أداة ذكاء اصطناعي (مثلاً مدونة، شركة استشارات، صفحة مقفولة، دومين للبيع).
رجّع JSON بس بالشكل ده:
{"is_ai_tool":true,"name":"","company":"","category":"","summary":"جملة واحدة أقل من 110 حرف","intro":"3-4 جمل","what":"3-5 جمل عن بتعمل إيه وإزاي","features":["5 لـ 7 مميزات"],"audience":["3 لـ 5"],"steps":["3 لـ 5 خطوات للبداية"],"pricing":{"type":"","plans":[{"name":"","price":"","note":""}]},"pricing_text":"جملة أو اتنين عن التسعير","faq":[{"q":"","a":""}]}
faq من 3 لـ 4 أسئلة، وإجاباتها من النص بس.`;

function userMsg(seed, info) {
  return [
    `Tool URL: ${info.url}`,
    `Listed name: ${seed.name}`,
    `<title>: ${info.title}`,
    `meta description: ${info.description}`,
    info.siteName ? `site name: ${info.siteName}` : "",
    `--- homepage text ---\n${info.text}`,
    info.pricingText ? `--- pricing page (${info.pricingUrl}) ---\n${info.pricingText}` : "--- no pricing page found ---",
  ].filter(Boolean).join("\n");
}

const PROVIDERS = [
  process.env.GROQ_API_KEY && { name: "groq", url: process.env.GROQ_URL || "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "openai/gpt-oss-120b" },
  process.env.OPENROUTER_API_KEY && { name: "openrouter", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b" },
].filter(Boolean);
if (!PROVIDERS.length) { console.log("NO_KEYS: ضيف GROQ_API_KEY أو OPENROUTER_API_KEY في GitHub Secrets"); process.exit(0); }

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const parseJson = (s) => { try { return JSON.parse(s); } catch { const m = s.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; } };

async function write(seed, info) {
  const body = (p) => JSON.stringify({
    model: p.model, temperature: 0.2, max_tokens: 2600, response_format: { type: "json_object" },
    messages: [{ role: "system", content: SYSTEM }, { role: "user", content: userMsg(seed, info) }],
  });
  for (let attempt = 0; attempt < 6; attempt++) {
    for (const p of PROVIDERS) {
      const r = await fetch(p.url, { method: "POST", headers: { authorization: `Bearer ${p.key}`, "content-type": "application/json" }, body: body(p) }).catch(() => null);
      if (!r) continue;
      if (r.status === 429 || r.status >= 500) { await sleep(PROVIDERS.length > 1 ? 1500 : Math.min(60000, Number(r.headers.get("retry-after") || 20) * 1000)); continue; }
      if (!r.ok) { console.log(`  ${p.name} ${r.status}: ${(await r.text()).slice(0, 160)}`); continue; }
      const j = await r.json();
      const out = parseJson(j.choices?.[0]?.message?.content || "");
      if (out) return out;
    }
    await sleep(5000 * (attempt + 1));
  }
  throw new Error("LLM failed");
}

// ---------- مراجعة النتيجة ----------
const arOk = (s) => typeof s === "string" && /[؀-ۿ]/.test(s) && s.length > 10;
const list = (a, n) => (Array.isArray(a) ? a.filter(arOk).slice(0, n) : []);
function slugify(name, host) {
  let s = name.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  if (s.length < 2) s = host.split(".")[0];
  let out = s.slice(0, 50), i = 2;
  while (slugs.has(out)) out = `${s}-${i++}`;
  slugs.add(out);
  return out;
}

async function one(seed) {
  const info = await crawl(seed);
  if ((info.text || "").length < 200 && !info.description) throw new Error("empty page");
  const ar = await write(seed, info);
  if (!ar || ar.is_ai_tool === false) throw new Error("not an AI tool");
  if (!CAT_IDS.includes(ar.category)) ar.category = "lifestyle";
  if (!arOk(ar.summary) || !arOk(ar.intro)) throw new Error("weak content");
  const name = (ar.name || seed.name).trim().slice(0, 60);
  if (names.has(name.toLowerCase())) throw new Error("duplicate");
  names.add(name.toLowerCase());
  const slug = slugify(name, seed.host);
  const type = ["free", "freemium", "trial", "paid", "unknown"].includes(ar.pricing?.type) ? ar.pricing.type : "unknown";
  const plans = type === "unknown" ? [] : (ar.pricing?.plans || []).filter((p) => p && p.name).slice(0, 6).map((p) => ({ name: String(p.name).slice(0, 40), price: String(p.price || "").slice(0, 40), note: String(p.note || "").slice(0, 160) }));
  return {
    slug, name, host: seed.host, url: info.url, votes: seed.votes, cat: ar.category,
    company: ar.company && ar.company.length < 60 ? ar.company : null,
    logo: await logo(info, seed.host, slug),
    summary: ar.summary.slice(0, 140),
    pricing: { type, plans },
    ar: {
      intro: ar.intro, what: arOk(ar.what) ? ar.what : "",
      features: list(ar.features, 7), audience: list(ar.audience, 5), steps: list(ar.steps, 5),
      pricing: arOk(ar.pricing_text) ? ar.pricing_text : "",
      faq: (Array.isArray(ar.faq) ? ar.faq : []).filter((f) => arOk(f?.q) && arOk(f?.a)).slice(0, 4),
    },
    pricingUrl: info.pricingUrl || null,
    checked: today,
  };
}

// ---------- التشغيل ----------
const queue = seeds.filter((s) => !doneHosts.has(s.host) && !failed[s.host]).slice(0, LIMIT);
console.log(`seeds ${seeds.length} | done ${tools.length} | failed ${Object.keys(failed).length} | this run ${queue.length} | providers ${PROVIDERS.map((p) => p.name).join("+")}`);
let ok = 0, bad = 0, n = 0;
async function worker() {
  while (queue.length && Date.now() < DEADLINE) {
    const seed = queue.shift();
    n++;
    try {
      const t = await one(seed);
      tools.push(t); ok++;
      console.log(`✓ ${n} ${seed.host} → ${t.cat} (${t.pricing.type})${t.logo ? "" : " no-logo"}`);
    } catch (e) {
      failed[seed.host] = String(e.message || e).slice(0, 80); bad++;
      console.log(`✗ ${n} ${seed.host}: ${failed[seed.host]}`);
    }
    if (n % 10 === 0) save();
  }
}
await Promise.all(Array.from({ length: CONC }, worker));
save();
console.log(`done: +${ok} ok, ${bad} failed, total ${tools.length}`);
