"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface Props {
  recipient: string;
  unlocked: boolean;
  messageCount: number;
  showRaw: boolean;
  onToggleRaw(): void;
}

export function ChatHeader({ recipient, unlocked, messageCount, showRaw, onToggleRaw }: Props) {
  return (
    <header className="sticky top-0 z-10 backdrop-blur bg-bg/80 border-b border-border/60">
      <div className="px-4 lg:px-6 py-3.5 flex items-center gap-4">
        <Link
          href="/chats"
          className="lg:hidden -ml-1.5 p-1.5 rounded-md hover:bg-surface text-text-2"
          aria-label="back to conversations"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M11 4l-5 5 5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted">conversation</p>
          <h1 className="font-medium text-base truncate">{recipient}</h1>
        </div>

        {unlocked && <ViewToggle showRaw={showRaw} onToggle={onToggleRaw} />}

        <div className="text-right text-[11px] hidden sm:block">
          <span className={`font-mono ${unlocked ? "text-success" : "text-muted"}`}>
            {unlocked ? "unlocked" : "locked"}
          </span>
          <div className="text-[10px] text-muted">
            {messageCount} message{messageCount === 1 ? "" : "s"}
          </div>
        </div>
      </div>
    </header>
  );
}

/**
 * Two-state pill that flips every bubble between the decrypted text/audio
 * and the actual stego PNG that lives on the wire. Animated via the
 * shared `layoutId` indicator that slides between the two segments.
 */
function ViewToggle({ showRaw, onToggle }: { showRaw: boolean; onToggle(): void }) {
  return (
    <div
      role="group"
      aria-label="View mode"
      className="relative inline-flex items-center rounded-full border border-border/60 bg-bg-2/40 p-0.5 text-[11px] font-mono"
    >
      <button
        type="button"
        onClick={() => showRaw && onToggle()}
        aria-pressed={!showRaw}
        className={`relative z-10 px-3 py-1 rounded-full transition-colors ${
          !showRaw ? "text-bg" : "text-text-2 hover:text-text"
        }`}
      >
        plain
      </button>
      <button
        type="button"
        onClick={() => !showRaw && onToggle()}
        aria-pressed={showRaw}
        className={`relative z-10 px-3 py-1 rounded-full transition-colors ${
          showRaw ? "text-bg" : "text-text-2 hover:text-text"
        }`}
      >
        cipher
      </button>
      <motion.span
        aria-hidden
        layout
        className="absolute top-0.5 bottom-0.5 rounded-full bg-accent"
        initial={false}
        animate={{
          left: showRaw ? "calc(50% + 2px)" : "2px",
          right: showRaw ? "2px" : "calc(50% + 2px)",
        }}
        transition={{ type: "spring", stiffness: 420, damping: 36, mass: 0.7 }}
      />
    </div>
  );
}
