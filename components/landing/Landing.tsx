import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { CipherStream } from "./CipherStream";
import { Pipeline } from "./Pipeline";

export function Landing() {
  return (
    <main className="min-h-dvh">
      <Nav />
      <Hero />
      <Pipeline />
      <Primitives />
      <CTASection />
      <Footer />
    </main>
  );
}

function Nav() {
  return (
    <nav className="px-6 lg:px-12 py-6 flex items-center justify-between">
      <Wordmark size="sm" />
      <div className="flex items-center gap-2 text-sm">
        <Link
          href="/about"
          className="px-4 py-2 rounded-md text-text-2 hover:text-text transition-colors"
        >
          About this project
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

function Hero() {
  return (
    <section className="px-6 lg:px-12 pt-12 lg:pt-20 pb-24 grid lg:grid-cols-[1.1fr_1fr] gap-16 items-center max-w-[1400px] mx-auto">
      <div className="animate-fade-up">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">
          private messaging · academic build
        </p>
        <h1 className="font-display text-[clamp(3rem,7vw,6.5rem)] mt-5 leading-[0.92] text-balance">
          Words that{" "}
          <em className="not-italic text-accent">vanish into</em>
          {" "}an ordinary photograph.
        </h1>
        <p className="mt-7 text-lg text-text-2 max-w-xl text-pretty leading-relaxed">
          CrypTalk encrypts every message with AES-256-GCM, then weaves the ciphertext
          into the least-significant bits of a landscape PNG. The server only ever sees
          a picture. The picture only ever looks like a picture.
        </p>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <Link
            href="/signup"
            className="group inline-flex items-center gap-3 rounded-md bg-accent text-bg px-5 py-3 font-medium transition-transform hover:translate-x-0.5"
          >
            Start writing
            <Arrow className="transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/dev/test"
            className="text-sm text-text-2 hover:text-text underline-offset-4 hover:underline"
          >
            See the round-trip test
          </Link>
        </div>

        <div className="mt-14 flex items-center gap-6 text-xs text-muted">
          <Spec label="cipher" value="AES-256-GCM" />
          <Divider />
          <Spec label="kdf" value="PBKDF2 · 600k" />
          <Divider />
          <Spec label="cover" value="2000×1500 PNG" />
          <Divider />
          <Spec label="server sees" value="just images" />
        </div>
      </div>

      <CipherStream />
    </section>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="uppercase tracking-[0.18em] text-[10px]">{label}</span>
      <span className="font-mono text-text-2 text-[11px]">{value}</span>
    </div>
  );
}

function Divider() {
  return <span className="w-px h-7 bg-border" aria-hidden />;
}

function Arrow({ className = "" }: { className?: string }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" className={className}>
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}

function Primitives() {
  const items = [
    { kicker: "01", title: "AES-256-GCM", desc: "Authenticated encryption — confidentiality and integrity in one pass. Tampered ciphertext fails to decrypt rather than producing garbage." },
    { kicker: "02", title: "PBKDF2 · 600k iterations", desc: "Key stretching to make each passphrase guess cost ~half a second on a phone. Combined with a 16-byte salt, brute-forcing offline is uneconomic." },
    { kicker: "03", title: "LSB steganography", desc: "Ciphertext is written into the least-significant bit of every R, G, and B channel. The visual difference is below human perception and below most compression artifacts." },
    { kicker: "04", title: "Out-of-band passphrases", desc: "The conversation key never touches the server. Two participants exchange a six-word passphrase out-of-band; both derive the same key, in memory only." },
  ];
  return (
    <section className="px-6 lg:px-12 py-24 max-w-[1400px] mx-auto">
      <header className="max-w-2xl mb-16">
        <p className="text-xs uppercase tracking-[0.22em] text-muted">primitives</p>
        <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] mt-3 text-balance leading-[1]">
          Standard cryptography. Quiet delivery.
        </h2>
      </header>
      <div className="grid sm:grid-cols-2 gap-px bg-border rounded-xl overflow-hidden">
        {items.map((it) => (
          <article key={it.title} className="bg-bg p-8 group hover:bg-surface transition-colors">
            <div className="flex items-baseline justify-between mb-5">
              <span className="font-mono text-xs text-muted">{it.kicker}</span>
              <span aria-hidden className="w-1 h-1 rounded-full bg-accent" />
            </div>
            <h3 className="font-display text-2xl mb-3 group-hover:text-accent transition-colors">{it.title}</h3>
            <p className="text-text-2 text-sm leading-relaxed text-pretty">{it.desc}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function CTASection() {
  return (
    <section className="px-6 lg:px-12 py-24 max-w-[1400px] mx-auto">
      <div className="rounded-2xl border bg-surface p-10 lg:p-16 grid lg:grid-cols-[1.4fr_1fr] gap-10 items-center surface-grain">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-accent mb-3">try it</p>
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] leading-[1] text-balance">
            One screen. Two friends. Zero plaintext anywhere a server can see.
          </h2>
          <p className="mt-5 text-text-2 max-w-md text-pretty">
            Make an account, start a conversation, share the six-word passphrase out-of-band.
            That's it.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link
            href="/signup"
            className="rounded-md bg-accent text-bg px-5 py-3 font-medium text-center"
          >
            Make an account
          </Link>
          <Link
            href="/login"
            className="rounded-md border px-5 py-3 text-center text-text-2 hover:text-text hover:border-border-strong transition"
          >
            I already have one
          </Link>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="px-6 lg:px-12 py-10 border-t border-border/50 text-xs text-muted flex flex-wrap items-center gap-x-6 gap-y-2 justify-between">
      <Wordmark size="sm" className="opacity-60" />
      <span>Final-year academic project · Web Crypto · Canvas LSB · Firebase relay</span>
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <span className="font-mono">v0.1</span>
      </div>
    </footer>
  );
}
