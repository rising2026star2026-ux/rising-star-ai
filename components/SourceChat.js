"use client";
// الشات المتخصص: حوار زي الشات العادي، بس كل رد مبني على مصادر الباحث (مكتبات أكاديمية أو بحث السوق ودراسة الجدوى)
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Md from "./Md";
import { read, write } from "@/lib/store";
import { enterSends } from "@/lib/keys";
import { runAll, sensitivity, factsText } from "@/lib/feasibility";
import { fieldText } from "./FieldData";
import { factsText as reFacts, installmentPlan, compareOptions, rentalYield, transferCosts } from "@/lib/realestate";
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
  realestate: {
    title: "الشات العقاري",
    sub: "اسأل عن منطقة أو وحدة أو عقد. كل رد بيدوّر في سوق العقارات المصري ويعتمد على أرقام تقريرك.",
    back: { href: "/realestate", label: "الباحث العقاري" },
    store: "srcchat-realestate",
    placeholder: "اسأل عن منطقة أو سعر أو عقد…",
    suggestions: [
      "السعر ده مناسب للمنطقة ولا مبالغ فيه؟",
      "أدفع كاش بخصم ولا أقسّط على 8 سنين؟",
      "إيه الأوراق اللي لازم أطلبها قبل ما أدفع المقدم؟",
      "إزاي أتفاوض مع المطوّر على السعر أو نظام السداد؟",
    ],
    tasks: [
      { t: "قيّم السعر", d: "هل السعر في حدود المنطقة؟ مقارنة بأسعار منشورة.", q: "السعر ده مناسب للمنطقة ولا مبالغ فيه؟ قارنه بالأسعار المنشورة وقولي حدود السعر العادل." },
      { t: "قارن طرق الدفع", d: "كاش بخصم أو تقسيط أو إيجار، بقيمة فلوس النهارده.", q: "أدفع كاش بخصم ولا أقسّط على 8 سنين؟ احسبها بقيمة فلوس النهارده." },
      { t: "افحص قبل ما تدفع", d: "الأوراق والتراخيص المطلوبة قبل المقدم.", q: "إيه الأوراق والتراخيص اللي لازم أطلبها وأتأكد منها قبل ما أدفع المقدم؟" },
      { t: "جهّز التفاوض", d: "نقاط الضغط على السعر ونظام السداد.", q: "إزاي أتفاوض مع المطوّر على السعر أو نظام السداد؟ إيه النقط اللي أضغط عليها؟" },
    ],
  },
};

/** [3] في الرد تتحول لرابط على المصدر رقم 3 في الأسفل */
const linkCites = (t) => String(t || "").replace(/\[(\d{1,2})\](?!\()/g, "[$1](#src-$1)");

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
  if (mode === "realestate") {
    const last = read("realestate-last", null);
    if (!last?.data?.market) return null;
    try {
      const d = last.data, m = d.market, i = last.inp || {};
      const sale = d.form.mode === "sale";
      const calc = i.price ? {
        price: Number(i.price) || 0,
        plan: sale ? installmentPlan({ price: i.price, downPct: i.downPct, years: i.years, perYear: i.perYear, maintenancePct: i.maintenancePct, deliveryYears: i.deliveryYears, inflation: i.inflation }) : null,
        compare: sale ? compareOptions({ price: i.price, cashDiscountPct: i.cashDiscountPct, plan: { downPct: i.downPct, years: i.years, perYear: i.perYear }, rentMonthly: i.rentMonthly, appreciation: i.appreciation, inflation: i.inflation, horizon: i.horizon }) : null,
        yield: sale && i.rentMonthly ? rentalYield({ price: i.price, rentMonthly: i.rentMonthly, vacancyMonths: i.vacancyMonths }) : null,
        costs: sale ? transferCosts({ price: i.price }) : null,
      } : null;
      const where = [d.form.district, d.form.city].filter(Boolean).join("، ");
      return {
        label: where || "بحثك العقاري",
        count: (d.sources || []).length,
        study: { facts: reFacts(d.form, m, calc), summary: m.summary || "", where, sources: (d.sources || []).map(({ title, url, snippet }) => ({ title, url, snippet })) },
      };
    } catch {
      return null;
    }
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
          <li key={x.n} value={x.n} id={`src-${x.n}`}>
            {x.u ? <a href={x.u} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{x.t}</a> : <span dir="auto">{x.t}</span>}
            <small dir="auto">{[x.a, x.y, x.l || x.d].filter(Boolean).join(" · ")}</small>
          </li>
        ))}
      </ol>
    </div>
  );
}

// شريط الأسعار المحسوبة من إعلانات عقار ماب وProperty Finder (أرقام من الكود، مش من الموديل)
const egp = (v) => Math.round(v).toLocaleString("en");
function MarketLine({ market }) {
  if (!market || !market.listings) return null;
  const rows = [
    market.ppm && ["سعر المتر", market.ppm],
    market.price && ["سعر الوحدة", market.price],
    market.rent && ["الإيجار الشهري", market.rent],
  ].filter(Boolean);
  if (!rows.length) return <p className={s.searchNote}>لقينا {market.listings} إعلان، بس الأسعار مش ظاهرة في نتايج البحث. افتح روابط الإعلانات في المصادر.</p>;
  return (
    <div className={s.market}>
      <b>من {market.listings} إعلان على عقار ماب وProperty Finder</b>
      <dl>
        {rows.map(([label, st]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd dir="ltr">{egp(st.low)} – {egp(st.high)} ج</dd>
            <small>الوسيط {egp(st.mid)} • {st.n} إعلان</small>
          </div>
        ))}
      </dl>
      <small>أسعار معروضة في الإعلانات، والسعر النهائي بيتحدد بالتفاوض والمعاينة.</small>
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
      let market = null;
      try { market = JSON.parse(decodeURIComponent(res.headers.get("x-market") || "null")); } catch { market = null; }
      patch({ sources, search: res.headers.get("x-search") || "", market });
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
    if (!ctx) return mode === "academic" ? "مفيش بحث مفتوح، فهدوّر في المكتبات لكل سؤال." : mode === "realestate" ? "مفيش بحث عقاري مفتوح، فهدوّر في السوق لكل سؤال." : "مفيش دراسة مفتوحة، فهدوّر في السوق لكل سؤال.";
    return null;
  }, [ctx, mode]);

  return (
    <div className={`${s.wrap} ${mode === "realestate" ? s.re : ""}`}>
      <header className={s.top}>
        <div>
          <h1 className={s.title}>{mode === "realestate" ? "المستشار العقاري" : M.title}</h1>
          <p className={s.sub}>{mode === "realestate" ? "رأي محايد مبني على أسعار منشورة وحسابات دقيقة. كل رقم ليه مصدر أو معادلة." : M.sub}</p>
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
            {M.tasks ? (
              <>
                <p>تحب نبدأ بإيه؟</p>
                <div className={s.tasks}>
                  {M.tasks.map((x) => (
                    <button key={x.t} type="button" onClick={() => send(x.q)}>
                      <b>{x.t}</b>
                      <span>{x.d}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p>ابدأ بسؤال، أو اختار واحد من دول:</p>
                <div className={s.suggest}>
                  {M.suggestions.map((q) => <button key={q} type="button" onClick={() => send(q)}>{q}</button>)}
                </div>
              </>
            )}
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? s.user : s.bot} data-clarity-mask="True">
            {m.role === "user" ? (
              <p dir="auto">{m.content}</p>
            ) : m.pending && !m.content ? (
              <p className={s.wait}><span className={s.spin} aria-hidden="true" /> {mode === "academic" ? "بدوّر في المكتبات…" : mode === "realestate" ? "بدوّر في سوق العقارات وبحسب…" : "بدوّر في السوق…"}</p>
            ) : (
              <>
                <div className={`md ${s.md}`} dir="auto"><Md>{linkCites(m.content)}</Md></div>
                {!m.pending && mode === "realestate" && <MarketLine market={m.market} />}
                {!m.pending && mode === "realestate" && m.search === "empty" && <p className={s.searchNote}>بحث السوق ما رجّعش نتايج للسؤال ده، فالرد من معرفة عامة ومن غير أرقام موثّقة.</p>}
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
