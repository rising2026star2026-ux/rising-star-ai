// تشغيل موديل على Hugging Face Space من متصفح الزائر نفسه (مش من السيرفر).
// الفكرة: حصة الـ GPU المجانية (ZeroGPU) بتتحسب على الزائر، فكل عضو ليه حصته اليومية،
// وموقعنا ما بيدفعش حاجة ومش بيتقفل لما الأعضاء يزيدوا.
// بيكلّم واجهة Gradio العادية: POST /call/<api> وبعدين بيقرا النتيجة كـ SSE.

export class SpaceError extends Error {
  constructor(message, { quota = false, busy = false } = {}) {
    super(message);
    this.quota = quota; // الحصة اليومية للزائر خلصت
    this.busy = busy;   // الموديل نايم أو مشغول
  }
}

function classify(raw) {
  const msg = typeof raw === "string" ? raw : raw?.message || raw?.error || JSON.stringify(raw || "");
  if (/quota|exceeded|ZeroGPU/i.test(msg)) return new SpaceError(msg, { quota: true });
  return new SpaceError(msg || "space error", { busy: true });
}

async function readEvents(res, signal) {
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    if (signal?.aborted) throw new DOMException("aborted", "AbortError");
    const { value, done } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n\n")) >= 0) {
      const block = buf.slice(0, i);
      buf = buf.slice(i + 2);
      let ev = "", data = "";
      for (const line of block.split("\n")) {
        if (line.startsWith("event:")) ev = line.slice(6).trim();
        else if (line.startsWith("data:")) data += line.slice(5).trim();
      }
      if (ev === "complete") return JSON.parse(data);
      if (ev === "error") {
        let parsed = data;
        try { parsed = JSON.parse(data); } catch {}
        throw classify(parsed);
      }
    }
  }
  throw new SpaceError("انقطع الاتصال قبل النتيجة", { busy: true });
}

/** بيرجع مصفوفة المخرجات زي ما الـ Space بيرجعها */
export async function callSpace(host, api, data, { signal } = {}) {
  let lastErr = null;
  // Gradio 5 بيستخدم /gradio_api، والإصدارات الأقدم من غيرها
  for (const prefix of ["/gradio_api", ""]) {
    let r;
    try {
      r = await fetch(`${host}${prefix}/call/${api}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
        signal,
      });
    } catch (e) {
      if (signal?.aborted) throw e;
      lastErr = new SpaceError(String(e.message || e), { busy: true });
      continue;
    }
    if (r.status === 404) continue;
    if (r.status === 429) throw new SpaceError("rate limited", { quota: true });
    if (!r.ok) throw new SpaceError(`HTTP ${r.status}`, { busy: true });
    const { event_id } = await r.json();
    const s = await fetch(`${host}${prefix}/call/${api}/${event_id}`, { signal });
    if (!s.ok) throw new SpaceError(`HTTP ${s.status}`, { busy: true });
    const out = await readEvents(s, signal);
    return { out, base: `${host}${prefix}` };
  }
  throw lastErr || new SpaceError("الموديل مش متاح", { busy: true });
}

/** رابط ملف من مخرجات Gradio (صورة أو فيديو) */
export function fileUrl(item, base) {
  if (!item) return null;
  if (typeof item === "string") return item.startsWith("http") ? item : `${base}/file=${item}`;
  if (item.url) return item.url;
  if (item.video) return fileUrl(item.video, base);
  if (item.path) return `${base}/file=${item.path}`;
  return null;
}

/** بيضيف مهلة لأي طلب */
export function withTimeout(ms, outer) {
  const c = new AbortController();
  const t = setTimeout(() => c.abort(), ms);
  outer?.addEventListener("abort", () => c.abort(), { once: true });
  return { signal: c.signal, done: () => clearTimeout(t) };
}
