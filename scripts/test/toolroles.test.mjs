import assert from "node:assert/strict";
import { TOOL_ROLES, SUPPORT_TOOLS, isCore } from "../../lib/toolroles.js";
import { BIZ_GROUPS } from "../../lib/bizgroups.js";
import { tools } from "../../lib/tools.js";
for (const t of tools) assert.ok(TOOL_ROLES[t.id], `الأداة ${t.id} من غير وظيفة تجارية`);
for (const id of Object.keys(TOOL_ROLES)) assert.ok(tools.some((t) => t.id === id), `سطر لأداة مش ظاهرة: ${id}`);
for (const id of SUPPORT_TOOLS) assert.ok(tools.some((t) => t.id === id), `أداة مساعدة مش موجودة: ${id}`);
const core = tools.filter((t) => isCore(t.id));
assert.ok(core.length >= 20, "الأدوات الأساسية قليلة");
// كل مجموعة فيها أدوات لازم يكون فيها أداة أساسية واحدة على الأقل عشان تظهر في الرئيسية
for (const g of BIZ_GROUPS) if (g.tools.length) assert.ok(g.tools.some(isCore), `المجموعة ${g.id} كلها أدوات مساعدة`);
console.log(`أساسية ${core.length} ومساعدة ${SUPPORT_TOOLS.size}. `);
console.log(`toolroles: ${tools.length} أداة، كلها ليها وظيفة تجارية`);
