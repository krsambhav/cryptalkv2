"use client";

import type { SendStage } from "@/lib/pipeline";
import { getCover } from "@/lib/covers";

interface Props {
  stage: SendStage;
}

/**
 * Visualizes the in-flight send pipeline. Three labeled steps with a
 * progressing indicator. Visible only while a send is in progress.
 */
export function SendStatus({ stage }: Props) {
  if (stage.kind === "idle" || stage.kind === "done") return null;

  const steps: { id: SendStage["kind"]; label: string; sub?: string }[] = [
    { id: "encrypting", label: "Encrypting", sub: "AES-256-GCM" },
    {
      id: "embedding",
      label: "Hiding in cover",
      sub:
        stage.kind === "embedding" || stage.kind === "uploading"
          ? getCover(stage.coverId)?.name.toLowerCase()
          : undefined,
    },
    { id: "uploading", label: "Sending", sub: "to relay" },
  ];

  const idxOf: Record<SendStage["kind"], number> = {
    idle: -1,
    encrypting: 0,
    embedding: 1,
    uploading: 2,
    done: 3,
    error: -1,
  };
  const activeIdx = idxOf[stage.kind];

  return (
    <div className="px-4 sm:px-6 pb-2 animate-fade-up">
      <div className="rounded-lg bg-surface/70 border border-border/60 px-3 py-2 flex items-center gap-3 text-[11px]">
        {stage.kind === "error" ? (
          <span className="text-danger font-mono">error · {stage.message}</span>
        ) : (
          <>
            {steps.map((s, i) => {
              const state = i < activeIdx ? "done" : i === activeIdx ? "active" : "pending";
              return (
                <div key={s.id} className="flex items-center gap-2">
                  <Dot state={state} />
                  <div className="flex flex-col leading-tight">
                    <span
                      className={`font-mono uppercase tracking-[0.14em] text-[10px] ${
                        state === "active"
                          ? "text-accent"
                          : state === "done"
                            ? "text-text-2"
                            : "text-muted"
                      }`}
                    >
                      {s.label}
                    </span>
                    {s.sub && (
                      <span className="text-[9px] text-muted truncate max-w-[10rem]">{s.sub}</span>
                    )}
                  </div>
                  {i < steps.length - 1 && (
                    <span className="w-4 h-px bg-border/60 mx-1" aria-hidden />
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
}

function Dot({ state }: { state: "pending" | "active" | "done" }) {
  const base = "w-2 h-2 rounded-full transition-colors";
  if (state === "active") {
    return (
      <span className="relative">
        <span className={`${base} bg-accent`} />
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-accent/60"
          style={{ animation: "pulse-ring 1.4s ease-out infinite" }}
        />
      </span>
    );
  }
  if (state === "done") return <span className={`${base} bg-success`} />;
  return <span className={`${base} bg-faint`} />;
}
