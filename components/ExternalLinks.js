import s from "./external.module.css";

// زراير بتفتح مواقع تانية في صفحة جديدة.
// على الموبايل، لو تطبيق الموقع متسطّب، الرابط غالباً بيفتح التطبيق مباشرة.
// المستخدم بيدخل بحسابه هو هناك، والمميزات حسب اشتراكه في الموقع ده.
// عشان تشيل زرار أو تضيف واحد: عدّل القوائم دي بس.

// مواقع ذكاء اصطناعي
const AI_SITES = [
  { name: "Genspark", desc: "وكيل ذكي بيعمل عروض وأبحاث ومستندات", url: "https://www.genspark.ai", hue: "#5aa9ff", icon: "spark" },
  { name: "Poe", desc: "موديلات عالمية كتير في مكان واحد", url: "https://poe.com", hue: "#9b87ff", icon: "chat" },
  { name: "Toolsurf", desc: "اشتراك واحد لأدوات مدفوعة كتير", url: "https://www.toolsurf.com", hue: "#3ccf9a", icon: "grid" },
];

// أدلة أدوات الذكاء الاصطناعي (روابط لآلاف الأدوات)
const DIRECTORIES = [
  { name: "TAAFT", desc: "There's An AI For That: من أكبر أدلة الأدوات في العالم", url: "https://theresanaiforthat.com", hue: "#ff8a5c", icon: "search", lang: "EN" },
  { name: "Toolify", desc: "دليل ضخم مقسم لمئات التصنيفات", url: "https://www.toolify.ai", hue: "#4fc3f7", icon: "layers", lang: "EN" },
  { name: "TopAI.tools", desc: "أدوات مرتبة حسب الشغلانة والمجال", url: "https://topai.tools", hue: "#b388ff", icon: "list", lang: "EN" },
  { name: "Futurepedia", desc: "أدوات مع شروحات وفيديوهات", url: "https://www.futurepedia.io", hue: "#ffd166", icon: "book", lang: "EN" },
  { name: "FutureTools", desc: "اختيارات منتقاة وتقييمات المستخدمين", url: "https://www.futuretools.io", hue: "#7ee0a8", icon: "star", lang: "EN" },
  { name: "Adawatly", desc: "دليل أدوات الذكاء الاصطناعي بالعربي", url: "https://adawatly.com", hue: "#ff6f91", icon: "globe", lang: "عربي" },
];

const GROUPS = {
  sites: { title: "مواقع ذكاء اصطناعي", list: AI_SITES },
  dirs: { title: "أدلة الأدوات العالمية", sub: "آلاف الأدوات من كل مكان في العالم", list: DIRECTORIES },
};

/** show: أنهي مجموعات تظهر. title: عنوان بديل للمجموعة الأولى */
export default function ExternalLinks({ show = ["sites", "dirs"], title }) {
  return (
    <section className={s.wrap} aria-label="مواقع خارجية">
      {show.map((key, i) => {
        const g = GROUPS[key];
        return (
          <div key={key} className={s.group}>
            <div className={s.head}>
              <span>{i === 0 && title ? title : g.title}</span>
              {g.sub && <small>{g.sub}</small>}
            </div>
            <div className={`${s.row} ${key === "dirs" ? s.rowDense : ""}`}>
              {g.list.map((site) => (
                <a
                  key={site.name}
                  className={s.card}
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ "--h": site.hue }}
                  aria-label={`افتح ${site.name} في صفحة جديدة`}
                >
                  <span className={s.icon} aria-hidden="true"><Icon name={site.icon} /></span>
                  <span className={s.text}>
                    <b>
                      <bdi>{site.name}</bdi>
                      {site.lang && <em className={site.lang === "عربي" ? s.ar : ""}>{site.lang}</em>}
                    </b>
                    <small>{site.desc}</small>
                  </span>
                  <span className={s.out} aria-hidden="true">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 4h6v6M20 4l-9 9M18 14v4a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2h4" />
                    </svg>
                  </span>
                </a>
              ))}
            </div>
          </div>
        );
      })}
      <p className={s.note}>مواقع خارجية مش تابعة لـ Rising StarAi. الدخول والاشتراك بيكون بحسابك عندهم وحسب شروطهم.</p>
    </section>
  );
}

// أيقونات عامة (مش شعارات الشركات)
function Icon({ name }) {
  const p = { width: 20, height: 20, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" };
  switch (name) {
    case "spark":
      return <svg {...p}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /><path d="M18.5 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z" /></svg>;
    case "chat":
      return <svg {...p}><path d="M20.5 12a8.5 8.5 0 01-12.2 7.7L3.5 21l1.3-4.6A8.5 8.5 0 1120.5 12z" /><path d="M8.5 11h7M8.5 14h4.5" /></svg>;
    case "search":
      return <svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M20 20l-4.2-4.2M8.5 11h5M11 8.5v5" /></svg>;
    case "layers":
      return <svg {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>;
    case "list":
      return <svg {...p}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>;
    case "book":
      return <svg {...p}><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5z" /><path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5" /></svg>;
    case "star":
      return <svg {...p}><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" /></svg>;
    case "globe":
      return <svg {...p}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5s1.1-5.9 3.6-8.5z" /></svg>;
    default:
      return <svg {...p}><rect x="3.5" y="3.5" width="7" height="7" rx="2" /><rect x="13.5" y="3.5" width="7" height="7" rx="2" /><rect x="3.5" y="13.5" width="7" height="7" rx="2" /><path d="M17 13.5v7M13.5 17h7" /></svg>;
  }
}
