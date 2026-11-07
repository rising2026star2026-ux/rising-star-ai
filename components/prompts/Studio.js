"use client";
// استوديو البرومبتات: فيديو · صورة · شات · هوك · إعلان. الكتابة على السيرفر (/api/prompt-studio) والمراجعة بالكود.
import { useEffect, useRef, useState } from "react";
import { KINDS, KIND_IDS } from "@/lib/promptstudio";
import { copyText } from "@/lib/imagefile";
import { toast, useStored } from "@/lib/store";
import s from "./studio.module.css";

// نوع الحفظ في «برومبتاتي» (نفس أنواع المولّد القديم عشان زرار «حسّنه» يفضل شغال)
const SAVE_TYPE = { video: "video", image: "image", chat: "chat", hook: "reels", ad: "ad" };
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const MAX_ITEMS = 40;

const mainText = (kind, it) => (kind === "hook" ? it.hook : kind === "ad" ? it.primary : it.prompt);

function allText(kind, it) {
  if (kind === "video") {
    const shots = it.shots?.length ? `\n\nShots:\n${it.shots.map((x) => `${x.time} | ${x.camera} | ${x.action}`).join("\n")}` : "";
    return `${it.prompt}${it.audio ? `\n\nAudio: ${it.audio}` : ""}${shots}${it.negative ? `\n\nNegative: ${it.negative}` : ""}`;
  }
  if (kind === "image") return `${it.prompt}${it.params ? ` ${it.params}` : ""}${it.negative ? `\n\nNegative: ${it.negative}` : ""}`;
  if (kind === "hook") return `${it.hook}\nالمشهد: ${it.visual}\nالنص على الشاشة: ${it.screenText}`;
  if (kind === "ad") {
    const script = it.script?.length ? `\n\nالسكريبت:\n${it.script.map((x) => `${x.time} | ${x.say} | ${x.show} | ${x.text}`).join("\n")}` : "";
    return `${it.primary}\n\nالعنوان: ${it.headline}\nالوصف: ${it.description}\nالزرار: ${it.cta}\n\nالتصميم (${it.creative.type === "video" ? "فيديو" : "صورة"}): ${it.creative.brief}${script}`;
  }
  return it.prompt;
}

async function call(body, signal) {
  const r = await fetch("/api/prompt-studio", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), signal });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
  return j.items;
}

const defaults = (K) => ({ target: K.targets[0].v, count: K.counts[Math.min(1, K.counts.length - 1)], values: {} });

export default function Studio() {
  const [kind, setKind] = useState("video");
  const K = KINDS[kind];
  const [form, setForm] = useState(() => ({ video: defaults(KINDS.video), image: defaults(KINDS.image), chat: defaults(KINDS.chat), hook: defaults(KINDS.hook), ad: defaults(KINDS.ad) }));
  const [idea, setIdea] = useState("");
  const [st, setSt] = useState({ busy: false, items: [], err: "", kind: "video" });
  const [, setSaved] = useStored("my-prompts", []);
  const ctl = useRef(null);
  const resRef = useRef(null);
  useEffect(() => () => ctl.current?.abort(), []);

  const f = form[kind];
  const patch = (p) => setForm((x) => ({ ...x, [kind]: { ...x[kind], ...p } }));
  const setVal = (id, v) => patch({ values: { ...f.values, [id]: f.values[id] === v ? undefined : v } });
  const pickKind = (k) => { ctl.current?.abort(); setKind(k); setSt({ busy: false, items: [], err: "", kind: k }); };

  const visible = K.fields.filter((fl) => !fl.when || Object.entries(fl.when).every(([id, v]) => f.values[id] === v));

  async function generate(more = false) {
    if (idea.trim().length < 3) { setSt((x) => ({ ...x, err: "اكتب فكرتك الأول (كلمتين على الأقل)." })); return; }
    ctl.current?.abort();
    ctl.current = new AbortController();
    const base = more && st.kind === kind ? st.items : [];
    setSt({ busy: true, items: base, err: "", kind });
    try {
      const items = await call({ kind, idea, target: f.target, count: f.count, values: f.values, avoid: base.map((x) => mainText(kind, x)) }, ctl.current.signal);
      setSt({ busy: false, items: [...items, ...base].slice(0, MAX_ITEMS), err: "", kind });
      // على الموبايل النتايج تحت الفورم، فننزل لها
      if (window.innerWidth < 900) requestAnimationFrame(() => resRef.current?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" }));
    } catch (e) {
      if (e?.name === "AbortError") return;
      setSt({ busy: false, items: base, err: e.message, kind });
    }
  }

  async function copy(text, msg = "اتنسخ") { if (await copyText(text)) toast(msg); }
  function save(it) {
    const text = allText(kind, it);
    setSaved((list) => [{ id: uid(), type: SAVE_TYPE[kind], title: String(it.title || it.angle || it.hook || "برومبت").slice(0, 60), text, at: Date.now() }, ...(list || [])].slice(0, 100));
    toast("اتحفظ في برومبتاتي");
  }

  const shown = st.kind === kind ? st.items : [];
  const actions = (it) => (
    <div className={s.row}>
      <button type="button" className={`${s.btn} ${s.small} ${s.primary}`} onClick={() => copy(mainText(kind, it))}>{kind === "ad" ? "نسخ النص" : kind === "hook" ? "نسخ الهوك" : "نسخ البرومبت"}</button>
      {(kind === "video" || kind === "image" || kind === "ad" || kind === "hook") && <button type="button" className={`${s.btn} ${s.small}`} onClick={() => copy(allText(kind, it), "اتنسخ كله")}>نسخ الكل</button>}
      <button type="button" className={`${s.btn} ${s.small}`} onClick={() => save(it)}>احفظ</button>
    </div>
  );

  return (
    <div className={s.page}>
      <div className={s.kinds} role="tablist" aria-label="نوع البرومبت">
        {KIND_IDS.map((k) => (
          <button key={k} role="tab" type="button" className={s.kind} aria-selected={kind === k} onClick={() => pickKind(k)}>
            <b>{KINDS[k].name}</b>
            <small>{KINDS[k].short}</small>
          </button>
        ))}
      </div>

      <div className={s.split}>
        <section className={`${s.card} ${s.sticky}`} aria-label="المعايير">
          <div>
            <label className={s.label} htmlFor="st-idea">{K.ideaLabel}<small>تقدر تكتب بالعربي</small></label>
            <textarea id="st-idea" className={s.textarea} value={idea} maxLength={600} onChange={(e) => setIdea(e.target.value)} placeholder={K.placeholder} />
          </div>

          <div>
            <p className={s.label}>{K.targetLabel}</p>
            <div className={s.chips}>
              {K.targets.map((t) => <button key={t.v} type="button" className={s.chip} aria-pressed={f.target === t.v} onClick={() => patch({ target: t.v })}>{t.label}</button>)}
            </div>
          </div>

          {visible.map((fl) => (
            <div key={fl.id}>
              <p className={s.label}>{fl.label}</p>
              {fl.kind === "text"
                ? <input className={s.input} value={f.values[fl.id] || ""} maxLength={300} onChange={(e) => patch({ values: { ...f.values, [fl.id]: e.target.value } })} placeholder={fl.placeholder} aria-label={fl.label} />
                : <div className={s.chips}>{fl.options.map((op) => <button key={op.v} type="button" className={s.chip} aria-pressed={f.values[fl.id] === op.v} onClick={() => setVal(fl.id, op.v)}>{op.label}</button>)}</div>}
            </div>
          ))}

          <div>
            <p className={s.label}>عدد النتائج</p>
            <div className={s.chips}>
              {K.counts.map((c) => <button key={c} type="button" className={s.chip} aria-pressed={f.count === c} onClick={() => patch({ count: c })}>{c}</button>)}
            </div>
          </div>

          <button type="button" className={`${s.btn} ${s.primary} ${s.go}`} disabled={st.busy} onClick={() => generate(false)}>{st.busy ? "بنكتب لك…" : "ولّد"}</button>
          {kind === "video" && <p className={s.note}>الصيغة بتتظبط لكل مولّد بإرشادات عامة. جرّب النسخة وعدّل عليها حسب نتيجتك.</p>}
          {kind === "image" && f.values.text && <p className={s.note}>الكتابة العربية جوه الصور بتطلع غلط في أغلب المولّدات. لو اتقطّعت، الأضمن تضيفها بعد كده في أداة تصميم.</p>}
          {kind === "ad" && <p className={s.note}>مش بنكتب سعر ولا خصم ولا ضمان من عندنا. أي حاجة مش موجودة في كلامك بتتشال.</p>}
        </section>

        <section ref={resRef} className={s.results} aria-live="polite" aria-label="النتائج" style={{ scrollMarginTop: 72 }}>
          {st.err && <p className={s.err} role="alert">{st.err}</p>}
          {st.busy && <div className={s.skel} aria-hidden="true"><i /><i /><i /></div>}
          {!st.busy && !shown.length && !st.err && <div className={s.empty}>اكتب فكرتك واختار المولّد، وهنطلّع لك برومبتات جاهزة تنسخها وتحطها فيه.</div>}

          {shown.map((it, i) => (
            <article key={`${kind}-${i}-${mainText(kind, it).slice(0, 20)}`} className={s.item}>
              {kind === "hook" ? (
                <div className={s.hookRow}>
                  <h3><span className={s.tag}>{it.formulaLabel}</span></h3>
                  <p className={s.hookText} dir="auto">{it.hook}</p>
                  <span className={s.meta}><span>{it.words} كلمة</span><span>حوالي {it.seconds} ثانية</span></span>
                  {it.visual && <p className={s.soft}><span className={s.k}>أول لقطة</span>{it.visual}</p>}
                  {it.screenText && <p className={s.soft}><span className={s.k}>النص على الشاشة</span>{it.screenText}</p>}
                </div>
              ) : kind === "ad" ? (
                <>
                  <h3>{it.angle}<span className={s.tag}>{it.cta}</span></h3>
                  <p className={s.soft} dir="auto"><span className={s.k}>النص ({it.counts.primary} حرف)</span>{it.primary}</p>
                  <p className={s.soft} dir="auto"><span className={s.k}>العنوان ({it.counts.headline} حرف)</span>{it.headline}</p>
                  {it.description && <p className={s.soft} dir="auto"><span className={s.k}>الوصف ({it.counts.description} حرف)</span>{it.description}</p>}
                  {it.creative.brief && <p className={s.soft} dir="auto"><span className={s.k}>التصميم المقترح ({it.creative.type === "video" ? "فيديو" : "صورة"})</span>{it.creative.brief}</p>}
                  {it.script.length > 0 && (
                    <div className={s.soft}><span className={s.k}>سكريبت الفيديو</span>
                      <ul className={s.shots} style={{ direction: "rtl", textAlign: "start" }}>
                        {it.script.map((x, j) => <li key={j} style={{ direction: "rtl", textAlign: "start" }}><b>{x.time}</b><span>{x.say}{x.show ? ` (${x.show})` : ""}{x.text ? ` [${x.text}]` : ""}</span></li>)}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3>{it.title}{it.words ? <span className={s.tag}>{it.words} كلمة</span> : null}</h3>
                  <pre className={`${s.box} ${kind === "chat" ? "" : s.ltr}`} dir={kind === "chat" ? "auto" : "ltr"}>{it.prompt}{it.params ? `  ${it.params}` : ""}</pre>
                  {kind === "video" && it.shots.length > 0 && (
                    <div className={s.soft}><span className={s.k}>اللقطات</span>
                      <ul className={s.shots}>{it.shots.map((x, j) => <li key={j}><b>{x.time}</b><span>{x.camera} — {x.action}</span></li>)}</ul>
                    </div>
                  )}
                  {it.audio && <p className={`${s.soft} ${s.ltr}`} dir="auto"><span className={s.k}>الصوت</span>{it.audio}</p>}
                  {it.negative && <p className={`${s.soft} ${s.ltr}`}><span className={s.k}>Negative</span>{it.negative}</p>}
                  {it.note && <p className={s.note}>{it.note}</p>}
                </>
              )}
              {actions(it)}
            </article>
          ))}

          {!st.busy && shown.length > 0 && (
            <div className={s.row}>
              <button type="button" className={`${s.btn} ${s.small}`} onClick={() => generate(true)}>غيّر وهات نسخ جديدة</button>
              <button type="button" className={`${s.btn} ${s.small}`} onClick={() => copy(shown.map((x) => allText(kind, x)).join("\n\n———\n\n"), "اتنسخوا كلهم")}>انسخ الكل</button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
