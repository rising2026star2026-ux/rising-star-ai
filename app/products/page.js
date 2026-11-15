import Hub from "@/components/Hub";

export const metadata = {
  title: "إدارة المنتجات والتسعير",
  description: "احسب ربح منتجاتك الصافي، واكتب وصفها وصفحتها، وجهّز صورها وكتالوج بزرار طلب واتساب.",
  alternates: { canonical: "/products" },
};

export default function Page() {
  return <Hub id="products" />;
}
