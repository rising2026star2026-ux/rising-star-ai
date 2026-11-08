"use client";
// «الرفوف»: صفوف كروت بتتسحب بالعرض (زي تطبيقات الشات العالمية). بتستخدمها صفحات الأقسام والشات العام.
//   ArtCard   كارت أداة: مجسّم 3D كبير بيوضح الأداة بتعمل إيه، على تدرج لون فئتها، والمجسّم بيتعدل ويطلع لفوق لما تلمسه.
//   ModelCard كارت موديل: لوجو الشركة، وهالة من نفس ألوان اللوجو، واسم الموديل والشركة.
import Link from "next/link";
import s from "./shelf.module.css";

export function Shelf({ title, more, count, children }) {
  return (
    <section className={s.shelf} aria-label={title}>
      <div className={s.head}>
        <h2>{title}</h2>
        {more && <Link href={more} className={s.more}>عرض الكل{count ? ` (${count})` : ""}</Link>}
      </div>
      <div className={s.track}>{children}</div>
    </section>
  );
}

export function ArtCard({ href, title, desc, img, c1, c2, tag }) {
  return (
    <Link href={href} className={s.art} style={{ "--c1": c1, "--c2": c2 }}>
      {img && <img src={img} alt="" width="240" height="240" loading="lazy" decoding="async" />}
      {tag && <span className={s.tag}>{tag}</span>}
      <b>{title}</b>
      {desc && <span className={s.desc}>{desc}</span>}
    </Link>
  );
}

export function ModelCard({ bot }) {
  const [c1, c2] = bot.colors || ["#3a4152", "#12151c"];
  const href = bot.available ? `/chat?bot=${bot.key}` : "/models";
  const tag = !bot.available ? "قريباً" : bot.tier === "pro" ? "PRO" : null;
  return (
    <Link href={href} className={s.model} style={{ "--c1": c1, "--c2": c2 }} title={bot.desc || bot.name}>
      {bot.logo && <img className={s.glow} src={bot.logo} alt="" aria-hidden="true" loading="lazy" />}
      {tag && <span className={`${s.tag} ${tag === "PRO" ? s.pro : ""}`}>{tag}</span>}
      {bot.logo ? <img className={s.logo} src={bot.logo} alt="" width="52" height="52" loading="lazy" /> : <span className={s.mono}>{bot.mono || bot.name.slice(0, 2)}</span>}
      <b dir="auto">{bot.name}</b>
      <small dir="auto">{bot.maker}</small>
    </Link>
  );
}
