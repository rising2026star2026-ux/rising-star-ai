import Link from "next/link";
import { CREATORS, LINK_LABELS } from "@/lib/creators";
import CreatorAvatar from "@/components/CreatorAvatar";
import s from "@/components/creators.module.css";

export const metadata = {
  title: "صناع محتوى الذكاء الاصطناعي بالعربي",
  description: "أشهر صناع المحتوى العرب اللي بيشرحوا الذكاء الاصطناعي وأدواته، ولكل واحد صفحة فيها شغله وروابطه.",
  alternates: { canonical: "/creators" },
};

export default function CreatorsPage() {
  return (
    <div className={s.page}>
      <h1 className="page-title">صناع المحتوى</h1>
      <p className={s.lead}>
        صناع محتوى عرب بيشرحوا الذكاء الاصطناعي وأدواته بالعربي. دوس على أي اسم تشوف بيقدّم إيه وروابط صفحاته.
      </p>
      <div className={s.grid}>
        {CREATORS.map((c) => (
          <Link key={c.slug} href={`/creators/${c.slug}`} className={s.card}>
            <CreatorAvatar c={c} size={54} />
            <span>
              <b>{c.name}</b>
              <small>{c.role}</small>
              <span className={s.nets}>
                {Object.keys(c.links).slice(0, 3).map((k) => <i key={k}>{LINK_LABELS[k] || k}</i>)}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <p className={s.note}>
        المعلومات متاخدة من صفحات أصحابها أو من مقالات منشورة، ولكل صفحة مصدرها. لو أنت صاحب صفحة هنا وعاوز تعدّل بياناتك أو تضيف صورتك أو إيميلك، أو عاوز تنضم للقائمة، تواصل مع إدارة الموقع.
      </p>
    </div>
  );
}
