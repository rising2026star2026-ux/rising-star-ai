import Link from "next/link";
import { DIR_CATEGORIES, DIR_APPS, DIR_TOOLS, DIR_TOTAL, dirCount } from "@/lib/directory";
import DirSearch from "@/components/DirSearch";
import s from "@/components/directory.module.css";

export const metadata = {
  title: "أدوات عالمية: دليل أدوات الذكاء الاصطناعي بالعربي",
  description: "دليل عربي لأدوات الذكاء الاصطناعي العالمية في 40 مجال: كل أداة ليها صفحة بالعربي فيها بتعمل إيه، الشركة، والتسعير، ورابط الموقع.",
  alternates: { canonical: "/global-tools" },
};

export default function GlobalTools() {
  const catName = Object.fromEntries(DIR_CATEGORIES.map((c) => [c.id, c.name]));
  const index = [...DIR_APPS, ...DIR_TOOLS].map((t) => [t.name, t.href, catName[t.cat]]);
  return (
    <div className={s.page}>
      <h1 className="page-title">أدوات عالمية</h1>
      <p className={s.lead}>
        أدوات الذكاء الاصطناعي من كل العالم، متقسمة على 40 مجال. كل أداة ليها صفحة بالعربي: بتعمل إيه، مين الشركة، مجانية ولا مدفوعة وخططها، وزرار يوديك لموقعها.
      </p>
      <div className={s.stats}>
        <span className={s.stat}><b>{DIR_TOTAL.toLocaleString("en-US")}</b>أداة</span>
        <span className={`${s.stat} ${s.blue}`}><b>{DIR_CATEGORIES.length}</b>مجال</span>
      </div>
      <DirSearch index={index} />
      <div className={s.cats}>
        {DIR_CATEGORIES.map((c) => (
          <Link key={c.id} href={`/global-tools/${c.id}`} className={s.cat}>
            <span className={s.catIcon} aria-hidden="true">{c.icon}</span>
            <span>
              <b>{c.name}</b>
              <small>{c.desc}</small>
              <em>{dirCount(c.id)} أداة</em>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
