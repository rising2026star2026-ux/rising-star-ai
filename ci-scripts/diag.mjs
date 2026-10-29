import fs from "node:fs";
const png = "data:image/png;base64," + fs.readFileSync("ci-scripts/sample.png").toString("base64");
const msg = [{ role: "user", content: [{ type: "text", text: "Read the text in the image." }, { type: "image_url", image_url: { url: png } }] }];
const show = (t, r, body) => console.log(t, r.status, String(body).slice(0, 300).replace(/\s+/g, " "));
async function chat(name, url, key, model, extra = {}) {
  try {
    const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" }, body: JSON.stringify({ model, messages: msg, max_tokens: 200, ...extra }) });
    show(name + " " + model, r, await r.text());
  } catch (e) { console.log(name, model, "ERR", e.message); }
}
const G = process.env.GROQ_API_KEY, GM = process.env.GEMINI_API_KEY, OR = process.env.OPENROUTER_API_KEY;
if (G) {
  const r = await fetch("https://api.groq.com/openai/v1/models", { headers: { Authorization: `Bearer ${G}` } });
  const j = await r.json().catch(() => ({}));
  console.log("GROQ models:", (j.data || []).map((m) => m.id).join(", "));
  for (const m of ["meta-llama/llama-4-scout-17b-16e-instruct", "meta-llama/llama-4-maverick-17b-128e-instruct"]) await chat("groq", "https://api.groq.com/openai/v1/chat/completions", G, m);
}
if (GM) {
  const r = await fetch("https://generativelanguage.googleapis.com/v1beta/models?pageSize=100", { headers: { "x-goog-api-key": GM } });
  const j = await r.json().catch(() => ({}));
  console.log("GEMINI models:", (j.models || []).map((m) => m.name.replace("models/", "")).filter((n) => /flash|pro/.test(n)).join(", "));
  for (const m of ["gemini-2.5-flash", "gemini-2.5-flash-lite", "gemini-3-flash-preview"]) await chat("gemini", "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", GM, m);
}
if (OR) for (const m of ["google/gemma-3-27b-it:free", "meta-llama/llama-4-scout:free", "qwen/qwen2.5-vl-72b-instruct:free", "mistralai/mistral-small-3.2-24b-instruct:free"]) await chat("openrouter", "https://openrouter.ai/api/v1/chat/completions", OR, m);
for (const m of ["openai", "openai-large", "gemini"]) {
  try {
    const r = await fetch("https://text.pollinations.ai/openai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ model: m, messages: msg, max_tokens: 200 }) });
    show("pollinations " + m, r, await r.text());
  } catch (e) { console.log("pollinations", m, "ERR", e.message); }
}
