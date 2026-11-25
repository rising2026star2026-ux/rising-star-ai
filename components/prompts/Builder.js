"use client";
// مولّد البرومبتات: ابنِ بنفسك (فوري) · ولّد لي أفكار (من 10 لـ 100) · حسّن برومبتي · برومبتاتي
import { useEffect, useMemo, useRef, useState } from "react";
import { TYPES, TYPE_BY_ID, emptyState, compile, score, randomize, encodeState, decodeState, criteriaSummary, combinations } from "@/lib/promptbuilder";
import { copyText } from "@/lib/imagefile";
import { toast, useStored } from "@/lib/store";
import s from "./builder.module.css";

export const IMPROVE_HANDOFF = "rs:pb-improve";
const COUNTS = [10, 25, 50, 100];
const CHUNK = 12; // حجم الدفعة الواحدة (البرومبتات الطويلة بتتقطع لو زودنا)
const MODE_LABEL = { build: "ابنِ بنفسك", ideas: "ولّد لي أفكار", improve: "حسّن برومبتي", saved: "برومبتاتي" };
const LIB_TYPE = { image: "image", product: "image", brand: "image", edit: "image", thumb: "image", video: "video", camera: "video", reels: "reels", voice: "reels", text: "chat" };

const parts = (t) => t.split(/(\[[^\]]+\])/g).filter(Boolean);
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

async function api(body, signal) {
  const r = await fetch("/api/prompt-gen", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
  return j;
}

export default function Builder() {
  const [mode, setMode] = useState("build");
  const [st, setSt] = useState(() => emptyState("chat"));
  const [saved, setSaved] = useStored("my-prompts", []);

  // رابط مشارَك، أو برومبت جاي من المكتبة
  useEffect(() => {
    try {
      const m = /[#&]b=([\w-]+)/.exec(location.hash);
      if (m) { const d = decodeState(m[1]); if (d) setSt(d); }
      const raw = sessionStorage.getItem(IMPROVE_HANDOFF);
      if (raw) {
        const h = JSON.parse(raw);
        sessionStorage.removeItem(IMPROVE_HANDOFF);
        setSt((x) => ({ ...x, type: LIB_TYPE[h.cat] || "chat" }));
        setImproveText(String(h.text || "").slice(0, 3500));
        setMode("improve");
      }
    } catch {}
  }, []);

  const type = TYPE_BY_ID[st.type];
  const out = useMemo(() => compile(st), [st]);
  const sc = useMemo(() => score(st), [st]);
  const setType = (id) => setSt((x) => ({ ...emptyState(id), idea: x.idea }));
  const setVal = (id, v) => setSt((x) => ({ ...x, values: { ...x.values, [id]: v } }));
  const toggleMulti = (f, v) => setSt((x) => {
    const cur = Array.isArray(x.values[f.id]) ? x.values[f.id] : [];
    const next = cur.includes(v) ? cur.filter((y) => y !== v) : cur.length >= (f.max || 2) ? [...cur.slice(1), v] : [...cur, v];
    return { ...x, values: { ...x.values, [f.id]: next } };
  });

  async function copy(text, msg = "اتنسخ") { if (await copyText(text)) toast(msg); }
  function save(title, text, t = st.type) {
    if (!text.trim()) return;
    setSaved((list) => [{ id: uid(), type: t, title: (title || text).slice(0, 60), text, at: Date.now() }, ...(list || [])].slice(0, 100));
    toast("اتحفظ في برومبتاتي");
  }
  const shareLink = () => copy(`${location.origin}/prompts/builder#b=${encodeState(st)}`, "اتنسخ رابط بمعاييرك");

  /* ---------- تحويل الموضوع للإنجليزي (لنوع الصور والفيديو) ---------- */
  const [tr, setTr] = useState({ busy: false, err: "" });
  async function toEnglish() {
    setTr({ busy: true, err: "" });
    try {
      const r = await fetch("/api/prompt-en", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: st.idea, kind: st.type === "video" ? "video" : "image" }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "ما قدرناش نحوّل. جرّب تاني.");
      setSt((x) => ({ ...x, idea: j.prompt }));
      setTr({ busy: false, err: "" });
    } catch (e) { setTr({ busy: false, err: e.message }); }
  }
  const hasArabic = /[؀-ۿ]/.test(st.idea);

  /* ---------- ولّد لي أفكار ---------- */
  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(25);
  const [gen, setGen] = useState({ busy: false, items: [], err: "", done: 0 });
  const ctl = useRef(null);
  useEffect(() => () => ctl.current?.abort(), []);

  async function generate(more = false) {
    const t = topic.trim() || st.idea.trim();
    if (t.length < 3) { setGen((g) => ({ ...g, err: "اكتب موضوع أو مجال الأول (كلمتين على الأقل)." })); return; }
    ctl.current?.abort();
    ctl.current = new AbortController();
    const base = more ? gen.items : [];
    setGen({ busy: true, items: base, err: "", done: 0 });
    let items = base;
    let done = 0;
    try {
      while (done < count) {
        const n = Math.min(CHUNK, count - done);
        const j = await api({ mode: "ideas", type: st.type, topic: t, count: n, criteria: criteriaSummary(st), avoid: items.slice(-40).map((x) => x.prompt) }, ctl.current.signal);
        items = [...items, ...j.items];
        done += n;
        setGen({ busy: done < count, items, err: "", done });
      }
    } catch (e) {
      if (e?.name === "AbortError") { setGen((g) => ({ ...g, busy: false })); return; }
      setGen({ busy: false, items, err: items.length > base.length ? `وقفنا عند ${items.length - base.length} برومبت: ${e.message}` : e.message, done });
    }
  }

  /* ---------- حسّن برومبتي ---------- */
  const [improveText, setImproveText] = useState("");
  const [imp, setImp] = useState({ busy: false, res: null, err: "" });
  async function improve() {
    ctl.current?.abort();
    ctl.current = new AbortController();
    setImp({ busy: true, res: null, err: "" });
    try { setImp({ busy: false, res: await api({ mode: "improve", type: st.type, prompt: improveText }, ctl.current.signal), err: "" }); }
    catch (e) { if (e?.name !== "AbortError") setImp({ busy: false, res: null, err: e.message }); }
  }

  const goImprove = (text) => { setImproveText(text); setImp({ busy: false, res: null, err: "" }); setMode("improve"); window.scrollTo({ top: 0, behavior: "smooth" }); };

  return (
    <div className={s.page}>
      <div className={s.stack}>
        <div className={s.tabs} role="tablist" aria-label="الأوضاع">
          {Object.entries(MODE_LABEL).map(([k, v]) => (
            <button key={k} role="tab" type="button" aria-selected={mode === k} onClick={() => setMode(k)}>{k === "saved" ? `${v} (${(saved || []).length})` : v}</button>
          ))}
        </div>

        {mode !== "saved" && (
          <section className={s.card} aria-labelledby="pb-type">
            <h2 id="pb-type">البرومبت ده لإيه؟</h2>
            <div className={s.chips} role="group" aria-label="نوع البرومبت">
              {TYPES.map((t) => (
                <button key={t.id} type="button" className={`${s.chip} ${s.typeChip}`} aria-pressed={st.type === t.id} onClick={() => setType(t.id)}>
                  {t.name}
                </button>
              ))}
            </div>
            <p className={s.note}>{type.hint}. اختيارات المولّد بتديك أكتر من {Math.floor(combinations(st.type) / 1000).toLocaleString("en-US")} ألف تركيبة لنوع «{type.name}».</p>
          </section>
        )}

        {mode === "build" && (
          <div className={s.split}>
              <section className={`${s.card} ${s.gIdea}`}>
                <div className={s.field} style={{ marginBottom: 0 }}>
                  <label className={s.label} htmlFor="pb-idea"><span>{type.ideaLabel}</span><small>{st.idea.length}/600</small></label>
                  <textarea id="pb-idea" className={s.textarea} dir="auto" maxLength={600} value={st.idea} onChange={(e) => setSt((x) => ({ ...x, idea: e.target.value }))} placeholder={type.ideaPlaceholder} />
                  {type.ideaNote && <p className={s.note}>{type.ideaNote}</p>}
                  {type.lang === "en" && hasArabic && (
                    <div className={s.row} style={{ marginTop: 8 }}>
                      <button type="button" className={`${s.btn} ${s.small} ${s.yellow}`} onClick={toEnglish} disabled={tr.busy}>{tr.busy ? "بنحوّل…" : "حوّل للإنجليزي"}</button>
                      {tr.err && <span className={s.note} style={{ color: "#b42318" }}>{tr.err}</span>}
                    </div>
                  )}
                </div>
              </section>

              <section className={`${s.card} ${s.gCrit}`} aria-label="المعايير">
                <div className={s.row} style={{ justifyContent: "space-between", marginBottom: 10 }}>
                  <h2 style={{ margin: 0 }}>المعايير</h2>
                  <div className={s.row}>
                    <button type="button" className={`${s.btn} ${s.small}`} onClick={() => setSt((x) => randomize(x, Date.now()))}>فاجئني</button>
                    <button type="button" className={`${s.btn} ${s.small}`} onClick={() => setSt((x) => ({ ...x, values: {} }))}>امسح الاختيارات</button>
                  </div>
                </div>
                {type.fields.map((f) => (
                  <div key={f.id} className={s.field}>
                    <span className={s.label} id={`pbf-${f.id}`}><span>{f.label}</span>{f.kind === "multi" && <small>لحد {f.max || 2}</small>}</span>
                    {f.kind === "text" ? (
                      <input className={s.input} dir="auto" aria-labelledby={`pbf-${f.id}`} maxLength={400} value={st.values[f.id] || ""} onChange={(e) => setVal(f.id, e.target.value)} placeholder={f.placeholder} />
                    ) : (
                      <div className={s.chips} role="group" aria-labelledby={`pbf-${f.id}`}>
                        {f.options.map((op) => {
                          const on = f.kind === "multi" ? (st.values[f.id] || []).includes(op.v) : st.values[f.id] === op.v;
                          return (
                            <button key={op.v} type="button" className={s.chip} aria-pressed={on}
                              onClick={() => (f.kind === "multi" ? toggleMulti(f, op.v) : setVal(f.id, on ? "" : op.v))}>{op.label}</button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ))}
              </section>

            <div className={s.gPrev}>
              <section className={`${s.card} ${s.sticky}`} aria-live="polite" aria-labelledby="pb-prev">
                <h2 id="pb-prev">البرومبت جاهز</h2>
                <div className={`${s.meter} ${s["l_" + sc.level]}`} style={{ margin: "6px 0 12px" }}>
                  <span className={s.meterBar} role="img" aria-label={`جودة البرومبت ${sc.score} من 100`}><i style={{ "--p": `${sc.score}%` }} /></span>
                  <b>{sc.score}</b>
                </div>
                <div className={s.preview}>
                  <p className={s.pText} dir={out.lang === "en" ? "ltr" : "rtl"}>{parts(out.prompt).map((x, i) => (/^\[[^\]]+\]$/.test(x) ? <mark key={i}>{x}</mark> : <span key={i}>{x}</span>))}</p>
                  {out.negative ? <p className={s.neg}><b>Negative prompt:</b> {out.negative}</p> : null}
                  <div className={s.pActions}>
                    <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => copy(out.prompt + (out.negative ? `\n\nNegative prompt: ${out.negative}` : ""))}>نسخ</button>
                    <button type="button" className={s.btn} onClick={() => save(st.idea, out.prompt + (out.negative ? `\n\nNegative prompt: ${out.negative}` : ""))}>احفظ</button>
                    <button type="button" className={s.btn} onClick={shareLink}>رابط بمعاييري</button>
                    <button type="button" className={s.btn} onClick={() => goImprove(out.prompt)}>حسّنه بالذكاء</button>
                  </div>
                </div>
                {sc.tips.length > 0 && <ul className={s.tips}>{sc.tips.map((x) => <li key={x}>{x}</li>)}</ul>}
              </section>
            </div>
          </div>
        )}

        {mode === "ideas" && (
          <section className={s.card} aria-labelledby="pb-gen">
            <h2 id="pb-gen">ولّد لي برومبتات جديدة</h2>
            <p className={s.sub}>اكتب المجال، وهنولّد لك برومبتات مختلفة كل واحد بزاوية، بنفس المعايير اللي اخترتها في «ابنِ بنفسك».</p>
            <div className={s.field}>
              <label className={s.label} htmlFor="pb-topic"><span>المجال أو الموضوع</span></label>
              <input id="pb-topic" className={s.input} dir="auto" value={topic} maxLength={400} onChange={(e) => setTopic(e.target.value)} placeholder="مثلاً: متجر ملابس أطفال على فيسبوك" />
            </div>
            {criteriaSummary(st) && (
              <div className={s.crit} aria-label="المعايير المطبّقة">{criteriaSummary(st).split("\n").map((l) => <span key={l}>{l}</span>)}</div>
            )}
            <div className={s.field}>
              <span className={s.label}><span>كام برومبت؟</span><small>العدد الكبير بياخد دقيقة أو أكتر</small></span>
              <div className={s.chips} role="group" aria-label="العدد">
                {COUNTS.map((c) => <button key={c} type="button" className={s.chip} aria-pressed={count === c} onClick={() => setCount(c)}>{c}</button>)}
              </div>
            </div>
            <div className={s.row}>
              <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => generate(false)} disabled={gen.busy}>{gen.busy ? "بنولّد…" : "ولّد"}</button>
              {gen.busy && <button type="button" className={s.btn} onClick={() => ctl.current?.abort()}>إيقاف</button>}
              {!gen.busy && gen.items.length > 0 && <button type="button" className={s.btn} onClick={() => generate(true)}>ولّد {count} كمان</button>}
              {gen.items.length > 0 && <button type="button" className={s.btn} onClick={() => copy(gen.items.map((x, i) => `${i + 1}. ${x.title}\n${x.prompt}`).join("\n\n"), "اتنسخوا كلهم")}>انسخ الكل</button>}
            </div>
            {gen.busy && <div className={s.progress} style={{ marginTop: 12 }} role="progressbar" aria-valuenow={gen.done} aria-valuemax={count}><i style={{ "--p": `${Math.max(6, (gen.done / count) * 100)}%` }} /></div>}
            {gen.err && <p className={s.err} role="alert">{gen.err}</p>}
            {gen.items.length > 0 && (
              <div className={s.results} style={{ marginTop: 14 }} aria-live="polite">
                {gen.items.map((it, i) => (
                  <article key={i} className={s.item}>
                    <h3>{it.title}<span className={s.tag}>{i + 1}</span></h3>
                    <p dir="auto">{parts(it.prompt).map((x, k) => (/^\[[^\]]+\]$/.test(x) ? <mark key={k} style={{ background: "#fff3c4", borderRadius: 5, padding: "0 3px" }}>{x}</mark> : <span key={k}>{x}</span>))}</p>
                    <div className={s.row}>
                      <button type="button" className={`${s.btn} ${s.small} ${s.primary}`} onClick={() => copy(it.prompt)}>نسخ</button>
                      <button type="button" className={`${s.btn} ${s.small}`} onClick={() => save(it.title, it.prompt)}>احفظ</button>
                      <button type="button" className={`${s.btn} ${s.small}`} onClick={() => goImprove(it.prompt)}>حسّنه</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {mode === "improve" && (
          <section className={s.card} aria-labelledby="pb-imp">
            <h2 id="pb-imp">حسّن برومبتك</h2>
            <p className={s.sub}>الصق أي برومبت ضعيف. هنعيد كتابته بهيكل أوضح من غير ما نغيّر المطلوب، ونقولك إيه اللي اتغيّر وإيه المعلومة الناقصة.</p>
            <div className={s.field}>
              <label className={s.label} htmlFor="pb-draft"><span>برومبتك</span><small>{improveText.length}/3500</small></label>
              <textarea id="pb-draft" className={s.textarea} dir="auto" style={{ minHeight: 130 }} maxLength={3500} value={improveText} onChange={(e) => setImproveText(e.target.value)} placeholder="مثلاً: اكتب لي بوست عن الحلل" />
            </div>
            <button type="button" className={`${s.btn} ${s.primary}`} onClick={improve} disabled={imp.busy || improveText.trim().length < 8}>{imp.busy ? "بنحسّن…" : "حسّن"}</button>
            {imp.err && <p className={s.err} role="alert">{imp.err}</p>}
            {imp.res && (
              <div className={s.stack} style={{ marginTop: 14 }} aria-live="polite">
                <div className={s.preview}>
                  <p className={s.pText} dir="auto">{imp.res.improved}</p>
                  <div className={s.pActions}>
                    <button type="button" className={`${s.btn} ${s.primary}`} onClick={() => copy(imp.res.improved)}>نسخ</button>
                    <button type="button" className={s.btn} onClick={() => save(improveText, imp.res.improved)}>احفظ</button>
                  </div>
                </div>
                <div><b style={{ fontSize: "0.92rem" }}>اللي اتحسّن:</b><ul className={s.changes}>{imp.res.changes.map((c) => <li key={c}>{c}</li>)}</ul></div>
                {imp.res.missing.length > 0 && <div><b style={{ fontSize: "0.92rem" }}>لو جاوبت على دول البرومبت هيبقى أقوى:</b><ul className={s.changes}>{imp.res.missing.map((c) => <li key={c}>{c}</li>)}</ul></div>}
              </div>
            )}
          </section>
        )}

        {mode === "saved" && (
          <section className={s.card} aria-labelledby="pb-saved">
            <div className={s.row} style={{ justifyContent: "space-between" }}>
              <h2 id="pb-saved" style={{ margin: 0 }}>برومبتاتي</h2>
              {(saved || []).length > 0 && <button type="button" className={`${s.btn} ${s.small}`} onClick={() => copy(saved.map((x) => `${x.title}\n${x.text}`).join("\n\n———\n\n"), "اتنسخوا كلهم")}>انسخ الكل</button>}
            </div>
            <p className={s.sub}>بتتحفظ على جهازك بس (لحد 100).</p>
            {!(saved || []).length ? <p className={s.note}>لسه ما حفظتش حاجة. اضغط «احفظ» تحت أي برومبت.</p> : (
              <div className={s.results}>
                {saved.map((it) => (
                  <article key={it.id} className={s.item}>
                    <h3>{it.title}<span className={s.tag}>{TYPE_BY_ID[it.type]?.name || it.type}</span></h3>
                    <p dir="auto">{it.text}</p>
                    <div className={s.row}>
                      <button type="button" className={`${s.btn} ${s.small} ${s.primary}`} onClick={() => copy(it.text)}>نسخ</button>
                      <button type="button" className={`${s.btn} ${s.small}`} onClick={() => { setSt((x) => ({ ...x, type: it.type })); goImprove(it.text); }}>حسّنه</button>
                      <button type="button" className={`${s.btn} ${s.small}`} onClick={() => setSaved((l) => l.filter((x) => x.id !== it.id))}>احذف</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
