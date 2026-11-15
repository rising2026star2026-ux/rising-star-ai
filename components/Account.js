"use client";
// حسابي: تسجيل دخول وإنشاء حساب (Managed Better Auth عن طريق /api/auth)، ونقل بيانات الجهاز للحساب، وحذفها.
// لما الحسابات مش متفعّلة، الصفحة بتقول كده وبياناتك بتفضل على الجهاز.
import { useEffect, useState } from "react";
import Link from "next/link";
import { exportAll, summary as deviceSummary } from "@/lib/repo";
import { toast } from "@/lib/store";
import s from "./account.module.css";

const MSG = {
  401: "الإيميل أو كلمة السر مش صح.",
  403: "مش مسموح بالعملية دي.",
  409: "الإيميل ده عليه حساب بالفعل. سجّل دخول.",
  422: "راجع البيانات: الإيميل لازم يكون صحيح، وكلمة السر 8 حروف أو أكتر.",
  429: "محاولات كتير. استنى شوية وجرّب تاني.",
};
const friendly = (status) => MSG[status] || "حصلت مشكلة. جرّب تاني.";

async function call(url, body) {
  const res = await fetch(url, { method: body ? "POST" : "GET", headers: body ? { "Content-Type": "application/json" } : undefined, body: body ? JSON.stringify(body) : undefined });
  let data = null;
  try { data = await res.json(); } catch {}
  return { ok: res.ok, status: res.status, data };
}

export default function Account() {
  const [state, setState] = useState({ loading: true });
  const [mode, setMode] = useState("in");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [local, setLocal] = useState([]);

  async function load() {
    const r = await call("/api/workspace");
    setState(r.ok ? { loading: false, ...r.data } : { loading: false, enabled: false, error: true });
  }
  useEffect(() => { load(); setLocal(deviceSummary().filter((x) => x.count)); }, []);

  async function submit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    const email = form.email.trim(), password = form.password;
    const r = mode === "up"
      ? await call("/api/auth/sign-up/email", { name: form.name.trim() || email.split("@")[0], email, password })
      : await call("/api/auth/sign-in/email", { email, password });
    setBusy(false);
    if (!r.ok) { setErr(friendly(r.status === 400 ? 422 : r.status)); return; }
    setForm({ name: "", email: "", password: "" });
    toast(mode === "up" ? "اتعمل حسابك." : "أهلاً بيك.");
    load();
  }

  async function signOut() {
    await call("/api/auth/sign-out", {});
    load();
  }

  async function importLocal() {
    setBusy(true);
    const r = await call("/api/workspace", { action: "import", payload: exportAll(), businessId: state.businesses?.[0]?.id });
    setBusy(false);
    if (!r.ok) { toast(r.data?.error || friendly(r.status)); return; }
    const c = r.data.counts;
    toast(`اتنقلوا: ${c.comparisons} مقارنة، ${c.studies} دراسة، ${c.chats + c.outputs} مخرج.`);
    load();
  }

  async function deleteAccountData() {
    if (!window.confirm("هيتمسح كل نشاط إنت مالكه وبياناته من حسابك نهائياً. بيانات جهازك مش هتتأثر. تكمّل؟")) return;
    const r = await call("/api/workspace", { action: "deleteMine", confirm: "DELETE" });
    toast(r.ok ? "اتمسحت بيانات حسابك." : r.data?.error || friendly(r.status));
    load();
  }

  if (state.loading) return <p className={s.note} role="status">بنحمّل حسابك…</p>;

  if (!state.enabled) {
    return (
      <section className={s.card}>
        <h2>الحسابات لسه بتتجهّز</h2>
        <p className={s.note}>لحد ما تتفعّل، كل بياناتك محفوظة على جهازك ده. تقدر تنزّل نسخة منها من <Link href="/my-work">مشروعاتي وتقاريري</Link>.</p>
      </section>
    );
  }

  if (!state.user) {
    return (
      <section className={s.card} aria-labelledby="acc-title">
        <div className={s.tabs} role="tablist">
          <button type="button" role="tab" aria-selected={mode === "in"} onClick={() => setMode("in")}>تسجيل الدخول</button>
          <button type="button" role="tab" aria-selected={mode === "up"} onClick={() => setMode("up")}>حساب جديد</button>
        </div>
        <h2 id="acc-title">{mode === "up" ? "اعمل حسابك" : "ادخل حسابك"}</h2>
        <form onSubmit={submit} className={s.form}>
          {mode === "up" && <label><span>الاسم</span><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={60} autoComplete="name" /></label>}
          <label><span>الإيميل</span><input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} autoComplete="email" dir="ltr" /></label>
          <label><span>كلمة السر</span><input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} autoComplete={mode === "up" ? "new-password" : "current-password"} dir="ltr" /></label>
          {err && <p className={s.err} role="alert">{err}</p>}
          <button type="submit" className={s.primary} disabled={busy}>{busy ? "استنى…" : mode === "up" ? "اعمل الحساب" : "ادخل"}</button>
        </form>
        <p className={s.note}>بياناتك بتفضل على جهازك لحد ما تنقلها لحسابك بنفسك.</p>
      </section>
    );
  }

  const biz = state.businesses?.[0];
  return (
    <>
      <section className={s.card}>
        <h2>أهلاً {state.user.name || state.user.email}</h2>
        <p className={s.note} dir="auto">{state.user.email}</p>
        {biz ? (
          <p className={s.note}>نشاطك على الحساب: <b>{biz.name}</b>{state.counts ? ` — ${state.counts.studies} دراسة، ${state.counts.comparisons} مقارنة، ${state.counts.reports} تقرير` : ""}</p>
        ) : <p className={s.note}>مفيش نشاط على حسابك لسه.</p>}
        <button type="button" className={s.ghost} onClick={signOut}>تسجيل الخروج</button>
      </section>

      <section className={s.card}>
        <h2>انقل بيانات جهازك لحسابك</h2>
        {local.length ? (
          <>
            <ul className={s.list}>{local.map((x) => <li key={x.name}>{x.label}: {x.count}</li>)}</ul>
            <p className={s.note}>بتتنسخ لحسابك في عملية واحدة، والنسخة اللي على جهازك بتفضل زي ما هي.</p>
            <button type="button" className={s.primary} disabled={busy} onClick={importLocal}>{busy ? "بننقل…" : "انقل لحسابي"}</button>
          </>
        ) : <p className={s.note}>مفيش بيانات على الجهاز ده.</p>}
      </section>

      <section className={s.card}>
        <h2>بيانات حسابك</h2>
        <p className={s.note}>تقدر تمسح كل الأنشطة اللي إنت مالكها وبياناتها من حسابك.</p>
        <button type="button" className={s.danger} onClick={deleteAccountData}>امسح بيانات حسابي</button>
      </section>
    </>
  );
}
