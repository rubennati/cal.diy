import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Verify that a Canvas Kit request genuinely came from Intercom.
 *
 * Intercom signs every Canvas Kit request (Initialize, Submit, Configure, Sheet) with an
 * `X-Body-Signature` header: the hex HMAC-SHA256 of the raw JSON request body, keyed with the
 * app's OAuth `client_secret`.
 *
 * The signature must be computed over the **raw bytes** as received. Re-serialising a parsed body
 * would not reproduce them — key order, whitespace and unicode escaping are all free to differ —
 * so the route that calls this must disable Next.js body parsing.
 *
 * @see https://developers.intercom.com/docs/canvas-kit
 */
export const INTERCOM_SIGNATURE_HEADER = "x-body-signature";

export function verifyCanvasSignature({
  rawBody,
  signature,
  clientSecret,
}: {
  rawBody: Buffer;
  signature: unknown;
  clientSecret: string;
}): boolean {
  if (typeof signature !== "string" || signature.length === 0) return false;
  if (clientSecret.length === 0) return false;

  const expected = createHmac("sha256", clientSecret).update(rawBody).digest("hex");

  // `timingSafeEqual` throws on a length mismatch, so the length is checked first. Comparing
  // lengths is not itself a leak: the digest length is fixed and public.
  const provided = Buffer.from(signature.toLowerCase(), "utf8");
  const expectedBuffer = Buffer.from(expected, "utf8");
  if (provided.length !== expectedBuffer.length) return false;

  return timingSafeEqual(provided, expectedBuffer);
}
