import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/brand/ThemeToggle";

export const metadata = {
  title: "Viva Prep · CrypTalk",
  description:
    "Anticipated questions and prepared answers for the CrypTalk Major Project Phase I viva.",
  robots: { index: false, follow: false },
};

type QA = { q: string; a: React.ReactNode };
type Section = { id: string; label: string; intro: string; items: QA[] };

const sections: Section[] = [
  {
    id: "foundations",
    label: "Foundations",
    intro:
      "What CrypTalk is, why it exists, and what we are defending against.",
    items: [
      {
        q: "Describe CrypTalk in one sentence.",
        a: (
          <>
            A browser-native messaging app that encrypts every text and audio
            message with <Mark>AES-256-GCM</Mark> and hides the ciphertext
            inside the least-significant bits of a pre-verified PNG, so the
            server only ever stores what looks like an ordinary photograph.
          </>
        ),
      },
      {
        q: "Why combine encryption AND steganography? Isn't AES-256 enough?",
        a: (
          <>
            AES-256 protects the <em className="not-italic text-text">contents</em>
            {" "}of a message. It does nothing to hide the{" "}
            <em className="not-italic text-text">existence</em> of the message.
            An adversary who sees ciphertext on the wire still knows you are
            communicating, with whom, and how often — which is often enough.
            Steganography removes that signal: the network sees innocuous
            images. Encryption + steganography compose: even if steganalysis
            recovers our bitstream, the attacker still faces AES-256.
          </>
        ),
      },
      {
        q: "What is your threat model?",
        a: (
          <>
            We assume an active network adversary (reads all traffic,
            substitutes packets), an honest-but-curious server (Firebase staff,
            subpoenas, database dumps), and a clean device at send time. We do{" "}
            <em className="not-italic text-text">not</em> defend against
            malware on the user's machine, the recipient deliberately leaking
            plaintext, or a quantum adversary running Grover/Shor. Within that
            scope, a server breach yields a folder of landscape PNGs.
          </>
        ),
      },
      {
        q: "Who is this for? Why not just use Signal?",
        a: (
          <>
            Signal hides the contents of your messages but not the fact that
            you are using Signal — the metadata, the connection patterns, and
            the existence of the conversation are all visible to a network
            observer. CrypTalk is a research demonstration of a different
            primitive — covert messaging — where the goal is to look like you
            are not messaging at all.
          </>
        ),
      },
    ],
  },

  {
    id: "cryptography",
    label: "Cryptography",
    intro: "Why AES-256-GCM, how keys are derived, and what the tag proves.",
    items: [
      {
        q: "Why AES-256-GCM and not AES-CBC?",
        a: (
          <>
            GCM is an <Mark>authenticated</Mark> encryption mode — it produces
            ciphertext and a 16-byte authentication tag in a single pass. CBC
            only gives confidentiality; without a separate MAC you cannot
            detect tampering, and bolting one on introduces ordering pitfalls
            (encrypt-then-MAC is correct; MAC-then-encrypt and
            encrypt-and-MAC are not). CBC also needs PKCS#7 padding, which
            opens the door to padding-oracle attacks. GCM has neither problem
            and is hardware-accelerated via AES-NI on every modern CPU.
          </>
        ),
      },
      {
        q: "What does the GCM authentication tag actually prove?",
        a: (
          <>
            The 128-bit tag is a MAC computed over the ciphertext (and any
            additional authenticated data) using GHASH. On decrypt the
            receiver recomputes the tag and compares. If a single bit of
            ciphertext was flipped — by an attacker, by the steganographic
            channel, by anything — the tag fails to verify and the API returns
            an error rather than garbled plaintext. The receiver never
            processes corrupted input.
          </>
        ),
      },
      {
        q: "How is the IV (nonce) handled? What if it's reused?",
        a: (
          <>
            We generate a fresh 96-bit IV per message using{" "}
            <code className="font-mono">crypto.getRandomValues()</code> and
            prepend it to the payload. The receiver reads the first 12 bytes
            as the IV, the remainder as ciphertext + tag. Reusing an IV under
            the same key in GCM is{" "}
            <em className="not-italic text-danger">catastrophic</em>: it leaks
            the XOR of the two plaintexts and lets the attacker forge tags.
            That is why the IV must be random and independent per message.
          </>
        ),
      },
      {
        q: "How is the AES key derived? Why PBKDF2 at 600,000 iterations?",
        a: (
          <>
            Two participants share a six-word passphrase out-of-band. We run
            PBKDF2 with HMAC-SHA-256, a 16-byte random salt, and 600,000
            iterations to stretch it into a 256-bit AES key. Six hundred
            thousand is OWASP's 2023 recommendation for PBKDF2-SHA-256 — it
            adds about half a second of CPU per guess, which makes
            offline brute-force economically painful even for modest
            passphrases. We chose PBKDF2 over Argon2 because it ships in
            every browser via the Web Crypto API without WebAssembly.
          </>
        ),
      },
      {
        q: "Where does the key live? Does the server ever see it?",
        a: (
          <>
            The key is derived in the browser and held only in JavaScript
            memory for the duration of the session. It is never serialised,
            never sent to Firebase, never written to disk. The salt is part
            of the message header, but the salt alone is useless without the
            passphrase. Firebase sees a PNG; nothing else.
          </>
        ),
      },
      {
        q: "What does Kerckhoffs's principle mean for CrypTalk?",
        a: (
          <>
            Kerckhoffs's principle says a cryptosystem should remain secure
            even when everything about it is public — except the key. Our
            source code, embedding algorithm, AES-GCM choice, PBKDF2
            parameters, and the preset image set are all public. Security
            rests entirely on the six-word passphrase. There is no security
            through obscurity.
          </>
        ),
      },
      {
        q: "Confusion and diffusion in AES — what do they mean here?",
        a: (
          <>
            Shannon defined them in 1949. <Mark>Confusion</Mark> hides the
            relationship between key and ciphertext — AES achieves it via the
            non-linear SubBytes S-box. <Mark>Diffusion</Mark> spreads
            plaintext influence across the whole ciphertext — AES achieves it
            via ShiftRows + MixColumns. After 14 rounds of AES-256, a single
            plaintext bit affects every ciphertext bit.
          </>
        ),
      },
    ],
  },

  {
    id: "steganography",
    label: "Steganography",
    intro:
      "Why LSB on PNG, how the receiver knows where to stop, and how detectable it is.",
    items: [
      {
        q: "What is LSB steganography?",
        a: (
          <>
            Each pixel of an RGB PNG has three 8-bit channels. The
            least-significant bit of each channel contributes a value of
            1/256 to the channel's brightness — well below human perception.
            We replace those LSBs with bits of our ciphertext. The image
            still looks like the image; the colour shift is statistical
            noise.
          </>
        ),
      },
      {
        q: "Why LSB and not DCT-domain (JPEG-style) steganography?",
        a: (
          <>
            DCT methods (F5, JSteg) survive lossy compression but cost a lot
            of capacity and are more complex. PNG is lossless, so spatial-
            domain LSB is the natural fit: maximum capacity, simplest code,
            and the cover format round-trips through Firebase unchanged.
            DCT becomes relevant only if our cover were JPEG.
          </>
        ),
      },
      {
        q: "How does the receiver know how many bits to read out?",
        a: (
          <>
            We prepend a 4-byte big-endian length header to the ciphertext
            blob before embedding. The decoder reads the first 32 LSBs (= 4
            bytes), interprets that as N, then reads exactly 8N more bits.
            Without a length prefix the decoder would have to scan the entire
            image, leak the existence of a payload, and waste cycles.
          </>
        ),
      },
      {
        q: "How was the 11 MB capacity number derived?",
        a: (
          <>
            Reference cover is 6930 × 4622 = 32,030,460 pixels. Three
            channels × 1 LSB/channel = 96,091,380 bits ≈ 12 MB of raw
            capacity. Subtracting the 4-byte length prefix, the 12-byte IV,
            and the 16-byte GCM tag leaves a usable payload around 11 MB.
            That is roughly 45–50 minutes of 32 kbps voice or 90+ minutes
            at 16 kbps Opus.
          </>
        ),
      },
      {
        q: "Is plain LSB detectable? What's the answer to that?",
        a: (
          <>
            Yes — RS-analysis, chi-square tests, and tools like StegExpose
            can detect LSB embedding because it flattens the LSB
            distribution. Phase I accepts that limitation as the cost of a
            simple, reliable Phase I baseline. Phase II addresses it with{" "}
            <Mark>randomized embedding paths</Mark> (PRNG-driven pixel order
            seeded from the passphrase) and <Mark>ML-guided embedding</Mark>{" "}
            that prefers high-variance regions where the LSB distribution is
            already noisy.
          </>
        ),
      },
      {
        q: "Why preset images instead of letting users upload their own?",
        a: (
          <>
            Two reasons. <strong>Security:</strong> arbitrary user uploads
            could be malformed PNGs hitting parser CVEs, or already-stego
            carriers from a third party (forwarding attack). <strong>Quality:
            </strong> presets have known noise characteristics, so embedding
            parameters can be tuned. Phase II adds AI-based image scanning
            and sandboxing so user uploads can be safely accepted.
          </>
        ),
      },
      {
        q: "What's the visual quality after embedding (PSNR / SSIM)?",
        a: (
          <>
            For 1 LSB/channel, PSNR sits around 51 dB and SSIM &gt; 0.999 —
            visually indistinguishable from the cover. Doubling to 2 LSBs
            would double capacity to ~22 MB but drop PSNR to ~44 dB and
            start to show banding on flat regions like skies, which is
            detectable both to the eye and to steganalysis.
          </>
        ),
      },
    ],
  },

  {
    id: "architecture",
    label: "Architecture",
    intro: "Why everything is client-side and why Firebase is just a relay.",
    items: [
      {
        q: "Why client-side encryption?",
        a: (
          <>
            If encryption happened server-side, the server has plaintext at
            some moment — which means a database leak, a malicious admin, a
            TLS-terminating proxy, or a subpoena reveals everything. With
            client-side encryption the server only ever holds opaque PNG
            bytes. Even Firebase engineers cannot read the messages. The
            server is reduced to a CDN with addressing.
          </>
        ),
      },
      {
        q: "Why Firebase, and what does it actually store?",
        a: (
          <>
            Firebase Storage holds the binary blobs (the stego-PNGs);
            Firestore holds lightweight metadata — conversation IDs, image
            pointers, timestamps. We don't need a custom backend because the
            server is intentionally dumb. Firebase's security rules scope
            access to authenticated users without us writing server code.
          </>
        ),
      },
      {
        q: "Why Next.js?",
        a: (
          <>
            File-based routing, server-rendered marketing pages for SEO and
            speed, and a single-deploy story (Vercel-class hosting). The
            actual cryptography and steganography run purely on the client;
            Next.js is just the shell.
          </>
        ),
      },
      {
        q: "Why Web Crypto API instead of a JavaScript library like CryptoJS?",
        a: (
          <>
            Web Crypto is implemented natively in the browser, runs on
            hardware-accelerated AES-NI, executes in constant time (resistant
            to timing side channels), and is the W3C standard. CryptoJS is
            pure JavaScript — slower, not constant-time, and historically has
            had API design issues like ambiguous string-to-bytes encoding.
            For a security project, the native API is the only correct
            choice.
          </>
        ),
      },
      {
        q: "Why HTML5 Canvas for the embedding step?",
        a: (
          <>
            <code className="font-mono">CanvasRenderingContext2D.getImageData()</code>{" "}
            is the only browser API that exposes raw pixel bytes. It returns
            a <code className="font-mono">Uint8ClampedArray</code> of
            interleaved RGBA bytes which we manipulate directly, then write
            back via <code className="font-mono">putImageData()</code> and
            re-encode as PNG. No native binding, no WASM, no extra
            dependencies.
          </>
        ),
      },
      {
        q: "Where does the SHA-256 hash verification fit?",
        a: (
          <>
            Each stego-image carries a SHA-256 fingerprint of itself.
            Firebase storage rules and the receiver both verify this hash
            before decryption is attempted. It catches in-transit corruption
            and trivial server-side tampering — though note that GCM's
            authentication tag would catch ciphertext tampering anyway. The
            hash is a defence-in-depth check at the carrier level.
          </>
        ),
      },
    ],
  },

  {
    id: "audio",
    label: "Audio in image",
    intro:
      "The piece most existing stego-messaging papers don't attempt.",
    items: [
      {
        q: "How is audio captured and encoded in the browser?",
        a: (
          <>
            We use <code className="font-mono">MediaRecorder</code> with
            Opus in WebM at 16–32 kbps. The resulting Blob is read as an{" "}
            <code className="font-mono">ArrayBuffer</code>, encrypted with
            AES-256-GCM exactly like a text payload, then handed to the same
            LSB embedder. Audio is bytes; the pipeline doesn't care that
            they originated from a microphone.
          </>
        ),
      },
      {
        q: "Why image-based audio steganography rather than audio-in-audio?",
        a: (
          <>
            Two reasons. The cover should be plausible — landscape PNGs
            shared between friends are unremarkable, whereas an unsolicited
            audio file is suspicious. Capacity is also higher: a single 38 MB
            PNG carries ~11 MB of payload, while audio cover stego (LSB on
            WAV) trades capacity for survivability against compression we
            don't need anyway.
          </>
        ),
      },
      {
        q: "What's the upper bound on audio length per image?",
        a: (
          <>
            With 11 MB of usable payload: 45–50 minutes at 32 kbps,
            23–25 minutes at 64 kbps, 91–93 minutes at 16 kbps Opus. Real
            voice notes are 5–60 seconds, so we are nowhere near the
            ceiling.
          </>
        ),
      },
    ],
  },

  {
    id: "attacks",
    label: "Attacks & edge cases",
    intro: "What goes wrong, and what we do about it.",
    items: [
      {
        q: "What happens if the server is compromised?",
        a: (
          <>
            The attacker gains a folder of innocent landscape PNGs and
            metadata about who exchanged which image. They have no
            ciphertext-plaintext correlation, no keys, no salts that aren't
            embedded in the carrier. Recovering plaintext requires
            (a) detecting the steganography, (b) extracting the bitstream,
            (c) breaking AES-256, (d) brute-forcing the passphrase through
            PBKDF2-600k. Each of those is independently expensive.
          </>
        ),
      },
      {
        q: "What happens if the device is compromised?",
        a: (
          <>
            We lose. Any messaging app loses to malware on the endpoint —
            the attacker sees keystrokes and decrypted plaintext as the user
            does. Phase II's anti-screenshot work (right-click suppression,
            page-blur on capture detection) raises the cost slightly but is
            not a security boundary; it's discouragement against casual
            screen capture, not a defence against malware.
          </>
        ),
      },
      {
        q: "Can an attacker replay an old stego-image?",
        a: (
          <>
            In Phase I, yes — the receiver would decrypt successfully and
            see a duplicate message. That is a UX problem more than a
            confidentiality problem. Phase II adds per-message timestamps
            inside GCM's additional-authenticated-data field, plus a sliding
            window of recently-seen message IDs to reject replays.
          </>
        ),
      },
      {
        q: "What if someone modifies the stego-image in transit?",
        a: (
          <>
            The GCM authentication tag fails to verify and decryption raises
            an error before any plaintext is exposed. The receiver displays
            "message tampered" rather than rendering corrupted content. This
            is the entire reason GCM was chosen over CBC.
          </>
        ),
      },
      {
        q: "What does steganalysis look like as a real attack?",
        a: (
          <>
            An adversary builds a classifier on cover PNGs and stego PNGs.
            Tools like StegExpose run statistical tests (chi-square,
            RS-analysis) on suspicious images. Phase I is detectable to such
            tools because we use sequential 1-LSB embedding. The mitigation
            is what Phase II proposes: pseudo-random embedding order and
            content-adaptive embedding, both of which make the LSB
            distribution match the cover distribution.
          </>
        ),
      },
      {
        q: "What if the passphrase is weak?",
        a: (
          <>
            PBKDF2-600k buys roughly half a second per guess, so a six-word
            EFF-list passphrase (~77 bits of entropy) would take on the
            order of 2⁷⁷ × 0.5s of CPU to brute-force — astronomically out of
            reach. A two-word passphrase with 26 bits of entropy is
            crackable in days. We mandate six words.
          </>
        ),
      },
    ],
  },

  {
    id: "comparison",
    label: "Comparison with literature",
    intro: "What's already in the field and what we add.",
    items: [
      {
        q: "How do you extend Gomathi & Radhika (2025)?",
        a: (
          <>
            Their dual-layer system demonstrates that combining AES with LSB
            is feasible for text, but it is a CLI prototype using AES-CBC
            without integrity. We extend it with (1) AES-256-GCM for
            authenticated encryption, (2) audio embedded in images, (3)
            browser-native deployment via Web Crypto + Canvas, (4) a
            pre-verified preset image library, and (5) real-time multi-user
            chat through Firebase. Their paper informed the approach;
            CrypTalk is the production-quality realisation.
          </>
        ),
      },
      {
        q: "How is this different from Sherwin et al. (2024)?",
        a: (
          <>
            Their system also uses AES-CBC with arbitrary user uploads.
            CrypTalk uses authenticated encryption (no padding-oracle
            surface), restricts carriers to a verified preset set, and adds
            audio support and SHA-256 carrier validation.
          </>
        ),
      },
      {
        q: "What's your novel contribution?",
        a: (
          <>
            Three things. (1) Audio-in-image messaging — most existing
            literature handles text only. (2) Authenticated encryption
            (AES-GCM) at the messaging layer, which most surveyed work
            lacks. (3) A browser-native stack with no client install, which
            most prior work (CLI, Python, desktop GUI) does not deliver.
          </>
        ),
      },
    ],
  },

  {
    id: "performance",
    label: "Performance",
    intro: "Where the time goes and how we measured it.",
    items: [
      {
        q: "How long does the round-trip take?",
        a: (
          <>
            Encryption with Web Crypto AES-GCM on a 1 KB plaintext: ~4 ms.
            LSB embedding into a 2000 × 1500 PNG including re-encoding:
            ~350 ms. Firebase Storage upload over a typical home
            connection: ~250 ms. End-to-end the user sees under 600 ms
            from "send" to "delivered."
          </>
        ),
      },
      {
        q: "What's the bottleneck?",
        a: (
          <>
            PNG re-encoding after pixel manipulation. The bit-level
            embedding itself is O(N) and trivial; the cost is asking the
            browser's PNG encoder to compress 9 million pixels with a fresh
            zlib stream. Caching cover decode results between messages
            shaves another 100 ms for repeat sends.
          </>
        ),
      },
      {
        q: "Does this scale to long voice notes?",
        a: (
          <>
            Yes. An 11 MB stego-image carries 90+ minutes of 16 kbps Opus.
            Encryption time scales linearly with payload, so a 1 MB voice
            note costs ~400 ms instead of ~4 ms — still well under
            perceptible latency.
          </>
        ),
      },
    ],
  },

  {
    id: "future",
    label: "Future work",
    intro: "What Phase II adds and why it matters.",
    items: [
      {
        q: "What is the single most important Phase II improvement?",
        a: (
          <>
            Steganalysis resistance. Phase I uses sequential LSB which
            modern detectors flag readily. Phase II's randomized,
            content-adaptive embedding is what moves the project from
            "neat undergraduate demo" to "publishable result."
          </>
        ),
      },
      {
        q: "How would group chat work?",
        a: (
          <>
            Two options. Option A: encrypt the message under a per-group
            shared key derived from a group passphrase — simple, but
            membership changes mean re-keying. Option B: encrypt the
            payload key separately under each member's public key (Signal-
            style sender-keys), embedded in additional LSB regions of the
            same image. Option B scales better but requires per-user
            keypairs we don't have today.
          </>
        ),
      },
      {
        q: "Stego-video — why bother?",
        a: (
          <>
            Two wins. Capacity: a 30-second 1080p video has tens of millions
            of pixels per frame across hundreds of frames — gigabytes of
            payload. Detectability: video has natural inter-frame noise
            that masks LSB modulation far better than a static image.
          </>
        ),
      },
    ],
  },
];

export default function QnAPage() {
  return (
    <main className="min-h-dvh">
      <Nav />
      <Hero />
      <Toc />
      {sections.map((s) => (
        <SectionBlock key={s.id} section={s} />
      ))}
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="px-5 sm:px-6 lg:px-12 py-5 lg:py-6 flex items-center justify-between gap-3">
      <Link href="/" aria-label="CrypTalk home" className="shrink-0">
        <Wordmark size="sm" />
      </Link>
      <div className="flex items-center gap-1 sm:gap-2 text-sm">
        <Link
          href="/about"
          className="hidden sm:inline-flex px-3 sm:px-4 py-2 rounded-md text-text-2 hover:text-text transition-colors whitespace-nowrap"
        >
          About
        </Link>
        <Link
          href="/login"
          className="px-3 sm:px-4 py-2 rounded-md text-text-2 hover:text-text transition-colors whitespace-nowrap"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-3 sm:px-4 py-2 rounded-md border border-accent/40 text-accent hover:bg-accent/10 transition-colors whitespace-nowrap"
        >
          <span className="sm:hidden">Sign up</span>
          <span className="hidden sm:inline">Make an account</span>
        </Link>
      </div>
    </nav>
  );
}

function Hero() {
  const totalQs = sections.reduce((n, s) => n + s.items.length, 0);
  return (
    <section className="px-5 sm:px-6 lg:px-12 pt-8 sm:pt-12 lg:pt-16 max-w-[1100px] mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
        Viva preparation · internal · not linked
      </p>
      <h1 className="font-display text-[clamp(2.2rem,7vw,4.8rem)] leading-[0.98] mt-4 sm:mt-5 text-balance">
        Questions a panel might ask, answered ahead of time.
      </h1>
      <p className="mt-5 sm:mt-6 text-[0.95rem] sm:text-base lg:text-lg text-text-2 max-w-2xl text-pretty leading-relaxed">
        {totalQs} questions across {sections.length} topics, written so a
        glance refreshes the answer. Tap any question to expand. None of
        this is reachable from the navigation — visit{" "}
        <code className="font-mono text-text">/qna</code> directly.
      </p>
    </section>
  );
}

function Toc() {
  return (
    <nav
      aria-label="Topics"
      className="px-5 sm:px-6 lg:px-12 mt-10 sm:mt-12 max-w-[1100px] mx-auto"
    >
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden border">
        {sections.map((s, i) => (
          <li key={s.id} className="bg-bg">
            <a
              href={`#${s.id}`}
              className="block px-4 py-3 text-sm hover:bg-surface transition-colors"
            >
              <span className="font-mono text-[10px] text-muted block">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="text-text-2 hover:text-text">{s.label}</span>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function SectionBlock({ section }: { section: Section }) {
  return (
    <section
      id={section.id}
      className="px-5 sm:px-6 lg:px-12 py-14 sm:py-16 lg:py-20 max-w-[1100px] mx-auto scroll-mt-24"
    >
      <header className="mb-8 sm:mb-10 grid lg:grid-cols-[280px_1fr] gap-4 lg:gap-12 items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            {section.label}
          </p>
          <h2 className="font-display text-[clamp(1.6rem,4.5vw,2.6rem)] mt-2 leading-[1.05] text-balance">
            {section.label}.
          </h2>
        </div>
        <p className="text-[0.95rem] sm:text-base text-text-2 max-w-xl text-pretty leading-relaxed lg:justify-self-end">
          {section.intro}
        </p>
      </header>

      <ol className="space-y-px bg-border rounded-2xl overflow-hidden border">
        {section.items.map((qa, i) => (
          <li key={i} className="bg-bg">
            <QABlock qa={qa} index={i} />
          </li>
        ))}
      </ol>
    </section>
  );
}

function QABlock({ qa, index }: { qa: QA; index: number }) {
  return (
    <details className="group">
      <summary className="cursor-pointer list-none px-5 sm:px-6 lg:px-7 py-5 sm:py-6 flex items-start gap-4 sm:gap-5 hover:bg-surface/60 transition-colors">
        <span className="font-mono text-xs text-muted shrink-0 pt-1.5">
          {String(index + 1).padStart(2, "0")}
        </span>
        <h3 className="flex-1 font-display text-lg sm:text-xl leading-snug text-text">
          {qa.q}
        </h3>
        <Caret />
      </summary>
      <div className="px-5 sm:px-6 lg:px-7 pb-6 sm:pb-7 pl-12 sm:pl-14 lg:pl-15">
        <div className="text-[0.95rem] sm:text-base text-text-2 leading-relaxed text-pretty max-w-3xl">
          {qa.a}
        </div>
      </div>
    </details>
  );
}

function Caret() {
  return (
    <svg
      aria-hidden
      width="14"
      height="14"
      viewBox="0 0 14 14"
      className="shrink-0 mt-2 text-muted transition-transform duration-200 ease-out group-open:rotate-180"
    >
      <path
        d="M3 5l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-text font-medium underline decoration-accent/60 decoration-1 underline-offset-4">
      {children}
    </span>
  );
}

function Footer() {
  return (
    <footer className="px-5 sm:px-6 lg:px-12 py-8 sm:py-10 mt-10 sm:mt-12 border-t border-border/50 text-xs text-muted flex flex-wrap items-center gap-x-6 gap-y-3 justify-between">
      <Wordmark size="sm" className="opacity-60" />
      <span className="text-[11px] sm:text-xs leading-relaxed">
        Internal viva prep · DSCE · CSE Cybersecurity · Group G-13
      </span>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="font-mono">v0.1</span>
      </div>
    </footer>
  );
}
