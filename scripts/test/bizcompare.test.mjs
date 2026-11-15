// اختبار معادلات مقارنة الأنشطة. تشغيل: node scripts/test/bizcompare.test.mjs
import assert from "node:assert/strict";
import { computeBiz, compareAll, bestIndex, emptyBiz } from "../../lib/bizcompare.js";

const A = { ...emptyBiz(1), name: "محل", setup: "100000", fixed: "10000", price: "200", unitCost: "120", units: "300", tax: "0" };
const a = computeBiz(A);
assert.equal(a.invest, 130000);               // 100000 + 3 × 10000
assert.equal(a.revenue, 60000);               // 200 × 300
assert.equal(a.net, 60000 - 36000 - 10000);   // 14000
assert.equal(a.grossMarginPct, 0.4);          // (200 − 120) ÷ 200
assert.equal(a.breakEvenUnits, 125);          // 10000 ÷ 80
assert.ok(Math.abs(a.paybackMonths - 130000 / 14000) < 1e-9);

// ضريبة 10٪: ربح الوحدة بيقل، والصافي بيقل
const t = computeBiz({ ...A, tax: "10" });
assert.equal(t.net, 60000 - 36000 - 10000 - 6000);
assert.equal(t.breakEvenUnits, 10000 / (200 * 0.9 - 120));

// خسارة: مفيش فترة استرداد
const loss = computeBiz({ ...A, units: "50" });
assert.equal(loss.paybackMonths, null);
assert.ok(loss.net < 0);

// مدخلات ناقصة: أرقام فاضية مش مخترعة
const empty = computeBiz(emptyBiz(2));
assert.equal(empty.ready, false);
assert.equal(empty.net, null);
assert.equal(empty.breakEvenUnits, null);

// سعر أقل من التكلفة: مفيش تعادل
assert.equal(computeBiz({ ...A, price: "100" }).breakEvenUnits, null);

// فجوة التمويل
assert.equal(computeBiz({ ...A, capital: "100000" }).fundingGap, 30000);
assert.equal(computeBiz({ ...A, capital: "200000" }).fundingGap, 0);
assert.equal(computeBiz(A).fundingGap, null);

// أفضل نشاط
const B = { ...A, id: "x2", name: "كافيه", units: "500" };
const r = compareAll([A, B]);
assert.equal(r.best.net, 1);
assert.equal(r.best.invest, -1);              // متساويين: مفيش أفضل
assert.equal(bestIndex([{ v: 3 }, { v: 1 }], "v", false), 1);
assert.equal(bestIndex([{ v: null }, { v: null }], "v", true), -1);
// تقييم برّه المدى بيتقصّ
assert.equal(computeBiz({ ...A, demand: 9 }).demand, 5);
console.log("bizcompare: كل الاختبارات نجحت");
