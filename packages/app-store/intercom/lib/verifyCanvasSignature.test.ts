import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { INTERCOM_SIGNATURE_HEADER, verifyCanvasSignature } from "./verifyCanvasSignature";

/**
 * Guard for the caller-authenticity half of issue #44. Secrets here are synthetic.
 */

const CLIENT_SECRET = "synthetic-intercom-client-secret";
const BODY = Buffer.from(JSON.stringify({ component_id: "submit_booking_url", input_values: {} }));

function sign(body: Buffer, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

describe("verifyCanvasSignature", () => {
  it("uses the header name Intercom actually sends", () => {
    // Node lowercases incoming header names, so the lookup key must be lowercase.
    expect(INTERCOM_SIGNATURE_HEADER).toBe("x-body-signature");
  });

  it("accepts a signature computed over the raw body with the client secret", () => {
    const signature = sign(BODY, CLIENT_SECRET);
    expect(verifyCanvasSignature({ rawBody: BODY, signature, clientSecret: CLIENT_SECRET })).toBe(true);
  });

  it("accepts an upper-case hex signature", () => {
    const signature = sign(BODY, CLIENT_SECRET).toUpperCase();
    expect(verifyCanvasSignature({ rawBody: BODY, signature, clientSecret: CLIENT_SECRET })).toBe(true);
  });

  it("rejects a signature made with a different secret", () => {
    const signature = sign(BODY, "some-other-secret");
    expect(verifyCanvasSignature({ rawBody: BODY, signature, clientSecret: CLIENT_SECRET })).toBe(false);
  });

  it("rejects a valid signature for a different body", () => {
    const signature = sign(Buffer.from('{"tampered":true}'), CLIENT_SECRET);
    expect(verifyCanvasSignature({ rawBody: BODY, signature, clientSecret: CLIENT_SECRET })).toBe(false);
  });

  it("rejects a body altered after signing", () => {
    const signature = sign(BODY, CLIENT_SECRET);
    const tampered = Buffer.from(BODY.toString().replace("submit_booking_url", "something_else"));
    expect(verifyCanvasSignature({ rawBody: tampered, signature, clientSecret: CLIENT_SECRET })).toBe(false);
  });

  it.each([
    ["missing", undefined],
    ["null", null],
    ["empty", ""],
    ["not a string", 1234],
    ["truncated", sign(BODY, CLIENT_SECRET).slice(0, 32)],
    ["over-long", `${sign(BODY, CLIENT_SECRET)}00`],
    ["non-hex of correct length", "z".repeat(64)],
  ])("rejects a %s signature", (_label, signature) => {
    expect(verifyCanvasSignature({ rawBody: BODY, signature, clientSecret: CLIENT_SECRET })).toBe(false);
  });

  it("rejects when no client secret is configured, rather than accepting anything", () => {
    const signature = sign(BODY, "");
    expect(verifyCanvasSignature({ rawBody: BODY, signature, clientSecret: "" })).toBe(false);
  });
});
