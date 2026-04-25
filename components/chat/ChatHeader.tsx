"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Dropdown, type MenuProps } from "antd";

interface Props {
  recipient: string;
  unlocked: boolean;
  phraseSaved: boolean;
  messageCount: number;
  showRaw: boolean;
  onToggleRaw(): void;
  onUnlock(): void;
  onLock(): void;
  onChangePhrase(): void;
  onForgetPhrase(): void;
}

export function ChatHeader({
  recipient,
  unlocked,
  phraseSaved,
  messageCount,
  showRaw,
  onToggleRaw,
  onUnlock,
  onLock,
  onChangePhrase,
  onForgetPhrase,
}: Props) {
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

        {unlocked ? (
          <div className="flex items-center gap-2">
            <ViewToggle showRaw={showRaw} onToggle={onToggleRaw} />
            <LockButton onClick={onLock} />
            <MoreActionsMenu
              phraseSaved={phraseSaved}
              onChangePhrase={onChangePhrase}
              onForgetPhrase={onForgetPhrase}
            />
          </div>
        ) : (
          <UnlockButton onClick={onUnlock} />
        )}

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

function UnlockButton({ onClick }: { onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 hover:bg-accent/20 active:scale-[0.97] text-accent px-3 py-1.5 text-[11px] font-mono uppercase tracking-[0.16em] transition"
    >
      <svg width="11" height="11" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.6" />
      </svg>
      <span>Unlock</span>
    </button>
  );
}

function LockButton({ onClick }: { onClick(): void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Lock conversation"
      title="Lock conversation"
      className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border/60 hover:border-border hover:bg-surface text-text-2 hover:text-text active:scale-[0.97] transition"
    >
      <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden>
        <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
        <path d="M7 9V6a3 3 0 015.5-1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </button>
  );
}

function MoreActionsMenu({
  phraseSaved,
  onChangePhrase,
  onForgetPhrase,
}: {
  phraseSaved: boolean;
  onChangePhrase(): void;
  onForgetPhrase(): void;
}) {
  const items: MenuProps["items"] = [
    {
      key: "change",
      label: "Change passphrase",
      onClick: onChangePhrase,
    },
    ...(phraseSaved
      ? [
          { type: "divider" as const },
          {
            key: "forget",
            label: "Forget saved passphrase",
            danger: true,
            onClick: onForgetPhrase,
          },
        ]
      : []),
  ];

  return (
    <Dropdown
      menu={{ items }}
      trigger={["click"]}
      placement="bottomRight"
      overlayStyle={{ minWidth: 200 }}
    >
      <button
        type="button"
        aria-label="More actions"
        title="More actions"
        className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-border/60 hover:border-border hover:bg-surface text-text-2 hover:text-text active:scale-[0.97] transition relative"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor" aria-hidden>
          <circle cx="10" cy="4.5" r="1.4" />
          <circle cx="10" cy="10" r="1.4" />
          <circle cx="10" cy="15.5" r="1.4" />
        </svg>
        {phraseSaved && (
          <span
            aria-hidden
            className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-accent"
            title="Phrase saved on this device"
          />
        )}
      </button>
    </Dropdown>
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
