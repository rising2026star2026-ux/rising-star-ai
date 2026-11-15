"use client";
// الشريط العلوي + البحث السريع (Ctrl+K) + لوحة التحكم + الإشعارات الصغيرة
import { SIDE_NAV, isOn } from "@/lib/nav";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { tools } from "@/lib/tools";
import { findTools, norm } from "@/lib/search";
import { SETTINGS, DEFAULT_SETTINGS } from "@/lib/settings";
import { useStored, read } from "@/lib/store";
import ToolIcon from "./ToolIcon";
import StarMark from "./StarMark";

const I = { viewBox: "0 0 24 24", width: 20, height: 20, fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };


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
          <Link href="/" className="logo top-logo" aria-label="Rising Business الصفحة الرئيسية">
            <StarMark size={28} className="logo-star" />
            <span dir="ltr" className="logo-name">Rising <span className="logo-ai">Business</span></span>
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
// القائمة الجانبية: أقسام المنصة (Rising Business)

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


  return (
    <>
      <div className={`side-scrim${open ? " on" : ""}`} onClick={onClose} aria-hidden="true" />
      <aside className={`side${open ? " open" : ""}`} aria-label="القائمة الجانبية">
        <div className="side-head">
          <Link href="/" className="logo" aria-label="Rising Business الصفحة الرئيسية">
            <StarMark size={30} className="logo-star" />
            <span dir="ltr" className="logo-name side-label">Rising <span className="logo-ai">Business</span></span>
          </Link>
          <button className="icon-btn side-toggle" onClick={() => setMini(!mini)} aria-label={mini ? "كبّر القائمة" : "صغّر القائمة"} title={mini ? "كبّر القائمة" : "صغّر القائمة"}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3.5" y="4" width="17" height="16" rx="3" /><path d="M14.5 4v16" /></svg>
          </button>
          <button className="icon-btn side-close" onClick={onClose} aria-label="اقفل القائمة">✕</button>
        </div>

        <nav className="side-nav" aria-label="أقسام المنصة">
          {SIDE_NAV.map((x) => {
            const on = isOn(x, pathname);
            return (
              <Link key={x.href} href={x.href} className={`side-link${on ? " on" : ""}`} title={x.label} aria-current={on ? "page" : undefined}>
                <svg {...I}><path d={x.icon} /></svg>
                <span className="side-label">{x.label}</span>
              </Link>
            );
          })}
          <button type="button" className="side-link" onClick={onSearch} title="ابحث عن أداة">
            <svg {...I}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2" /></svg>
            <span className="side-label">ابحث عن أداة</span>
          </button>
        </nav>

        <div className="side-foot">
          <Link href="/plans" className={`side-link${pathname.startsWith("/plans") ? " on" : ""}`} title="الباقات">
            <svg {...I}><path d="M4 8l4 3.5L12 5l4 6.5L20 8l-1.5 10h-13z" /></svg>
            <span className="side-label">الباقات</span>
          </Link>
          <Link href="/support" className={`side-link${pathname.startsWith("/support") ? " on" : ""}`} title="الدعم">
            <svg {...I}><path d="M4 13v-1a8 8 0 0116 0v1" /><rect x="3" y="13" width="4" height="6" rx="1.5" /><rect x="17" y="13" width="4" height="6" rx="1.5" /></svg>
            <span className="side-label">الدعم</span>
          </Link>
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
          {!list.length && <li className="palette-empty">مفيش أداة بالكلام ده. جرّب كلمة زي: إعلان، وصف منتج، لوجو.</li>}
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
