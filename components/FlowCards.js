import Link from "next/link";
import { FLOWS } from "@/lib/flows";
import s from "./flow.module.css";

/** كروت المهام الكاملة. row: صف أفقي (للرئيسية) بدل الشبكة */
export default function FlowCards({ row = false }) {
  return (
    <div className={row ? s.row : s.grid}>
      {FLOWS.map((f) => (
        <Link key={f.id} href={`/flow/${f.id}`} className={s.card}>
          <span className={s.cardTop}>
            <span className="ticon" style={{ "--c": f.color }} aria-hidden="true">{f.icon}</span>
            <span>
              <b>{f.name}</b>
              <small>{f.steps.length} خطوات</small>
            </span>
          </span>
          {!row && <p>{f.desc}</p>}
          <span className={s.chain} aria-hidden="true">
            {f.steps.slice(0, row ? 3 : 6).map((st) => <span key={st.title}>{st.title}</span>)}
            {row && f.steps.length > 3 && <em>+{f.steps.length - 3}</em>}
          </span>
        </Link>
      ))}
    </div>
  );
}
