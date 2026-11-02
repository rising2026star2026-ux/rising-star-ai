// مولد الأصوات والكتاب المسموع: اللهجات والأصوات والنبرات وتقسيم النصوص الطويلة لفقرات.
// دوال صافية، بتتستخدم في السيرفر (/api/speak) وفي الواجهة، فالقوائم دي هي المرجع الوحيد للأصوات والنبرات.

/** اللهجات. كل لهجة فيها صوت أنثى (f) وصوت ذكر (m) من أصوات Microsoft Edge العصبية. */
export const DIALECTS = [
  { id: "eg", name: "مصري", voices: { f: "ar-EG-SalmaNeural", m: "ar-EG-ShakirNeural" } },
  { id: "sa", name: "سعودي", voices: { f: "ar-SA-ZariyahNeural", m: "ar-SA-HamedNeural" } },
];

export const GENDERS = [["f", "أنثى"], ["m", "ذكر"]];

export const VOICE_IDS = new Set(DIALECTS.flatMap((d) => Object.values(d.voices)));

export function voiceFor(dialect, gender) {
  const d = DIALECTS.find((x) => x.id === dialect) || DIALECTS[0];
  return d.voices[gender === "m" ? "m" : "f"];
}

/**
 * النبرات: كل نبرة فرق في سرعة الإلقاء (%) ودرجة الصوت (هرتز) وعلوّه (%) عن الصوت العادي.
 * الأصوات الجاهزة مالهاش أعمار ولا مشاعر حقيقية، فالنبرات دي تقريب بتغيير الدرجة والسرعة بس.
 */
export const TONES = {
  normal: { name: "عادي", rate: 0, pitch: 0, volume: 0 },
  calm: { name: "هادئ", rate: -12, pitch: -4, volume: -8 },
  narrator: { name: "راوي", rate: -10, pitch: -6, volume: 0 },
  strong: { name: "قوي", rate: -5, pitch: -14, volume: 25 },
  sharp: { name: "حاد", rate: 8, pitch: 20, volume: 10 },
  excited: { name: "حماسي", rate: 16, pitch: 10, volume: 20 },
  sad: { name: "حزين", rate: -24, pitch: -10, volume: -15 },
  child: { name: "طفل (تقريبي)", rate: 8, pitch: 50, volume: 0, approx: true },
};

export const MAX_PITCH_ADJUST = 30; // أقصى تعديل يدوي في درجة الصوت (هرتز)
export const MAX_CHARS_PER_REQUEST = 600;

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const signed = (n) => `${n >= 0 ? "+" : "-"}${Math.abs(Math.round(n))}`;

/** قيم SSML الجاهزة لنبرة معينة، مع تعديل يدوي اختياري في الدرجة. أي قيمة غريبة بتتحوّل لحد آمن. */
export function prosodyFor(tone, pitchAdjust = 0) {
  const t = TONES[tone] || TONES.normal;
  const adj = clamp(Number.isFinite(+pitchAdjust) ? +pitchAdjust : 0, -MAX_PITCH_ADJUST, MAX_PITCH_ADJUST);
  return {
    rate: `${signed(clamp(t.rate, -50, 50))}%`,
    pitch: `${signed(clamp(t.pitch + adj, -80, 80))}Hz`,
    volume: `${signed(clamp(t.volume, -50, 50))}%`,
  };
}

/* ============ تنضيف وتقسيم النص ============ */

const PAGE_MARK = /^\s*---\s*صفحة\s*\d+\s*---\s*$/gm; // علامات الصفحات اللي بيحطها قارئ الملفات
// عنوان فصل: «الفصل الأول»، «الباب 3»، «الجزء الثاني: ...»، أو كلمة لوحدها زي «المقدمة». جملة عادية بتبدأ بـ«الجزء الأكبر...» مش عنوان.
const ORD = "(?:\\d+|[\u0660-\u0669]+|[IVXLC]+|(?:ال)?(?:أول|اول|ثاني|ثالث|رابع|خامس|سادس|سابع|ثامن|تاسع|عاشر)[ةى]?|(?:ال)?(?:حادي|ثاني|ثالث|رابع|خامس|سادس|سابع|ثامن|تاسع)\\s+عشر[ةى]?|(?:ال)?(?:عشرون|ثلاثون|أربعون|اربعون|خمسون))";
const HEADING_NUM = new RegExp(`^\\s*(?:الفصل|فصل|الباب|باب|الجزء|جزء|القسم|قسم|chapter|part)\\s+${ORD}(?:\\s*[:\\-–—.]\\s*.{0,60}|\\s+.{0,60})?$`, "iu");
const HEADING_WORD = /^\s*(?:المقدمة|مقدمة|الخاتمة|خاتمة|تمهيد|الإهداء|إهداء|الفهرس|فهرس)\s*(?:[:\-–—]\s*.{0,40})?$/u;
const isHeading = (l) => l.length <= 80 && (HEADING_WORD.test(l) || (HEADING_NUM.test(l) && (l.length <= 30 || !/[.!?؟،]$/.test(l))));

export function cleanForSpeech(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(PAGE_MARK, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F​-‏‪-‮⁦-⁩﻿]/g, "")
    .replace(/https?:\/\/\S+/gi, "رابط")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** يقسّم جملة طويلة على الفواصل ثم على الكلمات لحد ما كل جزء يبقى في الحد. */
function breakLong(s, max) {
  const out = [];
  let rest = s.trim();
  while (rest.length > max) {
    let cut = -1;
    for (const re of [/[،,:؛;]\s/g, /\s/g]) {
      re.lastIndex = 0;
      let m;
      while ((m = re.exec(rest)) && m.index + 1 <= max) cut = m.index + m[0].length;
      if (cut > max * 0.4) break;
      cut = -1;
    }
    if (cut <= 0) cut = max; // كلمة واحدة طويلة جداً
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

const END_MARK = /[.!?؟…؛:"”»)\]،,]$/;

/**
 * يقسّم النص لفقرات صوت (كل فقرة أقل من max حرف) بدون ما يكسر جملة لو ممكن.
 * بيرجّع { chunks: [{ t, heading }], chapters: [{ title, chunk }] }
 * فقرات الكتاب المنسوخة من PDF بتيجي بسطور مكسورة، فالسطر الواحد بيتعامل كمسافة، والسطر الفاضي هو بداية فقرة.
 */
export function splitText(text, max = 450) {
  const paras = [];
  let buf = [];
  const flush = () => { if (buf.length) { paras.push({ t: buf.join(" ").replace(/\s+/g, " ").trim() }); buf = []; } };
  for (const line of cleanForSpeech(text).split("\n")) {
    const l = line.trim();
    if (!l) flush();
    else if (isHeading(l)) { flush(); paras.push({ t: l, heading: l }); }
    else buf.push(l);
  }
  flush();

  const chunks = [];
  const chapters = [];
  let cur = "";
  const push = () => { if (cur.trim()) chunks.push({ t: cur.trim() }); cur = ""; };
  for (const p of paras) {
    if (!p.t) continue;
    if (p.heading) {
      push();
      chapters.push({ title: p.heading, chunk: chunks.length });
      chunks.push({ t: END_MARK.test(p.t) ? p.t : `${p.t}.`, heading: p.heading });
      continue;
    }
    const body = END_MARK.test(p.t) ? p.t : `${p.t}.`;
    const sentences = body.split(/(?<=[.!?؟…؛])\s+/).flatMap((s) => (s.length > max ? breakLong(s, max) : [s]));
    for (const s of sentences) {
      if (cur && cur.length + 1 + s.length > max) push();
      cur = cur ? `${cur} ${s}` : s;
    }
  }
  push();
  return { chunks, chapters };
}

/** مدة القراءة التقريبية بالثواني (حوالي 14 حرف في الثانية بالعربي). */
export const estimateSeconds = (chars) => Math.round(chars / 14);

export function formatDuration(sec) {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  if (h) return `${h} ساعة${m ? ` و${m} دقيقة` : ""}`;
  if (m) return `${m} دقيقة`;
  return `${s} ثانية`;
}

/** بصمة بسيطة للنص، عشان نفتكر آخر مكان وقف عنده القارئ من غير ما نخزّن الكتاب نفسه. */
export function bookId(text) {
  const s = `${text.length}:${text.slice(0, 400)}`;
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}
