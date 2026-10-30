"use client";
// الشريط العلوي + البحث السريع (Ctrl+K) + لوحة التحكم + الإشعارات الصغيرة
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { tools } from "@/lib/tools";
import { findTools, norm } from "@/lib/search";
import { SETTINGS, DEFAULT_SETTINGS } from "@/lib/settings";
import { useStored, read } from "@/lib/store";
import ToolIcon from "./ToolIcon";
import StarMark from "./StarMark";
import BotIcon from "./BotIcon";
import { BOTS } from "@/lib/bots";

const I = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

// روابط اللوحة الجانبية
const NAV = [
  { href: "/", label: "الرئيسية", exact: true, icon: <svg {...I}><path d="M3.5 10.5L12 3.5l8.5 7" /><path d="M5.5 9.5V20h13V9.5" /></svg> },
  { href: "/chat", label: "الشات", icon: <svg {...I}><path d="M20.5 11.5a8.3 8.3 0 01-8.9 8.3L3.5 21l1.1-3.5A8.3 8.3 0 1120.5 11.5z" /></svg> },
  { href: "/models", label: "الموديلات والبرامج", icon: <svg {...I}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><path d="M17 13.2l1 2.2 2.3.3-1.7 1.6.4 2.3-2-1.1-2 1.1.4-2.3-1.7-1.6 2.3-.3z" /></svg> },
  { href: "/tools", label: "كل الأدوات", match: ["/tools", "/tool/"], icon: <svg {...I}><path d="M14.5 6.5l3-3 3 3-3 3zM4 20l9-9M3.5 7.5h6M6.5 4.5v6M14 17.5h6.5" /></svg> },
  { href: "/maker", label: "صانع الصور والفيديو", match: ["/maker"], icon: <svg {...I}><rect x="3.5" y="4.5" width="17" height="15" rx="3" /><circle cx="9" cy="10" r="1.7" /><path d="M20.5 16l-5-4.5L8 19" /></svg> },
  { href: "/agents", label: "الوكلاء", match: ["/agents"], icon: <svg {...I}><rect x="5" y="8" width="14" height="11" rx="3" /><path d="M12 4.5V8M9.5 13h.01M14.5 13h.01M9.5 16h5" /><circle cx="12" cy="4" r="1" /></svg> },
  { href: "/library", label: "مكتبة الأدوات", match: ["/library"], icon: <svg {...I}><path d="M4 19.5V5a1.5 1.5 0 011.5-1.5H8V19.5M8 3.5h3.5v16H8M14 4.6l3.2-.8 3.3 15.4-3.2.8z" /><path d="M3 19.5h18" /></svg> },
  { href: "/global-tools", label: "أدوات عالمية", match: ["/global-tools", "/ai/"], icon: <svg {...I}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" /></svg> },
  { href: "/creators", label: "صناع المحتوى", match: ["/creators"], icon: <svg {...I}><circle cx="9" cy="8.5" r="3.2" /><path d="M3.5 19.5c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5" /><path d="M16 5.6a3 3 0 010 5.8M17.5 14.7c1.6.6 2.7 2.2 3 4.8" /></svg> },
  { href: "/tasks", label: "أداة لأي مهمة", match: ["/tasks", "/task/"], icon: <svg {...I}><path d="M9 11l3 3 8-8" /><path d="M20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h9" /></svg> },
  { href: "/learn", label: "تعلّم الذكاء الاصطناعي", tone: "learn", match: ["/learn"], icon: <svg {...I}><path d="M3 9l9-4.5L21 9l-9 4.5z" /><path d="M7 11.2v4.3c0 1.2 2.2 2.5 5 2.5s5-1.3 5-2.5v-4.3M21 9v5.5" /></svg> },
  { href: "/news", label: "جديد الذكاء الاصطناعي", tone: "news", match: ["/news"], icon: <svg {...I}><path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" /></svg> },
  { href: "/flows", label: "المهام الكاملة", match: ["/flows", "/flow/"], icon: <svg {...I}><rect x="3" y="4" width="7" height="5" rx="1.5" /><rect x="14" y="15" width="7" height="5" rx="1.5" /><path d="M6.5 9v3.5a2 2 0 002 2h7v.5" /></svg> },
  { href: "/history", label: "السجل", icon: <svg {...I}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg> },
  { href: "/subscriptions", label: "مقارن الاشتراكات", match: ["/subscriptions", "/scam-check"], icon: <svg {...I}><path d="M12 3.5l7 3v5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9v-5z" /><path d="M9 12l2.2 2.2L15.5 10" /></svg> },
  { href: "/plans", label: "الباقات", icon: <svg {...I}><path d="M4 8l4 3.5L12 5l4 6.5L20 8l-1.5 10h-13z" /></svg> },
];

const SIDE_BOTS = ["claude-opus", "gpt-astra", "gemini-pro", "grok", "deepseek", "gpt-oss-120b"]
  .map((k) => BOTS.find((b) => b.key === k))
  .filter(Boolean);

export default function Chrome() {
  const [palette, setPalette] = useState(false);
  const [panel, setPanel] = useState(false);
  const [drawer, setDrawer] = useState(false);

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
      if (e.key === "Escape") { setPalette(false); setPanel(false); setDrawer(false); }
    };
    const open = () => setPanel(true);
    const find = () => setPalette(true);
    window.addEventListener("keydown", key);
    window.addEventListener("rs-open-settings", open);
    window.addEventListener("rs-open-palette", find);
    return () => {
      window.removeEventListener("keydown", key);
      window.removeEventListener("rs-open-settings", open);
      window.removeEventListener("rs-open-palette", find);
    };
  }, []);

  const pathname = usePathname() || "/";
  useEffect(() => setDrawer(false), [pathname]);

  return (
    <>
      <Sidebar open={drawer} onClose={() => setDrawer(false)} onSettings={() => { setDrawer(false); setPanel(true); }} onSearch={() => { setDrawer(false); setPalette(true); }} />
      <header className="topbar">
        <div className="top-start">
          <button className="icon-btn menu-btn" onClick={() => setDrawer(true)} aria-label="افتح القائمة" aria-expanded={drawer}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10" /></svg>
          </button>
          <Link href="/" className="logo top-logo" aria-label="Rising StarAi الصفحة الرئيسية">
            <StarMark size={28} className="logo-star" />
            <span dir="ltr" className="logo-name">Rising Star<span className="logo-ai">Ai</span></span>
          </Link>
        </div>
        <nav className="top-actions" aria-label="القائمة">
          <button className="search-btn" onClick={() => setPalette(true)} aria-label="ابحث عن أداة">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" />
            </svg>
            <span>ابحث عن أداة</span>
            <kbd>Ctrl K</kbd>
          </button>
          <Link href="/history" className="icon-btn history-link" title="السجل" aria-label="السجل">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" />
            </svg>
          </Link>
          <button className="icon-btn" onClick={() => setPanel(true)} title="لوحة التحكم" aria-label="لوحة التحكم">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" />
            </svg>
          </button>
        </nav>
      </header>
      {palette && <Palette onClose={() => setPalette(false)} />}
      {panel && <Panel onClose={() => setPanel(false)} />}
      <Toaster />
    </>
  );
}

// اللوحة الجانبية: ثابتة على الكمبيوتر (وبتتصغّر لأيقونات)، ودرج بيطلع من الجنب على الموبايل
function Sidebar({ open, onClose, onSettings, onSearch }) {
  const pathname = usePathname() || "/";
  const [mini, setMini] = useStored("side-mini", false);

  useEffect(() => {
    document.documentElement.classList.toggle("side-mini", !!mini);
  }, [mini]);
  useEffect(() => {
    document.body.classList.toggle("side-open", open);
    return () => document.body.classList.remove("side-open");
  }, [open]);

  const active = (n) => (n.exact ? pathname === n.href : (n.match || [n.href]).some((p) => pathname.startsWith(p)));

  return (
    <>
      <div className={`side-scrim${open ? " on" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`side${open ? " open" : ""}`} aria-label="القائمة الجانبية">
        <div className="side-head">
          <Link href="/" className="logo" aria-label="Rising StarAi الصفحة الرئيسية">
            <StarMark size={30} className="logo-star" />
            <span dir="ltr" className="logo-name side-label">Rising Star<span className="logo-ai">Ai</span></span>
          </Link>
          <button className="icon-btn side-toggle" onClick={() => setMini(!mini)} aria-label={mini ? "كبّر القائمة" : "صغّر القائمة"} title={mini ? "كبّر القائمة" : "صغّر القائمة"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M14.5 4v16" /></svg>
          </button>
          <button className="icon-btn side-close" onClick={onClose} aria-label="اقفل القائمة">✕</button>
        </div>

        <Link href="/chat?new=1" className="side-new" title="محادثة جديدة" onClick={() => window.dispatchEvent(new Event("rs-new-chat"))}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
          <span className="side-label">محادثة جديدة</span>
        </Link>

        <nav className="side-nav">
          {NAV.map((n) => (
            <Link key={n.href} href={n.href} className={`side-link${n.tone ? " tone-" + n.tone : ""}${active(n) ? " on" : ""}`} title={n.label}>
              {n.icon}
              <span className="side-label">{n.label}</span>
            </Link>
          ))}
          <button type="button" className="side-link" onClick={onSearch} title="ابحث عن أداة">
            <svg {...I}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
            <span className="side-label">ابحث عن أداة</span>
          </button>
        </nav>

        <div className="side-sec side-label">اتكلم مع</div>
        <nav className="side-nav side-bots">
          {SIDE_BOTS.map((b) => (
            <Link key={b.key} href={`/chat?bot=${b.key}`} className="side-link" title={b.name}>
              <BotIcon bot={b} size={22} />
              <span className="side-label" dir="auto">{b.name}</span>
            </Link>
          ))}
        </nav>

        <div className="side-foot">
          <button type="button" className="side-link" onClick={onSettings} title="الإعدادات">
            <svg {...I}><path d="M4 7h10M18 7h2M4 17h2M10 17h10" /><circle cx="16" cy="7" r="2" /><circle cx="8" cy="17" r="2" /></svg>
            <span className="side-label">الإعدادات</span>
          </button>
        </div>
      </aside>
    </>
  );
}

function Palette({ onClose }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [i, setI] = useState(0);
  const inputRef = useRef(null);
  const recent = useMemo(() => read("recent", []).map((id) => tools.find((t) => t.id === id)).filter(Boolean), []);

  const list = useMemo(() => {
    if (!q.trim()) return recent.length ? recent : tools.slice(0, 8);
    const smart = findTools(q, 8);
    if (smart.length) return smart;
    const n = norm(q);
    return tools.filter((t) => norm(t.name).includes(n)).slice(0, 8);
  }, [q, recent]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => setI(0), [q]);

  function go(t) { onClose(); router.push(`/tool/${t.id}`); }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="palette" role="dialog" aria-label="البحث السريع" onClick={(e) => e.stopPropagation()}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setI((x) => Math.min(x + 1, list.length - 1)); }
            if (e.key === "ArrowUp") { e.preventDefault(); setI((x) => Math.max(x - 1, 0)); }
            if (e.key === "Enter" && list[i]) go(list[i]);
          }}
          placeholder="اكتب اسم الأداة أو اللي عايز تعمله..."
        />
        <div className="palette-label">{q.trim() ? "النتائج" : recent.length ? "استخدمتها مؤخراً" : "ابدأ من هنا"}</div>
        <ul>
          {list.map((t, k) => (
            <li key={t.id}>
              <button className={k === i ? "on" : ""} onMouseEnter={() => setI(k)} onClick={() => go(t)}>
                <ToolIcon tool={t} size="sm" />
                <span><b>{t.name}</b><small>{t.desc}</small></span>
              </button>
            </li>
          ))}
          {!list.length && <li className="palette-empty">مفيش أداة بالكلام ده. جرّب كلمة زي: إعلان، ترجمة، سيرة ذاتية.</li>}
        </ul>
        <div className="palette-foot">↑↓ للتنقل • Enter للفتح • Esc للإغلاق</div>
      </div>
    </div>
  );
}

function Panel({ onClose }) {
  const [settings, setSettings] = useStored("settings", DEFAULT_SETTINGS);
  const s = { ...DEFAULT_SETTINGS, ...settings };

  return (
    <div className="overlay" onClick={onClose}>
      <aside className="panel-drawer" role="dialog" aria-label="لوحة التحكم" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <h2>لوحة التحكم</h2>
          <button className="icon-btn" onClick={onClose} aria-label="إغلاق">✕</button>
        </div>
        <p className="drawer-note">الإعدادات دي بتتطبق على كل الأدوات، ومحفوظة على جهازك.</p>

        {Object.entries(SETTINGS).map(([k, def]) => (
          <fieldset key={k} className="setting">
            <legend>{def.label}</legend>
            <div className="segmented">
              {Object.entries(def.choices).map(([v, label]) => (
                <button key={v} aria-pressed={s[k] === v} className={s[k] === v ? "on" : ""} onClick={() => setSettings({ ...s, [k]: v })}>
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        ))}

        <button className="btn ghost wide" onClick={() => setSettings(DEFAULT_SETTINGS)}>
          رجّع الإعدادات الافتراضية
        </button>
      </aside>
    </div>
  );
}

function Toaster() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let t;
    const on = (e) => { setMsg(e.detail); clearTimeout(t); t = setTimeout(() => setMsg(""), 1800); };
    window.addEventListener("rs-toast", on);
    return () => window.removeEventListener("rs-toast", on);
  }, []);
  return <div className={`toast ${msg ? "show" : ""}`} role="status">{msg}</div>;
}
