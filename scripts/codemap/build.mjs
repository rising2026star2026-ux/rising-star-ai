// خريطة الكود: بتقرا كل ملفات app وcomponents وlib، وبتطلّع مين بيستورد مين، ومفاتيح البيئة،
// والمواقع الخارجية اللي كل ملف بيكلمها، وصفحات ومسارات API الموقع.
// نفس فكرة Graphify (خريطة معرفة للمشروع يستخدمها مساعد البرمجة) بس من غير أي مكتبات، بـ Node بس.
//
// التشغيل:  node scripts/codemap/build.mjs
// الناتج في docs/codemap/:  graph.json (الخريطة)، CODEMAP.md (تقرير)، graph.html (خريطة تفاعلية)
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync, existsSync } from "node:fs";
import { join, dirname, relative, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const OUT = join(ROOT, "docs", "codemap");
const DIRS = ["app", "components", "lib"];
const EXT = [".js", ".jsx", ".mjs", ".ts", ".tsx"];

function walk(dir, list = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, list);
    else if (EXT.some((e) => name.endsWith(e)) || name.endsWith(".css")) list.push(p);
  }
  return list;
}

const rel = (p) => relative(ROOT, p).split("\\").join("/");

function resolve(from, spec) {
  let base;
  if (spec.startsWith("@/")) base = join(ROOT, spec.slice(2));
  else if (spec.startsWith(".")) base = join(dirname(join(ROOT, from)), spec);
  else return null; // مكتبة خارجية
  const tries = [base, ...EXT.map((e) => base + e), ...EXT.map((e) => join(base, "index" + e))];
  for (const t of tries) if (existsSync(t) && statSync(t).isFile()) return rel(t);
  return null;
}

function kindOf(id) {
  if (/^app\/api\/.+\/route\.js$/.test(id)) return "api";
  if (/^app\/(.+\/)?page\.js$/.test(id)) return "page";
  if (/^app\/(.+\/)?(layout|sitemap|robots|not-found|error|manifest|opengraph-image)\.js$/.test(id)) return "app";
  if (id.endsWith(".css")) return "style";
  if (id.startsWith("components/")) return "component";
  if (id.startsWith("lib/")) return "lib";
  return "other";
}

function urlOf(id, kind) {
  if (kind === "api") return "/" + id.replace(/^app\//, "").replace(/\/route\.js$/, "");
  if (kind === "page") return "/" + id.replace(/^app\/?/, "").replace(/\/?page\.js$/, "").replace(/\([^)]+\)\/?/g, "");
  return undefined;
}

// أول تعليق في الملف = وصفه (معظم ملفات المشروع بتبدأ بسطر عربي بيشرح هي إيه)
function headComment(src) {
  const lines = src.split("\n").slice(0, 8);
  const out = [];
  for (const l of lines) {
    const t = l.trim();
    if (t === '"use client";' || t === "'use client';" || !t) { if (out.length) break; continue; }
    if (t.startsWith("//")) out.push(t.replace(/^\/\/\s?/, ""));
    else if (t.startsWith("/*") || t.startsWith("*")) out.push(t.replace(/^\/?\*+\/?\s?/, ""));
    else break;
  }
  return out.join(" ").replace(/\s+/g, " ").trim().slice(0, 220);
}

const files = DIRS.flatMap((d) => (existsSync(join(ROOT, d)) ? walk(join(ROOT, d)) : [])).map(rel).sort();
const nodes = [];
const edges = [];
const packages = {};

for (const id of files) {
  const src = readFileSync(join(ROOT, id), "utf8");
  const kind = kindOf(id);
  const node = { id, kind, lines: src.split("\n").length };
  const url = urlOf(id, kind);
  if (url) node.url = url === "/" ? "/" : url.replace(/\/$/, "");
  const about = headComment(src);
  if (about) node.about = about;

  if (!id.endsWith(".css")) {
    const specs = new Set();
    for (const m of src.matchAll(/(?:import|export)\s[^"'`;]*?from\s*["']([^"']+)["']/g)) specs.add(m[1]);
    for (const m of src.matchAll(/import\s*["']([^"']+)["']/g)) specs.add(m[1]);
    for (const m of src.matchAll(/import\(\s*["']([^"']+)["']\s*\)/g)) specs.add(m[1]);
    for (const spec of specs) {
      const to = resolve(id, spec);
      if (to) edges.push({ from: id, to });
      else if (!spec.startsWith(".") && !spec.startsWith("@/")) {
        const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
        if (!pkg.startsWith("node:")) (packages[pkg] ||= new Set()).add(id);
      }
    }
    const env = [...new Set([...src.matchAll(/process\.env\.([A-Z][A-Z0-9_]+)/g)].map((m) => m[1]))].sort();
    if (env.length) node.env = env;
    const hosts = [...new Set([...src.matchAll(/https:\/\/([a-z0-9.-]+\.[a-z]{2,})/gi)].map((m) => m[1].toLowerCase()))]
      .filter((h) => !/^(www\.)?(w3\.org|rising-star-ai\.vercel\.app|example\.com|ex\.com)$/.test(h)).sort();
    if (hosts.length) node.hosts = hosts.slice(0, 30);
    const exp = [...new Set([...src.matchAll(/export\s+(?:async\s+)?(?:function|const|class|let)\s+([A-Za-z0-9_]+)/g)].map((m) => m[1]))];
    if (exp.length) node.exports = exp.slice(0, 40);
  }
  nodes.push(node);
}

// الأدوات المسجلة في lib/tools.js والمكوّن اللي بيشغّل كل أداة من أدوات الاستوديو
const tools = [];
try {
  const t = readFileSync(join(ROOT, "lib/tools.js"), "utf8");
  for (const m of t.matchAll(/\bL\(\s*"([^"]+)",\s*"([^"]+)",\s*"[^"]*",\s*"([^"]+)"\s*\)/g)) tools.push({ id: m[1], name: m[2], local: m[3] });
  const lt = readFileSync(join(ROOT, "components/studio/LocalTool.js"), "utf8");
  const comp = Object.fromEntries([...lt.matchAll(/const (\w+) = dynamic\(\(\) => import\("([^"]+)"\)/g)].map((m) => [m[1], m[2]]));
  const kinds = Object.fromEntries([...lt.matchAll(/^\s*"?([\w-]+)"?:\s*\[(\w+)/gm)].map((m) => [m[1], m[2]]));
  for (const x of tools) {
    const c = kinds[x.local];
    const spec = c && comp[c];
    if (spec) x.component = resolve("components/studio/LocalTool.js", spec) || spec;
  }
} catch { /* الملفات دي ممكن تتغير: الخريطة تكمّل من غيرها */ }

const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
const importsOf = {};
const usedBy = {};
for (const e of edges) {
  (importsOf[e.from] ||= []).push(e.to);
  (usedBy[e.to] ||= []).push(e.from);
}
for (const n of nodes) {
  n.imports = (importsOf[n.id] || []).length;
  n.usedBy = (usedBy[n.id] || []).length;
}

function reach(start, map) {
  const seen = new Set();
  const q = [start];
  while (q.length) for (const x of map[q.shift()] || []) if (!seen.has(x)) { seen.add(x); q.push(x); }
  return seen;
}

const graph = {
  generated: new Date().toISOString(),
  counts: { files: nodes.length, edges: edges.length, pages: nodes.filter((n) => n.kind === "page").length, api: nodes.filter((n) => n.kind === "api").length },
  nodes,
  edges,
  packages: Object.fromEntries(Object.entries(packages).map(([k, v]) => [k, [...v].sort()])),
  tools,
};

// ===== التقرير =====
const md = [];
const L = (s = "") => md.push(s);
L("# خريطة كود Rising StarAi");
L();
L(`اتعملت أوتوماتيك بـ \`node scripts/codemap/build.mjs\`. ${graph.counts.files} ملف، ${graph.counts.edges} علاقة استيراد، ${graph.counts.pages} صفحة، ${graph.counts.api} مسار API.`);
L("الخريطة التفاعلية: افتح `docs/codemap/graph.html` في المتصفح. ولمعرفة أثر تعديل أي ملف: `node scripts/codemap/query.mjs lib/groq.js`.");
L();
L("## أكتر الملفات اللي المشروع معتمد عليها");
L("لو عدّلت ملف من دول، راجع الملفات اللي بتستخدمه (العمود الأخير = كل اللي بيتأثر بشكل مباشر أو غير مباشر).");
L();
L("| الملف | بيستخدمه مباشرةً | بيتأثر بيه إجمالاً | وصفه |");
L("|---|---|---|---|");
for (const n of [...nodes].filter((n) => n.kind !== "style").sort((a, b) => b.usedBy - a.usedBy).slice(0, 25)) {
  L(`| \`${n.id}\` | ${n.usedBy} | ${reach(n.id, usedBy).size} | ${(n.about || "").replace(/\|/g, "/").slice(0, 110)} |`);
}
L();
L("## مسارات API");
L("| المسار | المفاتيح | خدمات خارجية | مكتبات المشروع |");
L("|---|---|---|---|");
for (const n of nodes.filter((n) => n.kind === "api").sort((a, b) => a.url.localeCompare(b.url))) {
  const libs = (importsOf[n.id] || []).map((x) => x.replace(/^lib\//, "").replace(/\.js$/, "")).join("، ");
  // المفاتيح والخدمات من الملف نفسه ومن كل المكتبات اللي بيستخدمها
  const all = [n.id, ...reach(n.id, importsOf)].map((x) => byId[x]).filter(Boolean);
  const keys = [...new Set(all.flatMap((x) => x.env || []))].filter((e) => /KEY|TOKEN|SECRET/.test(e)).sort();
  const hosts = [...new Set(all.flatMap((x) => x.hosts || []))].filter((h) => /api|generativelanguage|googleapis|serper|tavily|openalex|openrouter|groq|imf|itunes/.test(h)).sort();
  L(`| \`${n.url}\` | ${keys.join("، ")} | ${hosts.slice(0, 5).join("، ")} | ${libs} |`);
}
L();
L("## مفاتيح البيئة ومين بيستخدمها");
L("أسماء المفاتيح بس، من غير أي قيم.");
L();
const envMap = {};
for (const n of nodes) for (const e of n.env || []) (envMap[e] ||= []).push(n.id);
L("| المفتاح | عدد الملفات | أمثلة |");
L("|---|---|---|");
for (const [k, v] of Object.entries(envMap).sort((a, b) => b[1].length - a[1].length)) L(`| \`${k}\` | ${v.length} | ${v.slice(0, 3).map((x) => `\`${x}\``).join("، ")} |`);
L();
L("## الصفحات");
for (const n of nodes.filter((n) => n.kind === "page").sort((a, b) => a.url.localeCompare(b.url))) {
  const comps = (importsOf[n.id] || []).filter((x) => x.startsWith("components/")).map((x) => x.replace(/^components\//, ""));
  L(`- \`${n.url}\` ← ${comps.join("، ") || "—"}`);
}
L();
if (tools.length) {
  L("## أدوات الاستوديو ومكوّناتها");
  for (const t of tools) L(`- \`${t.id}\` (${t.name}) ← \`${t.component || t.local}\``);
  L();
}
L("## مكتبات خارجية");
for (const [k, v] of Object.entries(graph.packages).sort((a, b) => b[1].length - a[1].length)) L(`- \`${k}\`: ${v.length} ملف`);
L();
const orphans = nodes.filter((n) => n.usedBy === 0 && (n.kind === "component" || n.kind === "lib"));
L("## ملفات محدش بيستوردها");
L("مش لازم تكون زيادة (ممكن تكون سكربتات أو بتتحمّل بطريقة تانية)، لكن تستاهل مراجعة قبل الحذف.");
for (const n of orphans) L(`- \`${n.id}\``);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "graph.json"), JSON.stringify(graph, null, 1));
writeFileSync(join(OUT, "CODEMAP.md"), md.join("\n") + "\n");
const tpl = readFileSync(join(dirname(fileURLToPath(import.meta.url)), "view.html"), "utf8");
const slim = { nodes: nodes.map(({ id, kind, url, about, env, usedBy, imports }) => ({ id, kind, url, about, env, usedBy, imports })), edges };
writeFileSync(join(OUT, "graph.html"), tpl.replace("/*DATA*/null", JSON.stringify(slim).replace(/</g, "\\u003c")));
console.log(`codemap: ${nodes.length} files, ${edges.length} edges → ${posix.join("docs", "codemap")}`);
