"use client";
// جزء «Adspy عربي»: يفتح مكتبات الإعلانات الرسمية بكلمة البحث والدولة،
// وبعدين المستخدم يلصق الإعلان اللي عجبه في الخانة اللي تحت عشان يتحلل.
import { useState } from "react";
import s from "./studio.module.css";

const COUNTRIES = [
  ["EG", "مصر"], ["SA", "السعودية"], ["AE", "الإمارات"], ["KW", "الكويت"], ["QA", "قطر"],
  ["JO", "الأردن"], ["MA", "المغرب"], ["ALL", "كل الدول"],
];

export function libraryLinks(q, country) {
  const k = encodeURIComponent(q.trim());
  const c = country === "ALL" ? "ALL" : country;
  return [
    {
      name: "مكتبة إعلانات ميتا",
      sub: "فيسبوك وإنستجرام وماسنجر",
      icon: "📘",
      url: `https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=${c}&media_type=all&search_type=keyword_unordered${k ? `&q=${k}` : ""}`,
    },
    {
      name: "أفضل إعلانات تيك توك",
      sub: "TikTok Creative Center",
      icon: "🎵",
      url: `https://ads.tiktok.com/business/creativecenter/inspiration/topads/pc/en?period=30${c !== "ALL" ? `&region=${c}` : ""}`,
    },
    {
      name: "شفافية إعلانات جوجل",
      sub: "جوجل ويوتيوب، ابحث باسم المعلن",
      icon: "🔎",
      url: `https://adstransparency.google.com/${c !== "ALL" ? `?region=${c}` : ""}`,
    },
    {
      name: "مكتبة إعلانات لينكدإن",
      sub: "إعلانات الشركات وB2B",
      icon: "💼",
      url: `https://www.linkedin.com/ad-library/search${k ? `?keyword=${k}` : ""}`,
    },
  ];
}

export default function AdLibrary() {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("EG");
  const links = libraryLinks(q, country);

  return (
    <section className={s.spy} aria-label="ابحث عن إعلانات منافسينك">
      <div className={s.spyHead}>
        <b>١. شوف إعلانات منافسينك الحقيقية</b>
        <small>اكتب اسم المنافس أو نوع المنتج، واختار الدولة، وافتح المكتبة. دي مكتبات رسمية من المنصات نفسها وفيها كل الإعلانات الشغالة دلوقتي.</small>
      </div>
      <div className={s.spyForm}>
        <input
          className={s.input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="مثال: عطور، كورس إنجليزي، اسم براند منافس..."
          aria-label="كلمة البحث"
          maxLength={80}
          dir="auto"
        />
        <select className={s.select} value={country} onChange={(e) => setCountry(e.target.value)} aria-label="الدولة">
          {COUNTRIES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>
      <div className={s.spyLinks}>
        {links.map((l) => (
          <a key={l.name} className={s.spyLink} href={l.url} target="_blank" rel="noopener noreferrer">
            <span className={s.spyDot} aria-hidden="true">{l.icon}</span>
            <span className={s.spyText}><b style={{ fontWeight: 500 }}>{l.name}</b><small>{l.sub}</small></span>
          </a>
        ))}
      </div>
      <ol className={s.steps3}>
        <li>افتح أي إعلان عاجبك أو شغال من مدة طويلة (ده غالباً معناه إنه ناجح).</li>
        <li>انسخ نص الإعلان، أو اكتب وصفه لو كان فيديو.</li>
        <li>الصقه تحت في <b style={{ fontWeight: 500 }}>٢. حلّل الإعلان</b> واضغط «نفّذ»، هتاخد تحليله و3 إعلانات أقوى منه.</li>
      </ol>
    </section>
  );
}
