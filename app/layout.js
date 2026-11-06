import "./globals.css";
import Script from "next/script";
import ThemeShift from "@/components/ThemeShift";
import Chrome from "@/components/Chrome";
import BottomNav from "@/components/BottomNav";
import Intro from "@/components/Intro";
import { tools, categories } from "@/lib/tools";
import { SITE_URL, BRAND } from "@/lib/site";

const description = `منصة عربية فيها ${tools.length} أداة ذكاء اصطناعي في ${categories.length} مجال، وشات بأقوى موديلات العالم: كتابة، تسويق، تعليم، ترجمة، برمجة، وأكتر.`;

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${BRAND} | ${tools.length} أداة ذكاء اصطناعي بالعربي`, template: `%s | ${BRAND}` },
  description,
  applicationName: BRAND,
  alternates: { canonical: "/" },
  openGraph: { siteName: BRAND, locale: "ar_EG", type: "website", title: BRAND, description, url: "/" },
  twitter: { card: "summary", title: BRAND, description },
  formatDetection: { telephone: false },
  // تثبيت كتطبيق على الآيفون (ملء الشاشة من غير شريط Safari)
  appleWebApp: { capable: true, title: BRAND, statusBarStyle: "black-translucent" },
  icons: { apple: "/icons/icon-192.png" },
};

export const viewport = {
  themeColor: "#050510",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

// Microsoft Clarity: بيقيس الزوار بيدوسوا فين وبيتوهوا فين، عشان نصلّح الديزين بأرقام.
// بيشتغل بس لما NEXT_PUBLIC_CLARITY_ID يتحط في Vercel. المحادثات وكل اللي بيكتبه الزائر متخفي (data-clarity-mask).
const CLARITY_ID = /^[a-z0-9]{6,20}$/i.test(process.env.NEXT_PUBLIC_CLARITY_ID || "") ? process.env.NEXT_PUBLIC_CLARITY_ID : "";

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* وضع التخفيف: بيقفل المؤثرات الزخرفية على الأجهزة الضعيفة أو لما المستخدم يطلب تقليل الحركة أو توفير البيانات */}
        <script dangerouslySetInnerHTML={{ __html: "try{var n=navigator,c=n.connection||{};if(localStorage.getItem('rs:motion')==='off'||matchMedia('(prefers-reduced-motion: reduce)').matches||c.saveData||/(^|-)2g$/.test(c.effectiveType||'')||(n.deviceMemory&&n.deviceMemory<=2)||(n.hardwareConcurrency&&n.hardwareConcurrency<=2))document.documentElement.classList.add('lite')}catch(e){}" }} />
        {/* الشاشة الافتتاحية بتظهر أول مرة في الجلسة بس */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('rs:intro'))document.documentElement.classList.add('no-intro');if(localStorage.getItem('rs:side-mini')==='true')document.documentElement.classList.add('side-mini')}catch(e){}" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* الخط: IBM Plex Sans Arabic. لو غيرته، غيّر --ui في globals.css كمان */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Alexandria:wght@600;700;800;900&family=Archivo:wght@700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Intro />
        <ThemeShift />
        <Chrome />
        <main className="wrap">{children}</main>
        <footer className="footer">
          النتايج من نماذج ذكاء اصطناعي وممكن يكون فيها أخطاء، راجعها قبل ما تستخدمها. اللي بتكتبه بيتبعت لمزوّد خارجي للمعالجة.
          {CLARITY_ID && " وبنقيس استخدام الصفحات (الضغطات والتمرير) بأداة Microsoft Clarity عشان نحسّن الموقع، والمحادثات وأي حاجة بتكتبها متخفية فيها."}
        </footer>
        <BottomNav />
        {CLARITY_ID && (
          <Script id="clarity" strategy="afterInteractive">
            {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`}
          </Script>
        )}
      </body>
    </html>
  );
}
