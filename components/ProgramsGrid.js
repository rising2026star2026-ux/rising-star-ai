// البرامج العالمية بالعربي: صف لكل قسم، وكل برنامج بلوجو شركته وبيفتح صفحته العربي جوه الموقع
import Link from "next/link";
import BotIcon from "./BotIcon";
import { APPS, APP_SECTIONS } from "@/lib/apps";
import s from "./models.module.css";

export default function ProgramsGrid({ title = "البرامج العالمية بالعربي", sub }) {
  return (
    <div className={s.gallery} style={{ marginTop: 18 }}>
      <div className={s.sectionHead}>
        <div>
          <h2>{title}</h2>
          <p>{sub || `${APPS.length} برنامج بشعار شركته، وكل برنامج ليه صفحة بالعربي: بيعمل إيه، مجاني ولا مدفوع، وبدائله.`}</p>
        </div>
        <Link href="/models" className={s.seeAll}>كل الموديلات ←</Link>
      </div>
      {APP_SECTIONS.map((sec) => {
        const list = APPS.filter((a) => a.section === sec.id);
        if (!list.length) return null;
        return (
          <section key={sec.id} className={s.section} aria-labelledby={`p-${sec.id}`}>
            <div className={s.sectionHead}>
              <div>
                <h2 id={`p-${sec.id}`} style={{ fontSize: "1.05rem" }}>{sec.title}</h2>
                <p>{sec.sub}</p>
              </div>
            </div>
            <div className={s.row}>
              {list.map((a) => (
                <Link key={a.key} href={a.href} className={s.tile} title={a.desc}>
                  <BotIcon bot={a} size={52} />
                  <span className={s.tileName} dir="auto">{a.name}</span>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
