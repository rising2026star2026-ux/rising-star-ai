// أيقونات خطية بسيطة (SVG) لأدوات أمازون. بدل الإيموجي عشان الشكل يبقى ثابت على كل الأجهزة.
const P = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" };
const wrap = (path, size = 30) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" {...P}>{path}</svg>
);

export const ICONS = {
  shield: wrap(<><path d="M12 3l7 3v5.5c0 4.2-2.8 7.6-7 9.5-4.2-1.9-7-5.3-7-9.5V6l7-3z" /><path d="M9 12l2.2 2.2L15.5 10" /></>),
  pen: wrap(<><path d="M4 20l1-4L16.5 4.5a2 2 0 013 0l0 0a2 2 0 010 3L8 19l-4 1z" /><path d="M14 7l3 3" /></>),
  calc: wrap(<><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7.5h7M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" /></>),
  search: wrap(<><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /><path d="M8.5 11h5" /></>),
  cart: wrap(<><path d="M3 4h2.4l2 10.2a1.5 1.5 0 001.5 1.2h8a1.5 1.5 0 001.5-1.1L20 8H6.2" /><circle cx="9.5" cy="19.2" r="1.3" /><circle cx="17" cy="19.2" r="1.3" /></>),
  stop: wrap(<><circle cx="12" cy="12" r="9" /><path d="M8 8l8 8" /></>, 20),
  warn: wrap(<><path d="M12 4l9 16H3L12 4z" /><path d="M12 10v4M12 17.2h.01" /></>, 20),
  ok: wrap(<><circle cx="12" cy="12" r="9" /><path d="M8 12.3l2.7 2.7L16 9.5" /></>, 20),
  info: wrap(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8h.01" /></>, 18),
};
