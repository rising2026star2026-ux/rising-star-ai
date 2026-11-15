// لوحة التحكم حسب العميل. تشغيل: node scripts/test/dashplan.test.mjs
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { nextSteps, STEP_IDS, stepHref } from "../../lib/dashplan.js";
import { tools } from "../../lib/tools.js";
const root = path.resolve(import.meta.dirname, "../..");
for (const id of STEP_IDS) {
  const h = stepHref(id);
  if (h.startsWith("/tool/")) assert.ok(tools.some((t) => `/tool/${t.id}` === h), `أداة مش ظاهرة ${h}`);
  else if (h === "/s/seller") assert.ok(fs.existsSync(path.join(root, "app/s/[id]/page.js")));
  else assert.ok(fs.existsSync(path.join(root, "app", h, "page.js")), `صفحة مش موجودة ${h}`);
}
assert.equal(nextSteps({})[0].id, "profile");
const fresh = nextSteps({ status: "new" }).map((s) => s.id);
assert.deepEqual(fresh, ["profile", "compare", "feasibility", "market"]);
assert.equal(nextSteps({ brand: { name: "x", kind: "food", status: "new" }, hasStudy: true, comparisons: 2 })[0].id, "feasibilityGo");
const shop = nextSteps({ brand: { name: "x", kind: "distributor", status: "existing" } }).map((s) => s.id);
assert.deepEqual(shop, ["proposal", "whatsapp", "profit", "catalog"]);
assert.notDeepEqual(shop, nextSteps({ brand: { name: "x", kind: "creator" } }).map((s) => s.id), "الأنواع بتفرق");
for (const k of ["retail", "local", "distributor", "ecommerce", "maker", "food", "services", "home", "creator", "other"]) assert.equal(nextSteps({ brand: { name: "x", kind: k } }).length, 4);
console.log("dashplan: تمام");
