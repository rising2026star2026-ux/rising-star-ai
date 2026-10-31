// رأس صفحات «ستوديو البيّاع»: سما ليل بعرض الشاشة، عنوان كبير، وخطوات قصيرة
import Link from "next/link";
import s from "./seller.module.css";

export default function SellerHero({ kicker, title, accent, sub, steps = [], tone = "blue", back = true }) {
  return (
    <header className={`${s.hero} ${s["tone_" + tone] || ""} on-night`}>
      <i className={s.heroStars} aria-hidden="true" />
      <i className={s.heroGlow} aria-hidden="true" />
      <div className={s.heroIn}>
        {back && (
          <Link href="/seller" className={s.heroBack}>
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
            ستوديو البيّاع
          </Link>
        )}
        {kicker && <span className={s.kicker}>{kicker}</span>}
        <h1 className={s.heroTitle}>
          {title}
          {accent && <> <em>{accent}</em></>}
        </h1>
        {sub && <p className={s.heroSub}>{sub}</p>}
        {steps.length > 0 && (
          <ol className={s.heroSteps}>
            {steps.map((st, i) => (
              <li key={i}><b>{i + 1}</b><span>{st}</span></li>
            ))}
          </ol>
        )}
      </div>
    </header>
  );
}
