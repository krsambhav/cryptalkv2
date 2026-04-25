"use client";

/**
 * /dev/test — manual verification gate for Phase 1.
 *
 * Runs the complete crypto + stego round-trip:
 *   passphrase + salt → AES key
 *   plaintext → ciphertext (AES-GCM)
 *   ciphertext → embedded into a cover (LSB)
 *   stego PNG → decoded back into ciphertext
 *   ciphertext → decrypted (AES-GCM) → plaintext
 *   asserts the recovered plaintext matches the input
 *
 * Visualizes every intermediate step so a reviewer can confirm correctness
 * without reading the test code.
 */

import { useEffect, useRef, useState } from "react";
import {
  bufferToBase64,
  bufferToHex,
  CRYPTO_PARAMS,
  decrypt,
  deriveKey,
  encrypt,
  generatePassphrase,
  generateSalt,
  sha256,
} from "@/lib/crypto";
import {
  COVERS,
  fetchAndVerifyCover,
  getCover,
} from "@/lib/covers";
import {
  embed,
  extract,
  getCapacityBytes,
  loadImage,
} from "@/lib/stego";

type Stage =
  | { kind: "idle" }
  | { kind: "running"; step: string }
  | { kind: "done"; result: TestResult }
  | { kind: "error"; message: string };

interface TestResult {
  passphrase: string;
  saltHex: string;
  coverId: string;
  coverHash: string;
  capacityBytes: number;
  plaintext: string;
  ciphertextLen: number;
  ciphertextPreview: string;
  stegoUrl: string;
  stegoBlobBytes: number;
  recovered: string;
  match: boolean;
  timings: Record<string, number>;
}

export default function DevTestPage() {
  const [stage, setStage] = useState<Stage>({ kind: "idle" });
  const [coverId, setCoverId] = useState<string>(COVERS[0]?.id ?? "");
  const [plaintext, setPlaintext] = useState("hello world — sealed in plain sight");
  const cleanupUrls = useRef<string[]>([]);

  useEffect(() => {
    return () => {
      cleanupUrls.current.forEach((u) => URL.revokeObjectURL(u));
    };
  }, []);

  async function run() {
    setStage({ kind: "running", step: "starting" });
    const t = new Map<string, number>();
    const mark = (label: string, start: number) =>
      t.set(label, performance.now() - start);

    try {
      // 1. derive key
      setStage({ kind: "running", step: "deriving AES-256 key (PBKDF2 · 600k)" });
      const passphrase = generatePassphrase();
      const salt = generateSalt();
      let s = performance.now();
      const key = await deriveKey(passphrase, salt);
      mark("deriveKey", s);

      // 2. encrypt
      setStage({ kind: "running", step: "encrypting payload (AES-256-GCM)" });
      const enc = new TextEncoder();
      const plain = enc.encode(plaintext);
      s = performance.now();
      const ct = await encrypt(plain, key);
      mark("encrypt", s);

      // 3. fetch + verify cover
      setStage({ kind: "running", step: "verifying cover hash (SHA-256)" });
      s = performance.now();
      const coverBlob = await fetchAndVerifyCover(coverId);
      mark("fetchCover", s);
      const coverUrl = URL.createObjectURL(coverBlob);
      cleanupUrls.current.push(coverUrl);
      const coverImg = await loadImage(coverUrl);
      const coverBytes = new Uint8Array(await coverBlob.arrayBuffer());
      const coverHash = await sha256(coverBytes);
      const capacity = getCapacityBytes(coverImg.width, coverImg.height);

      // 4. embed
      setStage({ kind: "running", step: `embedding ${ct.byteLength} ciphertext bytes` });
      s = performance.now();
      const stegoBlob = await embed(coverImg, ct);
      mark("embed", s);
      const stegoUrl = URL.createObjectURL(stegoBlob);
      cleanupUrls.current.push(stegoUrl);

      // 5. extract
      setStage({ kind: "running", step: "extracting from stego PNG" });
      const stegoImg = await loadImage(stegoUrl);
      s = performance.now();
      const recoveredCt = await extract(stegoImg);
      mark("extract", s);

      // 6. decrypt
      setStage({ kind: "running", step: "decrypting recovered payload" });
      s = performance.now();
      const recoveredPlain = await decrypt(recoveredCt, key);
      mark("decrypt", s);
      const recovered = new TextDecoder().decode(recoveredPlain);

      const result: TestResult = {
        passphrase,
        saltHex: bufferToHex(salt),
        coverId,
        coverHash,
        capacityBytes: capacity,
        plaintext,
        ciphertextLen: ct.byteLength,
        ciphertextPreview: bufferToBase64(ct).slice(0, 96),
        stegoUrl,
        stegoBlobBytes: stegoBlob.size,
        recovered,
        match: recovered === plaintext,
        timings: Object.fromEntries(t),
      };
      setStage({ kind: "done", result });
    } catch (err) {
      setStage({ kind: "error", message: err instanceof Error ? err.message : String(err) });
    }
  }

  return (
    <main className="min-h-dvh px-6 py-12 max-w-3xl mx-auto">
      <header className="mb-10">
        <p className="text-xs uppercase tracking-[0.2em] text-muted">phase 1 · verification gate</p>
        <h1 className="font-display text-5xl mt-2">Round-trip test</h1>
        <p className="mt-3 text-text-2 max-w-prose">
          Encrypts, embeds, extracts, and decrypts a string through the full pipeline.
          A green checkmark means crypto.ts and stego.ts are wired correctly.
        </p>
      </header>

      <section className="rounded-xl border bg-surface p-5 mb-6 space-y-4">
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted">cover</span>
          <select
            value={coverId}
            onChange={(e) => setCoverId(e.target.value)}
            className="mt-1 w-full rounded-md border bg-bg-2 px-3 py-2 text-text"
          >
            {COVERS.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.id}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs uppercase tracking-wider text-muted">plaintext</span>
          <textarea
            value={plaintext}
            onChange={(e) => setPlaintext(e.target.value)}
            rows={3}
            className="mt-1 w-full rounded-md border bg-bg-2 px-3 py-2 text-text font-mono text-sm"
          />
        </label>
        <button
          onClick={run}
          disabled={stage.kind === "running"}
          className="rounded-md bg-accent text-bg px-4 py-2 font-medium disabled:opacity-50"
        >
          {stage.kind === "running" ? `running — ${stage.step}` : "run round-trip"}
        </button>
      </section>

      {stage.kind === "error" && (
        <div className="rounded-xl border border-danger bg-danger/10 p-4 text-danger">
          <strong>error:</strong> {stage.message}
        </div>
      )}

      {stage.kind === "done" && <Result result={stage.result} />}

      <footer className="mt-12 text-xs text-muted">
        PBKDF2 · {CRYPTO_PARAMS.pbkdf2Iterations.toLocaleString()} iter · SHA-256 ·
        AES-{CRYPTO_PARAMS.aesKeyLength}-GCM · {CRYPTO_PARAMS.ivLength}-byte IV ·
        {CRYPTO_PARAMS.saltLength}-byte salt
      </footer>
    </main>
  );
}

function Result({ result }: { result: TestResult }) {
  const cover = getCover(result.coverId);
  const sumMs = Object.values(result.timings).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 animate-fade-up">
      <div
        className={`rounded-xl border p-5 ${
          result.match
            ? "border-success/40 bg-success/5"
            : "border-danger/40 bg-danger/5"
        }`}
      >
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-3xl">
            {result.match ? "round-trip succeeded" : "round-trip failed"}
          </h2>
          <span className="font-mono text-sm text-muted">{sumMs.toFixed(0)} ms total</span>
        </div>
        <p className="mt-2 text-text-2">
          {result.match
            ? "The recovered plaintext is byte-identical to the original."
            : "Recovered plaintext does not match the original — investigate."}
        </p>
      </div>

      <Field label="passphrase">
        <code className="font-mono text-sm break-all">{result.passphrase}</code>
      </Field>
      <Field label="salt (hex)">
        <code className="font-mono text-xs break-all text-muted">{result.saltHex}</code>
      </Field>

      <div className="grid sm:grid-cols-2 gap-6">
        <Field label="cover (verified hash)">
          <CoverPreview src={cover?.url} name={cover?.name ?? "?"} />
          <code className="font-mono text-[10px] break-all text-muted block mt-2">{result.coverHash}</code>
        </Field>
        <Field label="stego PNG (visually identical)">
          <CoverPreview src={result.stegoUrl} name="stego output" />
          <p className="text-xs text-muted mt-2">
            {(result.stegoBlobBytes / 1024).toFixed(1)} KB · capacity {(result.capacityBytes / 1024).toFixed(1)} KB
          </p>
        </Field>
      </div>

      <Field label="ciphertext (base64, first 96 chars)">
        <code className="font-mono text-xs text-muted break-all">{result.ciphertextPreview}…</code>
        <p className="text-xs text-muted mt-1">{result.ciphertextLen} bytes</p>
      </Field>

      <Field label="recovered plaintext">
        <code className="font-mono text-sm">{result.recovered}</code>
      </Field>

      <Field label="timings (ms)">
        <ul className="font-mono text-xs space-y-1">
          {Object.entries(result.timings).map(([k, v]) => (
            <li key={k} className="flex justify-between">
              <span className="text-muted">{k}</span>
              <span>{v.toFixed(1)}</span>
            </li>
          ))}
        </ul>
      </Field>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border bg-surface p-5">
      <div className="text-[11px] uppercase tracking-[0.18em] text-muted mb-2">{label}</div>
      {children}
    </div>
  );
}

function CoverPreview({ src, name }: { src?: string; name: string }) {
  if (!src) return <div className="text-muted text-sm">no preview</div>;
  return (
    <div className="rounded-lg overflow-hidden border bg-bg-2 aspect-[4/3]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={name} className="w-full h-full object-cover" />
    </div>
  );
}
