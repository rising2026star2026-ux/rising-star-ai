"use client";
// الشات المتخصص: حوار زي الشات العادي، بس كل رد مبني على مصادر الباحث (مكتبات أكاديمية أو بحث السوق ودراسة الجدوى)
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Md from "./Md";
import { read, write } from "@/lib/store";
import { enterSends } from "@/lib/keys";
import { runAll, sensitivity, factsText } from "@/lib/feasibility";
import { fieldText } from "./FieldData";
import s from "./sourcechat.module.css";

const MODES = {
  academic: {
    title: "الشات الأكاديمي",
    sub: "ناقش موضوع بحثك. كل رد بيدوّر في مكتبات الأبحاث والكتب ويستشهد بمصادرها.",
    back: { href: "/research", label: "الباحث الأكاديمي" },
    store: "srcchat-academic",
    placeholder: "اسأل عن موضوع بحثك…",
    suggestions: [
      "إيه أهم النظريات اللي بتفسر الموضوع ده؟",
      "إيه الفجوات البحثية اللي ممكن أشتغل عليها؟",
      "قارن بين نتايج أهم الدراسات في الموضوع",
      "اقترح عليا عنوان رسالة ماجستير وأسئلة بحث",
    ],
  },
  business: {
    title: "الشات التجاري",
    sub: "ناقش مشروعك وسوقك. كل رد بيدوّر في السوق المصري ويعتمد على أرقام دراستك.",
    back: { href: "/feasibility", label: "الباحث التجاري" },
    store: "srcchat-business",
    placeholder: "اسأل عن مشروعك أو السوق…",
    suggestions: [
      "إزاي أقلل تكلفة التجهيز من غير ما الجودة تقل؟",
      "إيه أكبر خطر على مشروعي وإزاي أتجنبه؟",
      "أسعّر منتجي إزاي قصاد المنافسين؟",
      "إزاي أموّل الفرق من غير قروض بفايدة؟",
    ],
  },
};

/** سياق الصفحة: البحث أو الدراسة المفتوحة على الجهاز */
function loadContext(mode) {
  if (mode === "academic") {
    const last = read("research-last", null);
    const all = last?.found?.sources || [];
    if (!all.length) return null;
    const picked = new Set(last.picked || all.map((x) => x.n));
    const pinned = all.filter((x) => picked.has(x.n)).map(({ kind, title, authors, year, venue, doi, url, abstract, lib }) => ({ kind, title, authors, year, venue, doi, url, abstract, lib }));
    return { label: last.topic || last.report?.title || "بحثك", count: pinned.length, topic: last.topic || "", pinned };
  }
  const last = read("feasibility-last", null);
  if (!last?.a || !last?.data) return null;
  try {
    const res = runAll(last.a);
    const sens = sensitivity(last.a);
    const form = { ...last.form, capital: Number(String(last.form?.capital || "").replace(/[^\d.]/g, "")) || 0 };
    return {
      label: `${last.form?.activity || "مشروعك"}${last.form?.governorate ? ` — ${last.form.governorate}` : ""}`,
      count: (last.data.sources || []).length,
      study: {
        facts: factsText(last.a, res, sens, form),
        market: last.data.market || "",
        sources: (last.data.sources || []).map(({ title, url, snippet }) => ({ title, url, snippet })),
        competitors: last.data.competitors || [],
        field: fieldText(last.field),
      },
    };
  } catch {
    return null;
  }
}

function Sources({ list, text }) {
  const [open, setOpen] = useState(false);
  if (!list?.length) return null;
  const used = new Set([...String(text || "").matchAll(/\[(\d{1,2})\]/g)].map((m) => Number(m[1])));
  const cited = list.filter((x) => used.has(x.n));
  const shown = open ? list : cited.length ? cited : list.slice(0, 4);
  return (
    <div className={s.sources}>
      <div className={s.srcHead}>
        <b>{cited.length ? `المصادر اللي اتستشهد بيها (${cited.length})` : `مصادر (${list.length})`}</b>
        {list.length > shown.length || open ? <button type="button" onClick={() => setOpen((v) => !v)}>{open ? "أقل" : `كل المصادر (${list.length})`}</button> : null}
      </div>
      <ol>
        {shown.map((x) => (
          <li key={x.n} value={x.n}>
            {x.u ? <a href={x.u} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{x.t}</a> : <span dir="auto">{x.t}</span>}
            <small dir="auto">{[x.a, x.y, x.l || x.d].filter(Boolean).join(" · ")}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default function SourceChat({ mode = "academic" }) {
  const M = MODES[mode] || MODES.academic;
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [useCtx, setUseCtx] = useState(true);
  const [error, setError] = useState("");
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const boxRef = useRef(null);

  useEffect(() => {
    setMsgs(read(M.store, []) || []);
    setCtx(loadContext(mode));
    document.body.classList.add("chat-mode");
    return () => document.body.classList.remove("chat-mode");
  }, [mode, M.store]);

  useEffect(() => {
    if (!busy) write(M.store, msgs.slice(-40));
  }, [msgs, busy, M.store]);

  const lastLen = msgs.length ? msgs[msgs.length - 1].content.length : 0;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs.length, busy]);
  useEffect(() => {
    if (busy) endRef.current?.scrollIntoView({ block: "end" });
  }, [lastLen, busy]);

  async function send(text) {
    const q = String(text ?? input).trim();
    if (!q || busy) return;
    setError("");
    setInput("");
    const history = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "", sources: [], pending: true }]);
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    const body = {
      mode,
      messages: history.map(({ role, content }) => ({ role, content })),
      ...(mode === "academic" ? { pinned: useCtx ? ctx?.pinned || [] : [], topic: useCtx ? ctx?.topic || "" : "" } : { study: useCtx ? ctx?.study || {} : {} }),
    };
    let textOut = "";
    try {
      const res = await fetch("/api/source-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal: ctl.signal });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "حصل خطأ، جرّب تاني.");
      }
      let sources = [];
      try { sources = JSON.parse(decodeURIComponent(res.headers.get("x-sources") || "[]")); } catch { sources = []; }
      const patch = (p) => setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, ...p } : x)));
      patch({ sources });
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textOut += dec.decode(value, { stream: true });
        patch({ content: textOut, pending: false });
      }
      patch({ pending: false, content: textOut || "مقدرتش أرد دلوقتي، جرّب تاني." });
    } catch (e) {
      if (e.name === "AbortError") {
        setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, pending: false, content: textOut || "اتوقف." } : x)));
      } else {
        setError(e.message);
        setMsgs((m) => m.slice(0, -1));
        setInput(q);
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  function newChat() {
    abortRef.current?.abort();
    setMsgs([]);
    write(M.store, []);
    boxRef.current?.focus();
  }

  const empty = msgs.length === 0;
  const ctxNote = useMemo(() => {
    if (!ctx) return mode === "academic" ? "مفيش بحث مفتوح، فهدوّر في المكتبات لكل سؤال." : "مفيش دراسة مفتوحة، فهدوّر في السوق لكل سؤال.";
    return null;
  }, [ctx, mode]);

  return (
    <div className={s.wrap}>
      <header className={s.top}>
        <div>
          <h1 className={s.title}>{M.title}</h1>
          <p className={s.sub}>{M.sub}</p>
        </div>
        <div className={s.topActions}>
          <Link href={M.back.href} className={s.ghost}>↩ {M.back.label}</Link>
          {!empty && <button type="button" className={s.ghost} onClick={newChat}>محادثة جديدة</button>}
        </div>
      </header>

      {ctx ? (
        <label className={s.ctx}>
          <input type="checkbox" checked={useCtx} onChange={(e) => setUseCtx(e.target.checked)} />
          <span>مربوط بـ «<b dir="auto">{ctx.label}</b>»{ctx.count ? ` (${ctx.count} مصدر)` : ""}</span>
        </label>
      ) : (
        <p className={s.ctxNote}>{ctxNote}</p>
      )}

      <div className={s.thread} aria-live="polite">
        {empty && (
          <div className={s.empty}>
            <p>ابدأ بسؤال، أو اختار واحد من دول:</p>
            <div className={s.suggest}>
              {M.suggestions.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? s.user : s.bot}>
            {m.role === "user" ? (
              <p dir="auto">{m.content}</p>
            ) : m.pending && !m.content ? (
              <p className={s.wait}><span className={s.spin} aria-hidden="true" /> {mode === "academic" ? "بدوّر في المكتبات…" : "بدوّر في السوق…"}</p>
            ) : (
              <>
                <div className={`md ${s.md}`} dir="auto"><Md>{m.content}</Md></div>
                {!m.pending && <Sources list={m.sources} text={m.content} />}
              </>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <div className={s.error} role="alert">{error}</div>}

      <form className={s.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          ref={boxRef}
          rows={1}
          value={input}
          dir="auto"
          placeholder={M.placeholder}
          onChange={(e) => {
            setInput(e.target.value);
            e.target.style.height = "auto";
            e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`;
          }}
          onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); send(); } }}
        />
        {busy ? (
          <button type="button" className={s.stop} onClick={() => abortRef.current?.abort()} aria-label="إيقاف">■</button>
        ) : (
          <button type="submit" className={s.send} disabled={!input.trim()} aria-label="إرسال">↑</button>
        )}
      </form>
      <p className={s.foot}>الردود من مصادر منشورة وممكن يكون فيها أخطاء. ارجع للمصدر الأصلي قبل ما تعتمد على معلومة مهمة.</p>
    </div>
  );
}
