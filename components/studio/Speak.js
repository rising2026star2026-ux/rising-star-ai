"use client";
// مولد الأصوات والكتاب المسموع: نص أو كتاب كامل يتحوّل لصوت عربي بثلاث لهجات، ذكر وأنثى، بنبرات مختلفة،
// مع مؤثرات ومزيكا خلفية. الكتاب بيتقسّم فقرات والمتصفح بيطلبها واحدة واحدة، فالسماع بيبدأ في ثواني.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Drop, Seg, Range, Note, Busy, styles as s } from "./ui";
import { download } from "./util";
import { extractFile, ACCEPT } from "@/lib/docs";
import { read, write, toast } from "@/lib/store";
import { DIALECTS, GENDERS, TONES, MAX_PITCH_ADJUST, voiceFor, splitText, estimateSeconds, formatDuration, bookId } from "@/lib/speech";
import { AMBIENCE, renderAmbience, encodeWav } from "@/lib/ambience";

const SAMPLE = "السلام عليكم، دي تجربة سريعة للصوت، وبعدها تقدر تبدأ القراءة.";
const MAX_TEXT = 200000;
const MAX_MIXED_CHARS = 10000; // التصدير بالمؤثرات بيتجمّع في الذاكرة، فبنحدّه بحوالي 12 دقيقة
const RATES = [0.8, 0.9, 1, 1.15, 1.3, 1.5];
const MIX_RATE = 24000;
const ambGain = (level) => (level / 100) * 1.2;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const safeName = (n) => String(n || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[\\/:*?"<>|\u0000-\u001f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);

class SpeakError extends Error {
  constructor(msg, status) { super(msg); this.status = status; this.fatal = status === 429 || (status >= 400 && status < 500); }
}

/** بيطلب صوت فقرة من السيرفر. بيعيد المحاولة على أعطال الشبكة والسيرفر، لكن مش على رفض الطلب أو الحد المسموح. */
async function requestAudio(text, voice, tone, pitch) {
  let last = null;
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch("/api/speak", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, voice, tone, pitch }) });
      if (r.ok) {
        const b = await r.blob();
        if (b.size > 500) return b;
        last = new SpeakError("الصوت رجع فاضي.", 502);
      } else {
        const j = await r.json().catch(() => ({}));
        last = new SpeakError(j.error || "الصوت مش متاح دلوقتي.", r.status);
        if (last.fatal) throw last;
      }
    } catch (e) {
      if (e instanceof SpeakError && e.fatal) throw e;
      last = e;
    }
    await sleep(700 * (a + 1));
  }
  throw last instanceof Error ? last : new SpeakError("الصوت مش متاح دلوقتي.", 502);
}

export default function Speak() {
  // المصدر
  const [src, setSrc] = useState("write");
  const [text, setText] = useState("");
  const [doc, setDoc] = useState(null); // { name, pages, note }
  const [loadingDoc, setLoadingDoc] = useState("");
  // الصوت
  const [dialect, setDialect] = useState("eg");
  const [gender, setGender] = useState("f");
  const [tone, setTone] = useState("normal");
  const [pitch, setPitch] = useState(0);
  const [rate, setRate] = useState(1);
  // المؤثرات
  const [amb, setAmb] = useState("none");
  const [ambLevel, setAmbLevel] = useState(30);
  const [ambPreview, setAmbPreview] = useState(false);
  // المشغّل
  const [idx, setIdx] = useState(0);
  const [status, setStatus] = useState("idle"); // idle | loading | playing | paused | done | error
  const [error, setError] = useState("");
  const [exp, setExp] = useState(null); // { done, total, label }
  const [scope, setScope] = useState("all");
  const [partial, setPartial] = useState(null);
  const [resume, setResume] = useState(null);

  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());
  const tokenRef = useRef(0);
  const idxRef = useRef(0);
  const loadedRef = useRef(-1);
  const previewRef = useRef(false);
  const urlRef = useRef("");
  const chainRef = useRef(Promise.resolve());
  const ambNodeRef = useRef(null);
  const ambBufRef = useRef({});
  const expAbort = useRef(null);

  const { chunks, chapters } = useMemo(() => splitText(text), [text]);
  const bookKey = useMemo(() => (text ? bookId(text) : ""), [text]);
  const voice = voiceFor(dialect, gender);
  const cfgRef = useRef({});
  cfgRef.current = { voice, tone, pitch, bookKey, rate };
  const chunksRef = useRef(chunks);
  chunksRef.current = chunks;
  const n = chunks.length;
  const toneInfo = TONES[tone];
  const isBusy = status === "loading" || status === "playing";

  /* ============ الصوت والمؤثرات (Web Audio) ============ */

  const ensureGraph = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return null;
    if (!a.__rsGraph) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const node = ctx.createMediaElementSource(a);
        node.connect(ctx.destination);
        const ag = ctx.createGain();
        ag.gain.value = 1;
        ag.connect(ctx.destination);
        a.__rsGraph = { ctx, ag };
      } catch {
        a.__rsGraph = { ctx: null, ag: null };
      }
    }
    const g = a.__rsGraph;
    try { await g.ctx?.resume(); } catch {}
    return g.ctx ? g : null;
  }, []);

  const ambBuffer = useCallback((ctx, kind) => {
    if (!ambBufRef.current[kind]) {
      const { samples, sampleRate } = renderAmbience(kind, MIX_RATE);
      const b = ctx.createBuffer(1, samples.length, sampleRate);
      b.copyToChannel(samples, 0);
      ambBufRef.current[kind] = b;
    }
    return ambBufRef.current[kind];
  }, []);

  // المؤثر بيشتغل طول ما الصوت شغال (أو وقت التجربة)، وبيتغيّر بنعومة
  useEffect(() => {
    const g = audioRef.current?.__rsGraph;
    if (!g?.ctx) return;
    const want = amb !== "none" && (status === "playing" || status === "loading" || ambPreview);
    const now = g.ctx.currentTime;
    const cur = ambNodeRef.current;
    if (cur && (cur.kind !== amb || !want)) {
      cur.gain.gain.setTargetAtTime(0, now, 0.25);
      setTimeout(() => { try { cur.src.stop(); cur.src.disconnect(); cur.gain.disconnect(); } catch {} }, 1500);
      ambNodeRef.current = null;
    }
    if (want && !ambNodeRef.current) {
      try {
        const src = g.ctx.createBufferSource();
        src.buffer = ambBuffer(g.ctx, amb);
        src.loop = true;
        const gain = g.ctx.createGain();
        gain.gain.value = 0;
        src.connect(gain);
        gain.connect(g.ag);
        src.start();
        gain.gain.setTargetAtTime(ambGain(ambLevel), now, 0.5);
        ambNodeRef.current = { kind: amb, src, gain };
      } catch { toast("المؤثرات مش شغالة في المتصفح ده."); }
    } else if (want && ambNodeRef.current) {
      ambNodeRef.current.gain.gain.setTargetAtTime(ambGain(ambLevel), now, 0.2);
    }
  }, [amb, ambLevel, status, ambPreview, ambBuffer]);

  /* ============ تحميل الفقرات وتشغيلها ============ */

  const getChunk = useCallback((i) => {
    const { voice: v, tone: t, pitch: p, bookKey: b } = cfgRef.current;
    const chunk = chunksRef.current[i];
    if (!chunk) return Promise.reject(new Error("الفقرة مش موجودة."));
    const key = `${b}|${v}|${t}|${p}|${i}`;
    const hit = cacheRef.current.get(key);
    if (hit) return hit;
    const pr = requestAudio(chunk.t, v, t, p);
    cacheRef.current.set(key, pr);
    pr.catch(() => { if (cacheRef.current.get(key) === pr) cacheRef.current.delete(key); });
    return pr;
  }, []);

  const prefetch = useCallback((i) => {
    if (i >= chunksRef.current.length) return;
    chainRef.current = chainRef.current.then(() => getChunk(i)).catch(() => {});
  }, [getChunk]);

  const evict = useCallback((i) => {
    for (const k of cacheRef.current.keys()) {
      const [b, , , , at] = k.split("|");
      if (b !== cfgRef.current.bookKey || Number(at) < i - 2) cacheRef.current.delete(k);
    }
  }, []);

  const setAudioBlob = useCallback((blob) => {
    const a = audioRef.current;
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    urlRef.current = URL.createObjectURL(blob);
    a.src = urlRef.current;
    a.defaultPlaybackRate = cfgRef.current.rate;
    a.playbackRate = cfgRef.current.rate;
    a.preservesPitch = true;
  }, []);

  const playFrom = useCallback(async (i) => {
    if (i < 0 || i >= chunksRef.current.length) return;
    const my = ++tokenRef.current;
    previewRef.current = false;
    idxRef.current = i;
    setIdx(i);
    setStatus("loading");
    setError("");
    audioRef.current?.pause();
    try {
      await ensureGraph();
      const blob = await getChunk(i);
      if (my !== tokenRef.current) return;
      setAudioBlob(blob);
      loadedRef.current = i;
      await audioRef.current.play();
      if (my !== tokenRef.current) return;
      setStatus("playing");
      prefetch(i + 1);
      prefetch(i + 2);
      evict(i);
    } catch (e) {
      if (my !== tokenRef.current) return;
      if (e?.name === "NotAllowedError") { setStatus("paused"); setError("المتصفح وقّف التشغيل. اضغط تشغيل عشان تكمّل."); return; }
      setStatus("error");
      setError(e?.message || "حصلت مشكلة في الصوت.");
    }
  }, [ensureGraph, getChunk, setAudioBlob, prefetch, evict]);

  const pause = useCallback(() => {
    tokenRef.current++;
    audioRef.current?.pause();
    setStatus("paused");
  }, []);

  const play = useCallback(() => {
    if (!chunksRef.current.length) return;
    const a = audioRef.current;
    const i = idxRef.current;
    if (a?.src && loadedRef.current === i && !a.ended && a.currentTime > 0) {
      const my = ++tokenRef.current;
      setStatus("loading");
      ensureGraph().then(() => a.play()).then(() => { if (my === tokenRef.current) setStatus("playing"); }).catch(() => { if (my === tokenRef.current) playFrom(i); });
    } else playFrom(i);
  }, [ensureGraph, playFrom]);

  const goTo = useCallback((i) => {
    const k = Math.max(0, Math.min(chunksRef.current.length - 1, i));
    if (isBusy) playFrom(k);
    else { tokenRef.current++; audioRef.current?.pause(); idxRef.current = k; setIdx(k); loadedRef.current = -1; setStatus("paused"); }
  }, [isBusy, playFrom]);

  const onEnded = useCallback(() => {
    if (previewRef.current) { previewRef.current = false; setStatus("idle"); return; }
    const next = idxRef.current + 1;
    if (next < chunksRef.current.length) playFrom(next);
    else { setStatus("done"); setIdx(0); idxRef.current = 0; loadedRef.current = -1; }
  }, [playFrom]);

  const previewVoice = useCallback(async () => {
    const my = ++tokenRef.current;
    previewRef.current = true;
    audioRef.current?.pause();
    setStatus("loading");
    setError("");
    try {
      await ensureGraph();
      const { voice: v, tone: t, pitch: p } = cfgRef.current;
      const blob = await requestAudio(SAMPLE, v, t, p);
      if (my !== tokenRef.current) return;
      setAudioBlob(blob);
      loadedRef.current = -1;
      await audioRef.current.play();
      if (my === tokenRef.current) setStatus("playing");
    } catch (e) {
      if (my !== tokenRef.current) return;
      previewRef.current = false;
      setStatus("error");
      setError(e?.message || "حصلت مشكلة في الصوت.");
    }
  }, [ensureGraph, setAudioBlob]);

  const toggleAmbPreview = useCallback(async () => {
    if (!ambPreview) await ensureGraph();
    setAmbPreview((v) => !v);
  }, [ambPreview, ensureGraph]);

  // سرعة التشغيل بتتغيّر في اللحظة من غير ما نطلب الصوت تاني
  useEffect(() => {
    const a = audioRef.current;
    if (a) { a.defaultPlaybackRate = rate; a.playbackRate = rate; }
  }, [rate]);

  // لما النص يتغيّر: نوقف ونرجع من الأول
  const resetPlayback = useCallback(() => {
    tokenRef.current++;
    previewRef.current = false;
    audioRef.current?.pause();
    cacheRef.current.clear();
    loadedRef.current = -1;
    idxRef.current = 0;
    setIdx(0);
    setStatus("idle");
    setError("");
    setPartial(null);
  }, []);

  // آخر مكان وقفت عنده في الكتاب ده
  useEffect(() => {
    if (!bookKey || n < 2) { setResume(null); return; }
    const saved = read(`speak:${bookKey}`, null);
    setResume(saved && saved.n === n && saved.i > 0 && saved.i < n ? saved.i : null);
  }, [bookKey, n]);
  useEffect(() => {
    if (bookKey && n > 1 && idx > 0) write(`speak:${bookKey}`, { i: idx, n });
  }, [bookKey, n, idx]);

  // أزرار التحكم على شاشة القفل في الموبايل
  useEffect(() => {
    const ms = typeof navigator !== "undefined" ? navigator.mediaSession : null;
    if (!ms || !isBusy) return;
    try {
      const ci = chapters.length ? chapters.filter((c) => c.chunk <= idx).length - 1 : -1;
      ms.metadata = new MediaMetadata({ title: (ci >= 0 && chapters[ci].title) || doc?.name || "كتاب مسموع", artist: "Rising StarAi" });
      ms.setActionHandler("play", play);
      ms.setActionHandler("pause", pause);
      ms.setActionHandler("nexttrack", () => goTo(idxRef.current + 1));
      ms.setActionHandler("previoustrack", () => goTo(idxRef.current - 1));
    } catch {}
  }, [isBusy, idx, chapters, doc, play, pause, goTo]);

  useEffect(() => () => {
    tokenRef.current++;
    expAbort.current?.abort();
    const a = audioRef.current;
    try { a?.pause(); a?.__rsGraph?.ctx?.suspend(); ambNodeRef.current?.src.stop(); } catch {}
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  /* ============ المصدر: نص أو ملف ============ */

  function onType(v) {
    setText(v);
    setDoc(null);
    resetPlayback();
  }

  async function onFiles(files) {
    setLoadingDoc("بنفتح الملف…");
    setError("");
    try {
      const d = await extractFile(files[0], { onProgress: setLoadingDoc });
      const note = d.cut ? "الملف طويل، فاتقرا أول جزء منه بس." : d.partial ? "الملف صور، فبنقرا أول صفحاته بس." : d.ocred ? "الكلام اتقرا من صورة، فراجع الأخطاء." : "";
      setText(d.text.slice(0, MAX_TEXT * 2));
      setDoc({ name: d.name, pages: d.pages, note });
      resetPlayback();
    } catch (e) {
      toast(e?.message || "ما قدرناش نفتح الملف.");
    } finally {
      setLoadingDoc("");
    }
  }

  function clearDoc() {
    setText("");
    setDoc(null);
    resetPlayback();
  }

  /* ============ التنزيل ============ */

  const chapterNow = chapters.length ? chapters.filter((c) => c.chunk <= idx).length - 1 : -1;
  const range = useMemo(() => {
    if (scope === "chapter" && chapterNow >= 0) return [chapters[chapterNow].chunk, chapters[chapterNow + 1]?.chunk ?? n];
    return [0, n];
  }, [scope, chapterNow, chapters, n]);
  const rangeChars = useMemo(() => chunks.slice(range[0], range[1]).reduce((a, c) => a + c.t.length, 0), [chunks, range]);
  const baseName = safeName(doc?.name) || "كتاب-مسموع";

  async function collect(ac) {
    const out = [];
    const total = range[1] - range[0];
    for (let i = range[0]; i < range[1]; i++) {
      if (ac.signal.aborted) throw new DOMException("aborted", "AbortError");
      setExp({ done: i - range[0], total, label: "بنجهّز الصوت" });
      try { out.push(await getChunk(i)); } catch (e) { e.partialBlobs = out; throw e; }
    }
    setExp({ done: total, total, label: "بنجمّع الملف" });
    return out;
  }

  async function exportMp3() {
    const ac = new AbortController();
    expAbort.current = ac;
    setPartial(null);
    setExp({ done: 0, total: range[1] - range[0], label: "بنجهّز الصوت" });
    try {
      const blobs = await collect(ac);
      download(new Blob(blobs, { type: "audio/mpeg" }), `${baseName}.mp3`);
      toast("الملف جاهز");
    } catch (e) {
      if (e?.name === "AbortError") toast("اتلغى التنزيل.");
      else {
        toast(e?.message || "التنزيل وقف.");
        if (e?.partialBlobs?.length) setPartial({ blob: new Blob(e.partialBlobs, { type: "audio/mpeg" }), count: e.partialBlobs.length });
      }
    } finally {
      setExp(null);
      expAbort.current = null;
    }
  }

  async function exportMixed() {
    const ac = new AbortController();
    expAbort.current = ac;
    setPartial(null);
    try {
      const g = await ensureGraph();
      if (!g) throw new Error("المتصفح ده مش بيدعم دمج المؤثرات. نزّل الصوت بس.");
      const blobs = await collect(ac);
      setExp({ done: blobs.length, total: blobs.length, label: "بنركّب الصوت مع المؤثر" });
      const bufs = [];
      for (const b of blobs) bufs.push(await g.ctx.decodeAudioData(await b.arrayBuffer()));
      const gap = 0.3, tail = 2;
      const total = bufs.reduce((a, b) => a + b.duration + gap, 0) + tail;
      const off = new OfflineAudioContext(1, Math.ceil(total * MIX_RATE), MIX_RATE);
      let t = 0.3;
      for (const b of bufs) {
        const sNode = off.createBufferSource();
        sNode.buffer = b;
        sNode.connect(off.destination);
        sNode.start(t);
        t += b.duration + gap;
      }
      const ab = ambBuffer(off, amb);
      const aNode = off.createBufferSource();
      aNode.buffer = ab;
      aNode.loop = true;
      const ag = off.createGain();
      const lvl = ambGain(ambLevel);
      ag.gain.setValueAtTime(0, 0);
      ag.gain.linearRampToValueAtTime(lvl, 1.2);
      ag.gain.setValueAtTime(lvl, Math.max(1.2, total - 2.5));
      ag.gain.linearRampToValueAtTime(0, total);
      aNode.connect(ag);
      ag.connect(off.destination);
      aNode.start(0);
      const rendered = await off.startRendering();
      download(new Blob([encodeWav(rendered.getChannelData(0), MIX_RATE)], { type: "audio/wav" }), `${baseName}-مع-مؤثرات.wav`);
      toast("الملف جاهز");
    } catch (e) {
      if (e?.name === "AbortError") toast("اتلغى التنزيل.");
      else toast(e?.message || "التجميع وقف.");
    } finally {
      setExp(null);
      expAbort.current = null;
    }
  }

  /* ============ الواجهة ============ */

  const remaining = useMemo(() => {
    let c = 0;
    for (let i = idx; i < n; i++) c += chunks[i].t.length;
    return estimateSeconds(c) / rate;
  }, [chunks, idx, n, rate]);
  const total = estimateSeconds(chunks.reduce((a, c) => a + c.t.length, 0)) / rate;
  const mixedOk = amb !== "none" && rangeChars > 0 && rangeChars <= MAX_MIXED_CHARS;
  const noNow = !n;

  return (
    <div className={s.root}>
      <span className={s.badge}><i />النص بيتحوّل لصوت على خدمة صوت، وملفاتك ما بتتخزنش</span>
      <audio ref={audioRef} preload="auto" onEnded={onEnded} onError={() => { if (urlRef.current) { tokenRef.current++; setStatus("error"); setError("الصوت ما اشتغلش. جرّب تاني."); } }} hidden />

      <div className={s.calcBox}>
        <div className={s.calcForm}>
          <Seg label="النص" value={src} onChange={setSrc} options={[["write", "اكتب أو الزق نص"], ["file", "ارفع كتاب أو ملف"]]} />
          {doc ? (
            <div className={s.spDoc}>
              <b>{doc.name}</b>
              <small>{doc.pages ? `${doc.pages} صفحة · ` : ""}{text.length.toLocaleString("en-US")} حرف · {n.toLocaleString("en-US")} فقرة{chapters.length > 1 ? ` · ${chapters.length} فصل` : ""}</small>
              <button type="button" className="btn ghost" onClick={clearDoc}>شيل الملف</button>
            </div>
          ) : loadingDoc ? (
            <Busy text={loadingDoc} />
          ) : src === "write" ? (
            <label className={s.field}>
              <span className={s.fieldLabel}>اكتب أو الزق النص هنا</span>
              <textarea className={s.input} rows={6} dir="auto" maxLength={MAX_TEXT} value={text} onChange={(e) => onType(e.target.value)} placeholder="اكتب كلامك أو الزق فصل من كتاب…" />
            </label>
          ) : (
            <Drop accept={ACCEPT} onFiles={onFiles} title="اسحب الكتاب هنا أو اضغط تختار" hint="PDF أو Word أو TXT أو صورة. الكتب الكبيرة مظبوطة، والملف بيتقرا على جهازك." />
          )}
          {doc?.note && <Note>{doc.note}</Note>}
          {src === "write" && !doc && <Note>للكتب الطويلة ارفع الملف مباشرة، وهتلاقي الفصول متقسمة تلقائياً. الأداة للنصوص والكتب اللي تملكها أو المتاحة للعامة.</Note>}

          <hr className={s.qrSep} />

          <Seg label="اللهجة" value={dialect} onChange={setDialect} options={DIALECTS.map((d) => [d.id, d.name])} />
          <Seg label="الصوت" value={gender} onChange={setGender} options={GENDERS} />
          <div className={s.field}>
            <span className={s.fieldLabel}>النبرة</span>
            <div className={s.qrTypes} role="group" aria-label="النبرة">
              {Object.entries(TONES).map(([k, t]) => (
                <button key={k} type="button" aria-pressed={tone === k} className={`${s.qrType} ${tone === k ? s.qrTypeOn : ""}`} onClick={() => setTone(k)}>{t.name}</button>
              ))}
            </div>
          </div>
          {toneInfo.approx && <Note>صوت الطفل هنا تقريبي: بنرفع درجة الصوت بس، فممكن يطلع مصطنع شوية. الأصوات الجاهزة مالهاش أعمار ولا مشاعر حقيقية.</Note>}
          <Range label="غلظ أو رفع الصوت" value={pitch} min={-MAX_PITCH_ADJUST} max={MAX_PITCH_ADJUST} step={2} onChange={setPitch} format={(v) => (v === 0 ? "عادي" : v > 0 ? `أرفع ${v}` : `أغلظ ${-v}`)} />
          <Seg label="سرعة التشغيل" value={rate} onChange={setRate} options={RATES.map((r) => [r, r === 1 ? "عادي" : `${r}×`])} />
          <button type="button" className="btn ghost" disabled={exp !== null} onClick={previewVoice}>جرّب الصوت</button>
          {isBusy && n > 0 && <Note>أي تغيير في اللهجة أو الصوت أو النبرة هيبان من الفقرة الجاية.</Note>}

          <hr className={s.qrSep} />

          <div className={s.field}>
            <span className={s.fieldLabel}>مؤثرات ومزيكا خلفية</span>
            <div className={s.qrTypes} role="group" aria-label="المؤثرات">
              {AMBIENCE.map(([k, name]) => (
                <button key={k} type="button" aria-pressed={amb === k} className={`${s.qrType} ${amb === k ? s.qrTypeOn : ""}`} onClick={() => { setAmb(k); if (k === "none") setAmbPreview(false); }}>{name}</button>
              ))}
            </div>
          </div>
          {amb !== "none" && (
            <>
              <Range label="مستوى المؤثر" value={ambLevel} min={5} max={100} step={5} onChange={setAmbLevel} unit="%" />
              <button type="button" className="btn ghost" onClick={toggleAmbPreview}>{ambPreview ? "وقّف التجربة" : "جرّب المؤثر"}</button>
            </>
          )}
        </div>

        <div className={s.calcAside}>
          <div className={s.spNow} aria-live="polite">
            {noNow ? <span className={s.spHint}>اكتب نص أو ارفع كتاب وهيظهر هنا.</span> : (
              <>
                {chapterNow >= 0 && <small>{chapters[chapterNow].title}</small>}
                <p dir="auto">{chunks[idx]?.t}</p>
              </>
            )}
          </div>

          {!noNow && (
            <>
              <input type="range" className={s.spBar} min={0} max={Math.max(0, n - 1)} value={idx} aria-label="مكان القراءة"
                onChange={(e) => { idxRef.current = Number(e.target.value); setIdx(Number(e.target.value)); }}
                onPointerUp={(e) => goTo(Number(e.currentTarget.value))} onKeyUp={(e) => goTo(Number(e.currentTarget.value))} />
              <div className={s.spMeta}>
                <span>فقرة {(idx + 1).toLocaleString("en-US")} من {n.toLocaleString("en-US")}</span>
                <span>{status === "done" ? formatDuration(total) : `باقي ${formatDuration(remaining)}`}</span>
              </div>
            </>
          )}

          <div className={s.spCtl}>
            <button type="button" className={s.spBtn} aria-label="الفقرة السابقة" disabled={noNow || idx === 0} onClick={() => goTo(idx - 1)}>⏮</button>
            {status === "playing" || status === "loading" ? (
              <button type="button" className={`${s.spBtn} ${s.spBtnMain}`} aria-label="إيقاف مؤقت" onClick={pause}>⏸</button>
            ) : (
              <button type="button" className={`${s.spBtn} ${s.spBtnMain}`} aria-label="تشغيل" disabled={noNow} onClick={play}>▶</button>
            )}
            <button type="button" className={s.spBtn} aria-label="الفقرة التالية" disabled={noNow || idx >= n - 1} onClick={() => goTo(idx + 1)}>⏭</button>
          </div>
          {status === "loading" && <Note>بنجهّز الفقرة…</Note>}
          {status === "done" && <Note>خلص النص.</Note>}
          {error && <Note tone="warn">{error}</Note>}

          {chapters.length > 1 && (
            <label className={s.field}>
              <span className={s.fieldLabel}>الفصول</span>
              <select className={s.input} value={chapterNow >= 0 ? chapterNow : ""} onChange={(e) => goTo(chapters[Number(e.target.value)].chunk)}>
                {chapterNow < 0 && <option value="" disabled>البداية</option>}
                {chapters.map((c, i) => <option key={i} value={i}>{c.title}</option>)}
              </select>
            </label>
          )}
          {resume !== null && idx === 0 && !isBusy && (
            <button type="button" className="btn ghost" onClick={() => { goTo(resume); setResume(null); }}>كمّل من الفقرة {(resume + 1).toLocaleString("en-US")}</button>
          )}

          {!noNow && (
            <>
              <hr className={s.qrSep} />
              {chapters.length > 1 && chapterNow >= 0 && (
                <Seg label="التنزيل" value={scope} onChange={setScope} options={[["all", "الكتاب كله"], ["chapter", "الفصل الحالي"]]} />
              )}
              {exp ? (
                <div className={s.spProg} role="status">
                  <progress max={exp.total || 1} value={exp.done} />
                  <small>{exp.label}… {exp.done.toLocaleString("en-US")} من {exp.total.toLocaleString("en-US")}</small>
                  <button type="button" className="btn ghost" onClick={() => expAbort.current?.abort()}>إلغاء</button>
                </div>
              ) : (
                <>
                  <button type="button" className="btn" onClick={exportMp3}>نزّل الصوت MP3 · {formatDuration(estimateSeconds(rangeChars))}</button>
                  {amb !== "none" && (
                    <button type="button" className="btn ghost" disabled={!mixedOk} onClick={exportMixed}>نزّل الصوت مع المؤثر (WAV)</button>
                  )}
                  {amb !== "none" && !mixedOk && rangeChars > MAX_MIXED_CHARS && <Note>التنزيل مع المؤثر لحد حوالي 12 دقيقة. اختار «الفصل الحالي» أو نزّل الصوت بس.</Note>}
                  {partial && (
                    <button type="button" className="btn ghost" onClick={() => download(partial.blob, `${baseName}-جزء.mp3`)}>نزّل الجزء اللي اتجهز ({partial.count.toLocaleString("en-US")} فقرة)</button>
                  )}
                </>
              )}
              <Note>بنجهّز الصوت فقرة فقرة، فالكتاب الطويل بياخد وقت في التنزيل. على الموبايل خلّي الشاشة شغالة أثناء القراءة.</Note>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
