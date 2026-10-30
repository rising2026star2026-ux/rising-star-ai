import fs from "node:fs";
import { execSync } from "node:child_process";
fs.mkdirSync("ci", { recursive: true });
execSync("npm i --no-save --no-audit --no-fund edge-tts 2>&1 | tail -2", { stdio: "inherit" });
try {
  const m = await import("edge-tts");
  console.log("exports", Object.keys(m).join(","));
} catch (e) { console.log("import err", e.message); }
// الاختبار بالـCLI الرسمي للمكتبة: صوت مصري
for (const v of ["ar-EG-SalmaNeural", "ar-EG-ShakirNeural"]) {
  try {
    const out = execSync(`npx --no-install edge-tts --voice ${v} --text "ازيك يا صاحبي، النهارده هنتكلم عن القهوة" --write-media ci/${v}.mp3 2>&1 || true`, { encoding: "utf8", timeout: 60000 });
    console.log(v, out.slice(0, 300), fs.existsSync(`ci/${v}.mp3`) ? fs.statSync(`ci/${v}.mp3`).size + " bytes" : "NO FILE");
  } catch (e) { console.log(v, "err", String(e.message).slice(0, 200)); }
}
// فحص CORS لسيرفر فيديوهات Pexels (من صفحة عامة)
try {
  const r = await fetch("https://videos.pexels.com/", { method: "HEAD" });
  console.log("pexels cdn", r.status, r.headers.get("access-control-allow-origin"));
} catch (e) { console.log("pexels err", e.message); }
