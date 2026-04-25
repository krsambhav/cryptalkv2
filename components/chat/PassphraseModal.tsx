"use client";

import { useEffect, useState } from "react";
import { Modal, Input, Button, Checkbox, App } from "antd";
import { base64ToBuffer, deriveKey, isValidPassphrase } from "@/lib/crypto";
import { clearPhrase, hasSavedPhrase, savePhrase } from "@/lib/savedPhrase";
import { useSession } from "@/stores/session";

/**
 * PassphraseModal — prompt the user for an existing conversation's
 * passphrase. Derives the AES key and stores it in the session store.
 * Optionally saves the phrase to localStorage encrypted with a
 * non-extractable device key so the user doesn't have to retype on
 * every visit.
 */
interface Props {
  open: boolean;
  convoId: string;
  saltBase64: string;
  mode?: "unlock" | "change";
  onUnlocked(): void;
  onCancel(): void;
}

export function PassphraseModal({
  open,
  convoId,
  saltBase64,
  mode = "unlock",
  onUnlocked,
  onCancel,
}: Props) {
  const { message } = App.useApp();
  const setKey = useSession((s) => s.setKey);
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [remember, setRemember] = useState(false);

  // Sync remember-toggle with the existing saved state each time the
  // modal opens, so it reflects reality (and so unchecking acts as a
  // deliberate opt-out).
  useEffect(() => {
    if (open) setRemember(hasSavedPhrase(convoId));
  }, [open, convoId]);

  async function handleSubmit() {
    const trimmed = value.trim().replace(/\s+/g, " ").toLowerCase();
    if (!isValidPassphrase(trimmed)) {
      message.error("That doesn't look like a 6-word BIP39 passphrase.");
      return;
    }
    setBusy(true);
    try {
      const salt = base64ToBuffer(saltBase64);
      const key = await deriveKey(trimmed, salt);
      setKey(convoId, key);
      if (remember) {
        await savePhrase(convoId, trimmed);
      } else {
        clearPhrase(convoId);
      }
      setValue("");
      onUnlocked();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "could not derive key");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={520}
      centered
      destroyOnHidden
      title={null}
    >
      <div className="py-2">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">
          {mode === "change" ? "update passphrase" : "unlock conversation"}
        </p>
        <h2 className="font-display text-3xl mt-2 text-balance">
          {mode === "change"
            ? "Enter the new six-word passphrase."
            : "Enter the six-word passphrase."}
        </h2>
        <p className="mt-3 text-sm text-text-2">
          Whatever you both wrote down when this conversation began. CrypTalk derives a key
          from it locally — we never see what you type.
        </p>

        <Input.TextArea
          rows={3}
          autoFocus
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onPressEnter={(e) => {
            if (!e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="abandon ability able about above absent"
          className="mt-6 !font-mono !text-base"
        />

        <p className="mt-2 text-xs text-muted">
          Press Enter to unlock. PBKDF2 takes about half a second.
        </p>

        <label className="mt-5 flex items-start gap-2.5 cursor-pointer select-none">
          <Checkbox
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="mt-0.5"
          />
          <span className="flex-1 text-[13px] leading-snug">
            <span className="text-text">Remember on this device</span>
            <span className="block text-xs text-muted mt-0.5">
              The phrase is encrypted with a key bound to this browser profile. Copying
              cookies or storage to another device won&apos;t unlock it there.
            </span>
          </span>
        </label>

        <div className="mt-6 flex items-center gap-2">
          <Button onClick={onCancel}>Back</Button>
          <Button type="primary" loading={busy} onClick={handleSubmit} className="!flex-1 !h-11 !font-medium">
            {mode === "change" ? "Update & save" : "Derive key & unlock"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
