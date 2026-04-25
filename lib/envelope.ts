/**
 * lib/envelope.ts
 *
 * Defines the schema of the cleartext "envelope" that gets serialized,
 * encrypted, and embedded into a stego cover. The envelope is the only
 * thing the recipient ever decrypts — any field added here is hidden
 * from the server.
 *
 * Versioning: every envelope carries `v: 1`. If we ever change the
 * shape, recipients with the old client can refuse to render and tell
 * the user to update — better than a silent UI bug.
 */

import { z } from "zod";

const TextEnvelope = z.object({
  v: z.literal(1),
  type: z.literal("text"),
  ts: z.number().int().nonnegative(),
  body: z.string().max(50_000),
});

const AudioEnvelope = z.object({
  v: z.literal(1),
  type: z.literal("audio"),
  ts: z.number().int().nonnegative(),
  /** base64-encoded audio bytes. We embed audio as a data blob inside
      the envelope so the entire message remains a single AES-GCM chunk. */
  body: z.string(),
  mime: z.string(),
  /** duration in milliseconds */
  duration: z.number().int().nonnegative(),
});

export const EnvelopeSchema = z.discriminatedUnion("type", [
  TextEnvelope,
  AudioEnvelope,
]);

export type Envelope = z.infer<typeof EnvelopeSchema>;
export type TextEnvelopeT = z.infer<typeof TextEnvelope>;
export type AudioEnvelopeT = z.infer<typeof AudioEnvelope>;

/** Serialize an envelope to UTF-8 bytes ready for AES-GCM encryption. */
export function encodeEnvelope(env: Envelope): Uint8Array {
  // Validate again so we never write malformed envelopes (e.g., from a buggy
  // call site). Cheap and catches bugs early.
  const ok = EnvelopeSchema.parse(env);
  return new TextEncoder().encode(JSON.stringify(ok));
}

/** Inverse of encodeEnvelope. Throws on invalid JSON or schema mismatch. */
export function decodeEnvelope(bytes: Uint8Array): Envelope {
  const json = new TextDecoder().decode(bytes);
  const obj: unknown = JSON.parse(json);
  return EnvelopeSchema.parse(obj);
}

export function makeTextEnvelope(body: string): TextEnvelopeT {
  return { v: 1, type: "text", ts: Date.now(), body };
}

export function makeAudioEnvelope(args: {
  base64: string;
  mime: string;
  durationMs: number;
}): AudioEnvelopeT {
  return {
    v: 1,
    type: "audio",
    ts: Date.now(),
    body: args.base64,
    mime: args.mime,
    duration: args.durationMs,
  };
}
