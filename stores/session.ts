/**
 * Session store — tab-lifetime cache of derived AES keys, keyed by
 * conversation id. Closing the tab wipes everything; nothing here is
 * ever persisted to localStorage or sent to the server.
 *
 * The presence of a key for a given convoId means "the user has
 * already typed the passphrase for this conversation in the current
 * tab" — so we can decrypt incoming messages and encrypt outgoing
 * messages without re-prompting.
 */
import { create } from "zustand";

interface SessionState {
  keys: Record<string, CryptoKey>;
  setKey(convoId: string, key: CryptoKey): void;
  clearKey(convoId: string): void;
  clearAll(): void;
  hasKey(convoId: string): boolean;
  getKey(convoId: string): CryptoKey | undefined;
}

export const useSession = create<SessionState>((set, get) => ({
  keys: {},
  setKey(convoId, key) {
    set((s) => ({ keys: { ...s.keys, [convoId]: key } }));
  },
  clearKey(convoId) {
    set((s) => {
      const next = { ...s.keys };
      delete next[convoId];
      return { keys: next };
    });
  },
  clearAll() {
    set({ keys: {} });
  },
  hasKey(convoId) {
    return convoId in get().keys;
  },
  getKey(convoId) {
    return get().keys[convoId];
  },
}));
