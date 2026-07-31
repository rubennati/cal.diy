import type { NextApiRequest, NextApiResponse } from "next";
import { createMocks } from "node-mocks-http";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultHandler } from "./defaultHandler";

describe("defaultHandler Test Suite", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should return 405 for unsupported HTTP methods", async () => {
    const handlers = {};
    const handler = defaultHandler(handlers);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "PATCH", // Unsupported method here
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getJSONData()).toEqual({
      message: "Method Not Allowed (Allow: )",
    });
  });

  it("should call the correct handler for a supported method", async () => {
    const getHandler = vi.fn().mockResolvedValue(null);
    // Handlers are declared as promises (they model dynamic `import()`); `await` unwraps a
    // plain object identically, which is why this passed at runtime while mistyped.
    const handlers = {
      GET: Promise.resolve({ default: getHandler }),
    };
    const handler = defaultHandler(handlers);

    const { req, res } = createMocks<NextApiRequest, NextApiResponse>({
      method: "GET",
    });

    await handler(req, res);

    expect(getHandler).toHaveBeenCalledWith(req, res);
  });
});
