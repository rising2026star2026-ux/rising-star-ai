import { chromium } from "playwright";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 300));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
const svg = (c) => "data:image/svg+xml;utf8," + encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'><rect width='300' height='200' fill='${c}'/></svg>`);
const imgs = [{ s: svg("#c33"), h: "https://example.com/a", a: "one" }, { s: svg("#3a3"), h: "https://example.com/b", a: "two" }];
await p.route("**/api/chat", (r) => r.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", headers: {
  "x-search": "ok", "x-sources": encodeURIComponent(JSON.stringify([{ t: "Example", u: "https://example.com/a" }])), "x-images": encodeURIComponent(JSON.stringify(imgs)),
}, body: "ده رد تجريبي [1]" }));
const r = await p.goto(`${BASE}/chat`);
log("chat page", r.status() === 200, r.status());
const fs = await p.$eval("textarea", (t) => parseFloat(getComputedStyle(t).fontSize));
log("composer font >= 17px", fs >= 17, fs + "px");
await p.fill("textarea", "سعر الدولار النهارده");
await p.keyboard.press("Enter");
await p.waitForSelector("[aria-label='صور من نتائج البحث'] img", { timeout: 15000 }).then(() => log("image strip rendered", true), (e) => log("image strip rendered", false, e.message));
const n = await p.$$eval("[aria-label='صور من نتائج البحث'] a", (a) => a.length);
log("2 image cards", n === 2, n);
await p.screenshot({ path: "ci/chat-images.png" });
log("no page errors", errs.length === 0, errs.join(" | "));
await b.close();
