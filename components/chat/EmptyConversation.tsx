/**
 * Empty-state shown in the main pane when no conversation is selected.
 * Desktop only — on mobile, the sidebar covers the whole viewport.
 */
export function EmptyConversation() {
  return (
    <div className="hidden lg:flex h-full items-center justify-center p-12">
      <div className="text-center max-w-md">
        <div data-theme="dark" className="relative mx-auto w-32 h-24 mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/covers/05-night-snow.png"
            alt=""
            className="absolute inset-0 w-full h-full object-cover rounded-md border border-border opacity-70"
          />
          <div
            aria-hidden
            className="absolute inset-0 rounded-md"
            style={{ background: "linear-gradient(180deg, transparent, rgba(15,11,7,0.55))" }}
          />
          <span className="absolute bottom-1.5 left-2 right-2 text-[9px] font-mono text-text-2 text-center uppercase tracking-[0.18em]">
            no message inside
          </span>
        </div>
        <h1 className="font-display text-3xl text-balance">An empty room.</h1>
        <p className="mt-3 text-sm text-text-2 text-pretty">
          Pick a conversation from the left to read it, or start a new one. CrypTalk doesn't show you
          anything until you've entered the passphrase.
        </p>
      </div>
    </div>
  );
}
