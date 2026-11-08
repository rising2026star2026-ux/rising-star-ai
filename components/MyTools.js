"use client";
// «أدواتي»: العميل يختار أدواته، يسجّل في كل أداة بحسابه مرة واحدة، وبعد كده زرار واحد يفتحها كلها.
// بنحفظ الاختيارات على جهازه لحد ما نضيف حسابات. ما بنخزّنش أي باسورد، والدخول بيفضل محفوظ في متصفحه عند كل أداة.
import { useMemo, useState } from "react";
import { APPS, APP_SECTIONS } from "@/lib/apps";
import { useStored, toast } from "@/lib/store";
import BotIcon from "./BotIcon";
import s from "./my-tools.module.css";

const DEFAULT = { sets: [{ id: "all", name: "كل أدواتي", tools: [] }], reg: {}, active: "all" };
const MAX_SETS = 6;
const byKey = Object.fromEntries(APPS.map((a) => [a.slug, a]));

export default function MyTools() {
  const [data, setData] = useStored("my-tools", DEFAULT);
  const [q, setQ] = useState("");
  const [name, setName] = useState("");
  const [blocked, setBlocked] = useState([]);
  const [pickerOpen, setPickerOpen] = useState(null); // null = تلقائي (مفتوحة لو القايمة فاضية)

  const sets = data.sets?.length ? data.sets : DEFAULT.sets;
  const reg = data.reg || {};
  const set = sets.find((x) => x.id === data.active) || sets[0];
  const tools = set.tools.map((k) => byKey[k]).filter(Boolean);
  const ready = tools.filter((t) => reg[t.slug]);

  const save = (patch) => setData({ ...DEFAULT, ...data, sets, ...patch });
  const updateSet = (fn) => save({ sets: sets.map((x) => (x.id === set.id ? fn(x) : x)) });

  const toggleTool = (slug) => { setPickerOpen((v) => (v === null ? true : v)); updateSet((x) => ({ ...x, tools: x.tools.includes(slug) ? x.tools.filter((k) => k !== slug) : [...x.tools, slug] })); };
  const setReg = (slug, v) => save({ reg: { ...reg, [slug]: v } });

  function addSet(e) {
    e.preventDefault();
    const n = name.trim().slice(0, 24);
    if (!n) return;
    if (sets.length >= MAX_SETS) { toast("أقصى عدد مجموعات " + MAX_SETS); return; }
    const id = `s${Date.now().toString(36)}`;
    save({ sets: [...sets, { id, name: n, tools: [] }], active: id });
    setName("");
  }
  function removeSet() {
    if (sets.length < 2) return;
    save({ sets: sets.filter((x) => x.id !== set.id), active: sets.find((x) => x.id !== set.id).id });
  }

  function openAll() {
    const fails = [];
    for (const t of ready) {
      const w = window.open(t.url, "_blank");
      if (w) { try { w.opener = null; } catch {} } else fails.push(t);
    }
    setBlocked(fails);
  }

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    return APPS.filter((a) => !t || `${a.name} ${a.maker} ${a.desc}`.toLowerCase().includes(t));
  }, [q]);

  return (
    <div className={s.root}>
      <div className={s.how}>
        <div><b><em>1</em>اختار أدواتك</b>ضيف الأدوات اللي بتستخدمها من القايمة.</div>
        <div><b><em>2</em>سجّل مرة واحدة</b>اضغط «سجّل» وأنشئ حسابك بنفسك في الأداة، وارجع علّم «سجلت».</div>
        <div><b><em>3</em>افتح الكل</b>بعد كده زرار واحد يفتح كل أدواتك مع بعض.</div>
      </div>

      <div className={s.tabs} role="tablist" aria-label="مجموعات الأدوات">
        {sets.map((x) => (
          <button key={x.id} role="tab" aria-selected={x.id === set.id} type="button" className={`${s.tab} ${x.id === set.id ? s.tabOn : ""}`} onClick={() => save({ active: x.id })}>{x.name} ({x.tools.length})</button>
        ))}
        <form className={s.newSet} onSubmit={addSet}>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="مجموعة جديدة (مثلاً: الشغل)" aria-label="اسم مجموعة جديدة" maxLength={24} />
          <button type="submit" className={s.tab}>+ ضيف</button>
        </form>
        {sets.length > 1 && <button type="button" className={s.tab} onClick={removeSet}>احذف المجموعة دي</button>}
      </div>

      <div className={s.launch}>
        <button type="button" className="btn" onClick={openAll} disabled={!ready.length}>افتح الكل ({ready.length})</button>
        <p>
          {ready.length
            ? <>هيفتح <b>{ready.length}</b> أداة كل واحدة في تبويب. لو المتصفح منع بعضها، اسمح بالنوافذ المنبثقة لموقعنا.</>
            : <>علّم الأدوات اللي سجلت فيها، وهتظهر هنا.</>}
          {" "}الدخول بيفضل شغال لو اخترت «ابقني مسجلاً» في الأداة. وعلى الموبايل افتح أدوات قليلة في المرة.
        </p>
      </div>
      {blocked.length > 0 && (
        <div className={s.blocked} role="status">
          المتصفح منع فتح {blocked.length} أداة. اضغط عليها واحدة واحدة، أو اسمح بالنوافذ المنبثقة وجرّب تاني:<br />
          {blocked.map((t) => <a key={t.slug} href={t.url} target="_blank" rel="noopener noreferrer">{t.name}</a>)}
        </div>
      )}

      {tools.length === 0 ? (
        <div className={s.empty}>لسه مفيش أدوات في «{set.name}». ضيف من القايمة اللي تحت.</div>
      ) : (
        <div className={s.list}>
          {tools.map((t) => (
            <div key={t.slug} className={s.row}>
              <div className={s.rowMain}>
                <BotIcon bot={t} size={44} />
                <span className={s.rowText}><b>{t.name}</b><small>{t.desc}</small></span>
              </div>
              <span className={`${s.state} ${reg[t.slug] ? s.ok : s.todo}`}>{reg[t.slug] ? "مسجّل" : "محتاج تسجيل"}</span>
              <span className={s.acts}>
                {reg[t.slug] ? (
                  <>
                    <a className={`${s.btnLink} ${s.primary}`} href={t.url} target="_blank" rel="noopener noreferrer">افتح ↗</a>
                    <button type="button" onClick={() => setReg(t.slug, false)}>لسه ما سجلتش</button>
                  </>
                ) : (
                  <>
                    <a className={`${s.btnLink} ${s.primary}`} href={t.url} target="_blank" rel="noopener noreferrer">سجّل أول مرة ↗</a>
                    <button type="button" onClick={() => setReg(t.slug, true)}>سجلت ✓</button>
                  </>
                )}
                <button type="button" className={s.x} onClick={() => toggleTool(t.slug)} aria-label={`شيل ${t.name}`}>شيل</button>
              </span>
            </div>
          ))}
        </div>
      )}

      <details className={s.picker} open={pickerOpen ?? tools.length === 0} onToggle={(e) => setPickerOpen(e.currentTarget.open)}>
        <summary>ضيف أدوات</summary>
        <input className={s.search} value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر باسم الأداة" aria-label="دوّر على أداة" />
        {APP_SECTIONS.map((sec) => {
          const items = list.filter((a) => a.section === sec.id);
          if (!items.length) return null;
          return (
            <div key={sec.id}>
              <div className={s.secTitle}>{sec.title}</div>
              <div className={s.pick}>
                {items.map((a) => {
                  const on = set.tools.includes(a.slug);
                  return (
                    <button key={a.slug} type="button" aria-pressed={on} className={`${s.pickItem} ${on ? s.pickOn : ""}`} onClick={() => toggleTool(a.slug)}>
                      <BotIcon bot={a} size={34} />
                      <span>{a.name}</span>
                      <i>{on ? "✓" : "+"}</i>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        <p className={s.note}>الأدوات دي بتفتح في مواقعها الرسمية، وحسابك فيها ملكك أنت. أسماء وشعارات الأدوات ملك شركاتها.</p>
      </details>
    </div>
  );
}
