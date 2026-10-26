// الشاشة الافتتاحية: النجمة بتلف وتنور، والاسم بيظهر حرف حرف (أول مرة في الجلسة بس)
import IntroDone from "./IntroDone";

const NAME = "Rising StarAi";

export default function Intro() {
  return (
    <>
      <div className="intro" id="rs-intro" aria-hidden="true">
        <div className="intro-core">
          <span className="intro-ring" />
          <span className="intro-ring r2" />
          <svg className="intro-star" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="intro-g" x1="0.2" y1="0" x2="0.8" y2="1">
                <stop offset="0" stopColor="#FFE680" />
                <stop offset="0.45" stopColor="#FFC61A" />
                <stop offset="1" stopColor="#F59E0B" />
              </linearGradient>
            </defs>
            <path d="M12 1.2c.75 5.6 3.1 8.6 10.8 10.8C15.1 14.2 12.75 17.2 12 22.8c-.75-5.6-3.1-8.6-10.8-10.8C8.9 9.8 11.25 6.8 12 1.2z" fill="url(#intro-g)" />
          </svg>
        </div>
        <div className="intro-name" dir="ltr">
          {NAME.split("").map((c, i) => (
            <span key={i} style={{ "--d": i }}>{c === " " ? " " : c}</span>
          ))}
        </div>
        <div className="intro-tag">كل الذكاء الاصطناعي في مكان واحد، وبالعربي</div>
      </div>
      <IntroDone />
    </>
  );
}
