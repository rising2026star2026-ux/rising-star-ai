import fs from "fs";
fs.mkdirSync("ci/cn", { recursive: true });
const BASE = "https://rising-star-ai.vercel.app";
const bots = ["qwen-27b", "minimax", "kimi-k2", "qwen3-32b", "kimi", "deepseek", "qwen-max", "glm", "deepseek-r", "qwen-coder", "ernie", "hunyuan"];
const res = [];
for (const bot of bots) {
  const t0 = Date.now();
  try {
    const r = await fetch(BASE + "/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bot, model: "balanced", messages: [{ role: "user", content: "اشرحلي في جملتين بالمصري: يعني إيه ضريبة القيمة المضافة؟" }] }),
      signal: AbortSignal.timeout(60000),
    });
    const text = await r.text();
    res.push({ bot, status: r.status, ms: Date.now() - t0, xbot: r.headers.get("x-bot"), len: text.length, head: text.slice(0, 260).replace(/\s+/g, " ") });
  } catch (e) { res.push({ bot, error: String(e).slice(0, 120), ms: Date.now() - t0 }); }
}
const out = await fetch(BASE + "/models").then((r) => r.status).catch(() => "err");
fs.writeFileSync("ci/cn/info.json", JSON.stringify({ models_page: out, res }, null, 1));
