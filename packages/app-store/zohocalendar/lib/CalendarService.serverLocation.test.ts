import type { CredentialPayload } from "@calcom/types/Credential";
import { beforeEach, describe, expect, it, vi } from "vitest";
import BuildCalendarService from "./CalendarService";

/**
 * Behavioural half of the issue #43 guard.
 *
 * `zohoServerLocation.test.ts` pins the mapping primitive. This file pins the property that
 * actually matters at runtime: a persisted `server_location` the fork does not recognise must
 * not reach the network at all. The refresh call carries the app's `client_secret` and the
 * calendar and user-info calls carry the user's access token, so "throws eventually" is not
 * good enough — the assertion is that `fetch` is never invoked.
 *
 * Credentials here are obviously synthetic.
 */

// `vi.mock` factories are hoisted above module scope, so the doubles have to be created inside
// `vi.hoisted` to exist by the time the factories run.
const { prismaMock, getAppKeysFromSlugMock } = vi.hoisted(() => ({
  prismaMock: { credential: { update: vi.fn() } },
  getAppKeysFromSlugMock: vi.fn(),
}));

vi.mock("@calcom/prisma", () => ({ default: prismaMock }));
vi.mock("../../_utils/getAppKeysFromSlug", () => ({ default: getAppKeysFromSlugMock }));

const FUTURE = Math.round(Date.now() / 1000) + 3600;
const PAST = Math.round(Date.now() / 1000) - 3600;

// Minimal shape the service actually reads. Cast through `unknown` rather than widening the
// service's parameter type just for a test.
function credentialWith(serverLocation: unknown, expiresIn: number): CredentialPayload {
  return {
    id: 1,
    key: {
      access_token: "synthetic-access-token",
      refresh_token: "synthetic-refresh-token",
      expires_in: expiresIn,
      server_location: serverLocation,
    },
  } as unknown as CredentialPayload;
}

function jsonResponse(body: unknown) {
  return { ok: true, status: 200, json: async () => body, text: async () => JSON.stringify(body) };
}

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  getAppKeysFromSlugMock.mockResolvedValue({
    client_id: "synthetic-client-id",
    client_secret: "synthetic-client-secret",
  });
  fetchMock = vi.fn();
  vi.stubGlobal("fetch", fetchMock);
});

const POISONED_LOCATIONS = [
  ["arbitrary domain", "attacker.example"],
  ["userinfo host replacement", "com@attacker.example"],
  ["absolute url", "https://attacker.example"],
  ["path traversal", "com/../attacker.example"],
  ["unknown region", "xx"],
  ["empty", ""],
  ["missing", undefined],
] as const;

describe("ZohoCalendarService — persisted server_location is revalidated", () => {
  describe.each(POISONED_LOCATIONS)("with a %s persisted value", (_label, poisoned) => {
    it("makes no request when the token is still valid", async () => {
      const service = BuildCalendarService(credentialWith(poisoned, FUTURE));

      await expect(service.listCalendars()).rejects.toThrow(/unrecognised server location/i);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("makes no request when the token is expired, so refresh cannot carry client_secret", async () => {
      const service = BuildCalendarService(credentialWith(poisoned, PAST));

      await expect(service.listCalendars()).rejects.toThrow();
      // The refresh path is the one that puts client_id and client_secret in a query string.
      expect(fetchMock).not.toHaveBeenCalled();
      expect(prismaMock.credential.update).not.toHaveBeenCalled();
    });
  });

  it("never leaks the app secret into an outbound request for a poisoned credential", async () => {
    const service = BuildCalendarService(credentialWith("com@attacker.example", PAST));

    await expect(service.listCalendars()).rejects.toThrow();

    const everyRequestedUrl = fetchMock.mock.calls.map(([url]) => String(url)).join(" ");
    expect(everyRequestedUrl).not.toContain("synthetic-client-secret");
    expect(everyRequestedUrl).toBe("");
  });
});

describe("ZohoCalendarService — supported regions still work", () => {
  it.each([
    ["eu", "calendar.zoho.eu", "accounts.zoho.eu"],
    ["us", "calendar.zoho.com", "accounts.zoho.com"],
    ["ca", "calendar.zohocloud.ca", "accounts.zohocloud.ca"],
    // Legacy domain fragments persisted by earlier revisions.
    ["com", "calendar.zoho.com", "accounts.zoho.com"],
    ["com.au", "calendar.zoho.com.au", "accounts.zoho.com.au"],
  ])("routes a %s credential to %s", async (stored, calendarHost, accountsHost) => {
    fetchMock.mockImplementation(async (url: string) => {
      if (String(url).includes("/oauth/user/info")) {
        return jsonResponse({ Email: "organizer@example.com" });
      }
      return jsonResponse({
        calendars: [{ uid: "cal-1", name: "Primary", isdefault: true, privilege: "owner" }],
      });
    });

    const service = BuildCalendarService(credentialWith(stored, FUTURE));
    const calendars = await service.listCalendars();

    expect(calendars).toHaveLength(1);
    expect(fetchMock).toHaveBeenCalled();

    const hosts = fetchMock.mock.calls.map(([url]) => new URL(String(url)).host);
    expect(hosts).toContain(calendarHost);
    expect(hosts).toContain(accountsHost);
    // Nothing outside the resolved region's two Zoho hosts.
    expect(new Set(hosts)).toEqual(new Set([calendarHost, accountsHost]));
  });
});
