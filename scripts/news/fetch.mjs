// بيجمع أخبار الذكاء الاصطناعي كل يوم، يكتب ملخص عربي بكلامنا للجديد بس، ويحفظ data/news/items.json
// المفاتيح اختيارية: GROQ_API_KEY / OPENROUTER_API_KEY (من غيرهم الأخبار بتظهر بعنوانها الأصلي).
import fs from "node:fs";
import crypto from "node:crypto";
import * as cheerio from "cheerio";
import { FEEDS, AI_RE } from "./feeds.mjs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const FILE = "data/news/items.json";
const KEEP_DAYS = 30, MAX_ITEMS = 320, MAX_TRANSLATE = 70;
const prev = fs.existsSync(FILE) ? JSON.parse(fs.readFileSync(FILE, "utf8")) : { items: [] };
const byId = new Map(prev.items.map((i) => [i.id, i]));
const report = {};

const clean = (h) => cheerio.load(`<div>${h || ""}</div>`)("div").text().replace(/\s+/g, " ").trim();
async function get(url) {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), 15000);
  try { const r = await fetch(url, { headers: { "user-agent": UA, accept: "application/rss+xml,application/atom+xml,text/xml,*/*" }, redirect: "follow", signal: c.signal }); if (!r.ok) throw new Error("HTTP " + r.status); return await r.text(); }
  finally { clearTimeout(t); }
}
function parse(xml) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const out = [];
  $("item, entry").each((_, el) => {
    const e = $(el);
    const title = clean(e.children("title").first().text());
    let link = e.children("link").first().attr("href") || e.children("link").first().text().trim();
    if (!link) link = e.children("guid").first().text().trim();
    const d = e.children("pubDate, published, updated, dc\\:date").first().text().trim();
    const date = d ? new Date(d) : null;
    const desc = clean(e.children("description, summary, content\\:encoded, content").first().text()).slice(0, 500);
    if (title && /^https?:/.test(link) && date && !isNaN(date)) out.push({ title, link, date: date.toISOString(), desc });
  });
  return out;
}

const now = Date.now(), cutoff = now - KEEP_DAYS * 864e5;
const fresh = [];
await Promise.all(FEEDS.map(async (f) => {
  try {
    let xml; try { xml = await get(f.url); } catch (e) { await new Promise((r) => setTimeout(r, 4000)); xml = await get(f.url); }
    const items = parse(xml);
    let n = 0;
    for (const it of items) {
      if (Date.parse(it.date) < cutoff || Date.parse(it.date) > now + 864e5) continue;
      if (f.ai === false && !AI_RE.test(it.title + " " + it.desc)) continue;
      fresh.push({ ...it, src: f.name, srcId: f.id, kind: f.kind }); n++;
    }
    report[f.id] = `ok ${n}`;
  } catch (e) { report[f.id] = "FAIL " + String(e.message || e).slice(0, 60); }
}));
console.log("feeds:", JSON.stringify(report, null, 1));

const descs = new Map();
for (const it of fresh) {
  const id = crypto.createHash("sha1").update(it.link.replace(/[?#].*$/, "")).digest("hex").slice(0, 12);
  descs.set(id, it.desc);
  if (!byId.has(id)) byId.set(id, { id, url: it.link, title: it.title, date: it.date, src: it.src, srcId: it.srcId, kind: it.kind, ar: it.kind === "arabic" ? { title: it.title, summary: "" } : null });
}

// ترجمة/تلخيص بالعربي للجديد بس
const PROVIDERS = [
  process.env.GROQ_API_KEY && { name: "groq", url: process.env.GROQ_URL || "https://api.groq.com/openai/v1/chat/completions", key: process.env.GROQ_API_KEY, model: process.env.GROQ_MODEL || "openai/gpt-oss-120b" },
  process.env.OPENROUTER_API_KEY && { name: "openrouter", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY, model: process.env.OPENROUTER_MODEL || "openai/gpt-oss-120b" },
  process.env.GEMINI_API_KEY && { name: "gemini", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: process.env.GEMINI_API_KEY, model: process.env.GEMINI_MODEL || "gemini-2.5-flash" },
].filter(Boolean);
console.log("providers:", PROVIDERS.map((p) => p.name).join(", ") || "none");
const used = {};

async function llm(payload) {
  for (const p of PROVIDERS) {
    const r = await fetch(p.url, { method: "POST", headers: { authorization: `Bearer ${p.key}`, "content-type": "application/json" },
      body: JSON.stringify({ model: p.model, temperature: 0.2, max_tokens: 3000, response_format: { type: "json_object" },
        messages: [{ role: "system", content: "انت محرر أخبار تقنية. اكتب بالعربي المبسط (بلمسة مصرية خفيفة). لكل خبر: عنوان عربي قصير، وملخص من جملة أو جملتين بصياغتك انت. اعتمد على النص المعطى بس ومتضفش معلومة مش فيه. أسماء الشركات والمنتجات سيبها بالإنجليزي. الرد JSON بالشكل {\"items\":[{\"id\":\"...\",\"title\":\"...\",\"summary\":\"...\"}]}." }, { role: "user", content: JSON.stringify(payload) }] }) }).catch(() => null);
    if (!r?.ok) { console.log(`${p.name}: HTTP ${r?.status}`); continue; }
    used[p.name] = (used[p.name] || 0) + 1;
    try { return JSON.parse((await r.json()).choices[0].message.content).items || []; } catch {}
  }
  return null;
}
if (PROVIDERS.length) {
  const todo = [...byId.values()].filter((i) => !i.ar).sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_TRANSLATE);
  for (let k = 0; k < todo.length; k += 8) {
    const batch = todo.slice(k, k + 8);
    let res = await llm(batch.map((i) => ({ id: i.id, title: i.title, text: descs.get(i.id) || "" })));
    if (!res) { await new Promise((r) => setTimeout(r, 25000)); res = await llm(batch.map((i) => ({ id: i.id, title: i.title, text: descs.get(i.id) || "" }))); }
    if (!res) { console.log("LLM batch failed"); continue; }
    for (const r of res) { const it = byId.get(r.id); if (it && r.title) it.ar = { title: String(r.title).slice(0, 160), summary: String(r.summary || "").slice(0, 400) }; }
  }
} else console.log("NO_KEYS: الأخبار هتظهر بالعنوان الأصلي لحد ما تضيف GROQ_API_KEY");

const items = [...byId.values()].filter((i) => Date.parse(i.date) >= cutoff).sort((a, b) => b.date.localeCompare(a.date)).slice(0, MAX_ITEMS);
fs.mkdirSync("data/news", { recursive: true });
fs.writeFileSync(FILE, JSON.stringify({ updated: new Date().toISOString(), providers: PROVIDERS.map((p) => p.name), used, feeds: report, items }, null, 1));
console.log("used:", JSON.stringify(used));
console.log("items:", items.length, "translated:", items.filter((i) => i.ar).length);
