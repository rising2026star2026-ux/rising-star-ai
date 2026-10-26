"use client";
// تشغيل مهمة كاملة: كل خطوة أداة، ونتيجتها بتدخل في الخطوات اللي بعدها
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { getFlow, fillStep } from "@/lib/flows";
import { getTool } from "@/lib/tools";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { read, toast } from "@/lib/store";
import ToolIcon from "./ToolIcon";
import ShareBar from "./ShareBar";
import s from "./flow.module.css";

const LABELS = { idle: "في الانتظار", running: "بيشتغل…", done: "خلصت", error: "وقفت", stopped: "اتوقفت" };

export default function FlowRunner({ flowId }) {
  const flow = getFlow(flowId);
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState(() => flow.steps.map(() => ({ status: "idle", text: "", error: "" })));
  const [running, setRunning] = useState(false);
  const abortRef = useRef(null);
  const allRef = useRef(null);
  const inRef = useRef(null);

  // ?q= من الرابط
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setInput(q.slice(0, 4000));
  }, []);

  const update = (i, patch) => setSteps((list) => list.map((x, k) => (k === i ? { ...x, ...patch } : x)));

  async function runStep(i, outputs, signal) {
    const step = flow.steps[i];
    update(i, { status: "running", text: "", error: "" });
    const res = await fetch("/api/run", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
      body: JSON.stringify({
        toolId: step.tool,
        input: fillStep(step.input, input, outputs),
        option: step.option,
        settings: read("settings", DEFAULT_SETTINGS),
      }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "حصلت مشكلة. جرّب تاني.");
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let text = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += dec.decode(value, { stream: true });
      update(i, { text });
    }
    if (!text.trim()) throw new Error("ما وصلش رد. جرّب تاني.");
    update(i, { status: "done", text });
    return text;
  }

  // from: نبدأ من أنهي خطوة (عشان «كمّل من هنا» بعد أي مشكلة)
  async function run(from = 0) {
    if (!input.trim() || running) return;
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setRunning(true);
    const outputs = steps.map((x) => x.text);
    if (from === 0) setSteps(flow.steps.map(() => ({ status: "idle", text: "", error: "" })));
    for (let i = from; i < flow.steps.length; i++) {
      try {
        outputs[i] = await runStep(i, outputs, ctrl.signal);
      } catch (e) {
        if (e.name === "AbortError") {
          update(i, { status: "stopped" });
          toast("المهمة اتوقفت");
        } else {
          update(i, { status: "error", error: e.message || "الاتصال اتقطع." });
        }
        break;
      }
    }
    setRunning(false);
    abortRef.current = null;
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(text); toast("اتنسخ"); } catch { toast("النسخ مش متاح في المتصفح ده"); }
  }

  const doneCount = steps.filter((x) => x.status === "done").length;
  const allDone = doneCount === flow.steps.length;
  const started = steps.some((x) => x.status !== "idle");
  const fullText = flow.steps.map((st, i) => (steps[i].text ? `## ${st.title}\n\n${steps[i].text}` : "")).filter(Boolean).join("\n\n");

  return (
    <>
      <div className="composer">
        <div className="composer-top">
          <label htmlFor="flow-in">اكتب طلبك مرة واحدة</label>
          <button type="button" className="fav" onClick={() => { setInput(flow.example); inRef.current?.focus(); }}>
            جرّب مثال
          </button>
        </div>
        <textarea
          id="flow-in"
          ref={inRef}
          value={input}
          maxLength={4000}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) run(); }}
          placeholder={flow.placeholder}
        />
        <div className="composer-bar">
          <span className="meta">{flow.steps.length} خطوات • كل خطوة بتتحسب طلب</span>
          <div className="composer-actions">
            {running ? (
              <button className="btn stop" onClick={() => abortRef.current?.abort()}>إيقاف</button>
            ) : (
              <button className="btn" onClick={() => run(0)} disabled={!input.trim()}>
                {started ? "ابدأ من الأول" : "ابدأ المهمة"}
              </button>
            )}
          </div>
        </div>
      </div>

      {started && (
        <div className={s.progress} aria-live="polite">
          <div className={s.bar}><span style={{ width: `${(doneCount / flow.steps.length) * 100}%` }} /></div>
          <span>{allDone ? "خلصت المهمة ✓" : `${doneCount} من ${flow.steps.length} خطوات`}</span>
        </div>
      )}

      <ol className={s.steps} ref={allRef}>
        {flow.steps.map((st, i) => {
          const tool = getTool(st.tool);
          const state = steps[i];
          return (
            <li key={i} className={`${s.step} ${s[state.status]}`}>
              <div className={s.stepHead}>
                <span className={s.num}>{state.status === "done" ? "✓" : i + 1}</span>
                <ToolIcon tool={tool} size="sm" />
                <span className={s.stepTitle}>
                  <b>{st.title}</b>
                  <small>{tool.name}</small>
                </span>
                <span className={s.badge}>{LABELS[state.status]}</span>
              </div>

              {state.text && (
                <div className={`md ${s.out} ${state.status === "running" ? "typing" : ""}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{state.text}</ReactMarkdown>
                </div>
              )}
              {state.status === "running" && !state.text && (
                <div className="shimmer" aria-label="جاري الكتابة"><span /><span /><span /></div>
              )}
              {state.error && <div className="error" role="alert">{state.error}</div>}

              {(state.status === "done" || state.status === "error" || state.status === "stopped") && !running && (
                <div className={s.stepActions}>
                  {state.text && <button className="btn ghost" onClick={() => copy(state.text)}>نسخ</button>}
                  {state.status !== "done" && <button className="btn ghost" onClick={() => run(i)}>كمّل من هنا</button>}
                  {state.status === "done" && <button className="btn ghost" onClick={() => run(i)}>أعد الخطوة دي واللي بعدها</button>}
                  <Link className="btn ghost" href={`/tool/${st.tool}?q=${encodeURIComponent(fillStep(st.input, input, steps.map((x) => x.text)).slice(0, 1500))}`}>
                    افتحها في الأداة
                  </Link>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {allDone && !running && (
        <div className={s.final}>
          <div className={s.finalHead}>
            <b>الشغل كله جاهز</b>
            <button className="btn ghost" onClick={() => copy(fullText)}>نسخ الكل</button>
          </div>
          <ShareBar text={fullText} title={flow.name} getHtml={() => (allRef.current ? htmlOf(allRef.current, flow) : "")} />
        </div>
      )}
    </>
  );
}

// النتيجة كلها بعناوين الخطوات (للـ Word والـ PDF)
function htmlOf(root, flow) {
  const parts = [...root.querySelectorAll(":scope > li")].map((li, i) => {
    const md = li.querySelector(".md");
    return md ? `<h2>${flow.steps[i].title}</h2>${md.innerHTML}` : "";
  });
  return parts.join("\n");
}
