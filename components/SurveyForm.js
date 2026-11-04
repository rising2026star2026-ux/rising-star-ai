"use client";
// صفحة المشارك في الاستبيان: الأسئلة جاية من الرابط، والرد بيتبعت لصاحب المشروع على واتساب
import { useEffect, useState } from "react";
import { readSurveyHash, answerCode } from "@/lib/survey";
import s from "./survey.module.css";

export default function SurveyForm() {
  const [survey, setSurvey] = useState(undefined);
  const [answers, setAnswers] = useState([]);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const sv = readSurveyHash(window.location.hash);
    setSurvey(sv);
    if (sv) setAnswers(sv.qs.map(() => -1));
  }, []);

  if (survey === undefined) return <div className={s.wrap} />;
  if (!survey) {
    return (
      <div className={s.wrap}>
        <section className={s.card}><h1 className={s.title}>الرابط ده مش كامل</h1><p className={s.sub}>اطلب من صاحب الاستبيان يبعتلك الرابط تاني.</p></section>
      </div>
    );
  }

  const done = answers.every((a) => a >= 0);
  const code = answerCode(survey.id, answers);
  const message = [
    `ردي على «${survey.title}»:`,
    ...survey.qs.map((q, i) => `- ${q.q} ${answers[i] >= 0 ? q.o[answers[i]] : "—"}`),
    "",
    `الكود: ${code}`,
  ].join("\n");
  const wa = `https://wa.me/${survey.p || ""}?text=${encodeURIComponent(message)}`;

  async function copy() {
    try { await navigator.clipboard.writeText(message); setSent(true); } catch { /* المتصفح رفض */ }
  }

  return (
    <div className={s.wrap}>
      <section className={s.card}>
        <h1 className={s.title}>{survey.title}</h1>
        <p className={s.sub}>6 أسئلة سريعة، أقل من دقيقة. مش هنسألك عن اسمك ولا رقمك.</p>
        {survey.qs.map((q, i) => (
          <fieldset key={q.k} className={s.q}>
            <legend>{i + 1}. {q.q}</legend>
            <div className={s.opts}>
              {q.o.map((o, k) => (
                <label key={k} className={answers[i] === k ? s.on : ""}>
                  <input type="radio" name={q.k} checked={answers[i] === k} onChange={() => setAnswers((a) => a.map((x, j) => (j === i ? k : x)))} />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
        ))}
        <div className={s.actions}>
          <a className={`${s.send} ${done ? "" : s.off}`} href={done ? wa : undefined} aria-disabled={!done} target="_blank" rel="noopener noreferrer" onClick={() => done && setSent(true)}>
            ابعت ردك على واتساب
          </a>
          <button type="button" className={s.copy} onClick={copy} disabled={!done}>انسخ الرد</button>
        </div>
        {!done && <p className={s.hint}>جاوب على كل الأسئلة الأول.</p>}
        {sent && <p className={s.thanks}>شكراً! ردك هيساعد صاحب المشروع ياخد قرار أحسن.</p>}
      </section>
    </div>
  );
}
