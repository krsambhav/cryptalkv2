/**
 * Three-station pipeline that visualizes what happens when a user
 * presses send: type, seal, deliver.
 *
 * Each station is a small visual + description. Layout is asymmetric:
 * the middle station (seal) is given more visual weight because it's
 * the unique step.
 */

export function Pipeline() {
  return (
    <section className="px-6 lg:px-12 py-24 max-w-[1400px] mx-auto">
      <header className="mb-16 grid lg:grid-cols-2 gap-8 items-end">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-muted">how it travels</p>
          <h2 className="font-display text-[clamp(2rem,4vw,3.5rem)] mt-3 leading-[1] text-balance">
            Four hundred milliseconds, three layers of work.
          </h2>
        </div>
        <p className="text-text-2 text-pretty max-w-md justify-self-end">
          Hit send and three things happen, in this order. The whole thing usually finishes
          before your finger leaves the key.
        </p>
      </header>

      <div className="grid lg:grid-cols-12 gap-px rounded-2xl overflow-hidden border bg-border">
        <Station
          n="01"
          title="Encrypt"
          stat="≤ 4 ms"
          desc="Your text is wrapped in a versioned envelope and run through AES-256-GCM. The 12-byte IV is fresh every time."
          className="lg:col-span-3"
          visual={<EncryptVisual />}
        />
        <Station
          n="02"
          title="Hide"
          stat="≤ 350 ms"
          desc="The ciphertext is poured into the least-significant bits of every R, G, and B channel of a pre-loaded landscape. The image still looks like the image."
          className="lg:col-span-6"
          large
          visual={<HideVisual />}
        />
        <Station
          n="03"
          title="Send"
          stat="≤ 600 ms"
          desc="The PNG is uploaded to Firebase Storage and a pointer is written to Firestore. The recipient's device decodes it back, in reverse."
          className="lg:col-span-3"
          visual={<SendVisual />}
        />
      </div>
    </section>
  );
}

function Station({
  n,
  title,
  stat,
  desc,
  visual,
  className = "",
  large = false,
}: {
  n: string;
  title: string;
  stat: string;
  desc: string;
  visual: React.ReactNode;
  className?: string;
  large?: boolean;
}) {
  return (
    <article className={`bg-bg p-7 lg:p-9 flex flex-col gap-6 ${className}`}>
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-xs text-muted">{n}</span>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent/80">
          {stat}
        </span>
      </div>
      <div className={`${large ? "h-48" : "h-32"} flex items-center justify-center`}>
        {visual}
      </div>
      <div>
        <h3 className="font-display text-2xl mb-2">{title}</h3>
        <p className="text-sm text-text-2 leading-relaxed text-pretty">{desc}</p>
      </div>
    </article>
  );
}

function EncryptVisual() {
  return (
    <div className="font-mono text-[10px] leading-snug text-center">
      <div className="text-text-2">hello world</div>
      <div className="my-2 text-accent" aria-hidden>↓</div>
      <div className="text-muted break-all max-w-[12rem] mx-auto">
        9f2c4b81e0a37d5ec2118eaf06f39d4c51b7
      </div>
    </div>
  );
}

function HideVisual() {
  return (
    <div className="relative w-full h-full rounded-md overflow-hidden border bg-bg-2">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/covers/03-pine-woods.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, transparent 0%, rgba(15,11,7,0.6) 100%)",
        }}
      />
      {/* faint dot grid representing the bit lattice */}
      <svg
        aria-hidden
        viewBox="0 0 200 120"
        className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay"
      >
        <defs>
          <pattern id="dots" width="6" height="6" patternUnits="userSpaceOnUse">
            <circle cx="1.2" cy="1.2" r="0.7" fill="white" />
          </pattern>
        </defs>
        <rect width="200" height="120" fill="url(#dots)" />
      </svg>
      <div className="absolute bottom-3 left-3 right-3 font-mono text-[9px] text-text-2/90 flex items-center justify-between">
        <span>pine_woods.png</span>
        <span className="text-accent">+ ciphertext</span>
      </div>
    </div>
  );
}

function SendVisual() {
  return (
    <div className="font-mono text-[10px] leading-snug text-center">
      <div className="text-muted">[client]</div>
      <div className="my-1.5 text-accent" aria-hidden>↓</div>
      <div className="text-text-2">firebase storage</div>
      <div className="my-1.5 text-accent" aria-hidden>↓</div>
      <div className="text-muted">[recipient]</div>
    </div>
  );
}
