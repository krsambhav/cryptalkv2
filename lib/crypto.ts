/**
 * lib/crypto.ts
 *
 * Pure cryptographic primitives for CrypTalk. Browser-only — relies on the
 * Web Crypto API (window.crypto.subtle), which is faster, audited, and
 * implemented natively in every modern browser.
 *
 * Threat model:
 *   - Server is honest-but-curious. It must never see plaintext or any
 *     value derived from the passphrase that would help brute-force it.
 *   - Two participants share a passphrase out-of-band. Both type it in,
 *     and both deterministically derive the same 256-bit AES key from it
 *     using PBKDF2 over a per-conversation salt stored in Firestore.
 *   - Salt is non-secret. Its role is to make rainbow tables useless and
 *     to ensure two conversations with the same passphrase produce
 *     different keys.
 *
 * Parameters chosen:
 *   - PBKDF2 with SHA-256, 600,000 iterations. OWASP 2023+ recommendation
 *     for SHA-256 PBKDF2. On a modern phone this takes ~300-500ms — slow
 *     enough to deter brute-force, fast enough to feel snappy.
 *   - 16-byte (128-bit) salt. Stored alongside the conversation in
 *     Firestore in base64.
 *   - AES-256-GCM with a 12-byte (96-bit) random IV per message. GCM
 *     provides authenticated encryption (confidentiality + integrity).
 *     A fresh random IV per encrypt() call avoids nonce reuse — never
 *     reuse an (IV, key) pair.
 */

import { wordlist as BIP39_WORDLIST } from "@scure/bip39/wordlists/english.js";

const PBKDF2_ITERATIONS = 600_000;
const PBKDF2_HASH = "SHA-256";
const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;
const PASSPHRASE_WORDS = 6;

// ---- key derivation -------------------------------------------------------

/**
 * Derives a 256-bit AES-GCM key from a human-typed passphrase and a
 * per-conversation salt. The same (passphrase, salt) always yields the
 * same key — that's how both participants converge on a shared secret.
 *
 * Why PBKDF2 over Argon2: PBKDF2 is in Web Crypto natively. Argon2 would
 * require shipping a wasm bundle (50-200KB) and adds attack surface. For
 * the iteration counts we pick, PBKDF2 is acceptable for academic
 * messaging — Signal itself ships PBKDF2 for some derivations.
 */
export async function deriveKey(
  passphrase: string,
  salt: Uint8Array,
): Promise<CryptoKey> {
  if (passphrase.length === 0) {
    throw new Error("passphrase must not be empty");
  }
  if (salt.byteLength !== SALT_LENGTH) {
    throw new Error(`salt must be ${SALT_LENGTH} bytes, got ${salt.byteLength}`);
  }

  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(passphrase.normalize("NFKC")),
    { name: "PBKDF2" },
    /* extractable */ false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH },
    /* extractable */ false,
    ["encrypt", "decrypt"],
  );
}

// ---- encrypt / decrypt ----------------------------------------------------

/**
 * Encrypts plaintext under the supplied AES-GCM key. Output layout:
 *
 *   [ 12-byte random IV ][ ciphertext (incl. 16-byte GCM auth tag) ]
 *
 * The IV is prepended (not secret — IVs in GCM are public). The auth tag
 * is appended automatically by the GCM mode and verified during decrypt.
 */
export async function encrypt(
  plaintext: Uint8Array,
  key: CryptoKey,
): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      plaintext as BufferSource,
    ),
  );

  const out = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
  out.set(iv, 0);
  out.set(ciphertext, IV_LENGTH);
  return out;
}

/**
 * Inverse of encrypt(). Throws if the auth tag fails (wrong key or
 * tampered ciphertext). Callers should treat any error as "decryption
 * failed" and surface a friendly error to the user — never leak the
 * specific reason, that's a side-channel.
 */
export async function decrypt(
  payload: Uint8Array,
  key: CryptoKey,
): Promise<Uint8Array> {
  if (payload.byteLength < IV_LENGTH + 16) {
    throw new Error("payload too short to contain IV + tag");
  }
  const iv = payload.subarray(0, IV_LENGTH);
  const ciphertext = payload.subarray(IV_LENGTH);

  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new Uint8Array(plaintext);
}

// ---- passphrase generation ------------------------------------------------

/**
 * Generates a random N-word BIP39 passphrase using cryptographically
 * secure randomness. We don't include a checksum (real BIP39 mnemonics
 * have one); we just want unambiguous, human-friendly random words.
 *
 * Entropy: log2(2048^6) ≈ 66 bits. Combined with 600k PBKDF2 iterations
 * the effective brute-force cost is ~2^85 — well beyond reach.
 */
export function generatePassphrase(words: number = PASSPHRASE_WORDS): string {
  if (words < 4) {
    throw new Error("passphrase must be at least 4 words");
  }
  const list = BIP39_WORDLIST;
  const wordlistLen = list.length;
  // rejection sampling against modulo bias — pick uniformly in [0, len)
  const max = Math.floor(0xffff_ffff / wordlistLen) * wordlistLen;
  const chosen: string[] = [];
  const rand = new Uint32Array(words * 2);
  let pool = 0;
  while (chosen.length < words) {
    if (pool === 0) {
      crypto.getRandomValues(rand);
      pool = rand.length;
    }
    pool -= 1;
    const r = rand[pool]!;
    if (r < max) {
      chosen.push(list[r % wordlistLen]!);
    }
  }
  return chosen.join(" ");
}

/** True if every word of the passphrase is in the BIP39 list. */
export function isValidPassphrase(passphrase: string): boolean {
  const words = passphrase.trim().toLowerCase().split(/\s+/);
  if (words.length < 4) return false;
  const set = new Set(BIP39_WORDLIST);
  return words.every((w) => set.has(w));
}

// ---- hashing & helpers ----------------------------------------------------

/** Hex-encoded SHA-256 of the input bytes. */
export async function sha256(data: Uint8Array): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", data as BufferSource);
  return bufferToHex(new Uint8Array(buf));
}

/** Generates a fresh 16-byte salt for a new conversation. */
export function generateSalt(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
}

// ---- encoding helpers -----------------------------------------------------

export function bufferToHex(buf: Uint8Array): string {
  let s = "";
  for (let i = 0; i < buf.length; i++) {
    s += buf[i]!.toString(16).padStart(2, "0");
  }
  return s;
}

export function hexToBuffer(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) throw new Error("invalid hex length");
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function bufferToBase64(buf: Uint8Array): string {
  // Split into 32KB chunks to avoid stack overflows on String.fromCharCode.
  let s = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < buf.length; i += CHUNK) {
    s += String.fromCharCode(...buf.subarray(i, i + CHUNK));
  }
  return btoa(s);
}

export function base64ToBuffer(b64: string): Uint8Array {
  const s = atob(b64);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export const CRYPTO_PARAMS = {
  pbkdf2Iterations: PBKDF2_ITERATIONS,
  pbkdf2Hash: PBKDF2_HASH,
  aesKeyLength: AES_KEY_LENGTH,
  ivLength: IV_LENGTH,
  saltLength: SALT_LENGTH,
  passphraseWords: PASSPHRASE_WORDS,
} as const;
