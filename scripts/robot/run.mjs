// 🤖 روبوت فحص الموقع اليومي
// بيشتغل كل يوم الصبح على GitHub Actions (robot.yml) على الموقع الحقيقي، وبيكتب تقرير بالعربي
// في Issue جديد على GitHub (بيوصل إيميل) + النتايج والصور في فرع ci-results تحت robot/.
//
// تشغيل جزء بس (للتجربة):
//   ONLY="pages,tools,features,ai,outside"   أي مجموعة منهم
//   MATCH="/tool/qr-code,/amazon"            صفحات معيّنة بس
//   AI_PER_DAY=12  DIR_PER_DAY=40            عدد أدوات الكتابة وصفحات الدليل اللي بتتجرب كل يوم
import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";
import { MOBILE, sitemapUrls, sweep, newPage } from "./sweep.mjs";
import { TOOL_RECIPES, FEATURE_RECIPES, PAGE_ONLY, runAiTool } from "./recipes.mjs";
import { findSpaces, checkSpaces, checkLinks } from "./outside.mjs";
import { mergeItems, buildReport, summaryOf } from "./report.mjs";
import { Verdict, rotate, shot, sleep } from "./lib.mjs";

const BASE = (process.env.BASE || "https://rising-star-ai.vercel.app").replace(/\/$/, "");
const OUT = process.env.OUT || "robot-out";
const REPO = process.env.GITHUB_REPOSITORY || "rising2026star2026-ux/rising-star-ai";
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const list = (v) => (v || "").split(",").map((s) => s.trim()).filter(Boolean);
const ONLY = new Set(list(process.env.ONLY));
const MATCH = list(process.env.MATCH);
const want = (g) => !ONLY.size || ONLY.has(g);
const matches = (p) => !MATCH.length || MATCH.some((m) => p === m || p.startsWith(m.endsWith("/") ? m : m + "/") || p === m.replace(/\/$/, ""));
const AI_PER_DAY = Number(process.env.AI_PER_DAY || 12);
const DIR_PER_DAY = Number(process.env.DIR_PER_DAY || 40);

const started = Date.now();
const log = (...a) => console.log(`[${((Date.now() - started) / 1000).toFixed(0).padStart(4)}s]`, ...a);
await fs.mkdir(OUT, { recursive: true });

let prev = null;
try { prev = JSON.parse(await fs.readFile(process.env.PREV || path.join(OUT, "..", "robot-prev.json"), "utf8")); } catch {}

// 1) خريطة الموقع
const urls = await sitemapUrls(BASE);
const paths = urls.map((u) => new URL(u).pathname);
const dir = urls.filter((u) => new URL(u).pathname.startsWith("/ai/"));
const dirPick = rotate(dir, DIR_PER_DAY);
const sweepList = urls.filter((u) => !new URL(u).pathname.startsWith("/ai/")).concat(dirPick).filter((u) => matches(new URL(u).pathname));
log(`sitemap: ${urls.length} روابط (${dir.length} في الدليل)، هنفتح ${sweepList.length}`);

const browser = await chromium.launch({
  channel: process.env.BROWSER_CHANNEL || undefined,
  args: ["--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});

// 2) الجولة على كل الصفحات
let pages = [];
if (want("pages")) {
  let n = 0;
  pages = await sweep(browser, sweepList, { OUT, BASE, workers: 4, onDone: (r) => { n++; if (r.problems.length || n % 50 === 0) log(`${n}/${sweepList.length} ${r.problems.length ? "✗" : "✓"} ${r.path} ${r.problems.map((p) => p.text).join(" | ").slice(0, 140)}`); } });
}
const nameOf = new Map(pages.map((p) => [p.path, p.name]));

// 3) التجارب الفعلية
async function runRecipe(r, kind) {
  const ctx = await browser.newContext({ ...MOBILE, acceptDownloads: true, permissions: ["microphone", "clipboard-read", "clipboard-write"] });
  await ctx.addInitScript(() => { try { sessionStorage.setItem("rs:intro", "1"); } catch {} });
  const { page, log: plog } = await newPage(ctx);
  const res = { group: kind, path: r.path, name: r.name || nameOf.get(r.path) || r.id, problems: [], tech: [], ms: 0, note: "" };
  const t0 = Date.now();
  try {
    if (!r.api) {
      await page.goto(BASE + r.path, { waitUntil: "domcontentloaded", timeout: 45000 });
      await page.waitForLoadState("load", { timeout: 30000 }).catch(() => {});
      await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
      await sleep(1200);
    }
    if (kind === "ai") {
      const out = await runAiTool({ page }, r.id);
      for (const [level, text] of out.probs) res.problems.push({ level, text });
      res.note = out.note;
      if (out.probs.length) res.tech.push(`sample: ${out.sample}`);
    } else {
      await r.run({ page, ctx, BASE, OUT });
    }
  } catch (e) {
    if (e instanceof Verdict) { res.problems.push({ level: e.level, text: e.message }); if (e.tech) res.tech.push(e.tech); }
    else { res.problems.push({ level: "broken", text: "الروبوت وقع وهو بيجرّب الأداة" }); res.tech.push(String(e?.stack || e).slice(0, 500)); }
  }
  res.ms = Date.now() - t0;
  const errs = plog.pageErrors.filter((m) => !/ResizeObserver loop/.test(m));
  if (errs.length) { res.problems.push({ level: "warn", text: `خطأ في كود الصفحة أثناء الاستخدام: ${errs[0].slice(0, 120)}` }); res.tech.push(errs.slice(0, 3).join(" | ")); }
  const api5 = plog.bad.filter((b) => b.url.startsWith(BASE + "/api/") && b.status >= 500);
  if (api5.length) res.tech.push(`api: ${api5.slice(0, 4).map((b) => `${b.status} ${b.method} ${b.url}`).join(" | ")}`);
  if (res.problems.length && !r.api) res.shot = await shot(page, OUT, `${kind}${r.path}`);
  await ctx.close();
  log(`${res.problems.some((p) => p.level === "broken") ? "✗" : res.problems.length ? "!" : "✓"} [${kind}] ${r.path} ${(res.ms / 1000).toFixed(0)}s ${res.problems.map((p) => p.text).join(" | ").slice(0, 160)}`);
  return res;
}

async function runAll(jobs, workers) {
  const out = [];
  const queue = [...jobs];
  await Promise.all(Array.from({ length: Math.min(workers, queue.length) }, async () => { while (queue.length) { const [r, k] = queue.shift(); out.push(await runRecipe(r, k)); } }));
  return out;
}

const exists = new Set(paths);
const jobs = [];
if (want("tools")) for (const r of TOOL_RECIPES) if (exists.has(r.path) && matches(r.path)) jobs.push([r, "tools"]);
if (want("features")) for (const r of FEATURE_RECIPES) if ((r.api || exists.has(r.path)) && matches(r.path)) jobs.push([r, "features"]);
const special = new Set(FEATURE_RECIPES.map((r) => r.path));
const aiAll = pages.filter((p) => p.kind === "ai" && !special.has(p.path)).map((p) => p.path).sort();
const aiPick = want("ai") ? rotate(aiAll, AI_PER_DAY) : [];
for (const p of aiPick) jobs.push([{ id: p.split("/").pop(), path: p }, "ai"]);
// التقيل الأول عشان ما يأخرش آخر الجولة
jobs.sort((a, b) => (b[0].slow ? 1 : 0) - (a[0].slow ? 1 : 0));
log(`تجارب: ${jobs.length} (${aiPick.length} أداة كتابة من ${aiAll.length})`);
const runs = await runAll(jobs, 3);
await browser.close();

// 4) السيرفرات والروابط الخارجية
let spaces = [], links = [];
if (want("outside")) {
  spaces = await checkSpaces(await findSpaces(ROOT));
  log(`سيرفرات: ${spaces.filter((s) => !s.up).length} واقع من ${spaces.length}`);
  const linkPages = new Map();
  for (const p of pages) for (const l of p.links || []) { if (!linkPages.has(l)) linkPages.set(l, new Set()); linkPages.get(l).add(p.path); }
  links = await checkLinks(linkPages);
  log(`روابط: ${links.filter((l) => l.level === "broken").length} مكسور من ${links.length}`);
  // رابط مكسور بيتحسب مشكلة على الصفحة اللي فيها
  for (const l of links.filter((x) => x.level === "broken")) for (const p of l.pages) {
    const pg = pages.find((x) => x.path === p);
    if (pg) { pg.problems.push({ level: "warn", text: `رابط لموقع تاني مش شغال: ${new URL(l.url).hostname}` }); pg.tech.push(`dead link ${l.url} ${l.status} ${l.error}`); }
  }
}

// 5) التقرير
const items = mergeItems([...pages, ...runs]);
const meta = {
  base: BASE, repo: REPO, started, durationMs: Date.now() - started,
  pagesChecked: pages.length, dirChecked: dirPick.filter((u) => matches(new URL(u).pathname)).length, dirTotal: dir.length,
  toolsRun: runs.filter((r) => r.group === "tools").length, featuresRun: runs.filter((r) => r.group === "features").length,
  aiRun: runs.filter((r) => r.group === "ai").length, aiTotal: aiAll.length, aiTested: aiPick,
  pageOnly: [...PAGE_ONLY].filter((id) => exists.has(`/tool/${id}`)),
};
const report = buildReport({ items, spaces, links, meta, prev });
await fs.writeFile(path.join(OUT, "report.md"), report);
await fs.writeFile(path.join(OUT, "results.json"), JSON.stringify({ meta, items, runs, spaces, links: links.filter((l) => l.level) }, null, 1));
const summary = summaryOf({ items, spaces, meta });
await fs.writeFile(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 1));
await fs.writeFile(path.join(OUT, "title.txt"), `🤖 تقرير الروبوت: ${summary.broken.length ? `❌ ${summary.broken.length} بايظ` : "✅ مفيش بايظ"} · ⚠️ ${summary.warn} · ${new Date(started + 2 * 3600e3).toISOString().slice(0, 10)}`);
log(`خلص: ${summary.ok} شغال، ${summary.broken.length} بايظ، ${summary.warn} محتاج نظرة`);
