"use client";
// ظهور هادي للأقسام اللي تحت الشاشة (فكرة AnimatedContent في ReactBits، من غير GSAP):
// مراقب واحد (IntersectionObserver) لكل الصفحة، والحركة opacity وtransform بس (على كرت الرسوميات، من غير إعادة رسم).
// الأقسام اللي ظاهرة أصلاً مش بتتخبّى، والمحتوى ما بيتخبّاش من السيرفر: لو الجافاسكريبت وقع، الصفحة تفضل كاملة.
import { useEffect } from "react";

export default function RevealOnScroll() {
  useEffect(() => {
    const html = document.documentElement;
    if (html.classList.contains("lite") || !("IntersectionObserver" in window)) return undefined;
    const vh = window.innerHeight;
    const els = Array.from(document.querySelectorAll("[data-reveal]")).filter((e) => e.getBoundingClientRect().top > vh * 0.9);
    if (!els.length) return undefined;

    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        en.target.classList.remove("fx-pre");
        io.unobserve(en.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });

    els.forEach((e) => { e.classList.add("fx-pre"); io.observe(e); });
    return () => { io.disconnect(); els.forEach((e) => e.classList.remove("fx-pre")); };
  }, []);
  return null;
}
