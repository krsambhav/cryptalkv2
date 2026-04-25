"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { App } from "antd";
import { useAuth } from "@/components/providers/AuthProvider";
import { useSession } from "@/stores/session";
import { getConversation, listenMessages, type MessageRow } from "@/lib/firebase";
import { base64ToBuffer, deriveKey } from "@/lib/crypto";
import { clearPhrase, hasSavedPhrase, loadPhrase } from "@/lib/savedPhrase";
import type { ConversationDocT } from "@/types/firestore";
import { ChatHeader } from "./ChatHeader";
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
  const setSessionKey = useSession((s) => s.setKey);
  const clearKey = useSession((s) => s.clearKey);
  const [convo, setConvo] = useState<ConversationDocT | null>(null);
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [unlockOpen, setUnlockOpen] = useState(false);
  const [unlockMode, setUnlockMode] = useState<"unlock" | "change">("unlock");
  const [showRaw, setShowRaw] = useState(false);
  const [phraseSaved, setPhraseSaved] = useState(false);
  const autoUnlockTried = useRef(false);

  useEffect(() => {
    setPhraseSaved(hasSavedPhrase(convoId));
  }, [convoId]);

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

  // Auto-unlock from a saved (encrypted) phrase if one is present for
  // this conversation on this device. Runs once per chat-view mount.
  useEffect(() => {
    if (!convo || hasKey || autoUnlockTried.current) return;
    autoUnlockTried.current = true;
    let cancelled = false;
    (async () => {
      const phrase = await loadPhrase(convoId);
      if (cancelled || !phrase) return;
      try {
        const salt = base64ToBuffer(convo.salt);
        const key = await deriveKey(phrase, salt);
        if (!cancelled) setSessionKey(convoId, key);
      } catch {
        // Saved phrase no longer derives a working key — drop it so
        // the user gets prompted next time.
        clearPhrase(convoId);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [convo, convoId, hasKey, setSessionKey]);

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
        phraseSaved={phraseSaved}
        messageCount={messages.length}
        showRaw={showRaw}
        onToggleRaw={() => setShowRaw((v) => !v)}
        onUnlock={() => {
          setUnlockMode("unlock");
          setUnlockOpen(true);
        }}
        onChangePhrase={() => {
          setUnlockMode("change");
          setUnlockOpen(true);
        }}
        onForgetPhrase={() => {
          clearPhrase(convoId);
          clearKey(convoId);
          setPhraseSaved(false);
          setShowRaw(false);
          message.success("Saved passphrase cleared.");
        }}
        onLock={() => {
          clearPhrase(convoId);
          clearKey(convoId);
          setPhraseSaved(false);
          setShowRaw(false);
        }}
      />

      <MessageList
        messages={messages}
        convoId={convoId}
        myUid={user.uid}
        recipient={recipient}
        showRaw={!hasKey || showRaw}
      />

      {hasKey ? (
        <MessageInput
          convoId={convoId}
          myUid={user.uid}
          coverPoolIds={convo.coverPoolIds}
        />
      ) : (
        <LockedComposer onUnlock={() => setUnlockOpen(true)} />
      )}

      <PassphraseModal
        open={unlockOpen}
        convoId={convoId}
        saltBase64={convo.salt}
        mode={unlockMode}
        onUnlocked={() => {
          setUnlockOpen(false);
          setPhraseSaved(hasSavedPhrase(convoId));
        }}
        onCancel={() => setUnlockOpen(false)}
      />
    </div>
  );
}

/**
 * Bottom strip that replaces the message input while the conversation is
 * locked. The cipher images are visible above; this is the call-to-action
 * to unlock and reveal them.
 */
function LockedComposer({ onUnlock }: { onUnlock(): void }) {
  return (
    <div
      className="sticky bottom-0 bg-bg/85 backdrop-blur-md border-t border-border/60"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
    >
      <div className="px-4 lg:px-6 py-3 flex items-center gap-3 justify-between">
        <div className="flex items-center gap-2.5 min-w-0 text-[13px]">
          <span className="shrink-0 inline-flex w-7 h-7 items-center justify-center rounded-full border border-accent/40 bg-accent/5 text-accent">
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <rect x="5" y="9" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.4" />
              <path d="M7 9V7a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </span>
          <span className="truncate">
            <span className="text-text">Each photograph hides a message.</span>{" "}
            <span className="text-text-2 hidden sm:inline">Enter the passphrase to read & reply.</span>
          </span>
        </div>
        <button
          onClick={onUnlock}
          className="shrink-0 rounded-full bg-accent text-bg px-5 py-2 text-[13px] font-medium hover:opacity-90 active:scale-[0.97] transition"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}
