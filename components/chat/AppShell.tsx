"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/providers/AuthProvider";
import { ConversationList } from "./ConversationList";

/**
 * Two-pane shell: sidebar (conversation list) + main (chat or empty state).
 *
 * Mobile (< lg) drawer pattern:
 *   - /chats         → sidebar fills the screen, main is hidden
 *   - /chats/[id]    → main fills the screen, sidebar is hidden (back-arrow
 *                      in the chat header navigates back to /chats)
 *
 * Desktop (lg+): sidebar + main always visible side by side.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, loading, configured } = useAuth();
  const pathname = usePathname() ?? "/chats";
  const inConvo = /^\/chats\/[^/]+/.test(pathname);

  useEffect(() => {
    if (loading) return;
    if (!configured) return; // Show config notice instead of redirecting
    if (!user) router.replace("/login");
  }, [user, loading, configured, router]);

  if (!configured) {
    return <ConfigureFirebaseNotice />;
  }
  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center text-muted text-sm">
        loading…
      </div>
    );
  }
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-dvh grid lg:grid-cols-[clamp(280px,28%,360px)_1fr]">
      <aside
        className={`bg-bg-2 border-r border-border/60 ${
          inConvo ? "hidden lg:block" : "block"
        } lg:block lg:h-dvh lg:sticky lg:top-0`}
      >
        <ConversationList />
      </aside>
      <section
        className={`min-h-dvh lg:h-dvh lg:overflow-y-auto ${
          inConvo ? "block" : "hidden lg:block"
        }`}
      >
        {children}
      </section>
    </div>
  );
}

function ConfigureFirebaseNotice() {
  return (
    <main className="min-h-dvh flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="text-xs uppercase tracking-[0.22em] text-accent">configuration required</p>
        <h1 className="font-display text-3xl mt-2 text-balance">
          Firebase isn't configured.
        </h1>
        <p className="mt-3 text-text-2 text-sm text-pretty">
          Copy <code className="font-mono text-accent">.env.example</code> to{" "}
          <code className="font-mono text-accent">.env.local</code> and fill in your project's
          credentials. You can find them under <strong>Project Settings → Your Apps → Web App</strong>{" "}
          in the Firebase console.
        </p>
        <pre className="mt-6 text-left rounded-lg border bg-bg-2 p-4 font-mono text-xs text-text-2 overflow-x-auto">
{`NEXT_PUBLIC_FIREBASE_API_KEY=…
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=…
NEXT_PUBLIC_FIREBASE_PROJECT_ID=…
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=…
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=…
NEXT_PUBLIC_FIREBASE_APP_ID=…`}
        </pre>
      </div>
    </main>
  );
}
