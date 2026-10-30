import Link from "next/link";
import { AGENTS } from "@/lib/agents";
import s from "@/components/agents.module.css";

export const metadata = {
  title: "الوكلاء: مساعدين بيبحثوا ويشتغلوا بدالك",
  description: "وكلاء ذكاء اصطناعي مجانيين بالعربي: باحث شامل، دراسة سوق، مقارن أسعار، مدقق معلومات، خطة محتوى، ومخطط رحلات. بيبحثوا في الإنترنت ويكتبولك النتيجة بالمصادر.",
  alternates: { canonical: "/agents" },
};

export default function Agents() {
  return (
    <div className={s.page}>
      <h1 className="page-title">الوكلاء</h1>
      <p className={s.lead}>الوكيل مش مجرد شات: بتديله المهمة، وهو بيخطط ويبحث في الإنترنت ويقرا المصادر بنفسه، وبعدين يكتبلك النتيجة منظمة بالمصادر. مجاني.</p>
      <div className={s.how}>
        <div><b>1. يخطط</b>يقسم المهمة لأسئلة بحث</div>
        <div><b>2. يبحث</b>من كذا زاوية</div>
        <div><b>3. يقرا</b>أهم المصادر بنفسه</div>
        <div><b>4. يكتب</b>نتيجة منظمة بالمصادر</div>
      </div>
      <div className={s.grid}>
        {AGENTS.map((a) => (
          <Link key={a.id} href={`/agents/${a.id}`} className={s.card}>
            <span className={s.icon} aria-hidden="true">{a.icon}</span>
            <span><b>{a.name}</b><small>{a.desc}</small></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
