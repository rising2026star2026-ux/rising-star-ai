"use client";
// عرض Markdown موحّد لكل ردود الموقع. الفرق عن العرض العادي: الجداول بتتلف في غلاف بيتحكم في عرضها
// (جدول بتمرير أفقي على الشاشات الواسعة، وبطاقات متراصّة على الموبايل بدل ما الأعمدة تتزنق والكلام يتقطّع).
import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function MdTable({ children }) {
  const ref = useRef(null);
  // على الموبايل كل خانة بتاخد عنوان عمودها فوقها (data-label). بيتحدّث مع كل تحديث للرد وهو بيتكتب.
  useEffect(() => {
    const t = ref.current;
    if (!t) return;
    const heads = Array.from(t.querySelectorAll("thead th")).map((h) => h.textContent.trim());
    t.querySelectorAll("tbody tr").forEach((tr) => {
      Array.from(tr.children).forEach((td, i) => {
        if (heads[i]) td.setAttribute("data-label", heads[i]);
        else td.removeAttribute("data-label");
      });
    });
  });
  return (
    <div className="md-table">
      <table ref={ref} className="md-tbl">{children}</table>
    </div>
  );
}

const COMPONENTS = { table: MdTable };

export default function Md({ children }) {
  return <ReactMarkdown remarkPlugins={[remarkGfm]} components={COMPONENTS}>{children}</ReactMarkdown>;
}
