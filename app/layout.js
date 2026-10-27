import "./globals.css";
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
};

export const viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        {/* الشاشة الافتتاحية بتظهر أول مرة في الجلسة بس */}
        <script dangerouslySetInnerHTML={{ __html: "try{if(sessionStorage.getItem('rs:intro'))document.documentElement.classList.add('no-intro');if(localStorage.getItem('rs:side-mini')==='true')document.documentElement.classList.add('side-mini')}catch(e){}" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* الخط: IBM Plex Sans Arabic. لو غيرته، غيّر --ui في globals.css كمان */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&display=swap"
        />
      </head>
      <body>
        <Intro />
        <ThemeShift />
        <Chrome />
        <main className="wrap">{children}</main>
        <footer className="footer">
          النتايج من نماذج ذكاء اصطناعي وممكن يكون فيها أخطاء، راجعها قبل ما تستخدمها. اللي بتكتبه بيتبعت لمزوّد خارجي للمعالجة.
        </footer>
        <BottomNav />
      </body>
    </html>
  );
}
