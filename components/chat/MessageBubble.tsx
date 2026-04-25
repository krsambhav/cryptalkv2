"use client";

import { useEffect, useRef, useState } from "react";
import { runDecrypt, type DecryptResult } from "@/lib/pipeline";
import type { MessageRow } from "@/lib/firebase";
import { useSession } from "@/stores/session";
import { getCover } from "@/lib/covers";

interface Props {
  msg: MessageRow;
  convoId: string;
  isMine: boolean;
}

export function MessageBubble({ msg, convoId, isMine }: Props) {
  const key = useSession((s) => s.getKey(convoId));
  const [state, setState] = useState<DecryptResult>({ kind: "loading" });

  // Decrypt once when the message + key are available. Even if the parent
  // re-renders, we never re-run — once decrypted, the result is sticky.
  const decrypted = useRef(false);
  useEffect(() => {
    if (!key || decrypted.current) return;
    decrypted.current = true;
    runDecrypt(msg.stegoUrl, key)
      .then((env) => setState({ kind: "ok", envelope: env }))
      .catch((err) =>
        setState({ kind: "error", reason: err instanceof Error ? err.message : String(err) }),
      );
  }, [msg.stegoUrl, key]);

  const cover = getCover(msg.coverId);
  const time = formatTime(msg.ts);

  return (
    <article
      className={`flex gap-2 sm:gap-3 ${isMine ? "flex-row-reverse" : "flex-row"} animate-fade-up`}
    >
      <CoverThumb cover={cover} alt={`stego cover · ${msg.coverId}`} />
      <div
        className={`max-w-[78%] sm:max-w-[68%] flex flex-col ${
          isMine ? "items-end" : "items-start"
        }`}
      >
        <div
          className={`rounded-2xl px-4 py-2.5 ${
            isMine
              ? "bg-accent text-bg rounded-tr-sm"
              : "bg-surface text-text rounded-tl-sm"
          }`}
        >
          <Body state={state} />
        </div>
        <div className="mt-1.5 px-1 flex items-center gap-2 text-[10px] font-mono text-muted">
          <span>{time}</span>
          <span aria-hidden>·</span>
          <span title={msg.coverId}>{cover?.name.toLowerCase() ?? msg.coverId}</span>
        </div>
      </div>
    </article>
  );
}

function Body({ state }: { state: DecryptResult }) {
  if (state.kind === "loading") {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:120ms]" />
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse [animation-delay:240ms]" />
      </span>
    );
  }
  if (state.kind === "error") {
    return (
      <span className="text-xs italic opacity-80">— {state.reason}</span>
    );
  }
  const env = state.envelope;
  if (env.type === "text") {
    return (
      <p className="whitespace-pre-wrap break-words text-[15px] leading-snug">
        {env.body}
      </p>
    );
  }
  if (env.type === "audio") {
    return <AudioPlayer base64={env.body} mime={env.mime} duration={env.duration} />;
  }
  return null;
}

function AudioPlayer({ base64, mime, duration }: { base64: string; mime: string; duration: number }) {
  const url = useBlobUrl(base64, mime);
  const seconds = Math.max(1, Math.round(duration / 1000));
  return (
    <div className="flex items-center gap-3 min-w-[200px]">
      <span className="text-[11px] uppercase tracking-[0.18em] opacity-70">audio</span>
      {url && (
        <audio
          controls
          src={url}
          className="h-8"
          preload="metadata"
          style={{
            colorScheme: "light dark",
          }}
        />
      )}
      <span className="text-[11px] font-mono opacity-70">{seconds}s</span>
    </div>
  );
}

function useBlobUrl(base64: string, mime: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    const bytes = base64ToBytes(base64);
    const blob = new Blob([bytes as BlobPart], { type: mime });
    const u = URL.createObjectURL(blob);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [base64, mime]);
  return url;
}

function base64ToBytes(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

function CoverThumb({
  cover,
  alt,
}: {
  cover: ReturnType<typeof getCover>;
  alt: string;
}) {
  if (!cover) {
    return <div className="w-8 h-8 shrink-0 rounded-full bg-surface border" />;
  }
  return (
    <div
      className="w-8 h-8 shrink-0 rounded-full overflow-hidden border border-border/80"
      title={alt}
      aria-hidden
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={cover.url} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? "pm" : "am";
  const hh = ((h + 11) % 12) + 1;
  return `${hh}:${m.toString().padStart(2, "0")}${ampm}`;
}
