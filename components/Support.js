"use client";
// مساعد الدعم: إجابة فورية من قاعدة معرفة الموقع، وزرار واتساب للدعم البشري بملخص المشكلة.
import { useEffect, useRef, useState } from "react";
import Md from "./Md";
import { enterSends } from "@/lib/keys";
import s from "./support.module.css";

const STARTERS = [
  "إزاي أبدأ باستخدام الموقع؟",
  "الاشتراكات متاحة ولا لسه؟",
  "ليه الرد وقف أو فاضي؟",
  "بياناتي ومحادثاتي محفوظة فين؟",
];

const WA = String(process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP || "").replace(/\D/g, "");

export default function Support() {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const endRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" }); }, [msgs.length, busy]);

  async function send(text) {
    const q = String(text ?? input).trim();
    if (!q || busy) return;
    setError("");
    setInput("");
    const history = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "", pending: true }]);
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    let out = "";
    try {
      const res = await fetch("/api/support", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })) }), signal: ctl.signal });
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
      if (!out) setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: "مقدرتش أرد دلوقتي. اضغط «كلّم الدعم» تحت.", pending: false } : x)));
    } catch (e) {
      if (e.name !== "AbortError") {
        setError(e.message);
        setMsgs((m) => m.slice(0, -1));
        setInput(q);
      }
    } finally {
      abortRef.current = null;
      setBusy(false);
    }
  }

  const summary = () => {
    const mine = msgs.filter((m) => m.role === "user").map((m) => m.content).slice(-3).join(" | ");
    return `مرحباً، محتاج مساعدة في Rising StarAi.${mine ? `\nاللي سألت عنه: ${mine}` : ""}`;
  };
  const waHref = WA ? `https://wa.me/${WA}?text=${encodeURIComponent(summary())}` : "";

  return (
    <div className={s.wrap}>
      <header className={s.top}>
        <h1>الدعم</h1>
        <p>اسأل وهتاخد إجابة فورية. لو محتاج حد يتابع معاك، كلّم الفريق وإحنا بنبعت له ملخص سؤالك.</p>
      </header>

      <div className={s.thread} aria-live="polite" data-clarity-mask="True">
        {msgs.length === 0 && (
          <div className={s.starters}>
            {STARTERS.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
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
          placeholder="اكتب مشكلتك أو سؤالك…"
          onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; }}
          onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); send(); } }}
        />
        <button type="submit" disabled={!input.trim() || busy} aria-label="إرسال">↑</button>
      </form>

      <div className={s.human}>
        {waHref ? (
          <a href={waHref} target="_blank" rel="noopener noreferrer">كلّم الدعم على واتساب</a>
        ) : (
          <p>خدمة واتساب للدعم هتتفعّل قريب.</p>
        )}
        <small>رد الفريق خلال 24 ساعة في أيام العمل.</small>
      </div>
    </div>
  );
}
