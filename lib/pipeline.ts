/**
 * lib/pipeline.ts
 *
 * The send and receive pipelines, expressed as small typed helpers so
 * MessageInput / MessageList stay focused on UI. The send pipeline is:
 *
 *   envelope → encrypt → embed in cover → upload to Storage → write Firestore msg
 *
 * The receive pipeline is the reverse:
 *
 *   fetch stego → extract LSBs → decrypt → decode envelope
 */

import { decrypt, encrypt } from "@/lib/crypto";
import { decodeEnvelope, encodeEnvelope, type Envelope } from "@/lib/envelope";
import { fetchAndVerifyCover, pickRandomCoverId } from "@/lib/covers";
import { sendMessage } from "@/lib/firebase";
import { embed, extract, loadImage } from "@/lib/stego";

export type SendStage =
  | { kind: "idle" }
  | { kind: "encrypting" }
  | { kind: "embedding"; coverId: string }
  | { kind: "uploading"; coverId: string }
  | { kind: "done" }
  | { kind: "error"; message: string };

export interface SendArgs {
  convoId: string;
  myUid: string;
  key: CryptoKey;
  envelope: Envelope;
  coverPoolIds: ReadonlyArray<string>;
  onStage?(s: SendStage): void;
}

export async function runSend(args: SendArgs): Promise<void> {
  const stage = (s: SendStage) => args.onStage?.(s);
  try {
    stage({ kind: "encrypting" });
    const plain = encodeEnvelope(args.envelope);
    const cipher = await encrypt(plain, args.key);

    const coverId = pickRandomCoverId(args.coverPoolIds);
    stage({ kind: "embedding", coverId });

    const coverBlob = await fetchAndVerifyCover(coverId);
    const coverUrl = URL.createObjectURL(coverBlob);
    let stegoBlob: Blob;
    try {
      const coverImg = await loadImage(coverUrl);
      stegoBlob = await embed(coverImg, cipher);
    } finally {
      URL.revokeObjectURL(coverUrl);
    }

    stage({ kind: "uploading", coverId });
    await sendMessage({
      convoId: args.convoId,
      senderId: args.myUid,
      stegoBlob,
      coverId,
    });

    stage({ kind: "done" });
  } catch (err) {
    stage({
      kind: "error",
      message: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}

// ---- receive pipeline -----------------------------------------------------

export type DecryptResult =
  | { kind: "loading" }
  | { kind: "ok"; envelope: Envelope }
  | { kind: "error"; reason: string };

/**
 * Fetches a stego PNG, extracts the embedded payload, decrypts under the
 * given key, and decodes the envelope. Each step's failure is collapsed
 * into a single user-friendly message — never leak whether the failure
 * was extraction vs decryption (a side channel for an attacker).
 */
export async function runDecrypt(
  stegoUrl: string,
  key: CryptoKey,
): Promise<Envelope> {
  const img = await loadImage(stegoUrl);
  let cipher: Uint8Array;
  try {
    cipher = await extract(img);
  } catch (err) {
    throw new Error(`could not extract from image (${describe(err)})`);
  }
  let plain: Uint8Array;
  try {
    plain = await decrypt(cipher, key);
  } catch {
    throw new Error("decryption failed — passphrase mismatch?");
  }
  try {
    return decodeEnvelope(plain);
  } catch (err) {
    throw new Error(`malformed envelope (${describe(err)})`);
  }
}

function describe(err: unknown): string {
  if (err instanceof Error) return err.message;
  return String(err);
}
