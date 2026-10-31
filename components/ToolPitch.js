import Link from "next/link";
import { LANDING } from "@/lib/landing";
import TryExample from "./TryExample";

// بلوك الرسالة فوق الأداة (لأصحاب المشاريع). مالوش أي رد مزيف: الأمثلة بتشتغل على الأداة نفسها.
export default function ToolPitch({ id, example }) {
  const p = LANDING[id];
  if (!p) return null;
  return (
    <section className="pitch" aria-label="ليه الأداة دي">
      <h2>{p.title}</h2>
      <p>{p.sub}</p>
      <ul className="pitch-points">
        {p.points.map(([t, d]) => (
          <li key={t}><b>{t}</b><span>{d}</span></li>
        ))}
      </ul>
      <ol className="pitch-steps">
        {p.steps.map((x) => <li key={x}>{x}</li>)}
      </ol>
      <div className="pitch-actions">
        {example && <TryExample text={example} />}
        <Link href="/plans" className="btn ghost">شوف الخطط</Link>
      </div>
    </section>
  );
}
