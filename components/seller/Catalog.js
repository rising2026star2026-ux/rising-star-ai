"use client";
// «كتالوجك في دقيقة»: صور المنتجات ← كتالوج PDF شيك بزراير طلب واتساب حقيقية، وصور للحالة، وكتالوج نصي.
// كل حاجة بتتحفظ على جهاز البياع، فيرجع يكمّل أو يحدّث الأسعار في أي وقت.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { readImage, scaledCanvas, canvasBlob, blobToDataUrl, shareOrDownload, copyText, loadFonts } from "@/lib/imagefile";
import { cutoutCanvas, trimAlpha, progressTracker } from "@/components/studio/cutout";
import { read, write, toast } from "@/lib/store";
import { THEMES, LAYOUTS, renderCatalog, waLink } from "./catalogRender";
import { buildPdf, pageImages, makeQr } from "./catalogPdf";
import s from "./seller.module.css";
import k from "./catalog.module.css";

const MAX = 30;
const KEY = "catalog";
const uid = () => Math.random().toString(36).slice(2, 9);
const EMPTY = { shop: { name: "", phone: "", tagline: "" }, logo: "", theme: "night", layout: "phone", products: [] };

async function toStoredImage(src, max = 800) {
  const c = scaledCanvas(src, max);
  return blobToDataUrl(await canvasBlob(c, "image/jpeg", 0.85));
}

/** المنتج بعد إزالة الخلفية على مربع أبيض بهامش، عشان كل الكتالوج يبقى بنفس الشكل */
function onWhite(cut) {
  const size = Math.round(Math.max(cut.width, cut.height) * 1.18);
  const c = document.createElement("canvas");
  c.width = size; c.height = size;
  const x = c.getContext("2d");
  x.fillStyle = "#fff"; x.fillRect(0, 0, size, size);
  x.drawImage(cut, (size - cut.width) / 2, (size - cut.height) / 2);
  return c;
}

export default function Catalog() {
  const [data, setData] = useState(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [imgs, setImgs] = useState({}); // id → HTMLImageElement
  const [logoImg, setLogoImg] = useState(null);
  const [previews, setPreviews] = useState([]);
  const [busy, setBusy] = useState(""); // نص الحالة
  const [bgPct, setBgPct] = useState(null);
  const [error, setError] = useState("");
  const [big, setBig] = useState(null);
  const pagesRef = useRef([]);
  const urls = useRef([]);

  // الحفظ على الجهاز
  useEffect(() => { const d = read(KEY, null); if (d?.products) setData({ ...EMPTY, ...d, shop: { ...EMPTY.shop, ...d.shop } }); setLoaded(true); }, []);
  useEffect(() => {
    if (!loaded) return;
    try { localStorage.setItem("rs:" + KEY, JSON.stringify(data)); } catch { setError("مساحة الحفظ على الجهاز اتملت. الكتالوج شغال بس مش هيتحفظ لو قفلت الصفحة."); }
  }, [data, loaded]);

  // تحميل الصور كعناصر جاهزة للرسم
  useEffect(() => {
    let dead = false;
    (async () => {
      const next = {};
      for (const p of data.products) {
        if (!p.img) continue;
        if (imgs[p.id]?.src === p.img) { next[p.id] = imgs[p.id]; continue; }
        const im = new Image();
        im.src = p.img;
        try { await im.decode(); next[p.id] = im; } catch {}
      }
      if (!dead) setImgs(next);
    })();
    return () => { dead = true; };
  }, [data.products.map((p) => p.id + p.img.length).join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!data.logo) { setLogoImg(null); return; }
    const im = new Image(); im.src = data.logo; im.decode().then(() => setLogoImg(im)).catch(() => setLogoImg(null));
  }, [data.logo]);

  const setShop = (patch) => setData((d) => ({ ...d, shop: { ...d.shop, ...patch } }));
  const setProduct = (id, patch) => setData((d) => ({ ...d, products: d.products.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  const removeProduct = (id) => setData((d) => ({ ...d, products: d.products.filter((p) => p.id !== id) }));
  const move = (id, dir) => setData((d) => {
    const i = d.products.findIndex((p) => p.id === id), j = i + dir;
    if (i < 0 || j < 0 || j >= d.products.length) return d;
    const ps = [...d.products]; [ps[i], ps[j]] = [ps[j], ps[i]];
    return { ...d, products: ps };
  });

  async function addPhotos(e) {
    const files = [...(e.target.files || [])];
    e.target.value = "";
    setError("");
    const room = MAX - data.products.length;
    if (room <= 0) { setError(`الكتالوج فيه ${MAX} منتج، وده الحد الأقصى.`); return; }
    for (const f of files.slice(0, room)) {
      try {
        const im = await readImage(f);
        const img = await toStoredImage(im);
        setData((d) => ({ ...d, products: [...d.products, { id: uid(), img, name: "", price: "", oldPrice: "", desc: "", clean: false }] }));
      } catch (er) { setError(er.message); }
    }
    if (files.length > room) setError(`اتضاف ${room} بس، الحد الأقصى ${MAX} منتج.`);
  }

  async function replacePhoto(id, e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { const im = await readImage(f); setProduct(id, { img: await toStoredImage(im), clean: false }); } catch (er) { setError(er.message); }
  }

  async function onLogo(e) {
    const f = e.target.files?.[0];
    e.target.value = "";
    if (!f) return;
    try { const im = await readImage(f); const url = await toStoredImage(im, 400); setData((d) => ({ ...d, logo: url })); } catch (er) { setError(er.message); }
  }

  async function cleanBackgrounds(only) {
    const list = data.products.filter((p) => (only ? p.id === only : !p.clean));
    if (!list.length) return;
    setError("");
    setBusy(list.length > 1 ? "بنشيل خلفيات المنتجات…" : "بنشيل الخلفية…");
    setBgPct(0);
    let failed = 0;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      try {
        const im = imgs[p.id] || (await readImage(await (await fetch(p.img)).blob()));
        const src = scaledCanvas(im, 900);
        const cut = await cutoutCanvas(src, progressTracker((pct) => setBgPct(pct)), () => setBusy(`بنشيل الخلفيات… ${i + 1} من ${list.length}`));
        const t = trimAlpha(cut);
        if (!t) throw new Error("empty");
        setProduct(p.id, { img: await toStoredImage(onWhite(t)), clean: true });
      } catch { failed++; }
    }
    setBusy(""); setBgPct(null);
    if (failed) setError(failed === list.length ? "الجهاز ده ما قدرش يشيل الخلفية. جرّب من كروم على كمبيوتر أو موبايل أحدث." : `${failed} صورة ما اتشالتش خلفيتها، وفضلت زي ما هي.`);
  }

  async function nameFromPhotos() {
    const list = data.products.filter((p) => !p.name.trim()).slice(0, 12);
    if (!list.length) { toast("كل المنتجات ليها أسماء"); return; }
    setError("");
    let done = 0;
    for (const p of list) {
      setBusy(`بنتعرّف على المنتجات من صورها… ${done + 1} من ${list.length}`);
      try {
        const r = await fetch("/api/product-eye", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ image: p.img }) });
        const j = await r.json().catch(() => ({}));
        if (r.ok && j.name) setProduct(p.id, { name: j.name });
        else if (r.status === 429) { setError(j.error); break; }
      } catch {}
      done++;
    }
    setBusy("");
  }

  async function writeDescs() {
    const named = data.products.filter((p) => p.name.trim());
    if (!named.length) { setError("اكتب أسماء المنتجات الأول (أو اضغط «سمّي المنتجات من صورها»)."); return; }
    setBusy("بنكتب الأوصاف…"); setError("");
    try {
      const r = await fetch("/api/catalog-copy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ shop: data.shop.name, products: named.map((p) => ({ name: p.name, price: p.price })) }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(j.error || "حصلت مشكلة.");
      const byId = Object.fromEntries(named.map((p, i) => [p.id, j.descs[i] || ""]));
      setData((d) => ({ ...d, shop: { ...d.shop, tagline: d.shop.tagline || j.tagline || "" }, products: d.products.map((p) => (byId[p.id] && !p.desc.trim() ? { ...p, desc: byId[p.id] } : p)) }));
    } catch (e) { setError(e.message); }
    setBusy("");
  }

  // المعاينة: كل الصفحات بتترسم من جديد بعد أي تعديل
  const renderInput = useMemo(() => ({
    shop: data.shop, theme: data.theme, layout: data.layout, logo: logoImg,
    products: data.products.map((p) => ({ ...p, image: imgs[p.id] })),
  }), [data.shop, data.theme, data.layout, data.products, imgs, logoImg]);

  useEffect(() => {
    if (!data.products.length) { setPreviews([]); pagesRef.current = []; return; }
    let dead = false;
    const t = setTimeout(async () => {
      await loadFonts();
      const qr = data.shop.phone ? await makeQr(waLink(data.shop.phone, "").split("?")[0]) : null;
      if (dead) return;
      const pages = renderCatalog(renderInput, qr);
      pagesRef.current = pages;
      const next = [];
      for (const p of pages) {
        const b = await canvasBlob(scaledCanvas(p.canvas, 640), "image/jpeg", 0.82);
        next.push(URL.createObjectURL(b));
      }
      if (dead) { next.forEach(URL.revokeObjectURL); return; }
      urls.current.forEach(URL.revokeObjectURL);
      urls.current = next;
      setPreviews(next);
    }, 450);
    return () => { dead = true; clearTimeout(t); };
  }, [renderInput]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => urls.current.forEach(URL.revokeObjectURL), []);

  const fileBase = (data.shop.name || "catalog").replace(/[\\/:*?"<>|]/g, "").trim().slice(0, 40) || "catalog";

  async function downloadPdf() {
    if (!pagesRef.current.length) return;
    setBusy("بنجهّز ملف الـ PDF…");
    try {
      const blob = await buildPdf(pagesRef.current, data.layout, `كتالوج ${data.shop.name}`);
      const r = await shareOrDownload(blob, `${fileBase}.pdf`, `كتالوج ${data.shop.name}`);
      if (r === "downloaded") toast("الكتالوج اتحمّل");
    } catch (e) { setError("ما قدرناش نعمل الـ PDF. جرّب تاني."); console.error(e); }
    setBusy("");
  }
  async function downloadImages() {
    setBusy("بنجهّز الصور…");
    const list = await pageImages(pagesRef.current);
    try {
      const files = list.map((x) => new File([x.blob], x.name, { type: "image/jpeg" }));
      if (navigator.canShare?.({ files })) { await navigator.share({ files }); setBusy(""); return; }
    } catch (e) { if (e?.name === "AbortError") { setBusy(""); return; } }
    for (const x of list) { await shareOrDownload(x.blob, x.name); await new Promise((r) => setTimeout(r, 350)); }
    setBusy("");
  }
  function textCatalog() {
    const lines = [`*${data.shop.name || "كتالوج"}*`, data.shop.tagline || "", ""];
    data.products.forEach((p, i) => {
      lines.push(`*${i + 1}. ${p.name || "منتج"}*${p.price ? ` — ${p.price}` : ""}${p.oldPrice ? ` ~${p.oldPrice}~` : ""}`);
      if (p.desc) lines.push(p.desc);
      lines.push("");
    });
    lines.push(data.shop.phone ? `للطلب ابعت رقم المنتج واتساب: ${data.shop.phone}` : "للطلب ابعت رقم المنتج");
    return lines.filter((l, i, a) => !(l === "" && a[i - 1] === "")).join("\n").trim();
  }

  const ready = data.products.length > 0;
  const unnamed = data.products.filter((p) => !p.name.trim()).length;
  const dirty = data.products.filter((p) => !p.clean).length;

  return (
    <div className={s.body}>
      {/* ===== المحل ===== */}
      <section className={s.card}>
        <h2>بيانات المحل</h2>
        <div className={k.shopGrid}>
          <label className={k.logo}>
            <input type="file" accept="image/*" onChange={onLogo} aria-label="لوجو المحل" />
            {data.logo ? <img src={data.logo} alt="اللوجو" /> : <span>+ لوجو<small>اختياري</small></span>}
          </label>
          <div className={k.shopFields}>
            <input className={s.input} value={data.shop.name} onChange={(e) => setShop({ name: e.target.value })} placeholder="اسم المحل أو الصفحة *" maxLength={40} aria-label="اسم المحل" />
            <input className={s.input} value={data.shop.phone} onChange={(e) => setShop({ phone: e.target.value.replace(/[^\d+ ]/g, "") })} placeholder="رقم الواتساب: 01012345678" inputMode="tel" dir="ltr" maxLength={16} aria-label="رقم الواتساب" />
            <input className={s.input} value={data.shop.tagline} onChange={(e) => setShop({ tagline: e.target.value })} placeholder="جملة صغيرة: «أحلى شنط بأحسن سعر» (اختياري)" maxLength={70} aria-label="جملة الغلاف" />
          </div>
        </div>
        <div className={k.opts}>
          <div>
            <span className={k.optT}>الألوان</span>
            <div className={k.themes}>
              {Object.entries(THEMES).map(([id, t]) => (
                <button key={id} type="button" className={`${k.theme} ${data.theme === id ? k.themeOn : ""}`} onClick={() => setData((d) => ({ ...d, theme: id }))} aria-pressed={data.theme === id} title={t.name}>
                  <i style={{ background: `linear-gradient(135deg, ${t.bg} 50%, ${t.accent} 50%)` }} />{t.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <span className={k.optT}>المقاس</span>
            <div className={s.chips}>
              {Object.entries(LAYOUTS).map(([id, l]) => (
                <button key={id} type="button" className={s.chip} aria-pressed={data.layout === id} onClick={() => setData((d) => ({ ...d, layout: id }))}>{l.name}</button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== المنتجات ===== */}
      <section className={s.card}>
        <div className={k.head}>
          <h2>المنتجات <small>{data.products.length} / {MAX}</small></h2>
          <label className={`${s.cta} ${k.add}`}>
            <input type="file" accept="image/*" multiple onChange={addPhotos} aria-label="ضيف صور منتجات" />
            + ضيف صور منتجات
          </label>
        </div>
        {!ready ? (
          <p className={k.empty}>اختار صور منتجاتك مرة واحدة (لحد {MAX} صورة)، وبعدها اكتب الاسم والسعر، أو خلّي الذكاء الاصطناعي يسمّيهم.</p>
        ) : (
          <>
            <div className={k.magic}>
              <button type="button" className={s.miniBtn} onClick={nameFromPhotos} disabled={!!busy || !unnamed}>✨ سمّي المنتجات من صورها {unnamed ? `(${unnamed})` : ""}</button>
              <button type="button" className={s.miniBtn} onClick={writeDescs} disabled={!!busy}>✍️ اكتب الأوصاف</button>
              <button type="button" className={s.miniBtn} onClick={() => cleanBackgrounds()} disabled={!!busy || !dirty}>🪄 شيل الخلفيات وحطها على أبيض</button>
            </div>
            {busy && <p className={k.busy} role="status"><span className={s.spin} />{busy}{bgPct !== null && bgPct < 100 ? ` (بنحمّل الأداة ${bgPct}%)` : ""}</p>}
            <ol className={k.list}>
              {data.products.map((p, i) => (
                <li key={p.id} className={k.row}>
                  <label className={k.thumb} title="غيّر الصورة">
                    <input type="file" accept="image/*" onChange={(e) => replacePhoto(p.id, e)} aria-label={`غيّر صورة المنتج ${i + 1}`} />
                    <img src={p.img} alt="" />
                    <b>{i + 1}</b>
                  </label>
                  <div className={k.fields}>
                    <input className={s.input} value={p.name} onChange={(e) => setProduct(p.id, { name: e.target.value })} placeholder="اسم المنتج" maxLength={60} aria-label={`اسم المنتج ${i + 1}`} />
                    <div className={k.prices}>
                      <input className={s.input} value={p.price} onChange={(e) => setProduct(p.id, { price: e.target.value })} placeholder="السعر: 350 ج" maxLength={20} aria-label={`سعر المنتج ${i + 1}`} />
                      <input className={s.input} value={p.oldPrice} onChange={(e) => setProduct(p.id, { oldPrice: e.target.value })} placeholder="قبل الخصم" maxLength={20} aria-label={`السعر قبل الخصم ${i + 1}`} />
                    </div>
                    <input className={s.input} value={p.desc} onChange={(e) => setProduct(p.id, { desc: e.target.value })} placeholder="وصف قصير (اختياري)" maxLength={90} aria-label={`وصف المنتج ${i + 1}`} />
                  </div>
                  <div className={k.rowBtns}>
                    <button type="button" onClick={() => move(p.id, -1)} disabled={i === 0} aria-label="لفوق">↑</button>
                    <button type="button" onClick={() => move(p.id, 1)} disabled={i === data.products.length - 1} aria-label="لتحت">↓</button>
                    {!p.clean && <button type="button" onClick={() => cleanBackgrounds(p.id)} disabled={!!busy} aria-label="شيل الخلفية" title="شيل الخلفية">🪄</button>}
                    <button type="button" onClick={() => removeProduct(p.id)} aria-label="امسح المنتج" className={k.del}>×</button>
                  </div>
                </li>
              ))}
            </ol>
          </>
        )}
        {error && <p className={s.err} role="alert">{error}</p>}
      </section>

      {/* ===== المعاينة والتحميل ===== */}
      {ready && (
        <section className={s.card}>
          <h2>كتالوجك جاهز 🎉</h2>
          <p className={k.lead}>{previews.length} صفحات: غلاف، والمنتجات بأرقامها، وصفحة «إزاي تطلب». كل زرار «اطلب» في الـ PDF بيفتح واتساب برسالة فيها رقم المنتج.</p>
          <div className={k.pages}>
            {previews.map((u, i) => (
              <button key={u} type="button" className={`${k.page} ${data.layout === "a4" ? k.a4 : ""}`} onClick={() => setBig(i)} aria-label={`صفحة ${i + 1}`}>
                <img src={u} alt="" /><span>{i + 1}</span>
              </button>
            ))}
            {!previews.length && <p className={k.busy}><span className={s.spin} />بنرسم الصفحات…</p>}
          </div>
          {!data.shop.phone && <p className={s.note} style={{ marginBottom: 12 }}>✍️ اكتب رقم الواتساب فوق عشان زراير «اطلب» تشتغل.</p>}
          <div className={k.exports}>
            <button type="button" className={s.cta} onClick={downloadPdf} disabled={!!busy || !previews.length}>📄 حمّل الكتالوج PDF</button>
            <button type="button" className={`${s.cta} ${s.blue}`} onClick={downloadImages} disabled={!!busy || !previews.length}>🖼️ صور للحالة والستوري</button>
            <button type="button" className={s.miniBtn} onClick={async () => { if (await copyText(textCatalog())) toast("الكتالوج النصي اتنسخ"); }}>💬 انسخ كتالوج نصي للواتساب</button>
          </div>
          <p className={s.ctaNote}>محفوظ على جهازك: ارجع في أي وقت وغيّر الأسعار وحمّل نسخة جديدة.</p>
        </section>
      )}

      <section className={s.card}>
        <div className={s.next}>
          <Link href="/photo-ad" className={s.nextCard}><i aria-hidden="true">📸</i><span><b>صوّرها بموبايلك</b><small>صور استوديو وإعلان كامل لأي منتج</small></span></Link>
          <Link href="/test-ad" className={s.nextCard}><i aria-hidden="true">👥</i><span><b>جرّب إعلانك على 100 زبون</b><small>قبل ما تدفع في الإعلان</small></span></Link>
        </div>
      </section>

      {big !== null && previews[big] && (
        <div className={k.modal} onClick={() => setBig(null)} role="dialog" aria-label={`صفحة ${big + 1}`}>
          <img src={previews[big]} alt="" onClick={(e) => e.stopPropagation()} />
          <div className={k.modalNav} onClick={(e) => e.stopPropagation()}>
            <button type="button" className={s.miniBtn} onClick={() => setBig(Math.max(0, big - 1))} disabled={big === 0}>→ السابقة</button>
            <span>{big + 1} / {previews.length}</span>
            <button type="button" className={s.miniBtn} onClick={() => setBig(Math.min(previews.length - 1, big + 1))} disabled={big === previews.length - 1}>التالية ←</button>
            <button type="button" className={s.miniBtn} onClick={() => setBig(null)}>قفل</button>
          </div>
        </div>
      )}
    </div>
  );
}
