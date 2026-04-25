"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button, App } from "antd";
import { useAuth } from "@/components/providers/AuthProvider";
import { listenMyConversations, signOut } from "@/lib/firebase";
import type { ConversationDocT } from "@/types/firestore";
import { useSession } from "@/stores/session";
import { Wordmark } from "@/components/brand/Wordmark";
import { ThemeToggle } from "@/components/brand/ThemeToggle";
import { NewConversationModal } from "./NewConversationModal";

interface Convo { id: string; doc: ConversationDocT }

export function ConversationList() {
  const { user } = useAuth();
  const { message } = App.useApp();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id;
  const sessionKeys = useSession((s) => s.keys);
  const clearAll = useSession((s) => s.clearAll);
  const [convos, setConvos] = useState<Convo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newOpen, setNewOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = listenMyConversations(user.uid, (cs) => {
      setConvos(cs);
      setLoading(false);
    });
    return () => unsub();
  }, [user]);

  async function handleSignOut() {
    try {
      clearAll();
      await signOut();
    } catch (err) {
      message.error(err instanceof Error ? err.message : "could not sign out");
    }
  }

  if (!user) return null;
  const myEmail = user.email ?? "";

  return (
    <>
      <div className="flex flex-col h-full">
        <header className="px-5 pt-5 pb-4 flex items-center justify-between border-b border-border/60">
          <Link href="/chats" className="block">
            <Wordmark size="sm" />
          </Link>
          <div className="text-[10px] font-mono text-muted text-right leading-tight">
            <div className="truncate max-w-[10rem]">{user.email}</div>
            <button
              onClick={handleSignOut}
              className="text-muted hover:text-text underline-offset-4 hover:underline"
            >
              sign out
            </button>
          </div>
        </header>

        <div className="px-5 py-4 border-b border-border/60">
          <Button
            type="primary"
            block
            onClick={() => setNewOpen(true)}
            className="!h-11 !font-medium"
            icon={
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            }
          >
            Start a conversation
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {loading ? (
            <Skeleton />
          ) : convos.length === 0 ? (
            <EmptyList onNew={() => setNewOpen(true)} />
          ) : (
            <ul>
              {convos.map((c) => {
                const otherEmail = c.doc.participantEmails.find((e) => e !== myEmail) ?? "(unknown)";
                const unlocked = c.id in sessionKeys;
                const active = c.id === activeId;
                return (
                  <li key={c.id}>
                    <Link
                      href={`/chats/${c.id}`}
                      className={`block px-5 py-3.5 transition-colors ${
                        active
                          ? "bg-surface"
                          : "hover:bg-surface/60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`font-medium text-sm truncate ${
                            active ? "text-accent" : "text-text"
                          }`}
                        >
                          {otherEmail}
                        </span>
                        <span className="font-mono text-[10px] text-muted shrink-0">
                          {formatRelative(c.doc.lastMessageAt ?? c.doc.createdAt)}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted">
                        <Lock locked={!unlocked} />
                        <span>{unlocked ? "unlocked this tab" : "passphrase required"}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </nav>

        <footer className="px-5 py-3 border-t border-border/60 text-[10px] text-muted font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-success" />
            relay live
          </span>
          <ThemeToggle />
        </footer>
      </div>

      <NewConversationModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        selfUid={user.uid}
        selfEmail={myEmail}
      />
    </>
  );
}

function Lock({ locked }: { locked: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
      {locked ? (
        <>
          <rect x="3" y="5.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1" />
          <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1" />
        </>
      ) : (
        <>
          <rect x="3" y="5.5" width="6" height="5" rx="1" stroke="currentColor" strokeWidth="1" />
          <path d="M4 5.5V3.8a2 2 0 013.6-1.2" stroke="currentColor" strokeWidth="1" />
        </>
      )}
    </svg>
  );
}

function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h`;
  if (diff < 30 * 86_400_000) return `${Math.floor(diff / 86_400_000)}d`;
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function Skeleton() {
  return (
    <ul className="px-5 py-2 space-y-2">
      {[0, 1, 2].map((i) => (
        <li
          key={i}
          className="h-14 rounded-md bg-surface/50 animate-pulse"
          style={{ animationDelay: `${i * 100}ms` }}
        />
      ))}
    </ul>
  );
}

function EmptyList({ onNew }: { onNew: () => void }) {
  return (
    <div className="px-6 py-10 text-center">
      <div className="mx-auto w-12 h-12 rounded-full border border-accent/30 bg-accent/5 flex items-center justify-center mb-4">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 6.5a3 3 0 013-3h8a3 3 0 013 3v7a3 3 0 01-3 3H6a3 3 0 01-3-3v-7z"
            stroke="currentColor"
            strokeWidth="1.4"
            opacity="0.5"
          />
          <path
            d="M3.5 6.5l6.5 5 6.5-5"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="round"
            opacity="0.8"
          />
        </svg>
      </div>
      <p className="font-display text-xl text-balance">No conversations yet</p>
      <p className="text-xs text-muted mt-1.5 max-w-[16rem] mx-auto text-pretty">
        Start one and you'll get a six-word passphrase to share with the other person.
      </p>
      <button
        onClick={onNew}
        className="mt-5 text-sm text-accent underline-offset-4 hover:underline"
      >
        Start a conversation →
      </button>
    </div>
  );
}
