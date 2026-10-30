import Link from "next/link";
import { notFound } from "next/navigation";
import { AGENTS, getAgent } from "@/lib/agents";
import AgentRunner from "@/components/AgentRunner";
import s from "@/components/agents.module.css";

export function generateStaticParams() {
  return AGENTS.map((a) => ({ id: a.id }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { id } = await params;
  const a = getAgent(id);
  if (!a) return {};
  return { title: `${a.name}: وكيل ذكاء اصطناعي مجاني`, description: a.desc, alternates: { canonical: `/agents/${id}` } };
}

export default async function AgentPage({ params }) {
  const { id } = await params;
  const a = getAgent(id);
  if (!a) notFound();
  const { plan, write, ...pub } = a; // تعليمات الوكيل بتفضل على السيرفر
  return (
    <div className={s.page}>
      <p className={s.crumbs}><Link href="/agents">الوكلاء</Link> ← {a.name}</p>
      <h1 className="page-title">{a.icon} {a.name}</h1>
      <p className={s.lead}>{a.desc}</p>
      <AgentRunner agent={pub} />
    </div>
  );
}
