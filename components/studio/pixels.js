// تعديل ألوان الصورة بكسل بكسل. بنعملها بنفسنا بدل فلاتر المتصفح
// عشان النتيجة تطلع واحدة على كل المتصفحات (سفاري قديماً مكانش بيدعم فلاتر الكانفاس).

export const NEUTRAL = { brightness: 100, contrast: 100, saturate: 100, warmth: 0, hue: 0, grayscale: 0, sepia: 0, blur: 0 };

export function isNeutral(f) {
  return Object.keys(NEUTRAL).every((k) => f[k] === NEUTRAL[k]);
}

const I = () => [1, 0, 0, 0, 1, 0, 0, 0, 1];

function mul(a, b) {
  // a × b (مصفوفات 3×3)
  const r = new Array(9);
  for (let i = 0; i < 3; i++)
    for (let j = 0; j < 3; j++)
      r[i * 3 + j] = a[i * 3] * b[j] + a[i * 3 + 1] * b[3 + j] + a[i * 3 + 2] * b[6 + j];
  return r;
}

function saturateM(s) {
  return [
    0.213 + 0.787 * s, 0.715 - 0.715 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 + 0.285 * s, 0.072 - 0.072 * s,
    0.213 - 0.213 * s, 0.715 - 0.715 * s, 0.072 + 0.928 * s,
  ];
}

function hueM(deg) {
  const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a);
  return [
    0.213 + c * 0.787 - s * 0.213, 0.715 - c * 0.715 - s * 0.715, 0.072 - c * 0.072 + s * 0.928,
    0.213 - c * 0.213 + s * 0.143, 0.715 + c * 0.285 + s * 0.14, 0.072 - c * 0.072 - s * 0.283,
    0.213 - c * 0.213 - s * 0.787, 0.715 - c * 0.715 + s * 0.715, 0.072 + c * 0.928 + s * 0.072,
  ];
}

function mix(m, amount) {
  const id = I();
  return m.map((v, i) => id[i] * (1 - amount) + v * amount);
}

const GRAY = [0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722, 0.2126, 0.7152, 0.0722];
const SEPIA = [0.393, 0.769, 0.189, 0.349, 0.686, 0.168, 0.272, 0.534, 0.131];

/** يطبق التعديلات على ImageData مباشرة */
export function applyAdjust(imageData, f) {
  const b = f.brightness / 100;
  const c = f.contrast / 100;
  let M = I();
  M = mul(saturateM(f.saturate / 100), M);
  if (f.hue) M = mul(hueM(f.hue), M);
  if (f.grayscale) M = mul(mix(GRAY, f.grayscale / 100), M);
  if (f.sepia) M = mul(mix(SEPIA, f.sepia / 100), M);

  // v → (v×b − 128)×c + 128 ثم المصفوفة، ثم الدفء
  const k = b * c;
  const off = 128 * (1 - c);
  const o0 = (M[0] + M[1] + M[2]) * off;
  const o1 = (M[3] + M[4] + M[5]) * off;
  const o2 = (M[6] + M[7] + M[8]) * off;
  const w = f.warmth * 0.9;

  const d = imageData.data;
  for (let i = 0; i < d.length; i += 4) {
    const r = d[i] * k, g = d[i + 1] * k, bl = d[i + 2] * k;
    d[i] = M[0] * r + M[1] * g + M[2] * bl + o0 + w;
    d[i + 1] = M[3] * r + M[4] * g + M[5] * bl + o1 + w * 0.2;
    d[i + 2] = M[6] * r + M[7] * g + M[8] * bl + o2 - w;
  }
  return imageData; // Uint8ClampedArray بيقص القيم لوحده بين 0 و255
}

export function canBlur(ctx) {
  return typeof ctx.filter === "string";
}
