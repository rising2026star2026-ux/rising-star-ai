"use client";
// نور بيتبع الماوس على الكروت. فكرته من SpotlightCard في ReactBits، بس بتنفيذ أخف بكتير:
// المكتبة الأصلية بتركّب 5 مستمعين على window وdocument «لكل كارت» وبتحسب مكانه كل إطار،
// يعني 200 كارت = 1000 مستمع. هنا مستمع واحد على الحاوية كلها، وبيحرّك الكارت اللي تحت الماوس بس.
// بيشتغل بالماوس الحقيقي بس (مش الموبايل)، وبيقف لوحده في وضع التخفيف (html.lite) أو لو المستخدم طلب تقليل الحركة.
import { useEffect, useRef } from "react";

export default function SpotRoot({ as: Tag = "div", children, ...rest }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || document.documentElement.classList.contains("lite")) return undefined;
    const fine = window.matchMedia?.("(hover: hover) and (pointer: fine)");
    if (!fine?.matches) return undefined;

    let raf = 0;
    let last = null; // آخر حدث ماوس، بنعالجه مرة واحدة في الإطار
    const run = () => {
      raf = 0;
      if (!last) return;
      const card = last.target instanceof Element ? last.target.closest("[data-spot]") : null;
      if (!card || !el.contains(card)) return;
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${last.clientX - r.left}px`);
      card.style.setProperty("--my", `${last.clientY - r.top}px`);
    };
    const onMove = (e) => { last = e; if (!raf) raf = requestAnimationFrame(run); };
    el.addEventListener("pointermove", onMove, { passive: true });
    return () => { el.removeEventListener("pointermove", onMove); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return <Tag ref={ref} {...rest}>{children}</Tag>;
}

/** عنصر النور نفسه: حطه أول ابن في الكارت، وحط data-spot على الكارت */
export function Glow({ tone = "light" }) {
  return <i className={`fx-glow fx-glow-${tone}`} aria-hidden="true" />;
}
