"use client";
// أقسام الرئيسية الملونة (أصفر / أزرق / أبيض): بنعرف القسم اللي واقف عليه المستخدم
// (لما يمرر لتحت أو لفوق) فنغير لون الشريط العلوي ولون شريط الموبايل، ونحرك البقع الملونة بنعومة.
import { useEffect } from "react";

const COLORS = { yellow: "#ffd21f", blue: "#1f4dff", white: "#ffffff" };

export default function ScrollBands() {
  useEffect(() => {
    const html = document.documentElement;
    const bands = Array.from(document.querySelectorAll("[data-band-sec]"));
    const blobs = Array.from(document.querySelectorAll("[data-blob]"));
    const meta = document.querySelector('meta[name="theme-color"]');
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let cur = "";
    let raf = 0;

    const run = () => {
      raf = 0;
      const probe = 72; // تحت الشريط العلوي مباشرة
      let active = bands[0] ? bands[0].dataset.bandSec : "";
      for (const b of bands) {
        if (b.getBoundingClientRect().top <= probe) active = b.dataset.bandSec;
      }
      if (active && active !== cur) {
        cur = active;
        html.dataset.band = active;
        if (meta) meta.setAttribute("content", COLORS[active] || "#ffffff");
      }
      if (!calm) {
        for (const el of blobs) {
          const top = el.parentElement.getBoundingClientRect().top;
          const f = parseFloat(el.dataset.blob) || 0.1;
          el.style.transform = `translate3d(0, ${(-top * f).toFixed(1)}px, 0)`;
        }
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };

    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      delete html.dataset.band;
      if (meta) meta.setAttribute("content", "#ffffff");
    };
  }, []);
  return null;
}
