import assert from "node:assert/strict";
import { TOOL_ROLES } from "../../lib/toolroles.js";
import { tools } from "../../lib/tools.js";
for (const t of tools) assert.ok(TOOL_ROLES[t.id], `الأداة ${t.id} من غير وظيفة تجارية`);
for (const id of Object.keys(TOOL_ROLES)) assert.ok(tools.some((t) => t.id === id), `سطر لأداة مش ظاهرة: ${id}`);
console.log(`toolroles: ${tools.length} أداة، كلها ليها وظيفة تجارية`);
