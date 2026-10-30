"use client";
// واجهة تشغيل الوكيل: الحقول ← خطوات شغالة قدامك ← المصادر ← النتيجة
import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ShareBar from "@/components/ShareBar";
import s from "./agents.module.css";

export default function AgentRunner({ agent }) {
  const [vals, setVals] = useState(() => Object.fromEntries(agent.fields.map((f) => [f.key, f.def || ""])));
  const [steps, setSteps] = useState([]);
  const [srcs, setSrcs] = useState([]);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const stop = useRef(null);
  const md = useRef(null);

  async function run(e) {
    e?.preventDefault();
    if (busy) { stop.current?.abort(); return; }
    setSteps([]); setSrcs([]); setOut(""); setErr(""); setBusy(true);
    const ctrl = new AbortController();
    stop.current = ctrl;
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent: agent.id, inputs: vals }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) {
        let m = "حصلت مشكلة. جرّب تاني.";
        try { m = (await res.json()).error || m; } catch {}
        setErr(m);
        return;
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop();
        for (const l of lines) {
          if (!l.trim()) continue;
          let ev;
          try { ev = JSON.parse(l); } catch { continue; }
          if (ev.t === "step") setSteps((x) => [...x, ev.m]);
          else if (ev.t === "src") setSrcs(ev.items);
          else if (ev.t === "x") setOut((x) => x + ev.d);
          else if (ev.t === "err") setErr(ev.m);
        }
      }
    } catch (e2) {
      if (e2?.name !== "AbortError") setErr("الاتصال اتقطع. جرّب تاني.");
    } finally {
      setBusy(false);
      stop.current = null;
    }
  }

  const ready = agent.fields.every((f) => (vals[f.key] || "").trim());

  return (
    <>
      <form className={s.form} onSubmit={run}>
        {agent.fields.map((f) => (
          <label key={f.key}>
            <span>{f.label}</span>
            {f.long ? (
              <textarea value={vals[f.key]} placeholder={f.placeholder} maxLength={1500} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            ) : (
              <input value={vals[f.key]} placeholder={f.placeholder} maxLength={300} onChange={(e) => setVals({ ...vals, [f.key]: e.target.value })} />
            )}
          </label>
        ))}
        <button type="submit" className={s.go} disabled={!busy && !ready}>{busy ? "⏹ إيقاف" : `▶ شغّل ${agent.name}`}</button>
        <p className={s.hint}>الوكيل بياخد من 20 ثانية لدقيقة: بيخطط، يبحث، يقرا المصادر، وبعدين يكتب.</p>
      </form>

      {(steps.length > 0 || busy) && (
        <ol className={s.steps}>
          {steps.map((m, i) => (
            <li key={i} className={busy && i === steps.length - 1 && !out ? s.now : s.done}>{m}</li>
          ))}
        </ol>
      )}

      {err && <p className={s.err}>{err}</p>}

      {out && (
        <div className={s.result}>
          <div ref={md} className={s.md}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{out}</ReactMarkdown>
          </div>
          {!busy && <ShareBar text={out} getHtml={() => md.current?.innerHTML || ""} title={agent.name} />}
        </div>
      )}

      {srcs.length > 0 && (
        <div className={s.srcs}>
          <h2>المصادر</h2>
          <ol>
            {srcs.map((x) => (
              <li key={x.n}><a href={x.url} target="_blank" rel="noopener noreferrer">[{x.n}] {x.title}</a></li>
            ))}
          </ol>
        </div>
      )}
    </>
  );
}
