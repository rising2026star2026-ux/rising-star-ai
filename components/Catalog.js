"use client";
// كتالوج كل الأدوات: بحث بالاسم + تصنيفات. التصنيف بيتحفظ في الرابط (?cat=writing) عشان يتشارك
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { tools, categories } from "@/lib/tools";
import { norm } from "@/lib/search";
import { useStored } from "@/lib/store";
import ToolIcon from "./ToolIcon";
import { Glyph } from "@/lib/toolglyphs";
import { BIZ_GROUPS, groupOf } from "@/lib/bizgroups";

// التصنيف في الرابط: مجموعة من الـ8 (?cat=marketing)، أو تصنيف قديم (?cat=social) بيفضل شغال للروابط القديمة
const VALID = new Set([...BIZ_GROUPS.map((g) => g.id), ...categories.map((c) => c.id)]);
const COUNTS = Object.fromEntries(BIZ_GROUPS.map((g) => [g.id, tools.filter((t) => groupOf(t.id) === g.id).length]));

function Catalog({ cat, onCat }) {
  const [filter, setFilter] = useState("");
  const [favs] = useStored("favs", []);

  const list = useMemo(() => {
    const q = norm(filter.trim());
    return tools.filter((t) => (cat === "all" || groupOf(t.id) === cat || t.cat === cat) && (!q || norm(`${t.name} ${t.desc}`).includes(q)));
  }, [filter, cat]);

  return (
    <section className="catalog">
      <div className="chips" role="tablist" aria-label="التصنيفات">
        <button role="tab" aria-selected={cat === "all"} className={`chip ${cat === "all" ? "active" : ""}`} onClick={() => onCat("all")}>
          الكل <small>{tools.length}</small>
        </button>
        {BIZ_GROUPS.filter((g) => COUNTS[g.id]).map((g) => (
          <button key={g.id} role="tab" aria-selected={cat === g.id} className={`chip ${cat === g.id ? "active" : ""}`} onClick={() => onCat(g.id)}>
            <Glyph name={g.glyph} size={16} /> {g.name} <small>{COUNTS[g.id]}</small>
          </button>
        ))}
      </div>

      <div className="section-head" style={{ marginBottom: 14 }}>
        <label className="sr" htmlFor="filter">ابحث بالاسم</label>
        <input id="filter" className="filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="ابحث بالاسم..." />
        <span className="meta">{list.length} أداة</span>
      </div>

      {list.length ? (
        <div className="grid">
          {list.map((t) => (
            <Link key={t.id} href={`/tool/${t.id}`} className="card">
              <ToolIcon tool={t} />
              <div>
                <h3>{t.name}{favs.includes(t.id) && <span className="fav-dot" aria-label="في المفضلة"> ★</span>}</h3>
                <p>{t.desc}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="empty">
          مفيش أداة بالاسم ده.{" "}
          <button className="link" onClick={() => { setFilter(""); onCat("all"); }}>اعرض كل الأدوات</button>
        </div>
      )}
    </section>
  );
}

/** النسخة اللي بتقرا التصنيف من الرابط */
export function CatalogFromUrl() {
  const params = useSearchParams();
  const router = useRouter();
  const raw = params.get("cat");
  const cat = raw && VALID.has(raw) ? raw : "all";
  return <Catalog cat={cat} onCat={(c) => router.replace(c === "all" ? "/tools" : `/tools?cat=${c}`, { scroll: false })} />;
}

/** النسخة الثابتة اللي بتظهر أول ما الصفحة تفتح (وجوجل بيشوفها كاملة) */
export function CatalogStatic() {
  return <Catalog cat="all" onCat={() => {}} />;
}
