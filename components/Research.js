"use client";
// الباحث الأكاديمي: موضوع ← مصادر من المكتبات (العميل بيراجعها) ← خطة ← كتابة الأقسام واحد واحد ← تقرير بمراجع
import { useEffect, useRef, useState } from "react";
import Md from "./Md";
import ShareBar from "./ShareBar";
import { read, write, toast } from "@/lib/store";
import { citation } from "@/lib/cite";
import s from "./research.module.css";

const LENGTHS = [
  ["short", "قصير", "حوالي 3 صفحات"],
  ["medium", "متوسط", "حوالي 8 صفحات"],
  ["long", "طويل", "حوالي 15 صفحة"],
];
const KIND = { paper: "بحث", book: "كتاب", thesis: "رسالة" };
const EXAMPLES = [
  "أثر الذكاء الاصطناعي على سوق العمل في الدول العربية",
  "دور محمد علي باشا في تحديث مصر",
  "التعليم الإلكتروني وأثره على تحصيل طلاب الجامعة",
];

const words = (t) => (String(t || "").match(/\S+/g) || []).length;

async function post(body, signal) {
  const res = await fetch("/api/research", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  if (!res.ok) {
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "حصل خطأ، جرّب تاني.");
  }
  return res;
}

export default function Research() {
  const [topic, setTopic] = useState("");
  const [length, setLength] = useState("medium");
  const [stage, setStage] = useState("idle"); // idle | searching | review | outlining | writing | done
  const [found, setFound] = useState(null); // { queries, sources, libs }
  const [picked, setPicked] = useState(new Set());
  const [report, setReport] = useState(null); // { title, sections:[{h, points, src, text, status}] }
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const reportRef = useRef(null);

  // آخر تقرير محفوظ على الجهاز
  useEffect(() => {
    const last = read("research-last", null);
    if (last?.report && last?.found) {
      setTopic(last.topic || "");
      setLength(last.length || "medium");
      setFound(last.found);
      setPicked(new Set(last.picked || last.found.sources.map((x) => x.n)));
      setReport(last.report);
      setStage("done");
    }
  }, []);

  const chosen = found ? found.sources.filter((x) => picked.has(x.n)) : [];
  const busy = ["searching", "outlining", "writing"].includes(stage);

  async function search(t = topic) {
    const q = t.trim();
    if (!q || busy) return;
    setError("");
    setReport(null);
    setStage("searching");
    const ctl = new AbortController();
    abortRef.current = ctl;
    try {
      const res = await post({ step: "sources", topic: q }, ctl.signal);
      const d = await res.json();
      setFound(d);
      setPicked(new Set(d.sources.map((x) => x.n)));
      setStage("review");
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
      setStage("idle");
    }
  }

  async function writeReport() {
    if (busy || !chosen.length) return;
    setError("");
    setStage("outlining");
    const ctl = new AbortController();
    abortRef.current = ctl;
    const srcs = chosen.map(({ n, title, kind, authors, year, venue, abstract, lib }) => ({ n, title, kind, authors, year, venue, abstract, lib }));
    let rep = null;
    try {
      const res = await post({ step: "outline", topic, length, sources: srcs }, ctl.signal);
      const o = await res.json();
      rep = { title: o.title, sections: o.sections.map((x) => ({ ...x, text: "", status: "wait" })) };
      setReport(rep);
      setStage("writing");
      requestAnimationFrame(() => reportRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));

      for (let i = 0; i < rep.sections.length; i++) {
        const sec = rep.sections[i];
        const patch = (p) => setReport((r) => ({ ...r, sections: r.sections.map((x, k) => (k === i ? { ...x, ...p } : x)) }));
        patch({ status: "writing" });
        let text = "";
        try {
          const r = await post({
            step: "section",
            topic,
            length,
            title: rep.title,
            section: { h: sec.h, points: sec.points, src: sec.src },
            others: rep.sections.filter((_, k) => k !== i).map((x) => x.h),
            sources: srcs,
          }, ctl.signal);
          const reader = r.body.getReader();
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += dec.decode(value, { stream: true });
            patch({ text });
          }
          patch({ status: text.trim() ? "done" : "error" });
        } catch (e) {
          if (e.name === "AbortError") throw e;
          patch({ status: "error", text: text || "" });
        }
      }
      setStage("done");
    } catch (e) {
      if (e.name !== "AbortError") setError(e.message);
      setStage(rep ? "done" : "review");
    } finally {
      abortRef.current = null;
      setReport((r) => {
        if (r) write("research-last", { topic, length, found, picked: [...picked], report: r });
        return r;
      });
    }
  }

  async function retrySection(i) {
    if (busy || !report) return;
    const sec = report.sections[i];
    const srcs = chosen.map(({ n, title, kind, authors, year, venue, abstract, lib }) => ({ n, title, kind, authors, year, venue, abstract, lib }));
    const patch = (p) => setReport((r) => ({ ...r, sections: r.sections.map((x, k) => (k === i ? { ...x, ...p } : x)) }));
    setStage("writing");
    patch({ status: "writing", text: "" });
    let text = "";
    try {
      const r = await post({ step: "section", topic, length, title: report.title, section: sec, others: report.sections.filter((_, k) => k !== i).map((x) => x.h), sources: srcs });
      const reader = r.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        patch({ text });
      }
      patch({ status: text.trim() ? "done" : "error" });
    } catch (e) {
      patch({ status: "error" });
      toast(e.message);
    } finally {
      setStage("done");
    }
  }

  function toggle(n) {
    setPicked((p) => {
      const next = new Set(p);
      next.has(n) ? next.delete(n) : next.add(n);
      return next;
    });
  }

  function reset() {
    abortRef.current?.abort();
    setFound(null);
    setReport(null);
    setStage("idle");
    setError("");
    write("research-last", null);
  }

  // التقرير كامل كنص (للنسخ والتصدير)، والمراجع: المصادر المستخدمة فعلاً بس
  const fullText = report
    ? [`# ${report.title}`, ...report.sections.map((x) => (x.text || "").trim()).filter(Boolean)].join("\n\n")
    : "";
  const used = new Set([...fullText.matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  const refs = chosen.filter((x) => used.has(x.n));
  const refsText = refs.length ? `\n\n## المراجع\n\n${refs.map((x) => `${x.n}. ${citation(x)}`).join("\n")}` : "";
  const done = stage === "done" && report;
  const progress = report ? report.sections.filter((x) => x.status === "done").length : 0;

  return (
    <div className={s.wrap}>
      <section className={s.card} aria-label="موضوع البحث">
        <label htmlFor="rs-topic" className={s.label}>موضوع البحث أو السؤال البحثي</label>
        <textarea
          id="rs-topic"
          className={s.box}
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          maxLength={800}
          rows={3}
          dir="auto"
          placeholder="مثلاً: أثر وسائل التواصل الاجتماعي على الصحة النفسية للمراهقين"
          disabled={busy}
        />
        {stage === "idle" && !topic && (
          <div className={s.examples}>
            {EXAMPLES.map((t) => <button key={t} type="button" onClick={() => setTopic(t)}>{t}</button>)}
          </div>
        )}
        <div className={s.row}>
          <span className={s.label}>طول التقرير</span>
          <div className={s.seg} role="radiogroup" aria-label="طول التقرير">
            {LENGTHS.map(([k, label, hint]) => (
              <button key={k} type="button" role="radio" aria-checked={length === k} onClick={() => setLength(k)} disabled={busy}>
                <b>{label}</b><small>{hint}</small>
              </button>
            ))}
          </div>
        </div>
        <div className={s.actions}>
          {busy ? (
            <button type="button" className={s.stop} onClick={() => abortRef.current?.abort()}>إيقاف</button>
          ) : (
            <button type="button" className={s.primary} onClick={() => search()} disabled={!topic.trim()}>
              {found ? "دوّر تاني في المكتبات" : "دوّر في المكتبات"}
            </button>
          )}
          {(found || report) && !busy && <button type="button" className={s.ghost} onClick={reset}>بحث جديد</button>}
        </div>
        <p className={s.libs}>المكتبات: OpenAlex • Semantic Scholar • arXiv • Open Library</p>
      </section>

      {stage === "searching" && <div className={s.status}><span className={s.spin} aria-hidden="true" /> بدوّر في مكتبات الأبحاث والكتب…</div>}
      {error && <div className={s.error} role="alert">{error}</div>}

      {found && (stage === "review" || stage === "outlining" || done || stage === "writing") && (
        <section className={s.card} aria-label="المصادر">
          <div className={s.head}>
            <b>المصادر اللي لقيتها ({found.sources.length})</b>
            <small>اختار اللي يناسب بحثك ({chosen.length} مختار)</small>
          </div>
          {found.queries?.en && <p className={s.query}>بحثت عن: <bdi dir="ltr">{found.queries.en}</bdi>{found.queries.ar ? <> و«{found.queries.ar}»</> : null}</p>}
          <ul className={s.sources}>
            {found.sources.map((x) => (
              <li key={x.n} className={picked.has(x.n) ? s.on : ""}>
                <label>
                  <input type="checkbox" checked={picked.has(x.n)} onChange={() => toggle(x.n)} disabled={busy} />
                  <span className={s.srcBody}>
                    <span className={s.srcTop}>
                      <em>{KIND[x.kind] || "بحث"}</em>
                      <b>[{x.n}]</b>
                      {x.year ? <small>{x.year}</small> : null}
                      {x.cites ? <small>{x.kind === "book" ? `${Math.round(x.cites / 3)} طبعة` : `${x.cites} استشهاد`}</small> : null}
                      <small>{x.lib}</small>
                    </span>
                    <strong dir="auto">{x.title}</strong>
                    {x.authors?.length > 0 && <span className={s.authors} dir="auto">{x.authors.join("، ")}{x.venue ? ` — ${x.venue}` : ""}</span>}
                    {x.abstract && <span className={s.abs} dir="auto">{x.abstract.slice(0, 260)}{x.abstract.length > 260 ? "…" : ""}</span>}
                    <span className={s.links}>
                      {x.url && <a href={x.url} target="_blank" rel="noopener noreferrer nofollow">صفحة المصدر</a>}
                      {x.oa && <a href={x.oa} target="_blank" rel="noopener noreferrer nofollow">النص الكامل (مفتوح)</a>}
                    </span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {(stage === "review" || done) && (
            <div className={s.actions}>
              <button type="button" className={s.primary} onClick={writeReport} disabled={!chosen.length}>
                {done ? "اكتب التقرير من جديد" : `اكتب التقرير (${LENGTHS.find((l) => l[0] === length)[2]})`}
              </button>
            </div>
          )}
        </section>
      )}

      {stage === "outlining" && <div className={s.status}><span className={s.spin} aria-hidden="true" /> بقرا ملخصات المصادر وبعمل خطة التقرير…</div>}

      {report && (
        <section ref={reportRef} className={`${s.card} ${s.report}`} aria-label="التقرير">
          {stage === "writing" && (
            <div className={s.progress} aria-live="polite">
              <span>بكتب القسم {Math.min(progress + 1, report.sections.length)} من {report.sections.length}</span>
              <i style={{ "--p": `${Math.round((progress / report.sections.length) * 100)}%` }} />
            </div>
          )}
          <div id="research-report" className={`md ${s.md}`} dir="auto">
            <h1>{report.title}</h1>
            {report.sections.map((x, i) => (
              <div key={i} className={s.section}>
                {x.text ? <Md>{x.text}</Md> : <h2 className={s.pending}>{x.h}</h2>}
                {x.status === "writing" && !x.text && <p className={s.wait}><span className={s.spin} aria-hidden="true" /> بيتكتب…</p>}
                {x.status === "error" && (
                  <p className={s.secErr}>القسم ده ما اتكتبش. <button type="button" onClick={() => retrySection(i)} disabled={busy}>اكتبه تاني</button></p>
                )}
              </div>
            ))}
            {done && refs.length > 0 && (
              <div className={s.refs}>
                <h2>المراجع</h2>
                <ol>
                  {refs.map((x) => (
                    <li key={x.n} value={x.n} dir="auto">
                      {citation(x).replace(/\s(https?:\/\/\S+)$/, "")}{" "}
                      {(x.doi || x.url) && <a href={x.doi ? `https://doi.org/${x.doi}` : x.url} target="_blank" rel="noopener noreferrer nofollow">رابط</a>}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>

          {done && (
            <>
              <p className={s.meta}>{words(fullText).toLocaleString("ar-EG")} كلمة • {refs.length} مرجع مستخدم من {chosen.length}</p>
              <p className={s.note}>
                التقرير مكتوب بالذكاء الاصطناعي من ملخصات المصادر. ارجع للمصادر الأصلية قبل الاقتباس أو التسليم، وراجع كل رقم ونتيجة مهمة. ده مساعد للباحث، مش بديل عن قراية المراجع.
              </p>
              <ShareBar text={fullText + refsText} title={report.title} getHtml={() => document.getElementById("research-report")?.innerHTML || ""} />
            </>
          )}
        </section>
      )}
    </div>
  );
}
