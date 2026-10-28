const r = await fetch("https://text.pollinations.ai/openai", {
  method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ model: "openai", stream: true, messages: [{ role: "user", content: "Count 1 to 5, one number per line." }] }),
  signal: AbortSignal.timeout(20000),
});
console.log("status", r.status, r.headers.get("content-type"));
const reader = r.body.getReader(); const dec = new TextDecoder();
let out = ""; let n = 0;
while (n < 40) {
  const { done, value } = await reader.read();
  if (done) break;
  out += dec.decode(value, { stream: true });
  n++;
}
console.log("chunks read:", n);
console.log("raw sample:", JSON.stringify(out.slice(0, 500)));
