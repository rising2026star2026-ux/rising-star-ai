"use client";
// أقسام الرئيسية (ليل / نهار): بنسجّل القسم اللي واقف عليه المستخدم في html[data-band]
// عشان أي عنصر يقدر يتلوّن على حسبه. الشريط العلوي ولون شريط المتصفح ثابتين على الليل.
import { useEffect } from "react";

export default function ScrollBands() {
  useEffect(() => {
    const html = document.documentElement;
    const bands = Array.from(document.querySelectorAll("[data-band-sec]"));
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
    };
  }, []);
  return null;
}
