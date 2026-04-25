interface Props {
  recipient: string;
  onUnlock(): void;
}

export function LockedView({ recipient, onUnlock }: Props) {
  return (
    <div className="flex-1 flex items-center justify-center px-6 py-12">
      <div className="max-w-sm text-center">
        <div className="mx-auto w-12 h-12 rounded-full border border-accent/40 bg-accent/5 flex items-center justify-center mb-5">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
            <path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" />
          </svg>
        </div>
        <p className="text-xs uppercase tracking-[0.22em] text-accent">passphrase required</p>
        <h2 className="font-display text-3xl mt-2 text-balance">Sealed in this tab.</h2>
        <p className="mt-3 text-sm text-text-2 text-pretty">
          Enter the six-word passphrase you and{" "}
          <strong className="text-text">{recipient}</strong> agreed on. CrypTalk will derive
          the key locally and never send it anywhere.
        </p>
        <button
          onClick={onUnlock}
          className="mt-6 rounded-md bg-accent text-bg px-5 py-3 font-medium"
        >
          Enter passphrase
        </button>
      </div>
    </div>
  );
}
