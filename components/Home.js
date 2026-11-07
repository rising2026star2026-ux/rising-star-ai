"use client";
// الرئيسية: شكل بسيط. الاسم وكروت الأقسام بس، وكل قسم يفتح قايمته وأدواته.
import Link from "next/link";
import { SECTIONS, ITEMS, sectionHome } from "@/lib/sections";
import { tools } from "@/lib/tools";
import StarMark from "./StarMark";
import SectionArt from "./SectionArt";
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
            <p>اختار مجالك وادخل على أدواته. {tools.length} أداة بالعربي.</p>
          </div>

          <nav className={sc.hub} aria-label="الأقسام">
            {SECTIONS.map((x) => (
              <Link key={x.id} href={sectionHome(x.id)} className={sc.hubCard} style={{ "--sec": x.color }}>
                <span className={sc.hubArt} aria-hidden="true"><SectionArt id={x.id} /></span>
                <span className={sc.hubIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={x.icon} /></svg>
                </span>
                <b className={sc.hubName}>{x.name}</b>
                <span className={sc.hubTag}>{x.tagline}</span>
                <ul className={sc.hubList}>
                  {x.items.slice(0, 4).map((h) => <li key={h}>{ITEMS[h].label}</li>)}
                </ul>
                <span className={sc.hubGo}><span>ادخل القسم</span><i><Arrow /></i></span>
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
