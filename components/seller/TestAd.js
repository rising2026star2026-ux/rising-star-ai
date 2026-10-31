"use client";
// «جرّب إعلانك على 100 زبون قبل ما تصرف جنيه»
// الإعلان بيتعرض على 10 شخصيات مصرية (كل شخصية شريحة من 100)، التعليقات بتظهر واحدة ورا التانية زي فيسبوك،
// وبعدها الدرجة وشبكة الـ100 زبون واللي هيطلب واللي عدّى، والاعتراضات والتعديلات ونسخة محسّنة تتختبر تاني.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { PLATFORMS, AUDIENCE_LABELS, SCORE_LABELS, VERDICT_LABELS, REACTION_EMOJI, HANDOFF_KEY } from "@/lib/testad";
import { fileToDataUrl, copyText, shareOrDownload, loadFonts } from "@/lib/imagefile";
import { toast } from "@/lib/store";
import { storyCanvas, night, star, text as drawText, rr, wrap, brandFooter, toBlob } from "@/lib/sharecard";
import s from "./seller.module.css";
import t from "./testad.module.css";

const EXAMPLE = "فرصة مش هتتكرر 😍 طقم حلل جرانيت تركي 10 قطع، ألوان تحفة ومش بيلزق خالص. الكمية محدودة! كلمينا خاص";
const PLATFORM_ICON = { facebook: "f", instagram: "◎", tiktok: "♪", whatsapp: "✆" };

const tierOf = (n) =>
  n >= 80 ? { label: "إعلان قوي جداً", color: "#12b76a", key: "great" }
  : n >= 60 ? { label: "كويس، ومحتاج لمسات", color: "#1f4dff", key: "good" }
  : n >= 40 ? { label: "متوسط، هتخسر زباين", color: "#f79009", key: "mid" }
  : { label: "محتاج شغل قبل ما تدفع فيه", color: "#f04438", key: "weak" };

const VERDICT_COLOR = { buy: "#12b76a", maybe: "#f5a524", skip: "#c5cad3" };

function hashColor(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hues = [12, 28, 200, 220, 262, 290, 330, 160, 45, 185];
  return `hsl(${hues[h % hues.length]} 70% 46%)`;
}
const initial = (name) => (name.replace(/^(أم|أبو|ام|ابو|مستر|مدام|الحاج|الحاجة|د\.?)\s+/, "").trim()[0] || name[0] || "؟");

/** ترتيب الشبكة: اللي هيطلبوا الأول، وبعدهم اللي بيفكروا، وبعدهم اللي عدّوا */
function hundredDots(tally) {
  return [...Array(tally.buy).fill("buy"), ...Array(tally.maybe).fill("maybe"), ...Array(tally.skip).fill("skip")].slice(0, 100);
}

export default function TestAd() {
  const [platform, setPlatform] = useState("facebook");
  const [audience, setAudience] = useState("all");
  const [text, setText] = useState("");
  const [extra, setExtra] = useState("");
  const [image, setImage] = useState(""); // data URL
  const [stage, setStage] = useState("form"); // form | running | result
  const [error, setError] = useState("");
  const [res, setRes] = useState(null);
  const [prev, setPrev] = useState(null); // نتيجة الاختبار اللي قبله (للمقارنة)
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const ctl = useRef(null);
  const topRef = useRef(null);
  const timers = useRef([]);

  // إعلان جاي من أداة تانية في الموقع
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(HANDOFF_KEY);
      if (raw) {
        const h = JSON.parse(raw);
        if (h.text) setText(String(h.text).slice(0, 2500));
        if (h.image) setImage(h.image);
        sessionStorage.removeItem(HANDOFF_KEY);
      }
    } catch {}
    return () => { timers.current.forEach(clearTimeout); ctl.current?.abort(); };
  }, []);

  async function onImage(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { setImage(await fileToDataUrl(f, 1024, 0.85)); } catch (er) { setError(er.message); }
  }

  async function run(adText = text, compareWith = null) {
    if (adText.trim().length < 8) { setError("اكتب نص الإعلان الأول (جملة واحدة على الأقل)."); return; }
    setError("");
    timers.current.forEach(clearTimeout); timers.current = [];
    setShown(0); setRevealed(false); setTyping(false);
    setStage("running");
    setPrev(compareWith);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    ctl.current = new AbortController();
    try {
      const r = await fetch("/api/test-ad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: adText, extra, image, platform, audience }),
        signal: ctl.current.signal,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      setRes({ ...j, adText });
      setStage("result");
      revealComments(j.personas.length);
    } catch (e) {
      if (e?.name === "AbortError") return;
      setError(e.message);
      setStage("form");
    }
  }

  // التعليقات بتظهر واحدة ورا التانية، وقبل كل واحدة «بيكتب...»
  function revealComments(n) {
    let at = 700;
    for (let i = 0; i < n; i++) {
      timers.current.push(setTimeout(() => setTyping(true), at));
      at += 650 + Math.random() * 350;
      timers.current.push(setTimeout(() => { setTyping(false); setShown(i + 1); }, at));
      at += 220;
    }
    timers.current.push(setTimeout(() => setRevealed(true), at + 300));
  }

  function skip() {
    timers.current.forEach(clearTimeout); timers.current = [];
    setTyping(false);
    setShown(res?.personas.length || 0);
    setRevealed(true);
  }

  function retestRewrite(draft) {
    const before = { score: res.score, tally: res.tally };
    setText(draft);
    run(draft, before);
  }

  function reset() {
    timers.current.forEach(clearTimeout); timers.current = [];
    setStage("form"); setRes(null); setPrev(null);
    requestAnimationFrame(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }

  return (
    <div className={s.body} ref={topRef}>
      {stage === "form" && (
        <section className={s.card} aria-labelledby="ta-h">
          <h2 id="ta-h">إعلانك هيتنشر فين؟</h2>
          <div className={`${s.chips} ${t.platforms}`} role="group" aria-label="المنصة">
            {Object.entries(PLATFORMS).map(([k, v]) => (
              <button key={k} type="button" className={s.chip} aria-pressed={platform === k} onClick={() => setPlatform(k)}>
                <span className={`${t.pIcon} ${t["p_" + k]}`} aria-hidden="true">{PLATFORM_ICON[k]}</span>{v}
              </button>
            ))}
          </div>

          <div className={s.field} style={{ marginTop: 18 }}>
            <label className={s.label} htmlFor="ta-text">
              <span>نص الإعلان أو البوست</span>
              <button type="button" className={s.miniBtn} onClick={() => setText(EXAMPLE)}>جرّب بمثال</button>
            </label>
            <textarea id="ta-text" className={s.textarea} value={text} maxLength={2500} onChange={(e) => setText(e.target.value)}
              placeholder="الصق الإعلان زي ما هتنشره بالظبط، بالإيموجي والسعر ورقم الطلب..." />
            <div className={t.count}>{text.length} / 2500</div>
          </div>

          <div className={s.field}>
            <span className={s.label}><span>صورة الإعلان</span><small>اختياري، بس بتفرق جداً في النتيجة</small></span>
            <label className={s.upload}>
              <input type="file" accept="image/*" onChange={onImage} aria-label="ارفع صورة الإعلان" />
              {image ? <img src={image} alt="" /> : (
                <span className={s.uploadIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.7" /><path d="M20.5 16l-5-4.5L8 19" /></svg>
                </span>
              )}
              <span><b>{image ? "الصورة جاهزة" : "ارفع صورة المنتج أو التصميم"}</b><small>{image ? "اضغط عشان تغيّرها" : "JPG أو PNG من موبايلك"}</small></span>
              {image && <button type="button" className={s.uploadX} onClick={(e) => { e.preventDefault(); setImage(""); }} aria-label="شيل الصورة">×</button>}
            </label>
          </div>

          <div className={s.field}>
            <span className={s.label}><span>مين جمهورك؟</span></span>
            <div className={s.chips} role="group" aria-label="الجمهور">
              {Object.entries(AUDIENCE_LABELS).map(([k, v]) => (
                <button key={k} type="button" className={s.chip} aria-pressed={audience === k} onClick={() => setAudience(k)}>{v}</button>
              ))}
            </div>
          </div>

          <div className={s.field}>
            <label className={s.label} htmlFor="ta-extra"><span>معلومة مش مكتوبة في الإعلان</span><small>اختياري</small></label>
            <input id="ta-extra" className={s.input} value={extra} maxLength={400} onChange={(e) => setExtra(e.target.value)} placeholder="مثلاً: السعر 1850 جنيه، والمحل في المنصورة" />
          </div>

          <button type="button" className={s.cta} onClick={() => run()} disabled={text.trim().length < 8}>
            <span className={t.ctaDots} aria-hidden="true"><i /><i /><i /></span>
            اعرض إعلاني على 100 زبون
          </button>
          <p className={s.ctaNote}>النتيجة بتطلع في أقل من نص دقيقة، ومحدش غيرك بيشوفها.</p>
          {error && <p className={s.err} role="alert">{error}</p>}
        </section>
      )}

      {stage === "running" && <Running platform={PLATFORMS[platform]} hasImage={!!image} onCancel={() => { ctl.current?.abort(); setStage("form"); }} />}

      {stage === "result" && res && (
        <>
          <PostMock res={res} image={image} platform={platform} shown={shown} typing={typing} onSkip={skip} done={revealed} />
          {revealed && (
            <>
              <ScorePanel res={res} prev={prev} />
              <Insights res={res} />
              <Rewrite res={res} onRetest={retestRewrite} />
              <ShareRow res={res} onReset={reset} />
            </>
          )}
        </>
      )}
    </div>
  );
}

/* ============ الانتظار: 100 زبون بيتجمعوا ============ */
function Running({ platform, hasImage, onCancel }) {
  const lines = useMemo(() => [
    ...(hasImage ? ["بنبص على صورة الإعلان بعين الزبون…"] : []),
    "بنجمع 100 زبون من محافظات مختلفة…",
    `الزباين بيقلّبوا في ${platform} ووقفوا عند إعلانك…`,
    "فيه ناس بتدوّر على السعر… وفيه ناس عدّت 👀",
    "التعليقات بتتكتب دلوقتي…",
    "بنعدّ مين هيطلب ومين لأ…",
  ], [platform, hasImage]);
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((x) => Math.min(x + 1, lines.length - 1)), 2400);
    return () => clearInterval(id);
  }, [lines.length]);
  return (
    <section className={`${s.card} ${t.running}`} aria-live="polite" aria-busy="true">
      <div className={t.crowd} aria-hidden="true">
        {Array.from({ length: 100 }, (_, k) => <i key={k} style={{ animationDelay: `${(k % 10) * 90 + Math.floor(k / 10) * 40}ms` }} />)}
      </div>
      <p className={t.runLine} key={i}>{lines[i]}</p>
      <button type="button" className={s.miniBtn} onClick={onCancel}>إلغاء</button>
    </section>
  );
}

/* ============ البوست زي فيسبوك + التعليقات ============ */
function PostMock({ res, image, platform, shown, typing, onSkip, done }) {
  const [more, setMore] = useState(false);
  const listRef = useRef(null);
  // التعليق الجديد يفضل قدام العين وهو بيظهر
  useEffect(() => {
    if (done) return;
    const last = listRef.current?.lastElementChild;
    if (!last) return;
    const r = last.getBoundingClientRect();
    if (r.bottom > window.innerHeight - 90) window.scrollBy({ top: r.bottom - window.innerHeight + 140, behavior: "smooth" });
  }, [shown, typing, done]);
  const reacts = Object.entries(res.reactions).filter(([k, v]) => k !== "none" && v > 0).sort((a, b) => b[1] - a[1]);
  const totalReacts = reacts.reduce((a, [, v]) => a + v, 0);
  const commenters = res.personas.length;
  const long = res.adText.length > 220;
  return (
    <section className={`${s.card} ${t.post}`} aria-label="إعلانك قدام الزباين">
      <div className={t.postHead}>
        <span className={t.pageAv} aria-hidden="true">م</span>
        <div className={t.postMeta}>
          <b>متجرك</b>
          <small>إعلان ممول · {PLATFORMS[platform]}</small>
        </div>
        <span className={t.live}><i />الزباين بيتفرجوا</span>
      </div>
      <p className={`${t.postText} ${long && !more ? t.clamp : ""}`} dir="auto">{res.adText}</p>
      {long && !more && <button type="button" className={t.more} onClick={() => setMore(true)}>عرض المزيد</button>}
      {image && <img className={t.postImg} src={image} alt="صورة الإعلان" />}

      <div className={t.reactBar}>
        <span className={t.reactIcons} aria-hidden="true">{reacts.slice(0, 3).map(([k]) => <i key={k}>{REACTION_EMOJI[k]}</i>)}</span>
        <span>{totalReacts} تفاعل من 100</span>
        <span className={t.reactRight}>{Math.min(shown, commenters)} تعليق</span>
      </div>

      <ol className={t.comments} aria-live="polite" ref={listRef}>
        {res.personas.slice(0, shown).map((p, i) => <Comment key={i} p={p} />)}
        {typing && (
          <li className={`${t.comment} ${t.typingRow}`} aria-label="حد بيكتب تعليق">
            <span className={t.av} style={{ background: "#d0d5dd" }} aria-hidden="true" />
            <span className={t.typing}><i /><i /><i /></span>
          </li>
        )}
      </ol>
      {!done && (
        <button type="button" className={t.skip} onClick={onSkip}>
          اعرض النتيجة على طول
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6" /></svg>
        </button>
      )}
    </section>
  );
}

function Comment({ p }) {
  const [open, setOpen] = useState(false);
  return (
    <li className={t.comment}>
      <span className={t.av} style={{ background: hashColor(p.name) }} aria-hidden="true">{initial(p.name)}</span>
      <div className={t.cBody}>
        <div className={t.bubble}>
          <b>{p.name}</b>
          <small>{[p.age ? `${p.age} سنة` : "", p.place, p.job].filter(Boolean).join(" · ")}</small>
          <p dir="auto">{p.comment}</p>
        </div>
        <div className={t.cFoot}>
          <span className={`${t.vTag} ${t["v_" + p.verdict]}`}>{VERDICT_LABELS[p.verdict]} · {p.count} من 100</span>
          {p.why && <button type="button" className={t.why} onClick={() => setOpen(!open)} aria-expanded={open}>{open ? "إخفاء" : "ليه؟"}</button>}
        </div>
        {open && <p className={t.whyText}>{p.why}</p>}
      </div>
    </li>
  );
}

/* ============ الدرجة وشبكة الـ100 ============ */
function useCountUp(target, ms = 1300) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf, start;
    const step = (ts) => {
      if (!start) start = ts;
      const k = Math.min(1, (ts - start) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - k, 3))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, ms]);
  return v;
}

function ScorePanel({ res, prev }) {
  const tier = tierOf(res.score);
  const n = useCountUp(res.score);
  const dots = useMemo(() => hundredDots(res.tally), [res.tally]);
  const [fill, setFill] = useState(false);
  useEffect(() => { const id = setTimeout(() => setFill(true), 80); return () => clearTimeout(id); }, []);
  const R = 54, C = 2 * Math.PI * R;
  const delta = prev ? res.score - prev.score : null;
  const box = useRef(null);
  useEffect(() => { box.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }, []);
  return (
    <section className={`${s.card} ${t.score}`} aria-labelledby="sc-h" ref={box}>
      <h2 id="sc-h" className={s.sr}>النتيجة</h2>
      <div className={t.scoreTop}>
        <div className={t.gauge} style={{ "--tc": tier.color }}>
          <svg viewBox="0 0 128 128" aria-hidden="true">
            <circle cx="64" cy="64" r={R} className={t.gTrack} />
            <circle cx="64" cy="64" r={R} className={t.gBar} style={{ strokeDasharray: C, strokeDashoffset: fill ? C * (1 - res.score / 100) : C }} />
          </svg>
          <div className={t.gNum}><b>{n}</b><small>من 100</small></div>
        </div>
        <div className={t.scoreText}>
          <span className={t.tier} style={{ background: tier.color }}>{tier.label}</span>
          {delta !== null && (
            <span className={`${t.delta} ${delta >= 0 ? t.up : t.down}`}>
              {delta >= 0 ? "▲" : "▼"} كان {prev.score} وبقى {res.score} ({delta >= 0 ? "+" : ""}{delta})
            </span>
          )}
          {res.verdict && <p className={t.verdict}>«{res.verdict}»</p>}
        </div>
      </div>

      <div className={t.hundredWrap}>
        <div className={t.hundred} role="img" aria-label={`من 100 زبون: ${res.tally.buy} هيطلبوا، ${res.tally.maybe} بيفكروا، ${res.tally.skip} عدّوا`}>
          {dots.map((v, i) => (
            <i key={i} style={{ background: fill ? VERDICT_COLOR[v] : "#eef0f3", transitionDelay: `${i * 14}ms` }} />
          ))}
        </div>
        <ul className={t.legend}>
          <li><i style={{ background: VERDICT_COLOR.buy }} /><b>{res.tally.buy}</b> هيطلبوا</li>
          <li><i style={{ background: VERDICT_COLOR.maybe }} /><b>{res.tally.maybe}</b> مهتمين بس بيفكروا</li>
          <li><i style={{ background: VERDICT_COLOR.skip }} /><b>{res.tally.skip}</b> عدّوا</li>
        </ul>
      </div>

      <div className={t.bars}>
        {Object.entries(SCORE_LABELS).map(([k, [label, hint]]) => {
          const v = res.scores[k];
          const c = v >= 8 ? "#12b76a" : v >= 6 ? "#1f4dff" : v >= 4 ? "#f79009" : "#f04438";
          return (
            <div key={k} className={t.bar}>
              <div className={t.barHead}><b>{label}</b><small>{hint}</small><span style={{ color: c }}>{v}/10</span></div>
              <div className={t.barTrack}><i style={{ width: fill ? `${v * 10}%` : 0, background: c }} /></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Insights({ res }) {
  return (
    <section className={s.card}>
      {res.objections.length > 0 && (
        <>
          <h3 className={s.sectionTitle}><i aria-hidden="true">🤔</i>ليه الناس مش بتطلب؟</h3>
          <ul className={t.objs}>
            {res.objections.map((o, i) => (
              <li key={i}>
                <span>{o.text}</span>
                <b>{o.share}%</b>
                <i style={{ width: `${o.share}%` }} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </>
      )}
      {res.fixes.length > 0 && (
        <>
          <h3 className={s.sectionTitle} style={{ marginTop: 22 }}><i aria-hidden="true">🛠️</i>عدّل الحاجات دي الأول</h3>
          <ol className={t.fixes}>{res.fixes.map((f, i) => <li key={i}>{f}</li>)}</ol>
        </>
      )}
      {res.photo?.length > 0 && (
        <>
          <h3 className={s.sectionTitle} style={{ marginTop: 22 }}><i aria-hidden="true">📸</i>عن الصورة</h3>
          <ul className={t.fixes}>{res.photo.map((f, i) => <li key={i}>{f}</li>)}</ul>
          <Link href="/photo-ad" className={t.inlineLink}>خلّي صورة منتجك شكل الاستوديو في «صوّرها بموبايلك» ←</Link>
        </>
      )}
    </section>
  );
}

function Rewrite({ res, onRetest }) {
  const [draft, setDraft] = useState(res.rewrite);
  const holes = (draft.match(/\[[^\]]{2,40}\]/g) || []).length;
  async function copy() { if (await copyText(draft)) toast("اتنسخ"); }
  return (
    <section className={`${s.card} ${t.rewrite}`}>
      <h3 className={s.sectionTitle}><i aria-hidden="true">✨</i>النسخة المحسّنة من إعلانك</h3>
      <p className={t.rwNote}>نفس معلوماتك من غير أي حاجة متألفة، وتقدر تعدّل فيها هنا على طول.</p>
      <textarea className={t.rwText} dir="auto" value={draft} onChange={(e) => setDraft(e.target.value)} rows={Math.min(14, draft.split("\n").length + 2)} aria-label="النسخة المحسّنة" />
      {holes > 0 && <p className={t.holes}>✍️ فيه {holes === 1 ? "معلومة ناقصة" : `${holes} معلومات ناقصة`} بين قوسين [ ]. اكتب مكانها الحقيقية قبل ما تختبر أو تنشر.</p>}
      <div className={t.rwActions}>
        <button type="button" className={`${s.cta} ${s.blue}`} onClick={() => onRetest(draft)} disabled={draft.trim().length < 8}>اختبر النسخة دي على 100 زبون تاني</button>
        <div className={t.rwRow}>
          <button type="button" className={s.miniBtn} onClick={copy}>نسخ النص</button>
          <a className={s.miniBtn} href={`https://wa.me/?text=${encodeURIComponent(draft.slice(0, 3500))}`} target="_blank" rel="noopener noreferrer">ابعته على واتساب</a>
        </div>
      </div>
    </section>
  );
}

/* ============ مشاركة النتيجة (صورة ستوري) ============ */
async function makeStory(res) {
  await loadFonts();
  const { c, ctx } = storyCanvas();
  const W = c.width, H = c.height;
  const tier = tierOf(res.score);
  night(ctx, W, H);
  drawText(ctx, "اختبرت إعلاني على", W / 2, 230, { size: 54, weight: 700, color: "rgba(255,255,255,0.82)", font: "display" });
  drawText(ctx, "100 زبون قبل ما أنشره", W / 2, 312, { size: 64, weight: 900, color: "#ffd21f", font: "display" });

  // الدرجة
  const cx = W / 2, cy = 560, R = 172;
  ctx.lineWidth = 34; ctx.lineCap = "round";
  ctx.strokeStyle = "rgba(255,255,255,0.1)";
  ctx.beginPath(); ctx.arc(cx, cy, R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = tier.color;
  ctx.beginPath(); ctx.arc(cx, cy, R, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * res.score) / 100); ctx.stroke();
  drawText(ctx, String(res.score), cx, cy + 50, { size: 170, weight: 900, color: "#fff", font: "word" });
  drawText(ctx, "من 100", cx, cy + 112, { size: 38, weight: 600, color: "rgba(255,255,255,0.6)" });
  ctx.fillStyle = tier.color;
  ctx.font = `800 44px "Alexandria", sans-serif`;
  const tw = ctx.measureText(tier.label).width + 70;
  rr(ctx, cx - tw / 2, cy + R + 44, tw, 80, 40); ctx.fill();
  drawText(ctx, tier.label, cx, cy + R + 99, { size: 40, weight: 800, color: "#fff", font: "display" });

  // شبكة الـ100
  const dots = hundredDots(res.tally);
  const gs = 38, gap = 12, gw = 10 * gs + 9 * gap, gx = (W - gw) / 2, gy = 900;
  dots.forEach((v, i) => {
    const col = 9 - (i % 10), row = Math.floor(i / 10); // من اليمين لليسار
    ctx.fillStyle = VERDICT_COLOR[v];
    ctx.beginPath(); ctx.arc(gx + col * (gs + gap) + gs / 2, gy + row * (gs + gap) + gs / 2, gs / 2, 0, Math.PI * 2); ctx.fill();
  });
  const ly = gy + 10 * (gs + gap) + 40;
  const items = [["buy", `${res.tally.buy} هيطلبوا`], ["maybe", `${res.tally.maybe} بيفكروا`], ["skip", `${res.tally.skip} عدّوا`]];
  items.forEach(([k, label], i) => {
    const x = W / 2 + (1 - i) * 300;
    ctx.fillStyle = VERDICT_COLOR[k];
    ctx.beginPath(); ctx.arc(x + 100, ly - 12, 14, 0, Math.PI * 2); ctx.fill();
    drawText(ctx, label, x + 74, ly, { size: 36, weight: 700, color: "#fff", align: "right" });
  });

  // أحلى تعليق
  const best = res.personas.find((p) => p.verdict === "buy") || res.personas[0];
  if (best) {
    ctx.font = `600 36px "IBM Plex Sans Arabic", sans-serif`;
    const lines = wrap(ctx, `«${best.comment}»`, W - 260, 2);
    const bh = 70 + lines.length * 50;
    ctx.fillStyle = "rgba(255,255,255,0.08)";
    rr(ctx, 110, ly + 40, W - 220, bh, 32); ctx.fill();
    drawText(ctx, best.name, W - 150, ly + 94, { size: 30, weight: 700, color: "#ffd21f", align: "right" });
    lines.forEach((l, k) => drawText(ctx, l, W - 150, ly + 146 + k * 50, { size: 36, weight: 600, color: "#fff", align: "right" }));
  }
  star(ctx, W / 2, 118, 86);
  brandFooter(ctx, W, H, "/test-ad");
  return toBlob(c);
}

function ShareRow({ res, onReset }) {
  const [busy, setBusy] = useState(false);
  async function share() {
    setBusy(true);
    try {
      const blob = await makeStory(res);
      const r = await shareOrDownload(blob, `my-ad-${res.score}.png`, "اختبرت إعلاني على 100 زبون قبل ما أنشره 👀");
      if (r === "downloaded") toast("الصورة اتحملت");
    } catch { toast("ما قدرناش نعمل الصورة"); }
    setBusy(false);
  }
  return (
    <section className={s.card}>
      <div className={t.shareRow}>
        <button type="button" className={s.cta} onClick={share} disabled={busy}>{busy ? <span className={s.spin} /> : "📲"} شارك نتيجتك ستوري</button>
        <button type="button" className={`${s.miniBtn} ${t.again}`} onClick={onReset}>اختبر إعلان تاني</button>
      </div>
      <p className={s.note} style={{ marginTop: 14 }}>
        <span aria-hidden="true">ℹ️</span>
        <span>الزباين دول <b>افتراضيين بالذكاء الاصطناعي</b> ومبنيين على سلوك الجمهور المصري على السوشيال ميديا. النتيجة تقدير بيساعدك تحسّن إعلانك قبل ما تدفع فيه، مش ضمان مبيعات.</span>
      </p>
      <div className={s.next} style={{ marginTop: 14 }}>
        <Link href="/photo-ad" className={s.nextCard}><i aria-hidden="true">📸</i><span><b>صوّرها بموبايلك</b><small>صورة منتج شكل الاستوديو + إعلان كامل</small></span></Link>
        <Link href="/catalog" className={s.nextCard}><i aria-hidden="true">📒</i><span><b>كتالوجك في دقيقة</b><small>كل منتجاتك في PDF يتبعت واتساب</small></span></Link>
      </div>
    </section>
  );
}
