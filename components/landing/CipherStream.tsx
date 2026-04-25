"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hero visual: a cover image being progressively "filled" with ciphertext.
 * A scanner sweeps top-to-bottom, leaving behind a faint hex code overlay.
 *
 * Restrained motion only — 6s loop, exponential ease, prefers-reduced-motion
 * disables the sweep.
 */
export function CipherStream() {
  const lines = useStreamingHex();

  return (
    <div
      data-theme="dark"
      className="relative aspect-[4/5] rounded-2xl overflow-hidden border border-border bg-surface group animate-fade-up [animation-delay:120ms]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/covers/02-sea-cliffs.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-[1200ms] group-hover:scale-[1.02]"
      />
      {/* darkening so the hex sits readable on top */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(15,11,7,0.15) 0%, rgba(15,11,7,0.55) 60%, rgba(15,11,7,0.85) 100%)",
        }}
      />

      {/* a hairline scanner */}
      <div
        aria-hidden
        className="absolute inset-x-0 h-[35%] pointer-events-none mix-blend-overlay"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(220,178,110,0.18) 50%, transparent 100%)",
          animation: "scan 6s linear infinite",
        }}
      />

      {/* corner kickers */}
      <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-text-2/80 font-mono">
        <span>02 · sea cliffs</span>
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
          embedding
        </span>
      </div>

      {/* hex stream pinned to bottom */}
      <div className="absolute bottom-0 left-0 right-0 p-5 max-h-[60%] overflow-hidden">
        <div className="text-[11px] uppercase tracking-[0.2em] text-accent/90 mb-3 font-mono">
          ciphertext · hidden in pixels
        </div>
        <pre className="font-mono text-[10.5px] leading-relaxed text-text-2/85 whitespace-pre-wrap break-all">
          {lines.join("\n")}
        </pre>
      </div>
    </div>
  );
}

function useStreamingHex() {
  const lineCount = 8;
  const charsPerLine = 36;

  // Seed with deterministic content to avoid SSR mismatch.
  const seed = useRef<string[]>(makeSeedLines(lineCount, charsPerLine));
  const [lines, setLines] = useState<string[]>(seed.current);

  useEffect(() => {
    const id = window.setInterval(() => {
      setLines((prev) => {
        const next = prev.slice(1);
        next.push(randomHexLine(charsPerLine));
        return next;
      });
    }, 700);
    return () => window.clearInterval(id);
  }, []);

  return lines;
}

const HEX = "0123456789abcdef";

function makeSeedLines(lineCount: number, len: number): string[] {
  // Deterministic so client/server agree on first render.
  const out: string[] = [];
  let acc = 0;
  for (let i = 0; i < lineCount; i++) {
    let s = "";
    for (let j = 0; j < len; j++) {
      acc = (acc * 1103515245 + 12345) & 0xffffffff;
      const idx = (acc >>> (j % 24)) & 0xf;
      s += HEX[idx];
      if (j % 4 === 3 && j !== len - 1) s += " ";
    }
    out.push(s);
  }
  return out;
}

function randomHexLine(len: number): string {
  const buf = new Uint8Array(len / 2 + 1);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < len; i++) {
    s += HEX[Math.floor(buf[i % buf.length]! % 16)];
    if (i % 4 === 3 && i !== len - 1) s += " ";
  }
  return s;
}
