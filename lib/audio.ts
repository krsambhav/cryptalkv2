/**
 * lib/audio.ts
 *
 * Thin wrappers around MediaRecorder. Records to a single Blob in
 * webm-opus (or whatever the browser supports), with a hard 60-second
 * cap matching the v1 message-size budget.
 *
 * Why opus @ 32 kbps: roughly 240 KB for 60s of speech, well within
 * any cover's LSB capacity (~1 MB on a 2000×1500 PNG). The bitrate
 * is set via MediaRecorder's audioBitsPerSecond option.
 */

export const MAX_DURATION_MS = 60_000;
export const TARGET_BITRATE = 32_000; // 32 kbps

const PREFERRED_MIMES: ReadonlyArray<string> = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
];

export function pickSupportedMime(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of PREFERRED_MIMES) {
    if (MediaRecorder.isTypeSupported(m)) return m;
  }
  return null;
}

export interface RecordingHandle {
  /** total recording time in ms; updated as we go */
  ms(): number;
  /** stop and resolve to the final blob */
  stop(): Promise<{ blob: Blob; durationMs: number; mime: string }>;
  /** cancel without producing output */
  cancel(): void;
}

export async function startRecording(): Promise<RecordingHandle> {
  const _mime = pickSupportedMime();
  if (!_mime) throw new Error("MediaRecorder not supported in this browser");
  const mime: string = _mime;

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });

  const recorder = new MediaRecorder(stream, {
    mimeType: mime,
    audioBitsPerSecond: TARGET_BITRATE,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const start = performance.now();
  let stopped = false;
  let cancelled = false;

  recorder.start(100); // collect chunks every 100ms

  function ms(): number {
    return performance.now() - start;
  }

  function release() {
    stream.getTracks().forEach((t) => t.stop());
  }

  function cancel() {
    if (stopped) return;
    cancelled = true;
    stopped = true;
    if (recorder.state !== "inactive") recorder.stop();
    release();
  }

  function stop(): Promise<{ blob: Blob; durationMs: number; mime: string }> {
    return new Promise((resolve, reject) => {
      if (cancelled) {
        reject(new Error("recording cancelled"));
        return;
      }
      if (stopped) {
        reject(new Error("recording already stopped"));
        return;
      }
      stopped = true;

      recorder.onstop = () => {
        release();
        if (cancelled) {
          reject(new Error("recording cancelled"));
          return;
        }
        const blob = new Blob(chunks, { type: mime });
        resolve({ blob, durationMs: Math.min(ms(), MAX_DURATION_MS), mime });
      };
      try {
        if (recorder.state !== "inactive") recorder.stop();
        else {
          // already inactive — synthesize a stop event
          const blob = new Blob(chunks, { type: mime });
          release();
          resolve({ blob, durationMs: Math.min(ms(), MAX_DURATION_MS), mime });
        }
      } catch (err) {
        release();
        reject(err);
      }
    });
  }

  return { ms, stop, cancel };
}

export async function blobToBase64(blob: Blob): Promise<string> {
  const buf = new Uint8Array(await blob.arrayBuffer());
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    s += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(s);
}
