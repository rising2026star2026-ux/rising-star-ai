import { PROMPTS, PROMPT_CATS } from "@/lib/prompts";
import Link from "next/link";
import PromptsGrid from "@/components/PromptsGrid";
import s from "@/components/prompts.module.css";

export const metadata = {
  title: "مكتبة البرومبتات: أوامر جاهزة للصور والفيديو والريلز",
  description: "أكتر من 75 برومبت جاهز بضغطة نسخ: توليد صور، صور منتجات، شعارات، تعديل صور، فيديو سينمائي، حركات كاميرا، ريلز، وتسويق بالعربي.",
  alternates: { canonical: "/prompts" },
};

export default function Prompts() {
  return (
    <div className={s.page}>
      <h1 className="page-title">مكتبة البرومبتات</h1>
      <p className={s.lead}>
        أوامر جاهزة تنسخها وتحطها في أي مولّد صور أو فيديو أو في الشات. غيّر الكلام اللي بين الأقواس [زي كده] بموضوعك (أو عدّله من زرار «عدّل الأقواس») وانسخ. برومبتات الصور والفيديو بالإنجليزي لأن الموديلات بتفهمه أدق.
      </p>
      <Link href="/prompts/builder" className={s.builderBanner}>
        <b>جديد: مولّد البرومبتات</b>
        <span>اختار النوع والمعايير وخد برومبت منظم فوراً، أو ولّد من 10 لـ100 برومبت جديد لمجالك، أو حسّن برومبت ضعيف ←</span>
      </Link>
      <div className={s.stats}>
        <span className={s.stat}><b>{PROMPTS.length}</b>برومبت</span>
        <span className={`${s.stat} ${s.blue}`}><b>{PROMPT_CATS.length}</b>تصنيف</span>
      </div>
      <PromptsGrid prompts={PROMPTS} cats={PROMPT_CATS} />
    </div>
  );
}
