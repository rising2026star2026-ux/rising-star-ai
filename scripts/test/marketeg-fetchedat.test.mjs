// وقت جمع الأسعار: لازم يفضل وقت الجمع الفعلي حتى لو النتيجة رجعت من الذاكرة. تشغيل: node scripts/test/marketeg-fetchedat.test.mjs
import assert from "node:assert/strict";
process.env.SERPER_API_KEY = "test";
let calls = 0;
globalThis.fetch = async (url) => {
  calls++;
  const shopping = String(url).endsWith("/shopping");
  const body = shopping
    ? { shopping: [{ title: "سماعة بلوتوث", link: "https://www.amazon.eg/dp/B0TEST", source: "Amazon.eg", price: "EGP 450" }] }
    : { organic: [{ title: "سماعة بلوتوث", link: "https://www.amazon.eg/dp/B0TEST2", snippet: "السعر 500 جنيه" }] };
  return new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
};
const { collectListings } = await import("../../lib/marketeg.js");
const first = await collectListings("سماعة بلوتوث اختبار");
assert.ok(first.items.length > 0, "لازم يلاقي ليستنجات");
assert.ok(!Number.isNaN(Date.parse(first.fetchedAt)), "وقت الجمع موجود");
const n = calls;
await new Promise((r) => setTimeout(r, 20));
const second = await collectListings("سماعة بلوتوث اختبار");
assert.equal(calls, n, "المرة التانية من الذاكرة");
assert.equal(second.cached, true);
assert.equal(second.fetchedAt, first.fetchedAt, "وقت الجمع ما بيتغيّرش من الذاكرة");
console.log("marketeg fetchedAt: تمام");
