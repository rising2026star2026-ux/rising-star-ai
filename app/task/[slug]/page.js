import Link from "next/link";
import { notFound } from "next/navigation";
import { TASKS, getTask, pickTools } from "@/lib/tasks";
import { DIR_APPS, DIR_TOOLS, card } from "@/lib/directory";
import { getTool, isListed } from "@/lib/tools";
import { SITE_URL, BRAND } from "@/lib/site";
import ToolIcon from "@/components/ToolIcon";
import DirTools from "@/components/DirTools";
import s from "@/components/directory.module.css";

export function generateStaticParams() {
  return TASKS.map((t) => ({ slug: t.slug }));
}
export const dynamicParams = false;

const ALL = [...DIR_APPS, ...DIR_TOOLS];
const heading = (t) => `أداة ذكاء اصطناعي لـ${t.title}`;

function data(slug) {
  const task = getTask(slug);
  if (!task) return null;
  const picks = pickTools(ALL, task);
  const mine = task.site.filter(isListed).map(getTool);
  const free = picks.filter((t) => t.pricing?.type === "free" || t.pricing?.type === "freemium");
  const faq = [
    [`إيه أفضل أداة ذكاء اصطناعي لـ${task.title}؟`, `حسب احتياجك وميزانيتك. ابدأ بأدوات ${BRAND} الجاهزة ${mine.length ? `(${mine.map((t) => t.name).join("، ")})` : ""} وبعدين قارن بأدوات الدليل زي ${picks.slice(0, 3).map((t) => t.name).join("، ")}. كل أداة ليها صفحة بالعربي فيها شرحها وسعرها.`],
    [`فيه أدوات مجانية لـ${task.title}؟`, free.length ? `أيوه، ${free.length} من الأدوات اللي في الصفحة معروف إن فيها خطة مجانية أو مجانية بالكامل. الحدود بتختلف من أداة للتانية، فاتأكد من صفحة الأداة وموقعها الرسمي.` : "في الأدوات دي غالباً تجربة مجانية أو خطة بحدود، والتسعير بيتغير كتير. افتح صفحة كل أداة وموقعها الرسمي وتأكد قبل ما تدفع."],
    ["إزاي أختار بين الأدوات؟", "شوف وصفها بالعربي في صفحتها، وفلتر بالتسعير من الأزرار تحت، وجرّب النسخة المجانية لو متاحة قبل ما تشترك."],
  ];
  return { task, picks, mine, faq };
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const d = data(slug);
  if (!d) return {};
  const title = heading(d.task);
  const description = `${d.task.intro} أنسب ${d.picks.length} أداة لـ${d.task.title} بشرح بالعربي وسعر كل أداة.`;
  return { title, description, alternates: { canonical: `/task/${slug}` }, openGraph: { title: `${title} | ${BRAND}`, description, url: `/task/${slug}`, siteName: BRAND, locale: "ar_EG", type: "website" } };
}

export default async function TaskPage({ params }) {
  const { slug } = await params;
  const d = data(slug);
  if (!d) notFound();
  const { task, picks, mine, faq } = d;
  const others = TASKS.filter((t) => t.slug !== slug && t.cats.some((c) => task.cats.includes(c))).slice(0, 6);

  const ld = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "المهام", item: `${SITE_URL}/tasks` },
        { "@type": "ListItem", position: 3, name: heading(task), item: `${SITE_URL}/task/${slug}` },
      ] },
      { "@type": "ItemList", name: heading(task), itemListElement: picks.map((t, i) => ({ "@type": "ListItem", position: i + 1, name: t.name, url: `${SITE_URL}${t.href}` })) },
      { "@type": "FAQPage", mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    ],
  };

  return (
    <div className={s.page}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <nav className={s.crumbs} aria-label="مسار الصفحة">
        <Link href="/tasks">المهام</Link><span aria-hidden="true">/</span><span>{task.title}</span>
      </nav>
      <h1 className="page-title">{heading(task)}</h1>
      <p className={s.lead}>{task.intro}</p>

      {mine.length > 0 && (
        <section className="related" aria-labelledby="mine">
          <h2 id="mine">أدوات جاهزة هنا في {BRAND}</h2>
          <div className="shelf-row">
            {mine.map((t) => (
              <Link key={t.id} href={`/tool/${t.id}`} className="shelf-item">
                <ToolIcon tool={t} size="sm" />
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section aria-labelledby="dir">
        <h2 id="dir">أدوات عالمية لـ{task.title} ({picks.length})</h2>
        <DirTools items={picks.map(card)} />
      </section>

      <section aria-labelledby="faq">
        <h2 id="faq">أسئلة شائعة</h2>
        <div className="guide-faq">
          {faq.map(([q, a]) => (
            <details key={q}>
              <summary>{q}</summary>
              <p>{a}</p>
            </details>
          ))}
        </div>
      </section>

      {others.length > 0 && (
        <section className="related" aria-labelledby="more">
          <h2 id="more">مهام قريبة</h2>
          <div className="shelf-row">
            {others.map((t) => <Link key={t.slug} href={`/task/${t.slug}`} className="shelf-item"><span>{t.title}</span></Link>)}
          </div>
        </section>
      )}
    </div>
  );
}
