"use client";

import { useTheme, type ThemeMode } from "@/components/providers/ThemeProvider";

const MODES: { value: ThemeMode; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
];

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { mode, setMode } = useTheme();
  return (
    <div
      role="group"
      aria-label="Color theme"
      className={`inline-flex items-center gap-0.5 rounded-full border border-border/60 bg-bg-2/40 p-0.5 ${className}`}
    >
      {MODES.map((m) => (
        <ModeButton
          key={m.value}
          value={m.value}
          label={m.label}
          active={mode === m.value}
          onClick={() => setMode(m.value)}
        />
      ))}
    </div>
  );
}

function ModeButton({
  value,
  label,
  active,
  onClick,
}: {
  value: ThemeMode;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      title={label}
      onClick={onClick}
      className={`inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors ${
        active
          ? "bg-surface-2 text-text shadow-[0_0_0_1px_var(--color-border)]"
          : "text-muted hover:text-text"
      }`}
    >
      {value === "light" ? <SunIcon /> : value === "dark" ? <MoonIcon /> : <SystemIcon />}
    </button>
  );
}

function SunIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M6 1.5v1M6 9.5v1M1.5 6h1M9.5 6h1M2.8 2.8l.7.7M8.5 8.5l.7.7M2.8 9.2l.7-.7M8.5 3.5l.7-.7"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <path
        d="M9.5 7.2A4 4 0 014.8 2.5 4 4 0 109.5 7.2z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SystemIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden>
      <rect
        x="1.5"
        y="2.5"
        width="9"
        height="6.5"
        rx="1"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M4.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
