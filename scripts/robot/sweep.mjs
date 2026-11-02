// الجولة على كل صفحات الموقع (من خريطة الموقع): بتفتح كل صفحة على مقاس موبايل وبتدوّر على
// الأعطال اللي المستخدم بيشوفها: صفحة مش بتفتح، صفحة فاضية، خطأ في الكود، صور مكسورة،
// صفحة أعرض من الشاشة، بطء، كلام بايظ (NaN/undefined)، وإطار أداة مش راضي يفتح.
import { shot, sleep } from "./lib.mjs";

export const MOBILE = { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: "ar-EG" };
const SLOW_MS = 10000;
const SOCIAL = /(^|\.)(facebook|fb|instagram|twitter|x|tiktok|linkedin|youtube|youtu|wa|whatsapp|t|telegram|threads|snapchat|pinterest)\.(com|me|be|net|org)$/i;

/** يجيب كل روابط الموقع من sitemap.xml */
export async function sitemapUrls(BASE) {
  const r = await fetch(`${BASE}/sitemap.xml`, { signal: AbortSignal.timeout(30000) });
  if (!r.ok) throw new Error(`sitemap ${r.status}`);
  const xml = await r.text();
  const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  // خريطة الموقع بتكتب الدومين الرسمي؛ إحنا بنفحص BASE
  return [...new Set(urls.map((u) => { const x = new URL(u); return BASE + x.pathname + x.search; }))];
}

export async function newPage(ctx) {
  const page = await ctx.newPage();
  const log = { pageErrors: [], console: [], bad: [], failed: [] };
  page.on("pageerror", (e) => log.pageErrors.push(String(e?.message || e).slice(0, 300)));
  page.on("console", (m) => { if (m.type() === "error") log.console.push(m.text().slice(0, 300)); });
  page.on("response", (r) => { if (r.status() >= 400) log.bad.push({ status: r.status(), url: r.url(), method: r.request().method() }); });
  page.on("requestfailed", (r) => { const f = r.failure()?.errorText || ""; if (!/ERR_ABORTED|NS_BINDING_ABORTED/.test(f)) log.failed.push({ url: r.url(), error: f }); });
  return { page, log };
}

/** يفحص صفحة واحدة. بيرجع نتيجة فيها المشاكل ونوع الصفحة */
export async function checkPage(ctx, url, { OUT, BASE }) {
  const { page, log } = await newPage(ctx);
  const res = { group: "pages", path: new URL(url).pathname, url, name: "", problems: [], tech: [], ms: 0, kind: "page", links: [] };
  const add = (level, text, tech) => { res.problems.push({ level, text }); if (tech) res.tech.push(tech); };
  const t0 = Date.now();
  let status = 0;
  try {
    const resp = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 });
    status = resp?.status() || 0;
    await page.waitForLoadState("load", { timeout: 30000 }).catch(() => add("warn", "الصفحة ما خلصتش تحميل في 30 ثانية"));
    res.ms = Date.now() - t0;
    await page.waitForLoadState("networkidle", { timeout: 6000 }).catch(() => {});
    // ننزل لآخر الصفحة عشان الصور والأقسام اللي بتظهر مع النزول تتحمّل
    await page.evaluate(async () => {
      const H = innerHeight;
      for (let y = 0, i = 0; y < document.documentElement.scrollHeight && i < 14; y += H * 0.9, i++) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 160)); }
      scrollTo(0, 0);
    }).catch(() => {});
    await sleep(900);
  } catch (e) {
    res.ms = Date.now() - t0;
    add("broken", "الصفحة ما فتحتش خالص", String(e?.message || e).slice(0, 300));
    res.shot = await shot(page, OUT, `page${res.path}`);
    await page.close();
    return res;
  }

  const info = await page.evaluate(() => {
    const root = document.querySelector("main") || document.body;
    const body = document.body.innerText || "";
    const h1 = document.querySelector("h1")?.innerText?.trim() || "";
    // على الموبايل innerWidth بيكبر مع المحتوى العريض، فبنقيس بعرض الشاشة الفعلي
    const vw = document.documentElement.clientWidth;
    const sw = document.documentElement.scrollWidth;
    const offenders = [];
    if (sw > vw + 4) {
      const fixedUp = (el) => { for (let p = el; p && p !== document.body; p = p.parentElement) if (getComputedStyle(p).position === "fixed") return true; return false; };
      const clipped = (el) => { for (let p = el.parentElement; p && p !== document.body && p !== document.documentElement; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o !== "visible") return true; } return false; };
      for (const el of document.querySelectorAll("body *")) {
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height) continue;
        const over = Math.max(r.right - vw, -r.left);
        if (over <= 4 || clipped(el) || fixedUp(el)) continue;
        const cls = typeof el.className === "string" ? el.className.split(/\s+/).slice(0, 2).join(".") : "";
        offenders.push({ over: Math.round(over), el: `${el.tagName.toLowerCase()}${el.id ? "#" + el.id : ""}${cls ? "." + cls : ""} «${(el.innerText || "").trim().slice(0, 30)}»` });
      }
      offenders.sort((a, b) => b.over - a.over);
    }
    const brokenImgs = [...document.images].filter((i) => i.complete && i.naturalWidth === 0 && (i.currentSrc || i.src) && !(i.currentSrc || i.src).startsWith("data:")).map((i) => i.currentSrc || i.src);
    const links = [...document.querySelectorAll("a[href^='http']")].map((a) => a.href).filter((h) => { try { return new URL(h).hostname !== location.hostname; } catch { return false; } });
    return {
      h1, title: document.title, textLen: root.innerText.trim().length,
      appError: /Application error: a (client|server)-side exception|Internal Server Error|This page could not be found/i.test(body),
      junk: (body.match(/\bNaN\b|\bundefined\b|\[object Object\]|\bInfinity\b/g) || []).slice(0, 3),
      overflow: sw > vw + 4 ? sw - vw : 0, offenders: offenders.slice(0, 3),
      brokenImgs: [...new Set(brokenImgs)].slice(0, 8),
      isAiRunner: !!document.querySelector("textarea#in") && [...document.querySelectorAll("button")].some((b) => b.innerText.trim() === "نفّذ"),
      isLocal: !!document.querySelector(".local-tool"),
      iframes: [...document.querySelectorAll("iframe")].map((f) => f.src).filter(Boolean),
      links: [...new Set(links)].slice(0, 40),
    };
  }).catch((e) => ({ evalError: String(e?.message || e) }));

  res.name = (info.h1 || info.title || res.path).replace(/\s*[|–-]\s*Rising Star.*$/i, "").slice(0, 80);
  res.kind = info.isAiRunner ? "ai" : info.isLocal ? "local" : "page";
  res.links = (info.links || []).filter((h) => { try { return !SOCIAL.test(new URL(h).hostname.replace(/^www\./, "")); } catch { return false; } });

  if (info.evalError) add("broken", "الصفحة وقعت وهي بتتفحص", info.evalError);
  if (status >= 500) add("broken", `الصفحة مش بتفتح (خطأ سيرفر ${status})`);
  else if (status === 404) add("broken", "الصفحة مش موجودة (404) مع إنها في خريطة الموقع");
  else if (status >= 400) add("broken", `الصفحة رجّعت خطأ ${status}`);
  if (status >= 400) { /* اتقالت فوق */ }
  else if (info.appError) add("broken", "الصفحة وقعت وظهرت رسالة خطأ بدل المحتوى");
  else if (info.textLen < 60) add("broken", "الصفحة فاضية (مفيش محتوى ظاهر)");

  const same = (u) => { try { return new URL(u).origin === new URL(BASE).origin; } catch { return false; } };
  const chunks = log.bad.filter((b) => same(b.url) && b.url.includes("/_next/static/"));
  if (chunks.length) add("broken", "ملفات الموقع نفسه ناقصة (الصفحة ممكن تبقى بايظة بعد آخر تحديث)", chunks.map((c) => `${c.status} ${c.url}`).join(" | "));
  const api = log.bad.filter((b) => same(b.url) && b.url.includes("/api/"));
  if (api.length) add("warn", `طلبات من الصفحة للسيرفر فشلت (${api.length})`, api.map((c) => `${c.status} ${c.method} ${c.url}`).join(" | "));
  const imgs = new Set(info.brokenImgs || []);
  const files = log.bad.filter((b) => same(b.url) && !b.url.includes("/_next/static/") && !b.url.includes("/api/") && b.method === "GET" && b.url !== url && !imgs.has(b.url));
  if (files.length) add("warn", `ملفات ناقصة على الصفحة (${files.length})`, files.slice(0, 6).map((c) => `${c.status} ${c.url}`).join(" | "));
  if (log.pageErrors.length) add("warn", `خطأ في كود الصفحة: ${log.pageErrors[0].slice(0, 120)}`, log.pageErrors.slice(0, 4).join(" | "));
  if (info.brokenImgs?.length) add("warn", `${info.brokenImgs.length} صورة مكسورة`, info.brokenImgs.join(" | "));
  if (info.overflow) add("warn", `الصفحة أعرض من شاشة الموبايل بـ ${info.overflow} بكسل (بتتحرك يمين وشمال)`, info.offenders.map((o) => `${o.el} +${o.over}px`).join(" | "));
  if (info.junk?.length) add("warn", `فيه كلام بايظ ظاهر للمستخدم: ${[...new Set(info.junk)].join("، ")}`);
  if (res.ms > SLOW_MS) add("warn", `بطيئة: فتحت في ${(res.ms / 1000).toFixed(1)} ثانية`);

  // إطار جوه الصفحة (أداة من موقع تاني) مش راضي يفتح
  for (const f of page.frames()) {
    if (f === page.mainFrame()) continue;
    if (f.url().startsWith("chrome-error://")) add("broken", "الأداة اللي جوه الصفحة (إطار من موقع تاني) مش راضية تفتح", (info.iframes || []).join(" | "));
  }
  if (log.console.length) res.tech.push(`console: ${log.console.slice(0, 3).join(" | ")}`);

  if (res.problems.length) res.shot = await shot(page, OUT, `page${res.path}`);
  await page.close();
  return res;
}

/** يفحص كل الصفحات بأكتر من متصفح في نفس الوقت */
export async function sweep(browser, urls, { OUT, BASE, workers = 4, onDone } = {}) {
  const queue = [...urls];
  const results = [];
  await Promise.all(Array.from({ length: Math.min(workers, queue.length) }, async () => {
    const ctx = await browser.newContext(MOBILE);
    await ctx.addInitScript(() => { try { sessionStorage.setItem("rs:intro", "1"); } catch {} });
    while (queue.length) {
      const url = queue.shift();
      const r = await checkPage(ctx, url, { OUT, BASE }).catch((e) => ({ group: "pages", path: new URL(url).pathname, url, name: url, problems: [{ level: "broken", text: "الروبوت ما قدرش يفحص الصفحة" }], tech: [String(e?.message || e)], ms: 0, kind: "page", links: [] }));
      results.push(r);
      onDone?.(r);
    }
    await ctx.close();
  }));
  return results;
}
