import { chromium } from "playwright";
import fs from "fs";
fs.mkdirSync("ci/ux", { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ viewport: { width: 412, height: 860 }, deviceScaleFactor: 2 });
const p = await ctx.newPage();
const BASE = "https://rising-star-ai.vercel.app";
const out = {};
await p.goto(BASE + "/", { waitUntil: "networkidle" });
await p.waitForTimeout(5000);
await p.screenshot({ path: "ci/ux/home.png" });
await p.screenshot({ path: "ci/ux/home-full.png", fullPage: true });
out.homeHeight = await p.evaluate(() => document.documentElement.scrollHeight);
out.bottomNav = await p.evaluate(() => [...document.querySelectorAll("nav a, nav button")].map((a) => a.textContent.trim()).filter(Boolean).slice(0, 30));
// القائمة الجانبية
const burger = p.locator("button[aria-label*='قائمة'], button[aria-label*='menu' i], header button").last();
try { await burger.click({ timeout: 3000 }); await p.waitForTimeout(800); await p.screenshot({ path: "ci/ux/drawer.png" }); out.drawer = await p.evaluate(() => [...document.querySelectorAll("aside a, [class*=side] a")].map((a) => a.textContent.trim()).filter(Boolean)); } catch (e) { out.drawerErr = String(e).slice(0, 100); }
for (const [name, path] of [["tools", "/tools"], ["models", "/models"], ["tasks", "/tasks"], ["global", "/global-tools"], ["maker", "/maker"], ["creators", "/creators"]]) {
  await p.goto(BASE + path, { waitUntil: "networkidle" }).catch(() => {});
  await p.waitForTimeout(1500);
  await p.screenshot({ path: `ci/ux/${name}.png` });
  out[name] = { h: await p.evaluate(() => document.documentElement.scrollHeight), title: await p.title(), h1: await p.locator("h1").first().textContent().catch(() => null) };
}
out.font = await p.evaluate(() => getComputedStyle(document.body).fontFamily);
fs.writeFileSync("ci/ux/info.json", JSON.stringify(out, null, 1));
await b.close();
