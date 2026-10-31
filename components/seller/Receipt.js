"use client";
// «كشف حساب اشتراكاتك»: اختار اللي بتدفعه، وخد إيصال بيطبع قدامك بالإجمالي واللي بيضيع وتوفيرك في السنة، وشاركه ستوري.
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import BotIcon from "@/components/BotIcon";
import { SUB_TOOLS, PRICES_UPDATED_AR, fmtUsd } from "@/lib/subscriptions";
import { analyze, POPULAR, USAGE, toolById, paidPlans, defaultPlan, SITE_FOR } from "@/lib/receipt";
import { siteOffer, SITE_PLAN_EGP, SITE_PLAN_NAME, TOOLSURF } from "@/lib/offer";
import { toEgp } from "@/lib/subscriptions";
import { read, write, toast } from "@/lib/store";
import { copyText, shareOrDownload, loadFonts } from "@/lib/imagefile";
import { storyCanvas, night, star, text as drawText, rr, brandFooter, toBlob } from "@/lib/sharecard";
import s from "./seller.module.css";
import r from "./receipt.module.css";

const n = (x) => Math.round(x).toLocaleString("en-US");
const asBot = (t) => ({ key: t.id, name: t.name, logo: t.logo, tint: t.tint, mono: t.mono || t.name.slice(0, 2) });
const VERDICT_COLOR = { fire: "#f04438", warn: "#f79009", ok: "#1f4dff", great: "#12b76a" };
const STORE_KEY = "receipt-items";

export default function Receipt() {
  const [items, setItems] = useState([]);
  const [q, setQ] = useState("");
  const [all, setAll] = useState(false);
  const [fee, setFee] = useState("");
  const [printed, setPrinted] = useState(false);
  const [printKey, setPrintKey] = useState(0);
  const paperRef = useRef(null);

  const loaded = useRef(false);
  useEffect(() => { const saved = read(STORE_KEY, []); if (Array.isArray(saved)) setItems(saved.filter((x) => toolById[x.toolId] && toolById[x.toolId].plans.some((p) => p.name === x.plan))); loaded.current = true; }, []);
  useEffect(() => { if (loaded.current) write(STORE_KEY, items); }, [items]);

  const list = useMemo(() => {
    const nq = q.trim().toLowerCase();
    const all = [...POPULAR.map((id) => toolById[id]).filter(Boolean), ...SUB_TOOLS.filter((t) => !POPULAR.includes(t.id))].filter((t) => paidPlans(t).length);
    return nq ? all.filter((t) => `${t.name} ${t.maker}`.toLowerCase().includes(nq)) : all;
  }, [q]);
  const has = (id) => items.some((x) => x.toolId === id);
  const toggle = (t) => {
    setPrinted(false);
    setItems((xs) => (xs.some((x) => x.toolId === t.id) ? xs.filter((x) => x.toolId !== t.id) : [...xs, { toolId: t.id, plan: defaultPlan(t), billing: "monthly", usage: "daily" }]));
  };
  const update = (id, patch) => { setPrinted(false); setItems((xs) => xs.map((x) => (x.toolId === id ? { ...x, ...patch } : x))); };

  const res = useMemo(() => analyze(items, fee), [items, fee]);

  function print() {
    setPrinted(true);
    setPrintKey((k) => k + 1);
    setTimeout(() => paperRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  }

  return (
    <div className={s.body}>
      <section className={s.card}>
        <h2>إنت مشترك في إيه؟</h2>
        <p className={r.lead}>اختار كل اشتراكات الذكاء الاصطناعي والتصميم اللي بتدفعها، حتى اللي ناسيها.</p>
        <input className={`${s.input} ${r.search}`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="دوّر: ChatGPT، Canva، CapCut…" aria-label="دوّر على اشتراك" />
        <div className={r.grid}>
          {(q.trim() || all ? list : list.slice(0, 12)).map((t) => (
            <button key={t.id} type="button" className={`${r.pick} ${has(t.id) ? r.on : ""}`} onClick={() => toggle(t)} aria-pressed={has(t.id)}>
              <BotIcon bot={asBot(t)} size={34} />
              <span dir="auto">{t.name}</span>
              {has(t.id) && <i className={r.tick} aria-hidden="true">✓</i>}
            </button>
          ))}
          {!list.length && <p className={r.empty}>مش لاقيين الاسم ده. جرّب اسم تاني.</p>}
        </div>
        {!q.trim() && !all && list.length > 12 && <button type="button" className={`${s.miniBtn} ${r.more}`} onClick={() => setAll(true)}>اعرض كل الاشتراكات ({list.length})</button>}
      </section>

      {items.length > 0 && (
        <section className={s.card}>
          <h2>بتدفع قد إيه وبتستخدمه قد إيه؟</h2>
          <p className={r.lead}>الاستخدام هو اللي بيكشف الفلوس اللي بتضيع.</p>
          <ul className={r.items}>
            {items.map((it) => {
              const t = toolById[it.toolId];
              const plan = t.plans.find((p) => p.name === it.plan);
              return (
                <li key={it.toolId} className={r.item}>
                  <div className={r.itemHead}>
                    <BotIcon bot={asBot(t)} size={30} />
                    <b dir="auto">{t.name}</b>
                    <select className={`${s.select} ${r.plan}`} value={it.plan} onChange={(e) => update(it.toolId, { plan: e.target.value, billing: "monthly" })} aria-label={`خطة ${t.name}`}>
                      {paidPlans(t).map((p) => <option key={p.name} value={p.name}>{p.name} · {fmtUsd(p.usd)}/شهر</option>)}
                    </select>
                    <button type="button" className={r.x} onClick={() => toggle(t)} aria-label={`شيل ${t.name}`}>×</button>
                  </div>
                  <div className={r.itemOpts}>
                    <div className={r.seg} role="group" aria-label="بتستخدمه قد إيه">
                      {Object.entries(USAGE).map(([k, v]) => (
                        <button key={k} type="button" aria-pressed={it.usage === k} onClick={() => update(it.toolId, { usage: k })}>{v}</button>
                      ))}
                    </div>
                    {plan?.usdYear && (
                      <div className={r.seg} role="group" aria-label="طريقة الدفع">
                        <button type="button" aria-pressed={it.billing !== "yearly"} onClick={() => update(it.toolId, { billing: "monthly" })}>شهري</button>
                        <button type="button" aria-pressed={it.billing === "yearly"} onClick={() => update(it.toolId, { billing: "yearly" })}>سنوي</button>
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <div className={r.feeRow}>
            <label htmlFor="rc-fee">رسوم البنك على الدفع بالدولار <small>(اختياري، النسبة اللي بنكك بياخدها)</small></label>
            <div className={r.feeIn}><input id="rc-fee" className={s.input} inputMode="decimal" value={fee} onChange={(e) => { setPrinted(false); setFee(e.target.value.replace(/[^\d.]/g, "").slice(0, 4)); }} placeholder="0" /><span>%</span></div>
          </div>
          <button type="button" className={s.cta} onClick={print}>🧾 اطبع كشف الحساب</button>
          <p className={s.ctaNote}>الأسعار من مصادر منشورة ({PRICES_UPDATED_AR})، والجنيه بسعر {res.rate} للدولار.</p>
        </section>
      )}

      {printed && res.lines.length > 0 && (
        <>
          <div ref={paperRef} className={r.printer} key={printKey}>
            <div className={r.slot} aria-hidden="true" />
            <Paper res={res} />
          </div>
          <Actions res={res} />
          <SiteOffer res={res} />
          {res.needs.some((k) => SITE_FOR[k]) && (
            <section className={s.card}>
              <h3 className={s.sectionTitle}><i aria-hidden="true">⭐</i>جرّب الأول جوه Rising StarAi</h3>
              <p className={r.lead}>قبل ما تجدد أي اشتراك، جرّب نفس الشغل هنا. (مش محسوب في التوفير فوق)</p>
              <div className={s.next}>
                {res.needs.filter((k) => SITE_FOR[k]).slice(0, 4).map((k) => (
                  <Link key={k} href={SITE_FOR[k].href} className={s.nextCard}><i aria-hidden="true">✦</i><span><b>{SITE_FOR[k].label}</b></span></Link>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Paper({ res }) {
  const date = new Date().toLocaleDateString("ar-EG-u-nu-latn", { day: "numeric", month: "long", year: "numeric" });
  const no = useMemo(() => String(Math.floor(100000 + Math.random() * 899999)), []);
  let i = 0;
  const d = () => ({ animationDelay: `${0.25 + (i++) * 0.09}s` });
  return (
    <article className={r.paper} aria-label="كشف حساب اشتراكاتك">
      <header className={r.pHead} style={d()}>
        <span className={r.pBrand} dir="ltr">✦ Rising Star<b>Ai</b></span>
        <h2>كشف حساب اشتراكاتك</h2>
        <small>{date} · رقم {no}</small>
      </header>
      <div className={r.dash} />
      {res.lines.map((l) => (
        <div key={l.toolId} className={r.line} style={d()}>
          <span><b dir="auto">{l.name}</b> <small dir="ltr">{l.plan}{l.billing === "yearly" ? " · yearly" : ""}</small><em>{USAGE[l.usage]}</em></span>
          <i>{n(l.egp)} ج</i>
        </div>
      ))}
      <div className={r.dash} />
      <div className={`${r.line} ${r.total}`} style={d()}><span>بتدفع في الشهر</span><i>{n(res.monthly)} ج</i></div>
      <div className={`${r.line} ${r.sub}`} style={d()}><span>يعني في السنة</span><i>{n(res.yearly)} ج</i></div>
      {res.feePct > 0 && <div className={`${r.line} ${r.sub}`} style={d()}><span>شامل رسوم بنك {res.feePct}%</span><i /></div>}

      {res.savings.length > 0 && (
        <>
          <div className={r.dash} />
          <div className={r.secT} style={d()}>فلوس بتضيع ✂️</div>
          {res.savings.map((x) => (
            <div key={x.toolId} className={`${r.line} ${r.save}`} style={d()}>
              <span><b dir="auto">{x.name}</b><em>{x.text}</em></span>
              <i>− {n(x.egp)} ج</i>
            </div>
          ))}
          <div className={r.dash} />
          <div className={`${r.line} ${r.total}`} style={d()}><span>هتدفع بعد التوفير</span><i>{n(res.after)} ج</i></div>
        </>
      )}

      <div className={r.big} style={d()}>
        {res.saveYear > 0 ? (<><small>هتوفّر في السنة</small><b>{n(res.saveYear)} <span>جنيه</span></b></>) : (<><small>مفيش فلوس بتضيع</small><b className={r.okB}>برافو 👏</b></>)}
      </div>
      <div className={r.stamp} style={{ "--vc": VERDICT_COLOR[res.verdict.k], ...d() }}>{res.verdict.t}</div>
      <div className={r.barcode} aria-hidden="true" style={d()} />
      <footer className={r.pFoot} style={d()}>درجة ذكاء اشتراكاتك: <b>{res.score}/100</b></footer>
    </article>
  );
}

async function makeStory(res) {
  await loadFonts();
  const { c, ctx } = storyCanvas();
  const W = c.width, H = c.height;
  night(ctx, W, H, { glow: "rgba(255,170,0,0.35)", glow2: "rgba(43,91,255,0.35)" });
  star(ctx, W / 2, 150, 84);
  drawText(ctx, "كشف حساب اشتراكاتي", W / 2, 290, { size: 66, weight: 900, color: "#fff", font: "display" });
  // الورقة
  const px = 110, pw = W - 220, py = 350;
  const rows = res.lines.slice(0, 6);
  const ph = 250 + rows.length * 74 + (res.lines.length > rows.length ? 30 : 0) + (res.saveYear > 0 ? 300 : 200);
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.5)"; ctx.shadowBlur = 60; ctx.shadowOffsetY = 20;
  ctx.fillStyle = "#fffdf7";
  ctx.beginPath();
  ctx.moveTo(px, py); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw, py + ph);
  const zz = 24;
  for (let x = px + pw; x > px; x -= zz) { ctx.lineTo(x - zz / 2, py + ph + 16); ctx.lineTo(x - zz, py + ph); }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  const R = px + pw - 50, L = px + 50;
  let y = py + 90;
  const dash = (yy) => { ctx.save(); ctx.strokeStyle = "rgba(5,5,16,0.3)"; ctx.setLineDash([10, 8]); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(L, yy); ctx.lineTo(R, yy); ctx.stroke(); ctx.restore(); };
  rows.forEach((l) => {
    drawText(ctx, l.name, R, y, { size: 40, weight: 700, color: "#050510", align: "right" });
    drawText(ctx, `${n(l.egp)} ج`, L, y, { size: 40, weight: 800, color: "#050510", align: "left" });
    y += 74;
  });
  if (res.lines.length > rows.length) { drawText(ctx, `+ ${res.lines.length - rows.length} كمان`, R, y - 20, { size: 30, weight: 600, color: "#7a8093", align: "right" }); y += 30; }
  dash(y - 30); y += 40;
  drawText(ctx, "بدفع في الشهر", R, y, { size: 44, weight: 800, color: "#050510", align: "right", font: "display" });
  drawText(ctx, `${n(res.monthly)} ج`, L, y, { size: 48, weight: 900, color: "#050510", align: "left", font: "display" });
  y += 66;
  drawText(ctx, "يعني في السنة", R, y, { size: 34, weight: 600, color: "#4a5063", align: "right" });
  drawText(ctx, `${n(res.yearly)} ج`, L, y, { size: 36, weight: 700, color: "#4a5063", align: "left" });
  y += 60; dash(y - 20); y += 70;
  if (res.saveYear > 0) {
    ctx.fillStyle = "#ffd21f"; rr(ctx, L - 10, y - 40, pw - 80, 200, 26); ctx.fill();
    drawText(ctx, "طلعت هوفّر في السنة", W / 2, y + 20, { size: 38, weight: 700, color: "#050510", font: "display" });
    drawText(ctx, `${n(res.saveYear)} جنيه`, W / 2, y + 120, { size: 92, weight: 900, color: "#050510", font: "display" });
  } else {
    drawText(ctx, "اشتراكاتي مظبوطة 👏", W / 2, y + 40, { size: 56, weight: 900, color: "#12b76a", font: "display" });
  }
  drawText(ctx, "اعمل كشف حسابك إنت كمان 👇", W / 2, H - 330, { size: 42, weight: 700, color: "#ffd21f", font: "display" });
  brandFooter(ctx, W, H, "/subscriptions/receipt");
  return toBlob(c);
}

function Actions({ res }) {
  const [busy, setBusy] = useState(false);
  const summary = [
    "🧾 كشف حساب اشتراكاتي في الذكاء الاصطناعي:",
    ...res.lines.map((l) => `• ${l.name} ${l.plan}: ${n(l.egp)} ج/شهر`),
    `الإجمالي: ${n(res.monthly)} ج في الشهر (${n(res.yearly)} في السنة)`,
    res.saveYear > 0 ? `طلعت ممكن أوفّر ${n(res.saveYear)} ج في السنة 😳` : "اشتراكاتي طلعت مظبوطة 👏",
    "",
    `اعمل كشفك: ${typeof location !== "undefined" ? location.origin : ""}/subscriptions/receipt`,
  ].join("\n");
  async function share() {
    setBusy(true);
    try {
      const blob = await makeStory(res);
      const out = await shareOrDownload(blob, "my-subscriptions.png", summary);
      if (out === "downloaded") toast("الصورة اتحملت");
    } catch { toast("ما قدرناش نعمل الصورة"); }
    setBusy(false);
  }
  return (
    <section className={s.card}>
      <div className={r.actions}>
        <button type="button" className={s.cta} onClick={share} disabled={busy}>{busy ? <span className={s.spin} /> : "📲"} شارك الكشف ستوري</button>
        <a className={s.miniBtn} href={`https://wa.me/?text=${encodeURIComponent(summary)}`} target="_blank" rel="noopener noreferrer">ابعته واتساب</a>
        <button type="button" className={s.miniBtn} onClick={async () => { if (await copyText(summary)) toast("اتنسخ"); }}>نسخ</button>
      </div>
      <p className={s.note} style={{ marginTop: 14 }}>
        <span aria-hidden="true">ℹ️</span>
        <span>التوفير محسوب بقواعد واضحة: اشتراكين بيعملوا نفس الشغل، أو خطة أكبر من استخدامك، أو دفع شهري والسنوي أرخص. اتأكد من الخطط في الموقع الرسمي قبل ما تلغي أي حاجة، وشوف <Link href="/subscriptions">مقارن الاشتراكات</Link> و<Link href="/scam-check">كاشف النصب</Link> قبل ما تشتري من أي بياع.</span>
      </p>
    </section>
  );
}

// «لو جيت الموقع»: اللي الموقع بيعمله فعلاً بدل اشتراكاتك، مقارنةً بباقة 250 ج
function SiteOffer({ res }) {
  const o = useMemo(() => siteOffer(res), [res]);
  if (!o) return null;
  const toolsurfEgp = toEgp(TOOLSURF.usd);
  return (
    <section className={`${s.card} ${r.offer}`}>
      <h3 className={s.sectionTitle}><i aria-hidden="true">⭐</i>وفّر الفاتورة دي كلها هنا</h3>
      {o.covered.length > 0 && (
        <>
          <p className={r.lead}>
            {o.worth
              ? <>اللي بتدفعه على {o.covered.map((l) => l.name).join(" و")} هو <b>{n(o.coveredSum)} جنيه</b> في الشهر. باقة Rising StarAi بـ <b>{SITE_PLAN_EGP} جنيه</b> فيها شغلهم:</>
              : <>باقة Rising StarAi بـ <b>{SITE_PLAN_EGP} جنيه</b> في الشهر فيها شغل اشتراكاتك دي، وبتدفع حالياً حوالي {n(o.coveredSum)} جنيه:</>}
          </p>
          <ul className={r.offerList}>
            {o.covered.map((l) => (
              <li key={l.toolId}><span>{l.name}</span><em>{n(l.egp)} ج</em><small>{l.by}</small></li>
            ))}
          </ul>
          <ul className={r.offerDo}>
            <li>✍️ شات وكتابة بالعربي بأقوى الموديلات</li>
            <li>🔎 بحث على الإنترنت بالمصادر</li>
            <li>📄 تلخيص PDF وWord وصور والإجابة منها</li>
            <li>📁 مشاريع: ملفاتك وتعليماتك ومحادثاتك في مكان واحد</li>
          </ul>
          <p className={r.offerNote}>الحساب ده للشات والكتابة والبحث والتلخيص بس. لو بتستخدم صور أو فيديو جوه اشتراكك، الموقع فيه أدواتهم لكن مش بنوعدك بنفس الجودة والحدود.</p>
          {o.worth && (
            <div className={r.offerSave}>
              <small>التوفير لو بدّلتهم</small>
              <b>{n(o.saveMonthly)} <span>جنيه / شهر</span></b>
              <em>{n(o.saveYear)} جنيه في السنة</em>
            </div>
          )}
        </>
      )}
      {o.tooled.length > 0 && (
        <div className={r.toolsurf}>
          <b>{o.tooled.map((l) => l.name).join(" و")}؟</b>
          <p>
            موجودين في باقة {TOOLSURF.name} بـ {TOOLSURF.usd} دولار (حوالي {n(toolsurfEgp)} جنيه) كـ<b> {TOOLSURF.label}</b>: حساب بتشاركه مع غيرك، مش اشتراكك الخاص.
            ده غالباً بيخالف شروط استخدام الشركات الأصلية وممكن يتقفل في أي وقت، فاعتبره حل اقتصادي مؤقت وبدون ضمان.
          </p>
        </div>
      )}
      {o.uncovered.length > 0 && <p className={r.offerNote}>اللي مش هنغطيه: {o.uncovered.map((l) => l.name).join(" و")}. هيفضل اشتراكهم زي ما هو.</p>}
      <Link href="/plans" className={s.cta}>شوف باقة {SITE_PLAN_NAME} • {SITE_PLAN_EGP} ج</Link>
      <p className={s.ctaNote}>الاشتراكات لسه مش مفعّلة، والصفحة دي بتوريك الحساب بس.</p>
    </section>
  );
}
