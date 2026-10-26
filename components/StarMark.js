// نجمة Rising StarAi: نجمة خماسية بحواف مدورة وتدرّج أصفر ذهبي (هوية الموقع، مختلفة عن أشكال الشركات التانية)
import { useId } from "react";

export const STAR_PATH = "M12 2.2L14.65 9.16L22.08 9.52L16.28 14.19L18.23 21.38L12 17.3L5.77 21.38L7.72 14.19L1.92 9.52L9.35 9.16Z";

export default function StarMark({ size = 28, className = "" }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`star-mark ${className}`}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`sg${id}`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0" stopColor="#FFE680" />
          <stop offset="0.45" stopColor="#FFC61A" />
          <stop offset="1" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <path
        d={STAR_PATH}
        fill={`url(#sg${id})`}
        stroke={`url(#sg${id})`}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
