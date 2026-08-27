import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@calcom/lib/constants", () => ({ CAL_URL: "https://cal.example.com" }));

import { isValidCalURL } from "./isValidCalURL";

/**
 * Proves the two properties that matter at the network boundary:
 *  - an invalid link produces no outbound request at all, and
 *  - a valid link produces exactly one request, to this instance, without following redirects.
 *
 * No real request is made; fetch is stubbed throughout.
 */

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ({ status: 200 }));
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("isValidCalURL", () => {
  it("makes no request for a host outside this instance", async () => {
    const result = await isValidCalURL("https://attacker.example/");
    expect(result.isValid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["dot-wildcard hyphen host", "https://cal-example-com/"],
    ["dot-wildcard single-label host", "https://calxexamplexcom/"],
    ["userinfo host replacement", "https://cal.example.com@attacker.example/"],
    ["link-local metadata", "https://169.254.169.254/latest/meta-data/"],
    ["loopback", "https://127.0.0.1/"],
  ])("makes no request for %s", async (_label, url) => {
    const result = await isValidCalURL(url);
    expect(result.isValid).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts a live booking link on this instance", async () => {
    const result = await isValidCalURL("https://cal.example.com/rob/30min");
    expect(result.isValid).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("accepts a subdomain of this instance", async () => {
    const result = await isValidCalURL("https://acme.cal.example.com/team/x");
    expect(result.isValid).toBe(true);
    const [target] = fetchMock.mock.calls[0];
    expect(new URL(String(target)).host).toBe("acme.cal.example.com");
  });

  it("requests only this instance, never the submitted host", async () => {
    await isValidCalURL("https://cal.example.com/rob/30min");
    const [target] = fetchMock.mock.calls[0];
    expect(new URL(String(target)).origin).toBe("https://cal.example.com");
  });

  it("does not follow redirects", async () => {
    await isValidCalURL("https://cal.example.com/rob/30min");
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.redirect).toBe("manual");
  });

  it("treats a redirect as an invalid link rather than chasing it", async () => {
    // With redirect: "manual" a 3xx surfaces as-is. An open redirect on this origin therefore
    // cannot become a second, uncontrolled hop.
    fetchMock.mockResolvedValueOnce({ status: 302 });
    const result = await isValidCalURL("https://cal.example.com/open-redirect?to=http://169.254.169.254/");
    expect(result.isValid).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends no credentials, cookies or authorization headers", async () => {
    await isValidCalURL("https://cal.example.com/rob/30min");
    const [, init] = fetchMock.mock.calls[0];
    expect(init?.headers).toBeUndefined();
    expect(init?.credentials).toBeUndefined();
  });

  it("treats a non-200 as invalid", async () => {
    fetchMock.mockResolvedValueOnce({ status: 404 });
    const result = await isValidCalURL("https://cal.example.com/nobody/nothing");
    expect(result.isValid).toBe(false);
  });
});
