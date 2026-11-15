import { Suspense } from "react";
import { notFound } from "next/navigation";
import { SECTIONS, SECTION_BY_ID, ITEMS } from "@/lib/sections";
import { SECTION_INFO } from "@/lib/sectioninfo";
import SectionChat from "@/components/SectionChat";
import SectionInfo from "@/components/SectionInfo";
import { sectionRows } from "@/lib/sectioncards";

// الصورة من CDN بتاع Unsplash بمقاسات مختلفة (المتصفح بيختار المناسب للشاشة)
const photoSet = (p) => {
  if (!p) return null;
  const u = (w) => `${p.base}?auto=format&fit=max&q=70&w=${w}`;
  return { src: u(1280), srcSet: [640, 960, 1280, 1920].map((w) => `${u(w)} ${w}w`).join(", ") };
};

export function generateStaticParams() {
  return SECTIONS.filter((x) => x.id !== "chat").map((x) => ({ id: x.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const x = SECTION_BY_ID[id];
  if (!x) return {};
  const title = `${x.name}: ${x.tagline}`;
  return { title, description: `${x.name} في Rising StarAi: شات متخصص وأدوات ${x.items.map((h) => ITEMS[h].label).join("، ")}.`, alternates: { canonical: `/s/${id}` }, openGraph: { title, url: `/s/${id}`, siteName: "Rising StarAi", locale: "ar_EG", type: "website" } };
}

// أول حاجة بتتفتح في القسم هي الشات. أدوات القسم ومحادثاته في القايمة الجانبية.
export default async function SectionPage({ params }) {
  const { id } = await params;
  const x = SECTION_BY_ID[id];
  if (!x) notFound();
  const info = SECTION_INFO[id];
  return (
    <div style={{ "--sec": x.color }}>
      <Suspense fallback={null}>
        <SectionChat section={id} name={x.name} tagline={x.tagline} headline={info.headline} sub={info.sub} placeholder={info.placeholder} starters={info.starters} sources={[]} photo={photoSet(info.photo)} rows={sectionRows(id)}>
          <SectionInfo name={x.name} can={info.can} soon={info.soon} credit={info.photo ? { name: info.photo.credit, href: info.photo.page } : null} />
        </SectionChat>
      </Suspense>
    </div>
  );
}
