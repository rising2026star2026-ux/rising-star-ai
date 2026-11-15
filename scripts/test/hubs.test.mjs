// كل عنصر في صفحات الأنظمة بيشاور على أداة ظاهرة أو صفحة موجودة. تشغيل: node scripts/test/hubs.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { HUBS } from "../../lib/hubs.js";
import { tools } from "../../lib/tools.js";
const root = path.resolve(import.meta.dirname, "../..");
const visible = new Set(tools.map((t) => t.id));
let n = 0;
for (const [id, h] of Object.entries(HUBS)) {
  assert.ok(fs.existsSync(path.join(root, "app", id, "page.js")), `صفحة /${id} ناقصة`);
  for (const sec of h.sections) for (const it of sec.items) {
    n++;
    if (it.tool) { assert.ok(visible.has(it.tool), `${id}: أداة مش ظاهرة ${it.tool}`); continue; }
    const p = path.join(root, "app", it.href.split("?")[0], "page.js");
    assert.ok(fs.existsSync(p), `${id}: صفحة مش موجودة ${it.href}`);
    assert.ok(it.label && it.desc, `${id}: ${it.href} من غير اسم أو وصف`);
  }
}
console.log(`hubs: ${Object.keys(HUBS).length} صفحات و${n} رابط، كلها شغالة`);
