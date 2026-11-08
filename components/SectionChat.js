"use client";
// شات القسم: أول حاجة بتتفتح لما تدخل القسم. نفس إحساس شات Claude: خانة كتابة هادية بحواف ناعمة وأزرار صغيرة،
// وزرار «شكل الكتابة» الأزرق (الحجم والخط والألوان). العقاري بيدوّر في مواقع الإعلانات تلقائي ويعرض النتايج كروت.
import { Fragment, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Md from "./Md";
import LookButton from "./LookButton";
import { enterSends } from "@/lib/keys";
import { getChat, newChatId, saveChat, setActive } from "@/lib/secchats";
import { toast } from "@/lib/store";
import s from "./sectionchat.module.css";

const svg = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
const Mic = () => <svg {...svg} width="18" height="18" strokeWidth="1.8"><rect x="9" y="3" width="6" height="11.5" rx="3" /><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21" /></svg>;
const Globe = () => <svg {...svg} width="18" height="18" strokeWidth="1.7"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.8 3 2.8 14 0 17M12 3.5c-2.8 3-2.8 14 0 17" /></svg>;
const Up = () => <svg {...svg} width="18" height="18" strokeWidth="2.2"><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
const Speaker = () => <svg {...svg} width="17" height="17" strokeWidth="1.7"><path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4zM16 9a4.5 4.5 0 010 6" /></svg>;
const Copy = () => <svg {...svg} width="17" height="17" strokeWidth="1.7"><rect x="8.5" y="8.5" width="11" height="11" rx="2.5" /><path d="M15.5 8.5V6a1.5 1.5 0 00-1.5-1.5H6A1.5 1.5 0 004.5 6v8A1.5 1.5 0 006 15.5h2.5" /></svg>;
const Check = () => <svg {...svg} width="16" height="16" strokeWidth="2"><path d="M5 12.5l4.2 4L19 7" /></svg>;
const Search = () => <svg {...svg} width="15" height="15" strokeWidth="1.9"><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>;

// نص الرد للقراءة بصوت عالي: من غير علامات التنسيق وأرقام المصادر والروابط
const speakable = (t) => String(t).replace(/\[\d+\]/g, "").replace(/https?:\/\/\S+/g, "").replace(/[*_`#>|]/g, "").replace(/^\s*[-•]\s+/gm, "").replace(/\n{2,}/g, ". ").trim();

const n0 = (n) => Math.round(n).toLocaleString("en-US");
const money = (n) => (n >= 1e6 ? `${(n / 1e6).toLocaleString("en-US", { maximumFractionDigits: 2 })} مليون جنيه` : `${n0(n)} جنيه`);
const rooms = (n) => (n === 1 ? "أوضة" : n === 2 ? "أوضتين" : `${n} أوض`);
const results = (n) => (n === 1 ? "نتيجة واحدة" : n === 2 ? "نتيجتين" : n <= 10 ? `${n} نتايج` : `${n} نتيجة`);
const sites = (n) => (n === 1 ? "موقع واحد" : n === 2 ? "موقعين" : n <= 10 ? `${n} مواقع` : `${n} موقع`);

// أول سطر من رد العقاري: الكروت. بنقبل الحقول المتوقعة بس.
function readMeta(line) {
  try {
    const m = JSON.parse(line);
    const num = (v) => (Number.isFinite(v) && v > 0 ? v : undefined);
    const cards = (Array.isArray(m.cards) ? m.cards : []).filter((c) => /^https?:\/\//i.test(c?.url || "")).slice(0, 12).map((c) => ({
      n: num(c.n), url: c.url, site: String(c.site || "").slice(0, 40), title: String(c.title || "").slice(0, 140), type: String(c.type || "").slice(0, 20),
      price: num(c.price), rent: num(c.rent), down: num(c.down), area: num(c.area), rooms: num(c.rooms), ppm: num(c.ppm),
      img: /^https:\/\//.test(c.img || "") ? c.img : "", page: !!c.page,
    }));
    return { status: ["ok", "empty", "limit", "skip"].includes(m.status) ? m.status : "skip", searched: Array.isArray(m.searched) ? m.searched.length : 0, cards };
  } catch {
    return { status: "skip", searched: 0, cards: [] };
  }
}

function Card({ c, best }) {
  const head = c.price ? money(c.price) : c.rent ? `${money(c.rent)} في الشهر` : c.page ? "صفحة إعلانات" : "السعر في الإعلان";
  return (
    <a className={`${s.card} ${best ? s.best : ""}`} href={c.url} target="_blank" rel="noopener noreferrer nofollow">
      {c.img ? <img src={c.img} alt="" loading="lazy" referrerPolicy="no-referrer" onError={(e) => e.currentTarget.remove()} /> : null}
      <span className={s.cardBody}>
        <span className={s.cardHead}>
          <span className={s.num}>{c.n}</span>
          <span>{c.site}</span>
          {best && <span className={s.bestTag}>الأحسن في رأيي</span>}
        </span>
        <b className={s.price}>{head}</b>
        {(c.area || c.rooms || c.ppm || c.down) ? (
          <span className={s.facts}>
            {c.area ? <span>{n0(c.area)} م²</span> : null}
            {c.rooms ? <span>{rooms(c.rooms)}</span> : null}
            {c.ppm ? <span>المتر {n0(c.ppm)}</span> : null}
            {c.down ? <span>مقدم {money(c.down)}</span> : null}
          </span>
        ) : null}
        <span className={s.ttl} dir="auto">{c.title}</span>
        <span className={s.open}>{c.page ? "شوف الإعلانات" : "افتح الإعلان"}</span>
      </span>
    </a>
  );
}

export default function SectionChat({ section, name, tagline, headline, sub, placeholder, starters = [], sources = [], photo = null, children }) {
  const params = useSearchParams();
  const auto = sources.length > 0; // العقاري: البحث في المواقع تلقائي مع كل طلب
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
    document.body.classList.add("chat-mode", "sec-mode");
    return () => { document.body.classList.remove("chat-mode", "sec-mode"); window.speechSynthesis?.cancel(); recRef.current?.abort?.(); };
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
    setMsgs([...history, { role: "assistant", content: "", pending: true, searching: auto || search }]);
    setBusy(true);
    const ctl = new AbortController();
    abortRef.current = ctl;
    let out = "", srcs = [], note = "", meta = null;
    const show = (pending) => {
      if (chatId.current !== id) return;
      setMsgs((m) => m.map((x, i) => (i === m.length - 1 ? { ...x, content: out, sources: srcs, note, ...(meta || {}), pending } : x)));
    };
    try {
      const res = await fetch("/api/section-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ section, search, messages: history.map(({ role, content }) => ({ role, content })) }), signal: ctl.signal });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "حصل خطأ، جرّب تاني.");
      }
      const hasMeta = res.headers.get("x-meta") === "1";
      try { srcs = JSON.parse(decodeURIComponent(res.headers.get("x-sources") || "[]")).filter((x) => /^https?:\/\//i.test(x?.u || "")); } catch {}
      const st = res.headers.get("x-search");
      if (search && st === "limit") note = "وصلت لحد البحث في الساعة، فالرد من غير بحث.";
      else if (search && st === "nokey") note = "البحث مش متاح دلوقتي، فالرد من غير بحث.";
      else if (search && st === "empty") note = "البحث ما رجّعش نتايج، فالرد معلومة عامة.";
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let head = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        let chunk = dec.decode(value, { stream: true });
        if (hasMeta && !meta) {
          head += chunk;
          const nl = head.indexOf("\n");
          if (nl < 0) continue;
          meta = readMeta(head.slice(0, nl));
          chunk = head.slice(nl + 1);
          head = "";
        }
        out += chunk;
        show(!out);
      }
      if (hasMeta && !meta && head) meta = readMeta(head);
      if (!out) out = "مقدرتش أرد دلوقتي. جرّب تاني.";
      show(false);
      if (chatId.current === id && spoken) speak(out, history.length);
      // الكارت اللي اترشح يبان في صف الكروت (تحريك أفقي بس، من غير ما الصفحة تتنطط)
      setTimeout(() => {
        const row = document.querySelector(`[data-row="${history.length}"]`), card = row?.querySelector("[data-best]");
        if (!row || !card) return;
        const r = row.getBoundingClientRect(), b = card.getBoundingClientRect();
        const d = b.right > r.right ? b.right - r.right + 16 : b.left < r.left ? b.left - r.left - 16 : 0;
        if (d) row.scrollBy({ left: d, behavior: "smooth" });
      }, 80);
      saveChat(section, id, [...history, { role: "assistant", content: out, ...(meta?.cards?.length ? { cards: meta.cards } : {}) }]);
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
      if (finalText.trim()) { viaVoice.current = true; if (!auto) setWeb(true); send(finalText, { search: true }); }
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  }

  async function copy(text) {
    try { await navigator.clipboard.writeText(String(text)); toast("اتنسخ."); } catch { toast("مقدرتش أنسخ، حدد النص وانسخه."); }
  }

  const composer = (big) => (
    <form className={`${s.composer} ${big ? s.big : ""}`} onSubmit={(e) => { e.preventDefault(); send(); }}>
      <textarea
        rows={big ? 3 : 1}
        value={input}
        dir="auto"
        placeholder={listening ? "بسمعك… اتكلم" : placeholder || `اسأل ${name}…`}
        aria-label="اكتب طلبك"
        maxLength={2000}
        onChange={(e) => { setInput(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 180)}px`; }}
        onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); send(); } }}
      />
      <div className={s.tools}>
        <LookButton />
        {!auto && <button type="button" className={s.icon} onClick={() => setWeb(!web)} aria-pressed={web} aria-label="بحث في الإنترنت" title="يدوّر في الإنترنت ويجيب مصادر"><Globe /></button>}
        {canVoice && <button type="button" className={`${s.icon} ${listening ? s.live : ""}`} onClick={toggleMic} aria-pressed={listening} aria-label={listening ? "وقّف التسجيل" : "اتكلم بطلبك"} title="اتكلم بطلبك"><Mic /></button>}
        <button type="submit" className={s.send} disabled={!input.trim() || busy} aria-label="إرسال"><Up /></button>
      </div>
    </form>
  );

  const bot = (m, i) => {
    const best = Number((m.content.match(/أحسن\s+اختيار\s*:?\s*\[(\d{1,2})\]/) || [])[1]);
    const cards = m.cards || [];
    return (
      <div key={i} className={s.bot}>
        {m.searching && !m.status && m.pending ? (
          <p className={s.found}><Search /><span className={s.shimmer}>{auto ? `بدوّر في ${sources.join("، ")}…` : "بدوّر وبكتب الرد…"}</span></p>
        ) : null}
        {m.status === "ok" && <p className={s.found}><Check /><span>دوّرت في {sites(m.searched)}، ولقيت {results(cards.length)}</span></p>}
        {m.status === "empty" && <p className={s.found}><Search /><span>دوّرت في {sites(m.searched)} وملقيتش إعلانات مطابقة</span></p>}
        {m.status === "limit" && <p className={s.note}>وصلت لحد البحث في الساعة دي، فده رد من غير بحث جديد.</p>}
        {cards.length > 0 && (
          <div className={s.cards} role="list" aria-label="الإعلانات اللي لقيتها" data-row={i}>
            {cards.map((c) => <div role="listitem" key={c.url} className={s.cardWrap} data-best={c.n === best || undefined}><Card c={c} best={c.n === best} /></div>)}
          </div>
        )}
        {m.pending && !m.content ? (
          (m.status || !m.searching) && <p className={s.wait}><span className={s.shimmer}>{cards.length ? "بقارنلك…" : "بكتب الرد…"}</span></p>
        ) : (
          <>
            {m.note && <p className={s.note}>{m.note}</p>}
            <div className={s.text} dir="auto"><Md>{m.content}</Md></div>
            {m.sources?.length > 0 && (
              <ol className={s.sources} aria-label="المصادر">
                {m.sources.map((x, k) => <li key={k}><a href={x.u} target="_blank" rel="noopener noreferrer nofollow">{x.t || x.d || x.u}</a></li>)}
              </ol>
            )}
            {!m.pending && m.content && (
              <div className={s.acts}>
                <button type="button" className={s.act} onClick={() => (speaking === i ? stopSpeak() : speak(m.content, i))} aria-pressed={speaking === i} aria-label={speaking === i ? "وقّف القراءة" : "اسمع الرد"} title={speaking === i ? "وقّف القراءة" : "اسمع الرد"}><Speaker /></button>
                <button type="button" className={s.act} onClick={() => copy(m.content)} aria-label="انسخ الرد" title="انسخ الرد"><Copy /></button>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const empty = msgs.length === 0;
  return (
    <div className={s.page} data-sec={section}>
      {empty ? (
        <>
          <section className={`${s.hero} ${photo ? s.hasPhoto : ""}`}>
            {photo && <img className={s.photo} src={photo.src} srcSet={photo.srcSet} sizes="(min-width: 880px) 860px, 130vw" alt="" aria-hidden="true" fetchPriority="high" onError={(e) => e.currentTarget.remove()} />}
            <div className={s.top}><b>{name}</b>{children}</div>
            <div className={s.heroText}>
              <h1>{headline || name}</h1>
              {(sub || tagline) && <p>{sub || tagline}</p>}
            </div>
          </section>
          <div className={s.lead}>
            {composer(true)}
            {auto && (
              <p className={s.reach}>
                <Check />
                <span><b>بدوّر في {sites(sources.length)} عقارات في نفس اللحظة:</b> {sources.map((n, k) => <Fragment key={n}>{k ? "، " : ""}<bdi>{n}</bdi></Fragment>)}.</span>
              </p>
            )}
            {error && <div className={s.error} role="alert">{error}</div>}
          </div>
          <div className={s.fill} aria-hidden="true" />
          {starters.length > 0 && (
            <div className={s.starters}>
              <span>ممكن تبدأ بـ</span>
              {starters.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
            </div>
          )}
        </>
      ) : (
        <>
          <div className={s.bar}><b>{name}</b>{children}</div>
          <div className={s.thread} aria-live="polite" data-clarity-mask="True">
            {msgs.map((m, i) => (m.role === "user"
              ? <div key={i} className={s.user}><p dir="auto">{m.content}</p></div>
              : bot(m, i)))}
            <div ref={endRef} />
          </div>
          {error && <div className={s.error} role="alert">{error}</div>}
          {composer(false)}
        </>
      )}
    </div>
  );
}
