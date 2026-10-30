import Link from "next/link";
import { notFound } from "next/navigation";
import { RES_CATS, getResCat } from "@/lib/resources";
import s from "@/components/directory.module.css";

export function generateStaticParams() {
  return RES_CATS.map((c) => ({ cat: c.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { cat } = await params;
  const c = getResCat(cat);
  return c ? { title: `${c.name} | مكتبة الموارد`, description: c.desc, robots: { index: false, follow: true } } : {};
}

export default async function ResCat({ params }) {
  const { cat } = await params;
  const c = getResCat(cat);
  if (!c) notFound();
  const others = RES_CATS.filter((x) => x.id !== c.id);
  return (
    <div className={s.page}>
      <nav className={s.crumbs} aria-label="مسار الصفحة"><Link href="/resources">مكتبة الموارد</Link><span aria-hidden="true">/</span><span>{c.name}</span></nav>
      <h1 className="page-title">{c.icon} {c.name}</h1>
      <p className={s.lead}>{c.desc}.</p>
      <div style={{ margin: "0 0 22px", padding: "14px 16px", borderRadius: 18, background: "var(--accent-soft)", color: "var(--text)", fontSize: "0.9rem", lineHeight: 1.8 }}>
        <b>القسم ده بيتجهز.</b> بنراجع الملفات ونرتبها ونجهز لكل عنصر معاينة وبحث، وهينزل قريب للمشتركين.
      </div>
      <h2 style={{ fontSize: "1.05rem", margin: "0 0 10px" }}>أقسام تانية في المكتبة</h2>
      <div className={s.cats}>
        {others.map((x) => (
          <Link key={x.id} href={`/resources/${x.id}`} className={s.cat}>
            <span className={s.catIcon} aria-hidden="true">{x.icon}</span>
            <span><b>{x.name}</b><small>{x.desc}</small><em>قريباً</em></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
