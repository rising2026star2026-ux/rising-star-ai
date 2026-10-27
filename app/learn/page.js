import Link from "next/link";
import { PATH, SITES, SITE_TYPES } from "@/lib/learn";
import s from "@/components/learn.module.css";

export const metadata = {
  title: "تعلّم الذكاء الاصطناعي بالعربي",
  description: "خطة تعلّم من الصفر للذكاء الاصطناعي بالعربي، وروابط لأفضل المواقع والكورسات العربية.",
  alternates: { canonical: "/learn" },
};

export default function Learn() {
  return (
    <div className={s.page}>
      <section className={s.hero}>
        <h1>تعلّم الذكاء الاصطناعي</h1>
        <p>خطة بسيطة من الصفر لحد ما تشتغل بيه، وبعدها مواقع وكورسات بالعربي نقدر نوصّلك ليها. المحتوى الأساسي عند أصحابه، واحنا بنوجّهك.</p>
      </section>
      <h2 className={s.h2}>ابدأ من فين؟</h2>
      <div className={s.steps}>
        {PATH.map((p) => (
          <div key={p.t} className={s.step}>
            <div><b>{p.t}</b><p>{p.d}</p>{p.href.startsWith("#") ? <a href={p.href}>{p.cta} ←</a> : <Link href={p.href}>{p.cta} ←</Link>}</div>
          </div>
        ))}
      </div>
      <h2 className={s.h2} id="sites">مواقع عربية للتعلّم</h2>
      <div className={s.grid}>
        {SITES.map((x) => (
          <a key={x.url} href={x.url} target="_blank" rel="noopener noreferrer" className={s.card}>
            <b>{x.name}</b>
            <p>{x.about}</p>
            <span className={s.tags}><i>{SITE_TYPES[x.type]}</i><i className={s.g}>{x.free}</i><i>فتح الموقع ↗</i></span>
          </a>
        ))}
      </div>
      <p className={s.note}>الروابط بتفتح مواقع خارجية مش تابعة لنا، والأسعار والمحتوى ممكن يتغيروا. راجع الموقع نفسه قبل ما تسجل.</p>
    </div>
  );
}
