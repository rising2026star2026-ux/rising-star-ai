// بيفحص كل أداة: الرابط شغال؟ ينفع يتفتح جوه إطار (iframe) في موقعنا؟ وبيجيب الشعار من موقعها.
// + بيجرب Pollinations (صورة حقيقية) وروابط Hugging Face Spaces المضمنة.
import fs from "node:fs";
import * as cheerio from "cheerio";
import sharp from "sharp";
import { MAKERS } from "./list.mjs";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";
const get = async (u, ms = 20000, init = {}) => {
  const c = new AbortController(); const t = setTimeout(() => c.abort(), ms);
  try { return await fetch(u, { headers: { "user-agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: c.signal, ...init }); } finally { clearTimeout(t); }
};
fs.mkdirSync("public/maker-logos", { recursive: true });
fs.mkdirSync("data", { recursive: true });

async function logo(url, slug, html, finalUrl) {
  const cands = [];
  if (html) {
    const $ = cheerio.load(html);
    $('link[rel~="icon"], link[rel="apple-touch-icon"]').each((_, el) => {
      const h = $(el).attr("href"); if (!h) return;
      const sz = Number(($(el).attr("sizes") || "").split("x")[0]) || ($(el).attr("rel").includes("apple") ? 180 : 32);
      try { cands.push([new URL(h, finalUrl).href, sz]); } catch {}
    });
  }
  cands.sort((a, b) => b[1] - a[1]);
  const urls = cands.map((c) => c[0]).concat([`https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=128`]);
  for (const u of urls) {
    if (/\.ico(\?|$)/i.test(u)) continue;
    try {
      const r = await get(u, 10000); if (!r.ok) continue;
      const buf = Buffer.from(await r.arrayBuffer());
      const m = await sharp(buf, { density: 300 }).metadata();
      if (!m.width || m.width < 32) continue;
      await sharp(buf, { density: 300 }).resize(128, 128, { fit: "contain", background: "#ffffff" }).flatten({ background: "#ffffff" }).webp({ quality: 88 }).toFile(`public/maker-logos/${slug}.webp`);
      return `/maker-logos/${slug}.webp`;
    } catch {}
  }
  return null;
}

const out = [];
for (const [slug, name, kind, url] of MAKERS) {
  const row = { slug, name, kind, url, status: null, embed: "unknown", xfo: "", csp: "", logo: null, finalUrl: url, title: "" };
  try {
    const r = await get(url);
    row.status = r.status; row.finalUrl = r.url;
    row.xfo = r.headers.get("x-frame-options") || "";
    const csp = r.headers.get("content-security-policy") || "";
    row.csp = (csp.match(/frame-ancestors[^;]*/i) || [""])[0];
    const html = r.ok ? await r.text() : "";
    row.title = (html.match(/<title[^>]*>([^<]{0,120})/i) || [])[1]?.trim() || "";
    // ينفع يتضمن لو مفيش X-Frame-Options ومفيش frame-ancestors مقيّد
    const blocked = /deny|sameorigin/i.test(row.xfo) || (row.csp && !/frame-ancestors\s+(\*|https?:)/i.test(row.csp));
    row.embed = r.ok ? (blocked ? "blocked" : "maybe") : "error";
    row.logo = await logo(url, slug, html, r.url);
  } catch (e) { row.error = String(e.message || e).slice(0, 80); row.embed = "error"; row.logo = await logo(url, slug, "", url).catch(() => null); }
  console.log(`${row.embed.padEnd(8)} ${String(row.status).padEnd(4)} ${slug.padEnd(20)} xfo=${row.xfo || "-"} ${row.csp ? "csp=" + row.csp.slice(0, 50) : ""} logo=${row.logo ? "y" : "n"}`);
  out.push(row);
}

// Pollinations: صورة حقيقية؟
const poll = {};
for (const [k, u] of [
  ["legacy", "https://image.pollinations.ai/prompt/a%20red%20apple%20on%20a%20table?width=512&height=512&nologo=true&seed=1"],
  ["new", "https://gen.pollinations.ai/image/a%20red%20apple%20on%20a%20table?width=512&height=512&seed=1"],
]) {
  try { const r = await get(u, 60000); poll[k] = { status: r.status, type: r.headers.get("content-type"), bytes: (await r.arrayBuffer()).byteLength, acao: r.headers.get("access-control-allow-origin") }; }
  catch (e) { poll[k] = { error: String(e.message).slice(0, 80) }; }
}
console.log("pollinations", JSON.stringify(poll));

// Hugging Face Spaces (روابط التضمين)
const hf = {};
for (const sp of ["black-forest-labs/FLUX.1-schnell", "Wan-AI/Wan2.2-5B", "Wan-AI/Wan2.1", "stabilityai/stable-diffusion-3.5-large", "multimodalart/FLUX.1-merged"]) {
  try {
    const r = await get(`https://huggingface.co/api/spaces/${sp}`);
    const j = r.ok ? await r.json() : {};
    const sub = `https://${sp.replace("/", "-").replace(/[._]/g, "-").toLowerCase()}.hf.space`;
    const e = await get(sub, 20000).catch(() => null);
    hf[sp] = { api: r.status, runtime: j.runtime?.stage, sdk: j.sdk, embedStatus: e?.status, xfo: e?.headers.get("x-frame-options") || "", subdomain: j.subdomain || null };
  } catch (e) { hf[sp] = { error: String(e.message).slice(0, 80) }; }
}
console.log("hf", JSON.stringify(hf));
fs.writeFileSync("data/makers-probe.json", JSON.stringify({ at: new Date().toISOString(), tools: out, pollinations: poll, hf }, null, 1));
