"use client";
// شات القسم: أول حاجة بتتفتح لما تدخل القسم. صفحة محادثة كاملة، وأدوات القسم في القايمة الجانبية.
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Md from "./Md";
import { enterSends } from "@/lib/keys";
import { getChat, newChatId, saveChat, setActive } from "@/lib/secchats";
import s from "./sectionchat.module.css";

export default function SectionChat({ section, name, tagline, starters = [], children }) {
  const params = useSearchParams();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const chatId = useRef(newChatId());
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const started = useRef(false);

  // وضع الشات: بيشيل الفوتر والمسافة الفاضية تحت (globals.css: .chat-mode)
  useEffect(() => {
    document.body.classList.add("chat-mode");
    return () => document.body.classList.remove("chat-mode");
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    chatId.current = newChatId();
    started.current = false;
    setMsgs([]); setInput(""); setError(""); setBusy(false);
    setActive(section, "");
  }, [section]);

  // فتح محادثة قديمة (?c=) أو محادثة جديدة (?new=1)
  const c = params.get("c"), isNew = params.get("new");
  useEffect(() => {
    if (c) {
      const old = getChat(section, c);
      if (old) {
        abortRef.current?.abort();
        chatId.current = old.id;
        started.current = false;
        setMsgs(old.msgs); setError(""); setBusy(false);
        setActive(section, old.id);
        return;
      }
    }
    if (isNew) reset();
  }, [c, isNew, section, reset]);

  useEffect(() => {
    window.addEventListener("rs-new-section-chat", reset);
    return () => window.removeEventListener("rs-new-section-chat", reset);
  }, [reset]);

  useEffect(() => {
    if (started.current) endRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [msgs]);

  async function send(text) {
    const q = String(text ?? input).trim();
    if (!q || busy) return;
    started.current = true;
    setError("");
    setInput("");
    const id = chatId.current;
    const history = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "", pending: true }]);
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    let out = "";
    try {
      const res = await fetch("/api/section-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, messages: history.map(({ role, content }) => ({ role, content })) }), signal: ctl.signal });
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
        if (chatId.current === id) setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: out, pending: false } : x)));
      }
      if (!out) out = "مقدرتش أرد دلوقتي. جرّب تاني.";
      if (chatId.current === id) setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: out, pending: false } : x)));
      saveChat(section, id, [...history, { role: "assistant", content: out }]);
      setActive(section, id);
    } catch (e) {
      if (e.name !== "AbortError" && chatId.current === id) {
        setError(e.message);
        setMsgs((m) => m.slice(0, -1));
        setInput(q);
      }
    } finally {
      if (abortRef.current === ctl) { abortRef.current = null; setBusy(false); }
    }
  }

  return (
    <div className={s.page}>
      <header className={s.top}>
        <div>
          <h1>{name}</h1>
          <p>{tagline}</p>
        </div>
        {children}
      </header>

      <div className={s.thread} aria-live="polite" data-clarity-mask="True">
        {msgs.length === 0 && (
          <div className={s.welcome}>
            <h2>اسأل في {name}</h2>
            <p>رد مباشر في تخصص القسم، وأدواته كلها في القايمة الجانبية.</p>
            <div className={s.starters}>
              {starters.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
            </div>
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
          placeholder={`اسأل ${name}…`}
          aria-label="اكتب سؤالك"
          maxLength={2000}
          onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`; }}
          onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); send(); } }}
        />
        <button type="submit" disabled={!input.trim() || busy} aria-label="إرسال">↑</button>
      </form>
    </div>
  );
}
