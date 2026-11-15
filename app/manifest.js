import { BRAND } from "@/lib/site";

// تثبيت الموقع كتطبيق على الموبايل (من قايمة المتصفح ← «إضافة إلى الشاشة الرئيسية» أو «تثبيت التطبيق»).
// display: standalone معناه إن الموقع بيفتح ملء الشاشة من غير شريط عنوان المتصفح اللي فوق.
export default function manifest() {
  return {
    name: BRAND,
    short_name: BRAND,
    description: "منصة التجارة والأعمال بالعربي: مقارنة أنشطة، دراسة جدوى، منتجات، تسويق ومبيعات",
    lang: "ar",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: "#101b30",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
