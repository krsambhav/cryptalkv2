/**
 * GET /api/stego?url=<firebase-storage-url>
 *
 * Same-origin proxy for stego PNGs. Avoids the CORS dance required to
 * read pixels from a cross-origin <img> through canvas, and works on any
 * deployment domain without bucket-side configuration.
 *
 * Hardened against SSRF by pinning the upstream host AND the bucket path
 * — the proxy will only relay URLs that point at our own Firebase
 * Storage bucket. Any other URL gets a 403.
 */

import type { NextRequest } from "next/server";

export const runtime = "edge";

const ALLOWED_HOST = "firebasestorage.googleapis.com";
const BUCKET = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "";

export async function GET(req: NextRequest): Promise<Response> {
  const raw = req.nextUrl.searchParams.get("url");
  if (!raw) return new Response("missing url", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new Response("invalid url", { status: 400 });
  }

  if (target.hostname !== ALLOWED_HOST) {
    return new Response("forbidden host", { status: 403 });
  }
  if (!BUCKET || !target.pathname.startsWith(`/v0/b/${BUCKET}/o/`)) {
    return new Response("forbidden bucket", { status: 403 });
  }

  const upstream = await fetch(target.toString(), {
    // No credentials — the URL itself is signed.
    redirect: "follow",
    cache: "no-store",
  });

  if (!upstream.ok || !upstream.body) {
    return new Response(`upstream ${upstream.status}`, { status: upstream.status || 502 });
  }

  const headers = new Headers();
  headers.set("Content-Type", upstream.headers.get("content-type") ?? "image/png");
  const len = upstream.headers.get("content-length");
  if (len) headers.set("Content-Length", len);
  headers.set("Cache-Control", "private, max-age=3600, immutable");

  // Stream the body straight through — no buffering, supports the full
  // 20MB rule cap without hitting serverless function size limits.
  return new Response(upstream.body, { status: 200, headers });
}
