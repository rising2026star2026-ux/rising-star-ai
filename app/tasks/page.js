import Link from "next/link";
import { TASKS } from "@/lib/tasks";
import s from "@/components/directory.module.css";

export const metadata = {
  title: "أداة ذكاء اصطناعي لأي مهمة",
  description: "قول المهمة اللي عايز تعملها (شعار، سيرة ذاتية، ترجمة، فيديو، برمجة...) وهتلاقي أنسب أدوات الذكاء الاصطناعي ليها بالعربي، مجانية ومدفوعة.",
  alternates: { canonical: "/tasks" },
};

export default function TasksIndex() {
  return (
    <div className={s.page}>
      <h1 className="page-title">أداة ذكاء اصطناعي لـ... إيه؟</h1>
      <p className={s.lead}>اختار المهمة اللي عايز تخلّصها، وهنوريك أنسب الأدوات ليها: أدوات الموقع الجاهزة وأدوات عالمية من الدليل، بشرح بالعربي وسعر كل أداة.</p>
      <div className={s.grid}>
        {TASKS.map((t) => (
          <Link key={t.slug} href={`/task/${t.slug}`} className={s.tool}>
            <span>
              <b>أداة ذكاء اصطناعي لـ{t.title}</b>
              <small>{t.intro}</small>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
