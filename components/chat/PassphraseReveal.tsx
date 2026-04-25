"use client";

import { useState } from "react";
import { Modal, Checkbox, Button, App } from "antd";

/**
 * PassphraseReveal — shown ONCE after creating a new conversation. The
 * UX intention is to make this feel weighty: the passphrase is the
 * only secret that ever exists, and the user must copy it down before
 * continuing.
 *
 * After the user confirms they have saved it, the modal cannot be
 * reopened — the passphrase is no longer accessible from anywhere.
 */
interface Props {
  open: boolean;
  passphrase: string;
  recipientEmail: string;
  onConfirm(): void;
}

export function PassphraseReveal({ open, passphrase, recipientEmail, onConfirm }: Props) {
  const { message } = App.useApp();
  const [confirmed, setConfirmed] = useState(false);

  const words = passphrase.split(" ");

  async function copy() {
    try {
      await navigator.clipboard.writeText(passphrase);
      message.success("copied");
    } catch {
      message.error("clipboard unavailable — write it down manually");
    }
  }

  return (
    <Modal
      open={open}
      footer={null}
      closable={false}
      maskClosable={false}
      width={560}
      centered
      destroyOnHidden
    >
      <div className="py-2">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">one-time reveal</p>
        <h2 className="font-display text-3xl mt-2 text-balance">
          The only key to this conversation.
        </h2>
        <p className="mt-3 text-sm text-text-2">
          Send it to <strong className="text-text">{recipientEmail}</strong> through a
          channel you both already trust — voice, in person, paper. <em>Not</em> through CrypTalk.
        </p>

        <ol className="mt-6 grid grid-cols-3 gap-2">
          {words.map((w, i) => (
            <li
              key={i}
              className="rounded-lg border bg-bg-2 px-3 py-2.5 flex items-baseline gap-2 animate-fade-up"
              style={{ animationDelay: `${80 * i}ms` }}
            >
              <span className="font-mono text-[10px] text-muted">{(i + 1).toString().padStart(2, "0")}</span>
              <span className="font-mono text-sm text-text">{w}</span>
            </li>
          ))}
        </ol>

        <div className="mt-5 flex items-center gap-2">
          <Button onClick={copy} className="!h-10">
            Copy to clipboard
          </Button>
          <span className="text-xs text-muted">
            We'll never show this again.
          </span>
        </div>

        <div className="mt-6 rounded-lg border border-warn/40 bg-warn/5 p-4 text-xs text-text-2">
          <p>
            <strong className="text-warn">Heads up.</strong> This passphrase lives only in
            your browser tab. Closing this tab forgets it; both of you must re-enter it next session.
          </p>
        </div>

        <Checkbox
          className="mt-5"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
        >
          I've saved this and shared it with {recipientEmail}.
        </Checkbox>

        <Button
          type="primary"
          block
          disabled={!confirmed}
          onClick={onConfirm}
          className="!h-12 !mt-5 !font-medium"
        >
          Continue to conversation
        </Button>
      </div>
    </Modal>
  );
}
