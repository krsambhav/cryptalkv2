/**
 * Per-conversation saved-phrase storage.
 *
 * The phrase is encrypted with the device's non-extractable wrapping key
 * (see lib/devicekey.ts) and the resulting {iv, ct} blob is stored in
 * localStorage. The plaintext never touches storage; only ciphertext.
 *
 * Threat model: a copied localStorage dump is useless without the
 * device's wrapping key, which lives in IndexedDB as a non-extractable
 * CryptoKey scoped to this origin and browser profile.
 */

import { bufferToBase64, base64ToBuffer } from "@/lib/crypto";
import { getDeviceKey } from "@/lib/devicekey";

const STORAGE_PREFIX = "cryptalk:phrase:";

interface PhraseBlob {
  iv: string;
  ct: string;
}

function storageKey(convoId: string): string {
  return STORAGE_PREFIX + convoId;
}

export async function savePhrase(convoId: string, phrase: string): Promise<void> {
  const key = await getDeviceKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(phrase),
  );
  const blob: PhraseBlob = {
    iv: bufferToBase64(iv),
    ct: bufferToBase64(new Uint8Array(ct)),
  };
  localStorage.setItem(storageKey(convoId), JSON.stringify(blob));
}

export async function loadPhrase(convoId: string): Promise<string | null> {
  const raw = localStorage.getItem(storageKey(convoId));
  if (!raw) return null;
  try {
    const blob = JSON.parse(raw) as PhraseBlob;
    const key = await getDeviceKey();
    const iv = base64ToBuffer(blob.iv);
    const ct = base64ToBuffer(blob.ct);
    const pt = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
    return new TextDecoder().decode(pt);
  } catch {
    // Wrong device key, corrupted blob, or tampered storage. Drop it.
    clearPhrase(convoId);
    return null;
  }
}

export function clearPhrase(convoId: string): void {
  localStorage.removeItem(storageKey(convoId));
}

export function hasSavedPhrase(convoId: string): boolean {
  if (typeof localStorage === "undefined") return false;
  return localStorage.getItem(storageKey(convoId)) !== null;
}
