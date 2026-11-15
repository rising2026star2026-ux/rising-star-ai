// طبقة البيانات: كل بيانات العميل التجارية بتتقري وتتكتب من هنا، مش من localStorage مباشرة.
// النهارده التخزين على الجهاز (lib/store.js). لما الحسابات وقاعدة البيانات تتضاف، بنغيّر الملف ده بس.
import { read, write, drop } from "./storecore.js";

// كل كيان: مفتاحه على الجهاز، ونوعه (one = عنصر واحد، list = قايمة)، واسمه للعميل
export const ENTITIES = {
  profile: { key: "brand", kind: "one", label: "ملف النشاط" },
  bizStatus: { key: "biz-status", kind: "one", label: "حالة النشاط" },
  comparisons: { key: "compare-saved", kind: "list", label: "المقارنات المحفوظة" },
  compareDraft: { key: "compare-draft", kind: "one", label: "المقارنة المفتوحة" },
  studies: { key: "feasibility-saved", kind: "list", label: "دراسات الجدوى المحفوظة" },
  lastStudy: { key: "feasibility-last", kind: "one", label: "الدراسة المفتوحة" },
  chats: { key: "assistant-saved", kind: "list", label: "ردود المساعد المحفوظة" },
  outputs: { key: "history", kind: "list", label: "مخرجات الأدوات" },
  catalog: { key: "catalog", kind: "one", label: "الكتالوج" },
  amazonProfit: { key: "amz-profit", kind: "one", label: "حاسبة ربح أمازون" },
  agentRuns: { key: "seller-agent", kind: "list", label: "مهام وكيل التاجر" },
  logos: { key: "logo-saved", kind: "list", label: "الشعارات المحفوظة" },
};

const ent = (name) => {
  const e = ENTITIES[name];
  if (!e) throw new Error(`كيان غير معروف: ${name}`);
  return e;
};

export const get = (name, fallback = null) => read(ent(name).key, fallback);
export const list = (name) => { const v = read(ent(name).key, []); return Array.isArray(v) ? v : []; };
export const set = (name, value) => write(ent(name).key, value);

/** إضافة عنصر لأول القايمة بحد أقصى */
export function add(name, item, max = 30) {
  const next = [item, ...list(name).filter((x) => x?.id !== item.id)].slice(0, max);
  set(name, next);
  return next;
}
export function remove(name, id) {
  const next = list(name).filter((x) => x?.id !== id);
  set(name, next);
  return next;
}

/** تصدير كل بيانات العميل في ملف واحد (حق العميل في بياناته) */
export function exportAll() {
  const data = {};
  for (const [name, e] of Object.entries(ENTITIES)) {
    const v = read(e.key, null);
    if (v !== null && !(Array.isArray(v) && !v.length)) data[name] = v;
  }
  return { app: "Rising Business", version: 1, exportedAt: new Date().toISOString(), data };
}

/** ملخص: كل كيان فيه كام عنصر */
export function summary() {
  return Object.entries(ENTITIES).map(([name, e]) => {
    const v = read(e.key, null);
    const count = Array.isArray(v) ? v.length : v ? 1 : 0;
    return { name, label: e.label, count };
  });
}

/** مسح كل البيانات التجارية من الجهاز (بعد تأكيد العميل) */
export function clearAll() {
  for (const e of Object.values(ENTITIES)) drop(e.key);
}
