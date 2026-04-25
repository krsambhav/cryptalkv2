"use client";

import { useEffect, useRef, useState } from "react";
import { App } from "antd";
import {
  MAX_DURATION_MS,
  blobToBase64,
  startRecording,
  type RecordingHandle,
} from "@/lib/audio";
import { makeAudioEnvelope, type AudioEnvelopeT } from "@/lib/envelope";

/**
 * Tap to start, tap to stop. While recording, the input row is replaced
 * with a recording panel: pulsing dot, timer, sound bars, and cancel /
 * send controls. Hard-caps at 60 seconds — auto-stops with a send.
 */
interface Props {
  disabled?: boolean;
  onRecorded(args: { envelope: AudioEnvelopeT; durationMs: number }): void;
}

export function AudioRecorder({ disabled, onRecorded }: Props) {
  const { message } = App.useApp();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const handleRef = useRef<RecordingHandle | null>(null);
  const tickRef = useRef<number | null>(null);

  useEffect(() => () => stopTicker(), []);

  function stopTicker() {
    if (tickRef.current !== null) {
      window.clearInterval(tickRef.current);
      tickRef.current = null;
    }
  }

  async function start() {
    if (disabled || recording) return;
    try {
      const h = await startRecording();
      handleRef.current = h;
      setRecording(true);
      setElapsed(0);
      tickRef.current = window.setInterval(() => {
        const ms = h.ms();
        setElapsed(ms);
        if (ms >= MAX_DURATION_MS) finalize();
      }, 100);
    } catch (err) {
      message.error(
        err instanceof Error
          ? err.message.includes("Permission")
            ? "microphone permission denied"
            : err.message
          : "could not start recording",
      );
    }
  }

  async function finalize() {
    const h = handleRef.current;
    if (!h) return;
    handleRef.current = null;
    stopTicker();
    setRecording(false);
    try {
      const { blob, durationMs, mime } = await h.stop();
      if (durationMs < 400) {
        message.warning("recording too short — released too quickly");
        return;
      }
      const base64 = await blobToBase64(blob);
      const envelope = makeAudioEnvelope({ base64, mime, durationMs });
      onRecorded({ envelope, durationMs });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "could not encode audio");
    }
  }

  function cancel() {
    handleRef.current?.cancel();
    handleRef.current = null;
    stopTicker();
    setRecording(false);
    setElapsed(0);
  }

  if (!recording) {
    return (
      <button
        type="button"
        onClick={start}
        disabled={disabled}
        aria-label="record voice message"
        className="shrink-0 w-11 h-11 rounded-full border bg-bg-2 hover:bg-surface text-text-2 flex items-center justify-center disabled:opacity-40 transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
          <rect x="6.5" y="2.5" width="5" height="9" rx="2.5" stroke="currentColor" strokeWidth="1.4" />
          <path d="M3.5 9a5.5 5.5 0 0011 0M9 14.5v1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </button>
    );
  }

  const pct = Math.min(100, (elapsed / MAX_DURATION_MS) * 100);
  return (
    <div className="absolute inset-x-3 sm:inset-x-4 lg:inset-x-6 bottom-3 z-10">
      <div className="rounded-2xl border border-accent/40 bg-bg-2 px-3 py-2.5 flex items-center gap-3 animate-fade-up">
        <span className="relative w-2.5 h-2.5 shrink-0">
          <span className="absolute inset-0 rounded-full bg-danger" />
          <span
            className="absolute inset-0 rounded-full bg-danger/60"
            style={{ animation: "pulse-ring 1.4s ease-out infinite" }}
            aria-hidden
          />
        </span>
        <span className="font-mono text-sm tabular-nums">{formatMs(elapsed)}</span>
        <SoundBars />
        <div className="flex-1 h-px bg-border" aria-hidden />
        <button
          onClick={cancel}
          aria-label="cancel recording"
          className="text-xs text-text-2 hover:text-text px-2 py-1.5"
        >
          cancel
        </button>
        <button
          onClick={finalize}
          aria-label="stop and send recording"
          className="rounded-full bg-accent text-bg w-9 h-9 flex items-center justify-center"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 7.5L11 3.5L8.5 11L7 8L3 7.5Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <div className="mt-1 h-px bg-border/60 overflow-hidden">
        <div className="h-px bg-accent transition-[width]" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function SoundBars() {
  // four bars, animated with staggered delays
  return (
    <span className="flex items-center gap-0.5 h-4" aria-hidden>
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="w-0.5 bg-accent/80"
          style={{
            height: "100%",
            transformOrigin: "center",
            animation: "sound-bar 700ms ease-in-out infinite",
            animationDelay: `${i * 80}ms`,
          }}
        />
      ))}
    </span>
  );
}

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
