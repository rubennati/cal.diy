import { describe, expect, it } from "vitest";
import {
  getZohoCalendarApiBaseUrl,
  getZohoOAuthBaseUrl,
  getZohoUserInfoUrl,
  requireZohoRegion,
  resolveZohoRegion,
  ZOHO_REGIONS,
} from "./zohoServerLocation";

/**
 * These are the fork's guard against the trust-boundary defect in issue #43 returning through an
 * upstream sync. Upstream still concatenates the OAuth `location` parameter into the Zoho
 * hostname, so a merge that restores that shape has to fail here rather than ship quietly.
 *
 * The invariant under test is behavioural rather than textual: whatever a caller supplies, the
 * host of every Zoho URL is one of a fixed set. That survives refactoring in a way that grepping
 * for a template literal would not.
 */

const ZOHO_HOSTS_BY_REGION = {
  us: { accounts: "accounts.zoho.com", calendar: "calendar.zoho.com" },
  eu: { accounts: "accounts.zoho.eu", calendar: "calendar.zoho.eu" },
  in: { accounts: "accounts.zoho.in", calendar: "calendar.zoho.in" },
  au: { accounts: "accounts.zoho.com.au", calendar: "calendar.zoho.com.au" },
  jp: { accounts: "accounts.zoho.jp", calendar: "calendar.zoho.jp" },
  cn: { accounts: "accounts.zoho.com.cn", calendar: "calendar.zoho.com.cn" },
  ca: { accounts: "accounts.zohocloud.ca", calendar: "calendar.zohocloud.ca" },
  sa: { accounts: "accounts.zoho.sa", calendar: "calendar.zoho.sa" },
  uk: { accounts: "accounts.zoho.uk", calendar: "calendar.zoho.uk" },
} as const;

/**
 * Inputs that must never resolve. Several are the concrete shapes that made the original
 * implementation exfiltrate credentials: `attacker.example` produced
 * `accounts.zoho.attacker.example`, and `com@attacker.example` replaced the host outright via
 * URL userinfo syntax.
 */
const REJECTED_LOCATIONS: [label: string, value: unknown][] = [
  ["arbitrary domain", "attacker.example"],
  ["subdomain takeover shape", "com.attacker.example"],
  ["userinfo host replacement", "com@attacker.example"],
  ["userinfo with credentials", "com:pass@attacker.example"],
  ["path traversal", "com/../../attacker.example"],
  ["leading slashes", "//attacker.example"],
  ["absolute url", "https://attacker.example"],
  ["scheme only", "https://"],
  ["port suffix", "com:8080"],
  ["host with port", "attacker.example:443"],
  ["percent-encoded at sign", "com%40attacker.example"],
  ["percent-encoded slash", "com%2Fattacker.example"],
  ["double-encoded", "com%2540attacker.example"],
  ["trailing dot", "com."],
  ["leading dot", ".com"],
  ["bare dot", "."],
  ["query fragment", "com?x=1"],
  ["hash fragment", "com#x"],
  ["newline injection", "com\nattacker.example"],
  ["carriage return", "com\r\nHost: attacker.example"],
  ["null byte", "com\u0000.attacker.example"],
  ["leading whitespace", " us"],
  ["trailing whitespace", "us "],
  ["internal whitespace", "co m"],
  ["empty string", ""],
  ["unknown region", "xx"],
  ["unknown tld", "zoho.dev"],
  ["prototype key", "__proto__"],
  ["constructor key", "constructor"],
  ["toString key", "toString"],
  ["undefined", undefined],
  ["null", null],
  ["number", 42],
  ["object", { toString: () => "com" }],
  ["array", ["com"]],
  ["boolean", true],
];

describe("resolveZohoRegion", () => {
  it("resolves every documented Zoho region", () => {
    for (const region of ZOHO_REGIONS) {
      expect(resolveZohoRegion(region)).toBe(region);
    }
  });

  it("covers exactly the regions Zoho documents", () => {
    expect([...ZOHO_REGIONS].sort()).toEqual(["au", "ca", "cn", "eu", "in", "jp", "sa", "uk", "us"]);
  });

  it("folds case for a known region", () => {
    expect(resolveZohoRegion("US")).toBe("us");
    expect(resolveZohoRegion("Eu")).toBe("eu");
  });

  describe("legacy persisted values keep working", () => {
    // Earlier revisions stored a domain fragment instead of a region.
    it.each([
      ["com", "us"],
      ["com.au", "au"],
      ["com.cn", "cn"],
      ["zohocloud.ca", "ca"],
    ])("resolves legacy %s to %s", (stored, expected) => {
      expect(resolveZohoRegion(stored)).toBe(expected);
    });
  });

  describe("rejects untrusted input", () => {
    it.each(REJECTED_LOCATIONS)("rejects %s", (_label, value) => {
      expect(resolveZohoRegion(value)).toBeNull();
    });
  });
});

describe("requireZohoRegion", () => {
  it("returns the region for a valid value", () => {
    expect(requireZohoRegion("eu")).toBe("eu");
    expect(requireZohoRegion("com")).toBe("us");
  });

  it.each(REJECTED_LOCATIONS)("fails closed for %s", (_label, value) => {
    expect(() => requireZohoRegion(value)).toThrow(/unrecognised server location/i);
  });

  it("does not put the rejected value in the error message", () => {
    // The stored value is attacker-influenced and the surrounding code logs these errors.
    expect(() => requireZohoRegion("com@attacker.example")).not.toThrow(/attacker\.example/);
  });
});

describe("URL construction", () => {
  it("maps every region to its documented Zoho hosts", () => {
    for (const region of ZOHO_REGIONS) {
      const expected = ZOHO_HOSTS_BY_REGION[region];
      expect(new URL(getZohoOAuthBaseUrl(region)).host).toBe(expected.accounts);
      expect(new URL(getZohoUserInfoUrl(region)).host).toBe(expected.accounts);
      expect(new URL(getZohoCalendarApiBaseUrl(region)).host).toBe(expected.calendar);
    }
  });

  it("uses zohocloud.ca for Canada rather than zoho.ca", () => {
    // The one region whose domain is not zoho.<tld>; a suffix template silently gets this wrong.
    expect(new URL(getZohoOAuthBaseUrl("ca")).host).toBe("accounts.zohocloud.ca");
    expect(new URL(getZohoCalendarApiBaseUrl("ca")).host).toBe("calendar.zohocloud.ca");
  });

  it("always produces https and the documented paths", () => {
    for (const region of ZOHO_REGIONS) {
      expect(new URL(getZohoOAuthBaseUrl(region)).protocol).toBe("https:");
      expect(getZohoOAuthBaseUrl(region)).toMatch(/\/oauth\/v2$/);
      expect(getZohoUserInfoUrl(region)).toMatch(/\/oauth\/user\/info$/);
      expect(getZohoCalendarApiBaseUrl(region)).toMatch(/\/api\/v1$/);
    }
  });

  it("cannot be steered to a non-Zoho host by any rejected input", () => {
    // The core invariant: no input reaches host construction unless it resolved to a region
    // first, and every region maps to a Zoho-owned host.
    const allowedHosts = new Set(
      ZOHO_REGIONS.flatMap((region) => [
        ZOHO_HOSTS_BY_REGION[region].accounts,
        ZOHO_HOSTS_BY_REGION[region].calendar,
      ])
    );

    for (const [, value] of REJECTED_LOCATIONS) {
      const region = resolveZohoRegion(value);
      expect(region).toBeNull();
    }

    for (const region of ZOHO_REGIONS) {
      for (const url of [
        getZohoOAuthBaseUrl(region),
        getZohoUserInfoUrl(region),
        getZohoCalendarApiBaseUrl(region),
      ]) {
        expect(allowedHosts.has(new URL(url).host)).toBe(true);
      }
    }
  });
});
