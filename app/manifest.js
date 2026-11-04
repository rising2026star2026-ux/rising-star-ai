// تثبيت الموقع كتطبيق على الموبايل (من قايمة المتصفح ← «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق»).
// display: standalone معناه إن الموقع بيفتح ملء الشاشة من غير شريط عنوان المتصفح اللي فوق.
export default function manifest() {
  return {
    name: "Rising StarAi",
    short_name: "Rising StarAi",
    description: "منصة عربية لأدوات الذكاء الاصطناعي وشات بأقوى الموديلات",
    lang: "ar",
    dir: "rtl",
    start_url: "/chat",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#050510",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
