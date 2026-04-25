import { Wordmark } from "@/components/brand/Wordmark";

/**
 * Left-hand panel of the auth split-screen. Full-bleed cover image with
 * a subtle vignette, brand mark, tagline, and a small "what's actually
 * happening" cipher strip — this is the product's core visual story:
 * a normal-looking image carrying hidden ciphertext.
 */
export function BrandPanel() {
  return (
    <aside
      data-theme="dark"
      className="relative hidden lg:flex flex-col justify-between overflow-hidden text-text"
    >
      <img
        src="/covers/01-amber-dusk.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover scale-105"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(120deg, rgba(15,11,7,0.78) 0%, rgba(15,11,7,0.55) 45%, rgba(15,11,7,0.85) 100%)",
        }}
      />

      <div className="relative px-12 pt-12">
        <Wordmark size="md" />
      </div>

      <div className="relative px-12 pb-16 max-w-xl">
        <p className="text-xs uppercase tracking-[0.22em] text-accent/90 mb-6">
          a quiet protocol for private words
        </p>
        <h2 className="font-display text-5xl xl:text-6xl text-balance leading-[0.95]">
          Sealed inside <span className="italic">an ordinary photograph.</span>
        </h2>
        <p className="mt-6 text-text-2 text-pretty max-w-sm">
          Every message is encrypted with AES-256 and woven into the pixels of a
          landscape. Anyone watching the wire sees a picture, never a word.
        </p>

        <CipherStrip />
      </div>
    </aside>
  );
}

function CipherStrip() {
  // Random-looking but deterministic so SSR doesn't hydration-mismatch.
  const sample =
    "9f2c 4b81 e0a3 7d5e c211 8eaf 06f3 9d4c 51b7 a209 6e85 fb1d 4c30 92ef 7a16";
  return (
    <div className="mt-10 rounded-md border border-accent/25 bg-bg/40 backdrop-blur-sm p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted">
          ciphertext · embedded
        </span>
        <span className="text-[10px] font-mono text-accent">256-bit · gcm</span>
      </div>
      <code className="block font-mono text-[11px] leading-relaxed text-text-2 break-all">
        {sample}
      </code>
    </div>
  );
}
