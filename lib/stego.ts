/**
 * lib/stego.ts
 *
 * LSB (Least Significant Bit) steganography for CrypTalk. Hides an
 * arbitrary byte payload inside the R, G, and B channels of a 24-bit
 * RGBA cover image. The alpha channel is left untouched so that
 * transparent regions in the cover (if any) don't develop visible
 * artifacts.
 *
 * Wire format embedded in the LSBs:
 *
 *     [ 32-bit big-endian length ][ length × 8 bits of payload ]
 *
 * The 32-bit length prefix is itself stored bit-by-bit in the LSBs of
 * the first 32 RGB sub-pixels. Once we read that length, we know
 * exactly how many subsequent LSBs to consume, so we never read past
 * the actual ciphertext.
 *
 * Capacity:
 *   bits = width * height * 3        (R, G, B per pixel)
 *   bytes = (bits / 8) - 4           (4-byte length header)
 *   For a 2000×1500 cover that's 1.125 MB of payload — far more than
 *   any text or 60s 32kbps Opus clip will ever be.
 *
 * Embedding strategy:
 *   Sequential LSB embed (top-left → bottom-right, channel order R, G,
 *   B). v1 only. v2 will randomize the embed sequence using a PRNG
 *   seeded from the conversation key — that's tracked in FUTURE.md.
 *
 * Output:
 *   PNG via canvas.toBlob('image/png'). PNG is lossless — JPEG would
 *   destroy LSB data instantly. Browsers serialize toBlob('image/png')
 *   with maximum quality so our stego survives the round-trip through
 *   Firebase Storage.
 */

const LENGTH_HEADER_BYTES = 4;
const LENGTH_HEADER_BITS = LENGTH_HEADER_BYTES * 8;

/** Bytes of payload that fit in a cover of this size. */
export function getCapacityBytes(width: number, height: number): number {
  const totalBits = width * height * 3;
  const headerBits = LENGTH_HEADER_BITS;
  return Math.max(0, Math.floor((totalBits - headerBits) / 8));
}

/**
 * Embeds `payload` into `coverImage` and returns a PNG Blob. The cover
 * image must already be loaded (HTMLImageElement.complete === true).
 *
 * Throws if the payload exceeds the cover's capacity.
 */
export async function embed(
  coverImage: HTMLImageElement,
  payload: Uint8Array,
): Promise<Blob> {
  const { width, height } = coverImage;
  if (width === 0 || height === 0) {
    throw new Error("cover image has zero dimensions — image not loaded?");
  }
  const capacity = getCapacityBytes(width, height);
  if (payload.byteLength > capacity) {
    throw new Error(
      `payload too large for cover: ${payload.byteLength} bytes vs ${capacity} capacity`,
    );
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("could not get 2d context");

  ctx.drawImage(coverImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data; // Uint8ClampedArray RGBA RGBA …

  // Build the bitstream: 32-bit length header + payload
  const length = payload.byteLength;
  const headerBits = uint32ToBigEndianBits(length);
  const payloadBits = bytesToBitsLE(payload); // MSB-first within each byte

  const totalBits = headerBits.length + payloadBits.length;

  let bitIdx = 0;
  // Walk pixels in row-major order, channel order R G B (skip alpha at idx %4 === 3)
  for (let i = 0; i < pixels.length && bitIdx < totalBits; i++) {
    if (i % 4 === 3) continue; // alpha — leave alone
    const bit = bitIdx < headerBits.length
      ? headerBits[bitIdx]!
      : payloadBits[bitIdx - headerBits.length]!;
    // clear LSB then set it to `bit`
    pixels[i] = (pixels[i]! & 0xfe) | bit;
    bitIdx += 1;
  }

  ctx.putImageData(imageData, 0, 0);

  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error("canvas.toBlob returned null"));
    }, "image/png");
  });
}

/**
 * Extracts a payload previously embedded by embed(). Reads the 32-bit
 * length prefix first, then reads exactly that many bytes of payload.
 *
 * Throws if the declared length exceeds the cover's capacity (likely a
 * non-stego image was passed in).
 */
export async function extract(stegoImage: HTMLImageElement): Promise<Uint8Array> {
  const { width, height } = stegoImage;
  if (width === 0 || height === 0) {
    throw new Error("stego image has zero dimensions — image not loaded?");
  }
  const capacity = getCapacityBytes(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("could not get 2d context");

  ctx.drawImage(stegoImage, 0, 0);
  const imageData = ctx.getImageData(0, 0, width, height);
  const pixels = imageData.data;

  // Step 1: read the 32-bit length header
  const headerBits: number[] = [];
  let i = 0;
  while (headerBits.length < LENGTH_HEADER_BITS && i < pixels.length) {
    if (i % 4 !== 3) {
      headerBits.push(pixels[i]! & 1);
    }
    i += 1;
  }
  if (headerBits.length < LENGTH_HEADER_BITS) {
    throw new Error("cover too small to contain a length header");
  }
  const length = bigEndianBitsToUint32(headerBits);
  if (length > capacity) {
    throw new Error(
      `extracted length ${length} exceeds cover capacity ${capacity} — not a stego image, or corrupted`,
    );
  }

  // Step 2: read `length` bytes of payload
  const payloadBitCount = length * 8;
  const payloadBits = new Uint8Array(payloadBitCount);
  let bitIdx = 0;
  while (bitIdx < payloadBitCount && i < pixels.length) {
    if (i % 4 !== 3) {
      payloadBits[bitIdx] = pixels[i]! & 1;
      bitIdx += 1;
    }
    i += 1;
  }
  if (bitIdx < payloadBitCount) {
    throw new Error("ran out of pixels before reading full payload");
  }

  return bitsToBytesLE(payloadBits);
}

// ---- bit packing helpers --------------------------------------------------

function uint32ToBigEndianBits(n: number): number[] {
  if (n < 0 || n > 0xffff_ffff) throw new Error("length out of u32 range");
  const bits = new Array<number>(32);
  for (let i = 0; i < 32; i++) {
    bits[i] = (n >>> (31 - i)) & 1;
  }
  return bits;
}

function bigEndianBitsToUint32(bits: ReadonlyArray<number>): number {
  // Use unsigned math — the result can be up to 2^32-1.
  let n = 0;
  for (let i = 0; i < 32; i++) {
    n = n * 2 + (bits[i]! & 1);
  }
  return n >>> 0;
}

/** Bytes → MSB-first bits flat array (8 bits per byte). */
function bytesToBitsLE(bytes: Uint8Array): Uint8Array {
  const out = new Uint8Array(bytes.length * 8);
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i]!;
    out[i * 8 + 0] = (b >> 7) & 1;
    out[i * 8 + 1] = (b >> 6) & 1;
    out[i * 8 + 2] = (b >> 5) & 1;
    out[i * 8 + 3] = (b >> 4) & 1;
    out[i * 8 + 4] = (b >> 3) & 1;
    out[i * 8 + 5] = (b >> 2) & 1;
    out[i * 8 + 6] = (b >> 1) & 1;
    out[i * 8 + 7] = (b >> 0) & 1;
  }
  return out;
}

function bitsToBytesLE(bits: Uint8Array): Uint8Array {
  if (bits.length % 8 !== 0) {
    throw new Error("bit count not divisible by 8");
  }
  const out = new Uint8Array(bits.length / 8);
  for (let i = 0; i < out.length; i++) {
    out[i] =
      (bits[i * 8 + 0]! << 7) |
      (bits[i * 8 + 1]! << 6) |
      (bits[i * 8 + 2]! << 5) |
      (bits[i * 8 + 3]! << 4) |
      (bits[i * 8 + 4]! << 3) |
      (bits[i * 8 + 5]! << 2) |
      (bits[i * 8 + 6]! << 1) |
      (bits[i * 8 + 7]! << 0);
  }
  return out;
}

// ---- helpers --------------------------------------------------------------

/**
 * Loads an image from a URL into an HTMLImageElement that's ready to
 * pass to embed/extract. Sets crossOrigin="anonymous" so that canvas
 * pixel reads aren't tainted by CORS.
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`failed to load image: ${src}`));
    img.src = src;
  });
}
