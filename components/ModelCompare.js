"use client";
// مقارنة الموديلات: سؤال واحد يتبعت لـ 2-3 موديلات في نفس الوقت، والردود بتتعرض جنب بعض وهي بتتكتب.
// بنستخدم نفس /api/chat بتاع الشات (نفس الحدود والموديلات)، فكل مقارنة بتحسب رسالة لكل موديل.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BotIcon from "./BotIcon";
import Md from "./Md";
import { read, write, toast, useStored } from "@/lib/store";
import { DEFAULT_SETTINGS } from "@/lib/settings";
import s from "./compare.module.css";

const MIN = 2;
const MAX = 3;
const MAX_CHARS = 3000;
const DEFAULT_PICK = ["gemini-direct", "kimi-k2", "llama-70b"];

const EXAMPLES = [
  "اكتبلي إعلان قصير لعباية سوداء مطرزة بلهجة مصرية",
  "اشرحلي الفرق بين الشركة الفردية وذات المسؤولية المحدودة ببساطة",
  "اقترح 5 أفكار ريلز لمتجر ملابس أطفال",
];

const secs = (ms) => `${(ms / 1000).toFixed(1)} ثانية`;

export default function ModelCompare({ bots, sections }) {
  const byKey = useMemo(() => Object.fromEntries(bots.map((b) => [b.key, b])), [bots]);
  const [stored, setStored] = useStored("compare-pick", null);
  const [question, setQuestion] = useState("");
  const [runs, setRuns] = useState({});
  const [order, setOrder] = useState([]); // الموديلات اللي اتسألت في آخر مقارنة
  const [best, setBest] = useState(null);
  const [busy, setBusy] = useState(false);
  const [listOpen, setListOpen] = useState(true);
  const abortRef = useRef(null);

  // جاي من الشات («قارن الموديلات»): السؤال بيتحط في الخانة
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search).get("q");
      if (q) setQuestion(q.slice(0, MAX_CHARS));
    } catch {}
  }, []);

  // الموديلات المختارة: المحفوظة لو لسه موجودة، وإلا الافتراضية
  const picked = useMemo(() => {
    const saved = (Array.isArray(stored) ? stored : []).filter((k) => byKey[k]).slice(0, MAX);
    if (saved.length) return saved;
    return DEFAULT_PICK.filter((k) => byKey[k]).slice(0, MAX);
  }, [stored, byKey]);

  function toggle(key) {
    if (busy) return;
    if (picked.includes(key)) return setStored(picked.filter((k) => k !== key));
    if (picked.length >= MAX) return toast(`أقصى حد ${MAX} موديلات في المقارنة`);
    setStored([...picked, key]);
  }

  async function runOne(key, q, signal) {
    const t0 = performance.now();
    const patch = (p) => setRuns((r) => ({ ...r, [key]: { ...r[key], ...p } }));
    let text = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: q }],
          // لو الموديل مش متاح السيرفر بيرد بـ «متوازن»، فبنحدده بدل ما يروح لـ «دمج 4 نماذج»
          model: "balanced",
          bot: key,
          strict: true, // مفيش استبدال صامت بموديل تاني: الخطأ بيظهر في العمود
          pro: read("pro-code", "") || undefined,
          settings: read("settings", DEFAULT_SETTINGS),
        }),
        signal,
      });
      if (!res.ok || !res.body) {
        const d = await res.json().catch(() => ({}));
        throw Object.assign(new Error(d.error || "حصل خطأ، جرّب تاني."), { why: d.why || "" });
      }
      const fallback = res.headers.get("x-bot") === "fallback";
      // الموديل اللي رد فعلاً مقابل المطلوب: السيرفر بيبدّل بصمت لو الموديل مشغول أو الرصيد خلص
      const used = res.headers.get("x-model") || "";
      const asked = res.headers.get("x-asked") || "";
      const swapped = !!used && !!asked && used !== asked;
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        patch({ text, fallback, used, swapped });
      }
      if (!text.trim()) throw new Error("ما وصلش رد. جرّب تاني.");
      patch({ status: "done", ms: performance.now() - t0, fallback, used, swapped });
    } catch (e) {
      if (e.name === "AbortError") patch({ status: "stopped", ms: performance.now() - t0, text: text || "_اتوقف الرد._" });
      else patch({ status: "error", error: e.message || "الاتصال اتقطع.", why: e.why || "" });
    }
  }

  async function run(q = question) {
    const text = q.trim();
    if (!text || busy) return;
    if (picked.length < MIN) return toast("اختار موديلين على الأقل");
    const keys = [...picked];
    const controller = new AbortController();
    abortRef.current = controller;
    setOrder(keys);
    setBest(null);
    setRuns(Object.fromEntries(keys.map((k) => [k, { status: "loading", text: "" }])));
    setListOpen(false);
    setBusy(true);
    await Promise.all(keys.map((k) => runOne(k, text, controller.signal)));
    abortRef.current = null;
    setBusy(false);
  }

  function useExample(t) {
    setQuestion(t);
    run(t);
  }

  async function copy(key) {
    try {
      await navigator.clipboard.writeText(runs[key]?.text || "");
      toast("اتنسخ الرد");
    } catch {
      toast("المتصفح منع النسخ، حدد الكلام وانسخه بإيدك");
    }
  }

  const canRun = !busy && question.trim() && picked.length >= MIN;

  return (
    <div className={s.wrap}>
      <section className={s.card} aria-label="سؤالك">
        <label className={s.label} htmlFor="cmp-q">سؤالك</label>
        <textarea
          id="cmp-q"
          className={s.box}
          value={question}
          maxLength={MAX_CHARS}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); run(); } }}
          placeholder="اكتب سؤالك أو طلبك هنا..."
          rows={4}
          dir="auto"
        />
        <div className={s.examples}>
          {EXAMPLES.map((t) => (
            <button key={t} type="button" className={s.example} disabled={busy || picked.length < MIN} onClick={() => useExample(t)}>{t}</button>
          ))}
        </div>

        <div className={s.pickHead}>
          <b>الموديلات ({picked.length}/{MAX})</b>
          <button type="button" className={s.link} onClick={() => setListOpen((o) => !o)} aria-expanded={listOpen}>
            {listOpen ? "إخفاء القايمة" : "غيّر الموديلات"}
          </button>
        </div>

        <div className={s.chosen}>
          {picked.map((k) => (
            <span key={k} className={s.chosenChip}>
              <BotIcon bot={byKey[k]} size={22} />
              <span dir="auto">{byKey[k].name}</span>
              <button type="button" onClick={() => toggle(k)} disabled={busy} aria-label={`شيل ${byKey[k].name}`}>✕</button>
            </span>
          ))}
          {picked.length < MIN && <em className={s.hint}>اختار {MIN - picked.length === 1 ? "موديل تاني" : "موديلين"} من القايمة</em>}
        </div>

        {listOpen && (
          <div className={s.list}>
            {sections.map((sec) => {
              const items = bots.filter((b) => b.section === sec.id);
              if (!items.length) return null;
              return (
                <div key={sec.id} className={s.group}>
                  <h2>{sec.title}</h2>
                  <div className={s.chips}>
                    {items.map((b) => {
                      const on = picked.includes(b.key);
                      return (
                        <button key={b.key} type="button" className={`${s.chip} ${on ? s.chipOn : ""}`} aria-pressed={on} onClick={() => toggle(b.key)} disabled={busy}>
                          <BotIcon bot={b} size={26} />
                          <span dir="auto">{b.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className={s.actions}>
          {busy ? (
            <button type="button" className={`btn ${s.stop}`} onClick={() => abortRef.current?.abort()}>إيقاف</button>
          ) : (
            <button type="button" className="btn" onClick={() => run()} disabled={!canRun}>قارن الإجابات</button>
          )}
          <small className={s.note}>كل مقارنة بتحسب رسالة لكل موديل من حدك في الساعة. Ctrl+Enter للإرسال.</small>
        </div>
      </section>

      {order.length > 0 && (
        <section className={s.cols} style={{ "--n": order.length }} aria-label="الإجابات" aria-live="polite">
          {order.map((k) => {
            const bot = byKey[k];
            const r = runs[k] || {};
            const isBest = best === k;
            return (
              <article key={k} className={`${s.col} ${isBest ? s.best : ""}`}>
                <header className={s.colHead}>
                  <BotIcon bot={bot} size={34} />
                  <div>
                    <b dir="auto">{bot.name}</b>
                    <small><bdi>{bot.maker}</bdi>{r.ms ? <> • <bdi>{secs(r.ms)}</bdi></> : null}</small>
                  </div>
                  {isBest && <span className={s.badge}>الأحسن</span>}
                </header>

                {r.fallback && <p className={s.warn}>الموديل ده مش متاح دلوقتي، فالرد ده من «متوازن».</p>}
                {r.swapped && !r.fallback && (
                  <p className={s.warn}>
                    الموديل ده كان مشغول أو مش متاح، فالرد جه من موديل بديل: <bdi className={s.mono}>{r.used.replace(/^[a-z]+\//, "")}</bdi>. الرد ده مش بتاع {bot.name}.
                  </p>
                )}

                <div className={s.body}>
                  {r.status === "error" && <p className={s.err}>{r.error}</p>}
                  {r.status === "error" && r.why && <p className={s.why}>السبب من المزود: <bdi className={s.mono}>{r.why}</bdi></p>}
                  {r.status === "loading" && !r.text && <p className={s.wait}><span className={s.dots} aria-hidden="true" /> بيكتب...</p>}
                  {r.text && <div className="md" dir="auto"><Md>{r.text}</Md></div>}
                </div>

                {r.used && !r.swapped && !r.fallback && <p className={s.used}>اشتغل فعلاً: <bdi className={s.mono}>{r.used.replace(/^[a-z]+\//, "")}</bdi></p>}

                <footer className={s.colFoot}>
                  <button type="button" onClick={() => copy(k)} disabled={!r.text || r.status === "loading"}>نسخ</button>
                  <button type="button" onClick={() => setBest(isBest ? null : k)} disabled={r.status !== "done"} aria-pressed={isBest}>
                    {isBest ? "إلغاء الاختيار" : "ده الأحسن"}
                  </button>
                  <Link href={`/chat?bot=${k}`} onClick={() => write("bot", k)}>كمّل معاه في الشات</Link>
                </footer>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
