// الخطوة 1: نجمع أسماء وروابط أدوات الذكاء الاصطناعي من قوائم مفتوحة على GitHub.
// بناخد الاسم والرابط بس (مش الوصف)، والأداة اللي موجودة في أكتر من قايمة بتيجي الأول.
// التشغيل: node scripts/directory/seeds.mjs  → data/directory/seeds.json
import fs from "node:fs";

const LISTS = [
  "mahseema/awesome-ai-tools",
  "steven2358/awesome-generative-ai",
  "ikaijua/Awesome-AITools",
  "eudk/awesome-ai-tools",
  "filipecalegario/awesome-generative-ai",
  "ai-collection/ai-collection",
  "yousefebrahimi0/1000-AI-collection-tools",
  "e2b-dev/awesome-ai-agents",
  "jamesmurdza/awesome-ai-devtools",
  "Jenqyang/Awesome-AI-Agents",
];

const SKIP = /(^|\.)(github\.com|githubusercontent\.com|github\.io|youtube\.com|youtu\.be|twitter\.com|x\.com|arxiv\.org|medium\.com|reddit\.com|discord\.(gg|com)|wikipedia\.org|linkedin\.com|docs\.google\.com|drive\.google\.com|apps\.apple\.com|play\.google\.com|chrome\.google\.com|chromewebstore\.google\.com|producthunt\.com|substack\.com|huggingface\.co|paperswithcode\.com|notion\.site|t\.me|facebook\.com|instagram\.com|tiktok\.com|bit\.ly|gitlab\.com|npmjs\.com|pypi\.org|colab\.research\.google\.com|openreview\.net|aclanthology\.org|stackoverflow\.com|shields\.io|creativecommons\.org|forms\.gle|ycombinator\.com|techcrunch\.com|theverge\.com|nytimes\.com|wired\.com)$/i;

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, "").toLowerCase(); } catch { return ""; } };

async function readme(repo) {
  for (const branch of ["main", "master"]) {
    for (const file of ["README.md", "readme.md", "README.MD"]) {
      const r = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/${file}`).catch(() => null);
      if (r && r.ok) return r.text();
    }
  }
  return "";
}

const clean = (n) => n.replace(/[*_`]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\s+/g, " ").trim();

const seen = new Map();
for (const repo of LISTS) {
  const md = await readme(repo);
  let n = 0;
  const found = new Set();
  // [Name](https://url) أو <a href="url">Name</a>
  const re = /\[([^\]\n]{2,60})\]\((https?:\/\/[^)\s]+)\)|<a[^>]+href="(https?:\/\/[^"]+)"[^>]*>([^<]{2,60})<\/a>/g;
  for (const m of md.matchAll(re)) {
    const name = clean(m[1] || m[4] || "");
    const url = (m[2] || m[3] || "").replace(/[).,]+$/, "");
    const h = host(url);
    if (!h || SKIP.test(h) || !name || /^(link|website|demo|paper|code|here|github|source|docs?)$/i.test(name) || name.length < 2) continue;
    if (found.has(h)) continue;
    found.add(h);
    const prev = seen.get(h);
    if (prev) prev.votes += 1;
    else seen.set(h, { name, url: `https://${new URL(url).hostname}`, host: h, votes: 1, from: repo });
    n++;
  }
  console.log(`${repo}: ${md ? n : "not found"}`);
}

const seeds = [...seen.values()].sort((a, b) => b.votes - a.votes);
fs.mkdirSync("data/directory", { recursive: true });
fs.writeFileSync("data/directory/seeds.json", JSON.stringify(seeds, null, 1));
console.log(`total unique: ${seeds.length}; in 2+ lists: ${seeds.filter((s) => s.votes > 1).length}`);
