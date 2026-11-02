// الحاجات اللي بره موقعنا وبنعتمد عليها: سيرفرات Hugging Face المجانية (توليد الصور، إزالة الخلفية،
// الأصوات) والروابط الخارجية في الصفحات (مواقع البرامج والأدوات). لو سيرفر واقع، الأداة اللي معتمدة
// عليه هتبان بايظة للمستخدم حتى لو الكود سليم، فالتقرير بيقول ده صراحة.
import fs from "node:fs/promises";
import path from "node:path";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36";

// السيرفرات اللي أدوات أساسية في الموقع واقفة عليها (الباقي روابط في المكتبة)
const CRITICAL = {
  "black-forest-labs-flux-1-schnell": "صانع الصور وخلفيات الإعلانات",
  "not-lain-background-removal": "إزالة الخلفية (السيرفر الأول)",
  "zhengpeng7-birefnet-demo": "إزالة الخلفية (السيرفر التاني)",
  "resembleai-chatterbox-multilingual-tts": "مقارنة الأصوات ومصنع الفيديو",
};

/** كل سيرفرات Hugging Face المكتوبة في كود الموقع */
export async function findSpaces(root) {
  const hosts = new Map();
  async function walk(dir) {
    for (const e of await fs.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name);
      if (e.isDirectory()) { if (!/node_modules|\.next|\.git/.test(e.name)) await walk(p); continue; }
      if (!/\.(m?js|jsx)$/.test(e.name)) continue;
      const t = await fs.readFile(p, "utf8");
      for (const m of t.matchAll(/https:\/\/([a-z0-9-]+)\.hf\.space/g)) {
        const sub = m[1];
        if (!hosts.has(sub)) hosts.set(sub, new Set());
        hosts.get(sub).add(path.relative(root, p));
      }
    }
  }
  for (const d of ["lib", "components", "app"]) await walk(path.join(root, d)).catch(() => {});
  return [...hosts].map(([sub, files]) => ({ sub, host: `https://${sub}.hf.space`, files: [...files], feature: CRITICAL[sub] || null }));
}

async function get(url, ms) {
  const t0 = Date.now();
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "text/html,application/json,*/*" }, redirect: "follow", signal: AbortSignal.timeout(ms) });
    const ct = r.headers.get("content-type") || "";
    await r.body?.cancel().catch(() => {});
    return { status: r.status, ct, ms: Date.now() - t0 };
  } catch (e) {
    return { status: 0, error: String(e?.cause?.code || e?.name || e?.message || e), ms: Date.now() - t0 };
  }
}

export async function checkSpaces(spaces) {
  const out = [];
  await Promise.all(spaces.map(async (s) => {
    let r = await get(`${s.host}/config`, 25000);
    if (r.status !== 200) { const r2 = await get(`${s.host}/gradio_api/info`, 20000); if (r2.status === 200) r = r2; }
    const up = r.status === 200;
    out.push({ ...s, up, status: r.status, error: r.error || "", ms: r.ms });
  }));
  return out.sort((a, b) => (b.feature ? 1 : 0) - (a.feature ? 1 : 0));
}

/** يفحص الروابط الخارجية: الموقع موجود؟ الصفحة موجودة؟ */
export async function checkLinks(linkPages, { limit = 600, workers = 10 } = {}) {
  const entries = [...linkPages].slice(0, limit);
  const out = [];
  const queue = [...entries];
  await Promise.all(Array.from({ length: workers }, async () => {
    while (queue.length) {
      const [url, pages] = queue.shift();
      let r = await get(url, 15000);
      if (r.status === 0 && /Timeout|abort/i.test(r.error)) r = await get(url, 20000);
      let level = null, why = "";
      if (r.status === 0) {
        if (/ENOTFOUND|EAI_AGAIN/.test(r.error)) { level = "broken"; why = "الموقع مش موجود خالص (الدومين مش شغال)"; }
        else if (/CERT|SSL|TLS/i.test(r.error)) { level = "warn"; why = "شهادة الأمان بتاعت الموقع فيها مشكلة"; }
        else if (/ECONNREFUSED|ECONNRESET/.test(r.error)) { level = "broken"; why = "الموقع مش بيرد"; }
        else { level = "warn"; why = "الموقع بطيء جداً أو مش بيرد"; }
      } else if (r.status === 404 || r.status === 410) { level = "broken"; why = `الصفحة اتشالت من موقعهم (${r.status})`; }
      else if (r.status >= 500 && r.status !== 503) { level = "warn"; why = `موقعهم فيه عطل (${r.status})`; }
      out.push({ url, pages: [...pages].slice(0, 3), status: r.status, error: r.error || "", level, why });
    }
  }));
  return out;
}
