"use client";
// عرض «باكدج الإعلان»: بوست لكل منصة في تبويب، ونسخ بضغطة، وإرسال واتساب، واختبار على 100 زبون
import { useState } from "react";
import { useRouter } from "next/navigation";
import { copyText } from "@/lib/imagefile";
import { toast } from "@/lib/store";
import { HANDOFF_KEY } from "@/lib/testad";
import s from "./seller.module.css";
import p from "./photoad.module.css";

const TABS = [
  ["facebook", "فيسبوك", "f"],
  ["instagram", "إنستجرام", "◎"],
  ["whatsapp", "واتساب", "✆"],
  ["tiktok", "ريلز وتيك توك", "♪"],
  ["description", "وصف المتجر", "▤"],
  ["extras", "عناوين وهاشتاجات", "#"],
];

export function packText(pack, k) {
  if (k === "extras") return [...(pack.headlines || []), "", (pack.hashtags || []).join(" ")].join("\n").trim();
  if (k === "instagram") return [pack.instagram, "", (pack.hashtags || []).join(" ")].join("\n").trim();
  return pack[k] || "";
}

export default function AdPack({ pack, testImage = "" }) {
  const [tab, setTab] = useState("facebook");
  const router = useRouter();
  const body = packText(pack, tab);

  async function copy(text) { if (await copyText(text)) toast("اتنسخ"); }
  function testIt() {
    try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ text: pack.facebook, image: testImage })); } catch {
      try { sessionStorage.setItem(HANDOFF_KEY, JSON.stringify({ text: pack.facebook })); } catch {}
    }
    router.push("/test-ad");
  }

  return (
    <div className={p.pack}>
      {pack.understood && <p className={p.understood}><b>فهمنا كده:</b> {pack.understood}</p>}
      {pack.missing?.length > 0 && (
        <div className={p.missing}>
          <b>✍️ ناقص معلومات هتفرق في البيع:</b>
          <div className={s.chips}>{pack.missing.map((m) => <span key={m} className={p.missTag}>{m}</span>)}</div>
          <small>كتبنالك مكانها بين قوسين [ ] في الكلام. غيّرها قبل ما تنشر.</small>
        </div>
      )}
      <div className={p.tabs} role="tablist" aria-label="المنصة">
        {TABS.map(([k, label, ic]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`${p.tab} ${tab === k ? p.tabOn : ""}`} onClick={() => setTab(k)}>
            <span aria-hidden="true">{ic}</span>{label}
          </button>
        ))}
      </div>
      <div className={s.copyCard} role="tabpanel">
        <div className={s.copyHead}>
          <b>{TABS.find((x) => x[0] === tab)[1]}</b>
          <button type="button" className={s.miniBtn} onClick={() => copy(body)}>نسخ</button>
          <a className={s.miniBtn} href={`https://wa.me/?text=${encodeURIComponent(body.slice(0, 3500))}`} target="_blank" rel="noopener noreferrer">واتساب</a>
        </div>
        <div className={s.copyBody} dir="auto">{body || "—"}</div>
      </div>
      <div className={p.packActions}>
        <button type="button" className={`${s.cta} ${s.blue}`} onClick={testIt}>👥 اختبر البوست ده على 100 زبون</button>
        <button type="button" className={s.miniBtn} onClick={() => copy(TABS.map(([k, l]) => `—— ${l} ——\n${packText(pack, k)}`).join("\n\n"))}>انسخ كل حاجة مرة واحدة</button>
      </div>
    </div>
  );
}
