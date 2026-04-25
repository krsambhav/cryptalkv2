"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSession } from "@/stores/session";
import { getConversation, listenMessages, type MessageRow } from "@/lib/firebase";
import type { ConversationDocT } from "@/types/firestore";
import { ChatHeader } from "./ChatHeader";
import { LockedView } from "./LockedView";
import { PassphraseModal } from "./PassphraseModal";
import { MessageList } from "./MessageList";
import { MessageInput } from "./MessageInput";

interface Props {
  convoId: string;
}

export function ChatView({ convoId }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const { message } = App.useApp();
  const hasKey = useSession((s) => s.hasKey(convoId));
  const [convo, setConvo] = useState<ConversationDocT | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getConversation(convoId)
      .then((res) => {
        if (cancelled) return;
        if (!res) {
          message.error("conversation not found");
          router.replace("/chats");
          return;
        }
        if (user && !res.doc.participants.includes(user.uid)) {
          message.error("you're not a participant in this conversation");
          router.replace("/chats");
          return;
        }
        setConvo(res.doc);
      })
      .catch((err) => {
        message.error(err instanceof Error ? err.message : "could not load conversation");
        router.replace("/chats");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [convoId, user, router, message]);

  useEffect(() => {
    if (!convo) return;
    const unsub = listenMessages(convoId, setMessages);
    return () => unsub();
  }, [convo, convoId]);

  // Open the passphrase modal automatically the first time we land here
  // without a key. Don't auto-reopen after the user explicitly cancels.
  const [autoPrompted, setAutoPrompted] = useState(false);
  useEffect(() => {
    if (loading || !convo) return;
    if (!hasKey && !autoPrompted) {
      setUnlockOpen(true);
      setAutoPrompted(true);
    }
  }, [loading, convo, hasKey, autoPrompted]);

  if (loading || !convo || !user) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted text-sm">
        loading conversation…
      </div>
    );
  }

  const myEmail = user.email ?? "";
  const recipient =
    convo.participantEmails.find((e) => e !== myEmail) ?? "(unknown)";

  return (
    <div className="flex flex-col h-full min-h-dvh lg:min-h-0">
      <ChatHeader
        recipient={recipient}
        unlocked={hasKey}
        messageCount={messages.length}
        showRaw={showRaw}
        onToggleRaw={() => setShowRaw((v) => !v)}
      />

      {!hasKey ? (
        <LockedView recipient={recipient} onUnlock={() => setUnlockOpen(true)} />
      ) : (
        <>
          <MessageList
            messages={messages}
            convoId={convoId}
            myUid={user.uid}
            recipient={recipient}
            showRaw={showRaw}
          />
          <MessageInput
            convoId={convoId}
            myUid={user.uid}
            coverPoolIds={convo.coverPoolIds}
          />
        </>
      )}

      <PassphraseModal
        open={unlockOpen}
        convoId={convoId}
        saltBase64={convo.salt}
        onUnlocked={() => setUnlockOpen(false)}
        onCancel={() => setUnlockOpen(false)}
      />
    </div>
  );
}
