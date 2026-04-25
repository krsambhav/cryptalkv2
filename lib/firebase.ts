/**
 * lib/firebase.ts
 *
 * Firebase initialization and typed wrappers. Exposes auth, Firestore,
 * Storage instances plus a small library of operations that other
 * modules use (signUp, signIn, createConversation, sendMessage, etc.).
 *
 * Every Firestore READ goes through Zod validation — the schema lives
 * in types/firestore.ts. Writes use the same schemas to fail fast on
 * malformed data.
 *
 * Uploads and downloads of stego PNGs go through Storage, not
 * Firestore (Firestore's 1MB-per-doc limit can't hold a 4MB PNG).
 */

import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  type Auth,
  type User,
} from "firebase/auth";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  type Firestore,
  type Unsubscribe,
  type DocumentData,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  type FirebaseStorage,
} from "firebase/storage";
import {
  ConversationDoc,
  MessageDoc,
  UserDoc,
  type ConversationDocT,
  type MessageDocT,
  type UserDocT,
} from "@/types/firestore";

// ---- init -----------------------------------------------------------------

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;
let _db: Firestore | null = null;
let _storage: FirebaseStorage | null = null;

function ensureApp(): FirebaseApp {
  if (_app) return _app;
  if (!firebaseConfig.apiKey) {
    throw new Error(
      "Firebase env vars missing — copy .env.example to .env.local and fill them in",
    );
  }
  _app = getApps().length > 0 ? getApps()[0]! : initializeApp(firebaseConfig);
  return _app;
}

export function fbAuth(): Auth {
  if (_auth) return _auth;
  _auth = getAuth(ensureApp());
  return _auth;
}
export function fbDb(): Firestore {
  if (_db) return _db;
  _db = getFirestore(ensureApp());
  return _db;
}
export function fbStorage(): FirebaseStorage {
  if (_storage) return _storage;
  _storage = getStorage(ensureApp());
  return _storage;
}

/** Returns true iff the env vars look populated — handy for showing a
 *  "configure firebase" notice during local dev. */
export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
}

// ---- auth -----------------------------------------------------------------

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string,
): Promise<User> {
  const cred = await createUserWithEmailAndPassword(fbAuth(), email, password);
  // Initialize the user's profile doc. We use the uid as the doc id so any
  // participant lookup is O(1) by uid.
  const userDoc: UserDocT = {
    email: cred.user.email ?? email,
    displayName,
    createdAt: Date.now(),
  };
  UserDoc.parse(userDoc);
  await setDoc(doc(fbDb(), "users", cred.user.uid), userDoc);
  return cred.user;
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const cred = await signInWithEmailAndPassword(fbAuth(), email, password);
  return cred.user;
}

export async function signOut(): Promise<void> {
  await fbSignOut(fbAuth());
}

export function onAuth(cb: (u: User | null) => void): Unsubscribe {
  return onAuthStateChanged(fbAuth(), cb);
}

// ---- users ----------------------------------------------------------------

/** Look up a user by their email address. Returns null if not found. */
export async function findUserByEmail(
  email: string,
): Promise<{ uid: string; doc: UserDocT } | null> {
  // Firestore can't query by document id == email since uid is the id.
  // We need a `where("email", "==", email)` against /users.
  const { getDocs } = await import("firebase/firestore");
  const q = query(collection(fbDb(), "users"), where("email", "==", email));
  const snap = await getDocs(q);
  if (snap.empty) return null;
  const d = snap.docs[0]!;
  return { uid: d.id, doc: UserDoc.parse(d.data()) };
}

// ---- conversations --------------------------------------------------------

export interface CreateConversationInput {
  selfUid: string;
  selfEmail: string;
  otherUid: string;
  otherEmail: string;
  saltBase64: string;
  coverPoolIds: string[];
}

export async function createConversation(
  input: CreateConversationInput,
): Promise<string> {
  const data: ConversationDocT = {
    participants: [input.selfUid, input.otherUid].sort() as [string, string],
    participantEmails: [input.selfEmail, input.otherEmail].sort() as [string, string],
    salt: input.saltBase64,
    coverPoolIds: input.coverPoolIds,
    createdAt: Date.now(),
    lastMessageAt: null,
  };
  ConversationDoc.parse(data);
  const ref = await addDoc(collection(fbDb(), "conversations"), data);
  return ref.id;
}

export async function getConversation(
  id: string,
): Promise<{ id: string; doc: ConversationDocT } | null> {
  const snap = await getDoc(doc(fbDb(), "conversations", id));
  if (!snap.exists()) return null;
  return { id: snap.id, doc: ConversationDoc.parse(normalizeConvoData(snap.data())) };
}

export function listenMyConversations(
  uid: string,
  cb: (convos: { id: string; doc: ConversationDocT }[]) => void,
): Unsubscribe {
  // Firestore array-contains lets us filter conversations where I'm a
  // participant. Order by lastMessageAt to keep recent chats on top.
  const q = query(
    collection(fbDb(), "conversations"),
    where("participants", "array-contains", uid),
  );
  return onSnapshot(q, (snap) => {
    const out = snap.docs.map((d) => ({
      id: d.id,
      doc: ConversationDoc.parse(normalizeConvoData(d.data())),
    }));
    out.sort((a, b) => (b.doc.lastMessageAt ?? b.doc.createdAt) - (a.doc.lastMessageAt ?? a.doc.createdAt));
    cb(out);
  });
}

/**
 * lastMessageAt is written via serverTimestamp(), so reads come back as a
 * Firestore Timestamp instance — not a number. The zod schema expects a
 * number, so we coerce here at the read boundary.
 */
function normalizeConvoData(raw: DocumentData): DocumentData {
  return {
    ...raw,
    lastMessageAt:
      raw.lastMessageAt instanceof Timestamp
        ? raw.lastMessageAt.toMillis()
        : (raw.lastMessageAt ?? null),
  };
}

// ---- messages -------------------------------------------------------------

export interface SendMessageInput {
  convoId: string;
  senderId: string;
  stegoBlob: Blob;
  coverId: string;
}

export async function sendMessage(input: SendMessageInput): Promise<string> {
  // 1. Upload the stego PNG to Storage at stego/{convoId}/{auto}.png
  const path = `stego/${input.convoId}/${cryptoRandomId()}.png`;
  const ref = storageRef(fbStorage(), path);
  await uploadBytes(ref, input.stegoBlob, {
    contentType: "image/png",
    cacheControl: "public, max-age=31536000, immutable",
  });
  const url = await getDownloadURL(ref);

  // 2. Write the Firestore message doc.
  const data: MessageDocT = {
    senderId: input.senderId,
    stegoUrl: url,
    coverId: input.coverId,
    ts: Date.now(),
  };
  MessageDoc.parse(data);
  const ref2 = await addDoc(
    collection(fbDb(), "conversations", input.convoId, "messages"),
    { ...data, ts: serverTimestamp() },
  );

  // 3. Bump the conversation's lastMessageAt for sorting.
  await updateDoc(doc(fbDb(), "conversations", input.convoId), {
    lastMessageAt: serverTimestamp(),
  });
  return ref2.id;
}

export interface MessageRow {
  id: string;
  senderId: string;
  stegoUrl: string;
  coverId: string;
  ts: number;
}

export function listenMessages(
  convoId: string,
  cb: (msgs: MessageRow[]) => void,
): Unsubscribe {
  const q = query(
    collection(fbDb(), "conversations", convoId, "messages"),
    orderBy("ts", "asc"),
  );
  return onSnapshot(q, (snap) => {
    const rows: MessageRow[] = [];
    for (const d of snap.docs) {
      const raw = d.data() as DocumentData;
      // serverTimestamp() resolves asynchronously; until it lands, ts is
      // null. Skip those — the next snapshot will include them with a
      // real timestamp.
      const ts = raw.ts as Timestamp | null;
      if (!ts) continue;
      rows.push({
        id: d.id,
        senderId: String(raw.senderId),
        stegoUrl: proxiedStegoUrl(String(raw.stegoUrl)),
        coverId: String(raw.coverId),
        ts: ts.toMillis(),
      });
    }
    cb(rows);
  });
}

/**
 * Rewrite a raw Firebase Storage download URL to its same-origin proxy.
 * The proxy lives at /api/stego and validates that we only fetch from
 * our own bucket. Same-origin loading lets canvas read pixels without
 * any cross-origin / CORS configuration on the bucket.
 */
export function proxiedStegoUrl(rawUrl: string): string {
  return `/api/stego?url=${encodeURIComponent(rawUrl)}`;
}

// ---- helpers --------------------------------------------------------------

function cryptoRandomId(): string {
  const buf = new Uint8Array(16);
  crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < buf.length; i++) s += buf[i]!.toString(16).padStart(2, "0");
  return s;
}
