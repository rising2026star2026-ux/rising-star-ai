"use client";
// تفريغ التسجيلات الطويلة (لحد حوالي ساعة): محاضرة، اجتماع، بودكاست، مقابلة.
// المتصفح بيفك الصوت ويحوّله مونو 16 كيلوهرتز ويقسمه أجزاء عند لحظات السكوت، وكل جزء بيتفرّغ على السيرفر
// بأسماء المتكلمين والتوقيت. الملف الأصلي ما بيترفعش كله، والأجزاء ما بتتخزنش.
import { useEffect, useRef, useState } from "react";
import { read, write } from "@/lib/store";
import { Drop } from "./ui";
import { RATE, MAX_MINUTES, MAX_FILE_MB, planChunks, floatToWav, fmtTime, toTxt, toSrt, speakersOf } from "@/lib/longaudio";
import s from "./audio.module.css";

const KEY = "long-transcribe-last";
const PARALLEL = 3;
const LANGS = [["ar", "عربي"], ["mix", "عربي وإنجليزي"], ["en", "إنجليزي"]];

async function decodeMono(file) {
  const buf = await file.arrayBuffer();
  let ctx;
  try { ctx = new AudioContext({ sampleRate: RATE }); } catch { ctx = new AudioContext(); }
  let audio;
  try { audio = await ctx.decodeAudioData(buf); } finally { ctx.close?.(); }
  if (audio.sampleRate === RATE && audio.numberOfChannels === 1) return audio.getChannelData(0);
  // تحويل التردد ودمج القنوات في قناة واحدة
  const off = new OfflineAudioContext(1, Math.ceil(audio.duration * RATE), RATE);
  const src = off.createBufferSource();
  src.buffer = audio;
  src.connect(off.destination);
  src.start();
  const out = await off.startRendering();
  return out.getChannelData(0);
}

function download(text, name, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function errText(r) {
  try { return (await r.json()).error || "حصلت مشكلة."; } catch { return "حصلت مشكلة."; }
}

export default function LongTranscribe() {
  const [enabled, setEnabled] = useState(true);
  const [file, setFile] = useState(null);
  const [total, setTotal] = useState(0);
  const [lang, setLang] = useState("ar");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [bySeg, setBySeg] = useState([]); // مقاطع كل جزء أو null
  const [names, setNames] = useState({});
  const [title, setTitle] = useState("");
  const [saved, setSaved] = useState(null);
  const samplesRef = useRef(null);
  const plan = useRef([]);
  const stopRef = useRef(null);

  useEffect(() => {
    const last = read(KEY, null);
    if (last?.segs?.length) setSaved(last);
    fetch("/api/transcribe-long").then((r) => r.json()).then((j) => setEnabled(!!j.enabled)).catch(() => {});
  }, []);

  const segs = (bySeg.some(Boolean) ? bySeg.flatMap((x) => x || []) : saved?.segs || []);
  const showNames = bySeg.some(Boolean) ? names : { ...(saved?.names || {}), ...names };
  const shownTitle = title || (bySeg.some(Boolean) ? "" : saved?.title || "");
  const done = bySeg.filter(Boolean).length;
  const chunks = plan.current.length;
  const speakers = speakersOf(segs);

  useEffect(() => {
    if (bySeg.length && done === bySeg.length) write(KEY, { title: shownTitle, segs, names, total });
    else if (!bySeg.length && saved) write(KEY, { ...saved, title: shownTitle, names: showNames });
  }, [done, names, title]); // eslint-disable-line react-hooks/exhaustive-deps

  async function pick([f]) {
    if (!f) return;
    setErr(""); setBySeg([]); setNames({}); setSaved(null); setTotal(0); samplesRef.current = null; plan.current = [];
    if (f.size > MAX_FILE_MB * 1024 * 1024) { setErr(`الملف أكبر من ${MAX_FILE_MB} ميجا. قصّه أو حوّله لـ MP3 الأول.`); return; }
    setFile(f); setTitle(f.name.replace(/\.[^.]+$/, ""));
    setBusy("decode");
    try {
      const samples = await decodeMono(f);
      const secs = samples.length / RATE;
      if (secs < 1) throw new Error("التسجيل فاضي أو قصير جداً.");
      if (secs > MAX_MINUTES * 60) throw new Error(`التسجيل أطول من ${MAX_MINUTES} دقيقة. قسّمه لجزئين وفرّغ كل واحد لوحده.`);
      samplesRef.current = samples;
      plan.current = planChunks(samples);
      setTotal(secs);
      setBySeg(plan.current.map(() => null));
    } catch (e) {
      setErr(e?.message && !/decode|Unable/i.test(e.message) ? e.message : "المتصفح ما قدرش يقرا الملف ده. جرّب MP3 أو M4A أو WAV، أو افتحه من الكمبيوتر.");
      setFile(null);
    } finally { setBusy(""); }
  }

  async function runOne(i, got, ctl) {
    const [a, b] = plan.current[i];
    const wav = floatToWav(samplesRef.current.subarray(a, b));
    const prev = got.slice(0, i).reverse().find(Boolean);
    const known = speakersOf(got.flatMap((x) => x || []));
    const ctx = { speakers: known, last: prev?.[prev.length - 1]?.text || "", lang };
    const r = await fetch("/api/transcribe-long", {
      method: "POST", body: wav, signal: ctl.signal,
      headers: { "Content-Type": "audio/wav", "x-ctx": encodeURIComponent(JSON.stringify(ctx)) },
    });
    if (!r.ok) throw new Error(await errText(r));
    const j = await r.json();
    const offset = a / RATE;
    return (j.segments || []).map((x) => ({ ...x, start: x.start + offset }));
  }

  async function start() {
    if (!samplesRef.current) return;
    setErr(""); setBusy("run");
    const ctl = new AbortController(); stopRef.current = ctl;
    const got = [...bySeg];
    const todo = got.map((x, i) => (x ? -1 : i)).filter((i) => i >= 0);
    try {
      // أول جزء لوحده عشان الأجزاء اللي بعده تعرف المتكلمين
      if (todo[0] === 0 || !got.some(Boolean)) {
        const first = todo.shift();
        got[first] = await runOne(first, got, ctl);
        setBySeg([...got]);
      }
      let failed = null;
      const worker = async () => {
        while (todo.length && !failed && !ctl.signal.aborted) {
          const i = todo.shift();
          try {
            got[i] = await runOne(i, got, ctl);
            setBySeg([...got]);
          } catch (e) { failed = failed || e; }
        }
      };
      await Promise.all(Array.from({ length: PARALLEL }, worker));
      if (failed) throw failed;
    } catch (e) {
      if (e.name !== "AbortError") setErr(`${e.message || "حصلت مشكلة."} اللي اتفرّغ محفوظ، دوس «كمّل التفريغ».`);
    } finally { setBusy(""); stopRef.current = null; }
  }

  const base = (shownTitle || "transcript").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) || "transcript";
  const finished = segs.length > 0 && (!bySeg.length || done === bySeg.length);

  return (
    <div className={s.root}>
      {!enabled && <p className={s.warn}>التفريغ الطويل مش مفعّل دلوقتي.</p>}

      <section className={s.box}>
        <h3 className={s.boxTitle}>1. ارفع التسجيل <small>لحد {MAX_MINUTES} دقيقة · MP3 أو M4A أو WAV أو فيديو</small></h3>
        <Drop accept="audio/*,video/*,.mp3,.m4a,.wav,.ogg,.opus,.aac,.mp4,.webm" onFiles={pick} title={file ? file.name : "اختار التسجيل أو اسحبه هنا"} hint="الصوت بيتجهز على جهازك، وبيتبعت أجزاء صغيرة للتفريغ وما بيتخزنش" compact={!!file} />
        {busy === "decode" && <span className={s.meta}>بيجهز التسجيل… الملفات الطويلة بتاخد دقيقة.</span>}
        {total > 0 && (
          <>
            <span className={s.meta}>المدة {fmtTime(total)} · {chunks} جزء</span>
            <div className={s.field}><span className={s.label}>لغة التسجيل</span>
              <div className={s.chips} role="group" aria-label="لغة التسجيل">
                {LANGS.map(([id, n]) => <button key={id} type="button" className={`${s.chip} ${lang === id ? s.chipOn : ""}`} aria-pressed={lang === id} onClick={() => setLang(id)}>{n}</button>)}
              </div>
            </div>
            {busy === "run" && (
              <>
                <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={chunks} aria-valuenow={done}><i style={{ width: `${(done / Math.max(1, chunks)) * 100}%` }} /></div>
                <span className={s.meta}>اتفرّغ {done} من {chunks} جزء</span>
              </>
            )}
            <div className={s.actions}>
              {busy === "run"
                ? <button type="button" className="btn stop" onClick={() => stopRef.current?.abort()}>إيقاف</button>
                : done < chunks && <button type="button" className="btn" disabled={!!busy || !enabled} onClick={start}>{done ? "كمّل التفريغ" : "ابدأ التفريغ"}</button>}
            </div>
          </>
        )}
      </section>

      {err && <p className={s.warn} role="alert">{err}</p>}

      {segs.length > 0 && (
        <section className={s.box}>
          <h3 className={s.boxTitle}>2. التفريغ <small>{segs.length} مقطع · {speakers.length} متكلم</small></h3>
          <label className={s.field}>
            <span className={s.label}>العنوان</span>
            <input className={s.input} value={shownTitle} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </label>
          {speakers.length > 0 && (
            <div className={s.field}>
              <span className={s.label}>سمّي المتكلمين (الاسم بيتغير في كل التفريغ والملفات)</span>
              <div className={s.names}>
                {speakers.map((sp) => (
                  <input key={sp} className={s.input} aria-label={`اسم ${sp}`} placeholder={sp} value={names[sp] ?? saved?.names?.[sp] ?? ""} maxLength={40} onChange={(e) => setNames((n) => ({ ...n, [sp]: e.target.value }))} />
                ))}
              </div>
            </div>
          )}
          <div className={s.actions}>
            <button type="button" className="btn ghost" disabled={!finished} onClick={() => download(toTxt(segs, showNames, shownTitle), `${base}.txt`)}>نزّل نص</button>
            <button type="button" className="btn ghost" disabled={!finished} onClick={() => download(toSrt(segs, showNames, total), `${base}.srt`, "application/x-subrip;charset=utf-8")}>نزّل ترجمة SRT</button>
            <button type="button" className="btn ghost" onClick={() => navigator.clipboard?.writeText(toTxt(segs, showNames, shownTitle))}>انسخ</button>
          </div>
          <div className={s.segs}>
            {segs.map((x, i) => (
              <div className={s.seg} key={i}>
                <div className={s.segHead}><time>{fmtTime(x.start)}</time><b>{showNames[x.speaker] || x.speaker}</b></div>
                <p dir="auto">{x.text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
