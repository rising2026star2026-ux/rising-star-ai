import Link from "next/link";
import { notFound } from "next/navigation";
import { tools, getTool, getCategory, isListed } from "@/lib/tools";
import { getContent } from "@/lib/content";
import ToolPitch from "@/components/ToolPitch";
import { SITE_URL, BRAND } from "@/lib/site";
import ToolRunner from "@/components/ToolRunner";
import LocalTool from "@/components/studio/LocalTool";
import AdLibrary from "@/components/studio/AdLibrary";
import VisionRunner from "@/components/VisionRunner";
import ToolIcon from "@/components/ToolIcon";
import ToolGuide, { howToSteps, faqFor } from "@/components/ToolGuide";

export function generateStaticParams() {
  return tools.map((t) => ({ id: t.id }));
}

// وصف جوجل: أول جملة أو جملتين من الشرح، في حدود 160 حرف
function seoDescription(tool, content) {
  const text = content?.about || tool.desc;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  const end = Math.max(cut.lastIndexOf("."), cut.lastIndexOf("،"), cut.lastIndexOf(" "));
  return `${cut.slice(0, end > 100 ? end : 157).trim()}…`;
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const t = isListed(id) ? getTool(id) : null;
  if (!t) return {};
  const description = seoDescription(t, getContent(id));
  const title = t.local ? `${t.name} أونلاين` : `${t.name} بالذكاء الاصطناعي`;
  return {
    title,
    description,
    alternates: { canonical: `/tool/${id}` },
    openGraph: { title: `${title} | ${BRAND}`, description, url: `/tool/${id}`, siteName: BRAND, locale: "ar_EG", type: "website" },
    twitter: { card: "summary", title: `${title} | ${BRAND}`, description },
  };
}

function jsonLd(tool, cat, content) {
  const url = `${SITE_URL}/tool/${tool.id}`;
  const graph = [
    {
      "@type": "WebApplication",
      name: tool.name,
      url,
      description: content?.about || tool.desc,
      applicationCategory: tool.local ? "DesignApplication" : "UtilitiesApplication",
      offers: { "@type": "Offer", price: "0", priceCurrency: "EGP" },
      operatingSystem: "Web",
      inLanguage: "ar",
      publisher: { "@type": "Organization", name: BRAND, url: SITE_URL },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "الرئيسية", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "الأدوات", item: `${SITE_URL}/tools` },
        { "@type": "ListItem", position: 3, name: cat.name, item: `${SITE_URL}/tools?cat=${cat.id}` },
        { "@type": "ListItem", position: 4, name: tool.name, item: url },
      ],
    },
  ];
  if (content) {
    graph.push({
      "@type": "HowTo",
      name: `إزاي تستخدم ${tool.name}`,
      step: howToSteps(tool, content).map((text, i) => ({ "@type": "HowToStep", position: i + 1, text })),
    });
    graph.push({
      "@type": "FAQPage",
      mainEntity: faqFor(content, tool).map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    });
  }
  // < بيتحول عشان أي نص ما يقفلش وسم السكريبت
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
}

export default async function ToolPage({ params }) {
  const { id } = await params;
  const tool = isListed(id) ? getTool(id) : null;
  if (!tool) notFound();
  const cat = getCategory(tool.cat);
  const content = getContent(tool.id);
  const related = tools.filter((t) => t.cat === tool.cat && t.id !== tool.id).slice(0, 8);

  return (
    <div className="tool-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(tool, cat, content) }} />

      <nav className="crumbs" aria-label="المسار">
        <Link href="/">الرئيسية</Link>
        <span aria-hidden="true">/</span>
        <Link href="/tools">الأدوات</Link>
        <span aria-hidden="true">/</span>
        <Link href={`/tools?cat=${cat.id}`}>{cat.name}</Link>
      </nav>

      <div className="tool-head">
        <ToolIcon tool={tool} size="lg" />
        <div>
          <h1>{tool.name}</h1>
          <p>{tool.desc}</p>
        </div>
      </div>

      <ToolPitch id={tool.id} example={content?.example} />

      {tool.local ? (
        <LocalTool kind={tool.local} />
      ) : (
        <>
          {tool.extra === "adlibrary" && <AdLibrary />}
          {tool.extra === "vision" ? <VisionRunner toolName={tool.name} /> : <ToolRunner
            toolId={tool.id}
            toolName={tool.name}
            placeholder={tool.placeholder}
            example={content?.example}
            option={tool.option}
            label={tool.extra === "adlibrary" ? "٢. حلّل الإعلان واكتب أقوى منه" : undefined}
          />}
        </>
      )}

      <ToolGuide tool={tool} content={content} />

      {related.length > 0 && (
        <section className="related">
          <h2>أدوات من نفس التصنيف</h2>
          <div className="shelf-row">
            {related.map((t) => (
              <Link key={t.id} href={`/tool/${t.id}`} className="shelf-item">
                <ToolIcon tool={t} size="sm" />
                <span>{t.name}</span>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
