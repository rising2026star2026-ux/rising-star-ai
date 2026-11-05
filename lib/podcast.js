// البودكاست بصوتين: دوال صافية بتتستخدم في السيرفر (/api/podcast) وفي الواجهة.
// السكربت سطور، كل سطر ليه متكلم (0 أو 1) ونص. الصوت بيتعمل على أجزاء صغيرة وبيتلزق في المتصفح.

export const MAX_LINE = 400; // أقصى طول للسطر الواحد
export const MAX_LINES = 90; // أقصى عدد سطور للحلقة
export const MAX_CHUNK = 1100; // أقصى حروف في الجزء الواحد اللي بيروح للصوت مرة واحدة
export const MAX_SOURCE = 12000; // أقصى طول للنص اللي الزائر بيلزقه كمادة للحلقة

export const LENGTHS = {
  short: { name: "قصيرة (حوالي دقيقتين)", lines: 14 },
  medium: { name: "متوسطة (حوالي 5 دقايق)", lines: 32 },
  long: { name: "طويلة (حوالي 10 دقايق)", lines: 60 },
};

export const STYLES = {
  chat: { name: "دردشة خفيفة", hint: "دردشة ودودة وخفيفة بين صاحبين، فيها هزار بسيط وأمثلة من الحياة اليومية" },
  explain: { name: "شرح وتبسيط", hint: "مذيع بيسأل أسئلة الجمهور وضيف خبير بيشرح ببساطة وبأمثلة" },
  debate: { name: "نقاش بوجهتين نظر", hint: "نقاش محترم بين رأيين مختلفين، كل واحد بيعرض حججه، والختام بيجمع الخلاصة" },
  marketing: { name: "تسويق لمنتج أو خدمة", hint: "حوار طبيعي بيعرّف بالمنتج أو الخدمة ومميزاتها من غير مبالغة، وبيختم بدعوة واضحة" },
};

/** المتكلمين: الاسم المعروض، والاسم اللاتيني اللي بيروح لـ Gemini (لازم يطابق السكربت بالحرف)، والصوت */
export const VOICE_PAIRS = {
  fm: { name: "مذيعة ومذيع", hosts: [{ label: "سارة", tag: "Sara", voice: "Kore", g: "f" }, { label: "عمر", tag: "Omar", voice: "Charon", g: "m" }] },
  mm: { name: "مذيعين رجالة", hosts: [{ label: "عمر", tag: "Omar", voice: "Charon", g: "m" }, { label: "كريم", tag: "Karim", voice: "Puck", g: "m" }] },
  ff: { name: "مذيعتين", hosts: [{ label: "سارة", tag: "Sara", voice: "Kore", g: "f" }, { label: "منى", tag: "Mona", voice: "Aoede", g: "f" }] },
};

export const DIALECT_NAMES = { eg: "مصري", sa: "سعودي" };

export const pairFor = (id) => VOICE_PAIRS[id] || VOICE_PAIRS.fm;

const clean = (s, n) => String(s ?? "").replace(/[\u0000-\u001f]+/g, " ").replace(/\s+/g, " ").trim().slice(0, n);

/** بينضّف السطور اللي راجعة من النموذج أو من الواجهة: متكلم 0 أو 1، ونص مش فاضي */
export function normalizeLines(list) {
  if (!Array.isArray(list)) return [];
  const out = [];
  for (const x of list) {
    const t = clean(x?.t ?? x?.text, MAX_LINE);
    if (!t) continue;
    const s = Number(x?.s ?? x?.speaker) === 1 ? 1 : 0;
    out.push({ s, t });
    if (out.length >= MAX_LINES) break;
  }
  return out;
}

/** بيقسم السطور لأجزاء كل جزء أقل من MAX_CHUNK حرف، من غير ما يقطع سطر في النص */
export function chunkLines(lines, max = MAX_CHUNK) {
  const chunks = [];
  let cur = [];
  let size = 0;
  for (const l of lines) {
    const n = l.t.length + 8;
    if (cur.length && size + n > max) { chunks.push(cur); cur = []; size = 0; }
    cur.push(l);
    size += n;
  }
  if (cur.length) chunks.push(cur);
  return chunks;
}

/** نص الحوار بالشكل اللي Gemini بيفهمه: «Sara: ...» في كل سطر */
export function ttsTranscript(lines, pair) {
  const h = pairFor(pair).hosts;
  return lines.map((l) => `${h[l.s].tag}: ${l.t}`).join("\n");
}

/** نص الحلقة للقراءة أو التحميل، بالأسماء العربي */
export function scriptText(lines, pair, title = "") {
  const h = pairFor(pair).hosts;
  const body = lines.map((l) => `${h[l.s].label}: ${l.t}`).join("\n\n");
  return title ? `${title}\n\n${body}` : body;
}

/** تقدير مدة الحلقة بالدقايق: حوالي 13 حرف في الثانية للكلام العربي العادي */
export function estimateMinutes(lines) {
  const chars = lines.reduce((a, l) => a + l.t.length, 0);
  return Math.max(0.2, chars / 13 / 60);
}
