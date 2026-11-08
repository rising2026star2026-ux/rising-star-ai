// واجهة الشات العام قبل أول رسالة (زي تطبيقات الشات العالمية): رف الموديلات بأسماء شركاتها،
// ورف أقوى الأدوات بمجسّماتها، ورف المساعدين المتخصصين. الموديلات والمساعدين جايين من lib/bots.js
// (أسماء الموديلات بتتحدث لوحدها من OpenRouter، واللي محتاج مفتاح مش متحط عليه «قريباً»).
import { ITEMS } from "@/lib/sections";
import { tools } from "@/lib/tools";
import { cardArt } from "@/lib/cardart";
import { Shelf, ArtCard, ModelCard } from "./Shelf";

// أقوى أدوات الموقع، كل واحدة بلون مختلف عشان الرف يبان حي
const ELITE = [
  ["/maker", "#ff5fa8", "#7a2bd1"],
  ["voice-studio", "#ff8a3d", "#c2410c"],
  ["podcast", "#2cc9ec", "#0b628a"],
  ["ai-video", "#9d5cff", "#3c12b8"],
  ["remove-bg", "#ff6a6a", "#b0193f"],
  ["image-enhance", "#5a95ff", "#1d3fa6"],
  ["logo-maker", "#ffbf3a", "#b86500"],
  ["/agents", "#22b8a4", "#0b5a52"],
];
const TONES = [["#5a95ff", "#1d3fa6"], ["#ff8a3d", "#c2410c"], ["#22b8a4", "#0b5a52"], ["#ff5fa8", "#7a2bd1"], ["#9d5cff", "#3c12b8"], ["#2ccf86", "#0a6440"], ["#ff6a6a", "#b0193f"], ["#ffbf3a", "#b86500"], ["#2cc9ec", "#0b628a"], ["#b07cff", "#5326ad"], ["#ff82c8", "#a5226f"], ["#14cf9f", "#06714f"]];

const eliteCard = ([key, c1, c2]) => {
  if (key.startsWith("/")) return { href: key, title: ITEMS[key].label, desc: ITEMS[key].desc, img: cardArt(key), c1, c2 };
  const t = tools.find((x) => x.id === key);
  return t ? { href: `/tool/${t.id}`, title: t.name, desc: t.desc, img: cardArt(t.id), c1, c2 } : null;
};

export default function ChatShowcase({ models = [], assistants = [] }) {
  // بترتيب lib/bots.js: الموديلات العالمية الأول (GPT وClaude وGemini...) حتى لو لسه «قريباً»، عشان الزائر يعرف هي موجودة
  const shown = models.slice(0, 14);
  const elite = ELITE.map(eliteCard).filter(Boolean);
  return (
    <>
      {shown.length > 0 && (
        <Shelf title="نماذج الذكاء الاصطناعي" more="/models" count={models.length}>
          {shown.map((b) => <ModelCard key={b.key} bot={b} />)}
        </Shelf>
      )}
      <Shelf title="أدوات النخبة" more="/tools" count={tools.length}>
        {elite.map((c) => <ArtCard key={c.href} {...c} />)}
      </Shelf>
      {assistants.length > 0 && (
        <Shelf title="مساعدين" more="/models" count={assistants.length}>
          {assistants.map((b, i) => (
            <ArtCard key={b.key} href={`/chat?bot=${b.key}`} title={b.name} desc={b.desc} img={cardArt(`bot:${b.key}`)} c1={TONES[i % TONES.length][0]} c2={TONES[i % TONES.length][1]} />
          ))}
        </Shelf>
      )}
    </>
  );
}
