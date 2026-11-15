// يفحص كل الروابط الداخلية المكتوبة في الكود مقابل صفحات app/ والتحويلات في next.config.mjs. تشغيل: node scripts/linkaudit.mjs
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const walk = (d, out = []) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { if (["node_modules", ".next", ".git", ".claude"].includes(f.name)) continue; const p = path.join(d, f.name); f.isDirectory() ? walk(p, out) : out.push(p); } return out; };
const files = walk(root);
const pages = files.filter((f) => /app\/.*page\.js$/.test(f)).map((f) => "/" + path.relative(path.join(root, "app"), path.dirname(f)).split(path.sep).filter((x) => !/^\(.*\)$/.test(x)).join("/")).map((p) => (p === "/." || p === "/" ? "/" : p));
const patterns = pages.map((p) => new RegExp("^" + p.replace(/\[\.\.\.[^\]]+\]/g, ".+").replace(/\[[^\]]+\]/g, "[^/]+") + "$"));
const cfg = fs.readFileSync(path.join(root, "next.config.mjs"), "utf8");
const redirected = [...cfg.matchAll(/"\/([a-z0-9/-]+)"/g)].map((m) => "/" + m[1]);
const bad = new Map();
for (const f of files.filter((f) => /\.(js|jsx|mjs)$/.test(f) && /\/(app|components|lib)\//.test(f) && !/\/api\//.test(f))) {
  const src = fs.readFileSync(f, "utf8");
  for (const m of src.matchAll(/(?:href|push|replace)[=(]\s*[{]?\s*["'`](\/[a-zA-Z0-9\-_/]*)(?:[?#"'`])/g)) {
    const p = m[1].replace(/\/$/, "") || "/";
    if (p === "/" || patterns.some((r) => r.test(p))) continue;
    if (redirected.some((r) => p === r || p.startsWith(r + "/"))) { bad.set(`${p} (تحويل)`, [...(bad.get(`${p} (تحويل)`) || []), path.relative(root, f)]); continue; }
    bad.set(p, [...(bad.get(p) || []), path.relative(root, f)]);
  }
}
for (const [p, fs_] of bad) console.log(`${p}  ←  ${[...new Set(fs_)].join(", ")}`);
console.log(bad.size ? `روابط محتاجة مراجعة: ${bad.size}` : `الروابط تمام (${pages.length} صفحة)`);
