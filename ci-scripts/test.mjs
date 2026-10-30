import fs from "node:fs";
import { execSync } from "node:child_process";
fs.mkdirSync("ci", { recursive: true });
const sh = (c) => { try { return execSync(c + " 2>&1", { encoding: "utf8", timeout: 90000 }); } catch (e) { return "ERR " + String(e.stdout || e.message).slice(0, 400); } };
console.log(sh("pip install --quiet edge-tts | tail -1"));
console.log(sh("python3 -m edge_tts --list-voices | grep -i 'ar-EG'"));
for (const v of ["ar-EG-SalmaNeural", "ar-EG-ShakirNeural"]) {
  console.log(v, sh(`python3 -m edge_tts --voice ${v} --text "ازيك يا صاحبي، النهارده هنتكلم عن القهوة وازاي نعملها صح" --write-media ci/${v}.mp3 --write-subtitles ci/${v}.vtt`), fs.existsSync(`ci/${v}.mp3`) ? fs.statSync(`ci/${v}.mp3`).size + " bytes" : "NO FILE");
}
console.log(sh("head -c 600 ci/ar-EG-SalmaNeural.vtt"));
console.log("npm edge-tts pkg:", sh("npm view edge-tts version description license main types 2>&1 | head -8"));
console.log("alt npm:", sh("npm view node-edge-tts version license 2>&1 | head -3"), sh("npm view msedge-tts version license 2>&1 | head -3"));
