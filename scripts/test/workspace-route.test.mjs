// مسار /api/workspace و /api/auth بمكتبات Neon بديلة. بيتبني بـ esbuild الأول (شوف التعليق تحت).
// تشغيل: node scripts/test/workspace-route.test.mjs   (بيدوّر على esbuild في ESBUILD أو /opt/npm-tools)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../..");
const esbuild = process.env.ESBUILD || "/opt/npm-tools/node_modules/esbuild/bin/esbuild";
if (!fs.existsSync(esbuild)) { console.log("workspace-route: اتخطّى (مفيش esbuild)"); process.exit(0); }
const build = (entry, out) => execFileSync(esbuild, [entry, "--bundle", `--outfile=${out}`, "--format=esm", "--platform=node", "--loader:.js=jsx", "--jsx=automatic", `--tsconfig=${root}/jsconfig.json`,
  `--alias:@neondatabase/auth/next/server=${root}/scripts/test/stubs/neon-auth.mjs`, `--alias:@neondatabase/serverless=${root}/scripts/test/stubs/neon-serverless.mjs`, "--log-level=error"], { cwd: root });
build("app/api/workspace/route.js", "/tmp/ws-route.mjs");
build("app/api/auth/[...path]/route.js", "/tmp/auth-route.mjs");
const req = (body, method = "POST") => new Request("https://x.test/api/workspace", { method, headers: { "x-forwarded-for": `1.1.1.${Math.floor(Math.random() * 200)}` }, body: method === "GET" ? undefined : body });

// 1) مقفول
delete process.env.DATABASE_URL; delete process.env.NEON_AUTH_BASE_URL; delete process.env.NEON_AUTH_COOKIE_SECRET;
let ws = await import("/tmp/ws-route.mjs?a");
let auth = await import("/tmp/auth-route.mjs?a");
assert.deepEqual(await (await ws.GET(req(null, "GET"))).json(), { enabled: false });
assert.equal((await ws.POST(req("{}"))).status, 503);
assert.equal((await auth.POST(req("{}"), {})).status, 503);

// 2) متفعّل
process.env.DATABASE_URL = "postgres://stub"; process.env.NEON_AUTH_BASE_URL = "https://auth.stub"; process.env.NEON_AUTH_COOKIE_SECRET = "x".repeat(32);
ws = await import("/tmp/ws-route.mjs?b");
auth = await import("/tmp/auth-route.mjs?b");
assert.equal(await (await auth.GET(req(null, "GET"), {})).text(), "auth-get");
globalThis.__session = null;
assert.deepEqual(await (await ws.GET(req(null, "GET"))).json(), { enabled: true, user: null });
assert.equal((await ws.POST(req('{"action":"import"}'))).status, 401);
globalThis.__session = { user: { id: "u1", email: "a@b.c", name: "نور" } };
globalThis.__rows = (q) => (q.includes("FROM rb.businesses b") ? [] : []);
const g = await (await ws.GET(req(null, "GET"))).json();
assert.equal(g.user.id, "u1"); assert.deepEqual(g.businesses, []); assert.equal(g.counts, null);
assert.equal((await ws.POST(req("not json"))).status, 400);
assert.equal((await ws.POST(req(JSON.stringify({ action: "nope" })))).status, 400);
assert.equal((await ws.POST(req(JSON.stringify({ action: "saveProfile" })))).status, 400, "من غير نشاط");
assert.equal((await ws.POST(req(JSON.stringify({ action: "deleteMine" })))).status, 400, "من غير تأكيد");
assert.equal((await ws.POST(req("x".repeat(1_600_000)))).status, 413);
assert.equal((await ws.POST(req(JSON.stringify({ action: "import", payload: { app: "x" } })))).status, 400);
// عضو مش موجود → 403، والرسالة من غير تفاصيل داخلية
globalThis.__rows = () => [];
const r403 = await ws.POST(req(JSON.stringify({ action: "saveProfile", businessId: "11111111-2222-3333-4444-555555555555", profile: { name: "x" } })));
assert.equal(r403.status, 403);
// خطأ قاعدة بيانات → 502 من غير تسريب
globalThis.__rows = () => { throw new Error("connection to db.internal:5432 refused"); };
const r502 = await ws.GET(req(null, "GET"));
assert.equal(r502.status, 502); assert.ok(!JSON.stringify(await r502.json()).includes("5432"));
console.log("workspace-route: مقفول، من غير دخول، مدخلات سيئة، 403، 413، خطأ قاعدة بيانات من غير تسريب");
