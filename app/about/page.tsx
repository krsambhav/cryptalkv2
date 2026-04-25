import Image from "next/image";
import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/brand/ThemeToggle";

export const metadata = {
  title: "About · CrypTalk",
  description:
    "CrypTalk: Enhancing Privacy through Encrypted Steganographic Messaging — Major Project Phase I, Department of Computer Science & Engineering (Cybersecurity), Dayananda Sagar College of Engineering.",
};

export default function AboutPage() {
  return (
    <main className="min-h-dvh">
      <Nav />
      <Masthead />
      <ProjectTitle />
      <People />
      <Abstract />
      <ProblemAndObjectives />
      <Methodology />
      <Architecture />
      <Outcomes />
      <FutureScope />
      <References />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="px-6 lg:px-12 py-6 flex items-center justify-between">
      <Link href="/" aria-label="CrypTalk home">
        <Wordmark size="sm" />
      </Link>
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/"
          className="px-4 py-2 rounded-md text-text-2 hover:text-text transition-colors"
        >
          Home
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 rounded-md text-text-2 hover:text-text transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-4 py-2 rounded-md border border-accent/40 text-accent hover:bg-accent/10 transition-colors"
        >
          Make an account
        </Link>
      </div>
    </nav>
  );
}

function Masthead() {
  return (
    <section className="px-6 lg:px-12 pt-10 lg:pt-16 max-w-[1200px] mx-auto">
      <div className="rounded-2xl border bg-surface px-8 lg:px-14 py-10 lg:py-14 surface-grain animate-fade-up">
        <div className="flex items-start gap-6 lg:gap-8">
          <CollegeCrest />
          <div className="flex-1 min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
              Established 1979 · Bengaluru
            </p>
            <h1 className="font-display text-[clamp(1.5rem,3.4vw,2.6rem)] leading-[1.05] mt-2 text-balance">
              Dayananda Sagar College of Engineering
            </h1>
            <p className="mt-3 text-text-2 text-sm lg:text-base">
              Department of Computer Science &amp; Engineering
              <span className="text-accent"> · Cybersecurity</span>
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-muted">
              <Tag>Major Project Phase&nbsp;I</Tag>
              <Tag>2025 — 2026</Tag>
              <Tag>Group G-13</Tag>
              <Tag>02 · 12 · 2025</Tag>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 before:content-[''] before:w-1 before:h-1 before:rounded-full before:bg-accent">
      {children}
    </span>
  );
}

function CollegeCrest() {
  return (
    <div className="shrink-0 grid place-items-center w-24 h-24 lg:w-28 lg:h-28 rounded-full bg-white p-2 relative ring-1 ring-accent/40">
      <Image
        src="/dsce-logo.png"
        alt="Dayananda Sagar Institutions"
        width={224}
        height={224}
        priority
        className="w-full h-full object-contain"
      />
    </div>
  );
}

function ProjectTitle() {
  return (
    <section className="px-6 lg:px-12 pt-16 lg:pt-24 max-w-[1200px] mx-auto">
      <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
        Literature Review Presentation · Domain: Cryptography &amp; Steganography
      </p>
      <h2 className="font-display text-[clamp(2.6rem,6vw,5.5rem)] leading-[0.95] mt-5 text-balance">
        <span className="text-accent">CrypTalk:</span> Enhancing Privacy through
        Encrypted Steganographic Messaging.
      </h2>
      <p className="mt-8 text-lg text-text-2 max-w-3xl text-pretty leading-relaxed">
        A browser-native messaging system that encrypts every text and audio
        message with AES-256-GCM and threads the ciphertext into the
        least-significant bits of a pre-verified PNG. The server only ever sees
        a picture. The picture only ever looks like a picture.
      </p>
    </section>
  );
}

function People() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted">
          Presented by
        </p>
        <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] mt-2 leading-[1]">
          Two students, one guide.
        </h3>
      </header>

      <div className="grid lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border">
        <PersonCard
          role="Student"
          name="Amritraj Vats"
          usn="1DS22CY006"
          initials="AV"
        />
        <PersonCard
          role="Student"
          name="Baidurya Phukan"
          usn="1DS22CY011"
          initials="BP"
        />
        <PersonCard
          role="Guide"
          name="Dr. Mohammed Tajuddin"
          usn="HOD · CSE (Cyber Security)"
          initials="MT"
          highlight
        />
      </div>
    </section>
  );
}

function PersonCard({
  role,
  name,
  usn,
  initials,
  highlight = false,
}: {
  role: string;
  name: string;
  usn: string;
  initials: string;
  highlight?: boolean;
}) {
  return (
    <article
      className={`p-8 lg:p-10 flex flex-col gap-6 ${
        highlight ? "bg-surface" : "bg-bg"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {role}
        </span>
        <span
          aria-hidden
          className={`w-1.5 h-1.5 rounded-full ${
            highlight ? "bg-accent" : "bg-border-strong"
          }`}
        />
      </div>
      <Avatar initials={initials} highlight={highlight} />
      <div>
        <h4 className="font-display text-2xl leading-[1.05]">{name}</h4>
        <p className="mt-1 text-sm font-mono text-text-2">{usn}</p>
      </div>
    </article>
  );
}

function Avatar({
  initials,
  highlight,
}: {
  initials: string;
  highlight: boolean;
}) {
  return (
    <div
      aria-hidden
      className={`w-16 h-16 rounded-full grid place-items-center font-display text-xl tracking-tight ${
        highlight
          ? "bg-accent text-bg"
          : "bg-bg-2 text-accent border border-accent/30"
      }`}
    >
      {initials}
    </div>
  );
}

function Abstract() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <div className="grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Abstract
          </p>
          <h3 className="font-display text-[clamp(1.6rem,3vw,2.4rem)] mt-2 leading-[1]">
            What we built and why.
          </h3>
        </div>
        <div className="space-y-5 text-text-2 text-pretty leading-relaxed lg:text-[1.05rem]">
          <p>
            Secure digital communication still faces many risks — hackers
            accessing private data, leakage of message metadata, and attacks on
            user devices — even when the messages themselves are encrypted. In
            most messaging apps, once a user logs in the actual message content
            becomes visible. If someone gets access to the device or account,
            they can easily read everything.
          </p>
          <p>
            CrypTalk solves this with a multi-layer system that pairs strong
            encryption with image-based concealment. All text and audio is
            first encrypted using <Mark>AES-256-GCM</Mark>; the encrypted bytes
            are then hidden inside a set of safe, pre-verified images using{" "}
            <Mark>LSB steganography</Mark>, performed entirely in the browser.
          </p>
          <p>
            The system not only encrypts the message but also{" "}
            <em className="text-text not-italic">hides its existence</em>,
            making attacks like interception, screenshots, or device compromise
            far less effective. Because all operations happen client-side,
            nothing sensitive is ever stored or exposed on the server.
          </p>
        </div>
      </div>
    </section>
  );
}

function Mark({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-text font-medium underline decoration-accent/60 decoration-1 underline-offset-4">
      {children}
    </span>
  );
}

function ProblemAndObjectives() {
  const objectives = [
    {
      kicker: "01",
      title: "Design and develop",
      desc: "A secure web-based messaging application that lets users communicate with text and audio hidden inside images via steganography.",
    },
    {
      kicker: "02",
      title: "AES-256 encryption",
      desc: "Apply authenticated encryption to every text and audio payload before embedding, so ciphertext alone is useless even if extracted.",
    },
    {
      kicker: "03",
      title: "Pre-scanned images",
      desc: "Restrict carriers to a fixed set of verified PNGs to prevent malware-laced or untrusted uploads from reaching the recipient.",
    },
    {
      kicker: "04",
      title: "Privacy and integrity",
      desc: "Combine image scanning, GCM authentication tags, and SHA-256 hash checks to guard against tampering and data leakage.",
    },
    {
      kicker: "05",
      title: "Frictionless UX",
      desc: "A chat interface that is genuinely usable — encryption and steganography stay invisible to the person sending the message.",
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <div className="grid lg:grid-cols-12 gap-12">
        <div className="lg:col-span-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Problem statement
          </p>
          <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mt-2 leading-[1.02] text-balance">
            What happens after a login is breached?
          </h3>
          <p className="mt-6 text-text-2 leading-relaxed text-pretty">
            In most messaging applications, message content is stored or
            displayed in plain text once the user logs in. If the device or
            account is hacked, the attacker can easily access private messages.
            CrypTalk addresses this by hiding encrypted text and audio{" "}
            <em className="text-text not-italic">inside</em> images, so
            sensitive messages remain hidden and unreadable even when the
            attacker reaches the user's account or device.
          </p>
        </div>

        <div className="lg:col-span-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-muted mb-5">
            Objectives
          </p>
          <ul className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden border">
            {objectives.map((o, i) => (
              <li
                key={o.kicker}
                className={`bg-bg p-6 ${
                  i === objectives.length - 1 && objectives.length % 2 === 1
                    ? "sm:col-span-2"
                    : ""
                }`}
              >
                <div className="flex items-baseline justify-between mb-3">
                  <span className="font-mono text-xs text-muted">
                    {o.kicker}
                  </span>
                  <span aria-hidden className="w-1 h-1 rounded-full bg-accent" />
                </div>
                <h4 className="font-display text-lg mb-2 leading-tight">
                  {o.title}
                </h4>
                <p className="text-sm text-text-2 leading-relaxed text-pretty">
                  {o.desc}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Methodology() {
  const steps = [
    {
      n: "01",
      title: "AES-256-GCM Encryption",
      desc: "Text and audio data are encrypted using AES-256-GCM, ensuring confidentiality and integrity in a single authenticated pass.",
    },
    {
      n: "02",
      title: "LSB via HTML5 Canvas",
      desc: "Encrypted bytes are written into the least-significant bit of each R, G, and B channel of a preset cover PNG using the Canvas API.",
    },
    {
      n: "03",
      title: "Preset & Pre-scanned Images",
      desc: "Only a fixed set of verified covers may be used, eliminating malware-infected uploads from reaching the receiver.",
    },
    {
      n: "04",
      title: "Integrity & Hash Verification",
      desc: "Each image carries a SHA-256 fingerprint; any alteration during transmission is detected before decryption is even attempted.",
    },
    {
      n: "05",
      title: "Audio-in-Image Embedding",
      desc: "Voice notes are converted to bytes, AES-encrypted, and embedded into the same preset image pipeline as text.",
    },
    {
      n: "06",
      title: "Client-side Round-trip",
      desc: "Built on Node.js, Next.js, and Firebase. All encryption and decryption happen in the browser; the server only handles opaque PNGs.",
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <header className="mb-12 grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Proposed methodology
          </p>
          <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mt-2 leading-[1.02]">
            Six stations on the round-trip.
          </h3>
        </div>
        <p className="text-text-2 text-pretty leading-relaxed max-w-xl lg:justify-self-end">
          Each step is small, deterministic, and verifiable. None of them
          require trust in the server.
        </p>
      </header>

      <ol className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border rounded-2xl overflow-hidden border">
        {steps.map((s) => (
          <li key={s.n} className="bg-bg p-7 lg:p-8">
            <div className="flex items-baseline justify-between mb-5">
              <span className="font-mono text-xs text-muted">{s.n}</span>
              <span aria-hidden className="w-1 h-1 rounded-full bg-accent" />
            </div>
            <h4 className="font-display text-xl mb-3 leading-tight">
              {s.title}
            </h4>
            <p className="text-sm text-text-2 leading-relaxed text-pretty">
              {s.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Architecture() {
  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          System architecture
        </p>
        <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mt-2 leading-[1.02] text-balance">
          Four bands of work, one quiet PNG.
        </h3>
      </header>

      <div className="rounded-2xl border bg-bg-2 p-6 lg:p-10 surface-grain">
        <div className="grid lg:grid-cols-4 gap-3">
          <Band
            label="Input"
            color="oklch(70% 0.10 230)"
            steps={["Browser UI", "Text or Audio", "Blob transform"]}
          />
          <Band
            label="Encryption"
            color="oklch(78% 0.13 75)"
            steps={["Generate AES key", "Encrypt data", "GCM auth tag"]}
          />
          <Band
            label="Steganography"
            color="oklch(70% 0.13 320)"
            steps={["Bytes → bitstream", "Embed in PNG", "Stego-image"]}
          />
          <Band
            label="Transport"
            color="oklch(72% 0.10 150)"
            steps={["Upload to Firebase", "Receiver downloads", "Extract & decrypt"]}
          />
        </div>

        <div className="mt-10 grid sm:grid-cols-3 gap-px bg-border rounded-xl overflow-hidden border">
          <Stat label="Cipher" value="AES-256-GCM" sub="Authenticated encryption" />
          <Stat label="KDF" value="PBKDF2" sub="600,000 iterations" />
          <Stat label="Capacity" value="≈ 11 MB" sub="per 6930×4622 PNG" />
        </div>

        <p className="mt-8 text-sm text-text-2 leading-relaxed max-w-3xl text-pretty">
          A single 37.6 MB cover PNG yields roughly{" "}
          <Mark>96 million bits</Mark> of carrying capacity at one LSB per
          channel — enough for 45–50 minutes of 32 kbps voice, or 91–93 minutes
          at 16 kbps. Real-world payloads are nowhere near that ceiling.
        </p>
      </div>
    </section>
  );
}

function Band({
  label,
  steps,
  color,
}: {
  label: string;
  steps: string[];
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border-strong/60 bg-bg p-5">
      <div className="flex items-center gap-2 mb-4">
        <span
          aria-hidden
          className="w-2 h-2 rounded-full"
          style={{ background: color }}
        />
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
          {label}
        </span>
      </div>
      <ul className="space-y-2.5">
        {steps.map((s, i) => (
          <li
            key={s}
            className="flex items-start gap-2.5 text-sm text-text-2 leading-snug"
          >
            <span className="font-mono text-[10px] text-faint mt-0.5 w-4 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span>{s}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="bg-bg p-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        {label}
      </p>
      <p className="font-display text-2xl mt-2 leading-tight">{value}</p>
      <p className="text-xs text-text-2 mt-1.5">{sub}</p>
    </div>
  );
}

function Outcomes() {
  const items = [
    {
      title: "A working web app",
      desc: "Real users exchange text and audio inside preset PNGs using AES-256-GCM + LSB, end-to-end in the browser.",
    },
    {
      title: "Audio-in-image",
      desc: "Voice notes embedded in static images — something most existing systems do not attempt.",
    },
    {
      title: "Real-time workflow",
      desc: "Node.js + Firebase + Next.js deliver live chat with local encryption and no plaintext on the server.",
    },
    {
      title: "Validated payload",
      desc: "Up to 11 MB of hidden data per image — enough for long-form voice, proven feasible for daily use.",
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <header className="mb-12">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          Possible outcomes
        </p>
        <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mt-2 leading-[1.02] text-balance">
          What success looks like for Phase&nbsp;I.
        </h3>
      </header>

      <div className="grid sm:grid-cols-2 gap-px bg-border rounded-2xl overflow-hidden border">
        {items.map((o, i) => (
          <article
            key={o.title}
            className="bg-bg p-8 lg:p-9 group hover:bg-surface transition-colors"
          >
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-mono text-xs text-muted">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span aria-hidden className="w-1 h-1 rounded-full bg-accent" />
            </div>
            <h4 className="font-display text-2xl mb-3 group-hover:text-accent transition-colors">
              {o.title}
            </h4>
            <p className="text-text-2 text-sm leading-relaxed text-pretty">
              {o.desc}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

function FutureScope() {
  const items = [
    {
      n: "01",
      title: "AI-based steganalysis resistance",
      desc: "Randomized LSB patterns, ML-guided embedding, and adversarial stego patterns to resist modern detectors.",
    },
    {
      n: "02",
      title: "Verified user uploads",
      desc: "AI-driven malicious-image scanning and file sandboxing so users can safely bring their own covers.",
    },
    {
      n: "03",
      title: "Multi-user group chat",
      desc: "Multiple recipients per stego-image with per-member key management — WhatsApp groups, but invisible.",
    },
    {
      n: "04",
      title: "Anti-screenshot layer",
      desc: "Browser-side defenses: blur on capture, right-click suppression, JS-based recording detection.",
    },
    {
      n: "05",
      title: "Stego-video messaging",
      desc: "Frame-by-frame embedding for video — vastly higher capacity, even harder to detect.",
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <header className="mb-12 grid lg:grid-cols-[280px_1fr] gap-12 lg:gap-20 items-end">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
            Future scope
          </p>
          <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mt-2 leading-[1.02]">
            Where Phase&nbsp;II goes next.
          </h3>
        </div>
        <p className="text-text-2 text-pretty leading-relaxed max-w-xl lg:justify-self-end">
          Phase I lands a working prototype. Phase II hardens it against modern
          detection and broadens the carrier surface.
        </p>
      </header>

      <ol className="space-y-px bg-border rounded-2xl overflow-hidden border">
        {items.map((it) => (
          <li
            key={it.n}
            className="bg-bg p-6 lg:p-8 grid grid-cols-[auto_1fr] sm:grid-cols-[auto_240px_1fr] gap-6 lg:gap-10 items-start"
          >
            <span className="font-mono text-xs text-muted pt-1">{it.n}</span>
            <h4 className="font-display text-xl leading-tight">{it.title}</h4>
            <p className="text-sm text-text-2 leading-relaxed text-pretty">
              {it.desc}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function References() {
  const refs = [
    {
      n: "[1]",
      authors: "S. Gomathi & C. Radhika",
      year: "2025",
      title:
        "A Secure Messaging Application Using Steganography and AES Encryption: A Dual-Layer Secure Messaging System",
      venue: "The Scientific Temper Journal",
    },
    {
      n: "[2]",
      authors: "Aaren Sherwin S, E. Immanuel Simeon, C.A. Subasini, Adlin Sheeba",
      year: "2024",
      title:
        "Secure Image Messaging Platform Utilizing Image Steganography and AES Encryption",
      venue: "EasyChair Proceedings (preprint)",
    },
    {
      n: "[3]",
      authors:
        "T. Radivilova, I. Dobrynin, A. Snihurov, S. Stanhei, S. Bulba",
      year: "2025",
      title: "Image Steganography Method Using LSB and AES",
      venue: "CEUR-WS Conference Papers",
    },
    {
      n: "[4]",
      authors: "B. Meng, X. Yuan, Q. Zhang, C. T. Lam, G. Huang",
      year: "2025",
      title:
        "Encryption-Then-Embedding Hybrid Data Hiding in Medical Images",
      venue: "Information Sciences Letters",
    },
    {
      n: "[5]",
      authors: "S. K. Abdullah & A. M. Fadhil",
      year: "2025",
      title:
        "Enhancing Data Security Through Web-Based Steganography Applications",
      venue: "JISEM",
    },
    {
      n: "[6]",
      authors:
        "M. A. Nasr, W. El-Shafai, E. M. El-Rabaie, A. S. El-Fishawy, et al.",
      year: "2024",
      title:
        "A Robust Audio Steganography Technique Based on Image Encryption and ISTFT",
      venue: "Scientific Reports (Springer Nature)",
    },
  ];

  return (
    <section className="px-6 lg:px-12 py-16 lg:py-20 max-w-[1200px] mx-auto">
      <header className="mb-10">
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-accent">
          References
        </p>
        <h3 className="font-display text-[clamp(1.8rem,3.5vw,2.8rem)] mt-2 leading-[1.02]">
          The shoulders we stand on.
        </h3>
      </header>

      <ul className="space-y-px bg-border rounded-2xl overflow-hidden border">
        {refs.map((r) => (
          <li
            key={r.n}
            className="bg-bg p-6 lg:p-7 grid sm:grid-cols-[auto_1fr_auto] gap-x-6 gap-y-2 items-baseline"
          >
            <span className="font-mono text-xs text-accent">{r.n}</span>
            <div>
              <p className="text-sm text-text leading-snug">{r.title}</p>
              <p className="text-xs text-text-2 mt-1">{r.authors}</p>
            </div>
            <span className="font-mono text-[11px] text-muted whitespace-nowrap">
              {r.venue} · {r.year}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 lg:px-12 py-10 mt-12 border-t border-border/50 text-xs text-muted flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      <Wordmark size="sm" className="opacity-60" />
      <span>
        Major Project Phase I · DSCE · Cybersecurity · 2025–2026 · Group G-13
      </span>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="font-mono">v0.1</span>
      </div>
    </footer>
  );
}
