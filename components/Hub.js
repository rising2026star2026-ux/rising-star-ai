// صفحة نظام (ذكاء السوق، المنتجات، التسويق، الاستوديو): أقسام حسب المهمة، وكل عنصر رابط لصفحة أو أداة شغالة.
import Link from "next/link";
import { HUBS } from "@/lib/hubs";
import { getTool } from "@/lib/tools";
import { TOOL_ROLES } from "@/lib/toolroles";
import s from "./hub.module.css";

export const hubItem = (it) => {
  if (!it.tool) return it;
  const t = getTool(it.tool);
  return { href: `/tool/${it.tool}`, label: t?.name || it.tool, desc: TOOL_ROLES[it.tool] || t?.desc || "" };
};

export default function Hub({ id }) {
  const h = HUBS[id];
  return (
    <>
      <h1 className="page-title">{h.title}</h1>
      <p className="page-sub">{h.sub}</p>
      <div className={s.wrap}>
        {h.sections.map((sec) => (
          <section key={sec.title} className={s.sec} aria-label={sec.title}>
            <h2>{sec.title}</h2>
            <div className={s.grid}>
              {sec.items.map(hubItem).map((it) => (
                <Link key={it.href + it.label} href={it.href} className={s.item}>
                  <b>{it.label}</b>
                  <span>{it.desc}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
        <p className={s.foot}>عندك سؤال عن نشاطك؟ <Link href="/s/seller">اسأل مساعد الأعمال</Link></p>
      </div>
    </>
  );
}
