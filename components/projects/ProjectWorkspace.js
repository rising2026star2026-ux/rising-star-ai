"use client";
// مشروع مفتوح: صفحة المشروع (الملفات والتعليمات والمحادثات) والشات نفسه، وكل محادثة فاكرة الملفات والتعليمات
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MainChat, { DOC_ACTIONS, nFiles } from "@/components/MainChat";
import { getProject, saveProject, deleteProject, getThread, saveThread, deleteThread, templateOf, uid, ICONS } from "@/lib/projects";
import { useAttach } from "@/lib/useAttach";
import { ACCEPT, KIND_ICON, docLabel, MAX_ALL } from "@/lib/docs";
import { toast } from "@/lib/store";
import { ago, countLabel } from "./time";
import ps from "./projects.module.css";

const MAX_INSTR = 4000;
const sig = (m) => (m.length ? `${m.length}:${(m[m.length - 1].content || "").length}` : "");

const Chevron = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6" /></svg>
);

export default function ProjectWorkspace({ id }) {
  const router = useRouter();
  const [project, setProject] = useState(undefined); // undefined = بيحمّل، null = مش موجود
  const ref = useRef(null);
  const queue = useRef(Promise.resolve());
  const tidRef = useRef(null);
  const savedSig = useRef("");
  const [inThread, setInThread] = useState(false);
  const [initial, setInitial] = useState([]);
  const [chatKey, setChatKey] = useState(0);
  const [sheet, setSheet] = useState(null); // "files" | "instructions" | null

  useEffect(() => {
    getProject(id).then((p) => { ref.current = p || null; setProject(p || null); }).catch(() => setProject(null));
  }, [id]);

  // كل الكتابة على الجهاز بالدور، عشان حفظ محادثة ورفع ملف في نفس اللحظة ما يمسحوش بعض
  function update(fn) {
    queue.current = queue.current
      .then(async () => {
        if (!ref.current) return;
        const next = await fn(ref.current);
        if (next) { ref.current = next; setProject(next); }
      })
      .catch(() => toast("ما قدرناش نحفظ على الجهاز. ممكن المساحة خلصت."));
    return queue.current;
  }

  const addDoc = (d) => update((p) => saveProject({ ...p, docs: [...(p.docs || []), d] }));
  const removeDoc = (docId) => update((p) => saveProject({ ...p, docs: (p.docs || []).filter((x) => x.id !== docId) }));
  const sheetAttach = useAttach({ docs: project?.docs || [], onAdd: addDoc });

  function onMessages(messages) {
    if (!messages.length) return;
    const now = sig(messages);
    if (now === savedSig.current) return;
    savedSig.current = now;
    if (!tidRef.current) tidRef.current = uid();
    const tid = tidRef.current;
    update((p) => saveThread(p, tid, messages));
  }

  function goHome() {
    tidRef.current = null;
    savedSig.current = "";
    setInitial([]);
    setInThread(false);
    setChatKey((k) => k + 1);
  }

  async function openThread(tid) {
    const m = await getThread(id, tid);
    tidRef.current = tid;
    savedSig.current = sig(m);
    setInitial(m);
    setInThread(m.length > 0);
    setChatKey((k) => k + 1);
    window.scrollTo({ top: 0 });
  }

  if (project === undefined) return <div className={ps.loadingPage}><span className={ps.spin} /> بنفتح المشروع…</div>;
  if (project === null) {
    return (
      <div className={ps.missing}>
        <i aria-hidden="true">🗂️</i>
        <h1>المشروع ده مش على الجهاز ده</h1>
        <p>المشاريع محفوظة على الجهاز اللي اتعملت عليه بس. لو فتحت الرابط من موبايل أو متصفح تاني مش هتلاقيه هنا.</p>
        <Link href="/projects" className={ps.cta}>روح لمشاريعك</Link>
      </div>
    );
  }

  const docs = project.docs || [];
  const tpl = templateOf(project.template);

  return (
    <>
      <MainChat
        key={chatKey}
        project={project}
        initialMessages={initial}
        onMessages={onMessages}
        onAttach={addDoc}
        onNewChat={goHome}
        onStart={() => setInThread(true)}
        onShowFiles={() => setSheet("files")}
        placeholder={docs.length ? `اسأل في «${project.name}»… المحادثة بتقرا ${nFiles(docs.length)}` : `اكتب أول سؤال في «${project.name}»…`}
        barStart={
          <>
            <Link href="/projects" className={ps.back} aria-label="كل المشاريع" title="كل المشاريع"><Chevron /></Link>
            {inThread ? (
              <button type="button" className={ps.projPill} onClick={goHome} title="صفحة المشروع">
                <i aria-hidden="true">{project.icon}</i><b dir="auto">{project.name}</b>
              </button>
            ) : (
              <span className={ps.projPill}><i aria-hidden="true">{project.icon}</i><b dir="auto">{project.name}</b></span>
            )}
          </>
        }
        hero={({ send, addFiles, reading }) => (
          <ProjectHome
            project={project}
            tpl={tpl}
            send={send}
            addFiles={addFiles}
            reading={reading}
            onOpen={openThread}
            onSheet={setSheet}
            onRename={(name, icon) => update((p) => saveProject({ ...p, name, icon }))}
            onDeleteThread={(tid) => update((p) => deleteThread(p, tid))}
            onDeleteProject={async () => { await queue.current; await deleteProject(ref.current); router.push("/projects"); }}
          />
        )}
      />

      {sheet && (
        <Sheet title={sheet === "files" ? "ملفات المشروع" : "تعليمات المشروع"} onClose={() => setSheet(null)}>
          {sheet === "files" ? (
            <FilesPanel docs={docs} attach={sheetAttach} onRemove={removeDoc} hint={tpl.files} />
          ) : (
            <InstructionsPanel
              value={project.instructions || ""}
              tpl={tpl}
              onSave={async (text) => { await update((p) => saveProject({ ...p, instructions: text })); toast("التعليمات اتحفظت، وكل محادثة جاية هتمشي عليها"); setSheet(null); }}
            />
          )}
        </Sheet>
      )}
    </>
  );
}

function ProjectHome({ project, tpl, send, addFiles, reading, onOpen, onSheet, onRename, onDeleteThread, onDeleteProject }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(project.name);
  const [icon, setIcon] = useState(project.icon);
  const [confirm, setConfirm] = useState(""); // id المحادثة أو "project"
  const fileRef = useRef(null);
  const docs = project.docs || [];
  const threads = project.threads || [];
  const starters = [
    ...(docs.length ? DOC_ACTIONS.slice(0, 2).map((a) => (docs.length > 1 ? { ...a, label: a.label.replace("الملف", "الملفات"), q: a.q.replace(/الملف/g, "الملفات") } : a)) : []),
    ...tpl.starters.map((q) => ({ label: q, q })),
  ];

  function saveName() {
    const n = name.trim().slice(0, 80) || project.name;
    onRename(n, icon);
    setName(n);
    setEditing(false);
  }

  return (
    <div className={ps.home}>
      <header className={ps.head}>
        <span className={ps.bigIcon} aria-hidden="true">{editing ? icon : project.icon}</span>
        <div className={ps.headText}>
          {editing ? (
            <form onSubmit={(e) => { e.preventDefault(); saveName(); }} className={ps.renameForm}>
              <label className="sr" htmlFor="proj-name">اسم المشروع</label>
              <input id="proj-name" className={ps.input} value={name} maxLength={80} autoFocus onChange={(e) => setName(e.target.value)} />
              <div className={ps.iconRow} role="group" aria-label="أيقونة المشروع">
                {ICONS.map((ic) => (
                  <button key={ic} type="button" aria-pressed={icon === ic} onClick={() => setIcon(ic)}>{ic}</button>
                ))}
              </div>
              <div className={ps.rowBtns}>
                <button type="submit" className={ps.miniBtn}>حفظ</button>
                <button type="button" className={ps.textBtn} onClick={() => { setEditing(false); setName(project.name); setIcon(project.icon); }}>إلغاء</button>
              </div>
            </form>
          ) : (
            <>
              <h1 dir="auto">{project.name}</h1>
              <p>كل محادثة هنا بتقرا ملفات المشروع وبتمشي على تعليماته.</p>
            </>
          )}
        </div>
        {!editing && <button type="button" className={ps.textBtn} onClick={() => setEditing(true)}>تعديل الاسم</button>}
      </header>

      <div className={ps.boxes}>
        <section className={ps.box}>
          <div className={ps.boxHead}>
            <h2><i aria-hidden="true">📁</i>الملفات</h2>
            <span className={ps.count}>{docs.length ? nFiles(docs.length) : ""}</span>
            <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden data-testid="project-file" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            {docs.length > 0 && <button type="button" className={ps.miniBtn} onClick={() => fileRef.current?.click()} disabled={reading}>+ ارفع</button>}
          </div>
          {docs.length ? (
            <>
              <ul className={ps.docList}>
                {docs.slice(0, 4).map((d) => (
                  <li key={d.id}><i aria-hidden="true">{KIND_ICON[d.kind] || "📄"}</i><b dir="auto">{d.name}</b><small>{docLabel(d)}</small></li>
                ))}
              </ul>
              <button type="button" className={ps.textBtn} onClick={() => onSheet("files")}>{docs.length > 4 ? `كل الملفات (${docs.length})` : "إدارة الملفات"}</button>
            </>
          ) : (
            <button type="button" className={ps.drop} onClick={() => fileRef.current?.click()} disabled={reading}>
              <b>{reading ? "بنقرا الملف…" : "+ ارفع ملفات المشروع"}</b>
              <small>{tpl.files ? `زي: ${tpl.files}` : "PDF أو Word أو صور أو ملفات نص"}</small>
            </button>
          )}
        </section>

        <section className={ps.box}>
          <div className={ps.boxHead}>
            <h2><i aria-hidden="true">🧭</i>التعليمات</h2>
            <span className={ps.count} />
            {project.instructions && <button type="button" className={ps.miniBtn} onClick={() => onSheet("instructions")}>تعديل</button>}
          </div>
          {project.instructions ? (
            <p className={ps.instr} dir="auto">{project.instructions}</p>
          ) : (
            <button type="button" className={ps.drop} onClick={() => onSheet("instructions")}>
              <b>+ اكتب تعليمات المشروع</b>
              <small>قول للمساعد يشتغل إزاي هنا، مثلاً: «رد بالفصحى وفي نقاط قصيرة»</small>
            </button>
          )}
        </section>
      </div>

      {starters.length > 0 && (
        <div className={ps.starters}>
          <span>ابدأ بـ:</span>
          {starters.map((a) => (
            <button key={a.label} type="button" onClick={() => send(a.q)} disabled={reading}>{a.label}</button>
          ))}
        </div>
      )}

      <section className={ps.chats}>
        <h2>المحادثات <small>{threads.length ? countLabel(threads.length, "محادثة") : ""}</small></h2>
        {threads.length ? (
          <ul>
            {threads.map((t) => (
              <li key={t.id}>
                <button type="button" className={ps.chatItem} onClick={() => onOpen(t.id)}>
                  <b dir="auto">{t.title}</b>
                  <small>{ago(t.updated)}</small>
                </button>
                {confirm === t.id ? (
                  <button type="button" className={ps.danger} onClick={() => { onDeleteThread(t.id); setConfirm(""); }}>تأكيد الحذف</button>
                ) : (
                  <button type="button" className={ps.x} onClick={() => setConfirm(t.id)} aria-label={`حذف «${t.title}»`}>✕</button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={ps.emptyNote}>لسه مفيش محادثات. اكتب أول سؤال في الخانة اللي تحت، وكل محادثة هتتحفظ هنا.</p>
        )}
      </section>

      <div className={ps.foot}>
        <p>المشروع محفوظ على الجهاز ده بس. الملف نفسه مبيترفعش، الكلام اللي فيه بس هو اللي بيتبعت مع سؤالك.</p>
        {confirm === "project" ? (
          <span className={ps.rowBtns}>
            <button type="button" className={ps.danger} onClick={onDeleteProject}>امسح المشروع بملفاته ومحادثاته</button>
            <button type="button" className={ps.textBtn} onClick={() => setConfirm("")}>رجوع</button>
          </span>
        ) : (
          <button type="button" className={ps.textBtn} onClick={() => setConfirm("project")}>حذف المشروع</button>
        )}
      </div>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  useEffect(() => {
    const k = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <div className={ps.sheetWrap} role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className={ps.scrim} onClick={onClose} aria-label="قفل" />
      <div className={ps.sheet}>
        <div className={ps.sheetHead}>
          <h2>{title}</h2>
          <button type="button" className={ps.x} onClick={onClose} aria-label="قفل">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function FilesPanel({ docs, attach, onRemove, hint }) {
  const fileRef = useRef(null);
  const [confirm, setConfirm] = useState("");
  const used = docs.reduce((n, d) => n + d.chars, 0);
  const pct = Math.min(100, Math.round((used / MAX_ALL) * 100));
  return (
    <div className={ps.panel}>
      <p className={ps.panelNote}>كل محادثة في المشروع بتقرا الملفات دي. ارفع {hint || "المراجع والمستندات اللي محتاجها"}.</p>
      <input ref={fileRef} type="file" accept={ACCEPT} multiple hidden onChange={(e) => { attach.addFiles(e.target.files); e.target.value = ""; }} />
      <button type="button" className={ps.drop} onClick={() => fileRef.current?.click()} disabled={attach.pending.length > 0}>
        <b>+ ارفع ملفات</b>
        <small>PDF وWord وصور ومستندات مصوّرة وملفات نص، لحد 25 ميجا للملف</small>
      </button>
      {attach.pending.map((p) => (
        <div key={p.id} className={ps.pendingRow}><span className={ps.spin} /><b dir="auto">{p.name}</b><small>{p.note}</small></div>
      ))}
      {attach.note && <div className={ps.warn} role="status">{attach.note}</div>}
      {docs.length > 0 && (
        <ul className={ps.docList}>
          {docs.map((d) => (
            <li key={d.id}>
              <i aria-hidden="true">{KIND_ICON[d.kind] || "📄"}</i>
              <b dir="auto">{d.name}</b>
              <small>{docLabel(d)}{d.ocred ? " • مقروء من صور" : ""}</small>
              {confirm === d.id ? (
                <button type="button" className={ps.danger} onClick={() => { onRemove(d.id); setConfirm(""); }}>تأكيد</button>
              ) : (
                <button type="button" className={ps.x} onClick={() => setConfirm(d.id)} aria-label={`شيل ${d.name}`}>✕</button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className={ps.meter} aria-label={`المساحة المستخدمة ${pct}%`}>
        <div><i style={{ width: `${Math.max(pct, docs.length ? 2 : 0)}%` }} /></div>
        <small>مساحة الملفات: حوالي {Math.round(used / 2000)} من {Math.round(MAX_ALL / 2000)} صفحة</small>
      </div>
    </div>
  );
}

const EXAMPLES = [
  "رد بالعربي الفصحى ومن غير عامية",
  "اكتب في نقاط قصيرة وابدأ بالخلاصة",
  "أنا مدرس رياضيات للصف الثالث الإعدادي",
  "لو مش متأكد من معلومة قول إنك مش متأكد",
];

function InstructionsPanel({ value, tpl, onSave }) {
  const [text, setText] = useState(value);
  const [saving, setSaving] = useState(false);
  const add = (line) => setText((t) => (t.trim() ? `${t.trim()}\n${line}` : line).slice(0, MAX_INSTR));
  return (
    <div className={ps.panel}>
      <p className={ps.panelNote}>التعليمات بتتبعت مع كل سؤال في المشروع. اكتب إنت مين، وعايز الردود تبقى إزاي، وإيه اللي المساعد لازم يلتزم بيه.</p>
      <label className="sr" htmlFor="proj-instr">تعليمات المشروع</label>
      <textarea id="proj-instr" className={ps.textarea} value={text} maxLength={MAX_INSTR} onChange={(e) => setText(e.target.value)} placeholder="مثلاً: أنا صاحب محل موبايلات في المنصورة. ردودك على الزباين تبقى بالمصري وقصيرة، والأسعار من ملف الأسعار بس." dir="auto" />
      <div className={ps.instrMeta}>
        <small>{text.length} / {MAX_INSTR}</small>
        {tpl.instructions && text !== tpl.instructions && <button type="button" className={ps.textBtn} onClick={() => setText(tpl.instructions)}>رجّع تعليمات القالب</button>}
      </div>
      <div className={ps.examples}>
        <span>أفكار:</span>
        {EXAMPLES.map((e) => <button key={e} type="button" onClick={() => add(e)}>+ {e}</button>)}
      </div>
      <button type="button" className={ps.cta} disabled={saving || text === value} onClick={async () => { setSaving(true); await onSave(text.trim()); setSaving(false); }}>
        {saving ? "بنحفظ…" : "احفظ التعليمات"}
      </button>
    </div>
  );
}
