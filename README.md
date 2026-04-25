# CrypTalk

> Words that vanish into an ordinary photograph.

Final-year academic project. A web messenger that encrypts every message with
**AES-256-GCM** and weaves the resulting ciphertext into the least-significant
bits of a landscape PNG. The server (Firebase) only ever sees a picture; the
picture only ever looks like a picture.

All cryptography happens in the browser via the Web Crypto API. Conversation
keys are derived from a shared six-word passphrase using PBKDF2 (600 000
iterations, SHA-256) and held in memory for the lifetime of the tab — never
persisted, never sent.

---

## Stack

- **Next.js 15** (App Router) + **TypeScript strict**
- **Tailwind v4** with an OKLCH design-token system (`@theme`)
- **Antd 5** for complex form chrome (Input, Modal, Form, Notification)
- **Firebase v11** — Auth, Firestore, Storage (relay only)
- **Web Crypto** — PBKDF2 / AES-256-GCM
- **Canvas API** — LSB steganography
- **MediaRecorder** — Opus-encoded audio messages
- **Zustand** — in-memory key cache (tab-scoped)
- **Zod** — envelope + Firestore document schemas
- **@scure/bip39** — passphrase wordlist

---

## Getting started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure Firebase

```bash
cp .env.example .env.local
```

Fill in the six `NEXT_PUBLIC_FIREBASE_*` values from your Firebase console
(*Project Settings → Your apps → Web app*). The app will surface a friendly
"configure Firebase" screen if any of them are missing.

Then deploy the included security rules:

```bash
firebase deploy --only firestore:rules,storage:rules
```

> Both rule sets restrict access to conversation participants only and cap
> uploaded PNGs at 20 MB.

> **CORS is not required.** Stego PNGs are served through a same-origin
> proxy at `/api/stego` (see [`app/api/stego/route.ts`](./app/api/stego/route.ts))
> so canvas pixel readback works on any deployment domain without
> bucket-side configuration. The proxy pins the upstream host and bucket
> path to prevent SSRF.

### 3. (Optional) Regenerate cover images

The repo ships with eight pre-rendered 2000×1500 procedural covers. To
regenerate them and refresh their integrity hashes:

```bash
pnpm covers:generate   # writes public/covers/*.png
pnpm covers:hash       # prints COVER_HASHES literal — paste into lib/covers.ts
```

### 4. Run

```bash
pnpm dev          # http://localhost:3000
pnpm typecheck
pnpm build
```

Visit `/dev/test` for an end-to-end round-trip verification (encrypt → embed →
extract → decrypt) with stage timings.

---

## How a message moves

```
plaintext
  → envelope (zod)
  → AES-256-GCM (12-byte IV)
  → LSB embed into RGB channels of pre-loaded cover PNG
  → upload PNG to Firebase Storage
  → write {senderId, stegoUrl, coverId, ts} to Firestore

(receiver, in reverse)
  fetch PNG → verify cover hash → LSB extract → AES-GCM decrypt → decode envelope → render
```

The Firestore document never contains plaintext, ciphertext, the IV, or the
passphrase. Everything that matters is inside the PNG.

---

## Project layout

```
app/                      Next.js App Router
  (auth)/                 login, signup
  chats/[id]/             conversation pane
  dev/test/               round-trip verification page
components/
  brand/                  Wordmark, ThemeToggle
  landing/                marketing page (Hero, Pipeline, Primitives)
  auth/                   BrandPanel (split-screen left side)
  chat/                   AppShell, ConversationList, ChatView, MessageBubble, etc.
  providers/              Theme, Antd, Auth providers
lib/
  crypto.ts               PBKDF2, AES-GCM, passphrase generator (BIP39)
  stego.ts                LSB embed/extract, capacity calc
  covers.ts               cover catalog + SHA-256 verification
  envelope.ts             zod-typed text/audio envelope
  firebase.ts             lazy app init + typed wrappers
  audio.ts                MediaRecorder helpers
  pipeline.ts             runSend / runDecrypt orchestration
public/covers/            8 pre-rendered landscape PNGs (2000×1500)
scripts/                  generate-covers, hash-covers
firestore.rules           participant-only access
storage.rules             20 MB · image/png only
```

---

## Theme system

Three modes — **light**, **dark**, **system** — with light as the default.

- A blocking `<script>` in `<head>` reads the stored preference (and OS
  `prefers-color-scheme` when set to *system*) and applies the right
  `data-theme` attribute before the first paint, so there is no flash of the
  wrong theme.
- Token palette is OKLCH, neutrals tinted toward the brand hue (~75°).
- Antd ConfigProvider receives a parallel set of light / dark tokens so its
  components stay consistent with the custom Tailwind chrome.

The toggle lives in the conversation list footer and the marketing page
footer.

---

## Working agreement

- **No plaintext on the wire.** Ever. The relay sees `image/png` only.
- **Keys never leave the tab.** Cleared on sign-out, on tab close, and never
  written to `localStorage`.
- **PBKDF2 600k.** Iteration count is non-negotiable (~half a second per
  guess on a phone). Lowering it is a security regression, not a performance
  win.
- **No `any`, no `@ts-ignore`.** Strict TypeScript everywhere.

---

## Limitations (intended for v2 — see [FUTURE.md](./FUTURE.md))

- Covers are a fixed pool, not user-uploaded.
- 1:1 conversations only — no group chats.
- LSB positions are sequential, not key-derived. A naïve steganalysis tool
  would notice a slightly elevated bit-1 frequency in the lower bits.
- No anti-screenshot, no message editing, no push notifications.
# cryptalkv2
