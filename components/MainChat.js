"use client";
// الشات الرئيسي: رد فوري كلمة بكلمة، و6 موديلات، وبحث على الإنترنت، واقتراح الأداة المناسبة
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ModelPicker from "./ModelPicker";
import ShareBar from "./ShareBar";
import ToolIcon from "./ToolIcon";
import { tools } from "@/lib/tools";
import { findTools } from "@/lib/search";
import { getModel, DEFAULT_MODEL_KEY } from "@/lib/models";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { read, write, useStored, toast, PENDING_KEY } from "@/lib/store";
import s from "./chat.module.css";

const STARTERS = [
  "اكتبلي إعلان لمحل ملابس في القاهرة",
  "اشرحلي الذكاء الاصطناعي ببساطة",
  "اعملي خطة مذاكرة لأسبوع",
  "صحح الكود ده واشرحلي الغلط",
];

const SEARCH_NOTES = {
  nokey: "البحث على الإنترنت مش متفعّل لسه (محتاج مفتاح بحث في Vercel). الرد من غير بحث.",
  limit: "وصلت لحد البحث الساعة دي. الرد من غير بحث.",
  empty: "ملقيتش نتايج بحث مناسبة. الرد من معلومات الموديل.",
};

const host = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
};

// نص المشاركة: الرد ومعاه روابط المصادر
const shareText = (m) =>
  m.sources?.length ? `${m.content}\n\nالمصادر:\n${m.sources.map((x, i) => `${i + 1}. ${x.t} — ${x.u}`).join("\n")}` : m.content;

export default function MainChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(-1);
  const [sideOpen, setSideOpen] = useState(false);
  const [modelKey, setModelKey] = useStored("model", DEFAULT_MODEL_KEY);
  const [web, setWeb] = useStored("web", false);
  const [settings] = useStored("settings", DEFAULT_SETTINGS);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const boxRef = useRef(null);
  const model = getModel(modelKey);

  // أول ما الصفحة تفتح: إما سؤال جاي من الرئيسية، أو آخر محادثة
  useEffect(() => {
    let pending = null;
    try {
      pending = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {}

    if (pending && pending.trim()) {
      write("chat", []);
      send(pending, [], read("model", DEFAULT_MODEL_KEY));
      return;
    }
    const saved = read("chat", []);
    if (Array.isArray(saved)) setMessages(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!busy) write("chat", messages.slice(-30));
  }, [messages, busy]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: busy ? "auto" : "smooth", block: "end" });
  }, [messages, busy]);

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const suggestions = useMemo(() => (lastUser ? findTools(lastUser.content, 3) : []), [lastUser]);

  function resize() {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  // modelOverride بيتستخدم أول ما الصفحة تفتح، لأن حالة الموديل لسه ما اتحدثتش
  async function send(text, base = messages, modelOverride) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    setError("");
    if (text === undefined) {
      setInput("");
      requestAnimationFrame(resize);
    }

    const searching = read("web", false) === true;
    const history = [...base, { role: "user", content }];
    setMessages([...history, { role: "assistant", content: "", searching }]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";
    let sources = [];

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // بنبعت النص بس، من غير المصادر
          messages: history.map(({ role, content }) => ({ role, content })),
          model: modelOverride || modelKey,
          settings: read("settings", DEFAULT_SETTINGS),
          web: searching,
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "حصل خطأ، جرّب تاني.");
      }
      const status = res.headers.get("x-search");
      if (status && SEARCH_NOTES[status]) toast(SEARCH_NOTES[status]);
      try { sources = JSON.parse(decodeURIComponent(res.headers.get("x-sources") || "[]")); } catch { sources = []; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply, sources }]);
      }
      if (!reply.trim()) throw new Error("ما وصلش رد. جرّب تاني.");
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages([...history, { role: "assistant", content: reply || "_اتوقف الرد._", sources }]);
      } else {
        setMessages(reply ? [...history, { role: "assistant", content: reply, sources }] : history);
        setError(e.message || "الاتصال اتقطع. اتأكد من الإنترنت وجرّب تاني.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  // على الموبايل اللوحة بتطلع من الجنب، وعلى الكمبيوتر هي ظاهرة أصلاً فبنروح لها
  function openModels() {
    if (window.matchMedia("(max-width: 879px)").matches) setSideOpen(true);
    else document.querySelector(`.${s.side} button[aria-pressed="true"]`)?.focus();
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    stop();
    setMessages([]);
    setError("");
    write("chat", []);
    boxRef.current?.focus();
  }

  function retry() {
    if (busy || !lastUser) return;
    // نشيل آخر سؤال ورده، ونبعت نفس السؤال تاني
    const idx = messages.lastIndexOf(lastUser);
    send(lastUser.content, messages.slice(0, idx));
  }

  function toggleWeb() {
    setWeb(!web);
    toast(!web ? "البحث على الإنترنت اتفعّل" : "البحث على الإنترنت اتقفل");
  }

  async function copy(text, i) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(i);
      setTimeout(() => setCopied(-1), 1500);
    } catch {}
  }

  function onKey(e) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  }

  const empty = messages.length === 0;
  const st = { ...DEFAULT_SETTINGS, ...settings };

  return (
    <div className={s.shell}>
      <ModelPicker value={model.key} onChange={setModelKey} open={sideOpen} onClose={() => setSideOpen(false)} />

      <div className={s.page}>
        <div className={s.bar}>
          <button className={s.modelPill} onClick={openModels} aria-haspopup="dialog">
            <span aria-hidden="true">{model.icon}</span>
            <b>{model.name}</b>
            <small>تغيير</small>
          </button>
          {!empty && <button className={s.ghost} onClick={newChat}>+ محادثة جديدة</button>}
        </div>

        {empty ? (
          <section className={s.hero}>
            <div className={s.spark} aria-hidden="true">✦</div>
            <h1>عايز تعمل إيه النهارده؟</h1>
            <p>اسأل أي سؤال بالعربي، والرد هيوصلك فوراً. فعّل «بحث» عشان تاخد معلومات جديدة من الإنترنت ومعاها المصادر.</p>
            <div className={s.starters}>
              {STARTERS.map((q) => (
                <button key={q} className={s.starter} onClick={() => send(q)}>{q}</button>
              ))}
            </div>
          </section>
        ) : (
          <div className={s.thread}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? s.userRow : s.botRow}>
                {m.role === "user" ? (
                  <div className={s.user}>{m.content}</div>
                ) : (
                  <div className={s.bot}>
                    {m.content ? (
                      <div className={s.md} id={`msg-${i}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <div className={s.typing} aria-label="جاري الكتابة">
                        <span /><span /><span />
                        {m.searching && <em className={s.searchingNote}>بيدوّر على الإنترنت…</em>}
                      </div>
                    )}

                    {m.sources?.length > 0 && (
                      <div className={s.sources}>
                        <span className={s.sourcesTitle}>المصادر</span>
                        <div className={s.sourceRow}>
                          {m.sources.map((src, k) => (
                            <a key={src.u} href={src.u} target="_blank" rel="noopener noreferrer nofollow" className={s.source} title={src.t}>
                              <b>{k + 1}</b>
                              <span>{host(src.u)}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {m.content && !(busy && i === messages.length - 1) && (
                      <div className={s.actions}>
                        <button className={s.ghost} onClick={() => copy(shareText(m), i)}>{copied === i ? "اتنسخ ✓" : "نسخ"}</button>
                        {i === messages.length - 1 && <button className={s.ghost} onClick={retry}>إعادة المحاولة</button>}
                        <ShareBar
                          compact
                          text={shareText(m)}
                          title="محادثة"
                          getHtml={() => document.getElementById(`msg-${i}`)?.innerHTML || ""}
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!busy && suggestions.length > 0 && (
              <div className={s.suggest}>
                <div className={s.suggestTitle}>أدوات ممكن تفيدك في ده:</div>
                <div className={s.suggestGrid}>
                  {suggestions.map((t) => (
                    <Link key={t.id} href={`/tool/${t.id}?q=${encodeURIComponent(lastUser.content.slice(0, 1500))}`} className={s.toolCard}>
                      <ToolIcon tool={t} size="sm" />
                      <span>
                        <b>{t.name}</b>
                        <small>{t.desc}</small>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            {error && <div className={s.error} role="alert">{error}</div>}
            <div ref={endRef} />
          </div>
        )}

        <div className={s.composerWrap}>
          <div className={s.composer}>
            <label htmlFor="chat-in" className="sr">رسالتك</label>
            <textarea
              id="chat-in"
              ref={boxRef}
              rows={1}
              value={input}
              maxLength={4000}
              placeholder={web ? "اسأل عن أي حاجة جديدة، وهدوّرلك على الإنترنت..." : "اكتب سؤالك أو طلبك هنا..."}
              onChange={(e) => { setInput(e.target.value); resize(); }}
              onKeyDown={onKey}
            />
            <button
              type="button"
              className={`${s.webBtn} ${web ? s.webOn : ""}`}
              onClick={toggleWeb}
              aria-pressed={web}
              title="بحث على الإنترنت"
            >
              <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8.5" />
                <path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" />
              </svg>
              <span>بحث</span>
            </button>
            {busy ? (
              <button className={s.send} onClick={stop} aria-label="إيقاف">■</button>
            ) : (
              <button className={s.send} onClick={() => send()} disabled={!input.trim()} aria-label="إرسال">↑</button>
            )}
          </div>
          <div className={s.note}>
            «{model.name}»{web ? " • بحث على الإنترنت" : ""}{st.voice !== "auto" || st.depth !== "auto" ? " • إعداداتك مفعّلة" : ""} — الردود من ذكاء اصطناعي وممكن يكون فيها أخطاء، راجع المهم منها.
          </div>
        </div>
      </div>
    </div>
  );
}
