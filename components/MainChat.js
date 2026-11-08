"use client";
// الشات الرئيسي: رد فوري كلمة بكلمة، و6 موديلات، وبحث على الإنترنت، وقراءة الملفات (PDF وWord والصور)،
// واقتراح الأداة المناسبة. نفس الشات بيشتغل جوه «المشاريع» (props: project وما بعدها).
import { enterSends } from "@/lib/keys";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Md from "@/components/Md";
import ModelPicker from "./ModelPicker";
import ShareBar from "./ShareBar";
import ToolIcon from "./ToolIcon";
import BotIcon from "./BotIcon";
import StarMark from "./StarMark";
import FusionStack from "./FusionStack";
import { useProofread, ProofIcon } from "@/lib/useProofread";
import { getBot, BOTS, CHAT_PICKS } from "@/lib/bots";
import { findTools } from "@/lib/search";
import { getModel, DEFAULT_MODEL_KEY, MODEL_OPTIONS } from "@/lib/models";
import { answerToPng, shareOrDownload } from "@/lib/answerimage";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import { read, write, useStored, toast, PENDING_KEY } from "@/lib/store";
import { ACCEPT, KIND_ICON, docLabel } from "@/lib/docs";
import { useAttach } from "@/lib/useAttach";
import { idbGet, idbSet, idbDel } from "@/lib/idb";
import { LEVELS, EXTRAS, DEFAULT_OPTS, optsCount, splitDiscuss } from "@/lib/answeropts";
import s from "./chat.module.css";

const STARTERS = [
  "إعلان لمحل ملابس",
  "اشرحلي الذكاء الاصطناعي",
  "خطة مذاكرة لأسبوع",
  "صحّح كود واشرح الغلط",
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
/** «openrouter/anthropic/claude-sonnet-5.5» ← اسم مفهوم للموديل */
function modelLabel(used) {
  const id = String(used).replace(/^(groq|gemini|openrouter|pollinations)\//, "");
  const b = BOTS.find((x) => x.id === id || x.fallbackId === id);
  if (b) return b.name;
  if (/flash-lite/.test(id)) return "Gemini Flash Lite";
  if (/^gemini/.test(id)) return "Gemini Flash";
  if (/kimi/.test(id)) return "Kimi K2";
  if (/llama/.test(id)) return "Llama";
  if (/qwen/.test(id)) return "Qwen";
  return id.split("/").pop();
}

const V_MARK = { ok: ["✓", "صح"], wrong: ["✕", "غلط"], unsure: ["؟", "مش متأكد"] };
const V_HEAD = {
  ok: "المعلومات الأساسية في الرد مطابقة للمصادر.",
  mixed: "فيه معلومات صح وفيه معلومات محتاجة تصحيح.",
  wrong: "الرد فيه معلومات غلط.",
  unsure: "المصادر اللي لقيتها مش كفاية أتأكد من الرد.",
};
const vHost = (u) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return ""; } };

function VerifyPanel({ v }) {
  if (v.status === "loading") return <div className={s.verify} aria-live="polite"><span className={s.spin} aria-hidden="true" /> بدوّر على الإنترنت وبراجع الرد…</div>;
  if (v.status === "error") return <div className={`${s.verify} ${s.verifyErr}`} role="status">{v.error}</div>;
  return (
    <div className={s.verify} data-verdict={v.verdict} aria-live="polite">
      <b className={s.verifyHead}>{V_HEAD[v.verdict] || V_HEAD.unsure}</b>
      {v.summary && <p>{v.summary}</p>}
      <ul>
        {(v.claims || []).map((c, k) => (
          <li key={k} data-status={c.status}>
            <i aria-hidden="true">{(V_MARK[c.status] || V_MARK.unsure)[0]}</i>
            <span>
              <span className="sr">{(V_MARK[c.status] || V_MARK.unsure)[1]}: </span>
              {c.text}
              {c.fix && <em> الصح: {c.fix}</em>}
              {c.src?.length > 0 && <small> {c.src.map((n) => `[${n}]`).join(" ")}</small>}
            </span>
          </li>
        ))}
      </ul>
      {v.sources?.length > 0 && (
        <div className={s.verifySrc}>
          {v.sources.map((x) => (
            <a key={x.n} href={x.u} target="_blank" rel="noopener noreferrer nofollow" title={x.t}><b>{x.n}</b>{x.d || vHost(x.u)}</a>
          ))}
        </div>
      )}
    </div>
  );
}

export default function MainChat({ chatBots = null, project = null, initialMessages = null, onMessages, onAttach, onNewChat, onShowFiles, onStart, hero = null, barStart = null, placeholder = "", showcase = null }) {
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
  const [brand] = useStored("brand", null);
  const [useBrand, setUseBrand] = useStored("chat-brand", true);
  const [opts, setOpts] = useStored("answer-opts", DEFAULT_OPTS);
  const [optsOpen, setOptsOpen] = useState(false);
  const [sheet, setSheet] = useState(""); // "plus" | "models" | ""
  const blurTimer = useRef(null);
  const [confirmNew, setConfirmNew] = useState(false);
  // الموديلات بالاسم في مربع «الموديل»: من السيرفر (المتاح بس)، أو من القايمة الثابتة لو الشات جوه مشروع
  const picks = useMemo(() => (chatBots || CHAT_PICKS.map((k) => getBot(k)).filter(Boolean)).slice(0, 7), [chatBots]);
  const nOpts = optsCount(opts);
  const [rewriteOpen, setRewriteOpen] = useState(-1);
  const didInitScroll = useRef(false);
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

  // أول ما المحادثة القديمة تفتح ننزل لآخرها مرة واحدة. بعد كده الصفحة ما بتجريش ورا الرد وهو بيتكتب:
  // سؤالك بيطلع فوق والرد بيتكتب تحته، فتقرا براحتك من غير ما تنزل كل شوية
  useEffect(() => {
    if (didInitScroll.current || !messages.length) return;
    didInitScroll.current = true;
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages]);

  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  // وضع الشات: بيشيل فوتر الموقع والمسافة الفاضية تحت خانة الكتابة (globals.css: .chat-mode)
  useEffect(() => {
    document.body.classList.add("chat-mode");
    return () => document.body.classList.remove("chat-mode", "chat-typing");
  }, []);

  const suggestions = useMemo(() => (lastUser && !docs.length ? findTools(lastUser.content, 2, 6) : []), [lastUser, docs.length]);

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
    setRewriteOpen(-1);
    didInitScroll.current = true;
    const rowId = `row-${history.length - 1}`;
    requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById(rowId)?.scrollIntoView({ behavior: "smooth", block: "start" })));

    const controller = new AbortController();
    abortRef.current = controller;
    let reply = "";
    let sources = [];
    let images = [];
    let fusion = null;
    let fromDocs = false;
    let route = null;
    let swappedTo = null;
    const myBrand = read("chat-brand", true) ? read("brand", null) : null;

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
          ...(myBrand?.name ? { brand: myBrand } : {}),
          opts: read("answer-opts", DEFAULT_OPTS),
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
      route = res.headers.get("x-route") || null;
      const used = res.headers.get("x-model") || "";
      const asked = res.headers.get("x-asked") || "";
      swappedTo = used && asked && used !== asked ? modelLabel(used) : null;
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
        setMessages([...history, { role: "assistant", content: reply, sources, images, fusion, fromDocs, route, swappedTo }]);
      }
      if (!reply.trim()) throw new Error("ما وصلش رد. جرّب تاني.");
    } catch (e) {
      if (e.name === "AbortError") {
        setMessages([...history, { role: "assistant", content: reply || "_اتوقف الرد._", sources, images, fusion, fromDocs, route, swappedTo }]);
      } else {
        setMessages(reply ? [...history, { role: "assistant", content: reply, sources, images, fusion, fromDocs, route, swappedTo }] : history);
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

  // «غيّر الرد»: نفس الرد أقصر أو أبسط أو بتفصيل، مكانه، ومعاه «رجّع الرد الأصلي»
  const REWRITE = {
    short: ["أقصر", "اكتب نفس الرد ده تاني بشكل أقصر بكتير: الخلاصة في 3 أو 4 سطور بس، من غير ما تشيل أهم معلومة."],
    simple: ["أبسط", "اكتب نفس الرد ده تاني بشكل أبسط، كأنك بتشرح لحد مش متخصص: كلام سهل ومثال من الحياة اليومية."],
    detail: ["بالتفصيل", "اكتب نفس الرد ده تاني بتفصيل أكتر: اشرح الأسباب، وادّي أمثلة عملية، وخطوات لو تنفع."],
  };

  async function rewrite(i, kind) {
    const m = messages[i];
    const q = [...messages.slice(0, i)].reverse().find((x) => x.role === "user");
    if (busy || !m || !q || !REWRITE[kind]) return;
    const orig = m.orig ?? m.content;
    const patch = (p) => setMessages((list) => list.map((x, k) => (k === i ? { ...x, ...p } : x)));
    const controller = new AbortController();
    abortRef.current = controller;
    setBusy(true);
    setRewriteOpen(-1);
    patch({ content: "", orig, variant: kind, verify: undefined });
    let text = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: q.content },
            { role: "assistant", content: orig.slice(0, 4000) },
            { role: "user", content: REWRITE[kind][1] },
          ],
          model: "balanced",
          noRoute: true,
          settings: read("settings", DEFAULT_SETTINGS),
        }),
        signal: controller.signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "مقدرتش أغيّر الرد دلوقتي. جرّب تاني.");
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        patch({ content: text });
      }
      if (!text.trim()) throw new Error("ما وصلش رد. جرّب تاني.");
    } catch (e) {
      patch({ content: orig, orig: undefined, variant: undefined });
      if (e.name !== "AbortError") toast(e.message || "الاتصال اتقطع.");
    } finally {
      setBusy(false);
      abortRef.current = null;
    }
  }

  function restore(i) {
    setMessages((list) => list.map((x, k) => (k === i && x.orig ? { ...x, content: x.orig, orig: undefined, variant: undefined, verify: undefined } : x)));
  }

  // «اتأكد من المعلومة»: بحث على النت + موديل تاني بيراجع الرد
  async function verify(i) {
    const m = messages[i];
    const q = [...messages.slice(0, i)].reverse().find((x) => x.role === "user");
    if (!m || !q || m.verify?.status === "loading") return;
    const set = (v) => setMessages((list) => list.map((x, k) => (k === i ? { ...x, verify: v } : x)));
    set({ status: "loading" });
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q.content, answer: m.content }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(d.error || "مقدرتش أراجع الرد دلوقتي.");
      set({ status: "done", ...d });
    } catch (e) {
      set({ status: "error", error: e.message || "الاتصال اتقطع." });
    }
  }

  // «صورة للإجابة»: آخر رد (أو رد معيّن) كصورة PNG للحفظ أو المشاركة
  async function answerImage(i) {
    const idx = typeof i === "number" ? i : messages.map((m) => m.role).lastIndexOf("assistant");
    const m = messages[idx];
    const q = [...messages.slice(0, idx)].reverse().find((x) => x.role === "user");
    setSheet("");
    if (!m?.content || !q) return toast("لسه مفيش إجابة أعملها صورة");
    try {
      toast("بجهّز الصورة…");
      const blob = await answerToPng({ question: q.content, answer: splitDiscuss(m.content).body });
      const how = await shareOrDownload(blob);
      if (how === "downloaded") toast("الصورة اتنزلت على جهازك");
    } catch {
      toast("مقدرتش أعمل الصورة على الجهاز ده");
    }
  }

  function pickMode(k) {
    setModelKey(k);
    setBotKey("");
    setNeedPro(false);
    setSheet("");
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
    if (enterSends(e)) {
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
        {barStart && (
          <div className={s.bar}>
            <div className={s.barStart}>{barStart}</div>
          </div>
        )}

        {/* «شات جديد»: ثابت فوق على الجنب طول ما فيه محادثة، وبيسأل قبل ما يمسح */}
        {!empty && (
          <button type="button" className={s.newChatFab} onClick={() => setConfirmNew(true)}>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
            شات جديد
          </button>
        )}
        {confirmNew && (
          <div className={s.confirmScrim} onClick={() => setConfirmNew(false)}>
            <div className={s.confirmBox} role="alertdialog" aria-modal="true" aria-labelledby="new-chat-q" onClick={(e) => e.stopPropagation()}>
              <b id="new-chat-q">تبدأ شات جديد؟</b>
              <p>المحادثة اللي على الشاشة هتتقفل وهتبدأ من الأول.</p>
              <div>
                <button type="button" className={s.confirmNo} onClick={() => setConfirmNew(false)}>لأ، كمّل</button>
                <button type="button" className={s.confirmYes} onClick={() => { setConfirmNew(false); newChat(); }} autoFocus>أيوه، شات جديد</button>
              </div>
            </div>
          </div>
        )}

        {empty ? (
          hero ? (
            <section className={s.projectHero}>{typeof hero === "function" ? hero({ send, addFiles: attach.addFiles, reading }) : hero}</section>
          ) : (
            <section className={`${s.hero} ${(focus || input.trim()) && !docs.length ? s.typingMode : ""}`}>
              {bot ? (
                <div className={s.botHero}><BotIcon bot={bot} size={58} /></div>
              ) : (
                <div className={s.spark}><StarMark size={30} /></div>
              )}
              <h1>{docs.length ? (docs.length > 1 ? `${nFiles(docs.length)} ${docs.length === 2 ? "جاهزين" : "جاهزة"}` : "الملف جاهز") : bot ? <>بتتكلم مع <bdi>{bot.name}</bdi></> : "عايز تعمل إيه النهارده؟"}</h1>
              <p>
                {docs.length
                  ? "اسأل أي سؤال عن الملف، أو اختار أمر جاهز:"
                  : "اسأل بالعربي، أو ارفع ملف، أو فعّل البحث."}
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
              {showcase && !bot && !docs.length && <div className={s.showcase}>{showcase}</div>}
            </section>
          )
        ) : (
          <div className={s.thread} data-clarity-mask="True">
            {messages.map((m, i) => (
              <div key={i} id={`row-${i}`} className={`${m.role === "user" ? s.userRow : s.botRow} ${busy && i === messages.length - 1 && m.role !== "user" ? s.live : ""}`}>
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
                    {m.swappedTo && m.content && (
                      <div className={s.swapTag}>الموديل اللي اخترته مش متاح دلوقتي (غالباً محتاج رصيد)، فالرد ده من <bdi>{m.swappedTo}</bdi>.</div>
                    )}
                    {m.route && m.content && (
                      <div className={s.routeTag}>{m.route === "web" ? "دوّرت على الإنترنت لأن سؤالك عن معلومة" : m.route === "opts" ? "دوّرت على الإنترنت عشان المصادر والصور اللي طلبتها" : "جاوبتك بموديل البرمجة"}</div>
                    )}
                    {m.fromDocs && m.content && (
                      <div className={s.docTag}><ClipIcon /><span>الرد من ملفاتك</span></div>
                    )}
                    {m.content ? (
                      <div className={s.md} id={`msg-${i}`}>
                        <Md>{splitDiscuss(m.content).body}</Md>
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

                    {m.content && !(busy && i === messages.length - 1) && splitDiscuss(m.content).questions.length > 0 && (
                      <div className={s.discuss}>
                        <span>أسئلة تكمّل بيها:</span>
                        {splitDiscuss(m.content).questions.map((q) => (
                          <button key={q} type="button" onClick={() => send(q)} disabled={busy}>{q}</button>
                        ))}
                      </div>
                    )}
                    {m.verify && <VerifyPanel v={m.verify} />}

                    {m.images?.length > 0 && (
                      <div className={s.imagesWrap}>
                        <span className={s.imagesTitle}>صور توضيحية</span>
                        <div className={s.images} aria-label="صور توضيحية">
                          {m.images.map((im) => (
                            <a key={im.s} href={im.h} target="_blank" rel="noopener noreferrer nofollow" className={s.imgCard} title={im.a || ""}>
                              <img src={im.s} alt={im.a || ""} loading="lazy" referrerPolicy="no-referrer" onError={(e) => { e.currentTarget.closest("a").style.display = "none"; }} />
                              {(im.a || im.src) && <span className={s.imgCap}><b dir="auto">{im.a}</b>{im.src && <small>{im.src}</small>}</span>}
                            </a>
                          ))}
                        </div>
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
                        <button className={s.ghost} onClick={() => verify(i)} disabled={m.verify?.status === "loading"}>اتأكد من المعلومة</button>
                        <button className={`${s.ghost} ${rewriteOpen === i ? s.ghostOn : ""}`} onClick={() => setRewriteOpen(rewriteOpen === i ? -1 : i)} aria-expanded={rewriteOpen === i}>غيّر الرد</button>
                        {m.orig && <button className={s.ghost} onClick={() => restore(i)}>رجّع الأصلي</button>}
                        <button className={s.ghost} onClick={() => answerImage(i)}>صورة</button>
                        {i === messages.length - 1 && <button className={s.ghost} onClick={retry}>إعادة المحاولة</button>}
                        <ShareBar
                          compact
                          text={shareText(m)}
                          title="محادثة"
                          getHtml={() => document.getElementById(`msg-${i}`)?.innerHTML || ""}
                        />
                      </div>
                    )}
                    {rewriteOpen === i && !busy && (
                      <div className={s.rewriteRow}>
                        {Object.entries(REWRITE).map(([k, [label]]) => (
                          <button key={k} type="button" onClick={() => rewrite(i, k)} aria-pressed={m.variant === k}>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}

            {!busy && suggestions.length > 0 && (
              <div className={s.suggest}>
                <span className={s.suggestTitle}>أدوات ممكن تفيدك:</span>
                {suggestions.map((t) => (
                  <Link key={t.id} href={`/tool/${t.id}?q=${encodeURIComponent(lastUser.content.slice(0, 1500))}`} className={s.toolChip} title={t.desc}>
                    {t.name}
                  </Link>
                ))}
              </div>
            )}
            {error && <div className={s.error} role="alert">{error}</div>}
            <div ref={endRef} />
          </div>
        )}

        <div className={s.composerWrap}>
          {(sheet || optsOpen) && <div className={s.sheetScrim} onClick={() => { setSheet(""); setOptsOpen(false); }} aria-hidden="true" />}

          {optsOpen && (
            <section id="answer-opts" className={`${s.sheet} ${s.optsSheet}`} aria-label="خيارات الإجابة">
              <div className={s.sheetHead}>
                <b>خيارات الإجابة</b>
                <button type="button" className={s.sheetX} onClick={() => setOptsOpen(false)} aria-label="إغلاق">✕</button>
              </div>
              <span className={s.optsLabel}>الإجابة لمين؟</span>
              <div className={s.levelSeg} role="radiogroup" aria-label="الإجابة لمين؟">
                {LEVELS.map(([k, label]) => (
                  <button key={k} type="button" role="radio" aria-checked={opts.level === k} onClick={() => setOpts({ ...DEFAULT_OPTS, ...opts, level: k, ...(k === "researcher" ? { refs: true, sources: true } : {}) })}>
                    {label}
                  </button>
                ))}
              </div>
              <span className={s.optsLabel}>ضيف للإجابة</span>
              <div className={s.switches}>
                {EXTRAS.map(([k, label, hint]) => (
                  <label key={k} className={s.switchRow}>
                    <span><b>{label}</b><small>{hint}</small></span>
                    <input type="checkbox" role="switch" checked={!!opts[k]} onChange={(e) => setOpts({ ...DEFAULT_OPTS, ...opts, [k]: e.target.checked })} />
                    <i aria-hidden="true" />
                  </label>
                ))}
              </div>
              <div className={s.sheetFoot}>
                {nOpts > 0 ? <button type="button" className={s.linkBtn} onClick={() => setOpts(DEFAULT_OPTS)}>رجّع الافتراضي</button> : <span />}
                <button type="button" className={s.doneBtn} onClick={() => setOptsOpen(false)}>تمام</button>
              </div>
            </section>
          )}

          {sheet === "plus" && (
            <section className={s.sheet} aria-label="إضافات">
              <div className={s.sheetHead}><b>ضيف لرسالتك</b><button type="button" className={s.sheetX} onClick={() => setSheet("")} aria-label="إغلاق">✕</button></div>
              <div className={s.plusGrid}>
                <button type="button" className={s.plusTile} onClick={() => { setSheet(""); fileRef.current?.click(); }} disabled={reading}>
                  <i aria-hidden="true"><ClipIcon /></i><b>ملف أو صورة</b><small>PDF، Word، صورة</small>
                </button>
                {brand?.name ? (
                  <button type="button" className={`${s.plusTile} ${useBrand ? s.plusOn : ""}`} onClick={() => { setUseBrand(!useBrand); setSheet(""); toast(useBrand ? "الردود مش هتاخد نشاطك في الاعتبار" : `الردود هتتظبط على «${brand.name}»`); }} aria-pressed={!!useBrand}>
                    <i aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5l1.4-4h13.2l1.4 4M4 9.5h16v1a2.7 2.7 0 01-5.3.6 2.7 2.7 0 01-5.4 0A2.7 2.7 0 014 10.5zM5.5 12.5V19.5h13v-7" /></svg></i>
                    <b>هوية نشاطي</b><small dir="auto">{useBrand ? brand.name : "مقفولة"}</small>
                  </button>
                ) : (
                  <Link href="/brand" className={s.plusTile} onClick={() => setSheet("")}>
                    <i aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 9.5l1.4-4h13.2l1.4 4M4 9.5h16v1a2.7 2.7 0 01-5.3.6 2.7 2.7 0 01-5.4 0A2.7 2.7 0 014 10.5zM5.5 12.5V19.5h13v-7" /></svg></i>
                    <b>هوية نشاطي</b><small>الردود على قد شغلك</small>
                  </Link>
                )}
                <button type="button" className={s.plusTile} onClick={() => { setSheet(""); proof.run(); }} disabled={proof.busy || !input.trim()}>
                  <i aria-hidden="true"><ProofIcon /></i><b>تدقيق لغوي</b><small>صحّح رسالتك</small>
                </button>
                <button type="button" className={s.plusTile} onClick={() => answerImage()} disabled={busy || !messages.some((m) => m.role === "assistant" && m.content)}>
                  <i aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="3" /><circle cx="9" cy="10" r="1.6" /><path d="M20.5 15l-4.5-4.5L7 19" /></svg></i>
                  <b>صورة للإجابة</b><small>احفظها أو شاركها</small>
                </button>
                <Link href={lastUser ? `/compare?q=${encodeURIComponent(lastUser.content.slice(0, 500))}` : "/compare"} className={s.plusTile} onClick={() => setSheet("")}>
                  <i aria-hidden="true"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round"><rect x="3.5" y="4.5" width="7" height="15" rx="2" /><rect x="13.5" y="4.5" width="7" height="15" rx="2" /></svg></i>
                  <b>قارن الموديلات</b><small>نفس السؤال لأكتر من موديل</small>
                </Link>
              </div>
            </section>
          )}

          {sheet === "models" && (
            <section className={s.sheet} aria-label="الموديل اللي بيجاوب">
              <div className={s.sheetHead}><b>الإجابة من أنهي موديل؟</b><button type="button" className={s.sheetX} onClick={() => setSheet("")} aria-label="إغلاق">✕</button></div>
              <div className={s.modeGrid}>
                <button type="button" className={`${s.modeTile} ${!bot && model.fusion ? s.modeOn : ""}`} onClick={() => pickMode("fusion")} aria-pressed={!bot && !!model.fusion}>
                  <i aria-hidden="true">✨</i>
                  <b>دمج النماذج</b><small>4 نماذج في رد واحد أدق</small>
                </button>
                {picks.map((b) => (
                  <button key={b.key} type="button" className={`${s.modeTile} ${bot?.key === b.key ? s.modeOn : ""}`} onClick={() => { setBotKey(b.key); setNeedPro(false); setSheet(""); }} aria-pressed={bot?.key === b.key}>
                    <i aria-hidden="true"><BotIcon bot={b} size={26} /></i>
                    <b dir="auto">{b.name}</b><small>{b.maker}</small>
                  </button>
                ))}
              </div>
              <button type="button" className={s.allModels} onClick={() => { setSheet(""); setSideOpen(true); }}>
                كل الموديلات ←
              </button>
            </section>
          )}

          <div className={s.composerBox}>
          <div className={s.fabRow}>
          <button
            type="button"
            className={`${s.webFab} ${web ? s.webFabOn : ""}`}
            onClick={toggleWeb}
            aria-pressed={!!web}
            title={web ? "البحث على الإنترنت مفعّل (دوس تقفله)" : "بحث على الإنترنت"}
            aria-label="بحث على الإنترنت"
          >
            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" /></svg>
          </button>
          <button
            type="button"
            className={`${s.optsFab} ${nOpts ? s.optsFabOn : ""}`}
            onClick={() => { setSheet(""); setOptsOpen((o) => !o); }}
            aria-expanded={optsOpen}
            aria-controls="answer-opts"
            title="خيارات الإجابة"
            aria-label={`خيارات الإجابة${nOpts ? ` (${nOpts} مفعّلة)` : ""}`}
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
            {nOpts ? <b>{nOpts}</b> : null}
          </button>
          </div>
          {!empty && !busy && fresh.length > 0 && (
            <div className={s.quickRow}>
              {docActions.map((a) => (
                <button key={a.label} type="button" onClick={() => send(a.q)} disabled={reading}>{a.label}</button>
              ))}
            </div>
          )}
          <div className={`${s.composer} ${!empty && !focus && !sheet && !optsOpen && !input.trim() && !docs.length && !attach.pending.length && !attach.note ? s.compact : ""} ${focus ? s.typingBox : ""}`}>
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
              onFocus={() => { clearTimeout(blurTimer.current); setFocus(true); document.body.classList.add("chat-typing"); }}
              // التصغير بيستنى شوية بعد ما الخانة تفقد التركيز: لو اللمسة كانت على زرار جوه الخانة (+ أو الموديل)
              // الشكل ما يتغيرش تحت إيد المستخدم قبل ما الزرار يستلم اللمسة
              onBlur={() => {
                clearTimeout(blurTimer.current);
                blurTimer.current = setTimeout(() => {
                  if (document.activeElement === boxRef.current) return;
                  setFocus(false);
                  document.body.classList.remove("chat-typing");
                }, 350);
              }}
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
              <button type="button" className={`${s.plusBtn} ${sheet === "plus" ? s.plusBtnOn : ""}`} onClick={() => { setOptsOpen(false); setSheet(sheet === "plus" ? "" : "plus"); }} aria-expanded={sheet === "plus"} aria-label="إضافات: ملف، بحث، تدقيق، صورة للإجابة">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
              </button>
              <button type="button" className={s.modeChip} onClick={() => { setOptsOpen(false); setSheet(sheet === "models" ? "" : "models"); }} aria-expanded={sheet === "models"} title="الموديل اللي بيجاوب">
                {bot ? <BotIcon bot={bot} size={16} /> : model.fusion ? <FusionStack size={12} /> : <span aria-hidden="true">{model.icon}</span>}
                <span dir="auto">{bot ? bot.name : model.fusion ? "دمج النماذج" : model.name}</span>
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              <span className={s.grow} />
              {busy ? (
                <button className={s.send} onClick={stop} aria-label="إيقاف">■</button>
              ) : (
                <button className={s.send} onClick={() => send()} disabled={!input.trim() || reading} aria-label="إرسال">↑</button>
              )}
            </div>
          </div>
          </div>
          {proof.undo !== null && (
            <div className={s.undoNote}>
              اتصلّحت الأخطاء في رسالتك.
              <button type="button" onClick={proof.revert}>تراجع</button>
              <button type="button" onClick={proof.dismiss} aria-label="إخفاء">✕</button>
            </div>
          )}
          {empty && <div className={s.note}>
            «{bot ? bot.name : model.name}»{web ? " • بحث على الإنترنت" : ""}{docs.length ? ` • ${nFiles(docs.length)}` : ""}{inProject && project.instructions ? " • تعليمات المشروع" : ""}{st.voice !== "auto" || st.depth !== "auto" ? " • إعداداتك مفعّلة" : ""} — الردود من ذكاء اصطناعي وممكن يكون فيها أخطاء، راجع المهم منها.
          </div>}
        </div>
      </div>
    </div>
  );
}
