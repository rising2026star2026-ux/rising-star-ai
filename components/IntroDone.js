"use client";
// بيعلّم إن الشاشة الافتتاحية اتشافت، وبيشيلها بعد ما تخلص (أو لو المستخدم داس عليها)
import { useEffect } from "react";

export default function IntroDone() {
  useEffect(() => {
    const el = document.getElementById("rs-intro");
    try { sessionStorage.setItem("rs:intro", "1"); } catch {}
    if (!el) return;
    const skip = () => el.classList.add("intro-skip");
    el.addEventListener("click", skip);
    const t = setTimeout(() => { el.remove(); document.documentElement.classList.add("no-intro"); }, 3200);
    return () => { clearTimeout(t); el.removeEventListener("click", skip); };
  }, []);
  return null;
}
