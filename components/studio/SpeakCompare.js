"use client";
// مقارنة الأصوات: نفس الجملة بنفس اللهجة والنوع والنبرة على ثلاثة محركات، عشان الزائر يسمع الفرق بنفسه ويختار.
import { useEffect, useRef, useState } from "react";
import { Note, styles as s } from "./ui";
import { requestAudio } from "@/lib/speakclient";
import { callSpace, fileUrl } from "@/lib/hfspace";
import { voiceFor } from "@/lib/speech";

const DEFAULT_TEXT = "والله ما كنت مصدّق إنها هتحصل... بس أهي حصلت، وأنا فرحان قوي!";
const CB_HOST = "https://resembleai-chatterbox-multilingual-tts.hf.space";
// شدة التعبير في Chatterbox حسب النبرة (0 إلى 1)
const EXAGGERATION = { normal: 0.5, calm: 0.3, narrator: 0.5, strong: 0.7, sharp: 0.7, excited: 0.85, sad: 0.6, child: 0.7 };

const ENGINES = [
  { id: "std", name: "الصوت العادي", sub: "سريع، والنبرة بالسرعة والدرجة بس." },
  { id: "pro", name: "الصوت المعبّر", sub: "بإحساس ونبرة حقيقيين (Gemini)." },
  { id: "cb", name: "Chatterbox (تجريبي)", sub: "من Hugging Face، ممكن ياخد دقيقة، وحصته بتتحسب على جهازك." },
];

async function viaChatterbox(text, tone) {
  // نفس استدعاء «مصنع الفيديو»: النص، اللغة، صوت مرجعي (مفيش)، شدة التعبير، الحرارة، البذرة، وزن CFG
  const { out, base } = await callSpace(CB_HOST, "generate_tts_audio", [text.slice(0, 280), "ar", null, EXAGGERATION[tone] ?? 0.5, 0.8, 7, 0.5]);
  const src = fileUrl(out?.[0], base);
  if (!src) throw new Error("ما رجعش صوت.");
  const r = await fetch(src);
  if (!r.ok) throw new Error("ما قدرناش نحمّل الصوت.");
  return r.blob();
}

function explain(e) {
  if (e?.quota) return "حصتك اليومية من الصوت التجريبي خلصت. جرّب بكرة.";
  if (e?.busy) return "الصوت التجريبي نايم أو مشغول دلوقتي. جرّب بعد شوية.";
  return e?.message || "حصلت مشكلة.";
}

export default function SpeakCompare({ dialect, gender, tone, variant, proOk }) {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [state, setState] = useState({}); // { [engine]: { status: "loading" | "playing" | "error", msg } }
  const audioRef = useRef(null);
  const cacheRef = useRef(new Map());
  const urlRef = useRef("");
  const tokenRef = useRef(0);

  useEffect(() => () => {
    tokenRef.current++;
    audioRef.current?.pause();
    if (urlRef.current) URL.revokeObjectURL(urlRef.current);
  }, []);

  const set = (id, v) => setState((o) => ({ ...o, [id]: v }));

  async function run(id) {
    const t = text.trim();
    if (!t) return;
    const my = ++tokenRef.current;
    audioRef.current?.pause();
    setState({});
    set(id, { status: "loading" });
    try {
      const key = `${id}|${t}|${dialect}|${gender}|${tone}|${variant}`;
      let blob = cacheRef.current.get(key);
      if (!blob) {
        if (id === "std") blob = await requestAudio(t, { engine: "std", voice: voiceFor(dialect, gender), tone, pitch: 0 });
        else if (id === "pro") blob = await requestAudio(t, { engine: "pro", dialect, gender, tone, variant });
        else blob = await viaChatterbox(t, tone);
        cacheRef.current.set(key, blob);
      }
      if (my !== tokenRef.current) return;
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
      urlRef.current = URL.createObjectURL(blob);
      const a = audioRef.current;
      a.src = urlRef.current;
      await a.play();
      if (my === tokenRef.current) set(id, { status: "playing" });
    } catch (e) {
      if (my === tokenRef.current) set(id, { status: "error", msg: explain(e) });
    }
  }

  return (
    <div className={s.field}>
      <audio ref={audioRef} onEnded={() => setState({})} hidden />
      <label className={s.field}>
        <span className={s.fieldLabel}>الجملة (نفسها على الثلاثة)</span>
        <textarea className={s.input} rows={3} dir="auto" maxLength={280} value={text} onChange={(e) => setText(e.target.value)} />
      </label>
      {ENGINES.map((en) => {
        const st = state[en.id];
        const off = en.id === "pro" && !proOk;
        return (
          <div key={en.id} className={s.spDoc}>
            <b>{en.name}</b>
            <small>{off ? "مش مفعّل دلوقتي." : en.sub}</small>
            <button type="button" className="btn ghost" disabled={off || st?.status === "loading" || !text.trim()} onClick={() => run(en.id)}>
              {st?.status === "loading" ? "بنجهّز الصوت…" : st?.status === "playing" ? "بيشتغل…" : "شغّل"}
            </button>
            {st?.status === "error" && <Note tone="warn">{st.msg}</Note>}
          </div>
        );
      })}
      <Note>اسمع الثلاثة بنفس الإعدادات اللي اخترتها فوق (اللهجة والنوع والنبرة)، واختار اللي يريّحك. الحكم النهائي لودنك.</Note>
    </div>
  );
}
