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

const THEMES = { auto: "يتحول بعد 5 دقايق", gold: "ذهبي دائماً", royal: "أزرق ملكي دائماً" };

export default function Chrome() {
  const [palette, setPalette] = useState(false);
  const [panel, setPanel] = useState(false);

  useEffect(() => {
    const key = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); }
      if (e.key === "Escape") { setPalette(false); setPanel(false); }
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
  const on = (p) => (pathname.startsWith(p) ? "nav-link on" : "nav-link");

  return (
    <>
      <header className="topbar">
        <Link href="/" className="logo" aria-label="Rising StarAi الصفحة الرئيسية">
          <span className="logo-star" aria-hidden="true">✦</span>
          <span dir="ltr">Rising StarAi</span>
        </Link>
        <nav className="top-actions" aria-label="القائمة">
          <Link href="/chat" className={on("/chat")}>الشات</Link>
          <Link href="/flows" className={on("/flow")}>المهام</Link>
          <Link href="/tools" className={on("/tool")}>الأدوات</Link>
          <Link href="/plans" className="upgrade-pill"><span aria-hidden="true">✦</span> ترقية</Link>
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
  const [theme, setTheme] = useStored("theme", "auto");
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

        <fieldset className="setting">
          <legend>ألوان الموقع</legend>
          <div className="segmented">
            {Object.entries(THEMES).map(([v, label]) => (
              <button key={v} aria-pressed={theme === v} className={theme === v ? "on" : ""} onClick={() => setTheme(v)}>
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <button className="btn ghost wide" onClick={() => { setSettings(DEFAULT_SETTINGS); setTheme("auto"); }}>
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
