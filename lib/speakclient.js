"use client";
// طلب الصوت من الموقع (الصوت العادي أو المعبّر). مشترك بين أداة الأصوات وصفحة المقارنة.

export class SpeakError extends Error {
  constructor(msg, status) { super(msg); this.status = status; this.fatal = status === 429 || (status >= 400 && status < 500); }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * cfg: { engine: "std" | "pro", voice, tone, pitch, dialect, gender, variant }
 * بيعيد المحاولة على أعطال الشبكة والسيرفر، لكن مش على رفض الطلب أو الحد المسموح.
 */
export async function requestAudio(text, cfg) {
  const pro = cfg.engine === "pro";
  const url = pro ? "/api/speak-pro" : "/api/speak";
  const body = pro
    ? { text, dialect: cfg.dialect, gender: cfg.gender, tone: cfg.tone, variant: cfg.variant }
    : { text, voice: cfg.voice, tone: cfg.tone, pitch: cfg.pitch };
  let last = null;
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (r.ok) {
        const b = await r.blob();
        if (b.size > 500) return b;
        last = new SpeakError("الصوت رجع فاضي.", 502);
      } else {
        const j = await r.json().catch(() => ({}));
        last = new SpeakError(j.error || "الصوت مش متاح دلوقتي.", r.status);
        if (last.fatal || (pro && r.status === 503)) throw Object.assign(last, { fatal: true });
      }
    } catch (e) {
      if (e instanceof SpeakError && e.fatal) throw e;
      last = e;
    }
    await sleep(700 * (a + 1));
  }
  throw last instanceof Error ? last : new SpeakError("الصوت مش متاح دلوقتي.", 502);
}
