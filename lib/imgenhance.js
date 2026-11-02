// تحسين الصور بعد التوليد: كثافة ألوان وتباين وحدّة. دوال صافية على بيانات البكسل (RGBA)، فبتشتغل على ImageData في المتصفح
// وتتجرّب في Node. مفيش أي حاجة بتتبعت لسيرفر.
//
// الصور اللي بتطلع باهتة مشكلتها إن قيمها متجمّعة في نص المدى (من غير أسود عميق ولا أبيض ناصع) وألوانها قريبة من الرمادي.
// فبنوسّع المدى بمعامل واحد لكل القنوات (عشان ما يحصلش لون زايد)، ونزوّد التباين في الدرجات الوسطى،
// ونزوّد الألوان الباهتة أكتر من القوية (vibrance) مع حماية لدرجات البشرة.

const clamp8 = (v) => (v < 0 ? 0 : v > 255 ? 255 : v);
const luma = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

export function lumaHistogram(img) {
  const h = new Uint32Array(256);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) h[Math.round(luma(d[i], d[i + 1], d[i + 2]))]++;
  return h;
}

/** أول قيمة يتجمّع عندها نسبة p من البكسلات */
export function percentile(hist, total, p) {
  const target = total * p;
  let c = 0;
  for (let v = 0; v < 256; v++) {
    c += hist[v];
    if (c >= target) return v;
  }
  return 255;
}

/** أرقام للمقارنة قبل وبعد: متوسط التشبّع، ومدى الإضاءة (من 1% لـ99%)، ونسبة البكسلات المقصوصة */
export function stats(img) {
  const d = img.data;
  const n = d.length / 4;
  let sat = 0, lo = 0, hi = 0;
  for (let i = 0; i < d.length; i += 4) {
    const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
    sat += mx ? (mx - mn) / mx : 0;
    if (mn === 0) lo++;
    if (mx === 255) hi++;
  }
  const hist = lumaHistogram(img);
  const p1 = percentile(hist, n, 0.01), p99 = percentile(hist, n, 0.99);
  return { meanSat: sat / n, p1, p99, range: p99 - p1, clipLow: lo / n, clipHigh: hi / n };
}

function hueDeg(r, g, b, mx, mn) {
  const d = mx - mn;
  let h;
  if (mx === r) h = ((g - b) / d) % 6;
  else if (mx === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}

const smooth = (x) => x * x * (3 - 2 * x);

/**
 * يكثّف الألوان ويوسّع المدى. color من 0 لـ1 (0 = من غير تغيير). بيعدّل img.data مباشرة وبيرجّعها.
 */
export function autoColor(img, { color = 0.7 } = {}) {
  const k = Math.max(0, Math.min(1, color));
  if (k === 0) return img;
  const d = img.data;
  const n = d.length / 4;

  // 1) منحنى النغمات: بنوسّع المدى (0.5% إلى 99.5%) بمعامل واحد لكل القنوات + S-curve خفيفة على الدرجات الوسطى
  const hist = lumaHistogram(img);
  const lo = percentile(hist, n, 0.005);
  const hi = Math.max(lo + 24, percentile(hist, n, 0.995));
  const loT = lo * (1 - k);
  let hiT = hi + (255 - hi) * k;
  const maxScale = 2.4; // ما نكبّرش الفرق أكتر من كده عشان الصور المسطحة ما تطلعش خشنة
  if ((hiT - loT) / (hi - lo) > maxScale) hiT = loT + (hi - lo) * maxScale;
  const gain = (hiT - loT) / (hi - lo);
  const curve = 0.22 * k;
  // بعد التمديد الدرجات الوسطى بتنزل لتحت (الظلال بتتسحب للأسود)، فبنرفعها بقدر ما الصورة كانت باهتة فعلاً:
  // الصورة الباهتة (مدى ضيق) بتتزوّد إضاءتها لحد 14% كحد أقصى، والصورة اللي مداها كامل ما بتتغيّرش
  const med = percentile(hist, n, 0.5);
  const m1 = Math.max(0.02, Math.min(0.98, (loT + (med - lo) * gain) / 255));
  const washed = Math.max(0, 1 - (hi - lo) / 255);
  const target = Math.min(0.5, Math.max(med / 255, 0.44), med / 255 + 0.14 * washed);
  const gamma = target > m1 ? Math.max(0.6, Math.log(target) / Math.log(m1)) : 1;
  const lut = new Uint8ClampedArray(256);
  for (let v = 0; v < 256; v++) {
    let x = Math.max(0, Math.min(1, (loT + (v - lo) * gain) / 255));
    x = Math.pow(x, 1 - (1 - gamma) * k);
    lut[v] = Math.round(255 * (x + curve * (smooth(x) - x)));
  }

  // 2) الألوان: بنزوّد التشبّع حوالين الإضاءة (فالرمادي يفضل رمادي)، والباهت يتزوّد أكتر من القوي
  const vib = 0.9 * k, sat = 0.12 * k;
  for (let i = 0; i < d.length; i += 4) {
    const r = lut[d[i]], g = lut[d[i + 1]], b = lut[d[i + 2]];
    const mx = r > g ? (r > b ? r : b) : (g > b ? g : b);
    const mn = r < g ? (r < b ? r : b) : (g < b ? g : b);
    let boost = 1;
    if (mx > mn) {
      const s = (mx - mn) / mx;
      boost = 1 + sat + vib * Math.pow(1 - s, 1.5);
      // بشرة الإنسان (برتقالي مائل للأحمر) بنخفف عليها عشان ما تطلعش محروقة
      if (mx === r && s > 0.18 && s < 0.78) {
        const h = hueDeg(r, g, b, mx, mn);
        if (h > 8 && h < 52) boost = 1 + (boost - 1) * 0.45;
      }
    }
    const L = luma(r, g, b);
    d[i] = clamp8(Math.round(L + (r - L) * boost));
    d[i + 1] = clamp8(Math.round(L + (g - L) * boost));
    d[i + 2] = clamp8(Math.round(L + (b - L) * boost));
  }
  return img;
}

/* ============ الحدّة (Unsharp Mask على الإضاءة بس) ============ */

function boxBlur(src, dst, w, h, r) {
  // أفقي ثم رأسي، بمتوسط متحرك وحواف مكرّرة
  const tmp = new Uint8Array(w * h);
  const win = 2 * r + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      tmp[row + x] = (sum / win + 0.5) | 0;
      sum += src[row + Math.min(w - 1, x + r + 1)] - src[row + Math.max(0, x - r)];
    }
  }
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = (sum / win + 0.5) | 0;
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x] - tmp[Math.max(0, y - r) * w + x];
    }
  }
}

/**
 * يزوّد حدّة الحواف. radius بالبكسل، amount من 0 لـ1.5 تقريباً، threshold عشان الضوضا الخفيفة ما تتكبّرش.
 */
export function unsharp(img, { radius = 1, amount = 0.5, threshold = 3 } = {}) {
  if (amount <= 0) return img;
  const { width: w, height: h, data: d } = img;
  const n = w * h;
  const L = new Uint8Array(n);
  for (let p = 0, i = 0; p < n; p++, i += 4) L[p] = Math.round(luma(d[i], d[i + 1], d[i + 2]));
  // تلات تمريرات من المتوسط المتحرك بتقرّب التمويه الجاوسي
  const A = new Uint8Array(n), B = new Uint8Array(n);
  const r = Math.max(1, Math.round(radius));
  boxBlur(L, A, w, h, r); boxBlur(A, B, w, h, r); boxBlur(B, A, w, h, r);
  for (let p = 0, i = 0; p < n; p++, i += 4) {
    const diff = L[p] - A[p];
    if (diff > threshold || diff < -threshold) {
      const add = diff * amount;
      d[i] = clamp8(d[i] + add);
      d[i + 1] = clamp8(d[i + 1] + add);
      d[i + 2] = clamp8(d[i + 2] + add);
    }
  }
  return img;
}

/** أقصى مقاس مخرجات: ضلع 4096 ومساحة 4096×4096 (حد الكانفاس على سفاري والموبايلات) */
export const MAX_SIDE = 4096;
export const MAX_AREA = 4096 * 4096;

export const DEFAULT_LIMITS = { side: MAX_SIDE, area: MAX_AREA };

/** المعامل الفعلي للتكبير بعد مراعاة الحدود (الافتراضية أو حدود جهاز قوي)، وأبعاد الناتج */
export function upscalePlan(w, h, want, limits = DEFAULT_LIMITS) {
  const k = Math.max(1, Math.min(want, limits.side / Math.max(w, h), Math.sqrt(limits.area / (w * h))));
  const f = Math.floor(k * 100) / 100;
  return { factor: f, width: Math.round(w * f), height: Math.round(h * f) };
}
