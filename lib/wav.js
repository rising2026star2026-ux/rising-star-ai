// قراءة وكتابة وضم ملفات WAV (PCM). بنستخدمها لأن الصوت المعبّر بيرجع WAV، والكتاب بيتجمّع من فقرات.
// دوال صافية على Uint8Array، بتشتغل في المتصفح والسيرفر.

const u32 = (b, o) => (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0;
const u16 = (b, o) => b[o] | (b[o + 1] << 8);
const tag = (b, o) => String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]);

/** بيرجّع { sampleRate, channels, bits, pcm } أو null لو الملف مش WAV بصيغة PCM مفهومة */
export function parseWav(input) {
  const b = input instanceof Uint8Array ? input : new Uint8Array(input);
  if (b.length < 44 || tag(b, 0) !== "RIFF" || tag(b, 8) !== "WAVE") return null;
  let fmt = null;
  let p = 12;
  while (p + 8 <= b.length) {
    const id = tag(b, p);
    let size = u32(b, p + 4);
    const body = p + 8;
    if (id === "fmt " && body + 16 <= b.length) {
      fmt = { format: u16(b, body), channels: u16(b, body + 2), sampleRate: u32(b, body + 4), bits: u16(b, body + 14) };
    } else if (id === "data") {
      // ملفات الستريمنج بتكتب الحجم صفر أو أقصى قيمة، فبنقرا لحد آخر الملف
      if (size === 0 || size === 0xffffffff || body + size > b.length) size = b.length - body;
      if (!fmt || fmt.format !== 1) return null;
      return { sampleRate: fmt.sampleRate, channels: fmt.channels, bits: fmt.bits, pcm: b.subarray(body, body + size) };
    }
    p = body + size + (size % 2);
  }
  return null;
}

/** PCM خام (16 بت) → ملف WAV */
export function pcmToWav(pcm, sampleRate = 24000, channels = 1, bits = 16) {
  const out = new Uint8Array(44 + pcm.length);
  const v = new DataView(out.buffer);
  const str = (o, s) => { for (let i = 0; i < s.length; i++) out[o + i] = s.charCodeAt(i); };
  str(0, "RIFF"); v.setUint32(4, 36 + pcm.length, true); str(8, "WAVE"); str(12, "fmt ");
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, channels, true);
  v.setUint32(24, sampleRate, true); v.setUint32(28, (sampleRate * channels * bits) / 8, true);
  v.setUint16(32, (channels * bits) / 8, true); v.setUint16(34, bits, true);
  str(36, "data"); v.setUint32(40, pcm.length, true);
  out.set(pcm, 44);
  return out;
}

/** بيضم كذا ملف WAV بنفس الصيغة في ملف واحد، وبيحط صمت (ثواني) بينهم لو طلبت */
export function joinWavs(list, gapSeconds = 0) {
  const parsed = list.map((x) => parseWav(x));
  if (!parsed.length || parsed.some((x) => !x)) throw new Error("ملف صوت مش مفهوم.");
  const { sampleRate, channels, bits } = parsed[0];
  if (parsed.some((x) => x.sampleRate !== sampleRate || x.channels !== channels || x.bits !== bits)) throw new Error("ملفات الصوت مختلفة في الصيغة.");
  const frame = (channels * bits) / 8;
  const gap = new Uint8Array(Math.round(gapSeconds * sampleRate) * frame);
  const total = parsed.reduce((a, x) => a + x.pcm.length, 0) + gap.length * (parsed.length - 1);
  const pcm = new Uint8Array(total);
  let o = 0;
  parsed.forEach((x, i) => {
    pcm.set(x.pcm, o);
    o += x.pcm.length;
    if (i < parsed.length - 1) o += gap.length;
  });
  return pcmToWav(pcm, sampleRate, channels, bits);
}

export function wavSeconds(input) {
  const w = parseWav(input);
  return w ? w.pcm.length / ((w.sampleRate * w.channels * w.bits) / 8) : 0;
}
