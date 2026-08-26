# Runtime Validation Findings — Full Evidence

> ### ⚠️ Verification status — read before citing anything here
>
> This is a **source evidence record**, preserved as written on 2026-08-25/26. A later
> consolidation pass independently re-derived every material claim against `develop` and
> adversarially reviewed the load-bearing ones. **Nine claims did not survive**, and several
> others were materially narrowed.
>
> This file was deliberately **not** rewritten — editing an evidence record destroys its
> provenance. Where it conflicts with
> [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md), **the master wins**. The list
> of refuted claims is that document's §8; the corrected findings are its §5.



Long-form evidence record for the runtime validation pass of 2026-08-25/26. A live
self-hosted `cal.forte` deployment was exercised manually through the UI; every symptom was
then correlated against `develop` at `41689d1d6e` by reading the affected files and tracing
the full client-to-handler path.

**Status: reference material, not the primary record.** These findings were absorbed into
[SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) in condensed form and
renumbered there (the API-keys defect is `P1-B` in that document). This file keeps the full
reasoning, the complete tRPC parity matrix, the exhaustive TOTP error mapping and the
deployment-side 429 diagnostics that the condensed version does not carry.

Findings here are numbered `F-20`..`F-25` purely to avoid collision with the capability
audit's own `F-01`..`F-13`. Those numbers are local to this file. Cross-references to `F-01`
(PBAC placeholders) and `F-04` (unmounted routers) point at the capability audit.

Nothing in this pass was fixed. Session context and open items:
[AUDIT_SESSION_HANDOVER.md](AUDIT_SESSION_HANDOVER.md).

---

---

## 9. Runtime validation findings

The audit above was produced by static source reading only. This section adds the first
**runtime evidence**: a live self-hosted `cal.forte` deployment exercised manually through the
UI on 2026-08-25. Every symptom was then correlated against `develop` at the audited commit by
reading the actual files and tracing the full client→handler path.

Nothing was fixed. Findings continue the `F-NN` numbering and reuse the §37 classification
vocabulary where it applies.

> **Correction to this document's own header.** The `Method` row states *"static source reading
> only — no instance was deployed or exercised"*. That is no longer true of §9 and should be
> qualified rather than deleted, so the provenance of each finding stays visible.

### 9.1 Summary

| Runtime symptom | Root cause | Confidence | Layer | Severity |
|-----------------|------------|------------|-------|----------|
| `POST /api/trpc/apiKeys/create?batch=1` → **404**; client reports `Unexpected token '<', "<!DOCTYPE "…` | `apps/web/pages/api/trpc/apiKeys/[trpc].ts` deleted by `ab21c7f805` while the router, the client `ENDPOINTS` entry and the whole API-keys UI were kept. Next.js returns its HTML 404; the tRPC client parses it as JSON. | **CONFIRMED** | Application — `apps/web` route topology | **High** |
| `POST /api/auth/two-factor/totp/setup` → **400**, repeatedly | Route is correct. Four 400s are reachable; **three render as the generic `something_went_wrong`**, and the settings toggle is never disabled for accounts that structurally cannot enable TOTP. | **CONFIRMED** (UX/diagnosability) · **MEDIUM** (which of the four fired) | Application — UX / error mapping | **High** (release-relevant) |
| Dozens of **429** on `/app-store/*/icon.svg`, `logo.png`, `icon.png`, `/api/logo?type=favicon-16`; secondary invalid-Manifest-icon errors | **Not application code.** No `apps/web/middleware.ts` exists; `/app-store/*` is static; `/api/logo/route.ts` has no rate-limit call; `rateLimiter()` is a no-op unless `UNKEY_ROOT_KEY` is set. | **CONFIRMED** (application excluded) · **UNKNOWN** (which proxy) | **`REVERSE_PROXY_RATE_LIMIT` / `EXTERNAL_WAF_RATE_LIMIT`** — deployment | **Medium** |
| `WebPushContext.tsx: Failed to subscribe: InvalidAccessError: The provided applicationServerKey is not valid.` | Client subscribes with `NEXT_PUBLIC_VAPID_PUBLIC_KEY \|\| ""` and no guard. The variable is build-time inlined, is **not** a `Dockerfile` `ARG`, and `scripts/start.sh` rewrites only `NEXT_PUBLIC_WEBAPP_URL` — yet `docker-compose.yml:103` passes it as a **runtime** env. | **CONFIRMED** | Application + fork-owned deployment template | **Medium** |
| `react-i18next: "You will need to pass in an i18next instance by using initReactI18next"` | `initReactI18next` is never called. `packages/lib/hooks/useLocale.ts` calls `useTranslation()` eagerly before checking `AppRouterI18nContext`; the provider is a plain React context that registers no i18next instance. | **CONFIRMED** | Application — client bundle | **Low** (`DEVELOPMENT_WARNING`) |
| `"markdownToSafeHTML" should not be imported on the client side.` | Deliberate bundle-cost guard at `packages/lib/markdownToSafeHTML.ts:4-9`; upstream-known and tolerated. ~13 client components import it. | **CONFIRMED** | Application — bundle architecture | **Low** (`BUNDLE_ARCHITECTURE`) |

### F-20 · API Keys tRPC route missing — `CONFIRMED_BROKEN`

The inverse of **F-04**. F-04 records routers that exist with no adapter *and no client
caller* (harmless dead weight); this is a router that exists, **is** in the client
`ENDPOINTS` list, **is** called by live UI, and has no adapter.

**Reproduction from source topology.** The tRPC client splits requests across one HTTP link
per endpoint, so three legs must agree:

1. `packages/trpc/react/shared.ts` — the `ENDPOINTS` array
2. `packages/trpc/server/routers/viewer/_router.tsx` — the `viewerRouter` child key
3. `apps/web/pages/api/trpc/<endpoint>/[trpc].ts` — the Next.js adapter

`packages/trpc/react/trpc.ts:33-41` resolves a 3-segment path such as `viewer.apiKeys.create`
by taking `parts[1]` as the endpoint, producing `POST /api/trpc/apiKeys/create?batch=1` —
byte-for-byte the observed request. Legs 1 (`"apiKeys"`) and 2 (`_router.tsx:54`,
`apiKeys: apiKeysRouter`) are present. Leg 3 is absent, so Next.js returns its HTML 404 page
and `await response.json()` throws the reported parse error.

**Deliberate strip or accidental omission? Accidental.**

| Commit | Date | Effect on `apps/web/pages/api/trpc/apiKeys/[trpc].ts` |
| --- | --- | --- |
| `cdba1920fc` (#8041, *split up routers to separate lambdas*) | 2023 | added |
| `ab21c7f805` (**#28903**, *refactor: Cal.diy*) | 2026-04-15 | **deleted** |
| `07a288bbd8` (**#29517**, *fix(api): missing trpc route added for the api keys*) | 2026-06-08 | **re-added upstream** (4 lines) |

Verified ABSENT at `46eb533dbd` (fork base), `ab21c7f805`, `176037d0af` and `develop`. A
deliberate removal would have taken the router, the `ENDPOINTS` entry and the UI with it;
`ab21c7f805` removed only the adapter and left `apps/web/modules/api-keys/**` and
`/settings/developer/api-keys` fully wired.

This is a **third damage pattern** from the community-edition strip commit, alongside the two
already recorded in the fork's intake analysis (content reverts, and deletion of regression
tests along with the fixes they guarded): *removal of one leg of a multi-leg contract while the
other legs stay wired.*

**Ledger conflict — the important part.** `07a288bbd8` already has a row in
[UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md):

> | `07a288bbd8` | Missing API-key tRPC route | `deferred` | Feature/API expansion not required by current fork scope. |

That rationale is refuted by this evidence. The commit is not feature or API expansion — it is
a four-line restoration of a route the fork's own shipped UI calls on every create/edit/delete.
The decision was made in good faith on a mischaracterisation.

**Blast radius.** `list` is unaffected: `apps/web/app/.../developer/api-keys/page.tsx` reads
keys server-side via `PrismaApiKeyRepository` inside `unstable_cache`, so the page renders
existing keys and looks healthy. Every mutation fails:

- `apps/web/modules/api-keys/api-keys/components/ApiKeyDialogForm.tsx:145` — `utils.client.viewer.apiKeys.create.mutate(event)` ← the observed failure
- `ApiKeyDialogForm.tsx:31` — `trpc.viewer.apiKeys.edit.useMutation`
- `ApiKeyListItem.tsx:40` — `trpc.viewer.apiKeys.delete.useMutation`

A page that lists correctly but silently fails every write is why this surfaced only through
manual UI exercise.

- **Official upstream comparison** — upstream `calcom/cal.diy@main` has the file; fixed 2026-06-08.
- **Minimum safe correction** — `git cherry-pick -x 07a288bbd8`. One upstream commit, one local commit, four added lines, no behaviour change beyond restoring the route. Update the ledger row to `integrated-full` **and record why the original rationale was wrong**, per the ledger's own convention that decision reversals stay visible (the `0d164da8dd` precedent).
- **Regression test** — a static assertion that every `ENDPOINTS` entry which is also a `viewerRouter` child has a matching `apps/web/pages/api/trpc/<endpoint>/[trpc].ts`. No runtime needed; would have caught this at CI time.
- **Security impact** — none directly. Indirect: API keys are the credential mechanism for API v1/v2, so operators cannot rotate or revoke keys through the UI. An operational-security limitation, not a vulnerability.
- **Divergence impact** — negative, i.e. beneficial: this converges with upstream.

### F-21 · tRPC router / adapter parity inventory — `BACKEND_ONLY` / dead surface

Generated mechanically from the three legs. Only mismatching rows are listed; 27 endpoints
agree across all three legs and are omitted.

| Endpoint | client `ENDPOINTS` | `viewerRouter` key | Next adapter | Verdict |
|---|---|---|---|---|
| **`apiKeys`** | **Y** | **Y** | **–** | **BROKEN — F-20** |
| `appBasecamp3` | Y | – | – | Orphan client entry |
| `credits` | Y | – | – | Orphan client entry |
| `delegationCredential` | Y | – | – | Orphan client entry |
| `featureOptIn` | Y | – | – | Orphan client entry |
| `filterSegments` | Y | – | – | Orphan client entry (**F-04**) |
| `payments` | Y | – | – | Orphan client entry (**F-04**) |
| `phoneNumber` | Y | – | – | Orphan client entry |
| `appsRouter` | – | – | Y | **Stale adapter** — duplicate mount of `appsRouter`, no client endpoint targets it |
| `viewer` | Y | – | Y | **Intentional alias** — `resolveEndpoint` maps 2-segment paths (`viewer.me`) to `parts[0]`; the adapter serves `loggedInViewerRouter`. Not a defect; recorded so a later audit does not "fix" it |

Totals: 35 client endpoints · 27 router keys · 28 adapters.

- **`apiKeys` is the only true break** — the unique signature "client entry + router + no adapter" with live callers.
- **Seven orphan client entries**, verified **zero frontend callers** each (`grep` for `viewer.<name>.` and `trpc.<name>.` across `apps` and `packages`, excluding tests). They are dead `ENDPOINTS` rows left by the strip; each still constructs an `httpLink` and an `httpBatchLink` at client bootstrap pointing at a non-existent path. This **extends F-04**, which found the backend half of two of them. Classification: dead surface, not a functional bug.
- **`appsRouter` stale adapter** — `apps/web/pages/api/trpc/appsRouter/[trpc].ts` mounts the same router as `apps/web/pages/api/trpc/apps/[trpc].ts`. A reachable, unreferenced duplicate route on an authenticated router. Low risk, but it is extra public surface.
- **Recommended durable control** — a CI parity check across the three legs: ~20 lines, no runtime, and it converts this entire class of silent breakage into a build failure.

### F-22 · TOTP setup returns an undiagnosable 400 — application UX defect

Routes: `apps/web/app/api/auth/two-factor/totp/{setup,enable,disable}/route.ts`.
Client: `apps/web/components/settings/TwoFactorAuthAPI.ts`, `EnableTwoFactorModal.tsx`.
View: `apps/web/modules/settings/security/two-factor-auth-view.tsx`.

**Every 400 from `setup`, mapped to the UI:**

| # | Condition | `ErrorCode` | Message shown by `EnableTwoFactorModal` |
|---|---|---|---|
| 1 | `user.identityProvider !== CAL && !user.password?.hash` | `ThirdPartyIdentityProviderEnabled` | **`something_went_wrong`** |
| 2 | `!user.password?.hash` | `UserMissingPassword` | **`something_went_wrong`** |
| 3 | `user.twoFactorEnabled` | `TwoFactorAlreadyEnabled` | **`something_went_wrong`** |
| 4 | `verifyPassword(body.password, hash)` false | `IncorrectPassword` | `incorrect_password` ✅ |

Non-400 outcomes: `401` (no session / user gone), `500` (missing `session.user.id`, missing
`CALENDSO_ENCRYPTION_KEY`), `429` (`checkRateLimitAndThrowError`, `core` namespace, 10/60s —
**inert unless `UNKEY_ROOT_KEY` is set**, see F-23).

`EnableTwoFactorModal.tsx:106-110` special-cases only `IncorrectPassword`. Cases 1–3 collapse
to `t("something_went_wrong")`. `enable` behaves the same way: it maps only
`IncorrectTwoFactorCode`, leaving `TwoFactorAlreadyEnabled` and `TwoFactorSetupRequired`
opaque.

**Cryptographic handling is sound** and is not the defect: `authenticator.generateSecret(20)`
→ 32 base32 chars, stored via `symmetricEncrypt` with `CALENDSO_ENCRYPTION_KEY`, length
asserted at `enable` and at login; 10 backup codes from `crypto.randomBytes(5)`, stored
encrypted; `disable` requires a password for `CAL` identities and accepts a TOTP or backup
code, then nulls all three columns.

**Can a normal locally-created `CAL` admin enable TOTP today? Yes — the source flow is
intact.** For `identityProvider === CAL`, a present `password.hash` and
`twoFactorEnabled === false`, cases 1–3 cannot fire. No source defect blocks the happy path.
The observed repeated 400 is therefore one of: (a) `IncorrectPassword` — which the UI *does*
report; (b) the account is not a plain CAL/password account, hitting case 1 or 2 and rendering
opaquely; or (c) `TwoFactorAlreadyEnabled` from a prior partial setup.

**These are distinguishable with one read-only query** — the recommended next diagnostic:

```sql
SELECT u.id, u.email, u."identityProvider", u."twoFactorEnabled",
       (u."twoFactorSecret" IS NOT NULL) AS has_secret,
       (p.hash IS NOT NULL)              AS has_password
FROM   users u LEFT JOIN "UserPassword" p ON p."userId" = u.id
WHERE  u.role = 'ADMIN';
```

**Compounding UX defect.** `two-factor-auth-view.tsx:44` computes
`canSetupTwoFactor = !isCalProvider && !user?.twoFactorEnabled && !user?.passwordAdded` but
uses it **only** to render an informational alert — the toggle is never disabled. An account
that structurally cannot enable TOTP is still shown an active switch opening a modal
guaranteed to 400 opaquely. Because `next-auth-options.ts:255-285` downgrades an `ADMIN` to
`INACTIVE_ADMIN` unless the password meets the admin-strength policy **and**
`twoFactorEnabled` is true, such an admin has no stated route back to admin capability.

- **Official upstream comparison** — all three routes are byte-equivalent to `calcom/cal.diy@main`. Inherited upstream behaviour, not a fork regression.
- **Minimum safe correction** — extend the modal's error mapping to `ThirdPartyIdentityProviderEnabled`, `UserMissingPassword`, `TwoFactorAlreadyEnabled` and `TwoFactorSetupRequired` with distinct actionable strings, and disable the toggle when setup is structurally impossible. **Server-side checks must not change** — every 400 is a correct refusal; only its presentation is defective.
- **Regression test** — local `CAL` admin → correct password → `setup` 200 with `secret`/`dataUri`/10 backup codes; wrong password → 400 `IncorrectPassword` **surfaced as such**; `enable` with a derived TOTP → 200; assert `twoFactorEnabled = true`; login with password only → second factor demanded and role is not `ADMIN`; login with password + TOTP → role `ADMIN`; login with a backup code → succeeds and **the same code is rejected on reuse**; negative case: `identityProvider !== CAL` with no password → 400 `ThirdPartyIdentityProviderEnabled` **with the reason stated in the UI**. Login and backup-code steps need Playwright (`PLAYWRIGHT_HEADLESS=1 yarn e2e`, run locally per `agents/rules/testing-playwright.md`); the rest are unit/integration-testable.
- **Security impact** — the routes are sound (session-gated, password-confirmed, rate-limit-hooked, encrypted secrets, length-validated). The impact is **availability of a security control**: an `INACTIVE_ADMIN` who cannot complete setup stays degraded indefinitely. Release-relevant under [SECURITY_REVIEW.md](../SECURITY_REVIEW.md) → *auth and signup behavior*.
- **Divergence impact** — UI-only, in `EnableTwoFactorModal.tsx` plus `packages/i18n/locales/en/common.json`. Small, but it is fork divergence in a file upstream also edits; prefer proposing it upstream.
- **Related dead surface** — `EnableTwoFactorModal.tsx` and `DisableTwoFactorModal.tsx` each exist twice: under `apps/web/components/settings/` (imported by the view) and under `apps/web/components/security/` (no importer found). Belongs with F-21's dead-surface inventory.

### F-23 · Mass 429 on static resources — deployment layer, not application

Four independent facts, each verified in `develop`:

1. **No Next.js middleware exists.** `apps/web/middleware.ts` is absent, so no application code sits in the request path for static files.
2. **`/app-store/*` is static content** under `apps/web/public/app-store/`. No route handler matches it.
3. **`/api/logo` does not rate-limit.** `apps/web/app/api/logo/route.ts` contains no `checkRateLimitAndThrowError`; its only header work is `Cache-Control: s-maxage=86400, stale-while-revalidate=60` (line 235).
4. **The limiter is inert without Unkey.** `packages/lib/rateLimit.ts:36-46` — with `UNKEY_ROOT_KEY` unset, `rateLimiter()` returns a fixed `{ success: true, limit: 10, remaining: 999, reset: 0 }` and warns once. Even when configured, `checkRateLimitAndThrowError` is called from ~20 sites, **all** in auth, booking, signup, cancel, eventTypes and 2FA handlers — never for static assets or `/api/logo`.

**Conclusion: `REVERSE_PROXY_RATE_LIMIT` or `EXTERNAL_WAF_RATE_LIMIT`.** Repository code cannot
plausibly generate these 429s. Per [.ai/decisions.md](../.ai/decisions.md) this belongs to
`secure-docker-blueprint`, not here. The prime suspect is the Traefik rate-limit middleware
referenced in [.ai/roadmap.md](../.ai/roadmap.md).

**One genuine application-side contributing factor.** `/api/logo` sets `s-maxage`, a
*shared-cache* directive that browsers ignore because no `max-age` is present. Every page load
therefore re-requests `/api/logo?type=favicon-16`, `favicon-32` and friends from the origin.
That does not cause the 429, but it materially raises how often a proxy limit is reached, and
it explains the secondary invalid-Manifest-icon errors: the manifest references icon URLs
being throttled.

**Required diagnostics** (deployment side, no code change) — on a throttled response:

```bash
curl -sSD - -o /dev/null 'https://<host>/app-store/zoom/icon.svg'
```

Inspect for `Retry-After` (present on most proxy/WAF limiters, **absent** from cal.forte's own
`HttpError` 429); `X-RateLimit-Limit` / `-Remaining` / `-Reset`; `Server`, `Via`, `CF-Ray`,
`X-Cache` or a Traefik `X-*` marker; and whether the body is exactly
`{"message":"Rate limit exceeded. Try again in N seconds."}` — cal.forte's own string. Then
confirm `UNKEY_ROOT_KEY` is unset in the running container. If it is unset and the body is not
that string, the application is excluded conclusively.

**Desired architecture** — static paths (`/app-store/*`, `/_next/static/*`, favicons, manifest
icons) must be exempt from API-style limiting; apply the middleware to `/api/**` only. A single
page load legitimately issues dozens of icon requests, so a limiter tuned for API traffic will
always misfire on it.

**Optional, separate** cal.forte-side improvement: give `/api/logo` a browser-cacheable
`Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=60`. One line,
reduces origin load by roughly the number of page loads, should be raised upstream rather than
carried as divergence — and it is **not** a fix for the 429.

### F-24 · Web Push / VAPID — phantom configuration knob

- `apps/web/modules/notifications/components/WebPushContext.tsx:66` subscribes with `applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "")`. With the variable unset the `|| ""` fallback yields an empty key and the browser rejects it with the exact observed `InvalidAccessError`. **There is no guard for a missing key anywhere in the provider.**
- **The server is correct and asymmetric to the client.** `packages/features/notifications/sendNotification.ts:16-22` logs *"Missing VAPID keys. Web push notifications are disabled."* and refuses to send — so the server disables the feature while the client still offers and attempts it.
- **The error is caught and mislabelled.** `WebPushContext.tsx:73-79` detects `InvalidAccessError` + `applicationServerKey` specifically and shows *"Please enable Google services for push messaging and try again"*, blaming the user's browser for a missing server-side configuration value.
- **Reachability** — `WebPushProvider` wraps the whole app (`apps/web/app/providers.tsx:32`, `apps/web/pages/_app.tsx:19`); `subscribe()` is invoked from `apps/web/modules/settings/my-account/push-notifications-view.tsx:10`.

**It cannot be configured in a prebuilt image.** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is inlined at
build time; it is **not** among the root `Dockerfile` `ARG`s; and `scripts/start.sh` rewrites
only `BUILT_NEXT_PUBLIC_WEBAPP_URL` → `NEXT_PUBLIC_WEBAPP_URL`. Yet **`docker-compose.yml:103`
passes it as a runtime `environment:` entry**, where it can have no effect on the client
bundle.

The published `cal.forte` image therefore can never have working web push at any
configuration, and the fork's own compose file advertises a knob that cannot function. This is
the same class as two phantom flags already on record: the removed Jitsu telemetry opt-out
(`75a9df1812`) and the dead `OUTLOOK_LOGIN_ENABLED`. It also directly extends §7's existing
correction that `NEXT_PUBLIC_WEBSITE_*_URL` are build-time only — **the same defect, a
different variable, and this one is in a fork-owned file.**

- **Official upstream comparison** — `WebPushContext.tsx` and `sendNotification.ts` match upstream. The compose mismatch is fork-owned.
- **Minimum safe correction**, three independent parts, smallest first: (1) return early from `subscribe()` when the key is absent and hide or disable the push toggle — feature absent rather than broken; (2) either remove `NEXT_PUBLIC_VAPID_PUBLIC_KEY` from `docker-compose.yml`'s runtime block **or** add it as a `Dockerfile` `ARG` plus build arg so it takes effect — `VAPID_PRIVATE_KEY` is server-only and correctly placed; (3) replace the misattributing error message.
- **Regression test** — with the key unset, assert no `pushManager.subscribe` call and no `InvalidAccessError`; with a valid key, assert `subscribe` receives a non-empty `Uint8Array`.
- **Security impact** — none. Web push is optional, no secret is exposed, and `VAPID_PRIVATE_KEY` is correctly server-only. **No keys were generated or committed.**
- **Divergence impact** — part 2 is a one-line change to a file the fork already owns and already lists in [FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md). Parts 1 and 3 are upstream-shaped and should be proposed upstream.

### F-25 · Client console warnings — `DEVELOPMENT_WARNING` / `BUNDLE_ARCHITECTURE`

**`react-i18next: "You will need to pass in an i18next instance by using initReactI18next"` —
`DEVELOPMENT_WARNING`.** `initReactI18next` is never called anywhere in the repository.
`packages/lib/hooks/useLocale.ts:4` imports `useTranslation` from `react-i18next`, and
`useClientLocale` calls `useTranslation(namespace)` **unconditionally**, before any context
check. Translations actually arrive through `apps/web/app/AppRouterI18nProvider.tsx`, a plain
React context carrying `{ translations, locale, ns }` that registers no i18next instance;
`useLocale` prefers that context, so the eagerly-computed `clientI18n` value is discarded on
App Router pages. Second importer: `packages/platform/atoms/lib/useLocale.ts:2`.
**Impact:** none on App Router pages — a console warning per client render plus an unnecessary
code path. `isLocaleReady` derives from `Object.keys(i18n).length > 0`, a fragile heuristic
worth noting but not acting on. **Do not refactor:** upstream-shaped, touches every translated
component, no user-visible gain.

**`"markdownToSafeHTML" should not be imported on the client side."` — `BUNDLE_ARCHITECTURE`,
explicitly *not* a security concern.** Emitted deliberately by
`packages/lib/markdownToSafeHTML.ts:4-9` under `typeof window !== "undefined"`. Its own comment
states the intent: *"This file imports markdown parser which is a costly dependency… It is
still imported at some places on client in non-booker pages, we can gradually remove it from
there and then convert it into an error."* ~13 client components import it, including
`EventMeta.tsx`, `EventTypeDescription.tsx`, `FormBuilderField.tsx` and `AppCard.tsx`.
**Sanitisation is not weakened** — `md.render()` then `sanitizeHtml()` run regardless of
environment, so browser execution produces the same sanitised output; the cost is bundle
weight. One point stated precisely so it is not mis-escalated later: this warning says nothing
about whether any given call site renders **unsanitised** markdown. That would be a separate
audit of `dangerouslySetInnerHTML` sites, which this pass did not perform and which the runtime
evidence does not implicate.

### 9.2 What §9 changes elsewhere in this audit

- **F-01 is corroborated, not altered.** The runtime pass reached the same conclusion about the
  18 permissive `PermissionCheckService` stubs independently. §6 *Unresolved Questions →
  Security → 1* ("does any deployed instance have `Team` rows?") **remains open** — the runtime
  evidence gathered here does not answer it, and F-22's SQL snippet is the closest available
  probe, covering admin identity rather than team rows.
- **F-04 is extended by F-21.** F-04 found two unmounted routers; the parity sweep finds seven
  orphan client `ENDPOINTS` entries plus a stale duplicate adapter — and, more importantly, the
  inverse case (F-20) that F-04's "neither is an authorization risk (unreachable)" framing does
  not cover.
- **§7 gains a row.** The build-time/runtime confusion it already records for
  `NEXT_PUBLIC_WEBSITE_*_URL` recurs in `docker-compose.yml` for
  `NEXT_PUBLIC_VAPID_PUBLIC_KEY` (F-24) — this time in a fork-owned file rather than upstream's.
- **A recurring failure class is now confirmed four times over.** Configuration and wiring that
  survive a strip after the thing they controlled is gone: the removed telemetry opt-out, the
  dead `OUTLOOK_LOGIN_ENABLED`, the seven orphan client endpoints, and the VAPID compose entry.
  That is the strongest available argument for making endpoint-parity and env-template checks
  **blocking** rather than advisory.

### 9.3 Proposed candidates from §9 (proposals only — nothing implemented)

| ID | Item | Type | Prio | Disposition |
|---|---|---|---|---|
| **P1-D** | Restore the `apiKeys` tRPC route via `git cherry-pick -x 07a288bbd8`, and correct its `UPSTREAM_REVIEW_LEDGER.md` row | Bug | **P1** | `UPSTREAM_INTAKE` |
| **P2-F** | CI parity check across `ENDPOINTS` / `viewerRouter` / Next adapters; prune the seven orphan client entries and the stale `appsRouter` adapter | Maintenance | P2 | `PROPOSED` |
| **P2-G** | Map all four TOTP-setup 400s to actionable UI messages; disable the toggle where setup is structurally impossible | Bug (security capability) | P2 | `PROPOSED` |
| **P3-C** | VAPID: guard the client subscribe; stop advertising a build-time variable as a runtime one in `docker-compose.yml` | Bug + deployment | P3 | `PROPOSED` |
| — | Mass 429 on static assets | Deployment | — | `NOT_APPLICABLE` — belongs to `secure-docker-blueprint` |
| — | `react-i18next` warning | Development warning | — | `DOCUMENT_ONLY` |
| — | `markdownToSafeHTML` client warning | Bundle architecture | — | `DOCUMENT_ONLY` |
