import Hub from "@/components/Hub";

export const metadata = {
  title: "استوديو الإنتاج التجاري",
  description: "صور استوديو لمنتجاتك من الموبايل، إزالة خلفية وتحسين، بوسترات، وشعار وهوية لنشاطك.",
  alternates: { canonical: "/studio" },
};

export default function Page() {
  return <Hub id="studio" />;
}
