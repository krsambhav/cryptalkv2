"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "firebase/auth";
import { isFirebaseConfigured, onAuth } from "@/lib/firebase";

interface AuthState {
  user: User | null;
  loading: boolean;
  configured: boolean;
}

const AuthContext = createContext<AuthState>({
  user: null,
  loading: true,
  configured: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    configured: true,
  });

  useEffect(() => {
    const configured = isFirebaseConfigured();
    if (!configured) {
      setState({ user: null, loading: false, configured: false });
      return;
    }
    const unsub = onAuth((u) => {
      setState({ user: u, loading: false, configured: true });
    });
    return () => unsub();
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
