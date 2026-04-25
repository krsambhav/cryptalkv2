/**
 * Device-bound wrapping key.
 *
 * A non-extractable AES-GCM key generated once per origin and stored in
 * IndexedDB. We only ever USE this key (encrypt/decrypt) — `extractable:
 * false` means even with full JS access you can't read its raw bytes,
 * and the browser keeps the actual key material in its internal keystore
 * scoped to this origin/profile.
 *
 * That means a copied localStorage blob (or a copied cookie file) is
 * useless on a different device or browser profile — they'd land at a
 * fresh wrapping key and the saved phrase blob wouldn't decrypt.
 */

const DB_NAME = "cryptalk-keystore";
const DB_VERSION = 1;
const STORE = "keys";
const KEY_ID = "device-wrap-key";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function txGet(db: IDBDatabase, id: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function txPut(db: IDBDatabase, id: string, value: unknown): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

let cached: Promise<CryptoKey> | null = null;

export function getDeviceKey(): Promise<CryptoKey> {
  if (cached) return cached;
  cached = (async () => {
    const db = await openDB();
    const existing = (await txGet(db, KEY_ID)) as CryptoKey | undefined;
    if (existing) return existing;
    const key = await crypto.subtle.generateKey(
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"],
    );
    await txPut(db, KEY_ID, key);
    return key;
  })();
  return cached;
}
