"use client";
// «وكيل التاجر»: التاجر بيكتب مهمته بكلامه (ويرفع صورة منتجه لو حب)، والوكيل بيخطط ويستخدم أدوات الموقع بالترتيب:
// فحص السوق ← التسعير والمكسب (محسوبين هنا بالكود) ← الليستنج ← البوستات ← صور الإعلان (على الجهاز من صورة المنتج).
// كل خطوة طلب لوحدها على /api/seller-agent، والمهمة بتتحفظ على جهاز التاجر عشان يرجع لها ويراجع الأسعار تاني.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import LookButton from "@/components/LookButton";
import ShareBar from "@/components/ShareBar";
import { STEPS, ASKS, pricing, priceDiff, compactRun, SAVE_KEY, MAX_SAVED } from "@/lib/selleragent";
import { read, useStored, toast } from "@/lib/store";
import { enterSends } from "@/lib/keys";
import { readImage, scaledCanvas, canvasBlob, blobToDataUrl, shareOrDownload, copyText, loadFonts } from "@/lib/imagefile";
import s from "./selleragent.module.css";

const STARTERS = [
  "عايز أبيع سماعة بلوتوث على أمازون مصر. هات أسعار المنافسين واكتب الليستنج.",
  "منتجي كريم شعر طبيعي، والتكلفة عليّا 80 جنيه. أسعّره بكام؟ واكتب لي بوستات فيسبوك وواتساب.",
  "صوّرت شنطة جلد يدوي. اعمل لي صور إعلان وبوستات للسوشيال.",
];
const SCENE_IDS = [["studio", "استوديو أبيض"], ["podium", "بوديوم"], ["offer", "إعلان جاهز"]];
const egp = (v) => (v || v === 0 ? `${Math.round(v).toLocaleString("en")} ج` : "—");
const digits = (v) => String(v ?? "").replace(/[٠-٩]/g, (d) => "٠١٢٣٤٥٦٧٨٩".indexOf(d)).replace(/[^\d]/g, "").slice(0, 8);
const when = (t) => { try { return new Date(t).toLocaleDateString("ar-EG", { day: "numeric", month: "long" }); } catch { return ""; } };
const esc = (x) => String(x ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const newId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

async function api(op, payload, signal) {
  const r = await fetch("/api/seller-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op, ...payload }), signal });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.error || "حصلت مشكلة. جرّب تاني."), { status: r.status });
  return j;
}

// [3] → رابط للمصدر رقم 3 في قايمة المصادر
function Cited({ text }) {
  return String(text || "").split(/(\[\d+\])/g).map((p, i) => {
    const m = /^\[(\d+)\]$/.exec(p);
    return m ? <a key={i} href={`#sa-src-${m[1]}`} className={s.cite}>{m[1]}</a> : <span key={i}>{p}</span>;
  });
}

function Copy({ text, label = "انسخ" }) {
  return (
    <button type="button" className={s.copy} onClick={async () => toast((await copyText(text)) ? "اتنسخ" : "ما قدرناش ننسخ. علّم على الكلام وانسخه بنفسك.")}>
      {label}
    </button>
  );
}

function Art({ name, size = 40 }) {
  return <img src={`/cards/${name}.webp`} alt="" width={size} height={size} loading="lazy" decoding="async" className={s.art} />;
}

function StepIcon({ st }) {
  if (st === "busy") return <span className={s.spin} aria-label="شغال" />;
  if (st === "done") return <svg className={s.ok} width="20" height="20" viewBox="0 0 24 24" aria-label="خلصت"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>;
  if (st === "fail") return <svg className={s.bad} width="20" height="20" viewBox="0 0 24 24" aria-label="ما خلصتش"><circle cx="12" cy="12" r="10" fill="currentColor" /><path d="M12 7v6M12 16.5v.5" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" /></svg>;
  if (st === "skip") return <svg className={s.wait} width="20" height="20" viewBox="0 0 24 24" aria-label="اتخطت"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M8 12h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
  return <svg className={s.wait} width="20" height="20" viewBox="0 0 24 24" aria-label="مستنية"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
}

export default function SellerAgent() {
  const [goal, setGoal] = useState("");
  const [photo, setPhoto] = useState(null); // { canvas, url }
  const [run, setRun] = useState(null);
  const [nums, setNums] = useState({ cost: "", shipping: "", feePct: "" });
  const [lang, setLang] = useState("ar");
  const [answer, setAnswer] = useState("");
  const [saved, setSaved] = useStored(SAVE_KEY, []);
  const [recheck, setRecheck] = useState({}); // id → "busy" | { diff, error }
  const ctl = useRef(null);
  const runRef = useRef(null);
  const fileIn = useRef(null);
  const askFile = useRef(null);
  const top = useRef(null);
  const urls = useRef(new Set());

  useEffect(() => () => { ctl.current?.abort(); urls.current.forEach((u) => URL.revokeObjectURL(u)); }, []);
  const keepUrl = (blob) => { const u = URL.createObjectURL(blob); urls.current.add(u); return u; };

  // الـref هو المرجع: بيتحدّث فوراً، والخطوات اللي شغالة مع بعض بتقرا منه آخر حالة
  const patch = (fn) => {
    const r = runRef.current;
    if (!r) return;
    const n = { ...r, ...(typeof fn === "function" ? fn(r) : fn) };
    runRef.current = n;
    setRun(n);
  };
  const setStep = (id, st, error = "") => patch((r) => ({ status: { ...r.status, [id]: st }, errors: { ...r.errors, [id]: error } }));

  async function pickPhoto(file) {
    if (!file) return null;
    try {
      const img = await readImage(file);
      const canvas = scaledCanvas(img, 1400);
      const url = keepUrl(await canvasBlob(canvas, "image/jpeg", 0.9));
      const p = { canvas, url };
      setPhoto(p);
      return p;
    } catch (e) {
      toast(e.message || "الصورة دي مش مدعومة. جرّب JPG أو PNG.");
      return null;
    }
  }

  async function lookAt(p, signal) {
    try {
      const image = await blobToDataUrl(await canvasBlob(scaledCanvas(p.canvas, 1024), "image/jpeg", 0.85));
      const r = await fetch("/api/product-eye", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }), signal });
      const j = await r.json().catch(() => ({}));
      return r.ok ? { seen: j.seen || "", seenName: j.name || "" } : { seen: "", seenName: "" };
    } catch {
      return { seen: "", seenName: "" };
    }
  }

  /** بداية مهمة جديدة (أو إعادة التخطيط بعد إجابة سؤال) */
  async function start(text, { p = photo, keep = null } = {}) {
    const g = String(text || "").trim();
    if (g.length < 6) { toast("اكتب مهمتك في جملة: المنتج إيه، وعايز تبيعه فين."); return; }
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    const base = keep || { id: newId(), t: Date.now() };
    const fresh = { ...base, goal: g, photoUrl: p?.url || "", phase: "plan", status: {}, errors: {}, steps: [], market: null, listing: null, posts: null, images: [] };
    runRef.current = fresh;
    setRun(fresh);
    setNums({ cost: "", shipping: "", feePct: "" });
    setAnswer("");
    setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    try {
      const eye = p ? await lookAt(p, c.signal) : { seen: "", seenName: "" };
      const plan = await api("plan", { goal: g, hasPhoto: !!p, seen: eye.seen, seenName: eye.seenName, brand: read("brand", null) }, c.signal);
      const b = plan.brief;
      setNums({ cost: b.cost ? String(b.cost) : "", shipping: b.shipping ? String(b.shipping) : "", feePct: b.feePct ? String(b.feePct) : "" });
      patch({ brief: b, steps: plan.steps, ask: plan.ask, seen: eye.seen, phase: plan.ask ? "ask" : "run", status: Object.fromEntries(plan.steps.map((id) => [id, "wait"])) });
      if (!plan.ask) execute(c, p);
    } catch (e) {
      if (e?.name === "AbortError") return;
      patch({ phase: "error", error: e.message || "الاتصال اتقطع. جرّب تاني." });
    }
  }

  /** تنفيذ الخطوات: السيرفر بالترتيب، وصور الإعلان على الجهاز في نفس الوقت */
  async function execute(c, p) {
    patch({ phase: "run" });
    const r = runRef.current;
    const lanes = [serverLane(c, r.steps.filter((id) => id !== "images" && id !== "price"))];
    if (r.steps.includes("images")) lanes.push(imagesLane(c, p));
    await Promise.all(lanes);
    if (c.signal.aborted) return;
    patch({ phase: "done" });
    save(runRef.current);
  }

  async function serverLane(c, ids) {
    for (const id of ids) {
      if (c.signal.aborted) return;
      await runStep(id, c);
    }
  }

  async function runStep(id, c) {
    const r = runRef.current;
    setStep(id, "busy");
    if (id === "market" && r.steps.includes("price")) setStep("price", "wait");
    try {
      const j = await api(id, { brief: r.brief, seen: r.seen, brand: read("brand", null) }, c.signal);
      patch({ [id]: j });
      setStep(id, "done");
      if (id === "market") setStep("price", j.empty || !j.stats?.priced ? "skip" : "done", j.empty ? "مفيش أسعار كفاية نحسب منها" : "");
    } catch (e) {
      if (e?.name === "AbortError") return;
      setStep(id, "fail", e.message);
      if (id === "market" && r.steps.includes("price")) setStep("price", "skip", "محتاجة أسعار السوق الأول");
    }
  }

  async function imagesLane(c, p) {
    if (!p) { setStep("images", "skip", "مفيش صورة للمنتج"); return; }
    setStep("images", "busy");
    try {
      const { removeBackground, trimAlpha, raceAbort } = await import("@/components/studio/cutout");
      const { renderScene } = await import("./scenes");
      let prod = { canvas: p.canvas, framed: true };
      try {
        const { canvas: out } = await raceAbort(removeBackground(p.canvas, { signal: c.signal }), c.signal, 90_000);
        const trimmed = trimAlpha(out);
        if (trimmed) prod = { canvas: trimmed, framed: false };
      } catch (e) {
        if (c.signal.aborted) return;
        // لو شيل الخلفية ما نفعش، بنحط الصورة زي ما هي جوه إطار شيك
      }
      await loadFonts();
      const b = runRef.current.brief || {};
      const contact = read("brand", null)?.whatsapp || "";
      const shots = [];
      for (const [id, name] of SCENE_IDS) {
        if (c.signal.aborted) return;
        const cv = renderScene(id, { prod: prod.canvas, framed: prod.framed, format: "square", name: b.product || "", price: b.price ? `${b.price} ج` : "", contact });
        const blob = await canvasBlob(cv, "image/jpeg", 0.92);
        shots.push({ id, name, blob, url: keepUrl(blob) });
        await new Promise((res) => setTimeout(res, 0));
      }
      patch({ images: shots, framed: prod.framed });
      setStep("images", "done", prod.framed ? "ما قدرناش نشيل الخلفية، فحطينا صورتك جوه إطار" : "");
    } catch (e) {
      if (c.signal.aborted) return;
      setStep("images", "fail", "ما قدرناش نجهّز الصور على الجهاز ده.");
    }
  }

  async function retry(id) {
    const c = ctl.current && !ctl.current.signal.aborted ? ctl.current : new AbortController();
    ctl.current = c;
    patch({ phase: "run" });
    if (id === "images") await imagesLane(c, photo);
    else await runStep(id, c);
    patch({ phase: "done" });
    save(runRef.current);
  }

  function stop() {
    ctl.current?.abort();
    patch((r) => ({ phase: "done", status: Object.fromEntries(Object.entries(r.status).map(([k, v]) => [k, v === "busy" || v === "wait" ? "skip" : v])), stopped: true }));
  }

  // إجابة سؤال الوكيل
  async function answerProduct(e) {
    e.preventDefault();
    const v = answer.trim();
    if (v.length < 2) return;
    const r = runRef.current;
    await start(`${r.goal}\nالمنتج: ${v}`, { keep: { id: r.id, t: r.t } });
  }
  async function answerPhoto(file) {
    const p = await pickPhoto(file);
    if (!p) return;
    const r = runRef.current;
    await start(r.goal, { p, keep: { id: r.id, t: r.t } });
  }
  function skipPhoto() {
    const c = ctl.current && !ctl.current.signal.aborted ? ctl.current : new AbortController();
    ctl.current = c;
    patch((r) => ({ ask: null, steps: r.steps.filter((x) => x !== "images"), status: Object.fromEntries(Object.entries(r.status).filter(([k]) => k !== "images")) }));
    execute(c, null);
  }

  function save(r) {
    if (!r?.brief) return;
    const item = compactRun(r);
    setSaved((list) => [item, ...(Array.isArray(list) ? list : []).filter((x) => x.id !== item.id)].slice(0, MAX_SAVED));
  }

  function openSaved(x) {
    ctl.current?.abort();
    const n = { ...x, photoUrl: "", phase: "done", status: Object.fromEntries((x.steps || []).map((id) => [id, id === "images" ? "skip" : (id === "price" ? (x.market?.stats?.priced ? "done" : "skip") : (x[id] ? "done" : "skip"))])), errors: x.steps?.includes("images") ? { images: "الصور مش بتتحفظ. ارفع الصورة تاني لو محتاجها." } : {}, images: [] };
    runRef.current = n;
    setRun(n);
    setNums({ cost: x.brief?.cost ? String(x.brief.cost) : "", shipping: x.brief?.shipping ? String(x.brief.shipping) : "", feePct: x.brief?.feePct ? String(x.brief.feePct) : "" });
    setTimeout(() => top.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  /** مراجعة الأسعار تاني لمهمة محفوظة: الفرق بيتحسب في الكود */
  async function recheckPrices(x) {
    if (!x?.brief || recheck[x.id] === "busy") return;
    setRecheck((m) => ({ ...m, [x.id]: "busy" }));
    try {
      const j = await api("market", { brief: x.brief });
      if (j.empty) { setRecheck((m) => ({ ...m, [x.id]: { error: j.note } })); return; }
      const diff = priceDiff(x.market?.stats, j.stats);
      const updated = { ...x, market: { ...j, listings: (j.listings || []).slice(0, 12) }, history: [...(x.history || []), { t: Date.now(), median: x.market?.stats?.median, min: x.market?.stats?.min, listings: x.market?.stats?.listings }].slice(-6) };
      setSaved((list) => (Array.isArray(list) ? list : []).map((y) => (y.id === x.id ? compactRun(updated) : y)));
      setRecheck((m) => ({ ...m, [x.id]: { diff, at: j.checkedAt, cached: j.cached } }));
      if (runRef.current?.id === x.id) patch({ market: j });
    } catch (e) {
      setRecheck((m) => ({ ...m, [x.id]: { error: e.message } }));
    }
  }

  function removeSaved(id) {
    setSaved((list) => (Array.isArray(list) ? list : []).filter((x) => x.id !== id));
  }

  function reset() {
    ctl.current?.abort();
    setRun(null);
    runRef.current = null;
    setGoal("");
    setPhoto(null);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 30);
  }

  const brief = run?.brief;
  const mk = run?.market && !run.market.empty ? run.market : null;
  const priced = useMemo(() => (mk ? pricing(mk.stats, { price: brief?.price, cost: Number(nums.cost) || null, shipping: Number(nums.shipping) || null, feePct: Number(nums.feePct) || null }) : null), [mk, brief?.price, nums]);
  const doneCount = run ? run.steps.filter((id) => run.status[id] === "done").length : 0;
  const list = Array.isArray(saved) ? saved : [];
  const report = useMemo(() => (run?.phase === "done" ? buildReport(run, priced, lang) : null), [run, priced, lang]);

  return (
    <div className={s.page}>
      <div className={s.bar}>
        <b>وكيل التاجر</b>
        {run && <button type="button" className={s.pill} onClick={reset}>+ مهمة جديدة</button>}
      </div>

      {!run && (
        <>
          <header className={s.hero}>
            <h1>قولّي عايز تبيع إيه، وأنا أخلّص الباقي.</h1>
            <p>بجيب أسعار المنافسين الحقيقية، وأحسب السعر والمكسب، وأكتب الليستنج والبوستات، وأصمم صور الإعلان من صورة منتجك. كله هنا في مكان واحد.</p>
          </header>
          <ul className={s.toolsRow} aria-label="الأدوات اللي الوكيل بيستخدمها">
            {["market", "price", "listing", "posts", "images"].map((id) => (
              <li key={id}><Art name={STEPS[id].art} size={44} /><span>{STEPS[id].tool}</span></li>
            ))}
          </ul>
        </>
      )}

      {!run && (
        <form className={`${s.composer} ${s.big}`} onSubmit={(e) => { e.preventDefault(); start(goal); }}>
          {photo && (
            <div className={s.thumb}>
              <img src={photo.url} alt="صورة المنتج" width="56" height="56" />
              <button type="button" aria-label="شيل الصورة" onClick={() => setPhoto(null)}>×</button>
            </div>
          )}
          <label htmlFor="sa-goal" className={s.sr}>مهمتك</label>
          <textarea id="sa-goal" rows={3} value={goal} maxLength={1500} dir="auto" onChange={(e) => setGoal(e.target.value)} onKeyDown={(e) => { if (enterSends(e)) { e.preventDefault(); start(goal); } }}
            placeholder="مثلاً: عايز أبيع ساعة ذكية على أمازون وفيسبوك، والتكلفة عليّا 600 جنيه." />
          <div className={s.tools}>
            <button type="button" className={s.icon} aria-label="ارفع صورة المنتج" title="صورة المنتج" onClick={() => fileIn.current?.click()}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M4 8.5A1.5 1.5 0 015.5 7h2l1.4-2h6.2L16.5 7h2A1.5 1.5 0 0120 8.5v9a1.5 1.5 0 01-1.5 1.5h-13A1.5 1.5 0 014 17.5z" /><circle cx="12" cy="12.8" r="3.3" /></svg>
            </button>
            <input ref={fileIn} type="file" accept="image/*" hidden onChange={(e) => { pickPhoto(e.target.files?.[0]); e.target.value = ""; }} />
            <LookButton />
            <button type="submit" className={s.send} disabled={goal.trim().length < 6} aria-label="ابدأ المهمة">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 19V5M5.5 11.5L12 5l6.5 6.5" /></svg>
            </button>
          </div>
        </form>
      )}

      {!run && (
        <div className={s.starters}>
          <span>جرّب مهمة من دول</span>
          {STARTERS.map((t) => <button key={t} type="button" onClick={() => setGoal(t)}>{t}</button>)}
        </div>
      )}

      {!run && list.length > 0 && (
        <section className={s.saved} aria-labelledby="sa-saved">
          <h2 id="sa-saved">مهامك السابقة</h2>
          <p className={s.note}>محفوظة على جهازك. راجع أسعار المنافسين في أي وقت واعرف إيه اللي اتغيّر.</p>
          <ul>
            {list.map((x) => {
              const rc = recheck[x.id];
              const d = rc && rc !== "busy" ? rc.diff : null;
              return (
                <li key={x.id}>
                  <div className={s.savedHead}>
                    <b>{x.brief?.product || x.goal.slice(0, 40)}</b>
                    <small>{when(x.t)}{x.market?.stats?.median ? ` • متوسط السوق ${egp(x.market.stats.median)}` : ""}</small>
                  </div>
                  <div className={s.savedActs}>
                    <button type="button" className={s.pill} onClick={() => openSaved(x)}>افتح</button>
                    {x.market?.stats && <button type="button" className={s.pill} onClick={() => recheckPrices(x)} disabled={rc === "busy"}>{rc === "busy" ? "بيراجع…" : "راجع الأسعار"}</button>}
                    <button type="button" className={s.linkBtn} onClick={() => removeSaved(x.id)}>امسح</button>
                  </div>
                  {d && <Diff d={d} cached={rc.cached} />}
                  {rc?.error && <p className={s.err}>{rc.error}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {run && (
        <div ref={top} className={s.run}>
          <div className={s.goal}>
            {run.photoUrl && <img src={run.photoUrl} alt="صورة المنتج" width="64" height="64" />}
            <p dir="auto">{run.goal}</p>
          </div>

          <section className={s.agent} aria-live="polite" aria-label="خطوات الوكيل">
            <div className={s.agentHead}>
              <Art name="robot" size={30} />
              <b>{run.phase === "plan" ? "الوكيل بيفهم مهمتك…" : run.phase === "done" ? (run.stopped ? "وقّفت المهمة" : "خلّصت مهمتك") : run.phase === "ask" ? "محتاج منك حاجة واحدة" : run.phase === "error" ? "المهمة ما بدأتش" : "الوكيل شغال على مهمتك"}</b>
              {run.steps.length > 0 && <small>{doneCount} من {run.steps.length}</small>}
            </div>
            {brief?.understood && <p className={s.understood}>{brief.understood}</p>}
            {run.phase === "plan" && <div className={s.planning}><span className={s.spin} /> {run.photoUrl ? "بشوف صورة منتجك وبخطط للمهمة" : "بخطط للمهمة وبختار الأدوات"}</div>}
            {run.phase === "error" && (
              <div className={s.errBox}>
                <p>{run.error}</p>
                <button type="button" className={s.pill} onClick={() => start(run.goal)}>جرّب تاني</button>
              </div>
            )}
            {run.steps.length > 0 && (
              <ol className={s.steps}>
                {run.steps.map((id) => {
                  const st = run.status[id] || "wait";
                  const def = STEPS[id];
                  return (
                    <li key={id} className={s[`st_${st}`]}>
                      <StepIcon st={st} />
                      <Art name={def.art} size={30} />
                      <div className={s.stepText}>
                        <b>{st === "done" ? def.done : def.busy}</b>
                        <small>{run.errors?.[id] || def.sub}</small>
                      </div>
                      {st === "fail" && run.phase !== "run" ? <button type="button" className={s.pill} onClick={() => retry(id)}>جرّب تاني</button> : <span className={s.chip}>{def.tool}</span>}
                    </li>
                  );
                })}
              </ol>
            )}
            {run.phase === "run" && <button type="button" className={s.linkBtn} onClick={stop}>وقّف المهمة</button>}
          </section>

          {run.phase === "ask" && run.ask === "product" && (
            <form className={s.ask} onSubmit={answerProduct}>
              <label htmlFor="sa-answer">{ASKS.product}</label>
              <div className={s.askRow}>
                <input id="sa-answer" value={answer} onChange={(e) => setAnswer(e.target.value)} maxLength={80} dir="auto" placeholder="مثلاً: زيت شعر طبيعي" />
                <button type="submit" className={s.primary} disabled={answer.trim().length < 2}>كمّل</button>
              </div>
            </form>
          )}
          {run.phase === "ask" && run.ask === "photo" && (
            <div className={s.ask}>
              <p>{ASKS.photo}</p>
              <div className={s.askRow}>
                <button type="button" className={s.primary} onClick={() => askFile.current?.click()}>ارفع صورة المنتج</button>
                <button type="button" className={s.pill} onClick={skipPhoto}>كمّل من غير صور</button>
              </div>
              <input ref={askFile} type="file" accept="image/*" hidden onChange={(e) => { answerPhoto(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
          )}

          {run.market?.empty && <div className={s.card}><p className={s.note}>{run.market.note}</p></div>}

          {mk && (
            <section className={s.card} aria-labelledby="sa-market">
              <h2 id="sa-market"><Art name={STEPS.market.art} size={26} /> السوق في مصر</h2>
              {mk.stats.priced ? (
                <dl className={s.trio}>
                  <div><dt>أقل سعر</dt><dd>{egp(mk.stats.min)}</dd></div>
                  <div><dt>المتوسط</dt><dd>{egp(mk.stats.median)}</dd></div>
                  <div><dt>أعلى سعر</dt><dd>{egp(mk.stats.max)}</dd></div>
                </dl>
              ) : <p className={s.note}>الأسعار مش ظاهرة في نتايج البحث للمنتج ده. افتح الروابط في المصادر وشوف الأسعار بنفسك.</p>}
              <p className={s.note}>من {mk.stats.listings} ليستنج حقيقي{mk.stats.priced ? ` و${mk.stats.priced} سعر ظاهر` : ""} في {mk.stats.stores.length} متجر{mk.score ? `. مؤشر الفرصة ${mk.score.low}–${mk.score.high} من 100، ومحسوب من البيانات دي مش وعد بمبيعات` : ""}.</p>
              {mk.analysis?.summary && <p className={s.lead}><Cited text={mk.analysis.summary} /></p>}
              {mk.analysis && (
                <div className={s.advice}>
                  {mk.analysis.strengths?.length > 0 && <><h3>اللي في صالحك</h3><ul>{mk.analysis.strengths.map((x, i) => <li key={i}><Cited text={x} /></li>)}</ul></>}
                  {mk.analysis.risks?.length > 0 && <><h3>المخاطر</h3><ul>{mk.analysis.risks.map((x, i) => <li key={i}><Cited text={x} /></li>)}</ul></>}
                  {mk.analysis.steps?.length > 0 && <><h3>تعمل إيه قبل ما تبدأ</h3><ol>{mk.analysis.steps.map((x, i) => <li key={i}><Cited text={x} /></li>)}</ol></>}
                  {mk.analysis.check?.length > 0 && <><h3>اتأكد منها بنفسك</h3><ul>{mk.analysis.check.map((x, i) => <li key={i}><Cited text={x} /></li>)}</ul></>}
                </div>
              )}
              <details className={s.sources}>
                <summary>المصادر ({mk.listings.length}) والأسعار في كل متجر</summary>
                <table className={s.table}>
                  <thead><tr><th scope="col">المتجر</th><th scope="col">ليستنج</th><th scope="col">المتوسط</th></tr></thead>
                  <tbody>{mk.stats.stores.map((x) => <tr key={x.store}><th scope="row">{x.name}</th><td>{x.listings}</td><td>{egp(x.median)}</td></tr>)}</tbody>
                </table>
                <ol>
                  {mk.listings.map((x) => (
                    <li key={x.n} id={`sa-src-${x.n}`}>
                      <a href={x.link} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{x.title}</a>
                      <span>{x.storeName}{x.price ? ` • ${egp(x.price)}` : ""}{x.reviews ? ` • ${x.reviews.toLocaleString("en")} تقييم` : ""}</span>
                    </li>
                  ))}
                </ol>
                <p className={s.note}>{mk.checkedAt ? `اتجمعت ${when(mk.checkedAt)}. ` : ""}الأسعار بتتغيّر، فافتح الرابط قبل ما تعتمد على سعر.</p>
              </details>
            </section>
          )}

          {priced && (
            <section className={s.card} aria-labelledby="sa-price">
              <h2 id="sa-price"><Art name={STEPS.price.art} size={26} /> السعر والمكسب</h2>
              <p className={s.lead}>سعر دخول مناسب للسوق: بين <b>{egp(priced.entry.low)}</b> و<b>{egp(priced.entry.high)}</b>.</p>
              <p className={s.note}>القاعدة: بين أرخص ربع في السوق والمتوسط، علشان تبقى منافس من غير ما تحرق السعر.{priced.vsMedian !== null ? ` سعرك ${priced.vsMedian > 0 ? "أغلى" : "أرخص"} من المتوسط بـ ${Math.abs(priced.vsMedian)}%.` : ""}</p>
              <table className={s.table}>
                <thead><tr><th scope="col">لو بعت بـ</th><th scope="col">السعر</th>{nums.cost ? <><th scope="col">مكسبك</th><th scope="col">الهامش</th></> : null}</tr></thead>
                <tbody>
                  {priced.rows.map((x) => (
                    <tr key={x.label} className={x.mine ? s.mine : undefined}>
                      <th scope="row">{x.label}</th><td>{egp(x.price)}</td>
                      {nums.cost ? <><td className={x.net < 0 ? s.neg : undefined}>{egp(x.net)}</td><td dir="ltr">{x.margin}%</td></> : null}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className={s.nums}>
                <label><span>التكلفة عليك</span><input inputMode="numeric" value={nums.cost} onChange={(e) => setNums({ ...nums, cost: digits(e.target.value) })} placeholder="للقطعة" /></label>
                <label><span>الشحن</span><input inputMode="numeric" value={nums.shipping} onChange={(e) => setNums({ ...nums, shipping: digits(e.target.value) })} placeholder="للقطعة" /></label>
                <label><span>عمولة المنصة %</span><input inputMode="numeric" value={nums.feePct} onChange={(e) => setNums({ ...nums, feePct: digits(e.target.value).slice(0, 2) })} placeholder="من صفحة البياع" /></label>
              </div>
              {priced.breakEven ? <p className={s.note}>أقل سعر تبيع بيه من غير خسارة: <b>{egp(priced.breakEven)}</b>.</p> : null}
              {priced.missing.length > 0 && <p className={s.note}>اكتب {priced.missing.join(" و")} في الخانات فوق، والمكسب هيتحسب على طول.</p>}
            </section>
          )}

          {run.listing && (
            <section className={s.card} aria-labelledby="sa-listing">
              <h2 id="sa-listing"><Art name={STEPS.listing.art} size={26} /> الليستنج</h2>
              <div className={s.seg} role="group" aria-label="لغة الليستنج">
                {[["ar", "عربي"], ["en", "English"]].filter(([k]) => run.listing[k]).map(([k, label]) => (
                  <button key={k} type="button" aria-pressed={lang === k} onClick={() => setLang(k)}>{label}</button>
                ))}
              </div>
              <Listing data={run.listing[lang] || run.listing.ar || run.listing.en} rtl={lang === "ar" || !run.listing.en} />
              {run.listing.missing?.length > 0 && <p className={s.note}>معلومات لو زوّدتها الليستنج هيبقى أقوى: {run.listing.missing.join("، ")}</p>}
              {run.listing.invented?.length > 0 && <p className={s.warn}>راجع الأرقام دي قبل النشر، لأنها مش من كلامك: {run.listing.invented.join("، ")}</p>}
              <Link href="/amazon/check" className={s.more}>افحص الليستنج قبل النشر</Link>
            </section>
          )}

          {run.posts && (
            <section className={s.card} aria-labelledby="sa-posts">
              <h2 id="sa-posts"><Art name={STEPS.posts.art} size={26} /> البوستات</h2>
              {[["facebook", "فيسبوك"], ["instagram", "إنستجرام"], ["whatsapp", "واتساب"], ["tiktok", "سكريبت تيك توك وريلز"], ["description", "وصف للمتجر والكتالوج"]].filter(([k]) => run.posts[k]).map(([k, label]) => (
                <div key={k} className={s.block}>
                  <div className={s.blockHead}><b>{label}</b><Copy text={k === "instagram" && run.posts.hashtags?.length ? `${run.posts.instagram}\n\n${run.posts.hashtags.join(" ")}` : run.posts[k]} /></div>
                  <p dir="auto">{run.posts[k]}</p>
                </div>
              ))}
              {run.posts.hashtags?.length > 0 && <p className={s.tags} dir="auto">{run.posts.hashtags.join(" ")}</p>}
              {run.posts.missing?.length > 0 && <p className={s.note}>كمّل الأقواس اللي في الكلام قبل ما تنشر. ناقص: {run.posts.missing.join("، ")}</p>}
            </section>
          )}

          {run.images?.length > 0 && (
            <section className={s.card} aria-labelledby="sa-images">
              <h2 id="sa-images"><Art name={STEPS.images.art} size={26} /> صور الإعلان</h2>
              <div className={s.shots}>
                {run.images.map((x) => (
                  <figure key={x.id}>
                    <img src={x.url} alt={x.name} width="1080" height="1080" />
                    <figcaption>{x.name}<button type="button" className={s.copy} onClick={() => shareOrDownload(x.blob, `${(brief?.product || "منتج").slice(0, 30)}-${x.id}.jpg`)}>احفظ</button></figcaption>
                  </figure>
                ))}
              </div>
              <Link href="/photo-ad" className={s.more}>عايز مشاهد أكتر وفيديو 15 ثانية؟ افتح «صوّرها بموبايلك»</Link>
            </section>
          )}

          {run.phase === "done" && (run.market || run.listing || run.posts) && (
            <>
              {report && (
                <div className={s.card}>
                  <h2>التقرير كامل</h2>
                  <p className={s.note}>نزّله Word أو PDF، أو ابعته واتساب. والمهمة اتحفظت على جهازك علشان تراجع الأسعار بعدين.</p>
                  <ShareBar text={report.text} getHtml={() => report.html} title={`وكيل التاجر: ${brief?.product || "مهمة"}`} />
                </div>
              )}
              <div className={s.next}>
                <span>الخطوة الجاية</span>
                {run.posts && <Link href="/test-ad"><Art name="hundred-points" size={34} /><b>جرّب البوست على 100 عميل</b><small>قبل ما تدفع في الإعلان</small></Link>}
                <Link href="/catalog"><Art name="ledger" size={34} /><b>اعمل كتالوج لمنتجاتك</b><small>PDF بزرار طلب على واتساب</small></Link>
                <Link href="/feasibility"><Art name="chart-increasing" size={34} /><b>دراسة جدوى لنشاطك</b><small>بأرقام تعدّلها بنفسك</small></Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function Listing({ data, rtl }) {
  if (!data?.listing) return null;
  const l = data.listing;
  const all = [l.title, "", ...l.bullets.map((b) => `• ${b}`), "", l.description, "", l.backend].join("\n");
  const c = data.check?.stats;
  return (
    <div dir={rtl ? "rtl" : "ltr"} className={s.listing}>
      <div className={s.block}><div className={s.blockHead}><b>{rtl ? "العنوان" : "Title"}</b><Copy text={l.title} /></div><p>{l.title}</p></div>
      <div className={s.block}><div className={s.blockHead}><b>{rtl ? "النقاط" : "Bullet points"}</b><Copy text={l.bullets.join("\n")} /></div><ul>{l.bullets.map((b, i) => <li key={i}>{b}</li>)}</ul></div>
      <div className={s.block}><div className={s.blockHead}><b>{rtl ? "الوصف" : "Description"}</b><Copy text={l.description} /></div><p>{l.description}</p></div>
      {l.backend && <div className={s.block}><div className={s.blockHead}><b>{rtl ? "كلمات البحث الخلفية" : "Backend search terms"}</b><Copy text={l.backend} /></div><p>{l.backend}</p></div>}
      <div className={s.listingFoot} dir="rtl">
        {c && <small>مفحوص بالكود: {c.errors} خطر رفض، {c.warns || 0} تحذير{data.repaired ? "، واتصلّح تلقائياً" : ""}</small>}
        <Copy text={all} label="انسخ الليستنج كله" />
      </div>
    </div>
  );
}

function Diff({ d, cached }) {
  const line = (label, x) => (x.pct === null || x.pct === undefined ? null : (
    <li key={label}><span>{label}</span><b className={x.pct > 0 ? s.up : x.pct < 0 ? s.down : undefined}>{x.pct === 0 ? "زي ما هو" : `${x.pct > 0 ? "زاد" : "نزل"} ${Math.abs(x.pct)}%`}</b><small>{egp(x.from)} ← {egp(x.to)}</small></li>
  ));
  return (
    <div className={s.diff}>
      <ul>
        {line("متوسط السوق", d.median)}
        {line("أقل سعر", d.min)}
        <li><span>عدد الليستنجات</span><b>{d.listings.from} ← {d.listings.to}</b></li>
      </ul>
      {cached && <small className={s.note}>الأسعار دي من آخر 24 ساعة.</small>}
    </div>
  );
}

/** التقرير للتحميل (Word/PDF) والمشاركة: من البيانات نفسها، مش من شكل الصفحة */
function buildReport(run, priced, lang) {
  const b = run.brief || {};
  const mk = run.market && !run.market.empty ? run.market : null;
  const t = [];
  const h = [];
  const strip = (x) => String(x || "").replace(/\[\d+\]/g, "").trim();
  t.push(`مهمة: ${run.goal}`);
  h.push(`<p><b>المهمة:</b> ${esc(run.goal)}</p>`);
  if (mk?.stats?.priced) {
    t.push("", "السوق في مصر", `أقل سعر ${egp(mk.stats.min)}، المتوسط ${egp(mk.stats.median)}، أعلى سعر ${egp(mk.stats.max)} (من ${mk.stats.listings} ليستنج).`);
    h.push(`<h2>السوق في مصر</h2><p>أقل سعر ${egp(mk.stats.min)}، المتوسط ${egp(mk.stats.median)}، أعلى سعر ${egp(mk.stats.max)} (من ${mk.stats.listings} ليستنج في ${mk.stats.stores.length} متجر).</p>`);
    if (mk.analysis?.summary) { t.push(strip(mk.analysis.summary)); h.push(`<p>${esc(strip(mk.analysis.summary))}</p>`); }
    const sec = (title, arr) => { if (arr?.length) { t.push("", title, ...arr.map((x) => `- ${strip(x)}`)); h.push(`<h3>${title}</h3><ul>${arr.map((x) => `<li>${esc(strip(x))}</li>`).join("")}</ul>`); } };
    sec("اللي في صالحك", mk.analysis?.strengths);
    sec("المخاطر", mk.analysis?.risks);
    sec("تعمل إيه قبل ما تبدأ", mk.analysis?.steps);
    h.push(`<h3>المصادر</h3><ol>${(mk.listings || []).map((x) => `<li><a href="${esc(x.link)}">${esc(x.title)}</a> — ${esc(x.storeName)}${x.price ? ` — ${egp(x.price)}` : ""}</li>`).join("")}</ol>`);
  }
  if (priced) {
    t.push("", "السعر والمكسب", `سعر دخول مناسب: بين ${egp(priced.entry.low)} و${egp(priced.entry.high)}.`, ...priced.rows.map((r) => `- ${r.label}: ${egp(r.price)}${r.net !== undefined ? `، مكسبك ${egp(r.net)} (${r.margin}%)` : ""}`));
    h.push(`<h2>السعر والمكسب</h2><p>سعر دخول مناسب: بين ${egp(priced.entry.low)} و${egp(priced.entry.high)} (بين أرخص ربع في السوق والمتوسط).</p><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>لو بعت بـ</th><th>السعر</th><th>مكسبك</th><th>الهامش</th></tr>${priced.rows.map((r) => `<tr><td>${r.label}</td><td>${egp(r.price)}</td><td>${r.net !== undefined ? egp(r.net) : "—"}</td><td>${r.margin !== undefined ? `${r.margin}%` : "—"}</td></tr>`).join("")}</table>`);
  }
  const L = run.listing?.[lang] || run.listing?.ar || run.listing?.en;
  if (L?.listing) {
    const l = L.listing;
    t.push("", "الليستنج", l.title, ...l.bullets.map((x) => `- ${x}`), l.description);
    h.push(`<h2>الليستنج</h2><p><b>${esc(l.title)}</b></p><ul>${l.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul><p>${esc(l.description)}</p><p><b>كلمات البحث:</b> ${esc(l.backend)}</p>`);
  }
  const p = run.posts;
  if (p) {
    for (const [k, label] of [["facebook", "بوست فيسبوك"], ["instagram", "إنستجرام"], ["whatsapp", "رسالة واتساب"], ["tiktok", "سكريبت تيك توك"]]) {
      if (!p[k]) continue;
      t.push("", label, p[k]);
      h.push(`<h2>${label}</h2><p>${esc(p[k]).replace(/\n/g, "<br>")}</p>`);
    }
    if (p.hashtags?.length) { t.push(p.hashtags.join(" ")); h.push(`<p>${esc(p.hashtags.join(" "))}</p>`); }
  }
  if (b.product) h.unshift(`<h1>${esc(b.product)}</h1>`);
  return { text: t.join("\n"), html: h.join("\n") };
}
