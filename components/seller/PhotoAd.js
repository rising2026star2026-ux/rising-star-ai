"use client";
// «صوّرها بموبايلك.. وخد إعلان كامل»
// صورة عادية من الموبايل ← الخلفية بتتشال على الجهاز + الذكاء الاصطناعي بيتعرّف على المنتج
// ← 6 صور شكل الاستوديو (ومشهد بالذكاء الاصطناعي لو حب) ← بوستات لكل منصة ← فيديو 15 ثانية.
import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { readImage, scaledCanvas, canvasBlob, blobToDataUrl, shareOrDownload, loadFonts } from "@/lib/imagefile";
import { cutoutCanvas, trimAlpha, progressTracker } from "@/components/studio/cutout";
import { renderScene, SCENES, FORMATS } from "./scenes";
import { aiBackground } from "@/lib/aibg";
import { toast } from "@/lib/store";
import AdPack from "./AdPack";
import s from "./seller.module.css";
import p from "./photoad.module.css";

const PhotoAdVideo = dynamic(() => import("./PhotoAdVideo"), { ssr: false, loading: () => <p className={s.ctaNote}>بنجهّز الفيديو…</p> });

const STEP_NAMES = ["الصورة", "صور الاستوديو", "كلام الإعلان", "الفيديو"];

export default function PhotoAd() {
  const [orig, setOrig] = useState(null); // { canvas, url }
  const [cut, setCut] = useState({ status: "idle", pct: 0 }); // idle | load | work | done | failed
  const [prod, setProd] = useState(null); // { canvas, framed }
  const [eye, setEye] = useState({ status: "idle" });
  const [info, setInfo] = useState({ name: "", price: "", oldPrice: "", contact: "" });
  const [format, setFormat] = useState("square");
  const [shots, setShots] = useState({}); // id → { url, blob }
  const [ai, setAi] = useState({ status: "idle" }); // idle | busy | done | failed
  const [pack, setPack] = useState({ status: "idle" });
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [videoOn, setVideoOn] = useState(false);
  const urls = useRef(new Set());
  const nameTouched = useRef(false);
  const sec2 = useRef(null), sec3 = useRef(null);

  useEffect(() => () => urls.current.forEach((u) => URL.revokeObjectURL(u)), []);
  const keepUrl = (blob) => { const u = URL.createObjectURL(blob); urls.current.add(u); return u; };
  const dropUrl = (u) => { if (u) { URL.revokeObjectURL(u); urls.current.delete(u); } };

  async function onFile(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    setError(""); setShots({}); setProd(null); setAi({ status: "idle" }); setPack({ status: "idle" }); setVideoOn(false);
    nameTouched.current = false;
    let img;
    try { img = await readImage(f); } catch (er) { setError(er.message); return; }
    const canvas = scaledCanvas(img, 1400);
    const url = keepUrl(await canvasBlob(canvas, "image/jpeg", 0.9));
    setOrig({ canvas, url });
    loadFonts();
    identify(canvas);
    removeBg(canvas);
  }

  async function removeBg(canvas) {
    setCut({ status: "load", pct: 0 });
    try {
      const out = await cutoutCanvas(canvas, progressTracker((pct) => setCut({ status: "load", pct })), () => setCut({ status: "work", pct: 100 }));
      const trimmed = trimAlpha(out);
      if (!trimmed) throw new Error("empty");
      setProd({ canvas: trimmed, framed: false });
      setCut({ status: "done", pct: 100 });
    } catch (e) {
      console.warn(e);
      setProd({ canvas, framed: true });
      setCut({ status: "failed", pct: 0 });
    }
    setTimeout(() => sec2.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
  }

  async function identify(canvas) {
    setEye({ status: "busy" });
    try {
      const image = await blobToDataUrl(await canvasBlob(scaledCanvas(canvas, 1024), "image/jpeg", 0.85));
      const r = await fetch("/api/product-eye", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error);
      setEye({ status: "done", data: j });
      if (!nameTouched.current) setInfo((x) => (x.name ? x : { ...x, name: j.name }));
    } catch {
      setEye({ status: "failed" });
    }
  }

  // رسم صور الاستوديو كل ما المنتج أو المقاس أو البيانات تتغير
  const offerKey = `${info.name}|${info.price}|${info.oldPrice}|${info.contact}`;
  useEffect(() => {
    if (!prod) return;
    let dead = false;
    const t = setTimeout(async () => {
      await loadFonts();
      const next = {};
      for (const sc of SCENES) {
        if (dead) return;
        const c = renderScene(sc.id, { prod: prod.canvas, framed: prod.framed, format, name: info.name, price: info.price, oldPrice: info.oldPrice, contact: info.contact });
        const blob = await canvasBlob(c, "image/jpeg", 0.92);
        next[sc.id] = { url: keepUrl(blob), blob };
        await new Promise((r) => setTimeout(r, 0));
      }
      if (ai.bg) {
        const c = renderScene("ai", { prod: prod.canvas, framed: prod.framed, format, bg: ai.bg });
        const blob = await canvasBlob(c, "image/jpeg", 0.92);
        next.ai = { url: keepUrl(blob), blob };
      }
      if (dead) { Object.values(next).forEach((x) => dropUrl(x.url)); return; }
      setShots((old) => { Object.values(old).forEach((x) => dropUrl(x.url)); return next; });
    }, 220);
    return () => { dead = true; clearTimeout(t); };
  }, [prod, format, offerKey, ai.bg]); // eslint-disable-line react-hooks/exhaustive-deps

  async function makeAi() {
    if (!prod || ai.status === "busy") return;
    setAi({ status: "busy" });
    try {
      const scene = eye.data?.scene || "soft neutral studio backdrop with gentle gradient and soft shadows";
      const blob = await aiBackground(scene, { portrait: format === "story" });
      const img = await readImage(blob);
      setAi({ status: "done", bg: img });
    } catch (e) {
      setAi({ status: "failed", error: e.message });
    }
  }

  async function writePack() {
    setPack({ status: "busy" });
    try {
      const r = await fetch("/api/ad-pack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source: "photo", name: info.name, price: info.price, offer: info.oldPrice ? `بدل ${info.oldPrice}` : "", contact: info.contact, seen: eye.data?.seen || "" }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة. جرّب تاني.");
      setPack({ status: "done", data: j });
      setTimeout(() => sec3.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 120);
    } catch (e) {
      setPack({ status: "failed", error: e.message });
    }
  }

  const sceneList = useMemo(() => [...SCENES, ...(ai.bg ? [{ id: "ai", name: "مشهد بالذكاء الاصطناعي", hint: "خلفية متولّدة لمنتجك" }] : [])], [ai.bg]);
  const ready = Object.keys(shots).length > 0;

  async function saveAll() {
    for (const sc of sceneList) {
      const x = shots[sc.id];
      if (!x) continue;
      await shareOrDownload(x.blob, `${sc.id}-${format}.jpg`).catch(() => {});
      await new Promise((r) => setTimeout(r, 400));
    }
  }

  // صور الفيديو: المنتج لوحده + مشهدين
  const [videoImages, setVideoImages] = useState([]);
  useEffect(() => {
    if (!videoOn || !prod) return;
    let dead = false;
    (async () => {
      const list = [];
      const pc = prod.canvas;
      const blob0 = await canvasBlob(pc, prod.framed ? "image/jpeg" : "image/png", 0.92);
      list.push({ id: "p", src: keepUrl(blob0), w: pc.width, h: pc.height });
      for (const id of ["luxury", "studio"]) {
        const c = renderScene(id, { prod: pc, framed: prod.framed, format: "square" });
        const b = await canvasBlob(c, "image/jpeg", 0.9);
        list.push({ id, src: keepUrl(b), w: c.width, h: c.height });
      }
      if (!dead) setVideoImages(list);
    })();
    return () => { dead = true; };
  }, [videoOn, prod]); // eslint-disable-line react-hooks/exhaustive-deps

  const [testImage, setTestImage] = useState("");
  useEffect(() => {
    const x = shots.offer || shots.studio;
    if (!x) return;
    let dead = false;
    (async () => {
      const img = await readImage(x.blob);
      const d = await blobToDataUrl(await canvasBlob(scaledCanvas(img, 900), "image/jpeg", 0.82));
      if (!dead) setTestImage(d);
    })().catch(() => {});
    return () => { dead = true; };
  }, [shots]);

  const step = !orig ? 0 : !ready ? 1 : pack.status !== "done" ? 2 : 3;

  return (
    <div className={s.body}>
      <ol className={p.rail} aria-label="الخطوات">
        {STEP_NAMES.map((n, i) => (
          <li key={n} className={i < step ? p.railDone : i === step ? p.railNow : ""}><b>{i < step ? "✓" : i + 1}</b><span>{n}</span></li>
        ))}
      </ol>

      {/* ===== 1) الصورة ===== */}
      <section className={s.card}>
        {!orig ? (
          <>
            <h2>صوّر منتجك أو ارفع صورته</h2>
            <p className={p.packLead}>أي صورة من موبايلك تنفع، حتى لو على ترابيزة المطبخ. إحنا هنشيل الخلفية ونحطه في استوديو.</p>
            <div className={p.pick}>
              <label className={p.pickBig}>
                <input type="file" accept="image/*" capture="environment" onChange={onFile} aria-label="صوّر المنتج بالكاميرا" />
                <span className={p.camIcon} aria-hidden="true">
                  <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4 8.5A2.5 2.5 0 016.5 6h1.6l1.4-2h5l1.4 2h1.6A2.5 2.5 0 0120 8.5v8A2.5 2.5 0 0117.5 19h-11A2.5 2.5 0 014 16.5z" /><circle cx="12" cy="12.5" r="3.5" /></svg>
                </span>
                <b>صوّر المنتج دلوقتي</b>
                <small>بالكاميرا الخلفية</small>
              </label>
              <label className={p.pickSmall}>
                <input type="file" accept="image/*" onChange={onFile} aria-label="اختار صورة من الجهاز" />
                <span aria-hidden="true">🖼️</span>
                <b>اختار صورة من الجهاز</b>
              </label>
            </div>
            <ul className={p.tips}>
              <li>💡 صوّر في مكان منوّر، ويفضل ضوء النهار</li>
              <li>📐 خلّي الموبايل في مستوى المنتج، والمنتج كله باين</li>
              <li>🧺 خلفية بسيطة بتطلع نتيجة أنضف</li>
            </ul>
          </>
        ) : (
          <div className={p.origRow}>
            <img src={orig.url} alt="الصورة الأصلية" className={p.origImg} />
            <div className={p.origInfo}>
              <b>{cut.status === "done" ? "✓ الخلفية اتشالت" : cut.status === "failed" ? "صورتك هتتحط في إطار" : cut.status === "work" ? "بنشيل الخلفية…" : `بنجهّز أداة إزالة الخلفية… ${cut.pct}%`}</b>
              <small>
                {cut.status === "load" && "أول مرة بس بيحمّل حوالي 50 ميجا، وبعدها بيبقى أسرع بكتير."}
                {cut.status === "work" && "على الموبايل ممكن تاخد نص دقيقة."}
                {cut.status === "failed" && "الجهاز ده ما قدرش يشيل الخلفية، فهنستخدم صورتك زي ما هي جوه إطار شيك."}
                {cut.status === "done" && (eye.status === "busy" ? "وبنتعرّف على المنتج…" : eye.status === "done" ? `شكله «${eye.data.name}»` : "")}
              </small>
              {(cut.status === "load" || cut.status === "work") && <div className={p.bar}><i style={{ width: `${cut.status === "work" ? 100 : cut.pct}%` }} className={cut.status === "work" ? p.barWork : ""} /></div>}
              <label className={s.miniBtn} style={{ position: "relative", alignSelf: "flex-start" }}>
                <input type="file" accept="image/*" onChange={onFile} style={{ position: "absolute", inset: 0, opacity: 0 }} aria-label="صورة تانية" />
                صورة تانية
              </label>
            </div>
          </div>
        )}
        {error && <p className={s.err} role="alert">{error}</p>}
      </section>

      {/* ===== 2) صور الاستوديو ===== */}
      {prod && (
        <section className={s.card} ref={sec2} style={{ scrollMarginTop: 80 }}>
          <div className={p.secHead}>
            <h2>صور شكل الاستوديو</h2>
            <div className={s.chips} role="group" aria-label="المقاس">
              {Object.entries(FORMATS).map(([k, v]) => (
                <button key={k} type="button" className={s.chip} aria-pressed={format === k} onClick={() => setFormat(k)}>{v.name}</button>
              ))}
            </div>
          </div>

          <div className={p.infoGrid}>
            <label><span>اسم المنتج</span><input className={s.input} value={info.name} maxLength={60} onChange={(e) => { nameTouched.current = true; setInfo({ ...info, name: e.target.value }); }} placeholder={eye.status === "busy" ? "بنتعرّف عليه…" : "مثلاً: عطر نوار فرنسي"} /></label>
            <label><span>السعر</span><input className={s.input} value={info.price} maxLength={20} onChange={(e) => setInfo({ ...info, price: e.target.value })} placeholder="450 ج" /></label>
            <label><span>السعر قبل الخصم <small>اختياري</small></span><input className={s.input} value={info.oldPrice} maxLength={20} onChange={(e) => setInfo({ ...info, oldPrice: e.target.value })} placeholder="900 ج" /></label>
            <label><span>رقم الطلب أو الصفحة</span><input className={s.input} value={info.contact} maxLength={40} onChange={(e) => setInfo({ ...info, contact: e.target.value })} placeholder="01012345678" inputMode="tel" dir="ltr" /></label>
          </div>

          {!ready ? (
            <div className={p.shotsLoading}><span className={s.spin} /> بنرسم الصور…</div>
          ) : (
            <div className={`${p.shots} ${format === "story" ? p.shotsStory : ""}`}>
              {sceneList.map((sc) => shots[sc.id] && (
                <button key={sc.id} type="button" className={p.shot} onClick={() => setPreview(sc.id)}>
                  <img src={shots[sc.id].url} alt={sc.name} loading="lazy" />
                  <span><b>{sc.name}</b><small>{sc.hint}</small></span>
                </button>
              ))}
              {!ai.bg && (
                <button type="button" className={`${p.shot} ${p.aiCard}`} onClick={makeAi} disabled={ai.status === "busy"}>
                  <span className={p.aiInner}>
                    {ai.status === "busy" ? <><span className={`${s.spin} ${s.spinLight}`} /><b>بنرسم خلفية لمنتجك…</b><small>من 10 لـ 40 ثانية</small></>
                      : <><i aria-hidden="true">✨</i><b>مشهد بالذكاء الاصطناعي</b><small>{ai.status === "failed" ? (ai.error || "جرّب تاني") : "خلفية متولّدة مخصوص لمنتجك"}</small></>}
                  </span>
                </button>
              )}
            </div>
          )}
          {ready && (
            <div className={p.shotActions}>
              <button type="button" className={s.miniBtn} onClick={saveAll}>⬇️ حمّل كل الصور</button>
              <span className={s.ctaNote} style={{ margin: 0 }}>اضغط على أي صورة عشان تكبّرها أو تبعتها</span>
            </div>
          )}
          {prod.framed && <p className={s.note} style={{ marginTop: 12 }}>ℹ️ الجهاز ده ما قدرش يشيل الخلفية، فحطينا صورتك في إطار. جرّب من كروم على كمبيوتر أو موبايل أحدث عشان تاخد المنتج لوحده.</p>}
        </section>
      )}

      {/* ===== 3) كلام الإعلان ===== */}
      {ready && (
        <section className={s.card} ref={sec3} style={{ scrollMarginTop: 80 }}>
          <h2>كلام الإعلان لكل منصة</h2>
          {pack.status !== "done" ? (
            <>
              <p className={p.packLead}>بوست فيسبوك وكابشن إنستجرام ورسالة واتساب وسكريبت ريلز ووصف للمتجر وهاشتاجات، بالمصري ومن معلوماتك بس.</p>
              <button type="button" className={s.cta} onClick={writePack} disabled={pack.status === "busy" || !info.name.trim()}>
                {pack.status === "busy" ? <><span className={s.spin} /> بنكتب الإعلان…</> : "✍️ اكتبلي الإعلان كامل"}
              </button>
              {!info.name.trim() && <p className={s.ctaNote}>اكتب اسم المنتج فوق الأول.</p>}
              {pack.status === "failed" && <p className={s.err}>{pack.error}</p>}
            </>
          ) : (
            <>
              <AdPack pack={pack.data} testImage={testImage} />
              <button type="button" className={s.miniBtn} style={{ marginTop: 10 }} onClick={writePack}>اكتب نسخة تانية</button>
            </>
          )}
        </section>
      )}

      {/* ===== 4) الفيديو ===== */}
      {pack.status === "done" && (
        <section className={s.card}>
          <h2>فيديو إعلان 15 ثانية</h2>
          {!videoOn ? (
            <>
              <p className={p.packLead}>منتجك والشعار والمميزات والسعر في فيديو متحرك للريلز والستوري، من غير علامة مائية.</p>
              <button type="button" className={s.cta} onClick={() => setVideoOn(true)}>🎬 اعمل الفيديو</button>
            </>
          ) : videoImages.length ? (
            <PhotoAdVideo images={videoImages} name={info.name} tagline={pack.data.tagline} features={pack.data.features} offer={info.price ? (info.oldPrice ? `${info.price} بدل ${info.oldPrice}` : info.price) : ""} contact={info.contact} />
          ) : <p className={s.ctaNote}>بنجهّز الصور…</p>}
        </section>
      )}

      {pack.status === "done" && (
        <section className={s.card}>
          <div className={s.next}>
            <Link href="/catalog" className={s.nextCard}><i aria-hidden="true">📒</i><span><b>ضيفه لكتالوجك</b><small>كل منتجاتك في PDF واحد للواتساب</small></span></Link>
            <Link href="/voice-post" className={s.nextCard}><i aria-hidden="true">🎙️</i><span><b>اتكلم واحنا نكتب</b><small>منتج تاني؟ قوله في فويس</small></span></Link>
          </div>
        </section>
      )}

      {preview && shots[preview] && <Preview shot={shots[preview]} name={sceneList.find((x) => x.id === preview)?.name} file={`${preview}-${format}.jpg`} onClose={() => setPreview(null)} />}
    </div>
  );
}

function Preview({ shot, name, file, onClose }) {
  useEffect(() => {
    const k = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.classList.add("rs-modal");
    return () => { window.removeEventListener("keydown", k); document.body.classList.remove("rs-modal"); };
  }, [onClose]);
  async function share() {
    const r = await shareOrDownload(shot.blob, file, name);
    if (r === "downloaded") toast("اتحملت");
  }
  return (
    <div className={p.modal} onClick={onClose} role="dialog" aria-label={name}>
      <div className={p.modalIn} onClick={(e) => e.stopPropagation()}>
        <img src={shot.url} alt={name} />
        <div className={p.modalBar}>
          <button type="button" className={s.cta} onClick={share}>📲 ابعتها أو نزّلها</button>
          <button type="button" className={s.miniBtn} onClick={onClose}>قفل</button>
        </div>
      </div>
    </div>
  );
}
