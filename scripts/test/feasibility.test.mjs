// اختبار محرك دراسة الجدوى. تشغيل: node scripts/test/feasibility.test.mjs
import assert from "node:assert/strict";
import { runModel, runAll, sensitivity, cashFlowRows, yearlyCashFlow, cleanRange } from "../../lib/feasibility.js";

const R = (v) => ({ low: v, mid: v, high: v });
// أرقام بسيطة وثابتة: من أول شهر مبيعات كاملة، من غير تضخم ولا ضريبة
const A = { capex: [{ name: "تجهيز", ...R(100000) }], fixed: [{ name: "إيجار", ...R(10000) }], price: R(200), unitCost: R(120), units: R(300),
  rampStart: 1, rampMonths: 1, workingCapitalMonths: 3, taxPct: 0, inflation: 0, discountRate: 0 };

const m = runModel(A, "mid");
assert.equal(m.invest, 130000);                                  // تجهيز + 3 شهور مصاريف
assert.equal(m.rows[0].profit, 300 * 200 - 300 * 120 - 10000);   // 14000 في الشهر
assert.equal(m.breakEvenUnits, 10000 / 80);                      // 125
assert.equal(m.payback, Math.ceil(130000 / 14000));              // 10
assert.equal(m.years[0].profit, 14000 * 12);
assert.ok(Math.abs(m.npv - (14000 * 36 - 130000)) < 1e-6);       // خصم صفر: مجموع الأرباح − الاستثمار

// ترتيب السيناريوهات: متشائم ≤ متوقع ≤ متفائل (لما فيه مدى)
const B = { ...A, price: { low: 180, mid: 200, high: 220 }, unitCost: { low: 110, mid: 120, high: 135 }, units: { low: 200, mid: 300, high: 380 } };
const r = runAll(B);
assert.ok(r.pess.npv <= r.mid.npv && r.mid.npv <= r.opt.npv);

// الحساسية: مرتبة تنازلياً بالأثر، وزيادة السعر تزوّد القيمة
const s = sensitivity(A);
for (let i = 1; i < s.length; i++) assert.ok(s[i - 1].swing >= s[i].swing);
assert.ok(s.find((x) => x.key === "price").up > 0);
assert.ok(s.find((x) => x.key === "fixed").up < 0);

// التدفق النقدي: الرصيد التراكمي مظبوط والشهر 0 هو الاستثمار
const cf = cashFlowRows(m, 12);
assert.equal(cf.length, 13);
assert.equal(cf[0].balance, -130000);
assert.equal(cf[12].balance, -130000 + 14000 * 12);
assert.equal(cf[3].inflow - cf[3].outflow, cf[3].net);
const y = yearlyCashFlow(m);
assert.equal(y[0].net, 14000 * 12);
assert.equal(y[2].balance, -130000 + 14000 * 36);

// مشروع خسران: مفيش استرداد، وNPV سالب
const L = runModel({ ...A, units: R(50) }, "mid");
assert.equal(L.payback, null);
assert.ok(L.npv < 0);
// سعر أقل من التكلفة: مفيش تعادل
assert.equal(runModel({ ...A, price: R(100) }, "mid").breakEvenUnits, null);
// مدى مقلوب بيتعدّل
const c = cleanRange({ low: 9, mid: 5, high: 1 });
assert.deepEqual([c.low, c.mid, c.high], [1, 5, 9]);
console.log("feasibility: كل الاختبارات نجحت");
