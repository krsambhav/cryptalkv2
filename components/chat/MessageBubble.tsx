"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { runDecrypt, type DecryptResult } from "@/lib/pipeline";
import type { MessageRow } from "@/lib/firebase";
import { useSession } from "@/stores/session";
import { getCover } from "@/lib/covers";

interface Props {
  msg: MessageRow;
  convoId: string;
  isMine: boolean;
  showRaw: boolean;
  staggerIndex: number;
}

export function MessageBubble({ msg, convoId, isMine, showRaw, staggerIndex }: Props) {
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

  // Cap the stagger so a long history doesn't compound delay forever.
  const delay = Math.min(staggerIndex, 8) * 0.04;

  // Show the cipher while we're still decrypting too — that way the
  // cross-fade looks like the cipher dissolving into its message,
  // not into a loading dot.
  const renderRaw = showRaw || state.kind === "loading";

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
        <motion.div
          layout="position"
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className={`rounded-2xl overflow-hidden ${
            renderRaw
              ? "bg-bg-2 border border-border/60"
              : isMine
                ? "bg-accent text-bg rounded-tr-sm"
                : "bg-surface text-text rounded-tl-sm"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {renderRaw ? (
              <motion.div
                key="raw"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { duration: 0.32, delay, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  filter: "blur(4px)",
                  transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
                }}
              >
                <RawView msg={msg} isMine={isMine} />
              </motion.div>
            ) : (
              <motion.div
                key="plain"
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
                animate={{
                  opacity: 1,
                  scale: 1,
                  filter: "blur(0px)",
                  transition: { duration: 0.32, delay, ease: [0.16, 1, 0.3, 1] },
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  filter: "blur(4px)",
                  transition: { duration: 0.18, ease: [0.4, 0, 1, 1] },
                }}
                className="px-4 py-2.5"
              >
                <Body state={state} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <div className="mt-1.5 px-1 flex items-center gap-2 text-[10px] font-mono text-muted">
          <span>{time}</span>
          <span aria-hidden>·</span>
          <span title={msg.coverId}>{cover?.name.toLowerCase() ?? msg.coverId}</span>
        </div>
      </div>
    </article>
  );
}

/**
 * Raw view — the actual stego PNG that lives in Storage. Fetched through
 * the same-origin proxy that already wraps msg.stegoUrl. This is what the
 * server sees: just a picture.
 */
function RawView({ msg, isMine }: { msg: MessageRow; isMine: boolean }) {
  return (
    <div className="flex flex-col">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={msg.stegoUrl}
        alt={`stego cipher · ${msg.coverId}`}
        className="block w-full max-w-[260px] aspect-[4/3] object-cover"
        loading="lazy"
      />
      <div className="px-3 py-2 flex items-center justify-between gap-2 text-[10px] font-mono text-muted">
        <span className="uppercase tracking-[0.16em]">on the wire</span>
        <span className={isMine ? "text-accent" : "text-text-2"}>image/png</span>
      </div>
    </div>
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
