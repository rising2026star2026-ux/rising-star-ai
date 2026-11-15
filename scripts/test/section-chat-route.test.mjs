// اختبار مسار شات الأقسام بطلبات fetch تجريبية. التشغيل: اعمل bundle للمسار الأول:
// esbuild app/api/section-chat/route.js --bundle --outfile=/tmp/route.mjs --format=esm --tsconfig=jsconfig.json --platform=node && node scripts/test/section-chat-route.test.mjs
import assert from "node:assert/strict";
process.env.GROQ_API_KEY = "test-not-a-real-key";
let mode = "ok", seen = [];
globalThis.fetch = async (url, init) => {
  seen.push({ url: String(url), body: init?.body ? JSON.parse(init.body) : null });
  if (mode === "err") return new Response("{\"error\":\"x\"}", { status: 500 });
  const enc = new TextEncoder();
  return new Response(new ReadableStream({ start(c) { c.enqueue(enc.encode('data: {"choices":[{"delta":{"content":"أهلاً"}}]}\n\n')); c.enqueue(enc.encode("data: [DONE]\n\n")); c.close(); } }), { status: 200, headers: { "Content-Type": "text/event-stream" } });
};
const { POST } = await import("/tmp/route.mjs");
const req = (b, ip = "1.1.1.1") => new Request("http://x/api/section-chat", { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": ip }, body: typeof b === "string" ? b : JSON.stringify(b) });
const msgs = [{ role: "user", content: "اسعّر منتج إزاي؟" }];

// نجاح: الوضع وملف النشاط والأرقام بتوصل لتعليمات النموذج
let r = await POST(req({ section: "seller", mode: "pricing", brand: { name: "نور", city: "سوهاج" }, messages: msgs }));
assert.equal(r.status, 200);
const text = await r.text();
assert.ok(text.includes("أهلاً"), text);
const sys = seen.flatMap((x) => x.body?.messages || []).find((m) => m.role === "system")?.content || "";
assert.ok(sys.includes("التسعير والأرباح") && sys.includes("الاسم: نور"), "system context");

// مدخل سيئ: قسم مجهول، رسالة فاضية، JSON تالف
assert.equal((await POST(req({ section: "realestate", messages: msgs }))).status, 400);
assert.equal((await POST(req({ section: "seller", messages: [] }))).status, 400);
assert.equal((await POST(req("{bad"))).status, 400);

// وضع/سياق تالف ما بيكسرش
r = await POST(req({ section: "seller", mode: { x: 1 }, brand: "x", compare: "x", study: 5, messages: msgs }, "2.2.2.2"));
assert.equal(r.status, 200);

// خطأ من المزود: مفيش تسريب لتفاصيل داخلية
mode = "err";
r = await POST(req({ section: "seller", messages: msgs }, "3.3.3.3"));
const body = await r.text();
assert.ok(!/groq|api[_ ]?key|openrouter|gemini/i.test(body), "تسريب تفاصيل المزود: " + body.slice(0, 200));
console.log("section-chat route: نجاح، مدخلات سيئة، سياق تالف، خطأ مزود. status خطأ المزود =", r.status);
