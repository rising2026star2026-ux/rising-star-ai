// خدمة مساحة العمل على Postgres حقيقي (محلي). بيتخطى لو مفيش PG_TEST_PORT.
// تشغيل: PG_TEST_PORT=5499 node scripts/test/workspace-db.test.mjs
// (قبلها: initdb + تشغيل postgres على البورت ده، والاختبار بيطبّق 0001_core.up.sql بنفسه)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import path from "node:path";

const port = process.env.PG_TEST_PORT;
if (!port) { console.log("workspace-db: اتخطّى (مفيش PG_TEST_PORT)"); process.exit(0); }
const root = path.resolve(import.meta.dirname, "../..");
const psql = (args, input) => execFileSync("psql", ["-h", "/tmp", "-p", port, "-U", "postgres", "-v", "ON_ERROR_STOP=1", "-qtA", ...args], { input, encoding: "utf8" });
const lit = (v) => (v === null || v === undefined ? "NULL" : typeof v === "number" ? String(v) : `'${String(v).replace(/'/g, "''")}'`);
const compile = (strings, vals) => strings.reduce((s, part, i) => s + part + (i < vals.length ? lit(vals.at(i)) : ""), "");
const run = (text) => {
  const t = text.trim();
  if (/^SELECT/i.test(t)) return JSON.parse(psql(["-c", `SELECT coalesce(json_agg(t), '[]') FROM (${t}) t`]).trim() || "[]");
  psql(["-c", t]);
  return [];
};
function sql(strings, ...vals) {
  const text = compile(strings, vals);
  return { text, then: (ok, bad) => { try { ok(run(text)); } catch (e) { bad(e); } } };
}
sql.transaction = async (qs) => { psql([], `BEGIN;\n${qs.map((q) => q.text + ";").join("\n")}\nCOMMIT;\n`); return []; };

psql(["-f", path.join(root, "db/migrations/0001_core.down.sql")]);
psql(["-f", path.join(root, "db/migrations/0001_core.up.sql")]);
const ws = await import("../../lib/server/workspace.js");

const A = "user-a", B = "user-b";
const { id: bid } = await ws.createBusiness(sql, A, { name: "حلويات نور", kind: "food", city: "سوهاج", evil: "x" });
const mine = await ws.myBusinesses(sql, A);
assert.equal(mine.length, 1); assert.equal(mine[0].role, "owner"); assert.equal(mine[0].profile.kind, "food");
assert.ok(!("evil" in mine[0].profile), "الحقول الغريبة بتتشال");
assert.equal((await ws.myBusinesses(sql, B)).length, 0, "المستخدم التاني ما يشوفش نشاط غيره");
await assert.rejects(ws.saveProfile(sql, B, bid, { name: "سرقة" }), (e) => e.status === 403);
await assert.rejects(ws.summary(sql, B, bid), (e) => e.status === 403);
await ws.saveProfile(sql, A, bid, { name: "حلويات نور الجديدة", kind: "food" });
assert.equal((await ws.myBusinesses(sql, A))[0].name, "حلويات نور الجديدة");

const payload = { app: "Rising Business", version: 1, data: {
  profile: { name: "حلويات نور" },
  comparisons: [{ id: "c1", name: "كافيه ولا محل", list: [{ id: "b1", name: "كافيه's corner", price: "60" }] }, { id: "c2", name: "فاضية", list: [] }],
  studies: [{ id: "f1", name: "دراسة الكافيه", study: { form: {}, data: { at: "2026-11-15T10:00:00.000Z" }, a: { price: { mid: 60 } } } }],
  chats: [{ id: "x", mode: "pricing", question: "أسعّر إزاي؟", answer: "بالتكلفة + الهامش" }],
  outputs: [{ id: "h", toolId: "ad-copy", toolName: "إعلان", input: "تورتة", output: "نص الإعلان" }, { id: "bad" }],
} };
const r = await ws.importDevice(sql, A, payload);
assert.equal(r.businessId, bid, "بيضيف على النشاط الموجود");
assert.deepEqual(r.counts, { comparisons: 1, studies: 1, chats: 1, outputs: 1 });
const s = await ws.summary(sql, A, bid);
assert.deepEqual(s, { comparisons: 1, studies: 1, reports: 2, products: 0 });
const v = JSON.parse(psql(["-c", "SELECT json_agg(t) FROM (SELECT version, sources_collected_at IS NOT NULL AS dated FROM rb.feasibility_versions) t"]).trim());
assert.deepEqual(v, [{ version: 1, dated: true }], "الدراسة اتحفظت كإصدار 1 بتاريخ جمع المصادر");
await assert.rejects(ws.importDevice(sql, A, { app: "x" }), (e) => e.status === 400);
await assert.rejects(ws.importDevice(sql, B, payload, bid), (e) => e.status === 403, "ما ينفعش يستورد في نشاط غيره");

const rb = await ws.importDevice(sql, B, payload);
assert.notEqual(rb.businessId, bid, "مستخدم جديد بيتعمله نشاط جديد");
await assert.rejects(ws.importDevice(sql, A, { app: "Rising Business", data: { comparisons: [{ name: "x", list: ["y".repeat(250_000)] }] } }), (e) => e.status === 413);

await ws.deleteMine(sql, A);
assert.equal((await ws.myBusinesses(sql, A)).length, 0);
assert.equal(JSON.parse(psql(["-c", `SELECT count(*) FROM rb.comparisons WHERE business_id = '${bid}'`]).trim()), 0, "الحذف بيمسح بيانات النشاط");
assert.equal((await ws.myBusinesses(sql, B)).length, 1, "بيانات المستخدم التاني سليمة");
console.log("workspace-db: تمام على Postgres حقيقي");
