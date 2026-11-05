// استعلام سريع في خريطة الكود (لازم تكون اتعملت بـ build.mjs الأول).
//   node scripts/codemap/query.mjs lib/groq.js        ← مين بيتأثر لو عدّلت الملف ده، وهو بيعتمد على إيه
//   node scripts/codemap/query.mjs env GEMINI_API_KEY ← الملفات اللي بتستخدم المفتاح
//   node scripts/codemap/query.mjs path app/chat/page.js lib/groq.js ← أقصر طريق استيراد بين ملفين
//   node scripts/codemap/query.mjs find podcast       ← دوّر في أسماء الملفات ووصفها
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const G = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "..", "docs", "codemap", "graph.json"), "utf8"));
const out = {}, inn = {};
for (const e of G.edges) { (out[e.from] ||= []).push(e.to); (inn[e.to] ||= []).push(e.from); }
const byId = Object.fromEntries(G.nodes.map((n) => [n.id, n]));
const label = (id) => `${id}${byId[id]?.url ? `  (${byId[id].url})` : ""}`;

function reach(start, map) {
  const seen = new Map();
  const q = [[start, 0]];
  while (q.length) {
    const [x, d] = q.shift();
    for (const y of map[x] || []) if (!seen.has(y) && y !== start) { seen.set(y, d + 1); q.push([y, d + 1]); }
  }
  return seen;
}

const [cmd, a, b] = process.argv.slice(2);
if (!cmd) {
  console.log("استخدام: query.mjs <ملف> | env <مفتاح> | path <من> <إلى> | find <كلمة>");
} else if (cmd === "env") {
  for (const n of G.nodes.filter((n) => n.env?.includes(a))) console.log(label(n.id));
} else if (cmd === "find") {
  const q = String(a || "").toLowerCase();
  for (const n of G.nodes.filter((n) => n.id.toLowerCase().includes(q) || (n.about || "").toLowerCase().includes(q) || (n.url || "").includes(q))) console.log(`${label(n.id)}\n   ${n.about || ""}`);
} else if (cmd === "path") {
  const prev = { [a]: null };
  const q = [a];
  while (q.length && !(b in prev)) { const x = q.shift(); for (const y of out[x] || []) if (!(y in prev)) { prev[y] = x; q.push(y); } }
  if (!(b in prev)) console.log("مفيش طريق استيراد بينهم.");
  else { const p = []; for (let x = b; x; x = prev[x]) p.unshift(x); console.log(p.join("\n  → ")); }
} else {
  const id = cmd;
  const n = byId[id];
  if (!n) { console.log("الملف مش في الخريطة. جرّب: query.mjs find <كلمة>"); process.exit(1); }
  console.log(`${label(id)}  [${n.kind}, ${n.lines} سطر]`);
  if (n.about) console.log(n.about);
  if (n.env) console.log("مفاتيح:", n.env.join(", "));
  console.log(`\nبيعتمد على (${(out[id] || []).length}):`);
  for (const x of out[id] || []) console.log("  " + x);
  const up = reach(id, inn);
  const pages = [...up.keys()].filter((x) => byId[x]?.kind === "page" || byId[x]?.kind === "api");
  console.log(`\nبيتأثر لو عدّلته: ${up.size} ملف، منهم ${pages.length} صفحة/مسار API`);
  for (const [x, d] of [...up.entries()].sort((p, q) => p[1] - q[1])) console.log(`  ${"·".repeat(d)} ${label(x)}`);
}
