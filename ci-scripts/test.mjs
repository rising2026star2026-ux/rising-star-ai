const L = "https://rising-star-ai.vercel.app";
for (let i = 0; i < 3; i++) {
  const t0 = Date.now();
  const r = await fetch(L + "/api/tts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: "أهلاً بيك في رايزنج ستار، النهارده هنعمل فيديو عن القهوة", voice: i === 1 ? "ar-EG-ShakirNeural" : "ar-EG-SalmaNeural" }) });
  const buf = Buffer.from(await r.arrayBuffer());
  console.log("LIVE TTS", r.status, r.headers.get("content-type"), buf.length, "bytes", Date.now() - t0, "ms", r.status !== 200 ? buf.toString().slice(0, 200) : "");
}
const p = await fetch(L + "/api/pexels?q=coffee");
console.log("LIVE PEXELS", p.status, (await p.text()).slice(0, 300));
const v = await fetch(L + "/api/vscript", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ topic: "فوايد المشي" }) });
console.log("LIVE VSCRIPT", v.status, (await v.text()).slice(0, 300));
const t = await fetch(L + "/tool/video-factory");
console.log("LIVE PAGE", t.status);
