// مسار /api/workspace و /api/auth بخدمة حسابات وهمية (fetch) ومكتبة قاعدة بيانات بديلة. بيتبني بـ esbuild الأول (شوف التعليق تحت).
// تشغيل: node scripts/test/workspace-route.test.mjs   (بيدوّر على esbuild في ESBUILD أو /opt/npm-tools)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
const root = path.resolve(import.meta.dirname, "../..");
const esbuild = process.env.ESBUILD || "/opt/npm-tools/node_modules/esbuild/bin/esbuild";
if (!fs.existsSync(esbuild)) { console.log("workspace-route: اتخطّى (مفيش esbuild)"); process.exit(0); }
const build = (entry, out) => execFileSync(esbuild, [entry, "--bundle", `--outfile=${out}`, "--format=esm", "--platform=node", "--loader:.js=jsx", "--jsx=automatic", `--tsconfig=${root}/jsconfig.json`,
  `--alias:@neondatabase/serverless=${root}/scripts/test/stubs/neon-serverless.mjs`, "--log-level=error"], { cwd: root });
build("app/api/workspace/route.js", "/tmp/ws-route.mjs");
build("app/api/auth/[...path]/route.js", "/tmp/auth-route.mjs");
const req = (body, method = "POST", url = "https://x.test/api/workspace") => new Request(url, { method, headers: { "x-forwarded-for": `1.1.1.${Math.floor(Math.random() * 200)}`, cookie: "s=1" }, body: method === "GET" ? undefined : body });
// خدمة الحسابات الوهمية
const calls = [];
globalThis.fetch = async (url, init = {}) => {
  calls.push({ url: String(url), init });
  if (String(url).endsWith("/get-session")) return Response.json(globalThis.__session ? { user: globalThis.__session.user } : null);
  if (String(url).includes("/sign-in/email")) return new Response('{"ok":true}', { status: 200, headers: [["content-type", "application/json"], ["set-cookie", "__Secure-neon-auth.session_token=abc; Domain=auth.stub; Path=/; HttpOnly; Secure; SameSite=Lax"]] });
  if (String(url).includes("/boom")) throw new Error("ECONNREFUSED 10.0.0.1");
  return new Response("{}", { status: 404 });
};

// 1) مقفول
delete process.env.DATABASE_URL; delete process.env.NEON_AUTH_BASE_URL; delete process.env.NEON_AUTH_COOKIE_SECRET;
let ws = await import("/tmp/ws-route.mjs?a");
let auth = await import("/tmp/auth-route.mjs?a");
assert.deepEqual(await (await ws.GET(req(null, "GET"))).json(), { enabled: false });
assert.equal((await ws.POST(req("{}"))).status, 503);
assert.equal((await auth.POST(req("{}"), { params: Promise.resolve({ path: ["sign-in", "email"] }) })).status, 503);

// 2) متفعّل
process.env.DATABASE_URL = "postgres://stub"; process.env.NEON_AUTH_BASE_URL = "https://auth.stub/neondb/auth/";
ws = await import("/tmp/ws-route.mjs?b");
auth = await import("/tmp/auth-route.mjs?b");
const si = await auth.POST(req('{"email":"a@b.c","password":"12345678"}', "POST", "https://x.test/api/auth/sign-in/email?x=1"), { params: Promise.resolve({ path: ["sign-in", "email"] }) });
assert.equal(si.status, 200);
assert.equal(calls.at(-1).url, "https://auth.stub/neondb/auth/sign-in/email?x=1", "المسار والاستعلام بيتنقلوا كما هم");
assert.equal(calls.at(-1).init.headers.get("origin"), "https://x.test");
assert.ok(!/domain=/i.test(si.headers.get("set-cookie")), "الكوكي مربوط بدومين الموقع");
assert.ok(/HttpOnly/.test(si.headers.get("set-cookie")));
for (const bad of [["..", "admin"], ["get-session", ".."], ["a..b"], [".env"], []]) assert.equal((await auth.GET(req(null, "GET"), { params: Promise.resolve({ path: bad }) })).status, 400, `مسار مش مسموح ${bad}`);
const boom = await auth.GET(req(null, "GET"), { params: Promise.resolve({ path: ["boom"] }) });
assert.equal(boom.status, 502); assert.ok(!(await boom.text()).includes("10.0.0.1"));
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
