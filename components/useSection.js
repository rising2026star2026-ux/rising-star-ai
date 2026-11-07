"use client";
// القسم الحالي: من المسار، مع الاحتفاظ بالقسم اللي كنا فيه لو الصفحة الجديدة تابعة له، وبعده ?from=
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { resolveSection, SECTION_BY_ID } from "@/lib/sections";

export default function useSection() {
  const pathname = usePathname() || "/";
  const prev = useRef(null);
  const [from, setFrom] = useState(null);
  useEffect(() => {
    const f = new URLSearchParams(window.location.search).get("from");
    setFrom(SECTION_BY_ID[f] ? f : null);
  }, [pathname]);
  const hit = resolveSection(pathname, [prev.current, from]);
  useEffect(() => { prev.current = hit?.id || null; });
  return { pathname, section: hit ? SECTION_BY_ID[hit.id] : null, current: hit?.href || null };
}
