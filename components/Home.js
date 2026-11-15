"use client";
// الرئيسية: داشبورد Rising Business. بطاقة نشاطك، مساعد الأعمال، مجالات الشغل، وكل الأدوات منسقة حسب التصنيف.
import Link from "next/link";
import { ITEMS, SECTIONS, sectionHome } from "@/lib/sections";
import { tools, categories } from "@/lib/tools";
import { Glyph, CATEGORY_GLYPH } from "@/lib/toolglyphs";
import StarMark from "./StarMark";
import ToolIcon from "./ToolIcon";
import s from "./home.module.css";
import d from "./dash.module.css";

const MAIN = new Set(["/seller/agent", "/feasibility"]);
const ORDER = ["/seller/agent", "/seller", "/feasibility", "/brand", "/tools", "/maker", "/prompts/studio", "/prompts", "/resources"];
const GROUPS = categories.map((c) => ({ ...c, list: tools.filter((t) => t.cat === c.id) })).filter((g) => g.list.length);

export default function Home() {
  const home = sectionHome(SECTIONS[0].id);
  return (
    <div className={s.page}>
      <section className={`${s.band} ${s.night} ${s.hero} on-night`} data-band-sec="night">
        <i className={s.starfield} aria-hidden="true" />
        <i className={s.horizon} aria-hidden="true" />
        <div className={s.in}>
          <div className={s.brand} style={{ textAlign: "center" }}>
            <span className={s.mark}><StarMark size={56} /></span>
            <h1 dir="ltr" className={d.wordmark}><span>Rising</span>{" "}<span>Business</span></h1>
            <p>منصة الذكاء الاصطناعي لصاحب النشاط التجاري: بيع وتسويق ودراسة جدوى وتسعير.</p>
          </div>
          <Link href="/brand" className={d.profile}>
            <span><b>نشاطك</b>سجّل نوع نشاطك ومدينتك ومنتجاتك مرة واحدة، وتتستخدم في كل الأدوات.</span>
          </Link>
          <Link href={home} className={d.ask}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /></svg>
            <span>اسأل مساعد الأعمال عن أي حاجة في نشاطك</span>
          </Link>
        </div>
      </section>

      <section className={`${s.band} ${s.white}`}>
        <div className={s.in} style={{ maxWidth: 1000 }}>
          <div className={d.block}>
            <div className={d.head}><h2>اشتغل على</h2></div>
            <div className={d.work}>
              {ORDER.map((h) => (
                <Link key={h} href={h} className={`${d.workCard} ${MAIN.has(h) ? d.main : ""}`}>
                  <b>{ITEMS[h].label}</b>
                  <span>{ITEMS[h].desc}</span>
                </Link>
              ))}
            </div>
          </div>

          <div className={d.block}>
            <div className={d.head}><h2>كل الأدوات</h2><small>{tools.length} أداة</small></div>
            {GROUPS.map((g) => (
              <div key={g.id} className={d.cat} style={{ "--c": g.color }}>
                <div className={d.catHead}><i><Glyph name={CATEGORY_GLYPH[g.id]} size={18} /></i>{g.name} <small>{g.list.length}</small></div>
                <div className={d.tools}>
                  {g.list.map((t) => (
                    <Link key={t.id} href={`/tool/${t.id}`} className={d.tool}>
                      <ToolIcon tool={t} />
                      <div><b>{t.name}</b><span>{t.desc}</span></div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className={d.foot}>
            <Link href="/plans">الباقات</Link>
            <Link href="/support">الدعم</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
