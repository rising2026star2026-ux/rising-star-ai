// ترويسات الأمان لكل صفحات الموقع:
// - HSTS: المتصفح يفتح الموقع بـ HTTPS بس.
// - frame-ancestors / X-Frame-Options: محدش يقدر يحط الموقع جوه iframe في موقع تاني (سرقة المحتوى أو خداع الضغطات).
// - nosniff وReferrer-Policy وPermissions-Policy: إعدادات حماية قياسية.
// سياسة CSP هنا بسيطة عن قصد (من غير تقييد للسكربتات) عشان ما تكسرش الأدوات اللي بتفتح مواقع تانية جوه الموقع.
const SECURITY_HEADERS = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // الكاميرا والمايك مش مقفولين هنا عشان الأدوات اللي بتفتح جوه الموقع (LibraryFrame) بتحتاجهم، والمتصفح بيسأل الزائر قبل أي استخدام
  { key: "Permissions-Policy", value: "geolocation=(), payment=(), usb=(), serial=(), bluetooth=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; upgrade-insecure-requests" },
];

// Rising Business (2026-11-15): الأقسام اللي اتشالت. روابطها القديمة بتروح للرئيسية بدل صفحة خطأ.
const REMOVED = [
  "realestate", "research", "projects", "learn", "flows", "flow", "tasks", "task", "agents", "library",
  "global-tools", "ai", "creators", "news", "subscriptions", "scam-check", "my-tools",
  "chat", "models", "program", "compare", "history", "map",
];
const REDIRECTS = REMOVED.flatMap((p) => [
  { source: `/${p}`, destination: "/", permanent: true },
  { source: `/${p}/:path*`, destination: "/", permanent: true },
]);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // msedge-tts بيعتمد على ws، وتجميعها جوه Next بيبوّظ (b.mask is not a function). بنسيبهم برّه الـbundle
  serverExternalPackages: ["msedge-tts", "ws"],
  // ما نعلنش إن الموقع Next.js، وما ننشرش الكود الأصلي للمتصفح (source maps)
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async redirects() {
    return [...REDIRECTS, { source: "/s/:id(realestate|academic|aiwork|chat)", destination: "/", permanent: true }];
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};
export default nextConfig;
