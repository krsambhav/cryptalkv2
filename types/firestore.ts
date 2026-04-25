import { z } from "zod";

/** /users/{uid} */
export const UserDoc = z.object({
  email: z.string().email(),
  displayName: z.string().min(1).max(80),
  createdAt: z.number().int().nonnegative(),
});
export type UserDocT = z.infer<typeof UserDoc>;

/** /conversations/{convoId} */
export const ConversationDoc = z.object({
  participants: z.array(z.string()).length(2),
  /** base64-encoded 16-byte salt for PBKDF2 — non-secret, safe to store */
  salt: z.string().min(20).max(40),
  /** ids of covers eligible for this conversation */
  coverPoolIds: z.array(z.string()).min(1),
  createdAt: z.number().int().nonnegative(),
  lastMessageAt: z.number().int().nonnegative().nullable(),
  /** display label for the conversation (counterpart's email by default) */
  participantEmails: z.array(z.string()).length(2),
});
export type ConversationDocT = z.infer<typeof ConversationDoc>;

/** /conversations/{convoId}/messages/{msgId} */
export const MessageDoc = z.object({
  senderId: z.string(),
  stegoUrl: z.string().url(),
  coverId: z.string(),
  /** server-assigned timestamp */
  ts: z.number().int().nonnegative(),
});
export type MessageDocT = z.infer<typeof MessageDoc>;

/** Validates an arbitrary Firestore doc against a schema. */
export function parseDoc<T>(schema: z.ZodType<T>, raw: unknown): T {
  return schema.parse(raw);
}
