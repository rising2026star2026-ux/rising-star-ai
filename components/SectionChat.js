"use client";
// شات القسم: أول حاجة بتتفتح لما تدخل القسم. واجهة كبيرة بهوية خاصة بكل قسم، وبحث صوتي (ميكروفون + بحث في الإنترنت + قراءة الرد).
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Md from "./Md";
import { enterSends } from "@/lib/keys";
import { getChat, newChatId, saveChat, setActive } from "@/lib/secchats";
import { toast } from "@/lib/store";
import s from "./sectionchat.module.css";

const Mic = () => <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0014 0M12 18v3" /></svg>;
const Globe = () => <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18" /></svg>;
const Speaker = () => <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zM17 8.5a5 5 0 010 7" /></svg>;

// نص الرد للقراءة بصوت عالي: من غير علامات التنسيق وأرقام المصادر والروابط
const speakable = (t) => String(t).replace(/\[\d+\]/g, "").replace(/https?:\/\/\S+/g, "").replace(/[*_`#>|]/g, "").replace(/^\s*[-•]\s+/gm, "").replace(/\n{2,}/g, ". ").trim();

export default function SectionChat({ section, name, tagline, headline, sub, starters = [], children }) {
  const params = useSearchParams();
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [web, setWeb] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(-1);
  const [canVoice, setCanVoice] = useState(false);
  const chatId = useRef(newChatId());
  const endRef = useRef(null);
  const abortRef = useRef(null);
  const recRef = useRef(null);
  const started = useRef(false);
  const viaVoice = useRef(false);

  useEffect(() => {
    setCanVoice(!!(window.SpeechRecognition || window.webkitSpeechRecognition));
    document.body.classList.add("chat-mode");
    return () => { document.body.classList.remove("chat-mode"); window.speechSynthesis?.cancel(); recRef.current?.abort?.(); };
  }, []);

  const stopSpeak = useCallback(() => { window.speechSynthesis?.cancel(); setSpeaking(-1); }, []);

  const speak = useCallback((text, i) => {
    const synth = window.speechSynthesis;
    if (!synth) return toast("متصفحك مش بيدعم قراءة الرد.");
    synth.cancel();
    const u = new SpeechSynthesisUtterance(speakable(text));
    const voice = synth.getVoices().find((v) => /^ar/i.test(v.lang));
    if (!voice) return toast("جهازك مفيهوش صوت عربي للقراءة.");
    u.voice = voice; u.lang = voice.lang; u.rate = 1;
    u.onend = u.onerror = () => setSpeaking(-1);
    setSpeaking(i);
    synth.speak(u);
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    window.speechSynthesis?.cancel();
    chatId.current = newChatId();
    started.current = false;
    setMsgs([]); setInput(""); setError(""); setBusy(false); setSpeaking(-1);
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

  async function send(text, opts = {}) {
    const q = String(text ?? input).trim();
    if (!q || busy) return;
    const search = opts.search ?? web;
    const spoken = viaVoice.current; viaVoice.current = false;
    started.current = true;
    stopSpeak();
    setError("");
    setInput("");
    const id = chatId.current;
    const history = [...msgs, { role: "user", content: q }];
    setMsgs([...history, { role: "assistant", content: "", pending: true }]);
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    let out = "", sources = [], note = "";
    try {
      const res = await fetch("/api/section-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, search, messages: history.map(({ role, content }) => ({ role, content })) }), signal: ctl.signal });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "حصل خطأ، جرّب تاني.");
      }
      try { sources = JSON.parse(decodeURIComponent(res.headers.get("x-sources") || "[]")).filter((x) => /^https?:\/\//i.test(x?.u || "")); } catch {}
      const st = res.headers.get("x-search");
      if (search && st === "limit") note = "وصلت لحد البحث في الساعة، فالرد من غير بحث.";
      else if (search && st === "nokey") note = "البحث مش متاح دلوقتي، فالرد من غير بحث.";
      else if (search && st === "empty") note = "البحث ما رجّعش نتايج، فالرد معلومة عامة.";
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        out += dec.decode(value, { stream: true });
        if (chatId.current === id) setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: out, sources, note, pending: false } : x)));
      }
      if (!out) out = "مقدرتش أرد دلوقتي. جرّب تاني.";
      if (chatId.current === id) {
        setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: out, sources, note, pending: false } : x)));
        if (spoken) speak(out, history.length);
      }
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

  // الباحث الصوتي: بتتكلم، السؤال يتبعت مع بحث في الإنترنت، والرد يتقرا بصوت عالي
  function toggleMic() {
    if (listening) { recRef.current?.stop(); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return toast("متصفحك مش بيدعم الكتابة بالصوت. جرّب Chrome.");
    stopSpeak();
    const rec = new SR();
    rec.lang = "ar-EG"; rec.interimResults = true; rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let t = "";
      for (const r of e.results) t += r[0].transcript;
      setInput(t);
      if (e.results[e.results.length - 1].isFinal) finalText = t;
    };
    rec.onerror = (e) => { if (e.error === "not-allowed") toast("اسمح للموقع باستخدام الميكروفون من إعدادات المتصفح."); else if (e.error !== "aborted" && e.error !== "no-speech") toast("مسمعتش حاجة، جرّب تاني."); };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (finalText.trim()) { viaVoice.current = true; setWeb(true); send(finalText, { search: true }); }
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  const composer = (big) => (
    <form className={`${s.composer} ${big ? s.big : ""}`} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <textarea
        rows={big ? 2 : 1}
        value={input}
        dir="auto"
        placeholder={listening ? "بسمعك… اتكلم" : `اسأل ${name}…`}
        aria-label="اكتب سؤالك"
        maxLength={2000}
        onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 160)}px`; }}
        onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); send(); } }}
      />
      <div className={s.tools}>
        <button type="button" className={`${s.chip} ${web ? s.on : ""}`} onClick={() => setWeb(!web)} aria-pressed={web} title="يدوّر في الإنترنت ويجيب مصادر"><Globe /><span>بحث في الإنترنت</span></button>
        {canVoice && <button type="button" className={`${s.chip} ${s.mic} ${listening ? s.live : ""}`} onClick={toggleMic} aria-pressed={listening} title="اتكلم بسؤالك وهيدوّر ويقرأ لك الرد"><Mic /><span>{listening ? "بسمعك…" : "بحث صوتي"}</span></button>}
        <button type="submit" className={s.send} disabled={!input.trim() || busy} aria-label="إرسال">↑</button>
      </div>
    </form>
  );

  const empty = msgs.length === 0;
  return (
    <div className={s.page} data-skin={section}>
      <header className={s.top}>
        <b>{name}</b>
        {children}
      </header>

      {empty ? (
        <div className={s.hero}>
          <h1>{headline || name}</h1>
          <p>{sub || tagline}</p>
          {composer(true)}
          <div className={s.starters}>
            {starters.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
          </div>
        </div>
      ) : (
        <>
          <div className={s.thread} aria-live="polite" data-clarity-mask="True">
            {msgs.map((m, i) => (
              <div key={i} className={m.role === "user" ? s.user : s.bot}>
                {m.role === "user" ? <p dir="auto">{m.content}</p> : m.pending && !m.content ? <p className={s.wait}>{web ? "بدوّر وبكتب الرد…" : "بكتب الرد…"}</p> : (
                  <>
                    {m.note && <p className={s.note}>{m.note}</p>}
                    <div className="md" dir="auto"><Md>{m.content}</Md></div>
                    {m.sources?.length > 0 && (
                      <ol className={s.sources} aria-label="المصادر">
                        {m.sources.map((x, k) => <li key={k}><a href={x.u} target="_blank" rel="noopener noreferrer nofollow">{x.t || x.d || x.u}</a>{x.d ? <small> · {x.d}</small> : null}</li>)}
                      </ol>
                    )}
                    {!m.pending && m.content && (
                      <button type="button" className={s.listen} onClick={() => (speaking === i ? stopSpeak() : speak(m.content, i))} aria-pressed={speaking === i}>
                        <Speaker /><span>{speaking === i ? "وقّف القراءة" : "اسمع الرد"}</span>
                      </button>
                    )}
                  </>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          {error && <div className={s.error} role="alert">{error}</div>}
          {composer(false)}
        </>
      )}
      {empty && error && <div className={s.error} role="alert">{error}</div>}
    </div>
  );
}
