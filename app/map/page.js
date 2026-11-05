import Link from "next/link";
import { APPS } from "@/lib/apps";
import { PROMPTS } from "@/lib/prompts";
import { tools } from "@/lib/tools";
import { FLOWS } from "@/lib/flows";
import { AGENTS } from "@/lib/agents";
import { DIR_TOTAL } from "@/lib/directory";
import s from "@/components/sitemap.module.css";

export const metadata = {
  title: "خريطة الموقع: كل حاجة في مكان واحد وإزاي تبدأ",
  description: "دليلك لكل أقسام Rising StarAi: أدوات الشغل، الباحثين المتخصصين، استوديو البيّاع، البرومبتات، والأدوات العالمية، وإزاي تسجّل في أدواتك الخارجية وتفتحها من مكان واحد.",
  alternates: { canonical: "/map" },
};

const goals = [
  { who: "بتبيع أونلاين", what: "صور وإعلانات وكتالوج وشعار وهوية لنشاطك.", to: "/seller", label: "ستوديو البيّاع" },
  { who: "عندك مشروع أو فكرة", what: "دراسة جدوى بسيناريوهات وبحث سوق، من غير قروض بفايدة.", to: "/feasibility", label: "الباحث التجاري" },
  { who: "بتشتري أو بتأجّر عقار", what: "سعر عادل، مقارنة طرق الدفع، وقراءة عقد أو إعلان.", to: "/realestate", label: "الباحث العقاري" },
  { who: "بتذاكر أو بتكتب بحث", what: "تقرير بمصادر من مكتبات الأبحاث وشات يناقشك فيه.", to: "/research", label: "الباحث الأكاديمي" },
  { who: "عايز تشتغل بالذكاء الاصطناعي وبس", what: "شات وتلخيص ملفات وأدوات لأي مهمة.", to: "/chat", label: "الشات" },
];

const groups = [
  {
    title: "اشتغل",
    items: [
      { to: "/chat", name: "الشات", d: "محادثة بموديلات متعددة، وبحث على الإنترنت بمصادر." },
      { to: "/projects", name: "المشاريع", d: "ملفاتك وتعليماتك ومحادثاتك في مكان واحد، وتسأل عن ملفاتك." },
      { to: "/tools", name: "كل الأدوات", d: `${tools.length} أداة للكتابة والتسويق والتصميم والتحليل.` },
      { to: "/tasks", name: "أداة لأي مهمة", d: "اكتب اللي عايزه ويقترح عليك الأداة المناسبة." },
      { to: "/flows", name: "المهام الكاملة", d: `${FLOWS.length} مهام متعددة الخطوات، طلب واحد يعدّي على أكتر من أداة.` },
      { to: "/agents", name: "الوكلاء", d: `${AGENTS.length} مساعدين بيبحثوا ويكتبوا لك بالمصادر.` },
    ],
  },
  {
    title: "متخصصين",
    items: [
      { to: "/realestate", name: "الباحث العقاري", d: "تقرير سعر، حاسبات التقسيط والعائد والإيجار القديم، وشات عقاري." },
      { to: "/feasibility", name: "الباحث التجاري", d: "دراسة جدوى وبيانات ميدانية وشات متخصص." },
      { to: "/research", name: "الباحث الأكاديمي", d: "تقرير بمصادر موثّقة وخريطة مصادر وشات متخصص." },
      { to: "/seller", name: "ستوديو البيّاع", d: "من الصورة للإعلان للكتالوج، من موبايلك." },
      { to: "/scam-check", name: "كاشف النصب", d: "افحص أي بائع قبل ما تدفع." },
      { to: "/subscriptions", name: "مقارن الاشتراكات", d: "قارن أسعار الاشتراكات بالجنيه وقيّم احتياجك." },
    ],
  },
  {
    title: "التصميم والصور",
    items: [
      { to: "/tools", name: "استوديو التصميم", d: "صانع شعارات وأدوات تصميم بتشتغل في المتصفح." },
      { to: "/maker", name: "صانع الصور", d: "توليد صور من وصف مكتوب." },
      { to: "/prompts", name: "مكتبة البرومبتات", d: `${PROMPTS.length} برومبت جاهز بضغطة نسخ.` },
    ],
  },
  {
    title: "اكتشف",
    items: [
      { to: "/models", name: "الموديلات والبرامج", d: "إيه الموديلات والبرامج وإمتى تستخدم كل واحد." },
      { to: "/compare", name: "مقارنة الموديلات", d: "نفس السؤال على أكتر من موديل جنب بعض." },
      { to: "/global-tools", name: "أدوات عالمية", d: `دليل عربي لحوالي ${DIR_TOTAL} أداة، مع بدائل لأشهر الأدوات المدفوعة.` },
      { to: "/learn", name: "تعلّم الذكاء الاصطناعي", d: "مسار وكورسات ومواقع تعلّم بالعربي." },
      { to: "/news", name: "جديد الذكاء الاصطناعي", d: "أخبار الشركات بتتحدث كل يوم." },
      { to: "/creators", name: "صناع المحتوى", d: "أهم صناع محتوى الذكاء الاصطناعي بالعربي." },
    ],
  },
  {
    title: "حسابك",
    items: [
      { to: "/brand", name: "هوية نشاطي", d: "سجّل نشاطك وألوانك مرة، والأدوات بتستخدمها." },
      { to: "/my-tools", name: "أدواتي", d: `اختار من ${APPS.length} أداة عالمية وافتحها كلها بضغطة.` },
      { to: "/history", name: "السجل", d: "اللي عملته قبل كده على جهازك." },
      { to: "/support", name: "الدعم", d: "إجابة فورية، أو كلّم الفريق." },
      { to: "/plans", name: "الباقات", d: "الأسعار والمميزات، والاشتراكات لسه مش مفعّلة." },
    ],
  },
];

export default function SiteMap() {
  return (
    <div className={s.page}>
      <h1 className="page-title">خريطة الموقع</h1>
      <p className={s.lead}>
        الموقع فيه أدوات كتير، وده دليلك. اختار اللي بتعمله، وهتلاقي إيه تفتح وإزاي تبدأ.
      </p>

      <section aria-labelledby="goal">
        <h2 id="goal" className={s.h2}>أنت بتعمل إيه؟</h2>
        <div className={s.goals}>
          {goals.map((g) => (
            <Link key={g.to} href={g.to} className={s.goal}>
              <b>{g.who}</b>
              <span>{g.what}</span>
              <em>{g.label}</em>
            </Link>
          ))}
        </div>
      </section>

      <section aria-labelledby="steps">
        <h2 id="steps" className={s.h2}>تبدأ إزاي في 3 خطوات</h2>
        <ol className={s.steps}>
          <li>
            <b>سجّل نشاطك مرة واحدة.</b>
            <span>في <Link href="/brand">هوية نشاطي</Link>: الاسم والمجال والجمهور واللون. الأدوات بعد كده بتكتب وتصمم على أساسه من غير ما تعيد الكلام.</span>
          </li>
          <li>
            <b>اشتغل في القسم اللي يخصك.</b>
            <span>اختار من «أنت بتعمل إيه؟» فوق. الباحثين المتخصصين بيدوّروا في مصادر وبيحسبوا الأرقام بالكود، مش بالتخمين.</span>
          </li>
          <li>
            <b>اجمع أدواتك الخارجية في مكان واحد.</b>
            <span>من <Link href="/my-tools">أدواتي</Link>، اختار الأدوات اللي بتستخدمها وافتحها كلها مع بعض.</span>
          </li>
        </ol>
      </section>

      <section aria-labelledby="all">
        <h2 id="all" className={s.h2}>كل الأقسام</h2>
        {groups.map((g) => (
          <div key={g.title} className={s.group}>
            <h3>{g.title}</h3>
            <ul>
              {g.items.map((i) => (
                <li key={i.to + i.name}>
                  <Link href={i.to}><b>{i.name}</b><span>{i.d}</span></Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="ext" className={s.note}>
        <h2 id="ext" className={s.h2}>تسجّل في أدواتك الخارجية إزاي؟</h2>
        <p>
          في <Link href="/my-tools">أدواتي</Link> فيه {APPS.length} أداة عالمية (شات وتصميم وبحث وكتابة وغيرها). بتختار اللي تهمك،
          وتسجّل في كل واحدة بحسابك أنت مرة واحدة من موقعها الأصلي، وبعدها تفتحهم كلهم بضغطة واحدة.
        </p>
        <ul>
          <li>الموقع ما بيخزّنش أي كلمة سر. الدخول بيفضل محفوظ في متصفحك.</li>
          <li>كل أداة ليها شروطها وأسعارها، وبعضها مدفوع. اقرا شروط الأداة قبل التسجيل.</li>
          <li>اختياراتك محفوظة على جهازك. لو غيّرت الجهاز، اختارهم تاني.</li>
        </ul>
      </section>

      <section aria-labelledby="pr" className={s.note}>
        <h2 id="pr" className={s.h2}>ليه البرومبتات مهمة؟</h2>
        <p>
          جودة النتيجة من أي أداة ذكاء اصطناعي بتتحدد بالأمر اللي بتديه لها. «اعمل لي إعلان» بيطلع كلام عادي،
          لكن أمر فيه الجمهور والأسلوب والشكل المطلوب بيطلع شغل تستخدمه فعلاً. في{" "}
          <Link href="/prompts">مكتبة البرومبتات</Link> فيه {PROMPTS.length} أمر جاهز، وفي{" "}
          <Link href="/prompts/builder">مولّد البرومبتات</Link> تكتب مجالك ويطلعلك أوامر منظمة جاهزة.
        </p>
      </section>

      <section aria-labelledby="gl" className={s.note}>
        <h2 id="gl" className={s.h2}>المواقع والأدوات العالمية</h2>
        <p>
          معظم أدوات الذكاء الاصطناعي المفيدة بره الموقع وبالإنجليزي. في <Link href="/global-tools">أدوات عالمية</Link> دليل
          عربي لحوالي {DIR_TOTAL} أداة، كل واحدة بشرح لإيه بتعمل وسعرها، وفي{" "}
          <Link href="/global-tools/alternatives">صفحة البدائل</Link> بدائل لأشهر الأدوات المدفوعة. لو محتاج أداة
          بعينها ومش لاقيها، جرّب <Link href="/tasks">أداة لأي مهمة</Link>.
        </p>
      </section>
    </div>
  );
}
