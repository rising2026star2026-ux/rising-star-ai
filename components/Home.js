"use client";
// الرئيسية: شكل بسيط. الاسم وكروت الأقسام بس، وكل قسم يفتح قايمته وأدواته.
import Link from "next/link";
import { SECTIONS, ITEMS } from "@/lib/sections";
import { tools } from "@/lib/tools";
import StarMark from "./StarMark";
import s from "./home.module.css";
import sc from "./section.module.css";

const Arrow = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
);

export default function Home() {
  return (
    <div className={s.page}>
      <section className={`${s.band} ${s.night} ${s.hero} on-night`} data-band-sec="night">
        <i className={s.starfield} aria-hidden="true" />
        <i className={s.horizon} aria-hidden="true" />
        <div className={sc.homeIn}>
          <div className={s.brand}>
            <span className={s.mark}><StarMark size={64} /></span>
            <h1 dir="ltr"><span>Rising</span>{" "}<span>Star<em>Ai</em></span></h1>
            <p>اختار مجالك وادخل على أدواته. {tools.length} أداة بالعربي، مقسمة على أقسام متخصصة.</p>
          </div>

          <nav className={sc.hub} aria-label="الأقسام">
            {SECTIONS.map((x) => (
              <Link key={x.id} href={`/s/${x.id}`} className={sc.hubCard} style={{ "--sec": x.color }}>
                <span className={sc.hubIcon}>
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={x.icon} /></svg>
                </span>
                <b>{x.name}</b>
                <span className={sc.hubTag}>{x.tagline}</span>
                <span className={sc.hubChips}>
                  {x.items.slice(0, 3).map((h) => <i key={h}>{ITEMS[h].label}</i>)}
                </span>
                <span className={sc.hubGo}>ادخل القسم <Arrow /></span>
              </Link>
            ))}
          </nav>

          <p className={sc.hubFoot}>
            <Link href="/plans">الباقات</Link>
            <Link href="/support">الدعم</Link>
            <Link href="/map">خريطة الموقع</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
