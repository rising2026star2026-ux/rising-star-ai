"use client";
// تخزين بسيط على جهاز الزائر (المفضلة، السجل، الإعدادات). لو المتصفح منعه، الموقع يكمل عادي.
import { useEffect, useState } from "react";

const EVT = "rs-store";

// السؤال اللي بيتنقل من الرئيسية للشات (sessionStorage)
export const PENDING_KEY = "rs:pending";

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

// قيمة بتتحدث في كل الصفحة لما تتغير
export function useStored(key, fallback) {
  const [v, setV] = useState(fallback);
  useEffect(() => {
    setV(read(key, fallback));
    const on = (e) => e.detail === key && setV(read(key, fallback));
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return [v, (nv) => write(key, typeof nv === "function" ? nv(read(key, fallback)) : nv)];
}

export function toast(msg) {
  window.dispatchEvent(new CustomEvent("rs-toast", { detail: msg }));
}
