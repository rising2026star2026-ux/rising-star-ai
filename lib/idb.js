"use client";
// تخزين كبير على جهاز الزائر (IndexedDB): المشاريع وملفاتها ومحادثاتها، وملفات الشات.
// localStorage حده حوالي 5 ميجا، والملفات بتعدّيه بسرعة، فده المكان الصح ليها.
const DB = "rising-star";
const STORE = "kv";
let dbp = null;

function open() {
  if (dbp) return dbp;
  dbp = new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") return reject(new Error("no indexedDB"));
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }).catch((e) => { dbp = null; throw e; });
  return dbp;
}

function tx(mode, fn) {
  return open().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(STORE, mode);
    const out = fn(t.objectStore(STORE));
    t.oncomplete = () => resolve(out?.result);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error || new Error("aborted"));
  }));
}

export const idbGet = (key) => tx("readonly", (s) => s.get(key)).catch(() => undefined);
export const idbSet = (key, value) => tx("readwrite", (s) => s.put(value, key));
export const idbDel = (key) => tx("readwrite", (s) => s.delete(key)).catch(() => {});
