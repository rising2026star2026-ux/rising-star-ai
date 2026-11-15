import Link from "next/link";
import { DATA_SOURCES, KIND } from "@/lib/datasources";
import s from "@/components/datasources.module.css";

export const metadata = {
  title: "مصادر البيانات وتاريخها",
  description: "كل سعر ومنافس ورقم بيظهر في Rising Business جاي منين، واتجمع إمتى، وحدوده: فحص السوق، وكيل التاجر، دراسة الجدوى، المقارنة واختبار الإعلان.",
  alternates: { canonical: "/data-sources" },
};

export default function Page() {
  return (
    <>
      <h1 className="page-title">مصادر البيانات وتاريخها</h1>
      <p className="page-sub">الأرقام بتتحسب بالكود من بيانات ليها مصدر، أو من أرقامك أنت. الموديل بيشرح ويفلتر، وما بيخترعش أسعار ولا منافسين.</p>
      <div className={s.wrap}>
        {DATA_SOURCES.map((x) => (
          <section key={x.id} className={s.card} aria-labelledby={`ds-${x.id}`}>
            <div className={s.head}>
              <h2 id={`ds-${x.id}`}><Link href={x.href}>{x.tool}</Link></h2>
              <span className={s.kind} data-kind={x.kind}>{KIND[x.kind]}</span>
            </div>
            <dl className={s.list}>
              <dt>بيعرض</dt><dd>{x.what}</dd>
              <dt>المصدر</dt><dd>{x.source}</dd>
              <dt>إمتى اتجمعت</dt><dd>{x.when}</dd>
              <dt>بيظهر إزاي</dt><dd>{x.shown}</dd>
              <dt>حدوده</dt><dd>{x.limits}</dd>
            </dl>
          </section>
        ))}
      </div>
    </>
  );
}
