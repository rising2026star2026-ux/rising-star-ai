import Link from "next/link";
import { notFound } from "next/navigation";
import { FLOWS, getFlow } from "@/lib/flows";
import { getTool } from "@/lib/tools";
import { SITE_URL, BRAND } from "@/lib/site";
import FlowRunner from "@/components/FlowRunner";
import s from "@/components/flow.module.css";

export function generateStaticParams() {
  return FLOWS.map((f) => ({ id: f.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const f = getFlow(id);
  if (!f) return {};
  return {
    title: `${f.name} بالذكاء الاصطناعي`,
    description: f.desc,
    alternates: { canonical: `/flow/${id}` },
    openGraph: { title: `${f.name} | ${BRAND}`, description: f.desc, url: `/flow/${id}`, siteName: BRAND, locale: "ar_EG", type: "website" },
  };
}

export default async function FlowPage({ params }) {
  const { id } = await params;
  const flow = getFlow(id);
  if (!flow) notFound();

  const ld = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: flow.name,
    description: flow.desc,
    url: `${SITE_URL}/flow/${flow.id}`,
    step: flow.steps.map((st, i) => ({ "@type": "HowToStep", position: i + 1, name: st.title, text: `${st.title} باستخدام أداة ${getTool(st.tool)?.name}` })),
  }).replace(/</g, "\\u003c");

  return (
    <div className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ld }} />
      <nav className="crumbs" aria-label="المسار">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true">/</span>
        <Link href="/flows">المهام الكاملة</Link>
      </nav>

      <div className="tool-head">
        <span className="ticon ticon-lg" style={{ "--c": flow.color }} aria-hidden="true">{flow.icon}</span>
        <div>
          <h1>{flow.name}</h1>
          <p>{flow.desc}</p>
        </div>
      </div>

      <div className={s.preview} aria-label="خطوات المهمة">
        {flow.steps.map((st, i) => (
          <span key={i} style={{ display: "contents" }}>
            {i > 0 && <i aria-hidden="true">←</i>}
            <span>{st.title}</span>
          </span>
        ))}
      </div>

      <FlowRunner flowId={flow.id} />
    </div>
  );
}
