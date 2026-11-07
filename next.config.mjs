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

/** @type {import('next').NextConfig} */
const nextConfig = {
  // msedge-tts بيعتمد على ws، وتجميعها جوه Next بيبوّظ (b.mask is not a function). بنسيبهم برّه الـbundle
  serverExternalPackages: ["msedge-tts", "ws"],
  // ما نعلنش إن الموقع Next.js، وما ننشرش الكود الأصلي للمتصفح (source maps)
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
};
export default nextConfig;
