# FUTURE.md — v2 scope

Items that were intentionally cut from v1 to keep the academic build coherent
and shippable. Each item below is a concrete piece of follow-on work, not a
vague aspiration.

---

## 1. User-supplied cover images

**Today.** Eight pre-rendered 2000×1500 PNGs in `/public/covers/`. The sender
picks one (or it's randomized per-message); the receiver verifies a known
SHA-256 before decoding. This keeps the cover surface small and auditable.

**v2.**

- Allow the user to upload their own JPEG/PNG/HEIC during onboarding or
  per-conversation. Strip EXIF before re-encoding to PNG.
- Reject covers below a capacity threshold (`width × height × 3 / 8 < envelope`).
- Store the per-conversation cover in Firebase Storage, gated to participants.
- Hash-pin the cover at conversation creation; warn loudly if it changes.

---

## 2. Group conversations (3 – 8 participants)

**Today.** Strict 1:1. The conversation has exactly two `participants` and a
single derived AES key.

**v2.**

- Rotate to a group key derived from a multi-party passphrase, with each
  participant holding the same wrapped key.
- Senders pick one cover per message; the recipient reads it the same way.
- Membership changes invalidate the key and trigger a fresh out-of-band
  passphrase exchange (no key continuity for ex-members).

---

## 3. Randomized / key-derived LSB positions

**Today.** The encoder walks pixels sequentially, R then G then B, skipping
alpha. This is the textbook LSB pattern — easily detectable by chi-square
tests on the lowest bits.

**v2.**

- Use a key-stream derived from the AES key (or a separate position key) to
  permute the pixel order before embedding.
- Optionally interleave with random "decoy" bits in a fraction of the
  remaining capacity so a steganalyst cannot trivially count the embedded
  payload size.
- Update the receiver to walk the same permutation (it has the key).

---

## 4. Anti-screenshot / anti-record

**Today.** Decrypted plaintext is rendered as plain DOM text. Anyone with
shoulder access — or a screen recorder — can capture it.

**v2.**

- Use the iOS / Android native equivalents (when wrapped in a native shell)
  to mark the chat surface as `secureTextEntry` / `FLAG_SECURE`.
- For web: detect screenshot APIs where exposed (Page Visibility, focus
  loss + audio cues) and blur message content briefly. This is *defense in
  depth*, not a guarantee.
- Auto-redact messages from the DOM after a configurable read-window.

---

## 5. Video / GIF cover support

**Today.** PNG only.

**v2.**

- Embed across video frames (one frame per chunk of ciphertext) with a small
  tag to identify carrier frames.
- Carry the existing AES envelope unchanged; the stego layer is what
  changes.
- Useful capacity bump for long messages (or audio attachments larger than
  the current 60-second cap).

---

## 6. Push notifications

**Today.** No notifications. The user has to open the tab to see new
messages.

**v2.**

- Web Push (with an opt-in service worker) for "new image in conversation X"
  — the notification body never contains plaintext, since the client cannot
  decrypt without the in-memory key.
- The notification only triggers a UI badge; tapping it opens the
  conversation, where the user enters their passphrase if the tab was
  closed.

---

## 7. Message editing & deletion

**Today.** Messages are append-only. The sender cannot retract.

**v2.**

- "Delete for everyone" — overwrite the Firestore message doc and the
  Storage PNG with a tombstone (zero-byte upload). The receiver's UI shows
  a redacted placeholder. (Caveat: a recipient who has already decrypted the
  message has plaintext in memory.)
- "Edit" — append a new message that references the prior `messageId` and
  marks it as a replacement. The bubble shows the latest version with an
  "edited" indicator.

---

## 8. Audio improvements

**Today.** WebM/Opus, 32 kbps, 60-second cap.

**v2.**

- Waveform thumbnail (decoded once, cached client-side).
- Voice-activity-detection auto-stop.
- Compression negotiation per device — drop to 16 kbps on metered
  connections, push to 64 kbps on Wi-Fi.

---

## 9. Steganalysis hardening

**Today.** Sequential LSB, no decoys, fixed cover pool.

**v2.**

- Deploy the chi-square / SPA tests we'd use to attack the system, run them
  in CI against a corpus of real messages, fail the build if the false-
  positive rate drops below a target.
- Consider matrix embedding (F5-style) to reduce the number of bit changes
  per byte of payload.

---

## 10. Cover-channel diversity

**Today.** All covers are landscapes, all are PNG, all are 2000×1500.

**v2.**

- Add portrait covers, pre-cropped square covers (for stories-style
  sharing), and animated covers (see #5).
- Per-conversation cover-style choice — academic-research, family-photo,
  cityscape, etc — to give the carrier some plausibility relative to the
  expected social context.

---

## Out of scope, even for v2

- **Deniable encryption** — would require dual-passphrase covers and is a
  research problem, not an engineering one.
- **Forward secrecy across devices** — requires a real key-exchange
  protocol (Signal-style double ratchet); the BIP39 passphrase model is a
  deliberate simplification.
- **End-to-end verified identity** — there is no key-fingerprint UI today,
  and a real one would need an out-of-band trust establishment ceremony.
