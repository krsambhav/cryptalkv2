import type { HTMLAttributes } from "react";

interface Props extends HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export function Wordmark({ size = "md", className = "", ...rest }: Props) {
  const sizeClass =
    size === "sm" ? "text-xl" : size === "lg" ? "text-3xl" : "text-2xl";
  return (
    <div className={`inline-flex items-baseline gap-1 ${className}`} {...rest}>
      <Glyph />
      <span className={`font-display ${sizeClass} tracking-tight`}>
        Cryp<em className="not-italic text-accent">Talk</em>
      </span>
    </div>
  );
}

function Glyph() {
  // A wax-seal mark — a circle with a chevron, hand-drawn at this size.
  return (
    <span aria-hidden className="inline-block translate-y-[2px]">
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle
          cx="11"
          cy="11"
          r="9.25"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity="0.55"
        />
        <path
          d="M5.5 13.5 L11 7 L16.5 13.5"
          stroke="currentColor"
          strokeWidth="1.25"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="11" cy="11" r="1.25" fill="currentColor" opacity="0.6" />
      </svg>
    </span>
  );
}
