// مؤثرات صوتية ومزيكا خلفية بتتولّد بالكود نفسه (مطر، رياح، موج، نار، ليل، مزيكا هادية)، من غير أي ملفات خارجية ولا مشاكل حقوق.
// كل نوع بيرجّع مقطع قصير بيتكرر من غير فاصل ملحوظ، والواجهة بتشغّله في حلقة تحت الصوت أو بتدمجه في الملف المصدّر.

export const AMBIENCE = [
  ["none", "بدون"],
  ["rain", "مطر"],
  ["wind", "رياح"],
  ["waves", "موج البحر"],
  ["fire", "نار هادية"],
  ["night", "ليل وصراصير"],
  ["calm", "مزيكا هادية"],
  ["warm", "مزيكا دافئة"],
];

export const AMBIENCE_KINDS = new Set(AMBIENCE.map(([k]) => k).filter((k) => k !== "none"));

function rng(seed) {
  let a = (seed >>> 0) || 1;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const TAU = Math.PI * 2;
const lowpassCoef = (hz, sr) => 1 - Math.exp((-TAU * hz) / sr);

/** ضوضا بيضا بعد فلتر تمرير حزمة: الواطي بيتشال بفلتر واحد، والعالي بفلترين متتاليين عشان الحافة تبقى حادة */
function bandNoise(n, sr, rand, lo, hi) {
  const out = new Float32Array(n);
  const aLo = lowpassCoef(lo, sr), aHi = lowpassCoef(hi, sr);
  let l = 0, h1 = 0, h2 = 0;
  for (let i = 0; i < n; i++) {
    const x = rand() * 2 - 1;
    l += aLo * (x - l);
    h1 += aHi * (x - l - h1);
    h2 += aHi * (h1 - h2);
    out[i] = h2 * 2.2;
  }
  return out;
}

function brownNoise(n, rand, leak = 0.998) {
  const out = new Float32Array(n);
  let y = 0;
  for (let i = 0; i < n; i++) { y = y * leak + (rand() * 2 - 1) * 0.1; out[i] = y; }
  return out;
}

/** أول F عينة بتتمزج مع الذيل الزايد عن الطول، فبداية المقطع بتكمّل نهايته بالظبط */
function makeLoop(buf, n, fade) {
  const out = buf.slice(0, n);
  for (let i = 0; i < fade; i++) {
    const th = ((i + 0.5) / fade) * (Math.PI / 2);
    out[i] = buf[i] * Math.sin(th) + buf[n + i] * Math.cos(th);
  }
  return out;
}

/** بيضيف حدث قصير (طقطقة، نقطة مطر) بشكل دائري عشان يفضل الحلقة سليمة. lp قريب من 1 = صوت حاد، وقريب من 0 = صوت دافي */
function addBurst(out, at, len, amp, rand, decay, lp) {
  const n = out.length;
  let y = 0;
  for (let k = 0; k < len; k++) {
    y += lp * (rand() * 2 - 1 - y);
    out[(at + k) % n] += y * amp * Math.exp((-k / len) * decay);
  }
}

function normalizeRms(a, target) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * a[i];
  const rms = Math.sqrt(s / a.length) || 1;
  const g = target / rms;
  for (let i = 0; i < a.length; i++) a[i] = Math.tanh(a[i] * g) * 0.98; // tanh بيمنع أي قمة من إنها تعدّي الحد من غير ما يقطّع الصوت
  return a;
}

/* ============ الأنواع ============ */

function rain(sr, rand) {
  const n = sr * 24, fade = Math.round(sr * 2);
  const bed = bandNoise(n + fade, sr, rand, 700, 7500);
  // الدورات كلها أعداد صحيحة في المقطع، فمستوى الصوت عند الوصلة بيكمّل نفسه
  for (let i = 0; i < bed.length; i++) bed[i] *= 0.8 + 0.2 * Math.sin((TAU * 3 * i) / n);
  const out = makeLoop(bed, n, fade);
  const drops = 24 * 150;
  for (let d = 0; d < drops; d++) addBurst(out, Math.floor(rand() * n), Math.round(sr * (0.002 + rand() * 0.006)), 0.15 + rand() * 0.5, rand, 5, 0.85);
  return out;
}

function wind(sr, rand) {
  const n = sr * 24, fade = Math.round(sr * 2);
  const rumble = bandNoise(n + fade, sr, rand, 50, 260);
  const body = bandNoise(n + fade, sr, rand, 180, 1300);
  const hiss = bandNoise(n + fade, sr, rand, 1300, 4200);
  const ph = [rand() * TAU, rand() * TAU, rand() * TAU];
  const out = new Float32Array(n + fade);
  for (let i = 0; i < out.length; i++) {
    // هبّات بدورات صحيحة في المقطع (2 و4 و9)، فالوصلة سليمة
    const gust = 0.5 + 0.5 * (0.5 * Math.sin((TAU * 2 * i) / n + ph[0]) + 0.3 * Math.sin((TAU * 4 * i) / n + ph[1]) + 0.2 * Math.sin((TAU * 9 * i) / n + ph[2]));
    const g = 0.2 + 0.8 * gust * gust;
    out[i] = (rumble[i] * 2.4 + body[i] * 2.0 * g + hiss[i] * 0.35 * g * g) * (0.35 + 0.65 * g);
  }
  return makeLoop(out, n, fade);
}

function waves(sr, rand) {
  const n = sr * 28, fade = Math.round(sr * 2);
  const k = 3; // 3 موجات في المقطع، فالإيقاع ملحوظ وبيكمّل نفسه بالظبط
  const low = bandNoise(n + fade, sr, rand, 60, 900);
  const foam = bandNoise(n + fade, sr, rand, 1500, 6500);
  const ph = rand() * TAU;
  for (let i = 0; i < low.length; i++) {
    const swell = (1 + Math.sin((TAU * k * i) / n + ph)) / 2;
    const crest = (1 + Math.sin((TAU * k * i) / n + ph - 0.9)) / 2;
    low[i] = low[i] * (0.15 + 0.85 * swell * swell) * 2.2 + foam[i] * crest ** 3 * 0.9;
  }
  return makeLoop(low, n, fade);
}

function fire(sr, rand) {
  const n = sr * 24, fade = Math.round(sr * 2);
  const rumble = bandNoise(n + fade, sr, rand, 40, 420);
  for (let i = 0; i < rumble.length; i++) rumble[i] *= 0.7 + 0.3 * Math.sin((TAU * 8 * i) / n);
  const out = makeLoop(rumble, n, fade);
  for (let i = 0; i < out.length; i++) out[i] *= 0.6;
  const cracks = 24 * 28;
  for (let c = 0; c < cracks; c++) {
    const big = rand() ** 6; // أغلبها صغير وقليل منها عالي
    addBurst(out, Math.floor(rand() * n), Math.round(sr * (0.0015 + rand() * 0.012)), 0.1 + big * 2.2, rand, 4, 0.22 + rand() * 0.2);
  }
  return out;
}

function night(sr, rand) {
  const n = sr * 24, fade = Math.round(sr * 2);
  const air = bandNoise(n + fade, sr, rand, 200, 2500);
  const out = makeLoop(air, n, fade);
  for (let i = 0; i < out.length; i++) out[i] *= 0.07;
  const crickets = [{ f: 4300, every: 0.78, pulses: 4 }, { f: 4650, every: 0.93, pulses: 5 }, { f: 3950, every: 1.21, pulses: 3 }];
  for (const c of crickets) {
    const groups = Math.floor(24 / c.every);
    const off = Math.floor(rand() * sr * c.every);
    for (let g = 0; g < groups; g++) {
      const start = Math.floor(g * c.every * sr) + off;
      const amp = 0.18 + rand() * 0.1;
      for (let p = 0; p < c.pulses; p++) {
        const ps = start + Math.floor(p * sr * 0.034);
        const len = Math.floor(sr * 0.022);
        for (let k = 0; k < len; k++) {
          const env = Math.sin((Math.PI * k) / len) ** 2;
          out[(ps + k) % n] += Math.sin((TAU * c.f * k) / sr) * env * amp;
        }
      }
    }
  }
  return out;
}

/**
 * مزيكا: توافيق على شكل بساط صوتي ناعم. ترددات كل نغمة مظبوطة على مضاعفات 1/المدة،
 * فكل موجة بتكمّل عدد صحيح من الدورات في المقطع، والتكرار بيبقى بدون أي فاصل.
 */
function pad(sr, chords, slot, harm, tremCycles) {
  const T = slot * chords.length;
  const n = Math.round(sr * T);
  const out = new Float32Array(n);
  const q = (f) => Math.max(1, Math.round(f * T)) / T;
  const tremolo = (i) => 1 + 0.12 * Math.sin((TAU * tremCycles * i) / n);
  chords.forEach((notes, ci) => {
    const center = (ci + 0.5) / chords.length;
    for (const [fi, f0] of notes.entries()) {
      const detune = [0, 9 / T]; // فرق صغير بيدي دفء، ومضاعف لـ 1/T فالتكرار يفضل سليم
      for (const dt of detune) {
        const f = q(f0) + dt;
        for (let i = 0; i < n; i++) {
          // نافذة دائرية عريضة: كل وتر بيطلع وينزل ببطء ويتداخل مع اللي بعده
          let d = Math.abs(i / n - center);
          d = Math.min(d, 1 - d) * chords.length; // بوحدات الخانة
          const w = d < 1 ? 0.5 + 0.5 * Math.cos(Math.PI * d) : 0;
          if (w === 0) continue;
          const t = i / sr;
          let s = Math.sin(TAU * f * t);
          for (let h = 0; h < harm.length; h++) s += harm[h] * Math.sin(TAU * f * (h + 2) * t);
          out[i] += s * w * (fi === 0 ? 0.9 : 0.6) * tremolo(i);
        }
      }
    }
  });
  return out;
}

const CALM = [
  [110, 220, 261.63, 329.63],   // Am
  [87.31, 174.61, 220, 261.63], // F
  [130.81, 261.63, 329.63, 392], // C
  [98, 196, 246.94, 293.66],    // G
];
const WARM = [
  [65.41, 130.81, 196, 246.94, 329.63],  // Cmaj7
  [55, 110, 164.81, 220, 261.63],        // Am7
  [87.31, 174.61, 220, 261.63, 329.63],  // Fmaj7
  [98, 196, 246.94, 293.66, 349.23],     // G6
];

const BUILDERS = {
  rain, wind, waves, fire, night,
  calm: (sr) => pad(sr, CALM, 8, [0.18, 0.06], 4),
  warm: (sr) => pad(sr, WARM, 10, [0.32, 0.14, 0.06], 5),
};
const TARGET_RMS = { rain: 0.11, wind: 0.11, waves: 0.11, fire: 0.1, night: 0.08, calm: 0.09, warm: 0.09 };

// المزيكا ترددها كله تحت 2 كيلوهرتز، فبنولّدها بتردد عينات أقل (أسرع بكتير على الموبايل). المتصفح بيرفعها لتردد الصوت لوحده.
const MUSIC_RATE = 8000;

/** بيرجّع { samples: Float32Array أحادي القناة جاهز للتكرار, sampleRate }. seed بيثبّت النتيجة (نفس الرقم = نفس الصوت). */
export function renderAmbience(kind, sampleRate = 24000, seed = 7) {
  if (!AMBIENCE_KINDS.has(kind)) throw new Error("نوع مؤثر غير معروف");
  const sr = kind === "calm" || kind === "warm" ? Math.min(sampleRate, MUSIC_RATE) : sampleRate;
  return { samples: normalizeRms(BUILDERS[kind](sr, rng(seed)), TARGET_RMS[kind]), sampleRate: sr };
}

/** ملف WAV (16 بت، قناة واحدة) من عينات Float32 */
export function encodeWav(samples, sampleRate) {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  str(0, "RIFF"); v.setUint32(4, 36 + n * 2, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, sampleRate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  str(36, "data"); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) {
    const x = Math.max(-1, Math.min(1, samples[i]));
    v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true);
  }
  return buf;
}
