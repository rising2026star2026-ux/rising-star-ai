"use client";
// معرض الموديلات (زي Poe): أقسام، وكل قسم صف أيقونات، و«عرض الكل» بيفرده شبكة
import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import BotIcon from "./BotIcon";
import ProCode from "./ProCode";
import { useStored, toast, write } from "@/lib/store";
import s from "./models.module.css";

export default function ModelsGallery({ sections, bots }) {
  const router = useRouter();
  const [code] = useStored("pro-code", "");
  const [open, setOpen] = useState({});
  const [q, setQ] = useState("");
  const proRef = useRef(null);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return bots;
    return bots.filter((b) => `${b.name} ${b.maker} ${b.desc}`.toLowerCase().includes(t));
  }, [q, bots]);

  function pick(b) {
    if (!b.available) {
      toast(b.reason === "soon" ? "الموديلات العالمية هتتفعّل قريب" : "الموديل ده مش متاح دلوقتي. جرّب موديل تاني.");
      return;
    }
    if (b.tier === "pro" && !code) {
      toast("الموديل ده للمشتركين. فعّل كود الاشتراك الأول");
      proRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      proRef.current?.querySelector("input")?.focus({ preventScroll: true });
      return;
    }
    write("bot", b.key);
    router.push(`/chat?bot=${b.key}`);
  }

  return (
    <div className={s.gallery}>
      <div className={s.searchRow}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" />
        </svg>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="ابحث عن موديل: Claude، GPT، Gemini..." aria-label="ابحث عن موديل" dir="auto" />
      </div>

      {sections.map((sec) => {
        const list = filtered.filter((b) => b.section === sec.id);
        if (!list.length) return null;
        const expanded = open[sec.id] || !!q.trim();
        return (
          <section key={sec.id} className={s.section} aria-labelledby={`sec-${sec.id}`}>
            <div className={s.sectionHead}>
              <div>
                <h2 id={`sec-${sec.id}`}>
                  {sec.title}
                  {sec.tier === "pro" && <em className={s.proTag}>للمشتركين</em>}
                  {sec.tier === "free" && <em className={s.freeTag}>مجاناً</em>}
                </h2>
                <p>{sec.sub}</p>
              </div>
              {list.length > 4 && !q.trim() && (
                <button type="button" className={s.seeAll} onClick={() => setOpen((o) => ({ ...o, [sec.id]: !o[sec.id] }))}>
                  {expanded ? "أقل" : "عرض الكل"}
                </button>
              )}
            </div>

            <div className={expanded ? s.grid : s.row}>
              {list.map((b) => (
                <button
                  key={b.key}
                  type="button"
                  className={`${s.tile} ${b.available ? "" : s.tileOff}`}
                  onClick={() => pick(b)}
                  title={b.desc}
                >
                  <BotIcon bot={b} size={66} />
                  <span className={s.tileName} dir="auto">{b.name}</span>
                  <span className={s.tileMaker}>
                    {!b.available ? (b.reason === "soon" ? "قريباً" : "مش متاح") : b.maker}
                  </span>
                  {expanded && <span className={s.tileDesc}>{b.desc}</span>}
                </button>
              ))}
            </div>
          </section>
        );
      })}

      {!filtered.length && <p className={s.empty}>مفيش موديل بالاسم ده.</p>}

      <div ref={proRef}>
        <ProCode />
      </div>
      <p className={s.footNote}>
        الأيقونات تصميم خاص بـ Rising StarAi وأسماء الموديلات ملك شركاتها. الموقع بيوصلك بالموديلات دي بالعربي من مكان واحد.
      </p>
    </div>
  );
}
