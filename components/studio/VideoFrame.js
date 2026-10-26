"use client";
// صورة من الفيديو: اختار اللحظة ونزّلها صورة بجودة الفيديو الأصلية
import { useEffect, useRef, useState } from "react";
import { Drop, Seg, Note, styles as s } from "./ui";
import { makeCanvas, canvasToBlob, download, baseName, formatBytes } from "./util";
import { toast } from "@/lib/store";

const fmtTime = (t) => {
  const m = Math.floor(t / 60), sec = Math.floor(t % 60), cs = Math.floor((t % 1) * 10);
  return `${m}:${String(sec).padStart(2, "0")}.${cs}`;
};

export default function VideoFrame() {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("video");
  const [shots, setShots] = useState([]);
  const [format, setFormat] = useState("jpg");
  const [error, setError] = useState("");
  const vid = useRef(null);

  useEffect(() => () => { if (url) URL.revokeObjectURL(url); }, [url]);

  function open(files) {
    setError("");
    setShots([]);
    setName(baseName(files[0].name));
    setUrl(URL.createObjectURL(files[0]));
  }

  function step(d) {
    const v = vid.current;
    if (!v) return;
    v.pause();
    v.currentTime = Math.min(v.duration || 0, Math.max(0, v.currentTime + d));
  }

  async function capture() {
    const v = vid.current;
    if (!v || !v.videoWidth) { setError("الفيديو لسه بيحمّل، استنى ثانية."); return; }
    const c = makeCanvas(v.videoWidth, v.videoHeight);
    c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
    try {
      const blob = await canvasToBlob(c, format, 0.93);
      const t = v.currentTime;
      setShots((x) => [{ key: `${t}-${Date.now()}`, t, blob, src: URL.createObjectURL(blob), w: c.width, h: c.height }, ...x].slice(0, 24));
      toast("اتاخدت اللقطة");
    } catch (e) { setError(e.message); }
  }

  const fileName = (sh) => `${name}-${fmtTime(sh.t).replace(/[:.]/g, "-")}.${format === "png" ? "png" : "jpg"}`;

  return (
    <div className={s.root}>
      <span className={s.badge}><i />بيشتغل على جهازك، والفيديو ما بيترفعش</span>
      <Drop accept="video/*" onFiles={open} compact={!!url} title={url ? "فيديو تاني" : "اسحب فيديو هنا أو اضغط تختار"} hint="MP4 من الموبايل بيشتغل على كل المتصفحات تقريباً." />
      {url && (
        <div className={s.bench}>
          <div className={s.stage}>
            <video ref={vid} src={url} controls playsInline preload="auto" onError={() => setError("المتصفح ده مش قادر يشغّل الفيديو ده. جرّب تحوّله MP4.")} />
          </div>
          <div className={s.panel}>
            <Note>شغّل الفيديو ووقّفه عند اللحظة اللي عايزها، أو اتحرك بالأزرار دي بدقة.</Note>
            <div className={s.iconRow}>
              <button type="button" className={s.iconBtn} onClick={() => step(-1)}>رجّع ثانية</button>
              <button type="button" className={s.iconBtn} onClick={() => step(-1 / 30)}>رجّع لقطة</button>
              <button type="button" className={s.iconBtn} onClick={() => step(1 / 30)}>قدّم لقطة</button>
              <button type="button" className={s.iconBtn} onClick={() => step(1)}>قدّم ثانية</button>
            </div>
            <Seg label="الصيغة" value={format} options={[["jpg", "JPG"], ["png", "PNG"]]} onChange={setFormat} />
            <button type="button" className="btn" onClick={capture}>التقط الصورة</button>
            {error && <Note tone="warn">{error}</Note>}
          </div>
        </div>
      )}
      {shots.length > 0 && (
        <div className={s.shots}>
          {shots.map((sh) => (
            <div key={sh.key} className={s.shot}>
              <img src={sh.src} alt={`لقطة عند ${fmtTime(sh.t)}`} />
              <div>
                <span dir="ltr">{fmtTime(sh.t)} · {formatBytes(sh.blob.size)}</span>
                <button type="button" className={`${s.mini} ${s.miniAccent}`} onClick={() => download(sh.blob, fileName(sh))}>تحميل</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
