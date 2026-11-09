"use client";
// خريطة المصادر: شبكة تفاعلية بتوضح المصادر اللي بتستشهد ببعض أو بتشترك في مراجع، والمؤلفين والمواضيع المشتركة،
// ومعاها تحليل (محاور البحث، الفجوات، تبدأ قراءة بإيه). بتتفتح من صفحة الباحث الأكاديمي بعد ما المصادر تظهر.
import { useEffect, useMemo, useRef, useState } from "react";
import { read, write } from "@/lib/store";
import { buildMap, layout } from "@/lib/sourcemap";
import s from "./sourcemap.module.css";

const CLUSTER_COLORS = ["#1f4dff", "#12a36b", "#e0791b", "#b03fd6", "#d23a59"];
const KIND_COLOR = { paper: "#1f4dff", book: "#12a36b", thesis: "#b03fd6", report: "#d97706", encyclopedia: "#64748b", video: "#e11d48" };
const KIND = { paper: "بحث", book: "كتاب", thesis: "رسالة", report: "تقرير", encyclopedia: "مرجع عام", video: "فيديو" };
const LINK_STYLE = {
  cites: { stroke: "#e0791b", width: 2.2, dash: "" },
  shared: { stroke: "#1f4dff", width: 1.6, dash: "5 4" },
  author: { stroke: "#8a8fa8", width: 1, dash: "" },
  topic: { stroke: "#b8bccc", width: 0.9, dash: "2 3" },
};
const shortLabel = (t, n = 26) => (t.length > n ? t.slice(0, n - 1) + "…" : t);

export default function SourceMap({ topic, sources, picked, onToggle }) {
  const boxRef = useRef(null);
  const [w, setW] = useState(760);
  const [show, setShow] = useState({ author: true, topic: true });
  const [sel, setSel] = useState(null);
  const [focus, setFocus] = useState(null); // رقم محور مختار
  const [ai, setAi] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const key = sources.map((x) => x.n + ":" + x.title.slice(0, 20)).join("|");
  useEffect(() => {
    const saved = read("research-map", null);
    if (saved?.key === key) setAi(saved.data);
    else setAi(null);
    setSel(null); setFocus(null);
  }, [key]);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(Math.max(300, Math.round(el.clientWidth))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const h = w < 600 ? Math.round(w * 1.15) : 520;
  const map = useMemo(() => buildMap(sources), [key]); // eslint-disable-line react-hooks/exhaustive-deps
  const shown = useMemo(() => ({
    nodes: map.nodes.filter((n) => n.type === "source" || show[n.type]),
    links: map.links.filter((l) => (l.type !== "author" || show.author) && (l.type !== "topic" || show.topic)),
  }), [map, show]);
  const geo = useMemo(() => layout(shown, { width: w, height: h }), [shown, w, h]);

  const bySrc = Object.fromEntries(sources.map((x) => [x.n, x]));
  const clusterOf = {};
  (ai?.clusters || []).forEach((c, i) => c.src.forEach((n) => { if (clusterOf[n] == null) clusterOf[n] = i; }));
  const label = (t) => ai?.labels?.[t] || t;

  const near = new Set();
  if (sel) { near.add(sel); for (const l of geo.links) { if (l.a === sel) near.add(l.b); if (l.b === sel) near.add(l.a); } }
  if (focus != null) for (const n of ai?.clusters?.[focus]?.src || []) near.add(`s${n}`);
  const dimmed = (id) => near.size > 0 && !near.has(id);

  async function analyze() {
    setBusy(true); setErr("");
    try {
      const relations = map.links.filter((l) => l.type === "cites" || l.type === "shared").map((l) => ({ a: Number(l.a.slice(1)), b: Number(l.b.slice(1)), type: l.type }));
      const r = await fetch("/api/research", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "map", topic, sources: sources.map(({ n, title, year, kind, topics, authors }) => ({ n, title, year, kind, topics, authors })), relations, topicNames: map.stats.topicNames }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error || "حصل خطأ، جرّب تاني.");
      setAi(d);
      write("research-map", { key, data: d });
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  const st = map.stats;
  const selNode = sel ? geo.nodes.find((n) => n.id === sel) : null;
  const selSrc = selNode?.type === "source" ? bySrc[selNode.n] : null;
  const linked = (id) => geo.links.filter((l) => l.a === id || l.b === id);

  return (
    <section className={s.wrap} aria-label="خريطة المصادر">
      <div className={s.top}>
        <div>
          <b className={s.title}>خريطة المصادر</b>
          <p className={s.sum}>
            {st.sources} مصدر
            {st.cites ? ` · ${st.cites} استشهاد مباشر بينهم` : ""}
            {st.shared ? ` · ${st.shared} زوج بيشتركوا في مراجع` : ""}
            {st.authors ? ` · ${st.authors} مؤلف مشترك` : ""}
            {st.topics ? ` · ${st.topics} موضوع مشترك` : ""}
          </p>
        </div>
        <div className={s.toggles}>
          <label><input type="checkbox" checked={show.topic} onChange={(e) => setShow((v) => ({ ...v, topic: e.target.checked }))} /> المواضيع</label>
          <label><input type="checkbox" checked={show.author} onChange={(e) => setShow((v) => ({ ...v, author: e.target.checked }))} /> المؤلفين</label>
        </div>
      </div>
      {!st.hasRefs && <p className={s.hint}>الخريطة دي من غير بيانات الاستشهاد. دوّر تاني في المكتبات عشان تظهر العلاقات بين الأبحاث.</p>}

      <div ref={boxRef} className={s.canvas}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-label="شبكة المصادر والعلاقات بينها" onClick={(e) => { if (e.target.tagName === "svg") { setSel(null); setFocus(null); } }}>
          {geo.links.map((l, i) => {
            const S = LINK_STYLE[l.type];
            const on = sel && (l.a === sel || l.b === sel);
            return <line key={i} x1={l.A.x} y1={l.A.y} x2={l.B.x} y2={l.B.y} stroke={S.stroke} strokeWidth={on ? S.width + 1 : S.width} strokeDasharray={S.dash} opacity={dimmed(l.a) || dimmed(l.b) ? 0.08 : on ? 1 : 0.55} markerEnd={l.type === "cites" ? "url(#arrow)" : undefined} />;
          })}
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="16" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#e0791b" /></marker>
          </defs>
          {geo.nodes.map((n) => {
            const dim = dimmed(n.id);
            const isSel = n.id === sel;
            if (n.type === "source") {
              const src = bySrc[n.n];
              const color = clusterOf[n.n] != null ? CLUSTER_COLORS[clusterOf[n.n] % CLUSTER_COLORS.length] : KIND_COLOR[n.kind] || KIND_COLOR.paper;
              const off = picked && !picked.has(n.n);
              return (
                <g key={n.id} className={s.node} transform={`translate(${n.x},${n.y})`} opacity={dim ? 0.2 : 1} onClick={() => setSel(isSel ? null : n.id)} tabIndex={0} role="button" aria-label={`المصدر ${n.n}: ${src?.title || ""}`} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSel(isSel ? null : n.id); } }}>
                  <circle r={n.size + 4} fill={color} fillOpacity={off ? 0.25 : 0.95} stroke={isSel ? "var(--ink, #111)" : "#fff"} strokeWidth={isSel ? 3 : 1.5} />
                  {st.hub === n.n && <circle r={n.size + 8} fill="none" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" />}
                  <text className={s.num} textAnchor="middle" dy="0.35em">{n.n}</text>
                </g>
              );
            }
            const isTopic = n.type === "topic";
            return (
              <g key={n.id} className={s.node} transform={`translate(${n.x},${n.y})`} opacity={dim ? 0.15 : 1} onClick={() => setSel(isSel ? null : n.id)} role="button" tabIndex={0} aria-label={`${isTopic ? "موضوع" : "مؤلف"}: ${label(n.label)}`} onKeyDown={(e) => { if (e.key === "Enter") setSel(isSel ? null : n.id); }}>
                {isTopic
                  ? <rect x={-5} y={-5} width={10} height={10} rx={2} transform="rotate(45)" fill="#fff" stroke="#8a8fa8" strokeWidth={isSel ? 2.5 : 1.3} />
                  : <circle r={4.5} fill="#8a8fa8" stroke="#fff" strokeWidth={1} />}
                <text className={isTopic ? s.topicLabel : s.authorLabel} textAnchor="middle" y={-10} dir="auto">{shortLabel(label(n.label), w < 600 ? 18 : 28)}</text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className={s.legend} aria-hidden="true">
        <span><i className={s.lCite} /> بيستشهد بـ</span>
        <span><i className={s.lShared} /> بيشتركوا في مراجع</span>
        <span><i className={s.lTopic} /> موضوع</span>
        <span><i className={s.lAuthor} /> مؤلف مشترك</span>
        {st.hub ? <span><i className={s.lHub} /> المصدر المحوري</span> : null}
      </div>

      {selSrc && (
        <div className={s.detail}>
          <span className={s.dTop}><em>{KIND[selSrc.kind] || "بحث"}</em><b>[{selSrc.n}]</b>{selSrc.year ? <small>{selSrc.year}</small> : null}{selSrc.cites ? <small>{selSrc.cites} استشهاد</small> : null}{st.hub === selSrc.n ? <small className={s.hub}>الأكثر ارتباطاً بباقي المصادر</small> : null}</span>
          <strong dir="auto">{selSrc.title}</strong>
          {selSrc.authors?.length > 0 && <span className={s.dSub} dir="auto">{selSrc.authors.join("، ")}</span>}
          {(selSrc.topics || []).length > 0 && <span className={s.dSub}>المواضيع: {(selSrc.topics || []).map(label).join("، ")}</span>}
          <ul className={s.rel}>
            {linked(sel).filter((l) => l.type === "cites" || l.type === "shared").map((l, i) => {
              const other = l.a === sel ? l.b : l.a;
              const o = bySrc[Number(other.slice(1))];
              const txt = l.type === "cites" ? (l.a === sel ? "بيستشهد بـ" : "بيستشهد بيه") : `بيشتركوا في ${l.k} مرجع مع`;
              return o ? <li key={i}><button type="button" onClick={() => setSel(other)}>{txt} [{o.n}] {shortLabel(o.title, 60)}</button></li> : null;
            })}
          </ul>
          <div className={s.dActions}>
            {onToggle && <label className={s.pick}><input type="checkbox" checked={picked?.has(selSrc.n) || false} onChange={() => onToggle(selSrc.n)} /> ضمن التقرير</label>}
            {selSrc.url && <a href={selSrc.url} target="_blank" rel="noopener noreferrer nofollow">صفحة المصدر</a>}
            {selSrc.oa && <a href={selSrc.oa} target="_blank" rel="noopener noreferrer nofollow">النص الكامل</a>}
          </div>
        </div>
      )}
      {selNode && !selSrc && (
        <div className={s.detail}>
          <strong dir="auto">{selNode.type === "topic" ? "موضوع: " : "مؤلف: "}{label(selNode.label)}</strong>
          <ul className={s.rel}>
            {(selNode.src || []).map((n) => bySrc[n] && <li key={n}><button type="button" onClick={() => setSel(`s${n}`)}>[{n}] {shortLabel(bySrc[n].title, 70)}</button></li>)}
          </ul>
        </div>
      )}

      <div className={s.ai}>
        {!ai && (
          <div className={s.aiStart}>
            <p>خلّي الذكاء الاصطناعي يقرا الخريطة ويقسّم المصادر لمحاور، ويطلّع الفجوات البحثية، ويقولك تبدأ قراءة بإيه.</p>
            <button type="button" className={s.btn} onClick={analyze} disabled={busy}>{busy ? "بيحلل الخريطة…" : "حلّل الخريطة"}</button>
          </div>
        )}
        {err && <p className={s.err} role="alert">{err}</p>}
        {ai && (
          <>
            <b className={s.aiTitle}>محاور البحث</b>
            <div className={s.clusters}>
              {ai.clusters.map((c, i) => (
                <button type="button" key={i} className={`${s.cluster} ${focus === i ? s.clusterOn : ""}`} onClick={() => { setFocus(focus === i ? null : i); setSel(null); }} aria-pressed={focus === i}>
                  <span className={s.dot} style={{ background: CLUSTER_COLORS[i % CLUSTER_COLORS.length] }} />
                  <span><b>{c.name}</b> <small>({c.src.map((n) => `[${n}]`).join(" ")})</small>{c.note ? <span className={s.note}>{c.note}</span> : null}</span>
                </button>
              ))}
            </div>
            {ai.start?.length > 0 && (
              <>
                <b className={s.aiTitle}>ابدأ القراءة بالترتيب ده</b>
                <ol className={s.start}>{ai.start.map((n) => bySrc[n] && <li key={n}><button type="button" onClick={() => setSel(`s${n}`)}>[{n}] {shortLabel(bySrc[n].title, 80)}</button></li>)}</ol>
              </>
            )}
            {ai.gaps?.length > 0 && (
              <>
                <b className={s.aiTitle}>فجوات بحثية ممكن تشتغل عليها</b>
                <ul className={s.gaps}>{ai.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
              </>
            )}
            {st.isolated.length > 0 && <p className={s.hint}>مصادر مالهاش علاقة ظاهرة بالباقي: {st.isolated.map((n) => `[${n}]`).join(" ")}. راجعها: ممكن تكون بعيدة عن موضوعك.</p>}
            <button type="button" className={s.ghost} onClick={analyze} disabled={busy}>{busy ? "بيحلل…" : "حلّل تاني"}</button>
          </>
        )}
      </div>
    </section>
  );
}
