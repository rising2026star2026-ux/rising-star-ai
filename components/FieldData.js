"use client";
// البيانات الميدانية في الباحث التجاري: استبيان العملاء، وإعلانات المنافسين (صور)، وتجارب يوتيوب
import { useMemo, useState } from "react";
import { buildSurvey, surveyLink, parseResponses, tallySurvey, surveyText, cleanPhone } from "@/lib/survey";
import { fileToDataUrl } from "@/lib/imagefile";
import { n0, egp } from "@/lib/feasibility";
import { toast } from "@/lib/store";
import s from "./feasibility.module.css";

const TABS = [
  ["survey", "استبيان العملاء"],
  ["ads", "إعلانات المنافسين"],
  ["youtube", "تجارب يوتيوب"],
];

async function post(body) {
  const res = await fetch("/api/feasibility", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "حصل خطأ، جرّب تاني.");
  return d;
}

/** ملخص البيانات الميدانية كنص للتقرير */
export function fieldText(field) {
  if (!field) return "";
  const parts = [];
  if (field.survey && field.paste) {
    const t = tallySurvey(parseResponses(field.paste, field.survey), field.survey);
    const txt = surveyText(t, field.survey);
    if (txt) parts.push(txt);
  }
  if (field.ads?.items?.length) {
    parts.push(
      "من صور إعلانات وبوستات المنافسين:",
      ...field.ads.items.slice(0, 15).map((x) => `- ${[x.who, x.product].filter(Boolean).join(": ")}${x.price ? ` — ${egp(x.price)}` : ""}${x.offer ? ` — عرض: ${x.offer}` : ""}`),
    );
    if (field.ads.insight) parts.push(`ملاحظة: ${field.ads.insight}`);
  }
  const vids = (field.videos || []).filter((v) => v.relevant);
  if (vids.length) {
    parts.push("من تجارب يوتيوب (كلام أصحاب مشروعات، مش أرقام موثقة):");
    vids.forEach((v) => {
      parts.push(`- «${v.title}»${v.year ? ` (${v.year})` : ""}: ${v.summary}`);
      v.costs.slice(0, 6).forEach((c) => parts.push(`  • ${c.item}${c.amount ? `: ${egp(c.amount)}` : ""}${c.note ? ` (${c.note})` : ""}`));
    });
  }
  return parts.join("\n");
}

function Bars({ q, counts, n }) {
  return (
    <div className={s.bars}>
      <b>{q.q}</b>
      {q.o.map((o, i) => {
        const p = n ? Math.round((counts[i] / n) * 100) : 0;
        return (
          <div key={i} className={s.bar}>
            <span>{o}</span>
            <i style={{ "--w": `${p}%` }} />
            <small>{p}٪</small>
          </div>
        );
      })}
    </div>
  );
}

export default function FieldData({ form, a, field, setField, onApplyPrice }) {
  const [tab, setTab] = useState("survey");
  const [phone, setPhone] = useState("");
  const [imgs, setImgs] = useState([]);
  const [busy, setBusy] = useState("");
  const f = field || {};
  const update = (p) => setField({ ...f, ...p });

  const tally = useMemo(() => (f.survey && f.paste ? tallySurvey(parseResponses(f.paste, f.survey), f.survey) : null), [f.survey, f.paste]);
  const link = f.survey && typeof window !== "undefined" ? surveyLink(window.location.origin, f.survey, f.phone) : "";
  const adLib = `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=EG&media_type=all&search_type=keyword_unordered&q=${encodeURIComponent(form.activity)}`;
  const place = [form.city, form.governorate].filter(Boolean).join("، ");

  function makeSurvey() {
    if (phone && !cleanPhone(phone)) { toast("رقم الواتساب مش مظبوط. اكتبه زي 01012345678 أو سيبه فاضي."); return; }
    update({ survey: buildSurvey({ activity: form.activity, type: form.type, price: a?.price?.mid, place }), phone: cleanPhone(phone), paste: "" });
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); toast("الرابط اتنسخ"); } catch { toast("انسخ الرابط من الخانة"); }
  }

  async function pickImages(e) {
    const files = [...(e.target.files || [])].slice(0, 4 - imgs.length);
    e.target.value = "";
    try {
      const urls = await Promise.all(files.map((x) => fileToDataUrl(x, 1280, 0.82)));
      setImgs((p) => [...p, ...urls].slice(0, 4));
    } catch (err) { toast(err.message); }
  }

  async function analyzeImages() {
    if (!imgs.length || busy) return;
    setBusy("ads");
    try {
      const d = await post({ step: "images", form, images: imgs });
      const prev = f.ads?.items || [];
      update({ ads: { items: [...prev, ...d.items].slice(0, 40), insight: d.insight || f.ads?.insight || "" } });
      setImgs([]);
    } catch (err) { toast(err.message); }
    setBusy("");
  }

  async function searchVideos() {
    if (busy) return;
    setBusy("youtube");
    try {
      const d = await post({ step: "youtube", form });
      update({ videos: d.videos });
    } catch (err) { toast(err.message); }
    setBusy("");
  }

  return (
    <section className={s.card} aria-label="بيانات ميدانية">
      <div className={s.head}><b>بيانات ميدانية من السوق</b><small>اختياري، بس بيخلّي الدراسة أصدق بكتير</small></div>
      <div className={s.tabs} role="tablist">
        {TABS.map(([k, label]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}>
            {label}
            {k === "survey" && tally?.n ? <em>{n0(tally.n)}</em> : null}
            {k === "ads" && f.ads?.items?.length ? <em>{n0(f.ads.items.length)}</em> : null}
            {k === "youtube" && f.videos?.some((v) => v.relevant) ? <em>{n0(f.videos.filter((v) => v.relevant).length)}</em> : null}
          </button>
        ))}
      </div>

      {tab === "survey" && (
        <div className={s.tabBody}>
          {!f.survey ? (
            <>
              <p className={s.help}>هعملك استبيان من 6 أسئلة (هيشتري؟ كام مرة؟ يدفع كام؟…) تبعته في جروبات فيس بوك وواتساب. كل واحد يجاوب، ورده يوصلك على واتساب.</p>
              <label className={s.field}>
                <span className={s.label}>رقم واتسابك (علشان الردود توصلك)</span>
                <input inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01012345678 (اختياري)" />
              </label>
              <small className={s.faintNote}>الرقم بيتحط في رابط الاستبيان بس، ومش بيتحفظ عندنا. لو سبته فاضي، المشارك هيختار يبعت لمين.</small>
              <div className={s.actions}><button type="button" className={s.primary} onClick={makeSurvey}>اعمل الاستبيان</button></div>
            </>
          ) : (
            <>
              <label className={s.field}>
                <span className={s.label}>رابط الاستبيان</span>
                <input readOnly value={link} onFocus={(e) => e.target.select()} dir="ltr" />
              </label>
              <div className={s.actions}>
                <button type="button" className={s.primary} onClick={copyLink}>انسخ الرابط</button>
                <a className={s.ghost} href={`https://wa.me/?text=${encodeURIComponent(`${f.survey.title}\nممكن تساعدني وتجاوب؟ أقل من دقيقة 🙏\n${link}`)}`} target="_blank" rel="noopener noreferrer">ابعته على واتساب</a>
                <button type="button" className={s.ghost} onClick={() => update({ survey: null, paste: "" })}>استبيان جديد</button>
              </div>
              <label className={s.field}>
                <span className={s.label}>الصق رسايل الردود اللي وصلتك هنا</span>
                <textarea rows={4} value={f.paste || ""} onChange={(e) => update({ paste: e.target.value })} placeholder="ممكن تلزق كل الرسايل مرة واحدة، أنا بدوّر على الأكواد اللي فيها" />
              </label>
              {tally && tally.n > 0 && (
                <div className={s.tally}>
                  <div className={s.stats}>
                    <span><b>{n0(tally.n)}</b><small>رد</small></span>
                    <span><b>{Math.round(tally.intent * 100)}٪</b><small>هيشتري (أكيد + غالباً)</small></span>
                    {tally.avgFreq !== null && <span><b>{tally.avgFreq.toFixed(1)}</b><small>مرة في الشهر</small></span>}
                    {tally.medianPrice && <span><b>{egp(tally.medianPrice)}</b><small>السعر المقبول</small></span>}
                  </div>
                  {tally.n < 30 && <p className={s.faintNote}>أقل من 30 رد = مؤشر مبدئي. حاول توصل لـ 50 رد أو أكتر.</p>}
                  {tally.medianPrice && onApplyPrice && (
                    <button type="button" className={s.ghost} onClick={() => onApplyPrice(tally.medianPrice)}>طبّق السعر ده على السعر المتوقع في الافتراضات</button>
                  )}
                  {f.survey.qs.map((q, i) => <Bars key={q.k} q={q} counts={tally.counts[i]} n={tally.n} />)}
                </div>
              )}
              {f.paste && tally && tally.n === 0 && <p className={s.faintNote}>مالقيتش أكواد ردود في النص ده. الكود شكله كده: RS-{f.survey.id}-123456</p>}
            </>
          )}
        </div>
      )}

      {tab === "ads" && (
        <div className={s.tabBody}>
          <p className={s.help}>افتح مكتبة الإعلانات، وخد screenshots لإعلانات المنافسين أو بوستات أسعار من الجروبات، وارفعها هنا (لحد 4 مرة واحدة). هطلّع منها الأسعار والعروض.</p>
          <div className={s.actions}>
            <a className={s.ghost} href={adLib} target="_blank" rel="noopener noreferrer nofollow">مكتبة إعلانات فيس بوك: «{form.activity}»</a>
            <a className={s.ghost} href="https://adstransparency.google.com/?region=EG" target="_blank" rel="noopener noreferrer nofollow">إعلانات جوجل</a>
          </div>
          <div className={s.thumbs}>
            {imgs.map((u, i) => (
              <span key={i}><img src={u} alt={`صورة ${i + 1}`} /><button type="button" aria-label="شيل الصورة" onClick={() => setImgs((p) => p.filter((_, k) => k !== i))}>×</button></span>
            ))}
            {imgs.length < 4 && (
              <label className={s.addImg}>+ صورة<input type="file" accept="image/*" multiple onChange={pickImages} hidden /></label>
            )}
          </div>
          {imgs.length > 0 && (
            <div className={s.actions}>
              <button type="button" className={s.primary} onClick={analyzeImages} disabled={busy === "ads"}>{busy === "ads" ? "بقرا الصور…" : `حلل ${n0(imgs.length)} صورة`}</button>
            </div>
          )}
          {f.ads?.items?.length > 0 && (
            <>
              {f.ads.insight && <p className={s.market} dir="auto">{f.ads.insight}</p>}
              <ul className={s.comps}>
                {f.ads.items.map((x, i) => (
                  <li key={i}>
                    <b dir="auto">{[x.who, x.product].filter(Boolean).join(" — ")}</b>
                    <small dir="auto">{[x.price ? egp(x.price) : "", x.offer, x.note].filter(Boolean).join(" · ")}</small>
                  </li>
                ))}
              </ul>
              <button type="button" className={s.add} onClick={() => update({ ads: null })}>امسح نتايج الإعلانات</button>
            </>
          )}
        </div>
      )}

      {tab === "youtube" && (
        <div className={s.tabBody}>
          <p className={s.help}>هدوّر على فيديوهات لناس فتحت نفس المشروع، وأتفرج على أول فيديوهين وأطلّع التكاليف اللي اتقالت فيهم. دي تجارب شخصية، فبتدخل الدراسة كمؤشر مش كرقم أساسي.</p>
          <div className={s.actions}>
            <button type="button" className={s.primary} onClick={searchVideos} disabled={busy === "youtube"}>{busy === "youtube" ? "بتفرج على الفيديوهات… (لحد دقيقة)" : f.videos ? "دوّر تاني" : "دوّر على تجارب في يوتيوب"}</button>
          </div>
          {f.videos?.length > 0 && (
            <ul className={s.videos}>
              {f.videos.map((v) => (
                <li key={v.id}>
                  <a href={v.url} target="_blank" rel="noopener noreferrer nofollow" dir="auto">{v.title || v.url}</a>
                  <small>{[v.channel, v.minutes ? `${Math.round(v.minutes)} دقيقة` : "", v.views ? `${n0(v.views)} مشاهدة` : ""].filter(Boolean).join(" · ")}</small>
                  {v.relevant === true && (
                    <>
                      {v.summary && <p dir="auto">{v.summary}</p>}
                      {v.costs?.length > 0 && <ul>{v.costs.map((c, i) => <li key={i} dir="auto">{c.item}{c.amount ? `: ${egp(c.amount)}` : ""}{c.note ? ` (${c.note})` : ""}</li>)}</ul>}
                      {v.tips?.length > 0 && <p className={s.faintNote} dir="auto">نصايح: {v.tips.join(" · ")}</p>}
                    </>
                  )}
                  {v.relevant === false && <p className={s.faintNote}>الفيديو ده طلع مش عن الموضوع.</p>}
                  {v.relevant === null && <p className={s.faintNote}>مااتحللش (بنحلل أول فيديوهين بس).</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
