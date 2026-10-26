// نجمة Rising StarAi: نجمة رباعية بتدرّج أصفر ذهبي
import { useId } from "react";

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
        d="M12 1.2c.75 5.6 3.1 8.6 10.8 10.8C15.1 14.2 12.75 17.2 12 22.8c-.75-5.6-3.1-8.6-10.8-10.8C8.9 9.8 11.25 6.8 12 1.2z"
        fill={`url(#sg${id})`}
      />
    </svg>
  );
}
