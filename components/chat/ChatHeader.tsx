"use client";

import Link from "next/link";

interface Props {
  recipient: string;
  unlocked: boolean;
  messageCount: number;
}

export function ChatHeader({ recipient, unlocked, messageCount }: Props) {
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
        <div className="text-right text-[11px]">
          <span className={`font-mono ${unlocked ? "text-success" : "text-muted"}`}>
            {unlocked ? "unlocked" : "locked"}
          </span>
          <div className="text-[10px] text-muted">{messageCount} message{messageCount === 1 ? "" : "s"}</div>
        </div>
      </div>
    </header>
  );
}
