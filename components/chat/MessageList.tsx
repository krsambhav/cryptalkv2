"use client";

import { useEffect, useRef } from "react";
import type { MessageRow } from "@/lib/firebase";
import { MessageBubble } from "./MessageBubble";

interface Props {
  messages: MessageRow[];
  convoId: string;
  myUid: string;
  recipient: string;
}

export function MessageList({ messages, convoId, myUid, recipient }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const liveRef = useRef<HTMLDivElement>(null);
  const lastIdRef = useRef<string | null>(null);

  // Auto-scroll to bottom when new messages arrive. We only scroll if
  // the user is already near the bottom — don't yank them away from
  // history they're reading.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];
    if (!last) return;
    const isNew = last.id !== lastIdRef.current;
    lastIdRef.current = last.id;
    if (!isNew) return;

    const distanceFromBottom = el.scrollHeight - (el.scrollTop + el.clientHeight);
    if (distanceFromBottom < 200) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }

    // Announce to screen readers — only the latest delta.
    if (liveRef.current && last.senderId !== myUid) {
      liveRef.current.textContent = `New message in conversation with ${recipient}.`;
    }
  }, [messages, myUid, recipient]);

  if (messages.length === 0) {
    return (
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 lg:px-8 py-12">
        <EmptyMessages recipient={recipient} />
      </div>
    );
  }

  // Group adjacent messages with date dividers when day changes.
  const groups = groupByDay(messages);

  return (
    <div
      ref={scrollRef}
      className="flex-1 overflow-y-auto px-3 sm:px-4 lg:px-8 py-6 space-y-6"
    >
      <div ref={liveRef} aria-live="polite" aria-atomic="true" className="sr-only" />
      {groups.map((g) => (
        <section key={g.dayLabel} className="space-y-3.5">
          <DayDivider label={g.dayLabel} />
          {g.rows.map((m) => (
            <MessageBubble
              key={m.id}
              msg={m}
              convoId={convoId}
              isMine={m.senderId === myUid}
            />
          ))}
        </section>
      ))}
    </div>
  );
}

function DayDivider({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-px bg-border/60" />
      <span className="text-[10px] uppercase tracking-[0.22em] text-muted font-mono">
        {label}
      </span>
      <div className="flex-1 h-px bg-border/60" />
    </div>
  );
}

function groupByDay(rows: MessageRow[]): { dayLabel: string; rows: MessageRow[] }[] {
  const out: { dayLabel: string; rows: MessageRow[] }[] = [];
  for (const m of rows) {
    const label = formatDay(m.ts);
    const last = out[out.length - 1];
    if (last && last.dayLabel === label) {
      last.rows.push(m);
    } else {
      out.push({ dayLabel: label, rows: [m] });
    }
  }
  return out;
}

function formatDay(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();
  if (sameDay(d, today)) return "today";
  if (sameDay(d, yesterday)) return "yesterday";
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function EmptyMessages({ recipient }: { recipient: string }) {
  return (
    <div className="max-w-md mx-auto text-center mt-8">
      <div className="mx-auto mb-5 grid grid-cols-3 gap-1 w-32">
        {["01-amber-dusk", "03-pine-woods", "08-misty-lake"].map((id, i) => (
          <div
            key={id}
            className="aspect-square rounded-md overflow-hidden border opacity-70"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/covers/${id}.png`} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <h2 className="font-display text-2xl text-balance">A clean slate.</h2>
      <p className="mt-2 text-sm text-text-2 text-pretty">
        Type something to start a thread with <strong>{recipient}</strong>. Your first message
        will be sealed inside one of the eight cover photographs at random.
      </p>
    </div>
  );
}
