import { createHmac } from "node:crypto";
import type { IncomingHttpHeaders } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Route-boundary guard for issue #44: proves the signature check actually gates entry to the
 * business logic, at the level the handler is actually invoked — not just that
 * `verifyCanvasSignature` returns the right boolean in isolation.
 *
 * The step handlers are mocked so this stays a routing/auth test rather than re-exercising
 * `link.ts`'s own logic (covered separately). The secret below is obviously synthetic.
 */

const CLIENT_SECRET = "synthetic-intercom-route-secret";

const { getAppKeysFromSlugMock, handleLinkStepMock, handleButtonAndInvitationStepMock } = vi.hoisted(() => ({
  getAppKeysFromSlugMock: vi.fn(),
  handleLinkStepMock: vi.fn(),
  handleButtonAndInvitationStepMock: vi.fn(),
}));

vi.mock("../../_utils/getAppKeysFromSlug", () => ({ default: getAppKeysFromSlugMock }));
vi.mock("../lib/configure/link", () => ({ handleLinkStep: handleLinkStepMock }));
vi.mock("../lib/configure/button", () => ({
  handleButtonAndInvitationStep: handleButtonAndInvitationStepMock,
}));

import handler from "./configure";

function sign(body: string, secret: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

/** A NextApiRequest is an IncomingMessage (async-iterable over Buffer chunks) plus a few fields. */
function fakeRequest(bodyString: string, headers: IncomingHttpHeaders, method = "POST") {
  const buffer = Buffer.from(bodyString);
  return {
    method,
    headers,
    async *[Symbol.asyncIterator]() {
      yield buffer;
    },
  } as unknown as Parameters<typeof handler>[0];
}

function fakeResponse() {
  const res: { statusCode?: number; body?: unknown } = {};
  const api = {
    status: vi.fn((code: number) => {
      res.statusCode = code;
      return api;
    }),
    json: vi.fn((payload: unknown) => {
      res.body = payload;
      return api;
    }),
  };
  return { res: api as unknown as Parameters<typeof handler>[1], captured: res };
}

beforeEach(() => {
  vi.clearAllMocks();
  getAppKeysFromSlugMock.mockResolvedValue({ client_id: "synthetic-client-id", client_secret: CLIENT_SECRET });
  handleLinkStepMock.mockResolvedValue({ canvas: { content: { components: [] } } });
  handleButtonAndInvitationStepMock.mockResolvedValue(undefined);
});

describe("intercom configure — route boundary", () => {
  it("a validly signed request reaches configure logic", async () => {
    const body = JSON.stringify({ component_id: "x", input_values: {} });
    const req = fakeRequest(body, { "x-body-signature": sign(body, CLIENT_SECRET) });
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(handleLinkStepMock).toHaveBeenCalledTimes(1);
    expect(captured.statusCode).toBe(200);
  });

  it("a request with no signature does not reach configure logic", async () => {
    const body = JSON.stringify({ component_id: "x", input_values: {} });
    const req = fakeRequest(body, {});
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(handleLinkStepMock).not.toHaveBeenCalled();
    expect(handleButtonAndInvitationStepMock).not.toHaveBeenCalled();
    expect(captured.statusCode).toBe(401);
  });

  it("a request with an invalid signature does not reach configure logic", async () => {
    const body = JSON.stringify({ component_id: "x", input_values: {} });
    const req = fakeRequest(body, { "x-body-signature": sign(body, "wrong-secret") });
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(handleLinkStepMock).not.toHaveBeenCalled();
    expect(captured.statusCode).toBe(401);
  });

  it("a body altered after signing does not reach configure logic", async () => {
    const signedBody = JSON.stringify({ component_id: "x", input_values: {} });
    const signature = sign(signedBody, CLIENT_SECRET);
    const tamperedBody = JSON.stringify({ component_id: "y", input_values: {} });
    const req = fakeRequest(tamperedBody, { "x-body-signature": signature });
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(handleLinkStepMock).not.toHaveBeenCalled();
    expect(captured.statusCode).toBe(401);
  });

  it("fails closed when Intercom keys are not configured, even with no signature required", async () => {
    getAppKeysFromSlugMock.mockResolvedValue({});
    const body = JSON.stringify({ component_id: "x", input_values: {} });
    const req = fakeRequest(body, { "x-body-signature": sign(body, CLIENT_SECRET) });
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(handleLinkStepMock).not.toHaveBeenCalled();
    expect(captured.statusCode).toBe(403);
  });

  it("rejects a non-POST method before any signature work", async () => {
    const req = fakeRequest("{}", {}, "GET");
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(getAppKeysFromSlugMock).not.toHaveBeenCalled();
    expect(captured.statusCode).toBe(405);
  });

  it("rejects a body over the size cap before signature verification", async () => {
    const oversized = "a".repeat(64 * 1024 + 1);
    const req = fakeRequest(oversized, { "x-body-signature": "irrelevant" });
    const { res, captured } = fakeResponse();

    await handler(req, res);

    expect(handleLinkStepMock).not.toHaveBeenCalled();
    expect(captured.statusCode).toBe(413);
  });
});
