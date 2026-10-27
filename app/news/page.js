import fs from "node:fs";
import path from "node:path";
import NewsList from "@/components/NewsList";
import s from "@/components/learn.module.css";

export const metadata = {
  title: "جديد الذكاء الاصطناعي",
  description: "آخر أخبار وتطورات الذكاء الاصطناعي والشركات الكبيرة، بتتحدّث لوحدها كل يوم وبملخصات بالعربي.",
  alternates: { canonical: "/news" },
};

function load() {
  try { return JSON.parse(fs.readFileSync(path.join(process.cwd(), "data/news/items.json"), "utf8")); } catch { return { items: [], updated: null }; }
}

export default function News() {
  const { items, updated } = load();
  const when = updated ? new Intl.DateTimeFormat("ar-EG", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Cairo" }).format(new Date(updated)) : null;
  return (
    <div className={s.page}>
      <section className={`${s.hero} ${s.news}`}>
        <h1>جديد الذكاء الاصطناعي</h1>
        <p>أخبار وتطورات الشركات الكبيرة زي OpenAI وGoogle وMicrosoft وNVIDIA، مجمّعة من مصادرها وبتتحدّث لوحدها كل يوم. {when && <>آخر تحديث: {when}.</>}</p>
      </section>
      <NewsList items={items} />
      <p className={s.note}>الملخصات العربية مكتوبة بالذكاء الاصطناعي من نص الخبر وممكن فيها أخطاء، والمصدر الأصلي هو المرجع. دوس على الخبر تفتح مصدره.</p>
    </div>
  );
}
