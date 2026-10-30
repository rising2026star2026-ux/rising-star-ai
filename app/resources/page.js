import Link from "next/link";
import { RES_CATS } from "@/lib/resources";
import s from "@/components/directory.module.css";

export const metadata = {
  title: "مكتبة الموارد",
  description: "قوالب كانفا وسوشيال ميديا، ملفات PSD، مؤثرات موشن وانتقالات، جرافيك، شعارات، كتب وكورسات.",
  robots: { index: false, follow: true }, // بتتفتح لجوجل لما المحتوى ينزل
};

export default function Resources() {
  return (
    <div className={s.page}>
      <h1 className="page-title">مكتبة الموارد</h1>
      <p className={s.lead}>مكان واحد فيه كل اللي محتاجه للتصميم والمحتوى والتعلم: قوالب جاهزة، ملفات مفتوحة، مؤثرات، كتب وكورسات. الأقسام بتتجهز دلوقتي، وهتنزل تباعاً.</p>
      <div className={s.cats}>
        {RES_CATS.map((c) => (
          <Link key={c.id} href={`/resources/${c.id}`} className={s.cat}>
            <span className={s.catIcon} aria-hidden="true">{c.icon}</span>
            <span>
              <b>{c.name}</b>
              <small>{c.desc}</small>
              <em>قريباً</em>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
