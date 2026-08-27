import { CAL_URL } from "@calcom/lib/constants";

/**
 * Resolve an operator-supplied booking link to a request target on this instance, or reject it.
 *
 * The Intercom configuration flow asks an admin for their own cal.forte booking link and then
 * checks that the link actually resolves. The only destination that check ever legitimately needs
 * is **this instance** — so the request target is rebuilt here from `CAL_URL`, which is server
 * configuration, plus the path taken from the caller's input. Caller-supplied text never decides
 * the scheme, host or port of an outbound request.
 *
 * This replaces a regex interpolated from `CAL_URL`. That construction left the host's dots
 * unescaped, so every `.` matched any character and hostnames such as `cal-example-com` — a
 * single-label name that resolves inside a container network — passed a gate meant to allow only
 * `cal.example.com`. Comparing parsed URL components removes the class of bug rather than escaping
 * one instance of it.
 *
 * Returns `null` for anything that is not a booking link on this instance. Callers must treat
 * `null` as fatal: there is no safe default destination.
 */
export function resolveCalBookingUrl(input: unknown, calUrl: string = CAL_URL): URL | null {
  if (typeof input !== "string" || input.length === 0) return null;

  let candidate: URL;
  let base: URL;
  try {
    candidate = new URL(input);
    base = new URL(calUrl);
  } catch {
    // A relative or malformed URL cannot be shown to be on this instance.
    return null;
  }

  // Userinfo is how `https://cal.example.com@attacker.example/` reads as the cal host to a human
  // and as `attacker.example` to a fetch. Reject rather than strip: a booking link never has it.
  if (candidate.username !== "" || candidate.password !== "") return null;

  // `URL` lowercases the hostname and normalises the port (default ports become ""), so these are
  // component comparisons rather than string matching over attacker-influenced text.
  if (candidate.protocol !== base.protocol) return null;
  if (candidate.port !== base.port) return null;

  const host = candidate.hostname;
  const baseHost = base.hostname;
  if (host.length === 0) return null;

  // Exact host, or an explicit single-dot-boundary subdomain. The boundary matters:
  // `evil-cal.example.com` does not end with `.cal.example.com`, while `acme.cal.example.com` does.
  const isSameHost = host === baseHost;
  const isSubdomain = host.endsWith(`.${baseHost}`);
  if (!isSameHost && !isSubdomain) return null;

  // Rebuilt from validated components only. The fragment is dropped because it is never sent to a
  // server, and userinfo cannot survive because it was rejected above.
  try {
    return new URL(`${base.protocol}//${candidate.host}${candidate.pathname}${candidate.search}`);
  } catch {
    return null;
  }
}
