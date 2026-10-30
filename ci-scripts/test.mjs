// يجيب صفحات الشروط لكل موقع ويحفظها نص
import { chromium } from "playwright";
import fs from "node:fs";
const sites = {
  pixlr: "https://pixlr.com/", cleanup: "https://cleanup.pictures/", iloveimg: "https://www.iloveimg.com/", croppola: "https://croppola.com/",
  paletton: "https://paletton.com/", haikei: "https://haikei.app/", shots: "https://shots.so/", crontab: "https://crontab.guru/",
  sqlfiddle: "https://sqlfiddle.com/", froggy: "https://flexboxfroggy.com/", garden: "https://cssgridgarden.com/", httpstatus: "https://httpstatuses.io/",
  hash: "https://emn178.github.io/online-tools/", hemingway: "https://hemingwayapp.com/", wordcounter: "https://wordcounter.net/", lingojam: "https://lingojam.com/",
  textcompare: "https://text-compare.com/", inputtools: "https://www.google.com/inputtools/try/", fontpair: "https://fontpair.co/", calcnet: "https://www.calculator.net/",
  unitconv: "https://www.unitconverters.net/", percent: "https://www.percentagecalculator.net/", xrates: "https://www.x-rates.com/", ilovepdf: "https://www.ilovepdf.com/",
  qrmonkey: "https://www.qrcode-monkey.com/", audiotrimmer: "https://audiotrimmer.com/", tuner: "https://www.onlinetuner.net/", pomofocus: "https://pomofocus.io/",
  eggtimer: "https://e.ggtimer.com/", vclock: "https://vclock.com/", timeis: "https://time.is/", wtb: "https://www.worldtimebuddy.com/",
  flipclock: "https://flipclocker.com/", islamicfinder: "https://www.islamicfinder.org/", nullschool: "https://earth.nullschool.net/", wikimapia: "https://wikimapia.org/",
  magenta: "https://magenta.tensorflow.org/", etherpad: "https://etherpad.wikimedia.org/", lexica: "https://lexica.art/",
};
fs.rmSync("ci/tos", { recursive: true, force: true });
fs.mkdirSync("ci/tos", { recursive: true });
const b = await chromium.launch();
const ctx = await b.newContext({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36" });
const keys = Object.keys(sites);
let i = 0;
async function worker() {
  while (i < keys.length) {
    const k = keys[i++];
    const p = await ctx.newPage();
    let out = "";
    try {
      await p.goto(sites[k], { timeout: 30000, waitUntil: "domcontentloaded" });
      await p.waitForTimeout(2500);
      const links = await p.$$eval("a", (as) => as.map((a) => [a.innerText.trim().slice(0, 40), a.href]).filter(([t, h]) => /terms|tos\b|legal|conditions|license|licence|usage|about|faq|widget|embed|github/i.test(t + " " + h)));
      out += "LINKS " + JSON.stringify(links.slice(0, 25)) + "\n";
      const seen = new Set();
      for (const [t, h] of links) {
        if (seen.size >= 4 || seen.has(h) || !/^https?:/.test(h)) continue;
        if (!/terms|tos\b|legal|conditions|license|licence|widget|embed|usage/i.test(t + " " + h)) continue;
        seen.add(h);
        try {
          const q = await ctx.newPage();
          await q.goto(h, { timeout: 25000, waitUntil: "domcontentloaded" });
          await q.waitForTimeout(1500);
          const txt = (await q.evaluate(() => document.body.innerText)).replace(/\s+/g, " ");
          out += `\n=== ${h}\n${txt.slice(0, 40000)}\n`;
          await q.close();
        } catch (e) { out += `\n=== ${h} ERR ${e.message.slice(0, 80)}\n`; }
      }
      if (!seen.size) out += "\n=== HOME\n" + (await p.evaluate(() => document.body.innerText)).replace(/\s+/g, " ").slice(0, 6000);
    } catch (e) { out += "ERR " + e.message.slice(0, 100); }
    fs.writeFileSync(`ci/tos/${k}.txt`, out);
    await p.close();
  }
}
await Promise.all(Array.from({ length: 5 }, worker));
console.log("done");
await b.close();
