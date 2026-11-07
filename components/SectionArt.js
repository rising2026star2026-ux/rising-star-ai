// رسومات تجريدية أصلية لكل قسم (SVG بسيط، بلون القسم عبر currentColor)
const P = { viewBox: "0 0 200 140", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };

const ART = {
  realestate: (
    <svg {...P}>
      <rect x="18" y="58" width="42" height="72" rx="4" /><rect x="72" y="22" width="52" height="108" rx="4" /><rect x="136" y="70" width="46" height="60" rx="4" />
      <path d="M84 40h8M104 40h8M84 58h8M104 58h8M84 76h8M104 76h8M30 74h8M30 92h8M148 88h8M148 106h8M96 130v-24h8v24" />
      <path d="M8 130h184" />
    </svg>
  ),
  seller: (
    <svg {...P}>
      <path d="M22 50l10-26h136l10 26M22 50c0 9 8 14 15 14s15-5 15-14c0 9 8 14 16 14s16-5 16-14c0 9 8 14 16 14s16-5 16-14c0 9 7 14 15 14s15-5 15-14" />
      <path d="M32 64v62h136V64M84 126V92h32v34" /><path d="M46 80h24v22H46zM130 80h24v22h-24z" />
    </svg>
  ),
  academic: (
    <svg {...P}>
      <path d="M100 18L20 54l80 36 80-36z" /><path d="M54 70v32c0 10 20 22 46 22s46-12 46-22V70" /><path d="M180 54v44" /><circle cx="180" cy="104" r="5" />
    </svg>
  ),
  aiwork: (
    <svg {...P}>
      <circle cx="100" cy="70" r="16" /><circle cx="36" cy="34" r="9" /><circle cx="168" cy="40" r="9" /><circle cx="44" cy="112" r="9" /><circle cx="160" cy="112" r="9" />
      <path d="M45 39l41 22M159 44l-43 20M52 108l36-26M152 108l-36-26" />
      <path d="M100 8v10M100 122v10M70 70H58M142 70h-12" />
    </svg>
  ),
  chat: (
    <svg {...P}>
      <path d="M24 28h88a10 10 0 0110 10v38a10 10 0 01-10 10H62l-20 18V86H24a10 10 0 01-10-10V38a10 10 0 0110-10z" />
      <path d="M84 100v6a10 10 0 0010 10h44l20 16v-16h8a10 10 0 0010-10V70a10 10 0 00-10-10h-14" />
      <path d="M34 48h60M34 62h38" />
    </svg>
  ),
};

export default function SectionArt({ id }) {
  return ART[id] || null;
}
