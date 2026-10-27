import Link from "next/link";
import { notFound } from "next/navigation";
import BotIcon from "@/components/BotIcon";
import MakerPrompt from "@/components/MakerPrompt";
import MakerImageGen from "@/components/MakerImageGen";
import MakerFrame from "@/components/MakerFrame";
import { MAKER_LIST, MAKER_KINDS, getMaker, POLL } from "@/lib/makers";
import d from "@/components/directory.module.css";
import s from "@/components/maker.module.css";

export function generateStaticParams() {
  return MAKER_LIST.map((m) => ({ slug: m.slug }));
}
export const dynamicParams = false;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const m = getMaker(slug);
  if (!m) return {};
  return { title: `${m.name} بالعربي: الحد المجاني وإزاي تستخدمه`, description: `${m.free}. ${m.ar || "اكتب بالعربي ونترجم لك الوصف."}`.slice(0, 160), alternates: { canonical: `/maker/${m.slug}` } };
}

// عنوان Pollinations اللي اشتغل في الفحص
function pollBase() {
  const ok = (r) => r && r.status === 200 && /image/.test(r.type || "") && r.bytes > 2000;
  if (ok(POLL.legacy)) return "https://image.pollinations.ai/prompt/";
  if (ok(POLL.new)) return "https://gen.pollinations.ai/image/";
  return null;
}

export default async function MakerPage({ params }) {
  const { slug } = await params;
  const m = getMaker(slug);
  if (!m) notFound();
  const kind = MAKER_KINDS.find((k) => k.id === m.kind);
  const base = m.slug === "pollinations" ? pollBase() : null;
  const similar = MAKER_LIST.filter((x) => x.kind === m.kind && x.slug !== m.slug).slice(0, 6);
  const gen = m.kind === "video" ? "video" : "image";

  return (
    <div className={d.toolPage}>
      <nav className={d.crumbs} aria-label="مسار الصفحة">
        <Link href="/maker">صانع الصور والفيديو</Link><span aria-hidden="true">/</span><span dir="auto">{m.name}</span>
      </nav>

      <header className={d.hero}>
        <BotIcon bot={{ name: m.name, logo: m.logo, mono: m.name.slice(0, 2), tint: "#1f4dff" }} size={84} />
        <div>
          <h1 dir="auto">{m.name}</h1>
          <p>{m.free}</p>
          <div className={d.meta}><span>{kind?.title}</span></div>
        </div>
      </header>

      <div className={s.pills}>
        <span className={s.pill}>{m.login === false ? "من غير تسجيل" : m.login === "اختياري" ? "التسجيل اختياري" : m.login === true ? "محتاج حساب" : m.login}</span>
        {m.ar && <span className={s.pill}>العربي: {m.ar}</span>}
      </div>

      {m.slug === "pollinations" && base && <MakerImageGen base={base} />}
      {m.slug === "pollinations" && !base && (
        <section className={d.box}><p>المولّد جوه الموقع واقف مؤقتاً. استخدم المترجم تحت وافتح الأداة.</p></section>
      )}
      {m.kind !== "editor" && !(m.slug === "pollinations" && base) && <MakerPrompt kind={gen} url={m.url} name={m.name} />}

      {m.embed === "frame" && m.slug !== "pollinations" && <MakerFrame url={m.url} name={m.name} />}
      {(m.embed !== "frame" || m.kind === "editor") && (
        <a className={d.visit} href={m.url} target="_blank" rel="noopener noreferrer nofollow">افتح {m.name} ↗</a>
      )}

      {m.note && <section className={d.box}><h2>ملاحظة</h2><p>{m.note}</p></section>}
      <section className={d.box}>
        <h2>إزاي تستخدمه</h2>
        <ol>
          {m.kind === "editor"
            ? [<li key="1">افتح الأداة وارفع مقاطعك.</li>, <li key="2">رتّبها وأضف الترجمة والموسيقى.</li>, <li key="3">صدّر الفيديو وانشره.</li>]
            : [<li key="1">اكتب فكرتك بالعربي فوق واضغط «ترجم وحسّن الوصف».</li>, <li key="2">انسخ الوصف الإنجليزي.</li>, <li key="3">افتح {m.name} والصقه في خانة الوصف، وولّد.</li>]}
        </ol>
      </section>

      <section className={d.box}>
        <h2>أدوات مشابهة</h2>
        <div className={d.grid}>
          {similar.map((x) => (
            <Link key={x.slug} href={x.href} className={d.tool}>
              <BotIcon bot={{ name: x.name, logo: x.logo, mono: x.name.slice(0, 2), tint: "#1f4dff" }} size={40} />
              <span><b dir="auto">{x.name}</b><small>{x.free}</small></span>
            </Link>
          ))}
        </div>
      </section>
      <p className={d.note}>معلومات الحد المجاني من مقالات منشورة في 2026 وممكن تتغير. اتأكد من الموقع الرسمي قبل ما تعتمد عليها. الاسم والشعار علامات تجارية لأصحابها والصفحة تعريفية.</p>
    </div>
  );
}
