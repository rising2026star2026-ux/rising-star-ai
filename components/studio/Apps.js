// برامج تصميم أونلاين: بدائل مجانية أو فيها خطة مجانية لبرامج أدوبي.
// بتفتح في صفحة جديدة، والمستخدم بيدخل بحسابه هو هناك.
import s from "./studio.module.css";

const GROUPS = [
  {
    title: "صور وتصميم",
    list: [
      { name: "Photopea", alt: "بديل Photoshop", desc: "شبه فوتوشوب جداً وبيفتح ملفات PSD، ومجاني في المتصفح.", url: "https://www.photopea.com", hue: "#4fa3ff", icon: "layers" },
      { name: "Canva", alt: "تصميم سوشيال", desc: "آلاف القوالب الجاهزة للبوستات والعروض، وفيه عربي.", url: "https://www.canva.com", hue: "#26c6da", icon: "grid" },
      { name: "Adobe Express", alt: "من أدوبي نفسها", desc: "نسخة أدوبي السهلة للبوستات والفيديوهات القصيرة، وليها خطة مجانية.", url: "https://new.express.adobe.com", hue: "#ff5a5f", icon: "spark" },
      { name: "remove.bg", alt: "إزالة خلفية بالذكاء الاصطناعي", desc: "لصور الأشخاص والخلفيات الصعبة.", url: "https://www.remove.bg", hue: "#6fd6a2", icon: "cut" },
    ],
  },
  {
    title: "رسم وواجهات",
    list: [
      { name: "Figma", alt: "بديل XD وIllustrator", desc: "تصميم واجهات وتطبيقات ولوجوهات، والخطة المجانية كفاية للبداية.", url: "https://www.figma.com", hue: "#a07bff", icon: "pen" },
      { name: "Vectorpea", alt: "بديل Illustrator", desc: "من نفس صناع Photopea، لرسم الفيكتور والـ SVG.", url: "https://www.vectorpea.com", hue: "#ffb84d", icon: "pen" },
    ],
  },
  {
    title: "فيديو",
    list: [
      { name: "CapCut", alt: "بديل Premiere", desc: "مونتاج ريلز وتيك توك بقوالب وترجمة تلقائية.", url: "https://www.capcut.com", hue: "#e9e7e2", icon: "video" },
      { name: "Clipchamp", alt: "مونتاج في المتصفح", desc: "مونتاج سهل من مايكروسوفت، وفيه خطة مجانية.", url: "https://clipchamp.com", hue: "#7c8cff", icon: "video" },
    ],
  },
  {
    title: "PDF",
    list: [
      { name: "iLovePDF", alt: "بديل Acrobat", desc: "تحويل PDF لـ Word وبالعكس، وتوقيع، وضغط.", url: "https://www.ilovepdf.com", hue: "#ff6b6b", icon: "doc" },
    ],
  },
];

export default function Apps() {
  return (
    <div className={s.root}>
      <p className={s.note} style={{ fontSize: "0.88rem", color: "var(--muted)" }}>
        أدوات «استوديو التصميم» التانية بتشتغل جوه الموقع على طول. ولو محتاج شغل أتقل، دي أقوى البدائل الأونلاين لبرامج أدوبي:
      </p>
      {GROUPS.map((g) => (
        <section key={g.title} className={s.appsGroup}>
          <h3>{g.title}</h3>
          <div className={s.apps}>
            {g.list.map((a) => (
              <a key={a.name} className={s.app} href={a.url} target="_blank" rel="noopener noreferrer" style={{ "--h": a.hue }} aria-label={`افتح ${a.name} في صفحة جديدة`}>
                <span className={s.appIcon} aria-hidden="true"><Icon name={a.icon} /></span>
                <span className={s.appText}>
                  <b><bdi>{a.name}</bdi><em>{a.alt}</em></b>
                  <small>{a.desc}</small>
                </span>
                <span className={s.appOut} aria-hidden="true">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" /></svg>
                </span>
              </a>
            ))}
          </div>
        </section>
      ))}
      <p className={s.note}>مواقع خارجية مش تابعة لـ Rising StarAi. الدخول والاشتراك بيكون بحسابك عندهم وحسب شروطهم.</p>
    </div>
  );
}

function Icon({ name }) {
  const p = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "layers": return <svg {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "spark": return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>;
    case "cut": return <svg {...p}><circle cx="6" cy="7" r="3" /><circle cx="6" cy="17" r="3" /><path d="M8.5 8.5L20 19M8.5 15.5L20 5" /></svg>;
    case "pen": return <svg {...p}><path d="M12 19l7-7 2 2-7 7z" /><path d="M18 13l-1.5-7.5L3 2l3.5 13.5L14 17z" /><circle cx="11" cy="11" r="2" /></svg>;
    case "video": return <svg {...p}><rect x="3" y="5" width="14" height="14" rx="3" /><path d="M17 10l4-2.5v9L17 14" /></svg>;
    case "doc": return <svg {...p}><path d="M14 3H7a2 2 0 00-2 2v14a2 2 0 002 2h10a2 2 0 002-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h4" /></svg>;
    default: return <svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><rect x="13.5" y="13.5" width="7" height="7" rx="2" /></svg>;
  }
}
