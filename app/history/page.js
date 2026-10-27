"use client";
import Link from "next/link";
import { getTool, isListed } from "@/lib/tools";
import { useStored } from "@/lib/store";
import ToolIcon from "@/components/ToolIcon";

const fmt = (t) => new Date(t).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });

export default function History() {
  const [items, setItems] = useStored("history", []);

  return (
    <>
      <div className="section-head">
        <h1 className="page-title">السجل</h1>
        {items.length > 0 && <button className="btn ghost" onClick={() => setItems([])}>امسح السجل</button>}
      </div>
      <p className="muted">آخر 30 نتيجة، محفوظة على جهازك بس.</p>

      {items.length ? (
        <div className="history">
          {items.map((h) => {
            const tool = getTool(h.toolId);
            if (!tool) return null;
            return (
              <div key={h.id} className="history-item">
                <Link href={isListed(h.toolId) ? `/tool/${h.toolId}?h=${h.id}` : "/tools"} className="history-main">
                  <ToolIcon tool={tool} size="sm" />
                  <span>
                    <b>{tool.name}</b>
                    <small>{h.input.slice(0, 90)}{h.input.length > 90 ? "…" : ""}</small>
                    <time>{fmt(h.at)}</time>
                  </span>
                </Link>
                <button className="icon-btn" aria-label="احذف" onClick={() => setItems((list) => list.filter((x) => x.id !== h.id))}>✕</button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="empty">
          لسه مفيش نتايج. <Link href="/tools" className="link">افتح أي أداة وابدأ</Link>
        </div>
      )}
    </>
  );
}
