import assert from "node:assert/strict";
import { parseMoney, profileCompleteness, feasibilityPrefill } from "../../lib/bizprofile.js";

assert.equal(parseMoney("٢٠٠ ألف جنيه"), 200000);
assert.equal(parseMoney("1.5 مليون"), 1500000);
assert.equal(parseMoney("50000"), 50000);
assert.equal(parseMoney("مش عارف"), null);
assert.equal(parseMoney("٥"), null);
assert.equal(profileCompleteness(null).percent, 0);
const b = { name: "نور", field: "حلويات", city: "سوهاج", products: "تورتات", channels: ["واتساب"], audience: "ستات", budget: "٢٠٠ ألف", goals: "٣٠٠ طلب" };
assert.equal(profileCompleteness(b).percent, 100);
assert.equal(profileCompleteness({ name: "نور" }).missing.length, 7);
const p = feasibilityPrefill(b);
assert.equal(p.governorate, "سوهاج"); assert.equal(p.capital, "200000"); assert.equal(p.activity, "حلويات");
assert.equal(feasibilityPrefill({}), null);
assert.equal(feasibilityPrefill({ name: "x", city: "مدينة غريبة" }).city, "مدينة غريبة");
console.log("bizprofile: تمام");
