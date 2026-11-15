import assert from "node:assert/strict";
import { compareCandidates, prefillFromBiz, applyBizNumbers, numbersDiff, bizNumbers } from "../../lib/feasilink.js";
import { runModel } from "../../lib/feasibility.js";

const saved = [{ id: "c1", name: "كافيه ولا محل", list: [
  { id: "b1", name: "كافيه صغير", capital: "300000", setup: "200000", fixed: "30000", price: "60", unitCost: "20", units: "3000", tax: "1" },
  { id: "b2", name: "", price: "10", units: "5" },
  { id: "b3", name: "محل ملابس", price: "٤٠٠", units: "٢٠٠" },
] }];
const c = compareCandidates(saved);
assert.equal(c.length, 2);
assert.equal(c[1].biz.price, 400, "الأرقام العربية بتتحول");
assert.equal(compareCandidates(null).length, 0);
const p = prefillFromBiz(c[0].biz, c[0].from);
assert.equal(p.activity, "كافيه صغير"); assert.equal(p.capital, "300000");

const a = { capex: [{ name: "ديكور", low: 80000, mid: 100000, high: 120000 }, { name: "مكن", low: 40000, mid: 50000, high: 70000 }], fixed: [{ name: "إيجار", low: 15000, mid: 20000, high: 25000 }],
  price: { low: 40, mid: 50, high: 60 }, unitCost: { low: 15, mid: 18, high: 22 }, units: { low: 2000, mid: 2500, high: 3000 }, taxPct: 0, inflation: 15, discountRate: 25, workingCapitalMonths: 3, rampStart: 0.4, rampMonths: 6 };
const b = applyBizNumbers(a, c[0].biz);
assert.equal(b.price.mid, 60); assert.equal(b.price.low, 48); assert.equal(b.price.high, 72);
assert.equal(b.units.mid, 3000); assert.equal(b.price.est, false);
assert.equal(b.capex.reduce((t, i) => t + i.mid, 0), 200000, "مجموع التجهيز = رقم العميل");
assert.equal(b.fixed.reduce((t, i) => t + i.mid, 0), 30000);
assert.equal(b.taxPct, 1);
assert.equal(a.price.mid, 50, "الافتراضات الأصلية ما اتغيّرتش");
assert.ok(Number.isFinite(runModel(b, "mid").npv));
// أرقام ناقصة ما بتمسحش الافتراضات
const partial = applyBizNumbers(a, bizNumbers({ name: "x", price: "70" }));
assert.equal(partial.units.mid, 2500); assert.equal(partial.capex.length, 2);
// بنود فاضية: بند واحد بالرقم
assert.equal(applyBizNumbers({ ...a, capex: [] }, c[0].biz).capex[0].mid, 200000);
const d = numbersDiff(a, c[0].biz);
assert.equal(d.find((r) => r.key === "price").gap, 0.2);
console.log("feasilink: تمام");
