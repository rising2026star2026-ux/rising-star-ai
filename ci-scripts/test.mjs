import { chromium } from "playwright";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const log = (n, ok, i = "") => console.log(ok ? "OK " : "BAD", n, String(i).slice(0, 300));
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 420, height: 900 } });
const errs = []; p.on("pageerror", (e) => errs.push(String(e)));
let r = await p.goto(`${BASE}/tasks`);
log("tasks index", r.status() === 200, r.status());
const links = await p.$$eval("a[href^='/task/']", (a) => a.map((x) => x.getAttribute("href")));
log("task links", links.length >= 25, links.length);
await p.screenshot({ path: "ci/tasks.png" });
const bad = [];
for (const l of links) {
  const rr = await p.goto(`${BASE}${l}`);
  const h1 = await p.textContent("h1").catch(() => "");
  const n = await p.$$eval("a[href^='/ai/'], a[href^='/program/'], a[href^='/tool/']", (a) => a.length);
  if (rr.status() !== 200 || !h1 || n < 5) bad.push(`${l} ${rr.status()} n=${n}`);
}
log("all task pages ok", bad.length === 0, bad.join(" | "));
await p.goto(`${BASE}/task/video`); await p.screenshot({ path: "ci/task-video.png", fullPage: true });
const sm = await (await fetch(`${BASE}/sitemap.xml`)).text();
log("sitemap has tasks", sm.includes("/task/video") && sm.includes("/tasks"));
log("no page errors", errs.length === 0, errs.join(" | "));
await b.close();
