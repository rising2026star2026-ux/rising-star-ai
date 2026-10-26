// الشاشة الافتتاحية: نجوم صفراء بتطلع وتلمع، والنجمة الكبيرة بتنزل وتنور، والاسم بيظهر حرف حرف (أول مرة في الجلسة بس)
import IntroDone from "./IntroDone";
import { STAR_PATH } from "./StarMark";

const NAME = "Rising StarAi";

// نجوم صغيرة بمواقع ثابتة (من غير عشوائية عشان نفس الشكل على السيرفر والمتصفح)
const SPARKS = Array.from({ length: 26 }, (_, i) => ({
  x: (i * 37 + 11) % 100,
  s: 10 + ((i * 7) % 5) * 5,
  d: ((i * 13) % 17) / 10,
  t: 3.2 + ((i * 5) % 7) / 4,
}));

export default function Intro() {
  return (
    <>
      <div className="intro" id="rs-intro" aria-hidden="true">
        <div className="intro-sparks">
          {SPARKS.map((p, i) => (
            <svg key={i} viewBox="0 0 24 24" style={{ "--x": `${p.x}%`, "--s": `${p.s}px`, "--d": `${p.d}s`, "--t": `${p.t}s` }}>
              <path d={STAR_PATH} fill="#FFC61A" stroke="#FFC61A" strokeWidth="1.7" strokeLinejoin="round" />
            </svg>
          ))}
        </div>
        <div className="intro-core">
          <span className="intro-ring" />
          <span className="intro-ring r2" />
          <span className="intro-ring r3" />
          <svg className="intro-star" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="intro-g" x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0" stopColor="#FFE680" />
                <stop offset="0.45" stopColor="#FFC61A" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <path d={STAR_PATH} fill="url(#intro-g)" stroke="url(#intro-g)" strokeWidth="1.7" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="intro-name" dir="ltr">
          {NAME.split("").map((c, i) => (
            <span key={i} style={{ "--d": i }}>{c === " " ? "\u00A0" : c}</span>
          ))}
        </div>
        <div className="intro-tag">كل الذكاء الاصطناعي في مكان واحد، وبالعربي</div>
      </div>
      <IntroDone />
    </>
  );
}
