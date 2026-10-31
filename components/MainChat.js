"use client";
// الشات الرئيسي: رد فوري كلمة بكلمة، و6 موديلات، وبحث على الإنترنت، وقراءة الملفات (PDF وWord والصور)،
// واقتراح الأداة المناسبة. نفس الشات بيشتغل جوه «المشاريع» (props: project وما بعدها).
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ModelPicker from "./ModelPicker";
import ShareBar from "./ShareBar";
import ToolIcon from "./ToolIcon";
import BotIcon from "./BotIcon";
import ProCode from "./ProCode";
import StarMark from "./StarMark";
import FusionStack from "./FusionStack";
import { useProofread, ProofIcon } from "@/lib/useProofread";
import { getBot } from "@/lib/bots";
import { findTools } from "@/lib/search";
import { getModel, DEFAULT_MODEL_KEY } from "@/lib/models";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { read, write, useStored, toast, PENDING_KEY } from "@/lib/store";
import { ACCEPT, KIND_ICON, docLabel } from "@/lib/docs";
import { useAttach } from "@/lib/useAttach";
import { idbGet, idbSet, idbDel } from "@/lib/idb";
import s from "./chat.module.css";

const STARTERS = [
  "اكتبلي إعلان لمحل ملابس في القاهرة",
  "اشرحلي الذكاء الاصطناعي ببساطة",
  "اعملي خطة مذاكرة لأسبوع",
  "صحح الكود ده واشرحلي الغلط",
];

// أوامر جاهزة لما يكون فيه ملف مرفوع
export const DOC_ACTIONS = [
  { label: "لخّص الملف", q: "لخّصلي الملف: ابدأ بفكرته في سطرين، وبعدين أهم النقاط بعناوين واضحة، والأرقام والتواريخ المهمة زي ما هي." },
  { label: "أهم النقاط في جدول", q: "طلّعلي أهم النقاط والأرقام والتواريخ والأسماء اللي في الملف في جدول مرتب، ومعاها رقم الصفحة." },
  { label: "أسئلة مراجعة بالإجابات", q: "اعملي 10 أسئلة مراجعة من الملف (اختيار من متعدد ومقالي)، وبعدهم الإجابات النموذجية ورقم الصفحة اللي فيها الإجابة." },
  { label: "اشرحه ببساطة", q: "اشرحلي الملف ببساطة كأني أول مرة أعرف الموضوع، بأمثلة من الواقع، ومن غير مصطلحات صعبة." },
];

const SEARCH_NOTES = {
  nokey: "البحث على الإنترنت مش متفعّل لسه (محتاج مفتاح بحث في Vercel). الرد من غير بحث.",
  limit: "وصلت لحد البحث الساعة دي. الرد من غير بحث.",
  empty: "ملقيتش نتايج بحث مناسبة. الرد من معلومات الموديل.",
};

const CHAT_DOCS = "chat-docs";

// «ملف / ملفين / 3 ملفات / 11 ملف»
export const nFiles = (n) => (n === 1 ? "ملف واحد" : n === 2 ? "ملفين" : n <= 10 ? `${n} ملفات` : `${n} ملف`);

const host = (u) => {
  try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; }
};

// نص المشاركة: الرد ومعاه روابط المصادر
const shareText = (m) =>
  m.sources?.length ? `${m.content}\n\nالمصادر:\n${m.sources.map((x, i) => `${i + 1}. ${x.t} — ${x.u}`).join("\n")}` : m.content;

const ClipIcon = () => (
  <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M20 11.5l-7.7 7.7a5 5 0 01-7.1-7.1l8.2-8.2a3.4 3.4 0 014.8 4.8l-8.2 8.2a1.7 1.7 0 01-2.4-2.4l7.6-7.6" />
  </svg>
);

/**
 * @param project        مشروع مفتوح: { id, name, instructions, docs } (من غيره = الشات العادي)
 * @param initialMessages  رسائل المحادثة اللي هتفتح (في المشروع)
 * @param onMessages     بيتنادى بعد كل رد عشان المشروع يحفظ المحادثة
 * @param onAttach       ملف اتقرا وعايز يتضاف لملفات المشروع
 * @param onNewChat      «محادثة جديدة» جوه المشروع
 * @param onShowFiles    فتح ملفات المشروع
 * @param onStart        أول ما سؤال يتبعت (المشروع بيعرف إن فيه محادثة شغالة)
 * @param hero           واجهة البداية بدل العنوان العادي، أو دالة بتاخد { send, addFiles, reading }
 * @param barStart       زرار في أول الشريط (الرجوع للمشروع)
 * @param placeholder    نص خانة الكتابة
 */
export default function MainChat({ project = null, initialMessages = null, onMessages, onAttach, onNewChat, onShowFiles, onStart, hero = null, barStart = null, placeholder = "" }) {
  const inProject = !!project;
  const [messages, setMessages] = useState(() => (Array.isArray(initialMessages) ? initialMessages : []));
  const [input, setInput] = useState("");
  const [focus, setFocus] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(-1);
  const [sideOpen, setSideOpen] = useState(false);
  const [modelKey, setModelKey] = useStored("model", DEFAULT_MODEL_KEY);
  const [web, setWeb] = useStored("web", false);
  const [botKey, setBotKey] = useStored("bot", "");
  const [needPro, setNeedPro] = useState(false);
  const [settings] = useStored("settings", DEFAULT_SETTINGS);
  const [chatDocs, setChatDocs] = useState([]);
  const [fresh, setFresh] = useState([]); // ملفات اتضافت ولسه ما اتسألش عنها
  const [dragging, setDragging] = useState(false);
  const docsLoaded = useRef(false);
  const abortRef = useRef(null);
  const endRef = useRef(null);
  const boxRef = useRef(null);
  const fileRef = useRef(null);
  const dragDepth = useRef(0);
  const model = getModel(modelKey);
  const bot = getBot(botKey);
  const proof = useProofread(() => input, (t) => { setInput(t); requestAnimationFrame(resize); });

  const docs = inProject ? project.docs || [] : chatDocs;
  const docsRef = useRef(docs);
  docsRef.current = docs;
  const attach = useAttach({
    docs,
    onAdd: (d) => {
      if (inProject) onAttach?.(d);
      else setChatDocs((list) => [...list, d]);
      setFresh((f) => [...f, d.name]);
    },
  });

  // أول ما الصفحة تفتح: إما سؤال جاي من الرئيسية، أو آخر محادثة (في الشات العادي بس)
  useEffect(() => {
    if (inProject) return;
    // جاي من صفحة «الموديلات»: /chat?bot=claude-opus
    let fresh = false;
    try {
      const qs = new URLSearchParams(window.location.search);
      const k = qs.get("bot");
      if (k && getBot(k)) write("bot", k);
      fresh = qs.has("new");
    } catch {}
    if (fresh) {
      write("chat", []);
      idbDel(CHAT_DOCS);
      docsLoaded.current = true;
      try { window.history.replaceState(null, "", "/chat"); } catch {}
      return;
    }

    let pending = null;
    try {
      pending = sessionStorage.getItem(PENDING_KEY);
      sessionStorage.removeItem(PENDING_KEY);
    } catch {}

    if (pending && pending.trim()) {
      write("chat", []);
      idbDel(CHAT_DOCS);
      docsLoaded.current = true;
      send(pending, [], read("model", DEFAULT_MODEL_KEY));
      return;
    }
    const saved = read("chat", []);
    if (Array.isArray(saved)) setMessages(saved);
    // ملفات المحادثة محفوظة على الجهاز (IndexedDB) لأنها أكبر من مساحة localStorage
    idbGet(CHAT_DOCS).then((d) => {
      if (Array.isArray(d) && d.length) setChatDocs((cur) => (cur.length ? cur : d));
    }).finally(() => { docsLoaded.current = true; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (inProject || !docsLoaded.current) return;
    if (chatDocs.length) idbSet(CHAT_DOCS, chatDocs).catch(() => toast("مساحة الجهاز مش كفاية لحفظ الملفات، هتفضل لحد ما تقفل الصفحة"));
    else idbDel(CHAT_DOCS);
  }, [chatDocs, inProject]);

  // «محادثة جديدة» من اللوحة الجانبية وإحنا جوه الشات
  useEffect(() => {
    if (inProject) return;
    const on = () => newChat();
    window.addEventListener("rs-new-chat", on);
    return () => window.removeEventListener("rs-new-chat", on);
  });

  useEffect(() => {
    if (busy) return;
    if (inProject) onMessages?.(messages);
    else write("chat", messages.slice(-30));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, busy]);

  useEffect(() => {
    if (!messages.length) return;
    endRef.current?.scrollIntoView({ behavior: busy ? "auto" : "smooth", block: "end" });
  }, [messages, busy]);

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const suggestions = useMemo(() => (lastUser && !docs.length ? findTools(lastUser.content, 3) : []), [lastUser, docs.length]);

  function resize() {
    const el = boxRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 280) + "px";
  }

  // modelOverride بيتستخدم أول ما الصفحة تفتح، لأن حالة الموديل لسه ما اتحدثتش
  async function send(text, base = messages, modelOverride, filesOverride) {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    if (attach.pending.length) { attach.setNote("استنى لحظة لما الملف يخلص قراية."); return; }
    setError("");
    if (text === undefined) {
      setInput("");
      requestAnimationFrame(resize);
    }

    const searching = read("web", false) === true;
    const currentDocs = docsRef.current;
    const files = filesOverride || (fresh.length ? fresh : undefined);
    setFresh([]);
    onStart?.();
    const history = [...base, { role: "user", content, ...(files ? { files } : {}) }];
    setMessages([...history, { role: "assistant", content: "", searching, reading: currentDocs.length > 0 }]);
    setBusy(true);

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";
    let sources = [];
    let images = [];
    let fusion = null;
    let fromDocs = false;

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // بنبعت النص بس، من غير المصادر
          messages: history.map(({ role, content }) => ({ role, content })),
          model: modelOverride || modelKey,
          bot: read("bot", "") || undefined,
          pro: read("pro-code", "") || undefined,
          settings: read("settings", DEFAULT_SETTINGS),
          web: searching,
          ...(currentDocs.length ? { docs: currentDocs.map(({ name, text }) => ({ name, text })) } : {}),
          ...(inProject && project.instructions ? { instructions: project.instructions, project: project.name } : {}),
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => ({}));
        if (data.code === "pro") setNeedPro(true);
        throw new Error(data.error || (res.status === 413 ? "الملفات كبيرة على الطلب ده. شيل ملف وجرّب تاني." : "حصل خطأ، جرّب تاني."));
      }
      setNeedPro(false);
      try { const f = res.headers.get("x-fusion"); if (f) fusion = JSON.parse(decodeURIComponent(f)); } catch {}
      if (res.headers.get("x-fusion-limit")) toast("وصلت لحد الدمج الساعة دي، فالرد من نموذج واحد");
      if (fusion) setMessages([...history, { role: "assistant", content: "", searching, fusion }]);
      if (res.headers.get("x-bot") === "fallback") toast("الموديل ده مش متاح دلوقتي، فردّ عليك «متوازن»");
      fromDocs = !!res.headers.get("x-docs");
      const status = res.headers.get("x-search");
      if (status && SEARCH_NOTES[status]) toast(SEARCH_NOTES[status]);
      try { sources = JSON.parse(decodeURIComponent(res.headers.get("x-sources") || "[]")); } catch { sources = []; }
      try { images = JSON.parse(decodeURIComponent(res.headers.get("x-images") || "[]")); } catch { images = []; }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        reply += decoder.decode(value, { stream: true });
        setMessages([...history, { role: "assistant", content: reply, sources, images, fusion, fromDocs }]);
      }
      if (!reply.trim()) throw new Error("ما وصلش رد. جرّب تاني.");
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages([...history, { role: "assistant", content: reply || "_اتوقف الرد._", sources, images, fusion, fromDocs }]);
      } else {
        setMessages(reply ? [...history, { role: "assistant", content: reply, sources, images, fusion, fromDocs }] : history);
        setError(e.message || "الاتصال اتقطع. اتأكد من الإنترنت وجرّب تاني.");
      }
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  // على الموبايل اللوحة بتطلع من الجنب، وعلى الكمبيوتر هي ظاهرة أصلاً فبنروح لها
  function openModels() {
    if (window.matchMedia("(max-width: 1199px)").matches) setSideOpen(true);
    else document.querySelector(`.${s.side} button[aria-pressed="true"]`)?.focus();
  }

  function stop() {
    abortRef.current?.abort();
  }

  function newChat() {
    stop();
    if (inProject && onNewChat) return onNewChat();
    setMessages([]);
    setError("");
    setChatDocs([]);
    setFresh([]);
    attach.setNote("");
    write("chat", []);
    boxRef.current?.focus();
  }

  function retry() {
    if (busy || !lastUser) return;
    // نشيل آخر سؤال ورده، ونبعت نفس السؤال تاني
    const idx = messages.lastIndexOf(lastUser);
    send(lastUser.content, messages.slice(0, idx), undefined, lastUser.files);
  }

  function toggleWeb() {
    setWeb(!web);
    toast(!web ? "البحث على الإنترنت اتفعّل" : "البحث على الإنترنت اتقفل");
  }

  function removeDoc(id) {
    const d = chatDocs.find((x) => x.id === id);
    setChatDocs((list) => list.filter((x) => x.id !== id));
    if (d) setFresh((f) => f.filter((n) => n !== d.name));
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

  // لزق صورة أو ملف في خانة الكتابة (سكرين شوت مثلاً)
  function onPaste(e) {
    const files = [...(e.clipboardData?.files || [])];
    if (!files.length) return;
    e.preventDefault();
    attach.addFiles(files);
  }

  // سحب ملف من الكمبيوتر ورميه على الشات
  const hasFiles = (e) => [...(e.dataTransfer?.types || [])].includes("Files");
  const drag = {
    onDragEnter: (e) => { if (!hasFiles(e)) return; e.preventDefault(); dragDepth.current++; setDragging(true); },
    onDragOver: (e) => { if (hasFiles(e)) e.preventDefault(); },
    onDragLeave: () => { dragDepth.current = Math.max(0, dragDepth.current - 1); if (!dragDepth.current) setDragging(false); },
    onDrop: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      attach.addFiles(e.dataTransfer.files);
    },
  };

  const empty = messages.length === 0;
  const st = { ...DEFAULT_SETTINGS, ...settings };
  const reading = attach.pending.length > 0;
  const docActions = DOC_ACTIONS.map((a) => (docs.length > 1 ? { ...a, label: a.label.replace("الملف", "الملفات"), q: a.q.replace(/الملف/g, "الملفات") } : a));

  return (
    <div className={s.shell}>
      <ModelPicker
        value={bot ? null : model.key}
        bot={bot}
        onChange={(k) => { setModelKey(k); setBotKey(""); setNeedPro(false); }}
        onBot={(k) => setBotKey(k)}
        open={sideOpen}
        onClose={() => setSideOpen(false)}
      />

      <div className={s.page} {...drag}>
        {dragging && (
          <div className={s.dropOverlay} aria-hidden="true">
            <div><ClipIcon /><b>سيب الملف هنا</b><small>PDF أو Word أو صورة أو ملف نص</small></div>
          </div>
        )}
        <div className={s.bar}>
          <div className={s.barStart}>
            {barStart}
            <button className={s.modelPill} onClick={openModels} aria-haspopup="dialog">
              {bot ? <BotIcon bot={bot} size={22} /> : model.fusion ? <FusionStack size={18} /> : <span aria-hidden="true">{model.icon}</span>}
              <b dir="auto">{bot ? bot.name : model.name}</b>
              <small>تغيير</small>
            </button>
          </div>
          {!empty && <button className={s.ghost} onClick={newChat}>+ محادثة جديدة</button>}
        </div>

        {empty ? (
          hero ? (
            <section className={s.projectHero}>{typeof hero === "function" ? hero({ send, addFiles: attach.addFiles, reading }) : hero}</section>
          ) : (
            <section className={`${s.hero} ${(focus || input.trim()) && !docs.length ? s.typingMode : ""}`}>
              {bot ? (
                <div className={s.botHero}><BotIcon bot={bot} size={58} /></div>
              ) : (
                <div className={s.spark}><StarMark size={42} /></div>
              )}
              <h1>{docs.length ? (docs.length > 1 ? `${nFiles(docs.length)} ${docs.length === 2 ? "جاهزين" : "جاهزة"}` : "الملف جاهز") : bot ? <>بتتكلم مع <bdi>{bot.name}</bdi></> : "عايز تعمل إيه النهارده؟"}</h1>
              <p>
                {docs.length
                  ? "اسأل أي سؤال عن الملف، أو اختار أمر جاهز:"
                  : "اسأل أي سؤال بالعربي، والرد هيوصلك فوراً. ارفع PDF أو ملف Word وهلخّصهولك وأجاوب منه، وفعّل «بحث» عشان معلومات جديدة من الإنترنت ومعاها المصادر."}
              </p>
              <div className={s.starters}>
                {(docs.length ? docActions : STARTERS.map((q) => ({ label: q, q }))).map((a) => (
                  <button key={a.label} className={`${s.starter} ${docs.length ? s.docStarter : ""}`} onClick={() => send(a.q)} disabled={reading}>{a.label}</button>
                ))}
              </div>
              {!bot && (
                <Link href="/projects" className={s.projectsLink}>
                  <span aria-hidden="true">📁</span> عندك ملفات بترجعلها كتير؟ <b>اعمل مشروع</b> والمساعد يفتكرها في كل محادثة
                </Link>
              )}
            </section>
          )
        ) : (
          <div className={s.thread}>
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? s.userRow : s.botRow}>
                {m.role === "user" ? (
                  <div className={s.userCol}>
                    {m.files?.length > 0 && (
                      <div className={s.userFiles}>
                        {m.files.map((f) => <span key={f}><ClipIcon />{f}</span>)}
                      </div>
                    )}
                    <div className={s.user}>{m.content}</div>
                  </div>
                ) : (
                  <div className={s.bot}>
                    {m.fusion && m.content && (
                      <div className={s.fusionTag}>
                        <FusionStack items={m.fusion} size={18} />
                        <span>إجابة مدمجة من {m.fusion.length} نماذج ومتدققة لغوياً</span>
                      </div>
                    )}
                    {m.fromDocs && m.content && (
                      <div className={s.docTag}><ClipIcon /><span>الرد من ملفاتك</span></div>
                    )}
                    {m.content ? (
                      <div className={s.md} id={`msg-${i}`}>
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
                      </div>
                    ) : m.fusion ? (
                      <div className={s.fusionWait} aria-label="جاري تجميع الإجابة">
                        <FusionStack items={m.fusion} size={26} pulse />
                        <span>
                          <b>{m.fusion.length} نماذج بتشتغل على سؤالك…</b>
                          <small>{m.fusion.map((x) => x.name).join(" • ")}</small>
                        </span>
                      </div>
                    ) : (
                      <div className={s.typing} aria-label="جاري الكتابة">
                        <span /><span /><span />
                        {m.searching ? <em className={s.searchingNote}>بيدوّر على الإنترنت…</em> : m.reading ? <em className={s.searchingNote}>بيقرا ملفاتك…</em> : null}
                      </div>
                    )}

                    {m.images?.length > 0 && (
                      <div className={s.images} aria-label="صور من نتائج البحث">
                        {m.images.map((im) => (
                          <a key={im.s} href={im.h} target="_blank" rel="noopener noreferrer nofollow" className={s.imgCard} title={im.a || ""}>
                            <img src={im.s} alt={im.a || ""} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.closest("a").style.display = "none"; }} />
                          </a>
                        ))}
                      </div>
                    )}

                    {m.sources?.length > 0 && (
                      <div className={s.sources}>
                        <span className={s.sourcesTitle}>المصادر</span>
                        <div className={s.sourceRow}>
                          {m.sources.map((src, k) => (
                            <a key={src.u} href={src.u} target="_blank" rel="noopener noreferrer nofollow" className={s.source} title={src.t}>
                              <b>{k + 1}</b>
                              <span>{src.d || host(src.u)}</span>
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
            {needPro && <ProCode compact onActivated={() => { setNeedPro(false); setError(""); retry(); }} />}
            <div ref={endRef} />
          </div>
        )}

        <div className={s.composerWrap}>
          {!empty && !busy && fresh.length > 0 && (
            <div className={s.quickRow}>
              {docActions.map((a) => (
                <button key={a.label} type="button" onClick={() => send(a.q)} disabled={reading}>{a.label}</button>
              ))}
            </div>
          )}
          <div className={s.composer}>
            {(docs.length > 0 || attach.pending.length > 0 || attach.note) && (
              <div className={s.files}>
                <div className={s.fileRow}>
                {inProject ? (
                  docs.length > 0 && (
                    <button type="button" className={s.fileChip} onClick={onShowFiles}>
                      <span aria-hidden="true">📚</span>
                      <b>ملفات المشروع</b>
                      <small>{nFiles(docs.length)} • المحادثة بتقرا منهم</small>
                    </button>
                  )
                ) : (
                  docs.map((d) => (
                    <span key={d.id} className={s.fileChip} title={d.name}>
                      <span aria-hidden="true">{KIND_ICON[d.kind] || "📄"}</span>
                      <b dir="auto">{d.name}</b>
                      <small>{docLabel(d)}</small>
                      <button type="button" className={s.fileX} onClick={() => removeDoc(d.id)} aria-label={`شيل ${d.name}`}>✕</button>
                    </span>
                  ))
                )}
                {attach.pending.map((p) => (
                  <span key={p.id} className={`${s.fileChip} ${s.filePending}`} aria-live="polite">
                    <span className={s.spin} aria-hidden="true" />
                    <b dir="auto">{p.name}</b>
                    <small>{p.note}</small>
                  </span>
                ))}
                </div>
                {attach.note && (
                  <div className={s.fileNote} role="status">
                    <span>{attach.note}</span>
                    <button type="button" onClick={() => attach.setNote("")} aria-label="إخفاء">✕</button>
                  </div>
                )}
              </div>
            )}
            <label htmlFor="chat-in" className="sr">رسالتك</label>
            <textarea
              id="chat-in"
              ref={boxRef}
              rows={1}
              value={input}
              maxLength={4000}
              placeholder={placeholder || (docs.length ? "اسأل عن الملف، مثلاً: إيه أهم 5 نقاط في الفصل التاني؟" : web ? "اسأل عن أي حاجة جديدة، وهدوّرلك على الإنترنت..." : "اكتب سؤالك أو طلبك هنا...")}
              onChange={(e) => { setInput(e.target.value); resize(); }}
              onKeyDown={onKey}
              onPaste={onPaste}
              onFocus={() => setFocus(true)}
              onBlur={() => setFocus(false)}
            />
            <div className={s.tools}>
              <input
                ref={fileRef}
                type="file"
                accept={ACCEPT}
                multiple
                hidden
                data-testid="chat-file"
                onChange={(e) => { attach.addFiles(e.target.files); e.target.value = ""; }}
              />
              <button
                type="button"
                className={s.webBtn}
                onClick={() => fileRef.current?.click()}
                disabled={reading}
                title="ارفع PDF أو Word أو صورة وأنا أقراه"
              >
                <ClipIcon />
                <span>ملف</span>
              </button>
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
              <button
                type="button"
                className={s.proofBtn}
                onClick={proof.run}
                disabled={proof.busy || !input.trim()}
                title="تدقيق لغوي: صحّح الإملاء والنحو"
                aria-label="تدقيق لغوي"
              >
                {proof.busy ? <span className={s.spin} /> : <ProofIcon />}
              </button>
              <span className={s.grow} />
              {busy ? (
                <button className={s.send} onClick={stop} aria-label="إيقاف">■</button>
              ) : (
                <button className={s.send} onClick={() => send()} disabled={!input.trim() || reading} aria-label="إرسال">↑</button>
              )}
            </div>
          </div>
          {proof.undo !== null && (
            <div className={s.undoNote}>
              اتصلّحت الأخطاء في رسالتك.
              <button type="button" onClick={proof.revert}>تراجع</button>
              <button type="button" onClick={proof.dismiss} aria-label="إخفاء">✕</button>
            </div>
          )}
          <div className={s.note}>
            «{bot ? bot.name : model.name}»{web ? " • بحث على الإنترنت" : ""}{docs.length ? ` • ${nFiles(docs.length)}` : ""}{inProject && project.instructions ? " • تعليمات المشروع" : ""}{st.voice !== "auto" || st.depth !== "auto" ? " • إعداداتك مفعّلة" : ""} — الردود من ذكاء اصطناعي وممكن يكون فيها أخطاء، راجع المهم منها.
          </div>
        </div>
      </div>
    </div>
  );
}
