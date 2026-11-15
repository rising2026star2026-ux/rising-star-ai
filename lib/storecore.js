// التخزين على جهاز الزائر من غير React، عشان طبقة البيانات (lib/repo.js) والاختبارات تستخدمه.
export const EVT = "rs-store";

export function read(key, fallback) {
  try {
    const v = localStorage.getItem("rs:" + key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function write(key, value) {
  try {
    localStorage.setItem("rs:" + key, JSON.stringify(value));
  } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

/** مسح مفتاح من الجهاز (useStored بيرجع للقيمة الافتراضية) */
export function drop(key) {
  try {
    localStorage.removeItem("rs:" + key);
  } catch {}
  window.dispatchEvent(new CustomEvent(EVT, { detail: key }));
}

