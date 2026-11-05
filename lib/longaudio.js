// التفريغ الطويل: دوال صافية للمتصفح والسيرفر.
// التسجيل بيتقسم في المتصفح لأجزاء (حوالي 100 ثانية) عند لحظات السكوت، وكل جزء بيتفرّغ لوحده،
// وبعدين المقاطع بتتجمع بتوقيتها الحقيقي (بداية الجزء + توقيت الجملة جوّاه).

export const RATE = 16000; // تردد الصوت اللي بيتبعت (كفاية للكلام وحجمه صغير)
export const CHUNK_SECONDS = 100; // طول الجزء: 100 ثانية × 16000 × 2 بايت = 3.2 ميجا (تحت حد Vercel)
export const MAX_MINUTES = 70;
export const MAX_FILE_MB = 300;
export const MAX_BODY = 4_200_000;

/** ثواني ← «1:02:05» أو «02:05» */
export function fmtTime(sec) {
  const t = Math.max(0, Number(sec) || 0);
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const p = (n) => String(n).padStart(2, "0");
  const base = h ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
  return base;
}

/** «MM:SS» أو «H:MM:SS» أو رقم ← ثواني */
export function parseTime(v) {
  if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
  const m = String(v ?? "").trim().match(/^(?:(\d+):)?(\d{1,2}):(\d{1,2})(?:[.,](\d+))?$/);
  if (m) return (Number(m[1] || 0) * 3600) + Number(m[2]) * 60 + Number(m[3]) + (m[4] ? Number(`0.${m[4]}`) : 0);
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

/**
 * بينضّف مقاطع جزء واحد: توقيت جوّه حدود الجزء، متكلم، نص. وبيرتبهم بالوقت.
 * offset = بداية الجزء في التسجيل كله، length = طول الجزء بالثواني.
 */
export function normalizeSegments(list, offset = 0, length = CHUNK_SECONDS) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list) {
    const text = clean(x?.text ?? x?.t, 2000);
    if (!text) continue;
    let st = parseTime(x?.start ?? x?.time);
    if (st == null || st > length + 5) st = out.length ? out[out.length - 1].start - offset : 0;
    st = Math.min(Math.max(0, st), length);
    const speaker = clean(x?.speaker ?? x?.s, 40) || "المتكلم 1";
    out.push({ start: offset + st, speaker, text });
  }
  out.sort((a, b) => a.start - b.start);
  return out.slice(0, 400);
}

/** بيضيف للمقاطع وقت النهاية (بداية اللي بعده، أو بداية + تقدير لو آخر واحد) */
export function withEnds(segs, total = 0) {
  return segs.map((x, i) => {
    const next = segs[i + 1]?.start;
    const guess = x.start + Math.min(20, Math.max(1.5, x.text.length / 13));
    let end = next != null ? Math.min(next, guess + 6) : guess;
    if (total) end = Math.min(end, total);
    return { ...x, end: Math.max(end, x.start + 0.8) };
  });
}

const nameOf = (names, sp) => (names && names[sp]) || sp;

export function toTxt(segs, names, title = "") {
  const body = segs.map((x) => `[${fmtTime(x.start)}] ${nameOf(names, x.speaker)}: ${x.text}`).join("\n\n");
  return title ? `${title}\n\n${body}` : body;
}

const srtTime = (t) => {
  const ms = Math.round(Math.max(0, t) * 1000);
  const p = (n, w = 2) => String(n).padStart(w, "0");
  return `${p(Math.floor(ms / 3600000))}:${p(Math.floor((ms % 3600000) / 60000))}:${p(Math.floor((ms % 60000) / 1000))},${p(ms % 1000, 3)}`;
};

export function toSrt(segs, names, total = 0) {
  return withEnds(segs, total).map((x, i) => `${i + 1}\n${srtTime(x.start)} --> ${srtTime(x.end)}\n${nameOf(names, x.speaker)}: ${x.text}\n`).join("\n");
}

/** المتكلمين بالترتيب اللي ظهروا بيه */
export function speakersOf(segs) {
  const seen = [];
  for (const x of segs) if (!seen.includes(x.speaker)) seen.push(x.speaker);
  return seen;
}

/**
 * نقطة القطع: أهدى لحظة (أقل طاقة في نافذة 0.25 ثانية) بين from و to (بالعينات).
 * عشان الجزء ما يقطعش كلمة في النص.
 */
export function quietCut(samples, from, to, rate = RATE) {
  const win = Math.round(rate * 0.25);
  let best = to;
  let bestE = Infinity;
  for (let i = Math.max(0, from); i + win <= Math.min(samples.length, to); i += Math.round(win / 2)) {
    let e = 0;
    for (let j = i; j < i + win; j += 4) e += samples[j] * samples[j];
    if (e < bestE) { bestE = e; best = i + Math.round(win / 2); }
  }
  return best;
}

/** بيقسم عينات الصوت (Float32 مونو) لحدود أجزاء [بداية، نهاية] */
export function planChunks(samples, rate = RATE, seconds = CHUNK_SECONDS) {
  const len = samples.length;
  const size = seconds * rate;
  const out = [];
  let a = 0;
  while (a < len) {
    if (len - a <= size + rate * 10) { out.push([a, len]); break; }
    const b = quietCut(samples, a + size - rate * 10, a + size, rate);
    out.push([a, b]);
    a = b;
  }
  return out;
}

/** Float32 ← WAV 16 بت مونو */
export function floatToWav(samples, rate = RATE) {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const w = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); w(8, "WAVE");
  w(12, "fmt "); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  w(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return new Uint8Array(buf);
}
