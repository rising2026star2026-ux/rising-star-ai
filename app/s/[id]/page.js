import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { SECTIONS, SECTION_BY_ID, ITEMS } from "@/lib/sections";
import { SECTION_INFO } from "@/lib/sectioninfo";
import SectionChat from "@/components/SectionChat";
import SectionInfo from "@/components/SectionInfo";

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
  if (id === "chat") redirect("/chat"); // الشات العام له صفحته الأصلية
  const info = SECTION_INFO[id];
  return (
    <div style={{ "--sec": x.color }}>
      <Suspense fallback={null}>
        <SectionChat section={id} name={x.name} tagline={x.tagline} starters={info.starters}>
          <SectionInfo name={x.name} can={info.can} soon={info.soon} />
        </SectionChat>
      </Suspense>
    </div>
  );
}
