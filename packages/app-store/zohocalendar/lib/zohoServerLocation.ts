/**
 * Canonical Zoho data-centre model for the Zoho Calendar integration.
 *
 * Zoho serves each customer from exactly one data centre, and every accounts, OAuth and calendar
 * host is derived from that data centre's domain. The `location` parameter Zoho returns to the
 * OAuth redirect names that data centre.
 *
 * Region domains are taken from Zoho's multi-DC documentation:
 *   https://www.zoho.com/accounts/protocol/oauth/multi-dc.html
 *   https://www.zoho.com/crm/developer/docs/api/v6/multi-dc.html
 *
 * Two things make a lookup table the right shape here rather than appending a suffix to
 * `zoho.`:
 *
 *  1. Canada is `zohocloud.ca`, not `zoho.ca` — the one region whose domain is not `zoho.<tld>`.
 *     No suffix template can express it. The sibling `zohocrm` and `zoho-bigin` apps allowlist
 *     full hosts for the same reason.
 *  2. A region identifier must never be hostname material. Mapping an identifier to a host that
 *     is fixed at build time means a request URL cannot inherit anything an attacker supplied,
 *     which a filter over a free-form string cannot guarantee.
 */

const ZOHO_REGION_DOMAINS = {
  us: "zoho.com",
  eu: "zoho.eu",
  in: "zoho.in",
  au: "zoho.com.au",
  jp: "zoho.jp",
  cn: "zoho.com.cn",
  ca: "zohocloud.ca",
  sa: "zoho.sa",
  uk: "zoho.uk",
} as const;

/**
 * Values persisted by earlier revisions of this integration, which stored a domain fragment
 * rather than a region.
 *
 * The previous callback mapped `us` to `"com"` and `au` to `"com.au"` and passed every other
 * `location` through untouched, so stored credentials contain a mix of domain fragments and
 * region codes. Both are accepted here so existing connections keep working.
 *
 * `ca` and `cn` were stored as bare region codes and then concatenated, which produced
 * `zoho.ca` and `zoho.cn` — neither is a Zoho host. Resolving them to the documented
 * `zohocloud.ca` and `zoho.com.cn` repairs connections that could not have worked before.
 */
const LEGACY_LOCATION_ALIASES: Record<string, ZohoRegion> = {
  com: "us",
  "com.au": "au",
  "com.cn": "cn",
  "zohocloud.ca": "ca",
};

function getZohoAccountsBaseUrl(region: ZohoRegion): string {
  return `https://accounts.${ZOHO_REGION_DOMAINS[region]}`;
}

export type ZohoRegion = keyof typeof ZOHO_REGION_DOMAINS;

export const ZOHO_REGIONS = Object.keys(ZOHO_REGION_DOMAINS) as ZohoRegion[];

/**
 * Resolve an untrusted `location` / `server_location` value to a known region.
 *
 * Returns `null` for anything unrecognised. Callers must treat `null` as fatal rather than
 * substituting a default — a value that is not a known region tells us nothing about where the
 * account lives, and guessing would send credentials to the wrong data centre.
 */
export function resolveZohoRegion(value: unknown): ZohoRegion | null {
  if (typeof value !== "string") return null;

  // Case is folded because Zoho documents these identifiers in lower case and a differently
  // cased spelling of a known region is still unambiguous. Surrounding whitespace is *not*
  // trimmed: Zoho does not emit padded values, so accepting them would widen the input space
  // for no functional gain.
  const normalized = value.toLowerCase();

  if (Object.hasOwn(ZOHO_REGION_DOMAINS, normalized)) return normalized as ZohoRegion;

  // `Object.hasOwn` rather than a bare index: `aliases["__proto__"]` yields `Object.prototype`,
  // and `aliases["constructor"]` a function — both truthy, both of which would otherwise be
  // returned as if they were regions and defeat the fail-closed contract.
  if (Object.hasOwn(LEGACY_LOCATION_ALIASES, normalized)) return LEGACY_LOCATION_ALIASES[normalized];

  return null;
}

export function getZohoOAuthBaseUrl(region: ZohoRegion): string {
  return `${getZohoAccountsBaseUrl(region)}/oauth/v2`;
}

export function getZohoUserInfoUrl(region: ZohoRegion): string {
  return `${getZohoAccountsBaseUrl(region)}/oauth/user/info`;
}

export function getZohoCalendarApiBaseUrl(region: ZohoRegion): string {
  return `https://calendar.${ZOHO_REGION_DOMAINS[region]}/api/v1`;
}

/**
 * Resolve a persisted `server_location` for use in an outbound request, or throw.
 *
 * This is the fail-closed gate in front of every credential-bearing Zoho request. A credential
 * whose region cannot be resolved must not reach the network: the token refresh carries the
 * app's `client_secret` and the calendar and user-info calls carry the user's access token, so
 * an unresolvable value would decide where those are sent.
 *
 * The thrown message deliberately names neither the stored value nor any credential material.
 */
export function requireZohoRegion(value: unknown): ZohoRegion {
  const region = resolveZohoRegion(value);
  if (!region) {
    throw new Error(
      `Zoho credential has an unrecognised server location. Reconnect the Zoho Calendar app to continue. Supported regions: ${ZOHO_REGIONS.join(", ")}.`
    );
  }
  return region;
}
