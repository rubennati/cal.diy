import { describe, expect, it } from "vitest";

import { resolveCalBookingUrl } from "./resolveCalBookingUrl";

/**
 * Guard for the outbound half of issue #44. Upstream still builds this check as a regex
 * interpolated from CAL_URL, so a sync that restores that shape has to fail here.
 *
 * The invariant is behavioural: whatever a caller submits, either the value is rejected or the
 * resulting request target's origin is this instance. No input reaches a fetch destination that
 * server configuration did not already authorise.
 */

const CAL = "https://cal.example.com";

const ACCEPTED: [label: string, input: string, expectedOrigin: string][] = [
  ["exact host", "https://cal.example.com/rob/30min", "https://cal.example.com"],
  ["exact host, root", "https://cal.example.com/", "https://cal.example.com"],
  ["subdomain", "https://acme.cal.example.com/team/x", "https://acme.cal.example.com"],
  ["deep subdomain", "https://a.b.cal.example.com/x", "https://a.b.cal.example.com"],
  ["mixed case host is normalised", "https://CAL.EXAMPLE.COM/x", "https://cal.example.com"],
  ["query string preserved", "https://cal.example.com/rob/30min?month=2026-09", "https://cal.example.com"],
];

const REJECTED: [label: string, input: unknown][] = [
  // The two shapes the unescaped-regex gate used to admit — named in the issue's acceptance criteria.
  ["dot-wildcard hyphen host", "https://cal-example-com/"],
  ["dot-wildcard single-label host", "https://calxexamplexcom/"],

  ["unrelated host", "https://attacker.example/"],
  ["suffix append", "https://cal.example.com.attacker.example/"],
  ["prefix confusion", "https://evil-cal.example.com/"],
  ["substring host", "https://xcal.example.com.attacker.example/"],
  ["userinfo host replacement", "https://cal.example.com@attacker.example/"],
  ["userinfo with password", "https://cal.example.com:pass@attacker.example/"],
  ["explicit port", "https://cal.example.com:8443/"],
  ["port 80 on https base", "https://cal.example.com:80/"],
  ["http downgrade", "http://cal.example.com/"],
  ["file scheme", "file:///etc/passwd"],
  ["gopher scheme", "gopher://cal.example.com/"],
  ["javascript scheme", "javascript:alert(1)"],
  ["data scheme", "data:text/html,x"],
  ["scheme-relative", "//attacker.example/"],
  ["protocol-relative to cal", "//cal.example.com/x"],
  ["relative path", "/rob/30min"],
  ["bare host", "cal.example.com"],
  ["trailing dot host", "https://cal.example.com./x"],
  ["localhost", "https://localhost/"],
  ["loopback IPv4", "https://127.0.0.1/"],
  ["RFC1918", "https://10.0.0.1/"],
  ["RFC1918 172", "https://172.16.0.1/"],
  ["link-local metadata", "https://169.254.169.254/latest/meta-data/"],
  ["IPv6 loopback", "https://[::1]/"],
  ["IPv6 link-local", "https://[fe80::1]/"],
  ["decimal IPv4", "https://2130706433/"],
  ["percent-encoded host separator", "https://cal.example.com%2Eattacker.example/"],
  ["encoded userinfo", "https://cal.example.com%40attacker.example/"],
  ["empty string", ""],
  ["whitespace", "   "],
  ["malformed", "https://"],
  ["not a string", 42],
  ["null", null],
  ["undefined", undefined],
  ["object", { toString: () => CAL }],
];

describe("resolveCalBookingUrl", () => {
  describe("accepts booking links on this instance", () => {
    it.each(ACCEPTED)("accepts %s", (_label, input, expectedOrigin) => {
      const resolved = resolveCalBookingUrl(input, CAL);
      expect(resolved).not.toBeNull();
      expect(resolved?.origin).toBe(expectedOrigin);
    });

    it("preserves the path and query so the liveness check hits the right page", () => {
      const resolved = resolveCalBookingUrl("https://cal.example.com/rob/30min?month=2026-09", CAL);
      expect(resolved?.pathname).toBe("/rob/30min");
      expect(resolved?.search).toBe("?month=2026-09");
    });

    it("drops the fragment, which is never sent to a server", () => {
      const resolved = resolveCalBookingUrl("https://cal.example.com/rob#anchor", CAL);
      expect(resolved?.hash).toBe("");
      expect(resolved?.href).toBe("https://cal.example.com/rob");
    });
  });

  describe("rejects everything else", () => {
    it.each(REJECTED)("rejects %s", (_label, input) => {
      expect(resolveCalBookingUrl(input, CAL)).toBeNull();
    });
  });

  describe("the invariant itself", () => {
    it("never returns a target outside the configured instance's domain", () => {
      const inputs = [...ACCEPTED.map(([, i]) => i), ...REJECTED.map(([, i]) => i)];
      const baseHost = new URL(CAL).hostname;

      for (const input of inputs) {
        const resolved = resolveCalBookingUrl(input, CAL);
        if (resolved === null) continue;
        const host = resolved.hostname;
        expect(host === baseHost || host.endsWith(`.${baseHost}`)).toBe(true);
        expect(resolved.protocol).toBe("https:");
        expect(resolved.username).toBe("");
        expect(resolved.password).toBe("");
      }
    });

    it("a path that looks like a host cannot change the host", () => {
      // `new URL(path, base)` would resolve a `//host` path as protocol-relative and silently
      // rehost the request. The target is built from the validated host explicitly instead, so
      // these stay on this instance rather than becoming a bypass.
      for (const input of [
        "https://cal.example.com//evil.example/x",
        "https://cal.example.com///evil.example/x",
        "https://cal.example.com/..//evil.example",
        "https://cal.example.com/\\evil.example",
      ]) {
        expect(resolveCalBookingUrl(input, CAL)?.host).toBe("cal.example.com");
      }
    });

    it("honours a non-default port in the configured origin", () => {
      const base = "https://cal.example.com:8443";
      expect(resolveCalBookingUrl("https://cal.example.com:8443/x", base)?.origin).toBe(base);
      // The bare host is a different origin once the base declares a port.
      expect(resolveCalBookingUrl("https://cal.example.com/x", base)).toBeNull();
    });

    it("honours an http configured origin without allowing https confusion", () => {
      const base = "http://localhost:3000";
      expect(resolveCalBookingUrl("http://localhost:3000/rob", base)?.origin).toBe(base);
      expect(resolveCalBookingUrl("https://localhost:3000/rob", base)).toBeNull();
    });
  });
});
