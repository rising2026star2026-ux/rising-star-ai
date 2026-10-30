"use client";
// بيفتح الأداة جوه الموقع بواجهتها الأصلية + شريط تحكم + صندوق «احفظ وشارك شغلك»
import { useEffect, useRef, useState } from "react";
import s from "./library.module.css";

export default function LibraryFrame({ url, name, hf, hfNote, pageUrl }) {
  const [key, setKey] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [slow, setSlow] = useState(false);
  const box = useRef(null);

  useEffect(() => {
    setLoaded(false);
    setSlow(false);
    const t = setTimeout(() => setSlow(true), hf ? 25000 : 15000);
    return () => clearTimeout(t);
  }, [key, hf]);

  function full() {
    const el = box.current;
    if (!el) return;
    if (document.fullscreenElement) document.exitFullscreen?.();
    else (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el);
  }

  return (
    <>
      <div className={s.bar}>
        <b>{name}</b>
        <span className={s.barBtns}>
          <button type="button" onClick={() => setKey((k) => k + 1)} title="إعادة تحميل">↻ إعادة تحميل</button>
          <button type="button" onClick={full} title="ملء الشاشة">⛶ ملء الشاشة</button>
          <a href={url} target="_blank" rel="noopener noreferrer">افتح في تبويب ↗</a>
        </span>
      </div>
      {hf && (
        <p className={s.hfNote}>
          ⏳ أول فتح ممكن ياخد دقيقة لو الأداة كانت نايمة («Sleeping» أو «Building»): استنى وبعدين اضغط «إعادة تحميل». {hfNote}
        </p>
      )}
      <div className={s.frame} ref={box}>
        {!loaded && <div className={s.loading}>جاري فتح {name}...</div>}
        <iframe
          key={key}
          src={url}
          title={name}
          onLoad={() => setLoaded(true)}
          allow="clipboard-read; clipboard-write; fullscreen; microphone; camera; autoplay; display-capture"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      {slow && !loaded && (
        <p className={s.slow}>الأداة بطيئة شوية النهارده. جرّب «إعادة تحميل»، أو <a href={url} target="_blank" rel="noopener noreferrer">افتحها في تبويب</a>.</p>
      )}
      <SaveShare name={name} pageUrl={pageUrl} />
    </>
  );
}

// الأدوات دي بتشتغل عند الشركة الأصلية، فالحفظ بيبقى على جهازك وبعدين تشاركه
function SaveShare({ name, pageUrl }) {
  const [canFiles, setCanFiles] = useState(false);
  const [msg, setMsg] = useState("");
  const input = useRef(null);

  useEffect(() => {
    try {
      const f = new File(["x"], "x.txt", { type: "text/plain" });
      setCanFiles(!!navigator.canShare && navigator.canShare({ files: [f] }));
    } catch { setCanFiles(false); }
  }, []);

  const link = pageUrl || (typeof window !== "undefined" ? window.location.href : "");
  const text = `جرّب ${name} مجاناً على Rising StarAi: ${link}`;

  async function shareFiles(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    if (!files.length) return;
    try {
      await navigator.share({ files, title: name, text: `اتعمل بـ${name} على Rising StarAi` });
      setMsg("تمام ✓");
    } catch (err) {
      if (err?.name !== "AbortError") setMsg("الجهاز ده مش بيدعم مشاركة الملفات؛ ابعته كمرفق من واتساب أو تليجرام مباشرة.");
    }
  }

  return (
    <div className={s.save}>
      <h2>💾 احفظ شغلك وشاركه</h2>
      <ol>
        <li>الأداة دي بتشتغل على سيرفر الشركة الأصلية، فشغلك <b>مش بيتحفظ لوحده في حسابك على الموقع</b>.</li>
        <li>لما تخلص، اضغط زر <b>Download</b> أو <b>Export</b> أو <b>⬇</b> جوه الأداة، والملف هينزل على جهازك.</li>
        <li>شارك الملف من الزرار تحت، أو ابعته كمرفق في واتساب أو تليجرام.</li>
      </ol>
      <div className={s.saveBtns}>
        {canFiles && (
          <>
            <button type="button" className={s.main} onClick={() => input.current?.click()}>📤 شارك الملف اللي نزلته</button>
            <input ref={input} type="file" multiple hidden onChange={shareFiles} />
          </>
        )}
        <a className={s.wa} href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer">واتساب</a>
        <a className={s.tg} href={`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`جرّب ${name} مجاناً على Rising StarAi`)}`} target="_blank" rel="noopener noreferrer">تليجرام</a>
      </div>
      {msg && <p className={s.msg}>{msg}</p>}
      <p className={s.soon}>قريباً: «ملفاتي» في حسابك على الموقع، ترفع فيها شغلك وتلاقيه من أي جهاز.</p>
    </div>
  );
}
