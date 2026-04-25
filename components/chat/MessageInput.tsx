"use client";

import { useEffect, useRef, useState } from "react";
import { App } from "antd";
import { runSend, type SendStage } from "@/lib/pipeline";
import { makeTextEnvelope } from "@/lib/envelope";
import { useSession } from "@/stores/session";
import { SendStatus } from "./SendStatus";
import { AudioRecorder } from "./AudioRecorder";

interface Props {
  convoId: string;
  myUid: string;
  coverPoolIds: ReadonlyArray<string>;
}

export function MessageInput({ convoId, myUid, coverPoolIds }: Props) {
  const { message } = App.useApp();
  const key = useSession((s) => s.getKey(convoId));
  const [text, setText] = useState("");
  const [stage, setStage] = useState<SendStage>({ kind: "idle" });
  const taRef = useRef<HTMLTextAreaElement>(null);
  const sending = stage.kind !== "idle" && stage.kind !== "done" && stage.kind !== "error";

  // Auto-grow textarea height up to 6 lines.
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const max = 24 * 6 + 16; // ~6 lines + padding
    ta.style.height = `${Math.min(ta.scrollHeight, max)}px`;
  }, [text]);

  async function send() {
    if (!key || sending) return;
    const body = text.trim();
    if (!body) return;
    setStage({ kind: "encrypting" });
    try {
      await runSend({
        convoId,
        myUid,
        key,
        envelope: makeTextEnvelope(body),
        coverPoolIds,
        onStage: setStage,
      });
      setText("");
      // brief "done" → idle so the badge fades
      setStage({ kind: "done" });
      setTimeout(() => setStage({ kind: "idle" }), 600);
    } catch (err) {
      setStage({
        kind: "error",
        message: err instanceof Error ? err.message : String(err),
      });
      message.error("could not send");
      setTimeout(() => setStage({ kind: "idle" }), 4000);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div
      className="sticky bottom-0 bg-bg/85 backdrop-blur-md border-t border-border/60"
      style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
    >
      <SendStatus stage={stage} />

      <div className="px-3 sm:px-4 lg:px-6 py-3 flex items-end gap-2">
        <div className="flex-1 rounded-2xl border bg-bg-2 focus-within:border-accent transition-colors">
          <textarea
            ref={taRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={sending}
            placeholder="Write a message…"
            rows={1}
            className="w-full resize-none bg-transparent px-4 py-3 text-[15px] outline-none focus:outline-none focus-visible:outline-none placeholder:text-muted disabled:opacity-60"
            aria-label="message"
          />
        </div>

        <AudioRecorder
          disabled={sending || !key}
          onRecorded={async ({ envelope }) => {
            if (!key) return;
            setStage({ kind: "encrypting" });
            try {
              await runSend({
                convoId,
                myUid,
                key,
                envelope,
                coverPoolIds,
                onStage: setStage,
              });
              setStage({ kind: "done" });
              setTimeout(() => setStage({ kind: "idle" }), 600);
            } catch (err) {
              setStage({
                kind: "error",
                message: err instanceof Error ? err.message : String(err),
              });
              setTimeout(() => setStage({ kind: "idle" }), 4000);
            }
          }}
        />

        <button
          onClick={send}
          disabled={sending || !text.trim() || !key}
          aria-label="send message"
          className="shrink-0 w-11 h-11 rounded-full bg-accent text-bg flex items-center justify-center disabled:opacity-40 transition-transform active:scale-95"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path
              d="M3 9.5L15 3.5L11.5 14.5L9 10L3 9.5Z"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
