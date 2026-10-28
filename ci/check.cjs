const { chromium, devices } = require("playwright");
(async () => {
  const U = "http://localhost:3000"; const b = await chromium.launch();
  for (const [label, opts] of [["mobile", devices["Pixel 5"]], ["desktop", { viewport: { width: 1366, height: 860 } }]]) {
    const ctx = await b.newContext(opts); await ctx.addInitScript(() => sessionStorage.setItem("rs:intro", "1"));
    const p = await ctx.newPage(); const errs = [];
    p.on("pageerror", (e) => errs.push(e.message));
    for (const [path, tag] of [["/chat", "chat"]]) {
      const r = await p.goto(U + path); await p.waitForTimeout(1200);
      console.log(`[${label}] ${path} ${r.status()} ovf=${await p.evaluate(() => document.documentElement.scrollWidth - innerWidth)}`);
      await p.screenshot({ path: `ci/${label}-${tag}.png` });
    }
    console.log(label, "errors", errs.slice(0, 5));
  }
  // يختبر مسار توليد الصورة في /api/chat مباشرة (موديل الترجمة بمفتاح وهمي هيفشل، فبنتأكد بس إن المسار بيتفعّل ويرجع رسالة واضحة)
  const r = await (await fetch(U + "/api/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: [{ role: "user", content: "عايز صورة قطة" }] }) }));
  console.log("image route status:", r.status, (await r.text()).slice(0, 200));
  await b.close();
})();
