// كل أداة ظاهرة لها مجموعة واحدة بالظبط، ومفيش معرّف في مجموعة مالوش أداة. تشغيل: node scripts/test/bizgroups.test.mjs
import assert from "node:assert/strict";
import { BIZ_GROUPS } from "../../lib/bizgroups.js";
import { tools } from "../../lib/tools.js";
const seen = new Map();
for (const g of BIZ_GROUPS) for (const id of g.tools) { assert.ok(!seen.has(id), `الأداة ${id} في مجموعتين`); seen.set(id, g.id); }
const ids = new Set(tools.map((t) => t.id));
for (const id of ids) assert.ok(seen.has(id), `الأداة ${id} من غير مجموعة`);
for (const id of seen.keys()) assert.ok(ids.has(id), `المجموعة بتشاور على أداة مش ظاهرة: ${id}`);
console.log(`bizgroups: ${ids.size} أداة في ${BIZ_GROUPS.length} مجموعات، كلها مغطاة`);
