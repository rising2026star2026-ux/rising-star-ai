// فحص SEO: كل صفحة لازم يكون ليها عنوان ووصف، من غير تكرار، ومن غير الاسم القديم أو الوصف العام.
// تشغيل: node scripts/seoaudit.mjs
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "..");
const app = path.join(root, "app");
const walk = (d, out = []) => { for (const f of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, f.name); if (f.isDirectory()) { if (f.name !== "api") walk(p, out); } else if (f.name === "page.js") out.push(p); } return out; };
const OLD = /Rising\s*Star|StarAi|كل الذكاء الاصطناعي|أداة ذكاء اصطناعي بالعربي|تسويق محلات/i;
const problems = [];
const titles = new Map();
for (const f of walk(app)) {
  const rel = "/" + path.relative(app, path.dirname(f)).replaceAll(path.sep, "/");
  const src = fs.readFileSync(f, "utf8");
  const dyn = /generateMetadata/.test(src);
  const meta = /export const metadata/.test(src);
  const redirectOnly = /redirect\(/.test(src) && !meta && !dyn;
  if (redirectOnly) continue;
  if (!meta && !dyn) { problems.push(`${rel}: مفيش metadata`); continue; }
  if (!dyn && !/description/.test(src)) problems.push(`${rel}: مفيش وصف`);
  if (OLD.test(src)) problems.push(`${rel}: فيه الاسم القديم أو وصف عام`);
  const t = src.match(/title:\s*(?:\{\s*absolute:\s*)?([`"][^`"]+[`"])/)?.[1];
  if (t) titles.set(t, [...(titles.get(t) || []), rel]);
}
for (const [t, ps] of titles) if (ps.length > 1) problems.push(`عنوان مكرر ${t}: ${ps.join(", ")}`);
for (const f of ["app/layout.js", "app/manifest.js", "app/sitemap.js", "app/robots.js", "lib/site.js", "lib/sharecard.js", "components/Intro.js", "components/Chrome.js"]) {
  const src = fs.readFileSync(path.join(root, f), "utf8");
  if (OLD.test(src)) problems.push(`${f}: فيه الاسم القديم أو وصف عام`);
}
problems.forEach((p) => console.log("- " + p));
console.log(problems.length ? `SEO: ${problems.length} ملاحظة` : `SEO: تمام (${titles.size} عنوان)`);
process.exitCode = problems.length ? 1 : 0;
