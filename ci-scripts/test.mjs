// بيفحص: مين من الأدوات بيسمح بالتضمين جوه موقع تاني (iframe)؟
import fs from "node:fs";
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const cands = JSON.parse(fs.readFileSync("ci-scripts/candidates.json", "utf8"));

function verdict(status, h) {
  const xfo = (h.get("x-frame-options") || "").toLowerCase();
  const csp = h.get("content-security-policy") || "";
  const fa = /frame-ancestors([^;]*)/i.exec(csp)?.[1]?.trim() || "";
  let blocked = null;
  if (xfo.includes("deny") || xfo.includes("sameorigin")) blocked = "x-frame-options: " + xfo;
  else if (fa && !/(^|\s)(\*|https:|http:)(\s|$)/.test(fa)) blocked = "frame-ancestors " + fa.slice(0, 60);
  if (status >= 400) return { ok: false, why: "HTTP " + status };
  if (blocked) return { ok: false, why: blocked };
  return { ok: true, why: xfo ? "xfo:" + xfo : fa ? "fa:" + fa.slice(0, 40) : "no restriction" };
}

async function check(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 20000);
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,*/*" }, redirect: "follow", signal: ctl.signal });
    const v = verdict(r.status, r.headers);
    try { await r.body?.cancel(); } catch {}
    return { ...v, status: r.status, final: r.url };
  } catch (e) {
    return { ok: false, why: "error " + String(e.cause?.code || e.name || e.message).slice(0, 40), status: 0 };
  } finally { clearTimeout(t); }
}

async function pool(items, n, fn) {
  const out = new Array(items.length); let i = 0;
  await Promise.all(Array.from({ length: n }, async () => { while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); } }));
  return out;
}

// 1) مواقع الأدوات
const web = await pool(cands, 12, async ([cat, name, url, ar]) => ({ cat, name, url, ar, ...(await check(url)) }));
const okWeb = web.filter((x) => x.ok);
console.log(`WEB embeddable ${okWeb.length}/${web.length}`);
for (const x of web) console.log(x.ok ? "OK " : "NO ", x.cat, x.name, "|", x.why);

// 2) تطبيقات Hugging Face Spaces
const QUERIES = ["image generation", "text to image", "text to speech", "speech to text", "whisper", "background removal", "upscale", "video generation", "image to video", "music generation", "OCR", "translation", "chatbot", "avatar", "3d", "voice clone", "image caption", "colorize", "anime", "logo", "sketch", "face", "pdf", "summarization", "sentiment", "object detection", "depth", "inpainting", "stable diffusion", "flux", "qwen", "deepseek", "llama", "tts", "lip sync", "restore photo", "remove object", "font", "meme", "story"];
const seen = new Map();
await pool(QUERIES, 6, async (q) => {
  try {
    const r = await fetch(`https://huggingface.co/api/spaces?search=${encodeURIComponent(q)}&sort=likes&direction=-1&limit=25&full=true`, { headers: { "user-agent": UA } });
    if (!r.ok) { console.log("HF api", q, r.status); return; }
    for (const s of await r.json()) if (!seen.has(s.id)) seen.set(s.id, { id: s.id, likes: s.likes, sdk: s.sdk, stage: s.runtime?.stage || null, title: s.cardData?.title || "", short: s.cardData?.short_description || "", q });
  } catch (e) { console.log("HF err", q, e.message); }
});
const hfAll = [...seen.values()].filter((s) => ["gradio", "static", "streamlit"].includes(s.sdk) && (!s.stage || s.stage === "RUNNING" || s.stage === "SLEEPING"));
console.log("HF candidates", seen.size, "usable", hfAll.length);
const top = hfAll.sort((a, b) => b.likes - a.likes).slice(0, 220);
const hf = await pool(top, 12, async (s) => {
  const host = s.id.toLowerCase().replace(/[._/]/g, "-");
  const url = `https://${host}.hf.space/`;
  return { ...s, url, ...(await check(url)) };
});
const okHf = hf.filter((x) => x.ok);
console.log(`HF embeddable ${okHf.length}/${hf.length}`);
for (const x of hf) console.log(x.ok ? "OK " : "NO ", x.id, x.likes, x.stage, "|", x.why);
fs.mkdirSync("ci", { recursive: true });
fs.writeFileSync("ci/embed-web.json", JSON.stringify(web));
fs.writeFileSync("ci/embed-hf.json", JSON.stringify(hf));
