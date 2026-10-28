const { chromium, devices } = require("playwright");
(async () => {
  const U = "http://localhost:3000"; const b = await chromium.launch();
  for (const [label, opts] of [["mobile", devices["Pixel 5"]], ["desktop", { viewport: { width: 1366, height: 860 } }]]) {
    const ctx = await b.newContext(opts); await ctx.addInitScript(() => sessionStorage.setItem("rs:intro", "1"));
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    const r = await p.goto(U + "/chat"); await p.waitForTimeout(1000);
    console.log(`[${label}] /chat ${r.status()}`);
    console.log(label, "errors", errs.slice(0, 5));
  }
  // يتأكد إن fail() بيرجّع الكود الصح أصلاً (طلب فاضي = المفروض 400)
  const r0 = await fetch(U + "/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [] }) });
  console.log("empty-messages status:", r0.status, JSON.stringify((await r0.text()).slice(0,100)));

  for (let attempt = 1; attempt <= 3; attempt++) {
    const r = await fetch(U + "/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "قول مرحبا في جملة قصيرة فقط" }] }) });
    const text = await r.text();
    console.log(`attempt ${attempt} -> status:`, r.status, "len:", text.length, "sample:", JSON.stringify(text.slice(0, 200)));
    if (r.status === 200 && text.length > 40) break;
    await new Promise((res) => setTimeout(res, 4000));
  }

  // يختبر Pollinations مباشرة من برا نظام الموقع، نفس اللحظة
  try {
    const rp = await fetch("https://text.pollinations.ai/openai", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ model: "openai", stream: true, messages: [{ role: "user", content: "say hi" }] }) });
    console.log("direct pollinations status:", rp.status);
  } catch (e) { console.log("direct pollinations ERR", e.message); }
  await b.close();
})();
