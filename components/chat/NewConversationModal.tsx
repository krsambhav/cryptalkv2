"use client";

import { useState } from "react";
import { Modal, Input, Button, Form, App } from "antd";
import { useRouter } from "next/navigation";
import {
  bufferToBase64,
  deriveKey,
  generatePassphrase,
  generateSalt,
} from "@/lib/crypto";
import { COVERS } from "@/lib/covers";
import { createConversation, findUserByEmail } from "@/lib/firebase";
import { useSession } from "@/stores/session";
import { PassphraseReveal } from "./PassphraseReveal";

interface Props {
  open: boolean;
  onClose(): void;
  selfUid: string;
  selfEmail: string;
}

type Stage =
  | { kind: "form" }
  | { kind: "creating" }
  | { kind: "reveal"; passphrase: string; convoId: string; recipientEmail: string };

export function NewConversationModal({ open, onClose, selfUid, selfEmail }: Props) {
  const router = useRouter();
  const { message } = App.useApp();
  const setKey = useSession((s) => s.setKey);
  const [stage, setStage] = useState<Stage>({ kind: "form" });

  async function onCreate(values: { email: string }) {
    const recipient = values.email.trim().toLowerCase();
    if (recipient === selfEmail.toLowerCase()) {
      message.error("you can't start a conversation with yourself");
      return;
    }
    setStage({ kind: "creating" });
    try {
      const other = await findUserByEmail(recipient);
      if (!other) {
        message.error("no account with that email — ask them to sign up first");
        setStage({ kind: "form" });
        return;
      }

      const passphrase = generatePassphrase();
      const salt = generateSalt();
      const saltB64 = bufferToBase64(salt);
      const coverPoolIds = COVERS.map((c) => c.id);

      const convoId = await createConversation({
        selfUid,
        selfEmail,
        otherUid: other.uid,
        otherEmail: other.doc.email,
        saltBase64: saltB64,
        coverPoolIds,
      });

      // Derive the key for this tab so the user can immediately use the convo.
      const key = await deriveKey(passphrase, salt);
      setKey(convoId, key);

      setStage({ kind: "reveal", passphrase, convoId, recipientEmail: other.doc.email });
    } catch (err) {
      message.error(err instanceof Error ? err.message : "could not create conversation");
      setStage({ kind: "form" });
    }
  }

  function onConfirmReveal() {
    if (stage.kind !== "reveal") return;
    const id = stage.convoId;
    setStage({ kind: "form" });
    onClose();
    router.push(`/chats/${id}`);
  }

  if (stage.kind === "reveal") {
    return (
      <PassphraseReveal
        open={open}
        passphrase={stage.passphrase}
        recipientEmail={stage.recipientEmail}
        onConfirm={onConfirmReveal}
      />
    );
  }

  return (
    <Modal
      open={open}
      onCancel={() => stage.kind !== "creating" && onClose()}
      footer={null}
      title={null}
      width={500}
      centered
      destroyOnClose
    >
      <div className="py-2">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">new conversation</p>
        <h2 className="font-display text-3xl mt-2 text-balance">Who are you writing to?</h2>
        <p className="mt-3 text-sm text-text-2">
          They must already have a CrypTalk account. We'll generate a six-word passphrase next —
          you'll share that with them out-of-band.
        </p>

        <Form
          layout="vertical"
          size="large"
          onFinish={onCreate}
          className="mt-6"
          disabled={stage.kind === "creating"}
        >
          <Form.Item
            name="email"
            label="Recipient email"
            rules={[{ required: true, type: "email" }]}
          >
            <Input autoFocus autoComplete="off" placeholder="friend@somewhere.fyi" />
          </Form.Item>
          <Button
            htmlType="submit"
            type="primary"
            block
            loading={stage.kind === "creating"}
            className="!h-12 !font-medium !mt-2"
          >
            Continue — generate passphrase
          </Button>
        </Form>
      </div>
    </Modal>
  );
}
