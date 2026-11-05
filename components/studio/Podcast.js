"use client";
// بودكاست بصوتين: موضوع أو نص ← سكربت حوار تقدر تعدّله ← صوت بمذيعين ← تشغيل وتحميل.
// الصوت بيتعمل على أجزاء صغيرة، ولو جزء وقع تقدر تكمّل من نفس المكان من غير ما تعيد اللي خلص.
import { useEffect, useRef, useState } from "react";
import { read, write } from "@/lib/store";
import { joinWavs, wavSeconds } from "@/lib/wav";
import { LENGTHS, STYLES, VOICE_PAIRS, DIALECT_NAMES, MAX_SOURCE, MAX_LINE, MAX_LINES, normalizeLines, chunkLines, scriptText, estimateMinutes, pairFor } from "@/lib/podcast";
import s from "./audio.module.css";

const KEY = "podcast-last";
const FORM0 = { topic: "", source: "", dialect: "eg", pair: "fm", style: "chat", length: "medium" };

function Chips({ value, options, onChange, label }) {
  return (
    <div className={s.chips} role="group" aria-label={label}>
      {options.map(([id, name]) => (
        <button key={id} type="button" className={`${s.chip} ${value === id ? s.chipOn : ""}`} aria-pressed={value === id} onClick={() => onChange(id)}>{name}</button>
      ))}
    </div>
  );
}

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.round(sec % 60)).padStart(2, "0")}`;

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function errText(r) {
  try { return (await r.json()).error || "حصلت مشكلة."; } catch { return "حصلت مشكلة."; }
}

export default function Podcast() {
  const [form, setForm] = useState(FORM0);
  const [title, setTitle] = useState("");
  const [lines, setLines] = useState([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [parts, setParts] = useState([]); // صوت كل جزء (Uint8Array) أو null
  const [audioUrl, setAudioUrl] = useState("");
  const [secs, setSecs] = useState(0);
  const stopRef = useRef(null);
  const wavRef = useRef(null);
  const sig = useRef("");

  useEffect(() => {
    const last = read(KEY, null);
    if (last?.form) setForm({ ...FORM0, ...last.form });
    if (last?.lines) { setLines(normalizeLines(last.lines)); setTitle(String(last.title || "")); }
    fetch("/api/podcast").then((r) => r.json()).then((j) => setEnabled(!!j.enabled)).catch(() => {});
  }, []);

  useEffect(() => { write(KEY, { form, title, lines }); }, [form, title, lines]);
  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); }, [audioUrl]);

  // أي تعديل في السطور أو الأصوات بيلغي الصوت القديم
  const nowSig = JSON.stringify([lines, form.pair, form.dialect]);
  useEffect(() => {
    if (sig.current && sig.current !== nowSig) { setParts([]); setAudioUrl(""); setSecs(0); wavRef.current = null; }
  }, [nowSig]);

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const hosts = pairFor(form.pair).hosts;
  const chunks = chunkLines(lines);
  const doneCount = parts.filter(Boolean).length;

  async function makeScript() {
    if (!form.topic.trim() && !form.source.trim()) { setErr("اكتب موضوع الحلقة أو الزق نص تتكلم عنه."); return; }
    setErr(""); setBusy("script");
    const ctl = new AbortController(); stopRef.current = ctl;
    try {
      const r = await fetch("/api/podcast", { method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal, body: JSON.stringify({ step: "script", ...form }) });
      if (!r.ok) throw new Error(await errText(r));
      const j = await r.json();
      setTitle(j.title || ""); setLines(normalizeLines(j.lines));
    } catch (e) {
      if (e.name !== "AbortError") setErr(e.message || "حصلت مشكلة.");
    } finally { setBusy(""); stopRef.current = null; }
  }

  async function makeAudio() {
    if (!chunks.length) return;
    setErr(""); setBusy("audio");
    sig.current = nowSig;
    const ctl = new AbortController(); stopRef.current = ctl;
    const fresh = !!audioUrl; // «اعمل الصوت تاني» بيبدأ من الأول
    if (fresh) setAudioUrl("");
    const got = chunks.map((_, i) => (!fresh && parts[i]) || null);
    setParts([...got]);
    try {
      for (let i = 0; i < chunks.length; i++) {
        if (got[i]) continue;
        const r = await fetch("/api/podcast", {
          method: "POST", headers: { "Content-Type": "application/json" }, signal: ctl.signal,
          body: JSON.stringify({ step: "audio", lines: chunks[i], pair: form.pair, dialect: form.dialect }),
        });
        if (!r.ok) throw new Error(await errText(r));
        got[i] = new Uint8Array(await r.arrayBuffer());
        setParts([...got]);
      }
      const wav = joinWavs(got, 0.35);
      wavRef.current = wav;
      setSecs(wavSeconds(wav));
      setAudioUrl(URL.createObjectURL(new Blob([wav], { type: "audio/wav" })));
    } catch (e) {
      if (e.name !== "AbortError") setErr(`${e.message || "حصلت مشكلة."} الأجزاء اللي خلصت محفوظة، دوس «كمّل الصوت» وهيكمّل من مكانه.`);
    } finally { setBusy(""); stopRef.current = null; }
  }

  function editLine(i, patch) { setLines((L) => L.map((l, j) => (j === i ? { ...l, ...patch } : l))); }
  function removeLine(i) { setLines((L) => L.filter((_, j) => j !== i)); }
  function addAfter(i) {
    setLines((L) => {
      if (L.length >= MAX_LINES) return L;
      const s0 = L[i] ? 1 - L[i].s : 0;
      const next = [...L]; next.splice(i + 1, 0, { s: s0, t: "" }); return next;
    });
  }

  const fileBase = (title || "podcast").replace(/[\\/:*?"<>|]+/g, " ").trim().slice(0, 60) || "podcast";
  const cleanLines = lines.filter((l) => l.t.trim());

  return (
    <div className={s.root}>
      <section className={s.box}>
        <h3 className={s.boxTitle}>1. فكرة الحلقة</h3>
        <label className={s.field}>
          <span className={s.label}>الموضوع</span>
          <input className={s.input} value={form.topic} maxLength={300} onChange={(e) => set("topic")(e.target.value)} placeholder="مثلاً: إزاي تبدأ مشروع صغير من البيت برأس مال قليل" />
        </label>
        <label className={s.field}>
          <span className={s.label}>نص تتكلم عنه الحلقة (اختياري): مقال، ملخص كتاب، وصف منتج</span>
          <textarea className={s.input} rows={4} value={form.source} maxLength={MAX_SOURCE} onChange={(e) => set("source")(e.target.value)} placeholder="الزق النص هنا والمذيعين هيتناقشوا فيه" />
        </label>
        <div className={s.grid2}>
          <div className={s.field}><span className={s.label}>اللهجة</span><Chips label="اللهجة" value={form.dialect} onChange={set("dialect")} options={Object.entries(DIALECT_NAMES)} /></div>
          <div className={s.field}><span className={s.label}>المذيعين</span><Chips label="المذيعين" value={form.pair} onChange={set("pair")} options={Object.entries(VOICE_PAIRS).map(([k, v]) => [k, `${v.name} (${v.hosts[0].label} و${v.hosts[1].label})`])} /></div>
          <div className={s.field}><span className={s.label}>شكل الحلقة</span><Chips label="شكل الحلقة" value={form.style} onChange={set("style")} options={Object.entries(STYLES).map(([k, v]) => [k, v.name])} /></div>
          <div className={s.field}><span className={s.label}>الطول</span><Chips label="الطول" value={form.length} onChange={set("length")} options={Object.entries(LENGTHS).map(([k, v]) => [k, v.name])} /></div>
        </div>
        <div className={s.actions}>
          {busy === "script"
            ? <button type="button" className="btn stop" onClick={() => stopRef.current?.abort()}>إيقاف</button>
            : <button type="button" className="btn" disabled={!!busy} onClick={makeScript}>{lines.length ? "اكتب حلقة جديدة" : "اكتب الحلقة"}</button>}
          {busy === "script" && <span className={s.meta}>بيكتب الحوار…</span>}
        </div>
      </section>

      {err && <p className={s.warn} role="alert">{err}</p>}

      {lines.length > 0 && (
        <section className={s.box}>
          <h3 className={s.boxTitle}>2. راجع الحوار وعدّله <small>{cleanLines.length} سطر · حوالي {Math.max(1, Math.round(estimateMinutes(cleanLines)))} دقيقة</small></h3>
          <label className={s.field}>
            <span className={s.label}>عنوان الحلقة</span>
            <input className={s.input} value={title} maxLength={120} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <div className={s.lines}>
            {lines.map((l, i) => (
              <div className={s.line} key={i}>
                <button type="button" className={`${s.who} ${l.s ? s.who1 : s.who0}`} title="بدّل المتكلم" onClick={() => editLine(i, { s: 1 - l.s })}>{hosts[l.s].label}</button>
                <textarea className={`${s.input} ${s.lineText}`} rows={2} dir="auto" value={l.t} maxLength={MAX_LINE} aria-label={`سطر ${i + 1}`} onChange={(e) => editLine(i, { t: e.target.value })} />
                <div className={s.lineTools}>
                  <button type="button" className={s.mini} aria-label="سطر جديد بعده" title="سطر جديد بعده" onClick={() => addAfter(i)}>+</button>
                  <button type="button" className={s.mini} aria-label="امسح السطر" title="امسح السطر" onClick={() => removeLine(i)}>×</button>
                </div>
              </div>
            ))}
          </div>
          <div className={s.actions}>
            <button type="button" className="btn ghost" onClick={() => download(new Blob([scriptText(cleanLines, form.pair, title)], { type: "text/plain;charset=utf-8" }), `${fileBase}.txt`)}>نزّل السكربت</button>
          </div>
        </section>
      )}

      {lines.length > 0 && (
        <section className={s.box}>
          <h3 className={s.boxTitle}>3. الصوت</h3>
          {!enabled ? (
            <p className={s.note}>صوت البودكاست مش مفعّل دلوقتي. تقدر تنزّل السكربت وتسجله بنفسك، أو تقراه بأداة مولد الأصوات.</p>
          ) : (
            <>
              <p className={s.note}>الحلقة هتتعمل على {chunks.length} جزء، بصوت {hosts[0].label} و{hosts[1].label} باللهجة ال{DIALECT_NAMES[form.dialect]}ة. أي تعديل في الحوار بعد كده محتاج تعمل الصوت من جديد.</p>
              {(busy === "audio" || (doneCount > 0 && !audioUrl)) && (
                <>
                  <div className={s.progress} role="progressbar" aria-valuemin={0} aria-valuemax={chunks.length} aria-valuenow={doneCount}><i style={{ width: `${(doneCount / Math.max(1, chunks.length)) * 100}%` }} /></div>
                  <span className={s.meta}>{doneCount} من {chunks.length} جزء</span>
                </>
              )}
              <div className={s.actions}>
                {busy === "audio"
                  ? <button type="button" className="btn stop" onClick={() => stopRef.current?.abort()}>إيقاف</button>
                  : <button type="button" className="btn" disabled={!!busy || !cleanLines.length} onClick={makeAudio}>{doneCount > 0 && !audioUrl ? "كمّل الصوت" : audioUrl ? "اعمل الصوت تاني" : "اعمل الصوت"}</button>}
              </div>
              {audioUrl && (
                <>
                  <audio className={s.player} controls src={audioUrl} />
                  <div className={s.actions}>
                    <button type="button" className="btn ghost" onClick={() => wavRef.current && download(new Blob([wavRef.current], { type: "audio/wav" }), `${fileBase}.wav`)}>نزّل الحلقة (WAV)</button>
                    <span className={s.meta}>المدة {mmss(secs)}</span>
                  </div>
                </>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
