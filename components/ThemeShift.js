"use client";
import { useEffect, useState } from "react";
import { useStored } from "@/lib/store";

// "تلقائي": الذهبي يتحول لأزرق ملكي بعد 5 دقايق خلال 20 ثانية، والنجوم تختفي
const SHIFT_AFTER_MS = 5 * 60 * 1000;

export default function ThemeShift() {
  const [stars, setStars] = useState([]);
  const [theme] = useStored("theme", "auto");

  useEffect(() => {
    setStars(
      Array.from({ length: 70 }, (_, i) => ({
        id: i, top: Math.random() * 100, left: Math.random() * 100,
        size: Math.random() * 1.8 + 0.6, delay: Math.random() * 6,
      }))
    );
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    html.classList.toggle("royal", theme === "royal");
    if (theme !== "auto") return;
    const t = setTimeout(() => html.classList.add("royal"), SHIFT_AFTER_MS);
    return () => clearTimeout(t);
  }, [theme]);

  return (
    <div className="stars" aria-hidden="true">
      {stars.map((s) => (
        <span key={s.id} style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }} />
      ))}
    </div>
  );
}
