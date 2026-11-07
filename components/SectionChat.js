"use client";
// شات القسم: مساعد متخصص جوه صفحة كل قسم، بلون القسم وأسئلة بداية خاصة بيه.
import { useEffect, useRef, useState } from "react";
import Md from "./Md";
import { enterSends } from "@/lib/keys";
import s from "./sectionchat.module.css";

export default function SectionChat({ section, name, starters = [] }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    if (!started.current) return; // ما نسحبش الصفحة لتحت أول ما تتفتح
    endRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [msgs]);

  async function send(text) {
    const q = String(text ?? input).trim();
    if (!q || busy) return;
    started.current = true;
    setError("");
    setInput("");
    const history = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "", pending: true }]);
    setBusy(true);
    let out = "";
    try {
      const res = await fetch("/api/section-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, messages: history.map(({ role, content }) => ({ role, content })) }) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "حصل خطأ، جرّب تاني.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: out, pending: false } : x)));
      }
      if (!out) setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: "مقدرتش أرد دلوقتي. جرّب تاني.", pending: false } : x)));
    } catch (e) {
      setError(e.message);
      setMsgs((m) => m.slice(0, -1));
      setInput(q);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={s.box} aria-label={`شات ${name}`}>
      <div className={s.head}>
        <b>شات {name}</b>
        <small>اسأل في تخصص القسم وهتاخد رد مباشر</small>
      </div>

      <div className={s.thread} aria-live="polite" data-clarity-mask="True">
        {msgs.length === 0 && (
          <div className={s.starters}>
            {starters.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? s.user : s.bot}>
            {m.role === "user" ? <p dir="auto">{m.content}</p> : m.pending && !m.content ? <p className={s.wait}>بكتب الرد…</p> : <div className="md" dir="auto"><Md>{m.content}</Md></div>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {error && <div className={s.error} role="alert">{error}</div>}

      <form className={s.composer} onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          rows={1}
          value={input}
          dir="auto"
          placeholder="اكتب سؤالك…"
          aria-label="اكتب سؤالك"
          maxLength={2000}
          onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; }}
          onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); send(); } }}
        />
        <button type="submit" disabled={!input.trim() || busy} aria-label="إرسال">↑</button>
      </form>
    </section>
  );
}
