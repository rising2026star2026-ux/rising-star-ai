// الاستبيان الميداني للباحث التجاري — من غير قاعدة بيانات:
// الأسئلة بتتحط في الرابط نفسه (#…)، والمشارك بيبعت رده لصاحب المشروع على واتساب كرسالة فيها كود قصير،
// وصاحب المشروع بيلزق الرسايل في الدراسة، والكود هنا بيعدّها ويطلّع النتيجة. مفيش بيانات بتتخزن عندنا.

const VERSION = 1;

const fmt = (v) => Math.round(v).toLocaleString("ar-EG");

/** شرايح السعر حوالين السعر المتوقع (مقرّبة لأرقام سهلة) */
function priceBands(price) {
  const p = Math.max(1, Number(price) || 0);
  const r = (x) => {
    const step = x >= 1000 ? 100 : x >= 100 ? 10 : x >= 20 ? 5 : 1;
    return Math.max(step, Math.round(x / step) * step);
  };
  const cuts = [r(p * 0.6), r(p * 0.9), r(p * 1.15), r(p * 1.5)];
  for (let i = 1; i < cuts.length; i++) if (cuts[i] <= cuts[i - 1]) cuts[i] = cuts[i - 1] + 1;
  return {
    labels: [`أقل من ${fmt(cuts[0])} ج`, `${fmt(cuts[0])} – ${fmt(cuts[1])} ج`, `${fmt(cuts[1])} – ${fmt(cuts[2])} ج`, `${fmt(cuts[2])} – ${fmt(cuts[3])} ج`, `أكتر من ${fmt(cuts[3])} ج`],
    mids: [cuts[0] * 0.8, (cuts[0] + cuts[1]) / 2, (cuts[1] + cuts[2]) / 2, (cuts[2] + cuts[3]) / 2, cuts[3] * 1.15],
  };
}

const VERB = { shop: "تشتري من", cafe: "تروح", factory: "تشتري منتجات", startup: "تستخدم خدمة", warehouse: "تأجّر مساحة في" };

/** بيبني الاستبيان من نوع المشروع والسعر المتوقع */
export function buildSurvey({ activity, type, price, place }) {
  const id = Math.random().toString(36).slice(2, 7);
  const bands = priceBands(price);
  const thing = activity || "المشروع";
  return {
    v: VERSION,
    id,
    title: `استبيان قصير عن ${thing}${place ? ` في ${place}` : ""}`,
    qs: [
      { k: "intent", q: `لو اتفتح ${thing} قريب منك، ممكن ${VERB[type] || "تتعامل مع"}ه؟`, o: ["أكيد", "غالباً", "مش متأكد", "غالباً لأ", "لأ"] },
      { k: "freq", q: "كام مرة في الشهر تقريباً؟", o: ["ولا مرة", "مرة واحدة", "2 لـ 4 مرات", "5 لـ 10 مرات", "أكتر من 10"] },
      { k: "price", q: "تدفع كام في المرة الواحدة؟", o: bands.labels, mids: bands.mids },
      { k: "now", q: "بتجيب الحاجة دي منين دلوقتي؟", o: ["مكان قريب", "مكان بعيد بروحله", "أونلاين", "مش بجيبها"] },
      { k: "why", q: "إيه أهم حاجة بتخليك تختار مكان عن التاني؟", o: ["السعر", "الجودة", "القرب", "الخدمة والمعاملة", "التوصيل"] },
      { k: "age", q: "سنك كام؟", o: ["أقل من 18", "18 – 25", "26 – 35", "36 – 50", "أكتر من 50"] },
    ],
  };
}

// base64 للنص العربي (UTF-8) من غير مكتبات، ويشتغل في المتصفح والسيرفر
const b64e = (s) => {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64d = (s) => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

/** رابط الاستبيان: الأسئلة + رقم واتساب صاحب المشروع (اختياري) جوه الـ hash، فمش بيوصلوا لأي سيرفر */
export function surveyLink(origin, survey, phone = "") {
  const payload = { ...survey, qs: survey.qs.map(({ mids, ...q }) => q), p: cleanPhone(phone) };
  return `${origin}/survey#${b64e(JSON.stringify(payload))}`;
}

export function readSurveyHash(hash) {
  try {
    const s = JSON.parse(b64d(String(hash || "").replace(/^#/, "")));
    if (s?.v !== VERSION || !Array.isArray(s.qs) || !s.id) return null;
    return s;
  } catch {
    return null;
  }
}

/** رقم مصري → صيغة واتساب الدولية (20…)، أو "" لو مش صالح */
export function cleanPhone(p) {
  let d = String(p || "").replace(/[^\d]/g, "");
  if (d.startsWith("0020")) d = d.slice(2);
  if (d.startsWith("01") && d.length === 11) d = `2${d}`;
  return /^20\d{10}$/.test(d) ? d : "";
}

/** كود الرد: RS-<id>-<أرقام الاختيارات> زي RS-k3x9a-021304 */
export const answerCode = (id, answers) => `RS-${id}-${answers.map((a) => (a >= 0 ? a : 9)).join("")}`;

/** بيدوّر على أكواد الردود في أي نص ملزوق (رسايل واتساب كتير ورا بعض) */
export function parseResponses(text, survey) {
  const re = new RegExp(`RS-${survey.id}-(\\d{${survey.qs.length}})`, "g");
  return [...String(text || "").matchAll(re)].map((m) => [...m[1]].map(Number));
}

/** النتيجة: عدد لكل اختيار + مؤشرات جاهزة للدراسة */
export function tallySurvey(rows, survey) {
  const counts = survey.qs.map((q) => q.o.map(() => 0));
  rows.forEach((r) => r.forEach((a, i) => { if (counts[i] && a < counts[i].length) counts[i][a]++; }));
  const n = rows.length;
  const share = (qi, idxs) => {
    const tot = counts[qi].reduce((t, x) => t + x, 0);
    return tot ? idxs.reduce((t, i) => t + counts[qi][i], 0) / tot : 0;
  };
  const priceQ = survey.qs.findIndex((q) => q.k === "price");
  let medianPrice = null;
  if (priceQ >= 0 && survey.qs[priceQ].mids) {
    const list = [];
    counts[priceQ].forEach((c, i) => { for (let k = 0; k < c; k++) list.push(survey.qs[priceQ].mids[i]); });
    list.sort((a, b) => a - b);
    if (list.length) medianPrice = list[Math.floor(list.length / 2)];
  }
  const freqMids = [0, 1, 3, 7.5, 12];
  const freqTot = counts[1].reduce((t, x) => t + x, 0);
  const avgFreq = freqTot ? counts[1].reduce((t, c, i) => t + c * freqMids[i], 0) / freqTot : null;
  return { n, counts, intent: share(0, [0, 1]), medianPrice, avgFreq };
}

/** ملخص نصي للنموذج والتقرير */
export function surveyText(t, survey) {
  if (!t?.n) return "";
  const top = (qi) => {
    const c = t.counts[qi];
    const i = c.indexOf(Math.max(...c));
    return `${survey.qs[qi].o[i]} (${Math.round((c[i] / t.n) * 100)}٪)`;
  };
  return [
    `استبيان ميداني: ${t.n} رد (مؤشر مبدئي مش عينة ممثلة للسوق).`,
    `نية الشراء (أكيد + غالباً): ${Math.round(t.intent * 100)}٪.`,
    t.avgFreq !== null ? `متوسط عدد المرات في الشهر: ${t.avgFreq.toFixed(1)}.` : "",
    t.medianPrice ? `السعر اللي أغلب الناس مستعدة تدفعه في المرة: حوالي ${fmt(t.medianPrice)} ج.` : "",
    `أكتر إجابة عن مكان الشراء الحالي: ${top(3)}. أهم سبب للاختيار: ${top(4)}. أكتر فئة عمرية: ${top(5)}.`,
  ].filter(Boolean).join("\n");
}
