// فحص معيار الكلام (docs/voice.md): بيدوّر على كلمات الشارع جوه النصوص اللي في الكود (مش التعليقات).
// التشغيل: node scripts/voicecheck.mjs   (بيطلع بكود 1 لو لقى حاجة)
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const BANNED = [
  [/شغلان[ةه]/, "مهمة / عمل / نشاط"],
  [/زباين|زبون|زبونة/, "عميل / عملاء"],
  [/(^|[\s«"'(])[يتب]?[يت]?شدّ?(\s|$|[،.!؟»"'])/, "يجذب / تجذب"],
  [/بتاعك|بتاعتك|بتاعكم/, "الضمير المتصل (متصفحك، قرارك)"],
  [/على قدك/, "يناسب ميزانيتك"],
  [/يا (صاحبي|باشا|معلم|كبير)/, "من غير نداء"],
  [/اتنصب عليك|هيتنصب/, "اتعرّض للنصب"],
  [/يلف على|ألف المواقع|بدل ما يلف/, "يتنقل بين"],
];
// الكلمات دي مسموحة جوه قوايم كشف النصب (بتدوّر على كلام المستخدم نفسه)، وفي سطر «ممنوع ألفاظ الشارع» اللي بيعلّم المساعد يتجنبها
const SKIP_FILES = [/lib[\\/]scamscan\.js$/];
const ALLOW_LINE = /ممنوع ألفاظ الشارع/;

const files = [];
const walk = (d) => {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { if (f !== "node_modules" && !f.startsWith(".")) walk(p); }
    else if (/\.(js|jsx)$/.test(f) && !SKIP_FILES.some((r) => r.test(p))) files.push(p);
  }
};
for (const d of ["app", "components", "lib"]) walk(d);

let hits = 0;
for (const p of files) {
  readFileSync(p, "utf8").split("\n").forEach((line, i) => {
    if (ALLOW_LINE.test(line)) return;
    const code = line.replace(/^\s*(\/\/|\*|\/\*).*$/, "").replace(/\s\/\/\s.*$/, "");
    for (const [re, fix] of BANNED) {
      if (re.test(code)) { hits++; console.log(`${p}:${i + 1}  «${code.trim().slice(0, 90)}»  ← ${fix}`); }
    }
  });
}
console.log(hits ? `\n${hits} موضع محتاج يتعدّل (انظر docs/voice.md)` : "معيار الكلام: تمام");
process.exit(hits ? 1 : 0);
