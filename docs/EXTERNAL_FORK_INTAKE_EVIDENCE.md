# cal.forte — External Fork Intake Analysis

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



**Pass type:** analysis-only. No tracked file was modified, no commit, branch, tag, PR,
issue, label, or any other GitHub write was created.
**Date:** 2026-08-25
**Analyst context:** `rubennati/cal.diy` @ `develop` (clean), local HEAD `41689d1d6e`.
**Record location:** `docs/EXTERNAL_FORK_INTAKE_EVIDENCE.md`. Written during the pass at
`/tmp/cal-forte-external-fork-intake.md` (deliberately outside the repository, since the pass
was analysis-only) and moved here afterwards on the maintainer's instruction.

**Status:** long-form evidence record. The curated register is
[EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md); this file keeps the full per-candidate
reasoning behind it. Session context and open items:
[AUDIT_SESSION_HANDOVER.md](AUDIT_SESSION_HANDOVER.md).

---

## 0. Method And Ground Truth

### 0.1 Authoritative fork documents read first

`FORK_STATUS.md`, `FORK_DIVERGENCE.md`, `UPSTREAM_REVIEW_LEDGER.md`, `UPSTREAM_SYNC.md`,
`SECURITY_REVIEW.md`, `RELEASE_PROCESS.md`, `CALDIY_RELEASE_CONTRACT.md`, `FORK_PROCESS.md`,
`FORK_STRATEGY.md`, `IMAGE_BUILD.md`, `AGENTS.md`/`CLAUDE.md`, `.ai/index.md`, `.ai/state.md`,
`.ai/decisions.md`, `.ai/divergence.md`, `.ai/roadmap.md`, `.ai/quality-gates.md`,
`.ai/branding.md`, `.ai/sync-log.md`.

Operating model taken as binding: `main` = upstream mirror, `develop` = reviewed integration,
`release` = reviewed publication source; selective intake with one `git cherry-pick -x` per
upstream commit; security-relevant upstream commits taken by default but only after the
vulnerability is independently established; external forks are **discovery sources only**.

### 0.2 Ancestry of the three external repositories

All three are direct forks of `calcom/cal.diy` (the upstream repo now resolves under that
name). None is a fork of `rubennati/cal.diy`. None shares fork-owned cal.forte history.

| Repo | Fork of | Merge-base with `calcom/cal.diy@main` | Merge-base date | Ahead | Behind | Default branch state |
| --- | --- | --- | --- | --- | --- | --- |
| `COG-GTM/cal.com` | `calcom/cal.diy` | `77b2be13b2` | 2026-03-31 | **0** | 124 | `main` is a pure, stale upstream snapshot. All work lives in 31 unmerged PR branches. |
| `Mitch515/cal.diy` | `calcom/cal.diy` | `180ede28f0` | 2026-05-14 | 23 | 47 | Diverged; 23 own commits on `main`. Hundreds of extra branches are inherited upstream branches, not their work. |
| `Biji-Biji-Initiative/cal.com` | `calcom/cal.diy` | `facc0745d3` | 2026-04-06 | 67 | 115 | Diverged; deployment/CI-heavy fork ("Mereka Calendar"). Most open PRs are Dependabot. |

cal.forte reference points for comparison:

- cal.forte upstream merge-base: `46eb533dbd` (2026-05-03, Cal.com 6.2.0 line).
- cal.forte reviewed upstream through: `176037d0af` (2026-08-08).
- **COG-GTM and Biji-Biji are based on code older than cal.forte's own base.** Their patches
  therefore describe an older tree and must be re-verified against current cal.forte code
  (done below, file by file).
- Mitch515's base `180ede28f0` is 11 days *newer* than cal.forte's base and is already
  recorded in `UPSTREAM_REVIEW_LEDGER.md` as `deferred` (system font fallback).

### 0.3 Independent-verification stance actually applied

For every code claim below I read the current cal.forte file, read the current
`calcom/cal.diy@main` file, and — where behaviour was in question — executed the *verbatim
current cal.forte implementations* in an isolated Node script in the scratchpad. That script
never touched the repository. Its output is quoted inline as evidence and is the basis for
every `E2` rating. Three external claims did **not** survive that step and are marked
`rejected` with the disproof shown.

### 0.4 Evidence quality of the sources themselves

- **COG-GTM PRs #1 and #31 have zero CI checks and zero reviews.** They are unvalidated
  agent output (all branches are `devin/<id>-*`). PR #31's `text.test.ts` additions **fail
  against the code the same PR ships**, because the PR adds a characterisation test for the
  `truncateOnWord` bug without fixing `packages/lib/text.ts`. Treat COG-GTM as a *lead
  generator*, never as a patch source.
- **Mitch515's commits are the highest-quality external material in this set**: precise
  commit messages, real repro narratives, focused diffs, accompanying tests. They are also
  the most heavily contaminated with customer-specific ("LIA" / "Wealth Navigator") content,
  including a **hardcoded Entra tenant GUID**. Generic and customer-specific changes are
  separated explicitly below.
- **Biji-Biji is a deployment fork.** Its most notable application-code commit is
  `80aa00e362`, which removes **auth backdoors they themselves introduced** (a hardcoded API
  key `mereka_48cf7756…` bypassing `ApiAuthStrategy` and `CustomThrottlerGuard`). That is a
  fork-introduced vulnerability, not an upstream one, and it is the clearest possible
  argument for cal.forte's "never trust another fork" rule.

---

## 1. Candidates

Ordered by source. Ranked table in §7.

---

### C-01 — CSV formula injection: `sanitizeValue` does not neutralise spreadsheet formulas

- **Source:** `COG-GTM/cal.com`
- **Exact source commit/PR:** PR [#31](https://github.com/COG-GTM/cal.com/pull/31), commit `66c378fd2f` (`packages/lib/csvUtils.ts`, `packages/lib/csvUtils.test.ts`)
- **Source provenance:** Devin-generated, unreviewed, no CI. Not derived from any upstream commit or advisory. The underlying issue class is OWASP CSV Injection / CWE-1236.
- **Type:** security-candidate
- **Priority:** P2
- **Evidence:** E2 (reproduced) + E3 for the vulnerability class (OWASP), **not** E3 for cal.forte exploitability
- **Current cal.forte state:** `packages/lib/csvUtils.ts` `sanitizeValue()` handles only CSV *delimiter* escaping (quotes, commas, newlines). Reproduced against the verbatim current implementation:
  ```
  "=HYPERLINK(\"http://evil\",\"x\")" -> "\"=HYPERLINK(\"\"http://evil\"\",\"\"x\"\")\""
  "+1"        -> "+1"
  "-1"        -> "-1"
  "@SUM(A1)"  -> "@SUM(A1)"
  "\t=1+1"    -> "\t=1+1"
  "\r=1+1"    -> "\r=1+1"
  ```
  Consumers: `apps/web/modules/bookings/components/BookingsCsvDownload.tsx` (exports `attendee_name`, `email`, `title`, `location` — all booker-controlled) and `apps/web/modules/users/lib/UserListTableUtils.ts` / `UserListTable.tsx`.
- **Official upstream state:** `calcom/cal.diy@main` `packages/lib/csvUtils.ts` is byte-identical to cal.forte's. **Unfixed upstream.** No advisory found.
- **Claimed problem:** Values beginning `=`, `+`, `-`, `@` are evaluated as formulas by Excel/Sheets; quoting is a CSV delimiter mechanism, not a spreadsheet escape.
- **Independently verified problem:** Confirmed that the characters pass through unescaped. **Reachability in cal.forte is narrower than the raw finding suggests**: `BookingsCsvDownload` renders only when `Boolean(user?.organizationId)`, and `UserListTable` is the organisation members table. `ORGANIZATIONS_ENABLED` is a Dockerfile build ARG that is **not passed** in `.github/actions/docker-build-and-test/action.yml`, so the published `cal.forte` image ships with organisations off and neither export is reachable. The defect is real in the library; the *exposed* surface in the shipped image is currently nil.
- **Potential user value:** Protects an operator's workstation when an org-enabled deployment exports bookings whose attendee fields were supplied by an anonymous public booker.
- **Security relevance:** Genuine. Stored-payload → client-side code execution in the reviewer's spreadsheet application. Injection point is unauthenticated (public booking form); trigger requires an authenticated org admin to export and open the file.
- **Risk if ignored:** Low today (feature unreachable in the shipped image), becomes P2-real the moment an operator enables organisations.
- **Risk if integrated:** Data fidelity. A `'` prefix is visible in some spreadsheet import paths, and `-` prefixing mangles legitimate negative numbers. **The external patch is also incomplete** — its regex `/^[=+\-@]/` omits the leading TAB and CR forms that OWASP lists, both of which I confirmed pass through today.
- **Maintenance impact:** Low; one exported function plus tests. Creates a permanent divergence from upstream in `packages/lib` until upstream converges.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate** (write a fork-owned fix; do not cherry-pick COG-GTM's, which is unvalidated and incomplete)
- **Required validation before acceptance:** Cover `\t`, `\r`, and leading whitespace variants; decide and document the numeric-field trade-off; assert `objectsToCsv` round-trip for headers and rows; confirm no consumer relies on unprefixed values; `TZ=UTC yarn vitest run packages/lib/csvUtils.test.ts`; `yarn type-check:ci --force`.
- **Suggested atomic issue title:** `fix(lib): neutralise spreadsheet formula prefixes in CSV export sanitisation`

---

### C-02 — `truncateOnWord` ignores `maxLength` and can discard the entire string

- **Source:** `COG-GTM/cal.com` (lead only — **no fix exists upstream or in the external fork**)
- **Exact source commit/PR:** PR [#31](https://github.com/COG-GTM/cal.com/pull/31), commit `66c378fd2f` (`packages/lib/text.test.ts` only)
- **Source provenance:** Devin-generated tests. `packages/lib/text.ts` is **not** modified by the PR, so the added assertions fail against the very tree they are committed to.
- **Type:** bug
- **Priority:** P2
- **Evidence:** E2 (reproduced)
- **Current cal.forte state:** `packages/lib/text.ts:7` — `truncateOnWord(text, maxLength)` hardcodes `text.substring(0, 148)` and never reads `maxLength`. Reproduced:
  ```
  maxLength=158 -> len 150
  maxLength=100 -> len 150      (expected <= 103)
  maxLength=200 -> len 150      (expected up to 200)
  no-space text, maxLength=100 -> "..."   <-- entire text lost
  ```
  Sole consumer: `apps/web/app/_utils.tsx:43` and `:101`, both `truncateOnWord(description, 158)` — the public page/meta description generator.
- **Official upstream state:** `calcom/cal.diy@main` `packages/lib/text.ts` is byte-identical. **Unfixed upstream.**
- **Claimed problem:** "should respect the maxLength parameter instead of a hardcoded constant".
- **Independently verified problem:** Confirmed, and **the more serious half of the defect is not in the external claim at all**: when the first 148 characters contain no space, `lastIndexOf(" ")` returns `-1`, `substring(0, -1)` yields `""`, and the function returns the bare string `"..."`. Any event description in a script without spaces (Chinese, Japanese, Thai), or any long unbroken token, produces a public booking page whose meta description is literally `...`. This is user-visible content loss on the fork's primary public surface.
- **Potential user value:** Correct SEO/social meta descriptions on self-hosted public booking pages, including non-Latin scripts.
- **Security relevance:** None.
- **Risk if ignored:** Silent, permanent degradation of public page metadata for a whole class of locales.
- **Risk if integrated:** Meta descriptions change length (150 → up to 158 chars) — cosmetic, and the fix must preserve the "cut on word boundary when one exists" intent rather than hard-slicing.
- **Maintenance impact:** Very low; a self-contained pure function with an existing test file.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate** (fork-owned fix; the external PR supplies only a failing test and must not be cherry-picked)
- **Required validation before acceptance:** Fix `text.ts`; make the external assertions pass; add a no-space/CJK case asserting the text is preserved rather than reduced to `"..."`; `TZ=UTC yarn vitest run packages/lib/text.test.ts`.
- **Suggested atomic issue title:** `fix(lib): honour maxLength in truncateOnWord and stop dropping text with no word break`

---

### C-03 — `extractBaseEmail` fabricates addresses from malformed input

- **Source:** `COG-GTM/cal.com`
- **Exact source commit/PR:** PR [#31](https://github.com/COG-GTM/cal.com/pull/31), commit `66c378fd2f` (`packages/lib/extract-base-email.ts`)
- **Source provenance:** Devin-generated, unreviewed, no CI.
- **Type:** bug (security-adjacent)
- **Priority:** P2
- **Evidence:** E2 (reproduced)
- **Current cal.forte state:** `packages/lib/extract-base-email.ts` destructures `email.split("@")`. Reproduced:
  ```
  "notanemail" -> "notanemail@undefined"
  ""           -> "@undefined"
  "a@b@c.com"  -> "a@b"            <-- real domain silently dropped
  "user@"      -> "user@"
  ```
  Consumers include `packages/features/bookings/lib/handleNewBooking/checkIfBookerEmailIsBlocked.ts:18` (blocked-email / `BLACKLISTED_GUEST_EMAILS` enforcement and the `requiresBookerEmailVerification` lookup), `packages/trpc/server/routers/publicViewer/checkIfUserEmailVerificationRequired.handler.ts:21`, `packages/trpc/server/routers/viewer/bookings/addGuests.handler.ts` (7 call sites), `packages/features/bookings/lib/service/RegularBookingService.ts`, `packages/features/bookings/services/BookingAttendeesRemoveService.ts`.
- **Official upstream state:** `calcom/cal.diy@main` is byte-identical. **Unfixed upstream.**
- **Claimed problem:** "should return input unchanged if no @ sign".
- **Independently verified problem:** Confirmed. I could **not** construct a block-bypass: the booking `email` field is zod-validated before reaching `checkIfBookerEmailIsBlocked`, and the multi-`@` truncation makes matching *more* aggressive, not less. The demonstrable harm is identity confusion in the guest-matching paths: `"a@b@c.com"` and `"a@b"` collapse to the same key, so `BookingAttendeesRemoveService` and `addGuests` can match or remove the wrong guest, and the `prisma.user.findFirst({ email: baseEmail })` lookup in the blocked-email path can resolve a *different real user's* verification setting. **This is a correctness defect with an authorization-adjacent blast radius, not a demonstrated vulnerability.** It must not be labelled a security fix without a reproduction.
- **Potential user value:** Guest add/remove operates on the address the user actually typed.
- **Security relevance:** Indirect. It sits inside the blocked-email and email-verification decision paths, which is why it is worth fixing even without a proven bypass.
- **Risk if ignored:** Latent wrong-identity matching in booking guest management; a future caller that skips zod validation would inherit a real bypass surface.
- **Risk if integrated:** Behaviour change for multi-`@` input (`"a@b@c.com"` returns itself instead of `"a@b"`). Any stored data keyed on the old truncation would stop matching. Low but non-zero.
- **Maintenance impact:** Very low; four lines plus tests.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate**
- **Required validation before acceptance:** Decide multi-`@` semantics deliberately (last-`@` split is the RFC-correct reading) and document it; add tests for `""`, no-`@`, trailing-`@`, multi-`@`; run the `addGuests` and `BookingAttendeesRemoveService` suites; `yarn type-check:ci --force`.
- **Suggested atomic issue title:** `fix(lib): stop extractBaseEmail fabricating addresses from malformed input`

---

### C-04 — `getProviderName` throws a TypeError on a bare `integrations:` location

- **Source:** `COG-GTM/cal.com`
- **Exact source commit/PR:** PR [#31](https://github.com/COG-GTM/cal.com/pull/31), commit `66c378fd2f` (`packages/lib/CalEventParser.ts`)
- **Source provenance:** Devin-generated, unreviewed, no CI.
- **Type:** bug
- **Priority:** P3
- **Evidence:** E2 (reproduced), E1 for reachability (no in-repo producer of the malformed value found)
- **Current cal.forte state:** `packages/lib/CalEventParser.ts:200`. Reproduced:
  ```
  "integrations:"     -> THROWS TypeError: Cannot read properties of undefined (reading 'toUpperCase')
  "x integrations:"   -> THROWS TypeError
  "integrations:zoom" -> "Zoom"
  ```
  `getProviderName` is called only from `getLocation` in the same file, but `getLocation`/`getRichDescription` have ~35 consumers across `packages/emails` and `packages/app-store` — so a single malformed `location` value breaks calendar/email/ICS rendering for that booking across many paths.
- **Official upstream state:** identical and unfixed upstream.
- **Claimed problem:** "should return empty string for `integrations:` with no provider".
- **Independently verified problem:** The crash is confirmed. **Reachability is not.** I found no code path in cal.forte that writes a bare `"integrations:"` into `eventType.locations` or `booking.location`; the value would have to come from legacy or externally-written database rows, or a future app-store metadata regression. I also found a second, independent inconsistency the external patch does not address: the guard uses a *substring* test (`location.includes("integrations:")`) while the extraction takes the segment after the *first* colon (`location.split(":")[1]`), so `"https://zoom.us integrations:foo"` is treated as an integration and yields `"//zoom.us integrations"`.
- **Potential user value:** A malformed row degrades one field instead of failing email/ICS generation for the booking.
- **Security relevance:** None (availability only, and only for the affected booking).
- **Risk if ignored:** Low, contingent on data that has not been shown to exist.
- **Risk if integrated:** Very low; adds an early return.
- **Maintenance impact:** Negligible.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate** — but fold into C-02/C-03 as one `packages/lib` defensive-parsing change rather than its own issue, unless a reachable producer is found (which would raise it to P2).
- **Required validation before acceptance:** Confirm or refute a producer of `"integrations:"`; decide whether to also align the `includes`/`split` mismatch; `TZ=UTC yarn vitest run packages/lib/CalEventParser.test.ts`.
- **Suggested atomic issue title:** `fix(lib): return empty provider name instead of throwing on malformed integration locations`

---

### C-05 — HitPay drop-in accepts `message` events from any origin

- **Source:** cal.forte independent finding, surfaced while verifying `COG-GTM/cal.com` PR #1
- **Exact source commit/PR:** external trigger `a3186a9dca` (PR [#1](https://github.com/COG-GTM/cal.com/pull/1)) fixed only the **outbound** `postMessage(..., "*")`; the inbound gap is **not** in any external patch
- **Source provenance:** N/A — this finding is cal.forte's own.
- **Type:** security-candidate
- **Priority:** P3 (would be P2 if a deployment enables HitPay)
- **Evidence:** E1 (affected code confirmed present and unguarded); no exploit executed
- **Current cal.forte state:** `packages/app-store/hitpay/components/HitPayDropIn.ts` registers `window.addEventListener("message", handleMessage)` and dispatches on `event.data.type` with **no `event.origin` check whatsoever**. `{type:"success"}` sets `isSucceeded`, and the subsequent `{type:"toggle"}`/close path in `apps/web/components/apps/hitpay/HitpayPaymentComponent.tsx` navigates the user to `/booking/<uid>?isSuccessBookingPage=true`. The outbound `postMessage(payload, "*")` COG-GTM fixed is also still present.
- **Official upstream state:** identical and unfixed upstream.
- **Claimed problem (external):** outbound `postMessage` should target the HitPay origin rather than `*`.
- **Independently verified problem:** The external claim is correct but is the smaller half. The **inbound** listener is the more meaningful gap: any frame or window that can post to the booking page can drive `onSuccess`/`onError`/`onClose`. **Impact is client-side only** — the server still owns payment state — so the realistic outcome is a spoofed "booking confirmed" view and a forced navigation, not an actual unpaid booking. It should not be described as payment bypass without a server-side reproduction.
- **Potential user value:** The payment iframe channel behaves like a trust boundary instead of a global bus.
- **Security relevance:** Real but bounded: missing origin validation on `postMessage` (CWE-346) in a payment UI.
- **Risk if ignored:** Low in the shipped image — app-store apps are DB-default-disabled, so HitPay must be deliberately enabled with keys and attached to a paid event type.
- **Risk if integrated:** Pinning `targetOrigin` breaks if HitPay redirects the iframe cross-origin mid-flow; an inbound origin allowlist must be derived from the same `scheme://domain` the iframe was constructed with. Needs a live HitPay account to test properly — which cal.forte does not have.
- **Maintenance impact:** Low, but it touches an app cal.forte does not use and cannot test end-to-end.
- **Suggested target:** cal.forte
- **Recommended disposition:** **deferred** — record the finding; act only if HitPay enters the fork's supported-app set, or fold it into the C-13 surface-reduction track (removing the unused payment app is cheaper than hardening an untestable one).
- **Required validation before acceptance:** A HitPay sandbox, or an explicit decision to accept an untested change in a payment path. Do not merge blind.
- **Suggested atomic issue title:** `security(app-store): validate message origin in the HitPay drop-in payment channel`

---

### C-06 — Team event types resolved by slug alone on a public unauthenticated endpoint

- **Source:** `Mitch515/cal.diy`
- **Exact source commit/PR:** [`ab5d8542d3`](https://github.com/Mitch515/cal.diy/commit/ab5d8542d3) — `fix(slots): resolve team event types by team, not by slug alone`
- **Source provenance:** Author-original, not derived from upstream. Written against `calcom/cal.diy` at a base 11 days newer than cal.forte's; the pre-image is **byte-identical to current cal.forte**.
- **Type:** bug **and** security-candidate
- **Priority:** P1
- **Evidence:** E2 (defect demonstrated by code reading against the exact current files; the external author additionally reports a live production reproduction)
- **Current cal.forte state:**
  - `packages/trpc/server/routers/viewer/slots/util.ts:355` — `getEventTypeId({ slug, eventTypeSlug, organizationDetails })` declares `isTeamEvent: boolean` in its parameter **type** but never destructures it, and calls `findFirstEventTypeId({ slug: eventTypeSlug, userId })` with no `teamId`.
  - `packages/features/eventtypes/repositories/eventTypeRepository.ts:1099` — with neither `teamId` nor `userId`, `findFirstEventTypeId` falls through to `findFirst({ where: { slug } })`, the branch its own comment labels *"shouldn't happen in practice"*, returning the **lowest-id event type with that slug regardless of owner**.
  - `packages/trpc/server/routers/viewer/slots/_router.tsx:18` — `getSchedule` is a **`publicProcedure`** (unauthenticated).
- **Official upstream state:** `calcom/cal.diy@main` — same code, **unfixed**. Not present in cal.forte `main` or `develop`, not independently implemented.
- **Claimed problem:** On a team booking page `usernameList[0]` is the team slug, so the username lookup finds nothing and the slug-only fallback publishes an unrelated event type's availability. In the author's deployment three event types shared the slug `discovery`, and the team round-robin page served a member's personal 45-minute availability.
- **Independently verified problem:** Confirmed by reading the exact files. **And the impact is broader than the author states.** The fallback does not require teams to exist: any unauthenticated caller can invoke `getSchedule` with an arbitrary `usernameList[0]` that resolves to no user; `getUserIdFromUsername` returns `undefined`, and the slug-only `findFirst` then returns *some* user's event type. That makes the availability of an arbitrary event type retrievable **by event slug alone, without knowing the owning username** — a cross-owner information-disclosure and wrong-resource-resolution defect on a public endpoint. cal.forte's edition ships no team-creation UI, which limits the *team* symptom, but it does **not** limit this fallback.
- **Potential user value:** Public booking pages stop serving another owner's availability; slot queries resolve the resource the URL actually names.
- **Security relevance:** Genuine — unauthenticated cross-owner resource resolution and availability disclosure. Not remote code execution, not privilege escalation; do not over-state it.
- **Risk if ignored:** Wrong availability served on any deployment with duplicate event slugs; an enumeration primitive on a public endpoint.
- **Risk if integrated:** The external patch fixes only the `isTeamEvent` branch and leaves the personal-path fallback intact. Its `findFirstTeamEventTypeId` filters `team: { parentId: null }`, which excludes organisation sub-teams — acceptable for an org-less fork but a real constraint to record. Changing the fallback to throw `NOT_FOUND` is a **behaviour change on a public API** and must be checked against `api-no-breaking-changes`.
- **Maintenance impact:** Low. Two files, one new repository method with a conventional name (`findFirstTeamEventTypeId` is consistent with `data-repository-methods`), no schema change.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate** — the strongest item in this intake. Take the shape of the fix; **do not cherry-pick** (`-x` provenance is meaningless for a non-upstream author, and the fork should also close the personal-path fallback the external patch leaves open).
- **Required validation before acceptance:** Unit tests for (a) team slug + shared event slug, (b) non-existent username + valid event slug — asserting `NOT_FOUND` rather than a foreign event type, (c) the unchanged personal happy path; confirm the `parentId: null` constraint against the fork's org posture; audit every other caller of `findFirstEventTypeId` for the same fallback; `TZ=UTC yarn vitest run packages/trpc/server/routers/viewer/slots/util.test.ts`; `yarn type-check:ci --force`; local Playwright pass on the booking flow per `testing-playwright`.
- **Suggested atomic issue title:** `fix(slots): resolve event types by owner and stop falling back to slug-only lookup`

---

### C-07 — A throttled cosmetic Google Calendar PATCH fails an already-created event

- **Source:** `Mitch515/cal.diy`
- **Exact source commit/PR:** [`36a40b4cb4`](https://github.com/Mitch515/cal.diy/commit/36a40b4cb4) — generic portion only (`packages/app-store/googlecalendar/lib/google-calendar-retry.ts`, `.test.ts`, and the `CalendarService.ts` hunk). The same commit's `apps/web/app/api/lia/booking-sync/route.ts` is customer-specific and is **excluded** (see C-12).
- **Source provenance:** Author-original.
- **Type:** reliability
- **Priority:** P2
- **Evidence:** E1 confirmed in cal.forte code; E2 for the failure mode by control-flow reading (no live Google throttling reproduced)
- **Current cal.forte state:** `packages/app-store/googlecalendar/lib/CalendarService.ts:298-319` — after a successful `calendar.events.insert`, a second `await calendar.events.patch(...)` enriches description/location with the Meet link. It is inside the same `try`, and the `catch` at line 334 **rethrows**. A 429/`rateLimitExceeded`/5xx on that cosmetic PATCH therefore fails the whole `createEvent` even though the event already exists in Google — leaving an orphaned Google event and a booking that Cal.diy believes failed.
- **Official upstream state:** identical and unfixed upstream.
- **Claimed problem:** "The insert already succeeded and carries the Meet URL. Returning it keeps Cal.diy and Google consistent even if this cosmetic PATCH is throttled after its bounded retries."
- **Independently verified problem:** The control flow is exactly as claimed. Google Calendar's per-user write quota makes 403 `rateLimitExceeded` / 429 a realistic burst outcome, so this is not a theoretical path.
- **Potential user value:** Fewer duplicate/ghost calendar entries and fewer spurious booking failures under calendar-API pressure.
- **Security relevance:** None.
- **Risk if ignored:** Recurring, hard-to-diagnose booking failures with a successfully created Google event — exactly the class of inconsistency that erodes trust in a self-hosted scheduler.
- **Risk if integrated:** Two real trade-offs. (1) Up to 3 attempts with 250 ms/500 ms sleeps runs **inside the booking request path**, adding up to ~750 ms on the failure path. (2) The change **converts a thrown error into a logged warning** — a genuine behaviour change that must be an explicit decision, not a side effect. The helper's error shape-sniffing (`record.code`, `response.status`, nested `error.errors[].reason`) is defensive and well tested but is duplicated logic the fork then owns.
- **Maintenance impact:** Moderate. A new fork-owned file in `packages/app-store/googlecalendar/lib/`, permanently divergent from upstream. Note `packages/app-store` does not define `type-check`, so this file would sit outside the CI type program — a direct instance of the coverage gap in `.ai/quality-gates.md`.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate**, sequenced after C-06 and after the type-check coverage work in `.ai/roadmap.md`, or accompanied by adding `type-check` to `packages/app-store`.
- **Required validation before acceptance:** Port the author's three unit tests plus a non-retryable-403 case; measure the added latency budget against the booking path; decide and document the warn-instead-of-throw semantics; confirm no caller depends on `createEvent` throwing when enrichment fails.
- **Suggested atomic issue title:** `fix(googlecalendar): keep a created event when the Meet-link enrichment PATCH is throttled`

---

### C-08 — Entra/Azure AD login accepts every Microsoft tenant with no way to restrict it

- **Source:** `Mitch515/cal.diy` (generic portion of [`c46a03d8e9`](https://github.com/Mitch515/cal.diy/commit/c46a03d8e9) only)
- **Exact source commit/PR:** `c46a03d8e9` — `packages/features/auth/lib/outlook.ts` (`MS_GRAPH_TENANT_ID`, validated, default `"common"`), `next-auth-options.ts` (`tenantId: OUTLOOK_TENANT_ID`), `packages/types/environment.d.ts`. **Explicitly excludes** the sibling commits `b573bd746f`, `2a4bfef5e6`, `a6f6949b6c`, `37ccd4ce46` (see §5).
- **Source provenance:** Author-original. The underlying weakness class is corroborated by Microsoft's own Entra guidance on not trusting unverified `email` claims (the "nOAuth" abuse pattern).
- **Type:** security-candidate (hardening)
- **Priority:** P2
- **Evidence:** E1 confirmed in cal.forte code; E3 for the vulnerability class; **not** E2 — no takeover was reproduced, and see the mitigating finding below
- **Current cal.forte state:** `packages/features/auth/lib/outlook.ts` exposes only client id/secret and an enable flag — **no tenant concept at all**. `packages/features/auth/lib/next-auth-options.ts:335` constructs `AzureADProvider({ clientId, clientSecret, allowDangerousEmailAccountLinking: true, ... })` with **no `tenantId`**, so next-auth defaults to the `common` endpoint: every Entra tenant worldwide plus personal Microsoft accounts can authenticate against a private self-hosted instance.
- **Official upstream state:** `calcom/cal.diy@main` — byte-identical for both files. **Unfixed upstream.**
- **Claimed problem:** The deployment must pin its own tenant.
- **Independently verified problem:** Confirmed. **Important mitigating finding that the external author does not mention and that changes the severity:** cal.forte already carries the nOAuth mitigation. `next-auth-options.ts:846-864` requires the Azure `xms_edov` (email-domain-owner-verified) claim and returns `/auth/error?error=unverified-email` when it is absent, so `allowDangerousEmailAccountLinking: true` cannot be driven by a spoofed `mail` attribute from a foreign tenant. **This is therefore not an account-takeover finding.** What remains is a real but lesser tenant-isolation gap: any Microsoft identity in the world can *register/sign in* to an instance that enables Outlook login, and the operator has no configuration lever to prevent it. (See also C-13: the login button is currently unreachable, but `/api/auth/signin/azure-ad` is registered and reachable whenever the env vars are set.)
- **Potential user value:** A self-hoster can restrict Microsoft sign-in to their own directory — the normal expectation for a private deployment.
- **Security relevance:** Real tenant-isolation hardening; **not** a P0/P1 vulnerability, and it must not be filed as one.
- **Risk if ignored:** An operator who enables `OUTLOOK_LOGIN_ENABLED` silently exposes registration to all of Microsoft's identity population.
- **Risk if integrated:** Low if the default stays `"common"` (preserves current behaviour). Setting a tenant is a breaking change for any existing multi-tenant user. The author's `/^[a-zA-Z0-9.-]+$/` validation is adequate for GUIDs and domain names.
- **Maintenance impact:** Low; ~10 lines plus an env var, an `env-reference.md` row, and a `config/cal.forte.env.example` entry.
- **Suggested target:** cal.forte (code) + `.ai/env-reference.md` and `config/cal.forte.env.example` (documentation)
- **Recommended disposition:** **candidate**, conditional on C-13 first deciding whether Outlook login stays at all. If C-13 removes the surface, this becomes `not-applicable`.
- **Required validation before acceptance:** Confirm the installed `next-auth` AzureADProvider honours `tenantId` as expected; test unset (`common`), GUID, and domain forms; verify the `xms_edov` guard still fires; confirm the value is server-only and never inlined into the client bundle; `yarn type-check:ci --force`.
- **Suggested atomic issue title:** `feat(auth): allow restricting Microsoft sign-in to a configured Entra tenant`

---

### C-09 — Upstream drift visibility, redefined for a selective-review fork

- **Source:** `Biji-Biji-Initiative/cal.com` (concept only)
- **Exact source commit/PR:** [`9de5776dfb`](https://github.com/Biji-Biji-Initiative/cal.com/commit/9de5776dfb) `.github/workflows/upstream-drift.yml`; contrasted with [`fc37a2cac4`](https://github.com/Biji-Biji-Initiative/cal.com/commit/fc37a2cac4) `.github/workflows/auto-sync-upstream.yml`
- **Source provenance:** Author-original deployment tooling.
- **Type:** maintenance
- **Priority:** P3
- **Evidence:** E1 (the manual process it would automate is documented in `UPSTREAM_SYNC.md` and `FORK_STATUS.md`)
- **Current cal.forte state:** Upstream observation is entirely manual. `FORK_STATUS.md` carries "Upstream mirror observed" and "Reviewed through" fields updated by hand; `UPSTREAM_SYNC.md` supplies the security-relevant grep. Nothing tells the maintainer when new upstream commits appear, and `.ai/state.md` notes the `upstream` remote is not even configured.
- **Official upstream state:** N/A (fork-process tooling).
- **Claimed problem:** The fork should know when it drifts from upstream.
- **Independently verified problem:** True, but **their mechanism is incompatible with cal.forte and must not be adopted.** Their workflow asserts `merge-base(HEAD, upstream/main) == upstream/main` and **fails the build** when the fork is behind, and `auto-sync-upstream.yml` opens automatic merge PRs. cal.forte's `develop` is *deliberately* behind by design — 41 upstream commits are recorded as not-integrated in `UPSTREAM_REVIEW_LEDGER.md`. Their gate would be permanently red, and their auto-merge model is the direct negation of `.ai/decisions.md` ("upstream sync requires explicit approval", one `cherry-pick -x` per commit).
- **Potential user value:** The maintainer learns about security-relevant upstream commits without a manual poll — directly serving `UPSTREAM_SYNC.md` → *Security Fix Priority*, the one drift the fork says it does not tolerate.
- **Security relevance:** Indirect but aligned with the fork's stated top priority.
- **Risk if ignored:** Security-relevant upstream commits sit unnoticed between manual reviews.
- **Risk if integrated:** Alert fatigue; a scheduled job that fetches upstream needs a narrow token scope; **any drift toward enforcement or auto-merge would corrupt the review model.** The workflow must be report-only by construction.
- **Maintenance impact:** One fork-owned workflow. Also requires adding the `upstream` remote, which `UPSTREAM_SYNC.md` currently defers.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate**, scoped strictly to *reporting*: list commits in `<reviewed-through>..upstream/main` not present in `UPSTREAM_REVIEW_LEDGER.md`, run the documented security grep, and never fail on "behind".
- **Required validation before acceptance:** Confirm it cannot block a merge or open a PR; confirm the reviewed-through anchor can be read from `FORK_STATUS.md` (or is passed explicitly); minimal `permissions:`; pinned action SHAs per the existing immutable-inputs divergence.
- **Suggested atomic issue title:** `ci(forte): report pending upstream commits without enforcing upstream ancestry`

---

### C-10 — Environment-template drift check for the fork-owned env contract

- **Source:** `Biji-Biji-Initiative/cal.com` (concept, heavily re-scoped)
- **Exact source commit/PR:** [`5f485c815c`](https://github.com/Biji-Biji-Initiative/cal.com/commit/5f485c815c) and [`b91399fb37`](https://github.com/Biji-Biji-Initiative/cal.com/commit/b91399fb37) — `scripts/verify-calcom-env.sh`, `scripts/test-verify-calcom-env.sh`, `.github/workflows/env-preflight.yml`
- **Source provenance:** Author-original deployment tooling for GKE/Cloud Run.
- **Type:** maintenance
- **Priority:** P3
- **Evidence:** E1
- **Current cal.forte state:** cal.forte owns `config/cal.forte.env.example` and `.ai/env-reference.md` and treats them as the hardened deployment contract, but nothing verifies they stay aligned with the code's actual `process.env` usage after an upstream sync. `forte-ci` runs install, telemetry guard, type-check, and Biome only.
- **Official upstream state:** N/A.
- **Claimed problem:** Environment misconfiguration should be caught before rollout.
- **Independently verified problem:** Their script validates a *deployment* env file (required keys present, no placeholders, optional Google/SSO gates). **That is the consumer's job, not this repository's** — `.ai/decisions.md` places deployment in `secure-docker-blueprint`, and `.ai/roadmap.md` already assigns secret handling there. The part that genuinely belongs to cal.forte is the inverse check: **does the shipped template still describe the env vars the code actually reads?** That is a real, unguarded fork-owned risk, since an upstream sync can add or remove env vars silently — and C-13 below is a concrete instance of a documented flag that controls nothing.
- **Potential user value:** The published env template stays truthful across upstream syncs.
- **Security relevance:** Indirect; prevents a repeat of the "documented flag that controlled nothing" class the fork already removed once (telemetry opt-out).
- **Risk if ignored:** The template rots; operators configure variables that no longer exist and miss ones that appeared.
- **Risk if integrated:** A naive `process.env` scan over a Cal.diy tree produces heavy noise and will need an allowlist; a badly tuned check becomes a chronically failing job.
- **Maintenance impact:** Moderate — an allowlist that itself needs maintenance. Start report-only.
- **Suggested target:** **split** — template-vs-code drift check → cal.forte; deployment env validation, rollout readiness gate, and live smoke checks → `secure-docker-blueprint`
- **Recommended disposition:** **deferred** — real value, but lower than C-01…C-08, and it should not start before the branding/surface audits (Tracks A and B) settle what the template must describe.
- **Required validation before acceptance:** Prototype the scan and measure the false-positive rate before committing to a gate; confirm the split with the `secure-docker-blueprint` owner.
- **Suggested atomic issue title:** `ci(forte): report drift between the shipped env template and the env vars the code reads`

---

### C-11 — API v2 build stage runs as root (delta against cal.forte's non-root runtime)

- **Source:** `COG-GTM/cal.com`
- **Exact source commit/PR:** `a3186a9dca` (PR [#1](https://github.com/COG-GTM/cal.com/pull/1)), `apps/api/v2/Dockerfile`
- **Source provenance:** SonarQube-driven, Devin-generated, unreviewed.
- **Type:** deployment
- **Priority:** P3
- **Evidence:** E1
- **Current cal.forte state:** `apps/api/v2/Dockerfile` **already** pins the base image by digest, uses `yarn install --immutable`, drops to `USER node` before `CMD`, and adds a `HEALTHCHECK` — the fork divergence recorded as `6800e65e06` and released in `v6.2.0-5`. The remaining delta is that the **build** stage still runs as root; COG-GTM instead `chown`s `/calcom` and switches to `USER node` before `COPY`/`yarn install`.
- **Official upstream state:** upstream has none of this hardening.
- **Claimed problem:** Container should not run as root.
- **Independently verified problem:** The **runtime** concern is already covered. Unprivileged build is a marginal extra (it limits what a malicious postinstall script can touch inside an ephemeral builder layer).
- **Potential user value:** Marginal.
- **Security relevance:** Low; the builder layer is discarded and is not part of the published image.
- **Risk if ignored:** Negligible.
- **Risk if integrated:** Real breakage risk — yarn cache/permission issues under a non-root builder, and `apps/api/v2` is not the image the release pipeline publishes (the root `Dockerfile` is). Cost exceeds benefit.
- **Maintenance impact:** Adds a fragile ordering constraint to a Dockerfile that already diverges from upstream.
- **Suggested target:** cal.forte
- **Recommended disposition:** **already-covered** for the runtime concern; **rejected** for the build-stage delta.
- **Required validation before acceptance:** N/A.
- **Suggested atomic issue title:** *(none — should not become an issue)*

---

### C-12 — Deployment- and customer-specific external changes

- **Source:** `Mitch515/cal.diy` and `Biji-Biji-Initiative/cal.com`
- **Exact source commit/PR:** Mitch515 `db4cf51039`, `a6a613c3f8`, `99bd03df14`, `3bf27b0025`, `5d3c598f16`, `5cb52158ef`, `dca4d168c3`, `36a40b4cb4` (LIA portion), `78a40bde25`, `44956789fd`, `ea1cf3ff66`, `b573bd746f`, `a6f6949b6c`, `9ac64780cc`; Biji-Biji `80aa00e362`, `b592052ad7`, `3b7bf076a4`, and the `docs/mereka/**` and `deploy-api-v2.sh` sets.
- **Source provenance:** Author-original, deployment-bound.
- **Type:** deployment
- **Priority:** —
- **Evidence:** E1 (identified as customer-specific by inspection)
- **Current cal.forte state:** No LIA routes, no `Mereka Docs/`, no GKE/Cloud Run tooling.
- **Official upstream state:** N/A.
- **Independently verified problem:** These carry a named customer's business logic: `apps/web/app/api/lia/**` provisioning endpoints, "WN sales" webhook scoping, brand colours, a hardcoded `WEALTH_NAVIGATOR_TENANT_ID = "f1a52f59-393f-43d3-813f-fa1197512059"`, `LOGO = "/mereka-logo.png"`, `APP_NAME` defaulting to "Mereka Calendar". **Biji-Biji's `80aa00e362` deserves a specific note:** it removes a hardcoded API key (`mereka_48cf7756fe5d0ebb1c788c0f49a2e010`) that bypassed both `ApiAuthStrategy` and `CustomThrottlerGuard`, plus committed `.env`/`.log` files. Those backdoors were **introduced by that fork**, never present upstream, and never present in cal.forte — confirmed by reading `apps/api/v2/src/modules/auth/strategies/api-auth/api-auth.strategy.ts` and `apps/api/v2/src/lib/throttler-guard.ts` locally.
- **Security relevance:** Only as a negative result: it demonstrates concretely why "another fork implemented it" is not evidence.
- **Recommended disposition:** **not-applicable**
- **Suggested atomic issue title:** *(none — should not become an issue)*

---

### C-13 — Track B: unused / dead upstream surface (fork-owned)

- **Source:** cal.forte independent audit, triggered by `Mitch515/cal.diy` [`ea863eac76`](https://github.com/Mitch515/cal.diy/commit/ea863eac76)
- **Exact source commit/PR:** external trigger only; the audit scope is the fork's own
- **Source provenance:** cal.forte
- **Type:** maintenance (with a security-hygiene dimension)
- **Priority:** P2
- **Evidence:** E2 for the flagship finding, E1 for the rest
- **Current cal.forte state — verified:**
  1. **The Microsoft login flag controls nothing while its endpoint stays live.**
     `apps/web/server/lib/auth/login/getServerSideProps.tsx:91` hardcodes
     `isOutlookLoginEnabled: false`, and `apps/web/lib/signup/getServerSideProps.tsx` never
     passes the prop at all — so the button is unreachable on **both** pages. Meanwhile
     `next-auth-options.ts:333` still registers the `azure-ad` provider whenever
     `OUTLOOK_LOGIN_ENABLED` and the client credentials are set, leaving
     `/api/auth/signin/azure-ad` reachable by direct navigation. Around it sits a full dead
     surface: `IS_OUTLOOK_LOGIN_ENABLED`, `packages/features/auth/lib/outlook.test.ts`, and
     the `isOutlookLoginEnabled` branches in `login-view.tsx` and `signup-view.tsx`.
     Confirmed byte-identical in `calcom/cal.diy@main` — this is inherited upstream rot, not
     a fork mistake. **It is the same defect class the fork already acted on when it removed
     the inert telemetry module and its phantom opt-out (`75a9df1812`).**
  2. `packages/features/ee/` contains **0 files**, confirming the CE-only edition, while
     EE-shaped code paths and `.ai/branding.md`'s edition table still describe it.
  3. Unused app-store surface — e.g. the HitPay payment app of C-05, which the fork can
     neither test nor support.
  4. `.ai/roadmap.md` already tracks the related type-check coverage gap; that gap is
     precisely what lets dead code rot unnoticed (`.ai/quality-gates.md`).
- **Official upstream state:** upstream carries the same dead surface.
- **Independently verified problem:** Yes for (1) and (2), by direct file inspection.
- **Potential user value:** The published env contract stops advertising a control that does nothing.
- **Security relevance:** Real: a reachable OAuth endpoint whose *only* documented control is inert, combined with the unconstrained tenant of C-08.
- **Risk if ignored:** Operators believe `OUTLOOK_LOGIN_ENABLED=false` disables Microsoft auth; it does not disable the endpoint, and setting it to `true` produces no visible change — the exact confusion the telemetry removal was meant to end.
- **Risk if integrated:** Two legitimate directions with opposite consequences — **wire the flag through** (turns on a login button; then C-08 becomes mandatory) or **remove the surface** (smaller attack surface; drops a feature some operator may want). This is a fork-scope decision, not a bug fix, and should be decided explicitly.
- **Maintenance impact:** Removal creates divergence upstream syncs can silently revert; if chosen, it needs a guard in the style of `scripts/fork-guard-telemetry.sh`.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate** — one decision issue for the Outlook flag, plus a parent audit issue. Everything else stays inventory until the audit reports.
- **Required validation before acceptance:** Enumerate every consumer before removal; confirm no API v2 or platform-atoms path depends on it; add a fork guard if removed; record the outcome in `FORK_DIVERGENCE.md`.
- **Suggested atomic issue title:** `chore(auth): decide whether OUTLOOK_LOGIN_ENABLED is wired through or removed as dead surface`

---

### C-14 — Track A: self-host branding / productization audit (fork-owned)

- **Source:** cal.forte independent audit
- **Exact source commit/PR:** N/A
- **Source provenance:** cal.forte
- **Type:** branding
- **Priority:** P3
- **Evidence:** E2 (verified against `Dockerfile`, `.github/actions/docker-build-and-test/action.yml`, `packages/lib/constants.ts`, `apps/web/public/`)
- **Current cal.forte state — verified:**
  1. **The build passes only one of three branding args.** `Dockerfile:22-24` declares
     `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_NAME`, and
     `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS`, and lines 37-39 promote them to `ENV`. But
     `.github/actions/docker-build-and-test/action.yml:124-129` passes **only**
     `NEXT_PUBLIC_APP_NAME=cal.forte`. Because these are `NEXT_PUBLIC_*` and are inlined at
     build time, the published `v6.2.0-5` image therefore still ships
     `COMPANY_NAME = "Cal.com, Inc."` and `SUPPORT_MAIL_ADDRESS = "help@cal.com"` from the
     `constants.ts` defaults — a hardened fork pointing users at upstream's support address.
  2. `packages/lib/constants.ts:37,101` still default `WEBSITE_URL` to `https://cal.com` and
     `LOGO` to `/calcom-logo-white-word.svg`; `apps/web/public/` still carries
     `calcom-logo-white-word.svg`, `calcom-white.svg`, and the `continue-with-calcom-*` set.
  3. **`.ai/branding.md` is stale and now actively misleading.** Its §1 warns
     "`NEXT_PUBLIC_APP_NAME` is not even a build-arg in the `Dockerfile` … Currently NOT
     done" — false since `4264193f84`, and contradicted by `FORK_DIVERGENCE.md`'s
     "`cal.forte` image branding … Released by `v6.2.0-3`". Its "~52 files still hard-code
     Cal.com" claim is also stale: the literal now appears in **3** files, all `package.json`
     author fields.
- **Official upstream state:** upstream is Cal.com-branded by definition.
- **Independently verified problem:** Yes, all three items.
- **Potential user value:** A self-host distribution whose in-product identity matches its published identity, and internal docs an agent or maintainer can trust.
- **Security relevance:** Low, but a support address pointing at a third party is a real misdirection channel for a security-conscious distribution.
- **Risk if ignored:** Users of `cal.forte` are directed to `help@cal.com`; `.ai/branding.md` keeps sending future work down a false path.
- **Risk if integrated:** All `NEXT_PUBLIC_*` branding is build-time, so every change requires a rebuild and a new release tag; asset replacement touches many files and inflates the diff beyond the `< 500 lines / < 10 code files` guidance — it must be staged.
- **Maintenance impact:** Growing divergence in `apps/web/public/` and `constants.ts` that upstream syncs will contest; consider `.gitattributes` `merge=ours` guards as already used for README/security-contact.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate**, split into three atomic issues — (a) pass the two missing build args, (b) correct `.ai/branding.md`, (c) audit residual upstream assets and defaults. (a) and (b) are small and independent; (c) is an audit.
- **Required validation before acceptance:** Rebuild and confirm the values in the built client bundle, not just in env; verify no email template hardcodes the old support address; record in `FORK_DIVERGENCE.md`.
- **Suggested atomic issue title:** `fix(release): pass the fork company name and support address as image build args`

---

## 2. Ranked Candidate Table

| Rank | ID | Candidate | Source | Type | Prio | Ev. | Target | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | C-06 | Slot event types resolved by slug alone on a public unauth endpoint | Mitch515 `ab5d8542d3` | bug + security-candidate | **P1** | E2 | cal.forte | candidate |
| 2 | C-02 | `truncateOnWord` ignores `maxLength`; can return only `"..."` | COG-GTM #31 (lead) | bug | P2 | E2 | cal.forte | candidate |
| 3 | C-13 | Dead Outlook login flag with a live `azure-ad` endpoint (Track B) | fork audit / Mitch515 `ea863eac76` | maintenance | P2 | E2 | cal.forte | candidate |
| 4 | C-07 | Throttled Meet-link PATCH fails an already-created Google event | Mitch515 `36a40b4cb4` | reliability | P2 | E1/E2 | cal.forte | candidate |
| 5 | C-03 | `extractBaseEmail` fabricates addresses from malformed input | COG-GTM #31 | bug | P2 | E2 | cal.forte | candidate |
| 6 | C-01 | CSV export does not neutralise spreadsheet formulas | COG-GTM #31 | security-candidate | P2 | E2 | cal.forte | candidate |
| 7 | C-08 | Entra login accepts every Microsoft tenant, unconfigurable | Mitch515 `c46a03d8e9` | security-candidate | P2 | E1/E3 | cal.forte | candidate (after C-13) |
| 8 | C-14 | Branding args not passed at build; `.ai/branding.md` stale (Track A) | fork audit | branding | P3 | E2 | cal.forte | candidate |
| 9 | C-09 | Upstream drift **reporting** (never enforcement) | Biji-Biji `9de5776dfb` | maintenance | P3 | E1 | cal.forte | candidate |
| 10 | C-04 | `getProviderName` throws on bare `integrations:` | COG-GTM #31 | bug | P3 | E2 | cal.forte | candidate (fold into C-02/C-03) |
| 11 | C-10 | Env-template-vs-code drift check | Biji-Biji `5f485c815c` | maintenance | P3 | E1 | split | deferred |
| 12 | C-05 | HitPay `message` listener has no origin check | fork finding (COG-GTM #1 partial) | security-candidate | P3 | E1 | cal.forte | deferred |
| — | C-11 | API v2 build stage runs as root | COG-GTM #1 | deployment | P3 | E1 | cal.forte | already-covered / rejected |
| — | C-12 | LIA / Mereka deployment-specific changes | Mitch515, Biji-Biji | deployment | — | E1 | neither | not-applicable |

**No P0 is assigned.** Nothing in this intake meets the stated bar of a confirmed severe or
actively exploitable issue. C-06 is the closest and is deliberately capped at P1.

---

## 3. Recommended GitHub Issue Hierarchy

> **Blocker at the time of writing — since resolved.** During this intake pass
> `gh issue list -R rubennati/cal.diy` reported *"the 'rubennati/cal.diy' repository has
> disabled issues"*, so nothing here could be filed and this pass performed no GitHub writes.
> **Issues were enabled later on 2026-08-26 and the set below was filed as #12–#40**, under
> tracker [#12](https://github.com/rubennati/cal.diy/issues/12). The hierarchy below is kept as
> authored — it is the reasoning behind the set, not a description of current GitHub state. The
> authoritative candidate → finding → issue mapping is
> [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) §1.2.

**Master tracker** — `[tracker] External fork intake — COG-GTM, Mitch515, Biji-Biji` (body in §6)

**Epic 1 — Correctness and hardening intake** *(highest value; ship in this order)*
1. `fix(slots): resolve event types by owner and stop falling back to slug-only lookup` — C-06, **P1**
2. `fix(lib): honour maxLength in truncateOnWord and stop dropping text with no word break` — C-02
3. `fix(lib): stop extractBaseEmail fabricating addresses from malformed input` — C-03 *(absorbs C-04 unless a reachable producer is found)*
4. `fix(lib): neutralise spreadsheet formula prefixes in CSV export sanitisation` — C-01
5. `fix(googlecalendar): keep a created event when the Meet-link enrichment PATCH is throttled` — C-07

**Epic 2 — Auth surface decision** *(sequenced: 6 gates 7)*

6. `chore(auth): decide whether OUTLOOK_LOGIN_ENABLED is wired through or removed as dead surface` — C-13
7. `feat(auth): allow restricting Microsoft sign-in to a configured Entra tenant` — C-08 *(blocked by item 6 above)*

**Epic 3 — Track A: self-host branding and productization**

8. `fix(release): pass the fork company name and support address as image build args` — C-14(a)
9. `docs(ai): correct the stale branding build-arg and Cal.com-literal claims` — C-14(b)
10. `[audit] residual upstream branding assets and constants defaults` — C-14(c)

**Epic 4 — Track B: unused / upstream surface reduction**

11. `[audit] inventory dead upstream surface reachable in the shipped image` — C-13 parent

**Epic 5 — Fork process automation** *(lowest priority; do not start before Epics 1–2)*

12. `ci(forte): report pending upstream commits without enforcing upstream ancestry` — C-09
13. `ci(forte): report drift between the shipped env template and the env vars the code reads` — C-10 *(deferred)*

**Deferred, filed but not scheduled**

14. `security(app-store): validate message origin in the HitPay drop-in payment channel` — C-05

**Total: 1 tracker + 14 issues.** Every one is backed by a file and line in the current tree.

---

## 4. Proposed Labels

The repository currently carries only GitHub's nine defaults, none of which express this
fork's vocabulary.

**Type** (reuse `bug`, `enhancement`, `documentation`; add):
`type:security-candidate`, `type:reliability`, `type:optimization`, `type:maintenance`,
`type:branding`, `type:deployment`

**Priority:** `P0`, `P1`, `P2`, `P3`

**Evidence:** `E0:claim-only`, `E1:code-confirmed`, `E2:reproduced`, `E3:corroborated`

**Disposition** (mirrors `UPSTREAM_REVIEW_LEDGER.md` so issues and ledger stay one vocabulary):
`disp:candidate`, `disp:deferred`, `disp:rejected`, `disp:already-covered`,
`disp:not-applicable`, `disp:partial`, `disp:integrated`

**Provenance:** `src:external-fork`, `src:upstream`, `src:fork-owned`

**Scope:** `scope:cal.forte`, `scope:secure-docker-blueprint`, `scope:track-a-branding`,
`scope:track-b-surface`

Reuse `wontfix` for closed-as-rejected. Deliberately **not** proposed: severity labels beyond
P0–P3, and any `security` label without an evidence label — the evidence tier is what stops a
P2 hardening item from reading as a P0 vulnerability.

---

## 5. Candidates That Should **Not** Become Issues

| Item | Source | Why not |
| --- | --- | --- |
| **In-place `emails.sort()` "side effect"** | COG-GTM `66c378fd2f` | **Claim disproved.** `emailSchema.array().safeParse(value)` returns a *new* array, so sorting it cannot reach `responses[field.name]`; I verified the copy semantics explicitly. The dedup comparison is also correct on the sorted copy. `[...emails].sort()` is harmless but fixes nothing. **rejected (E0 claim, disproved).** |
| `teams/create` `Math.random()` → `randomBytes` | COG-GTM `a3186a9dca` | `apps/web/app/api/teams/create/route.ts` exists in **neither** cal.forte `main`/`develop` **nor** `calcom/cal.diy@main` — it was removed upstream after COG-GTM's stale 2026-03-31 base. **not-applicable.** |
| `create-sentry-release.js` `execSync` → `execFileSync` | COG-GTM `a3186a9dca` | A build-time script invoking the constant `git rev-parse HEAD`; no attacker-controlled input. Classic SonarQube false positive. Sentry is not part of the fork's release path. **rejected.** |
| `ServerTrans` `Math.random()` placeholders | COG-GTM `a3186a9dca` | Placeholders are internal and replaced before render; "insecure randomness" does not apply. The proposed module-level mutable counter adds shared server state for no gain. **rejected.** |
| COG-GTM test-coverage PRs #2–#4, #6–#30 | COG-GTM | ~27 unreviewed, CI-unchecked, agent-generated PRs against a base older than cal.forte's, several targeting Insights/Stripe/DI surfaces this edition does not ship. Adopting them would violate the diff-size guidance many times over. Coverage should be grown from cal.forte's own risk areas. **rejected as an intake source** (`testing-coverage-requirements` still applies to fork-authored changes). |
| COG-GTM #5 private-link booking windows | COG-GTM `77044b94ef` | Draft, 28 files, includes a **Prisma migration** and schema change. New feature, not a fix; "Ask first" territory per `CLAUDE.md`. **rejected.** |
| Hardcoded `WEALTH_NAVIGATOR_TENANT_ID` | Mitch515 `b573bd746f` | Bakes a third party's Entra tenant GUID in as the default. **not-applicable.** |
| `xms_edov` bypass via `tid` match | Mitch515 `2a4bfef5e6` | **Weakens** the email-domain-ownership guard cal.forte already has. Defensible inside one pinned tenant, unacceptable as a general default. **rejected.** |
| `prompt: "consent"` → `"select_account"` | Mitch515 `37ccd4ce46` | No security gain, and it risks losing the guaranteed refresh-token grant that `consent` provides for incremental scopes. Deployment preference. **rejected.** |
| Teams scopes + auto-connect at sign-in | Mitch515 `a6f6949b6c`, `9ac64780cc` | **Expands** the OAuth scope set and auto-creates credentials during login. More attack surface for a customer-specific need. **rejected.** |
| Broadened OAuth user lookup (`OR` on the `Account` table) | Mitch515 `dfbec75dc9` | Plausible and arguably correct, but it changes account-linking semantics in the auth path with no demonstrated cal.forte defect. **deferred** — revisit only if C-13 keeps Outlook login and a real linking failure is observed. |
| Team round-robin UI + public team route restoration | Mitch515 `f4df0e267c` | ~2,500 lines restoring functionality this edition does not ship. A product-scope decision, not an intake item. **deferred.** |
| Automatic upstream sync with auto-PR | Biji-Biji `fc37a2cac4` | **Directly contradicts** `.ai/decisions.md` and `UPSTREAM_SYNC.md`. Their own `upstream-drift.yml` *fails the build* when the fork is behind — permanently red for a fork with 41 deliberately non-integrated commits. **rejected**; only the reporting concept survives, as C-09. |
| Live smoke-check / rollout-readiness / release-gate scripts | Biji-Biji `f009472524`, `d02001d735`, `286d50e912`, `f813019553` | cal.forte's `.github/actions/docker-build-and-test/action.yml` **already** builds once, boots the exact image, polls `/auth/login`, Trivy-scans, emits a CycloneDX SBOM, refuses to overwrite a tag, and captures the digest. What is missing is *post-deployment* verification against a live URL — the consumer's job. **already-covered** here; the remainder → `secure-docker-blueprint`. |
| App-store seed enable fix | Biji-Biji `1b1779fe58` | cal.forte's `scripts/seed-app-store.ts:52-54` and `packages/features/apps/repository/PrismaAppRepository.ts:17` already call `shouldEnableApp(dirName, keys ?? foundApp?.keys)`. Upstream fixed this after their base. **already-covered.** |
| Dependency/security monitoring | Biji-Biji Dependabot PRs | cal.forte already runs `forte-codeql`, `forte-trivy`, `forte-scorecard`, and Dependabot (`FORK_DIVERGENCE.md` → Fork security CI). **already-covered.** |
| Biji-Biji "auth backdoor" removal | Biji-Biji `80aa00e362` | Removes a hardcoded API key **that fork introduced**. Never upstream, never in cal.forte — verified locally. **not-applicable**, retained as evidence for the fork's trust posture. |
| API v2 unprivileged build stage | COG-GTM `a3186a9dca` | Runtime non-root is already shipped (`6800e65e06`, `v6.2.0-5`). See C-11. **already-covered / rejected.** |

---

## 6. Duplicates And Overlaps With The Existing Upstream Ledger

**No candidate in this report duplicates an existing `UPSTREAM_REVIEW_LEDGER.md` row.** The
ledger covers `46eb533dbd..176037d0af` in `calcom/cal.diy`; every candidate here originates
from an external fork or from cal.forte's own audit, and each affects code that is currently
**identical** in cal.forte and upstream `main` (verified per file).

Adjacencies worth recording when these are filed:

| Overlap | Detail |
| --- | --- |
| **Mitch515's fork point is a ledger row.** | Their base `180ede28f0` is the commit the ledger lists as `deferred` (system-font fallback). Coincidence of timing only; no dependency. |
| **C-13 continues an existing fork divergence.** | The dead `OUTLOOK_LOGIN_ENABLED` flag is the same "documented flag that controlled nothing" pattern as the telemetry removal (`FORK_DIVERGENCE.md` → *Inert Jitsu usage-telemetry module and phantom opt-out removed*, `75a9df1812`). If removal is chosen, extend the guard pattern of `scripts/fork-guard-telemetry.sh`. |
| **C-14 corrects a documented divergence claim.** | `FORK_DIVERGENCE.md` → *`cal.forte` image branding* claims the fork name is baked "through explicit build arguments" (`4264193f84`, `v6.2.0-3`). True for `NEXT_PUBLIC_APP_NAME` only; two of three declared args are never passed. The register row needs qualifying either way. |
| **C-07 collides with a known gate limitation.** | A new file in `packages/app-store` lands outside `type-check:ci` (`.ai/quality-gates.md`, `.ai/roadmap.md`). Either extend coverage to `packages/app-store` first, or note the gap on the issue. |
| **C-01 depends on a release-time build decision.** | Reachability is governed by `ORGANIZATIONS_ENABLED`, a Dockerfile ARG **not** passed by `docker-build-and-test/action.yml`. If org support is ever enabled, C-01 moves from theoretical to live — worth an explicit note in the issue. |
| **C-09/C-10 touch documented process, not just CI.** | Both imply edits to `UPSTREAM_SYNC.md` (adding the `upstream` remote, currently deferred) and to the `FORK_STATUS.md` maintenance record. |
| **New candidates are not ledger rows.** | `UPSTREAM_REVIEW_LEDGER.md` is defined as the record of **upstream** commit dispositions. External-fork intake needs its own register (or an explicitly-labelled section) so `git cherry-pick -x` provenance is never implied for a non-upstream author. Decide this before filing. |

---

## 7. Proposed Master Tracker Body

```markdown
# [tracker] External fork intake — COG-GTM, Mitch515, Biji-Biji

Analysis-only intake pass completed 2026-08-25. No repository or GitHub state was changed.
Full report: `docs/EXTERNAL_FORK_INTAKE_EVIDENCE.md`.

## Scope

Three external forks of `calcom/cal.diy` were evaluated as **discovery sources only**:

| Fork | Merge-base with upstream | Ahead / behind | Character |
| --- | --- | --- | --- |
| `COG-GTM/cal.com` | `77b2be13b2` (2026-03-31) | 0 / 124 | 31 unmerged agent-generated PRs, **no CI, no reviews** |
| `Mitch515/cal.diy` | `180ede28f0` (2026-05-14) | 23 / 47 | Highest-quality diffs; heavily customer-specific ("LIA") |
| `Biji-Biji-Initiative/cal.com` | `facc0745d3` (2026-04-06) | 67 / 115 | Deployment/CI fork; auto-merge upstream model |

cal.forte's own base is `46eb533dbd` (2026-05-03), so **COG-GTM and Biji-Biji describe code
older than this fork's base**. Every claim was re-verified against the current tree.

## Method

Each claim was checked against (1) the current cal.forte file, (2) the current
`calcom/cal.diy@main` file, and (3) where behaviour was in question, execution of the
verbatim current implementation in an isolated scratchpad script. Three external claims did
not survive that step and are rejected with the disproof recorded.

## Outcome

**14 issues proposed. No P0.** Nothing here meets the bar of a confirmed severe or actively
exploitable issue, and nothing is escalated on an external claim alone.

| Prio | Count | Items |
| --- | --- | --- |
| P1 | 1 | Slot event types resolved by slug alone on a public unauthenticated endpoint |
| P2 | 6 | truncateOnWord content loss · dead Outlook flag · Google PATCH throttling · extractBaseEmail · CSV formula injection · Entra tenant restriction |
| P3 | 5 | branding build args · stale branding doc · branding asset audit · upstream drift reporting · env-template drift (deferred) |
| deferred | 2 | HitPay message origin · env-template drift check |

## Rejected, with reasons recorded

- **In-place `emails.sort()` "side effect" — claim disproved.** zod returns a new array; the
  mutation cannot reach `responses`.
- `teams/create` `Math.random()` — the route exists in neither this fork nor upstream today.
- Sentry/`ServerTrans` SonarQube items — false positives, no attacker-controlled input.
- ~27 COG-GTM test-coverage PRs — unreviewed, CI-unchecked, stale base, partly targeting
  features this edition does not ship.
- Hardcoded `WEALTH_NAVIGATOR_TENANT_ID`, `xms_edov` tenant bypass, Teams scope expansion,
  `prompt=select_account` — customer-specific or a net security relaxation.
- **Biji-Biji's automatic upstream merge model — rejected on principle.** Their drift
  workflow *fails the build* when the fork is behind upstream. This fork is deliberately
  behind: 41 upstream commits are recorded as not-integrated. Only the *reporting* concept
  is adopted; enforcement and auto-PR are not.
- Live smoke-check / rollout-readiness / release-gate scripts — image-level equivalents are
  already covered by `docker-build-and-test`; post-deployment checks belong to
  `secure-docker-blueprint`.
- App-store seed enable fix and dependency monitoring — already covered.

## A note on trusting other forks

`Biji-Biji-Initiative/cal.com@80aa00e362` removes a hardcoded API key that bypassed both
`ApiAuthStrategy` and `CustomThrottlerGuard` — **backdoors that fork introduced itself**,
never present upstream and never present here. Two of the three forks shipped changes that
would have *reduced* this fork's security posture if adopted uncritically.

## Prerequisites before filing

- [ ] **Enable Issues on this repository** (currently disabled).
- [ ] Create the label set (type / priority / evidence / disposition / provenance / scope).
- [ ] Decide where external-fork intake is recorded. `UPSTREAM_REVIEW_LEDGER.md` is defined
      for **upstream** commits; external-fork provenance must never imply `cherry-pick -x`.

## Sequencing

1. Epic 1 — correctness and hardening intake (5 issues), P1 first.
2. Epic 2 — Outlook surface decision gates the Entra tenant work.
3. Epics 3 & 4 — fork-owned branding and surface-reduction audits.
4. Epic 5 — process automation, report-only, last.

## Standing rules for every child issue

- Independently establish the defect in this tree before calling anything a security fix.
- Author fork-owned fixes; do not cherry-pick from a non-upstream author.
- Keep diffs under ~500 lines / 10 code files; split by layer.
- `yarn type-check:ci --force` before concluding, per `CLAUDE.md`.
- Record accepted changes in `FORK_DIVERGENCE.md` and `.ai/sync-log.md`.
```

---

## 8. Bottom Line

The single most valuable item in this intake is **C-06**: `getEventTypeId` accepts
`isTeamEvent` and silently ignores it, so a public unauthenticated `getSchedule` call falls
through to a slug-only lookup and can return an event type belonging to someone else. It is
present in cal.forte, present in upstream `main`, unfixed in both, and reachable without
teams existing.

Everything else is either a modest correctness or hardening improvement, a fork-owned audit
worth running once, or — for a meaningful share of the external material — something that
would have made this fork **less** safe. Two of the three forks shipped changes that relax or
bypass existing security guards. The three named COG-GTM "fixes" I could test either did not
reproduce, targeted code this fork does not have, or shipped a test without the fix.

That is the strongest possible confirmation of this fork's operating rule: **never trust a
change merely because another fork implemented it.**

---
---

# Round 2 Addendum — Eight Additional Repositories

**Added:** 2026-08-25, same analysis-only pass. Still no repository or GitHub write of any kind.
The working tree was verified clean before and after (`git status --porcelain` empty, HEAD
unchanged at `41689d1d6e`). All archaeology below was done with **read-only local git
commands** — cal.forte's clone carries the full upstream history, so no external clone was
required.

---

## R2.0 Source Classification (A = active divergent fork, B = historical snapshot)

| # | Repo | Fork of | Merge-base w/ upstream | Ahead | Behind | Own code | **Class** |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 4 | `Drakkarrr/cal.com` | `calcom/cal.diy` | `a657723e1c` (2026-04-14) | **0** | 106 | none | **B** |
| 5 | `millionco/cal.com` | `calcom/cal.diy` | `a6a428c8cb` (2026-02-18) | **0** | 257 | none | **B** |
| 6 | `Singhshashi18/cal.com` | `calcom/cal.diy` | `e02108d535` (2025-09-04) | 1 | 2452 | one README edit | **B** |
| 7 | `PeerRich/calendso` | `calcom/cal.diy` | `08f83dd85c` (**2021-10-01**) | **0** | 15,391 | none | **B** (deep archive) |
| 8 | `retrogtx/cal.com` | `calcom/cal.diy` | `a2d0cbfe5b` (2025-09-09) | 31 | 2381 | 30 upstream merge commits + 1 locale tweak (`755a5c0e66`) | **B** |
| 9 | `skdas20/cal.com` | `calcom/cal.diy` | `be249a94de` (2025-09-17) | **0** | 2297 | none | **B** |
| 10 | `Enqira/cal.diy` | `calcom/cal.diy` | `176037d0af` (2026-08-08) | 2 | **0** | 1 commit, 59 files, +3636/−21 | **A** |
| 11 | `erikmayergit/cal.diy` | `calcom/cal.diy` | `176037d0af` (2026-08-08) | 3 | **0** | 3 commits, 2 files, +50/−1 | **A** |

Six of eight are historical snapshots and, per the stated rule, **generate no candidate
issues**. They were used only for provenance, regression detection, and corroboration —
which turned out to be by far the most productive part of this round (§R2.1).

Both Class-A forks branch from `176037d0af` — the exact commit `FORK_STATUS.md` records as
"Upstream mirror observed / Reviewed through". They are therefore directly comparable to
cal.forte's own review line, with no stale-base discount.

`retrogtx/cal.com` deserves one note: its 31 "ahead" commits are 30 `Merge branch
'calcom:main' into main` merges plus a single translation-key tweak. It is an
upstream-tracking mirror, not a divergent fork — the *opposite* pole from cal.forte's
selective-review model, and further evidence that "ahead by N" alone never establishes
that a fork contains anything.

---

## R2.1 Class-B Archaeology — Headline Result

The historical-snapshot pass was supposed to be provenance housekeeping. It surfaced the
single most consequential finding of the whole intake.

### R2.1.1 A correction to Round 1

Round 1 recorded C-02 (`truncateOnWord`) as *"no fix exists upstream or in the external
fork"*. **That is wrong.** Upstream fixed it, then lost the fix. The defect is a
**regression**, the original fix commit is known, and the correct action changes from
"author a fork-owned fix" to "cherry-pick the original upstream commit with `-x`".

### R2.1.2 The bisect

`git log --follow` on `packages/lib/text.ts`, then a content bisect across refs:

| Ref | Date | `truncateOnWord` body |
| --- | --- | --- |
| `ea0c92a267` (**PR #27961**) | 2026-02-15 | `substring(0, maxLength)` — **fixed** |
| `77b2be13b2` (COG-GTM's base) | 2026-03-31 | **fixed** |
| `ab21c7f805` (**PR #28903**, `refactor: Cal.diy`) | 2026-04-15 | `substring(0, 148)` — **regressed** |
| `46eb533dbd` (cal.forte's base) | 2026-05-03 | regressed |
| `176037d0af` (reviewed through) | 2026-08-08 | regressed |
| `calcom/cal.diy@main` | today | regressed |

PR #27961 fixed **both** halves of the defect Round 1 reproduced — the ignored `maxLength`
*and* the `lastIndexOf(" ") === -1` case that reduces a whole description to `"..."`:

```diff
-  let truncatedText = text.substring(0, 148);
+  let truncatedText = text.substring(0, maxLength);
-  truncatedText = truncatedText.substring(0, Math.min(truncatedText.length, truncatedText.lastIndexOf(" ")));
+  const lastSpaceIndex = truncatedText.lastIndexOf(" ");
+  if (lastSpaceIndex !== -1) {
+    truncatedText = truncatedText.substring(0, lastSpaceIndex);
+  }
```

`ab21c7f805` reverted `text.ts` **and deleted the `fn: truncateOnWord` describe block from
`text.test.ts`** — which is precisely why nothing turned red and why the loss went unnoticed
for four months. cal.forte's `packages/lib/text.test.ts` today has no such block, confirming
it inherited the post-revert state.

This also corrects a second Round-1 statement: COG-GTM PR #31's `text.test.ts` additions do
**not** fail against their own base (their base still had the fix). They are redundant
duplicates of tests #27961 already shipped. COG-GTM's real contribution here was
inadvertent — they surfaced a symptom whose actual cause is an upstream revert.

### R2.1.3 The scope of the revert — 13 upstream commits, all still reverted in `develop`

`ab21c7f805` is a **single-parent commit of +21,362 / −411,881 lines** (the mass strip that
produced the "cal.diy" line). A revert detector was run entirely locally: for every commit
since 2026-01-01 that touched a file `#28903` modified and that still exists in `develop`,
compare the blob at `ab21c7f805` against the blob at that commit's **parent**. An exact match
where the commit itself changed the file means #28903 restored the pre-commit content.

Result: **24 file paths across 13 upstream commits.** Every one of the 24 is still in the
reverted (pre-fix) state on cal.forte's `develop` today — verified individually.

| Upstream commit | Date | Subject | Relevance to cal.forte |
| --- | --- | --- | --- |
| `ea0c92a267` | 2026-02-15 | `fix: use maxLength parameter in truncateOnWord` (#27961) | **C-15** — public page meta descriptions |
| `4c73695d3a` | 2026-02-17 | `fix: refresh slots on timezone change for booker timezone restrictions` (#27491) | **C-18** — booking correctness; **partially** reverted |
| `3a7122d613` | 2026-02-17 | `fix: revert assignmentReason breaking change in webhook payloads` (#27891) | **C-19** — webhook payload contract |
| `20dcef6680` | 2026-02-17 | `fix: validate schedule title input to block invalid characters` (#27818) | client-side form validation only |
| `21500c7047` | 2026-01-27 | `fix: remove _count children query from EventType and Workflow repositories` (#27309) | query performance |
| `38b43f75ba` | 2026-02-17 | `refactor: remove circular dependencies from CalendarView atom` (#27850) | 5 files; touches a CRITICAL fork rule |
| `2bc17313fd` | 2026-02-17 | `fix: deep link reschedule audit log to booking drawer` (#27709) | booking audit UX |
| `eef47ddefd` | 2026-02-18 | `feat: add duplicate functionality for managed event types` (#26792) | feature |
| `7abbc8c22c` | 2026-01-29 | `feat: Routing trace presenter` (#27372) | feature |
| `75d611c2e8` | 2026-01-13 | `chore: Integrate creation/rescheduling booking audit` (#26046) | DI wiring |
| `5993889616` | 2026-03-09 | `feat: make impersonatedByUserUuid required across booking audit flows` (#26546) | type contract |
| `21d28c9747` | 2026-02-16 | `refactor: apply biome formatting to packages/trpc` (#27928) | formatting |
| `217c6e6a76` | 2026-02-18 | `chore: re-pull coss-ui components` (#28032) | vendored UI |

**Honest bounds on this result.** The scan covered commits since 2026-01-01 only, and only
files that #28903 modified *and* that still exist in `develop` — so 13 is a **lower bound**.
Some reverts are certainly intentional (the strip legitimately removed EE/workflows/insights
scope, and formatting reverts are cosmetic). What the detector proves is *content
equivalence with the pre-fix state*, not intent. Each row still needs a one-line
intentional/accidental judgement — which is exactly what C-17 proposes.

### R2.1.4 What this means for the fork's process

`UPSTREAM_SYNC.md` states that being behind upstream on security fixes is *"the one drift
this fork does not tolerate"*, and the whole intake model assumes upstream moves forward.
This finding shows a third possibility the model does not currently cover: **upstream can
move backwards inside a single large commit, silently, taking the regression tests with it.**
`UPSTREAM_REVIEW_LEDGER.md` gives `ab21c7f805` no row at all — it predates cal.forte's base,
so it was never reviewed, yet cal.forte inherits every one of its reverts.

None of the 13 is a *security* fix, so no security drift is demonstrated. But the mechanism
that lost #27961 would lose a security fix identically, and nothing in the current process
would notice.

### R2.1.5 What the deep archive corroborated

`PeerRich/calendso` (2021-10-01, 15,391 commits behind) and the other snapshots confirmed
the provenance of the Round-1 `packages/lib` findings rather than adding to them:

- `truncateOnWord` was introduced by `5c01467caa` (2022-10-18, "#4252 Use vercel og to
  generate og images"), where `148` was a deliberate OG-image constant. It was **never a
  general-purpose function** — which explains the hardcode and confirms #27961 as the correct
  forward fix rather than a stylistic preference.
- `extractBaseEmail` has exactly one commit in its entire history: `3b1de34451` (2024-05-30,
  "chore: Add guest email blacklist" #15255). It was written for the blacklist path and has
  never been revised. That single-commit provenance is why the malformed-input handling was
  never revisited, and it corroborates C-03's framing as an original defect, not a regression.
- `csvUtils.ts` traces to `c850af7409` (2024-11-04, "feat: allow users to generate csv tables
  for org members" #17458). `sanitizeValue` has been touched only by pagination, link-column
  and formatting commits since — **no security review in its history**, and the org-only
  origin corroborates Round 1's finding that the export surface is organisation-gated.

No Class-B snapshot contained a fix that upstream later lost, other than via #28903.

---

## R2.2 New Candidates

---

### C-15 — `truncateOnWord` regression (supersedes C-02's disposition)

- **Source:** upstream `calcom/cal.diy` (discovered via Class-B archaeology; symptom surfaced by COG-GTM)
- **Exact source commit/PR:** fix `ea0c92a267` = **PR #27961**; regression `ab21c7f805` = **PR #28903**
- **Source provenance:** **Official upstream.** This is now an upstream intake item, not external-fork material.
- **Type:** bug
- **Priority:** P2
- **Evidence:** **E3** (reproduced locally *and* corroborated by upstream commit history)
- **Current cal.forte state:** unchanged from C-02 — `packages/lib/text.ts:7` carries the pre-#27961 body; `packages/lib/text.test.ts` is missing the regression tests #27961 added.
- **Official upstream state:** fixed 2026-02-15, reverted 2026-04-15, still reverted on `main`.
- **Independently verified problem:** see §R2.1.2 bisect and the Round-1 execution trace.
- **Risk if integrated:** Cherry-picking `ea0c92a267` also restores its test block — low risk, and it re-establishes the guard that would catch a future re-revert.
- **Maintenance impact:** Lower than a fork-owned rewrite: taking upstream's own patch means converging, not diverging, if upstream re-applies it.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate** — `git cherry-pick -x ea0c92a267`, one upstream commit, one local commit, ledger row, exactly per `UPSTREAM_SYNC.md` selective intake. **Supersedes C-02's "author a fork-owned fix" recommendation.**
- **Required validation before acceptance:** Resolve conflicts against the post-#28903 file; confirm the restored tests pass; note in the ledger that the upstream commit predates the fork base and is being taken as a *regression repair*, not a normal forward sync.
- **Suggested atomic issue title:** `fix(lib): restore upstream #27961 truncateOnWord fix reverted by the Cal.diy refactor`

---

### C-16 — Permission checks are `return true` stubs across 18 files

- **Source:** cal.forte independent audit, mandated by the Enqira review; **independently corroborated** by Enqira's own author
- **Exact source commit/PR:** the stubs originate in upstream `ab21c7f805` (#28903); Enqira's `857c362ed2` documents the same conclusion in `packages/trpc/server/procedures/teamProcedures.ts`
- **Source provenance:** upstream stripped implementation; cal.forte inherits it verbatim
- **Type:** **security-candidate** (architectural hazard; see reachability below)
- **Priority:** **P1**
- **Evidence:** **E2** (code paths traced end-to-end in this tree) + **E3** (a second, unrelated party reading the same code reached the same conclusion, in writing)
- **Current cal.forte state — verified:** **18 files** each declare a private, copy-pasted class:
  ```ts
  class PermissionCheckService {
    constructor(_prisma?: unknown) {}
    async checkPermission(..._args: unknown[]) { return true; }
    async hasPermission(..._args: unknown[]) { return true; }
    async getTeamIdsWithPermission(..._args: unknown[]): Promise<number[]> { return []; }
  }
  ```
  Files: `packages/trpc/server/procedures/pbacProcedures.ts`, `.../routers/loggedInViewer/teamsAndUserProfilesQuery.handler.ts`, `.../viewer/bookings/get.handler.ts`, `.../viewer/eventTypes/{teamAccessUseCase,util,getUserEventGroups,getActiveOnOptions.handler,heavy/create.handler}.ts`, `.../viewer/me/{get.handler,checkForInvalidAppCredentials}.ts`, `.../viewer/ooo/outOfOffice.utils.ts`, `packages/features/bookings/services/BookingAccessService.ts`, `packages/features/di/watchlist/containers/watchlist.ts`, `packages/features/eventtypes/lib/{getEventTypesByViewer,getPublicEvent}.ts`, `packages/features/watchlist/lib/service/OrganizationWatchlist{Operations,Query}Service.ts`, `packages/features/webhooks/lib/repository/WebhookRepository.ts`.

  Two concrete authorization consequences were traced:

  **(a) `BookingAccessService.doesUserIdHaveAccessToBooking`** — after the organizer and
  host checks, Cases 3–5 delegate the decision to the stub:
  - Case 3 (`booking.eventType.teamId`): `return await checkPermission(...)` → `true`
  - Case 4 (`bookingOwner.organizationId`): `if (hasAccess) return true`
  - Case 5: loops **every team the booking organizer belongs to** and returns `true` on the first stub call

  So for any booking whose organizer belongs to ≥1 team, **any authenticated user is
  granted access.** Reachable from seven authenticated entry points:
  `packages/trpc/server/routers/viewer/bookings/confirm.handler.ts:167`
  (`isUserAuthorizedToConfirmBooking` — state-changing),
  `packages/features/handleMarkNoShow.ts:281`,
  `packages/features/bookings/services/BookingDetailsService.ts:16` (data disclosure),
  `.../bookings/{reportBooking,reportWrongAssignment,hasWrongAssignmentReport}.handler.ts`,
  and `apps/api/v2/src/platform/bookings/2024-08-13/guards/booking-pbac.guard.ts:45` — a
  **NestJS guard**.

  **(b) `createTeamPbacProcedure`** takes `teamId` from **user input**
  (`z.object({ teamId: z.number() })`), calls the stub, and its `FORBIDDEN` branch is
  therefore dead code. It is mounted once, at
  `packages/trpc/server/routers/viewer/bookings/_router.tsx:136`
  (`getWrongAssignmentReports`), which then runs with an attacker-chosen `teamId` and no
  membership check anywhere in the chain.
- **Official upstream state:** `calcom/cal.diy@main` carries the same stubs. This is the
  stripped edition's design, not a cal.forte defect.
- **Independently verified problem — hazard vs exploitable, stated precisely:** Every
  stub-reaching branch is gated on team/organisation data (`eventType.teamId`,
  `bookingOwner.organizationId`, `bookingOwner.teams`). In a stock cal.forte deployment
  **no team can be created**: there is no `packages/trpc/server/routers/viewer/teams` router,
  `apps/api/v2` has team *repositories and services but no controllers* (no HTTP route), there
  is no UI, and `scripts/start.sh` runs only `prisma migrate deploy` and
  `seed-app-store.ts` — **not** `scripts/seed.ts`, which is the only shipped code that calls
  `prisma.team.create`. **Conclusion: an architectural hazard today, not a confirmed
  exploitable vulnerability.** It becomes a confirmed critical authorization bypass the moment
  any team row exists — via a team-management restoration (C-20), a manual `yarn db-seed`, a
  direct database insert, or a future upstream re-add. That is why it is P1 and not P0, and
  why it must not be filed as an active exploit.
- **Potential user value:** A permission check that is a permission check.
- **Security relevance:** Maximal in class (broken access control, CWE-863) with a currently
  unreachable trigger. The API v2 `booking-pbac.guard` is the most alarming instance: a file
  named "guard" that cannot deny.
- **Risk if ignored:** Any future change that introduces team rows silently converts this into
  a critical vulnerability, with **no test, no type error and no CI signal** — the stubs
  type-check perfectly and `packages/features`/`packages/trpc` are outside `type-check:ci`.
- **Risk if integrated (fixing it):** Three options with very different costs. (1) **Fail
  closed** — change the stubs to `return false`: safest, but silently disables any code path
  that legitimately relies on team/org admin access, and needs each of the 18 sites checked.
  (2) **Throw** — makes reachability loud and testable, but turns a dormant path into a
  runtime error. (3) **Implement real PBAC** — largest, and is really C-20's problem. Option 1
  or 2 with a fork guard is the proportionate move; all three are far larger than the diff-size
  guidance and must be staged per file.
- **Maintenance impact:** 18 copy-pasted declarations mean any change is 18 edits. A single
  shared, explicitly-named module (e.g. `DeniedPermissionCheckService`) plus a
  `scripts/fork-guard-*.sh` in the style of the telemetry guard would both fix and lock it.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate — highest priority in this intake.** File the audit
  and the decision together; do **not** file it as an exploit report.
- **Required validation before acceptance:** Confirm every one of the 18 sites' reachability
  before changing default semantics; prove team rows cannot be created by any shipped route
  (re-verify after every upstream sync); add a regression test asserting
  `doesUserIdHaveAccessToBooking` returns `false` for an unrelated user on a team booking; add
  a fork guard that fails CI if a `return true` permission stub reappears.
- **Suggested atomic issue title:** `security(pbac): permission checks are unconditional "return true" stubs in 18 files`

---

### C-17 — Audit upstream `#28903` for other silently reverted fixes

- **Source:** cal.forte independent audit (§R2.1.3)
- **Exact source commit/PR:** `ab21c7f805` = PR #28903
- **Type:** maintenance
- **Priority:** P2
- **Evidence:** E2 (13 commits / 24 paths detected and individually confirmed still-reverted in `develop`)
- **Current cal.forte state:** All 24 detected paths carry pre-fix content. `ab21c7f805` has no row in `UPSTREAM_REVIEW_LEDGER.md`.
- **Official upstream state:** upstream has not restored any of them.
- **Independently verified problem:** Yes — see the table in §R2.1.3.
- **Potential user value:** Recovers correctness work upstream already did and paid for.
- **Security relevance:** None of the 13 is a security fix. The **mechanism** is the security concern: a mass commit can revert a merged fix and delete its tests together, and neither upstream CI nor cal.forte's ledger noticed for four months.
- **Risk if ignored:** More such reverts almost certainly exist outside the scanned window; a future one could be a security fix.
- **Risk if integrated:** Some reverts were intentional scope removal. Blind restoration would re-add stripped features. Each row needs an intentional/accidental verdict before any action.
- **Maintenance impact:** One-off audit; the useful durable output is a documented method plus a ledger row for `ab21c7f805`.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate**, scoped as an audit that produces dispositions, not patches. Extend the scan window past 2026-01-01 and include files deleted-then-recreated.
- **Required validation before acceptance:** For each of the 13, decide intentional-vs-accidental with a one-line reason; give `ab21c7f805` a ledger row; record the detection method in `UPSTREAM_SYNC.md` so future large upstream commits get the same treatment.
- **Suggested atomic issue title:** `[audit] identify upstream fixes silently reverted by the Cal.diy refactor (#28903)`

---

### C-18 — Booker timezone-refresh fix is *partially* reverted (inconsistent state)

- **Source:** cal.forte independent audit
- **Exact source commit/PR:** `4c73695d3a` = **PR #27491**, partially reverted by `ab21c7f805`
- **Type:** bug
- **Priority:** P2
- **Evidence:** E2 (per-file state verified in `develop`)
- **Current cal.forte state:** The fix survives in some files and not others — the worst outcome:
  | File | State in `develop` |
  | --- | --- |
  | `packages/features/bookings/Booker/hooks/useStableTimezone.ts` | **present with fix** |
  | `packages/platform/atoms/booker/BookerPlatformWrapper.tsx` | **present with fix** |
  | `packages/features/bookings/Booker/hooks/useStableTimezone.test.ts` | **absent** |
  | `apps/web/modules/bookings/components/BookerWebWrapper.tsx` | **no fix** |
  | `packages/features/eventtypes/lib/getPublicEvent.ts` | **no fix** |
  | `apps/web/modules/schedules/hooks/useEvent.ts`, `packages/features/bookings/types.ts`, `packages/trpc/server/routers/publicViewer/event.handler.ts` | **reverted** |
- **Official upstream state:** same partial state upstream.
- **Independently verified problem:** The `useStableTimezone` hook exists but the **web** booker wrapper does not use it, and `getPublicEvent` does not return `restrictionScheduleId` / `useBookerTimezone`. So the platform atoms path is fixed while the path cal.forte actually ships is not — slots are not refreshed when the booker changes timezone under a restriction schedule.
- **Potential user value:** Correct slots for the fork's primary product surface. Timezone correctness is the core promise of a scheduler.
- **Security relevance:** None.
- **Risk if ignored:** Wrong availability shown to bookers in a specific, reproducible configuration; dead code (`useStableTimezone`) left in the tree implying a fix that is not wired up.
- **Risk if integrated:** 9 files, includes a public tRPC handler and a shared type — larger than the other lib fixes and needs its own review. Restoring `getPublicEvent` fields changes a public payload shape (additive, so compatible with `api-no-breaking-changes`).
- **Maintenance impact:** Moderate; touches `apps/web`, `packages/features` and `packages/trpc` together.
- **Suggested target:** cal.forte
- **Recommended disposition:** **candidate**, sequenced after C-17 confirms the revert was accidental rather than deliberate scope removal.
- **Required validation before acceptance:** Confirm restriction schedules with `useBookerTimezone` are reachable in this edition; restore `useStableTimezone.test.ts`; local Playwright pass on the booker timezone flow per `testing-playwright`.
- **Suggested atomic issue title:** `fix(booker): finish the partially reverted timezone slot-refresh fix (#27491)`

---

### C-19 — Webhook payloads carry the `assignmentReason` breaking change upstream rolled back

- **Source:** cal.forte independent audit
- **Exact source commit/PR:** `3a7122d613` = **PR #27891**, reverted by `ab21c7f805`
- **Type:** bug (API contract)
- **Priority:** P3
- **Evidence:** E2
- **Current cal.forte state:** `packages/features/bookings/lib/getWebhookPayloadForBooking.ts` carries the pre-#27891 body, which spreads `...evt` directly. Upstream's fix was to strip the field first:
  ```diff
  +  const { assignmentReason: _emailAssignmentReason, ...evtWithoutAssignmentReason } = evt;
     const payload: EventPayloadType = {
  -    ...evt,
  +    ...evtWithoutAssignmentReason,
  ```
  `assignmentReason` is a real optional field on `CalendarEvent` (`packages/types/Calendar.d.ts:229`), populated at `packages/features/bookings/lib/service/RegularBookingService.ts:2252` as `{ reasonEnum, reasonString }`. So cal.forte emits routing/assignment rationale to every webhook consumer.
- **Official upstream state:** upstream deliberately removed it, then #28903 put it back. Upstream is currently shipping the change it had rolled back.
- **Independently verified problem:** Yes. Two angles: an unintended payload-shape change on a public integration contract (`api-no-breaking-changes` is a CRITICAL rule in this repo), and a minor disclosure of internal assignment rationale to webhook endpoints.
- **Potential user value:** A stable webhook contract.
- **Security relevance:** Low. `reasonString` is assignment rationale, not credentials — do not describe this as a data leak without checking what a given deployment's routing forms put in it.
- **Risk if ignored:** Integrations built against the current payload would break later if upstream re-applies #27891 — cal.forte would then inherit the removal as a surprise.
- **Risk if integrated:** Removing a field **is itself** a breaking change for anyone already consuming it. Since cal.forte has published five releases with the field present, this needs a deliberate decision, not a silent revert.
- **Maintenance impact:** Two files.
- **Suggested target:** cal.forte
- **Recommended disposition:** **deferred** — record the divergence, decide alongside C-17. Do not change a published payload shape as a drive-by.
- **Required validation before acceptance:** Determine whether any cal.forte deployment consumes the field; if removing, treat it as a documented breaking change with release notes.
- **Suggested atomic issue title:** `[decision] webhook payloads include assignmentReason after the #28903 revert of #27891`

---

### C-20 — Team management as an architecture/product track (Enqira)

- **Source:** `Enqira/cal.diy` — **Class A**
- **Exact source commit/PR:** [`857c362ed2`](https://github.com/Enqira/cal.diy/commit/857c362ed2) `feat(teams): add multi-tenant team management` (59 files, +3636/−21), merged as `d14faffdce` (PR #1). Base `176037d0af`.
- **Source provenance:** Author-original, written against the stripped cal.diy line — the same line cal.forte is on. No upstream ancestry; **not** a restoration of deleted upstream code (verified: all 59 team files are `add`, and none matches a historical `packages/features/ee/**` path).
- **Type:** feature (architecture track)
- **Priority:** P2 as a *decision*; **not** an intake
- **Evidence:** E2 for the audit findings below (all read directly from their tree and cross-checked against ours)
- **Current cal.forte state:** No teams router, no team UI, no `/team/[slug]` route, no API v2 team controllers. `.ai/state.md` records "no team creation (no UI/wizard/CLI/API) → no team calendars / round-robin" as an intentional edition property.
- **Official upstream state:** upstream `calcom/cal.diy` also has no team management on this line — #28903 stripped it.
- **Claimed problem (their `TEAM-CUSTOMIZATIONS.md`, treated as claims, not evidence):** the stripped line cannot serve multi-tenant appointment businesses; teams should be restored as one-team-per-tenant.

**Mandated audit — results**

*Authorization model.* Their `packages/trpc/server/procedures/teamProcedures.ts` deliberately
does **not** use `createTeamPbacProcedure`, and says so in a comment: *"the
`PermissionCheckService` that backs it is a stub whose `checkPermission` always resolves
`true`, so every one of those procedures is currently a no-op."* This is **independent
corroboration of C-16 by a second party reading the same code**, and it is the single most
useful thing this fork provides. Their replacement reads `Membership` directly with
`accepted: true` and three tiers (`teamMemberProcedure` / `teamAdminProcedure` /
`teamOwnerProcedure`).

*Invariants verified — PASS:*

| Invariant | Result |
| --- | --- |
| ADMIN cannot **promote** to OWNER | **PASS** — `changeMemberRole.handler.ts` requires acting OWNER when `input.role === OWNER` **or** target is OWNER |
| Only OWNER modifies existing owners | **PASS** — same guard, mirrored in `removeMember.handler.ts` |
| Last-owner protection | **PASS** — enforced in `changeMemberRole`, `removeMember`, **and** the leave branch of `acceptOrLeave` (`ownerCount <= 1`, counting only `accepted: true`) |
| Cannot remove self via admin path | **PASS** — explicit `BAD_REQUEST`, directs to leave instead |
| Invite acceptance authorization | **PASS** — `acceptOrLeave` correctly sits on `authedProcedure` (an invitee is not yet an accepted member) and authorizes on "the membership row is mine"; accept is idempotent |
| Invite token strength / expiry | **PASS** — `randomBytes(32).toString("hex")`, `INVITE_EXPIRY_DAYS = 7`, duplicate-invite guard filters `expires: { gt: new Date() }` |
| Destructive ops gated | **PASS** — `delete` on `teamOwnerProcedure`, `update`/`inviteMember`/`revokeInvite`/`removeMember`/`changeMemberRole` on `teamAdminProcedure`, `get`/`listMembers` on `teamMemberProcedure` |
| Team/user slug namespace collision | **PASS (logic)** — `create.handler.ts` runs `slugify` then **both** `isSlugTaken` and `isUsernameTaken`, with a comment explaining that `@@unique([slug, parentId])` does not bind when `parentId` is null |
| Public `/team/[slug]` exposure | **PASS** — `select` (not `include`), scoped `parentId: null, isOrganization: false`, `eventTypes` filtered to `hidden: false`, `isPrivate` → `notFound`, bio/description through `markdownToSafeHTML`. **No member list, no emails.** Private and non-existent teams both return `notFound`, so there is no enumeration oracle |

*Invariants verified — FAIL / GAPS (independent findings, not in their design doc):*

1. **ADMIN can invite a new OWNER — privilege escalation.** `inviteMember` is mounted on
   `teamAdminProcedure`, and `ZInviteMemberInputSchema` accepts
   `role: z.nativeEnum(MembershipRole).default(MEMBER)` with **no restriction**.
   `inviteMemberHandler` passes it straight to `TeamInviteService.inviteOne`, which creates
   `Membership { role, accepted: false }`. An ADMIN therefore manufactures an OWNER through
   the invite path — the exact escalation `changeMemberRole` correctly forbids. This directly
   fails the mandated invariant *"ADMIN cannot create/invite/promote another OWNER."*
2. **Slug uniqueness is a TOCTOU race.** The handler *documents* that the DB constraint does
   not bind for `parentId: null`, then implements check-then-create in application code. Two
   concurrent `create` calls with the same slug both pass and both insert, producing duplicate
   public team slugs. The correct fix is a **partial unique index**
   (`CREATE UNIQUE INDEX ... ON "Team"(slug) WHERE "parentId" IS NULL`) — a migration, which is
   "Ask first" scope under `CLAUDE.md`.
3. **Asymmetric email normalization.** Invites lowercase the address
   (`email.trim().toLowerCase()`) but the account lookup is
   `prisma.user.findFirst({ where: { email } })` — an exact match. Where a user row holds a
   mixed-case address, an invite silently issues a *signup* token for an address that already
   has an account. That this happens is corroborated by the fork's own
   `scripts/find-email-case-insensitive-duplicates.sql`.
4. **Unbounded tenant creation.** `create` is on plain `authedProcedure`: any authenticated user
   can create unlimited teams, each consuming a slug in the **shared user/team public
   namespace**. That is a squatting and resource-exhaustion surface for a self-host.
5. **Not verified — invite-token replay.** Their comment says the pre-existing signup handler
   burns the token via `createOrUpdateMemberships`. That is upstream code and plausible, but I
   did not trace it end-to-end. It must be verified, not assumed, before any adoption.

*Licence and provenance — the decisive constraint.* `packages/features/ee/` held **394 files**
at `ab21c7f805^` and **0** afterwards, and it carried its own
`packages/features/ee/LICENSE`: **"The Cal.com Commercial License"**, which permits production
use only with a valid Cal.com Enterprise subscription and asserts that Cal.com retains all
right, title and interest in modifications. **That history is fully present in cal.forte's
clone** — `git show ab21c7f805^:packages/features/ee/...` resolves today. Restoring team,
billing or PBAC code from history would therefore place commercially-licensed code into an
MIT-published fork **and into a public GHCR image**. Enqira's own code is clean of this
(all files are new), but any cal.forte implementation must be written from scratch, and this
constraint deserves a written rule.

- **Potential user value:** Real, if cal.forte ever needs multi-tenant scheduling. Zero otherwise.
- **Security relevance:** **Inverted from the obvious reading.** The danger is not in their
  code, which is careful. It is that **adding teams to this line activates C-16**: team rows
  populate `bookingOwner.teams`, which turns `BookingAccessService` Case 5 into a live
  authorization bypass on booking confirm, booking details, mark-no-show and the API v2 guard.
  Enqira guarded their own routes and left the pre-existing ones untouched. **C-16 is a hard
  prerequisite for any team work.**
- **Risk if ignored:** None. The edition stays as documented.
- **Risk if integrated:** Very high. ~3,600 lines across 59 files, a new tRPC router surface, a
  new public route, a schema-level uniqueness problem, and permanent divergence from a
  deliberately stripped upstream — every future upstream sync would contest it. It is 7× the
  fork's stated diff-size guidance in a single change.
- **Maintenance impact:** The largest of anything in this intake.
- **Suggested target:** cal.forte **only if** a product decision requires multi-tenant teams; otherwise neither
- **Recommended disposition:** **deferred** as a product/architecture decision. **Do not
  cherry-pick.** If ever pursued: (1) fix C-16 first, (2) implement independently, (3) take
  the *ideas* with the least long-term divergence — the direct-`Membership` procedure tiers,
  the last-owner invariants, the `isSlugTaken` + `isUsernameTaken` namespace check, and the
  `select`-only public page — while adding the OWNER-invite restriction and the partial unique
  index they lack.
- **Required validation before acceptance:** All of the above, plus end-to-end invite-token
  burn/replay tests, an email-normalization decision, tenant-creation rate limiting, and a
  written rule barring restoration of historical EE code.
- **Suggested atomic issue title:** `[decision] does cal.forte need multi-tenant team management, and at what cost`

---

### C-21 — Fly.io deployment additions (erikmayergit)

- **Source:** `erikmayergit/cal.diy` — **Class A** (but purely deployment)
- **Exact source commit/PR:** [`fbf98dac41`](https://github.com/erikmayergit/cal.diy/commit/fbf98dac41) `fly.toml`, [`3f60eadbe0`](https://github.com/erikmayergit/cal.diy/commit/3f60eadbe0) + [`882be6261b`](https://github.com/erikmayergit/cal.diy/commit/882be6261b) `.github/workflows/fly-deploy.yml`
- **Source provenance:** Author-original deployment configuration for one app (`9d-book`).
- **Type:** deployment
- **Priority:** —
- **Evidence:** E1
- **Current cal.forte state:** Publication is governed by `RELEASE_PROCESS.md`,
  `IMAGE_BUILD.md` and `CALDIY_RELEASE_CONTRACT.md`: annotated `vX.Y.Z-N` tag on `release`,
  build once, runtime-test the exact image, Trivy scan, CycloneDX SBOM, provenance
  attestation, refuse-overwrite, capture per-architecture digests, finalize both
  architectures. Manual dispatch is validation-only and cannot publish.
- **Independently verified problem:** Their approach conflicts with that contract on every axis the brief named:
  | Their content | cal.forte rule it breaks |
  | --- | --- |
  | `superfly/flyctl-actions/setup-flyctl@**master**` | Immutable Action inputs (`32aac7c9fa`) — mutable ref |
  | `actions/checkout@v4` | Same — cal.forte pins `actions/checkout@d23441a48e…` by SHA |
  | `flyctl deploy --local-only` | **Bypasses reviewed image/digest promotion entirely** — no tag, no scan, no SBOM, no provenance, no digest |
  | `app = "9d-book"`, `https://book.9dcreatornetwork.com`, `primary_region = "ams"` | Hard-coded customer values in core |
  | `CALCOM_TELEMETRY_DISABLED = "1"` build arg | The flag cal.forte **removed**; adopting this file would trip the blocking `scripts/fork-guard-telemetry.sh` step in `forte-ci` |
  | `DATABASE_URL` as a build arg | `SECURITY_REVIEW.md` → "inspect build-related changes for secret-bearing build args" |
  | `shared-cpu-2x` / 2048 MB | Below the documented minimum in `.ai/roadmap.md` (2 vCPU / 4 GB) |
- **Security relevance:** Adopting any of it would weaken the fork's supply-chain posture.
- **Recommended disposition:** **not-applicable** (deployment-specific) / **rejected** (the workflow patterns). **No issue.**
- **Two corroborating observations worth keeping, as reference only — not issues:**
  their health check uses `grace_period = "600s"` with the note *"first boot runs database
  migrations + app-store seed, give it time"*, which independently corroborates cal.forte's
  `scripts/start.sh` boot sequence and is a useful input for downstream health-check tuning in
  `secure-docker-blueprint`; and their commit `882be6261b` records the remote builder dying at
  `yarn install` with **exit 137 (OOM)**, corroborating `.ai/roadmap.md`'s "build needs ~6 GB
  heap" figure.
- **Suggested atomic issue title:** *(none — should not become an issue)*

---

## R2.3 Updated Ranked Candidate Table (both rounds)

| Rank | ID | Candidate | Source | Type | Prio | Ev. | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | **C-16** | Permission checks are `return true` stubs in 18 files | fork audit (Enqira-corroborated) | security-candidate | **P1** | **E2+E3** | candidate |
| 2 | C-06 | Slot event types resolved by slug alone on a public unauth endpoint | Mitch515 `ab5d8542d3` | bug + security-candidate | **P1** | E2 | candidate |
| 3 | **C-15** | `truncateOnWord` regression — cherry-pick upstream #27961 | upstream `ea0c92a267` | bug | P2 | **E3** | candidate *(supersedes C-02)* |
| 4 | **C-17** | Audit #28903 for other silently reverted fixes (13 found) | fork audit | maintenance | P2 | E2 | candidate |
| 5 | C-13 | Dead Outlook login flag with a live `azure-ad` endpoint | fork audit / Mitch515 | maintenance | P2 | E2 | candidate |
| 6 | **C-18** | Booker timezone slot-refresh fix partially reverted | fork audit | bug | P2 | E2 | candidate |
| 7 | C-07 | Throttled Meet-link PATCH fails an already-created Google event | Mitch515 `36a40b4cb4` | reliability | P2 | E1/E2 | candidate |
| 8 | C-03 | `extractBaseEmail` fabricates addresses from malformed input | COG-GTM #31 | bug | P2 | E2 | candidate |
| 9 | C-01 | CSV export does not neutralise spreadsheet formulas | COG-GTM #31 | security-candidate | P2 | E2 | candidate |
| 10 | C-08 | Entra login accepts every Microsoft tenant | Mitch515 `c46a03d8e9` | security-candidate | P2 | E1/E3 | candidate (after C-13) |
| 11 | **C-20** | Multi-tenant team management | Enqira `857c362ed2` | feature/architecture | P2 | E2 | **deferred** (decision; blocked by C-16) |
| 12 | C-14 | Branding args not passed at build; stale `.ai/branding.md` | fork audit | branding | P3 | E2 | candidate |
| 13 | C-09 | Upstream drift **reporting** (never enforcement) | Biji-Biji `9de5776dfb` | maintenance | P3 | E1 | candidate |
| 14 | C-04 | `getProviderName` throws on bare `integrations:` | COG-GTM #31 | bug | P3 | E2 | candidate (fold into C-03) |
| 15 | **C-19** | Webhook payloads carry the reverted `assignmentReason` change | fork audit | bug (API contract) | P3 | E2 | deferred |
| 16 | C-10 | Env-template-vs-code drift check | Biji-Biji `5f485c815c` | maintenance | P3 | E1 | deferred |
| 17 | C-05 | HitPay `message` listener has no origin check | fork finding | security-candidate | P3 | E1 | deferred |
| — | C-02 | *(superseded by C-15 — same defect, correct provenance)* | — | — | — | — | — |
| — | C-11 | API v2 build stage runs as root | COG-GTM #1 | deployment | P3 | E1 | already-covered / rejected |
| — | C-12 | LIA / Mereka deployment-specific changes | Mitch515, Biji-Biji | deployment | — | E1 | not-applicable |
| — | **C-21** | Fly.io deployment additions | erikmayergit | deployment | — | E1 | not-applicable / rejected |

**Still no P0.** C-16 is the most serious finding in the intake and is capped at P1 precisely
because team creation is unreachable in a stock deployment — an exploit was **not**
demonstrated, and it must not be reported as one.

---

## R2.4 Updated Issue Hierarchy

Still gated on **enabling Issues** (`gh issue list` reports them disabled) and creating the
label set. **17 issues + 1 tracker.**

**Epic 0 — Authorization integrity** *(new, ahead of everything else)*
1. `security(pbac): permission checks are unconditional "return true" stubs in 18 files` — **C-16, P1**

**Epic 1 — Correctness and hardening intake**

2. `fix(slots): resolve event types by owner and stop falling back to slug-only lookup` — C-06, **P1**
3. `fix(lib): restore upstream #27961 truncateOnWord fix reverted by the Cal.diy refactor` — **C-15**
4. `fix(lib): stop extractBaseEmail fabricating addresses from malformed input` — C-03 *(absorbs C-04)*
5. `fix(lib): neutralise spreadsheet formula prefixes in CSV export sanitisation` — C-01
6. `fix(googlecalendar): keep a created event when the Meet-link enrichment PATCH is throttled` — C-07
7. `fix(booker): finish the partially reverted timezone slot-refresh fix (#27491)` — **C-18**

**Epic 2 — Upstream regression governance** *(new)*

8. `[audit] identify upstream fixes silently reverted by the Cal.diy refactor (#28903)` — **C-17**
9. `[decision] webhook payloads include assignmentReason after the #28903 revert of #27891` — **C-19**, deferred

**Epic 3 — Auth surface decision**

10. `chore(auth): decide whether OUTLOOK_LOGIN_ENABLED is wired through or removed as dead surface` — C-13
11. `feat(auth): allow restricting Microsoft sign-in to a configured Entra tenant` — C-08 *(blocked by item 10 above)*

**Epic 4 — Track A: branding and productization**

12. `fix(release): pass the fork company name and support address as image build args` — C-14(a)
13. `docs(ai): correct the stale branding build-arg and Cal.com-literal claims` — C-14(b)
14. `[audit] residual upstream branding assets and constants defaults` — C-14(c)

**Epic 5 — Track B: unused / upstream surface reduction**

15. `[audit] inventory dead upstream surface reachable in the shipped image` — C-13 parent

**Epic 6 — Product/architecture decision** *(new)*

16. `[decision] does cal.forte need multi-tenant team management, and at what cost` — **C-20**, deferred, **blocked by item 1 above**

**Epic 7 — Fork process automation**

17. `ci(forte): report pending upstream commits without enforcing upstream ancestry` — C-09
18. `ci(forte): report drift between the shipped env template and the env vars the code reads` — C-10, deferred

**Deferred, filed but not scheduled**

19. `security(app-store): validate message origin in the HitPay drop-in payment channel` — C-05

---

## R2.5 Additional Proposed Labels

Add to the Round-1 set:

- `src:upstream-regression` — a defect upstream fixed and then lost; the fix commit is the intake source
- `blocked-by:C-16` (or a `blocked` label plus a tracker reference) — for C-20 and any future team work
- `class:historical-snapshot` — for provenance notes derived from Class-B sources, so they are never mistaken for candidates
- `needs:reachability` — a finding whose severity depends on a reachability question still open (C-16, C-04)

---

## R2.6 Additions to "Should NOT Become Issues"

| Item | Source | Why not |
| --- | --- | --- |
| Any candidate from `Drakkarrr`, `millionco`, `skdas20`, `PeerRich`, `Singhshashi18`, `retrogtx` | Class B | Zero fork-specific code between them (one README edit and one locale tweak). They contributed provenance and regression evidence only, exactly as scoped. |
| `PeerRich/calendso` "historical fixes" | Class B, 15,391 commits behind | Its content is upstream history cal.forte already contains. Nothing there is a fix upstream later lost; the only such loss found is #28903, which post-dates it by five years. |
| `retrogtx` locale tweak `755a5c0e66` | Class B | Removes one duplicate translation key to re-trigger a translation bot. No behaviour. |
| Fly.io workflow / `fly.toml` | erikmayergit | Mutable `@master` and `@v4` action refs, `flyctl deploy --local-only` bypassing reviewed image promotion, hard-coded `9d-book` / `book.9dcreatornetwork.com`, and a `CALCOM_TELEMETRY_DISABLED` build arg that would trip the fork's own blocking telemetry guard. **rejected / not-applicable.** |
| Enqira team implementation, as a cherry-pick | Enqira | ~3,600 lines across 59 files; would activate C-16; carries an ADMIN→OWNER invite escalation and a slug TOCTOU race. Evaluated as an architecture decision (C-20), never as an intake. |
| Restoring `packages/features/ee/**` from git history | history is reachable in this clone | That tree carried **the Cal.com Commercial License** (394 files at `ab21c7f805^`), which requires an Enterprise subscription for production use. Reintroducing it into an MIT fork that publishes a public image would be a licence violation. **Prohibited, not merely rejected.** |
| Reverted upstream **feature** commits from #28903 (`eef47ddefd`, `7abbc8c22c`, `75d611c2e8`, `5993889616`) | upstream | Feature/DI work whose removal is consistent with the deliberate strip. Record dispositions under C-17; do not restore. |
| Reverted formatting / vendored-UI commits (`21d28c9747`, `217c6e6a76`) | upstream | Biome formatting and a coss-ui re-pull. No behaviour. Ledger rows only. |
| `20dcef6680` schedule-title validation, as a *security* item | upstream | It is a client-side `react-hook-form` `pattern` rule with no server-side counterpart — trivially bypassable and therefore **not** a security control. Optional UX restoration under C-17 at most. |

---

## R2.7 Additional Overlaps With The Existing Ledger

| Overlap | Detail |
| --- | --- |
| **`ab21c7f805` has no ledger row and needs one.** | It predates cal.forte's base `46eb533dbd`, so `UPSTREAM_REVIEW_LEDGER.md` never considered it — yet it is the direct cause of C-15, C-17, C-18 and C-19. The ledger's range (`46eb533dbd..176037d0af`) is defined to start *after* it. Decide whether pre-base upstream commits can receive rows, or add a separate "inherited upstream state" section. |
| **C-15 is an upstream intake, not external-fork material.** | It is the only candidate in this report eligible for `git cherry-pick -x` with genuine provenance, and it therefore belongs in `UPSTREAM_REVIEW_LEDGER.md` under the normal rules — unlike everything else here. |
| **C-16 interacts with a documented gate limitation.** | The 18 stubs type-check perfectly, and `packages/features` / `packages/trpc` do not define `type-check` (`.ai/quality-gates.md`). Neither the type gate nor Biome nor CodeQL flags `return true` in a function named `checkPermission`. This is the strongest concrete argument yet for the type-check-coverage item in `.ai/roadmap.md`. |
| **C-16 suggests a second fork guard.** | `scripts/fork-guard-telemetry.sh` exists because an upstream sync can silently reintroduce removed code. A permission-stub guard is the same pattern applied to the inverse risk: code that must not silently *remain*. |
| **C-20 collides with a documented edition property.** | `.ai/state.md` lists "team creation" under **Not in this edition**, and `.ai/branding.md` notes that team/org-level branding (`hideBranding`, `brandColor`, `logoUrl`) is unreachable without teams. Adopting C-20 would change the edition definition and require updates to `FORK_DIVERGENCE.md`, `.ai/state.md` and `.ai/branding.md` together. |
| **§R2.1.4 implies a process change.** | `UPSTREAM_SYNC.md` → *Security Fix Priority* scans for security-relevant commits going forward. It has no provision for a large upstream commit that reverts previously-merged work. C-17 should leave behind a documented check for exactly that. |

---

## R2.8 Revised Master Tracker Body

```markdown
# [tracker] External fork intake — 11 repositories, two rounds

Analysis-only. No repository or GitHub state was changed in either round.
Full report: `docs/EXTERNAL_FORK_INTAKE_EVIDENCE.md`.

## Sources

**Active divergent forks (5)** — `COG-GTM/cal.com`, `Mitch515/cal.diy`,
`Biji-Biji-Initiative/cal.com`, `Enqira/cal.diy`, `erikmayergit/cal.diy`.

**Historical snapshots (6)** — `Drakkarrr`, `millionco`, `Singhshashi18`, `PeerRich/calendso`
(2021-10-01, 15,391 commits behind), `retrogtx`, `skdas20`. Between them they hold one README
edit and one locale tweak. Per scope they generated **no candidates**; they were used for
provenance, regression detection and corroboration — and that is where the biggest finding
came from.

## The two findings that matter

**1. Permission checks are `return true` stubs (C-16, P1).**
18 files each declare a private `PermissionCheckService` whose `checkPermission` and
`hasPermission` unconditionally return `true`. `BookingAccessService.doesUserIdHaveAccessToBooking`
delegates Cases 3–5 to it and is reachable from seven authenticated entry points, including
`confirm.handler` (state-changing), `BookingDetailsService` (disclosure) and the API v2
`booking-pbac.guard`. `createTeamPbacProcedure` takes `teamId` from user input and its
FORBIDDEN branch is dead code.

**This is an architectural hazard, not a confirmed exploit.** Every stub-reaching branch is
gated on team/org data, and a stock deployment cannot create a team: no teams tRPC router, no
API v2 team controllers, no UI, and boot runs only `prisma migrate deploy` +
`seed-app-store.ts`. It becomes a critical authorization bypass the moment any team row
exists. Independently corroborated: `Enqira/cal.diy` reached the same conclusion and refused
to build on those procedures, in writing.

**2. Upstream reverted 13 of its own merged commits in one refactor (C-15, C-17).**
`ab21c7f805` ("refactor: Cal.diy", #28903, +21,362/−411,881) silently reverted **13 upstream
commits across 24 files** — including PR #27961's `truncateOnWord` fix, **together with its
regression tests**, which is why nothing turned red. cal.forte's base is downstream of it, so
**all 24 paths are still in the pre-fix state on `develop` today** (verified individually).
None of the 13 is a security fix, but the mechanism would lose one identically, and
`ab21c7f805` has no ledger row because it predates the fork base.

**Correction to Round 1:** `truncateOnWord` was reported as having no upstream fix. It has
one — `ea0c92a267` (#27961). The action changes from a fork-owned rewrite to a
`git cherry-pick -x` with real provenance.

## Outcome

**17 issues + this tracker. Still no P0** — nothing here is a confirmed severe or actively
exploitable issue, and C-16 is deliberately capped at P1.

| Prio | Items |
| --- | --- |
| P1 (2) | PBAC `return true` stubs · slug-only event-type resolution on a public endpoint |
| P2 (8) | truncateOnWord regression · #28903 revert audit · dead Outlook flag · timezone slot-refresh partial revert · Google PATCH throttling · extractBaseEmail · CSV formula injection · Entra tenant restriction |
| P3 (5) | branding build args · stale branding doc · branding asset audit · upstream drift reporting · getProviderName |
| deferred (4) | team management decision · assignmentReason webhook decision · env-template drift · HitPay message origin |

## Two hard prerequisites

- **Enable Issues on this repository** (currently disabled) and create the label set.
- **C-16 blocks any team work.** Adding teams before fixing the stubs converts a dormant
  hazard into a live authorization bypass on booking confirm, booking details and mark-no-show.

## Prohibited, not merely rejected

`packages/features/ee/` held 394 files under **the Cal.com Commercial License** before
#28903 deleted it, and that history is fully reachable in this clone. Team, billing or PBAC
code must **never** be restored from git history into this MIT-published fork or its public
image. Any implementation is written from scratch.

## A note on trusting other forks

Across 11 repositories: one fork shipped hardcoded auth backdoors it later removed, one
hardcodes a third party's Entra tenant GUID, one weakens an email-verification guard, one
deploys via a mutable `@master` action bypassing reviewed image promotion — and of the three
COG-GTM "fixes" that were testable, one did not reproduce, one targeted a file this fork does
not have, and one shipped tests without the fix. The most valuable external contribution was
not a patch at all: it was Enqira's written observation that the PBAC procedures are no-ops,
which independently confirmed a finding this repository can now act on.
```

---

## R2.9 Bottom Line (both rounds)

Round 1's most valuable item was C-06. Round 2 produced two findings that outrank most of it:

**C-16** — 18 copy-pasted `checkPermission() { return true; }` stubs, one of them backing a
file called `booking-pbac.guard.ts`. It is not currently exploitable, and saying otherwise
would be wrong: a stock cal.forte deployment has no way to create the team rows every
vulnerable branch requires. But it is a loaded weapon with the safety on, it is invisible to
every gate this fork runs, and **any** future team work releases it.

**C-15/C-17** — upstream fixed a bug, then reverted the fix and deleted its tests inside a
433,000-line refactor, and cal.forte inherited that silently along with 12 other reverts. The
fork's intake model assumes upstream moves forward. It does not always.

Both came from work that looked like housekeeping: auditing our own stubs because an external
fork mentioned them, and running provenance archaeology on six repositories that contained no
code of their own. The eight repositories added in Round 2 produced exactly **two** genuine
candidates between them, and six of them produced none by design — which is the intended
outcome of a conservative intake, not a shortfall of it.

---
---

# Runtime validation findings

**Added:** 2026-08-25, third pass of the same analysis-only review. Evidence source: a live
self-hosted cal.forte deployment exercised manually through the UI. **Nothing was fixed.**
Working tree verified clean, HEAD `41689d1d6e`, no GitHub writes.

Every runtime symptom below was correlated against the current `develop` tree by reading the
actual files, and — where the mechanism was in question — by tracing the full call path from
the client through to the handler. Two symptoms turned out to have root causes different from
the obvious reading, and one is definitively **not** an application defect.

## RV.0 Summary Table

| Runtime symptom | Root cause | Confidence | Layer | Severity |
|-----------------|------------|------------|-------|----------|
| `POST /api/trpc/apiKeys/create?batch=1` → **404**, client reports `Unexpected token '<', "<!DOCTYPE "…` | `apps/web/pages/api/trpc/apiKeys/[trpc].ts` deleted by upstream `ab21c7f805` (#28903) while the router, the client `ENDPOINTS` entry and the whole API-keys UI were kept. Next.js serves its 404 HTML page; the tRPC client tries to parse it as JSON. | **CONFIRMED** | Application (`apps/web` route topology) | **High** — every API-key mutation (create/edit/delete) is broken; the fork ships an unusable settings page |
| `POST /api/auth/two-factor/totp/setup` → **400**, repeatedly | The route is present and correct. Exactly four 400s are reachable; **three of them render as the generic `something_went_wrong`** in `EnableTwoFactorModal`, and the settings toggle is never disabled for accounts that structurally cannot enable TOTP. Which of the four fired in this deployment cannot be determined from source alone. | **CONFIRMED** (UX/diagnosability defect) · **MEDIUM** (which specific 400) | Application (UX / error mapping) | **High** — release-relevant: an `INACTIVE_ADMIN` cannot regain admin capability, and is given no actionable reason |
| Dozens of **429** on `/app-store/*/icon.svg`, `/app-store/*/icon-dark.svg`, `logo.png`, `icon.png`, `/api/logo?type=favicon-16`; secondary "invalid Manifest icons" errors | **Not application code.** There is no `apps/web/middleware.ts` at all; `/app-store/*` is static content under `apps/web/public/app-store/`; `/api/logo/route.ts` contains no rate-limit call; and `rateLimiter()` in `packages/lib/rateLimit.ts` is a **no-op returning `success: true` unless `UNKEY_ROOT_KEY` is set**. A contributing application factor exists: `/api/logo` sets only `s-maxage`, a shared-cache directive browsers ignore, so favicons are re-fetched from origin on every load. | **CONFIRMED** (that the application cannot emit these 429s) · **UNKNOWN** (which proxy does) | **`REVERSE_PROXY_RATE_LIMIT` / `EXTERNAL_WAF_RATE_LIMIT`** — deployment | **Medium** — user-visible breakage, but it belongs to `secure-docker-blueprint`, not this repository |
| `WebPushContext.tsx: Failed to subscribe: InvalidAccessError: The provided applicationServerKey is not valid.` | `WebPushContext.tsx:66` calls `pushManager.subscribe({ applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY \|\| "") })` with **no guard for an unset key**. The variable is `NEXT_PUBLIC_*`, therefore inlined at build; it is **not** a `Dockerfile` `ARG`, and `scripts/start.sh` rewrites only `NEXT_PUBLIC_WEBAPP_URL`. `docker-compose.yml:103` passes it as a **runtime** env, where it can have no effect on the client bundle. | **CONFIRMED** | Application + fork-owned deployment template | **Medium** — a phantom configuration knob; the feature can never work in the published image |
| `react-i18next: "You will need to pass in an i18next instance by using initReactI18next"` | `initReactI18next` is never called anywhere in the repo. `packages/lib/hooks/useLocale.ts:20` calls `useTranslation(namespace)` **eagerly**, before checking `AppRouterI18nContext`. Translations actually come from `AppRouterI18nProvider`, a plain React context that does not register an i18next instance, so the eagerly-computed `clientI18n` result is discarded on App Router pages. | **CONFIRMED** | Application (client bundle architecture) | **Low** — `DEVELOPMENT_WARNING`; no functional impact on App Router pages |
| `"markdownToSafeHTML" should not be imported on the client side.` | `packages/lib/markdownToSafeHTML.ts:4-9` emits this warning by design when `typeof window !== "undefined"`. Its own comment states it is a **bundle-cost** guard, upstream-known and deliberately tolerated. ~13 client components import it. | **CONFIRMED** | Application (bundle architecture) | **Low** — `BUNDLE_ARCHITECTURE`; explicitly **not** a sanitisation weakness |

---

## RV.1 API Keys — `CONFIRMED_BROKEN`

### RV.1.1 Reproduction from source topology

The tRPC client splits requests across one HTTP link per endpoint. Three legs must agree:

1. `packages/trpc/react/shared.ts` → the `ENDPOINTS` array (builds `${url}/${endpoint}` links)
2. `packages/trpc/server/routers/viewer/_router.tsx` → the `viewerRouter` child key
3. `apps/web/pages/api/trpc/<endpoint>/[trpc].ts` → the Next.js API adapter

`packages/trpc/react/trpc.ts:33-41` resolves the endpoint from the operation path: for a
3-segment path such as `viewer.apiKeys.create` it takes `parts[1]` as the endpoint and the
remainder as the procedure. The batch link therefore issues
`POST /api/trpc/apiKeys/create?batch=1` — **byte-for-byte the observed request.**

Legs 1 and 2 are present:
- `packages/trpc/react/shared.ts` lists `"apiKeys"`
- `packages/trpc/server/routers/viewer/_router.tsx:54` registers `apiKeys: apiKeysRouter`

Leg 3 is absent. `apps/web/pages/api/trpc/apiKeys/` does not exist. Next.js therefore returns
its HTML 404 document, and `await response.json()` in the tRPC client throws
`Unexpected token '<', "<!DOCTYPE "... is not valid JSON` — **exactly the reported client
error.** Confirmed without needing the deployment.

### RV.1.2 Deliberate strip or accidental omission?

**Accidental.** The history is unambiguous:

| Commit | Date | Effect on `apps/web/pages/api/trpc/apiKeys/[trpc].ts` |
| --- | --- | --- |
| `cdba1920fc` (#8041, *"split up routers to separate lambdas"*) | 2023 | **added** |
| `ab21c7f805` (**#28903**, *"refactor: Cal.diy"*) | 2026-04-15 | **deleted** |
| `07a288bbd8` (**#29517**, *"fix(api): missing trpc route added for the api keys"*) | 2026-06-08 | **re-added** upstream (4 lines) |

Presence verified at each ref: ABSENT at `46eb533dbd` (cal.forte's base), `ab21c7f805`,
`176037d0af`, and `develop`.

A deliberate removal would have removed the router, the `ENDPOINTS` entry and the UI. #28903
removed **only** the adapter and left the other three legs — including
`apps/web/modules/api-keys/**` and the `/settings/developer/api-keys` page — fully wired. This
is the same class of collateral damage documented in §R2.1.3: #28903 reverted 13 merged
commits; it also broke a shipped feature by deleting one leg of a three-leg contract.

### RV.1.3 The ledger entry that needs correcting

`07a288bbd8` **already has a row in `UPSTREAM_REVIEW_LEDGER.md`**:

> | `07a288bbd8` | Missing API-key tRPC route | `deferred` | Feature/API expansion not required by current fork scope. |

**That rationale is factually incorrect.** The commit is not feature or API expansion — it is
a four-line restoration of a route the fork's own shipped UI already calls on every
create/edit/delete. The fork deferred the fix for a broken feature because the commit was
mischaracterised at review time. This is the single most actionable process finding of this
pass: it is a documented decision, made in good faith, that the runtime evidence refutes.

### RV.1.4 Blast radius

`list` is **not** affected: `apps/web/app/.../developer/api-keys/page.tsx` reads keys
server-side through `PrismaApiKeyRepository` inside `unstable_cache`. The page therefore
renders existing keys and looks healthy. Every **mutation** goes through the missing adapter:

- `apps/web/modules/api-keys/api-keys/components/ApiKeyDialogForm.tsx:145` — `utils.client.viewer.apiKeys.create.mutate(event)` ← the observed failure
- `ApiKeyDialogForm.tsx:31` — `trpc.viewer.apiKeys.edit.useMutation`
- `ApiKeyListItem.tsx:40` — `trpc.viewer.apiKeys.delete.useMutation`

A page that lists correctly but silently fails every write is worse than one that fails
visibly — it is why this surfaced only through manual UI exercise.

### RV.1.5 Correction, test, impact

- **Official upstream comparison:** upstream `calcom/cal.diy@main` **has** the file; upstream fixed this on 2026-06-08.
- **Minimum safe correction:** `git cherry-pick -x 07a288bbd8` — one upstream commit, one local commit, four added lines, no behaviour change beyond restoring the route. Update the ledger row from `deferred` to `integrated-full` **and record why the original rationale was wrong**, per the ledger's own rule that decision reversals stay visible (the `0d164da8dd` precedent).
- **Regression test:** an assertion that every entry in `ENDPOINTS` which is also a `viewerRouter` child has a corresponding `apps/web/pages/api/trpc/<endpoint>/[trpc].ts`. This is a cheap static check that would have caught the omission at CI time and will catch the next one.
- **Security impact:** none directly. Indirect: API keys are the credential mechanism for API v1/v2, so operators cannot rotate or revoke keys through the UI — a real operational-security limitation, not a vulnerability.
- **Divergence impact:** none — this converges with upstream. It **reduces** divergence.

---

## RV.2 Router / Public-Endpoint Parity Inventory

Generated mechanically from the three legs. `Y` = present, `-` = absent.

| Endpoint | client `ENDPOINTS` | `viewerRouter` key | Next adapter | Verdict |
|---|---|---|---|---|
| `admin` | Y | Y | Y | OK |
| **`apiKeys`** | **Y** | **Y** | **–** | **BROKEN — backend router, no adapter** |
| `appBasecamp3` | Y | – | – | Orphan client entry |
| `apps` | Y | Y | Y | OK |
| `appsRouter` | – | – | Y | **Stale adapter** (duplicate of `apps`) |
| `auth` | Y | Y | Y | OK |
| `availability` | Y | Y | Y | OK |
| `bookings` | Y | Y | Y | OK |
| `calVideo` | Y | Y | Y | OK |
| `calendars` | Y | Y | Y | OK |
| `credentials` | Y | Y | Y | OK |
| `credits` | Y | – | – | Orphan client entry |
| `delegationCredential` | Y | – | – | Orphan client entry |
| `deploymentSetup` | Y | Y | Y | OK |
| `eventTypes` | Y | Y | Y | OK |
| `eventTypesHeavy` | Y | Y | Y | OK |
| `featureOptIn` | Y | – | – | Orphan client entry |
| `features` | Y | Y | Y | OK |
| `feedback` | Y | Y | Y | OK |
| `filterSegments` | Y | – | – | Orphan client entry |
| `googleWorkspace` | Y | Y | Y | OK |
| `holidays` | Y | Y | Y | OK |
| `i18n` | Y | Y | Y | OK |
| `loggedInViewerRouter` | Y | Y | Y | OK |
| `me` | Y | Y | Y | OK |
| `oAuth` | Y | Y | Y | OK |
| `ooo` | Y | Y | Y | OK |
| `payments` | Y | – | – | Orphan client entry |
| `phoneNumber` | Y | – | – | Orphan client entry |
| `public` | Y | Y | Y | OK |
| `slots` | Y | Y | Y | OK |
| `timezones` | Y | Y | Y | OK |
| `travelSchedules` | Y | Y | Y | OK |
| `users` | Y | Y | Y | OK |
| `viewer` | Y | – | Y | **Intentional alias** — handles 2-segment paths (`viewer.me`), adapter maps to `loggedInViewerRouter` |
| `webhook` | Y | Y | Y | OK |

Totals: 35 client endpoints · 27 router keys · 28 adapters.

**Classification of the mismatches:**

- **`apiKeys` is the only true break.** It is the unique signature "backend router present + client endpoint present + adapter missing", which is precisely what produces a 404 on a live UI action.
- **Seven orphan client entries** — `appBasecamp3`, `credits`, `delegationCredential`,
  `featureOptIn`, `filterSegments`, `payments`, `phoneNumber` — have no router and no adapter.
  **Verified zero frontend callers** for all seven (`grep` for `viewer.<name>.` and
  `trpc.<name>.` across `apps` and `packages`, excluding tests: 0 each). They are dead
  `ENDPOINTS` entries left behind by #28903's strip. Each still constructs an `httpLink` and
  an `httpBatchLink` at client bootstrap pointing at a non-existent path. **Classification:
  `BUNDLE_ARCHITECTURE` / dead surface — not a functional bug.** They belong to the Track B
  surface-reduction audit (C-13), not to a fix.
- **`appsRouter` is a stale adapter**: `apps/web/pages/api/trpc/appsRouter/[trpc].ts` mounts
  the same `appsRouter` as `apps/web/pages/api/trpc/apps/[trpc].ts`, but no client endpoint
  targets it. It is a reachable, unreferenced duplicate route. Low risk, but it is extra
  public surface on an authenticated router and belongs in the same Track B audit.
- **`viewer` is not a defect.** `resolveEndpoint` maps 2-segment paths (`viewer.me`,
  `viewer.public`) to `parts[0]`, so `viewer` is a legitimate alias whose adapter serves
  `loggedInViewerRouter`. Recording it here so a future audit does not "fix" it.

**Recommended durable control:** a CI parity check over the three legs. It is a
~20-line script, needs no runtime, and converts an entire class of silent breakage — the class
that produced this finding — into a build failure.

---

## RV.3 TOTP / Admin 2FA — complete lifecycle audit

### RV.3.1 Route inventory (App Router)

- `apps/web/app/api/auth/two-factor/totp/setup/route.ts`
- `apps/web/app/api/auth/two-factor/totp/enable/route.ts`
- `apps/web/app/api/auth/two-factor/totp/disable/route.ts`
- Client: `apps/web/components/settings/TwoFactorAuthAPI.ts`, `EnableTwoFactorModal.tsx`, `DisableTwoFactorModal.tsx`
- View: `apps/web/modules/settings/security/two-factor-auth-view.tsx`
- Login verification: `packages/features/auth/lib/next-auth-options.ts`

### RV.3.2 Every 400 from `setup`, mapped to the UI

| # | Condition (`setup/route.ts`) | `ErrorCode` | Message shown by `EnableTwoFactorModal` |
|---|---|---|---|
| 1 | `user.identityProvider !== CAL && !user.password?.hash` | `ThirdPartyIdentityProviderEnabled` | **`something_went_wrong`** |
| 2 | `!user.password?.hash` | `UserMissingPassword` | **`something_went_wrong`** |
| 3 | `user.twoFactorEnabled` | `TwoFactorAlreadyEnabled` | **`something_went_wrong`** |
| 4 | `verifyPassword(body.password, hash)` false | `IncorrectPassword` | `incorrect_password` ✅ |

Non-400 outcomes: `401` (no session / user gone), `500` (missing `session.user.id`, missing
`CALENDSO_ENCRYPTION_KEY`), `429` (`checkRateLimitAndThrowError` with
`identifier: api:totp-setup:<userId>`, `core` namespace = 10/60s — **inert unless
`UNKEY_ROOT_KEY` is set**, see RV.4).

`EnableTwoFactorModal.tsx:106-110` special-cases **only** `IncorrectPassword`. Cases 1–3
collapse to `t("something_went_wrong")`. **This is the confirmed defect**: three of the four
reachable 400s are undiagnosable from the UI, which matches the reported experience of a 400
"repeatedly" with no path forward.

### RV.3.3 Enable, disable, login, backup codes

- **`enable`**: 400 on `TwoFactorAlreadyEnabled`, `TwoFactorSetupRequired` (no
  `twoFactorSecret`), `IncorrectTwoFactorCode`. 500 if `symmetricDecrypt` yields a secret whose
  length ≠ 32 — a genuine integrity check. The modal maps only `IncorrectTwoFactorCode`;
  the other two again show `something_went_wrong`.
- **Secret generation**: `authenticator.generateSecret(20)` → 20 bytes → 32 base32 characters,
  consistent with the length assertions in `enable` and at login. Stored via
  `symmetricEncrypt(secret, CALENDSO_ENCRYPTION_KEY)`. **Correct.**
- **Backup codes**: 10 codes of `crypto.randomBytes(5).toString("hex")` (10 hex chars each),
  stored encrypted. **Correct generation.**
- **`disable`**: requires password for `CAL` identity providers, accepts either a TOTP code or
  a backup code, and on success nulls `backupCodes`, `twoFactorSecret` and `twoFactorEnabled`.
  **Backup-code single-use is enforced by wholesale invalidation on disable, not by
  consuming one code** — the in-file comment says "we delete all stored backup codes at the
  end". The single-use property of a backup code **at login** is a separate path in
  `next-auth-options.ts` and must be verified independently; do not assume it from this file.
- **Admin gating**: `next-auth-options.ts:255-285` — an `ADMIN` is downgraded to
  `INACTIVE_ADMIN` unless `isPasswordValid(password, false, true)` (**admin-strength policy**)
  **and** `user.twoFactorEnabled`. The reason is surfaced as
  `inactiveAdminReason: "both" | "password" | "2fa"`. Skipped when `IS_E2E` or in dev.

### RV.3.4 Can a normal locally-created CAL admin enable TOTP today?

**Yes — the source flow is intact.** For `identityProvider === CAL`, a present
`password.hash`, and `twoFactorEnabled === false`, conditions 1–3 cannot fire, so `setup`
succeeds with the correct password, `enable` succeeds with a valid code, and
`twoFactorEnabled` becomes `true`. **No source defect blocks the happy path.**

It follows that the observed repeated 400 is one of:
- **(a)** `IncorrectPassword` — the password entered did not match (the modal *would* say so);
- **(b)** the account is **not** a plain CAL/password account — created through Google/Azure
  sign-in, or seeded without a `Password` row — hitting case 1 or 2 and rendering as
  `something_went_wrong`;
- **(c)** `TwoFactorAlreadyEnabled` — a prior partial setup left state behind.

**These are distinguishable with one read-only query**, which is the recommended next
diagnostic step (no fix, no write):

```sql
SELECT u.id, u.email, u."identityProvider", u."twoFactorEnabled",
       (u."twoFactorSecret" IS NOT NULL) AS has_secret,
       (p.hash IS NOT NULL)              AS has_password
FROM   users u LEFT JOIN "UserPassword" p ON p."userId" = u.id
WHERE  u.role = 'ADMIN';
```

**A related UX defect, independently confirmed:**
`two-factor-auth-view.tsx:44` computes
`canSetupTwoFactor = !isCalProvider && !user?.twoFactorEnabled && !user?.passwordAdded` and
uses it **only** to render an informational `2fa_disabled` alert. The toggle itself is never
disabled. An account that structurally cannot enable TOTP is still shown an active switch that
opens a modal guaranteed to 400 with an opaque message. For an `INACTIVE_ADMIN` — who has lost
admin capability precisely *because* 2FA is off — that is a dead end with no stated cause.

### RV.3.5 Correction, test, impact

- **Official upstream comparison:** all three routes are byte-equivalent to
  `calcom/cal.diy@main`. **This is inherited upstream behaviour, not a cal.forte regression.**
- **Minimum safe correction (no authentication weakened):** extend the modal's error mapping to
  cover `ThirdPartyIdentityProviderEnabled`, `UserMissingPassword`, `TwoFactorAlreadyEnabled`
  and `TwoFactorSetupRequired` with distinct, actionable strings, and disable the toggle when
  the account cannot set up TOTP. **Server-side checks must not change** — every 400 above is a
  correct refusal; only their presentation is defective.
- **Regression test (as requested):**
  1. create a local `CAL` admin with a policy-compliant password
  2. `POST /api/auth/two-factor/totp/setup` with the correct password → 200, returns `secret`, `dataUri`, 10 `backupCodes`
  3. same call with a wrong password → 400 `IncorrectPassword`, and the UI shows `incorrect_password`
  4. `POST /api/auth/two-factor/totp/enable` with a TOTP derived from `secret` → 200
  5. assert `twoFactorEnabled === true` in the database
  6. log in with email+password only → second factor demanded, role is not `ADMIN`
  7. log in with email+password+TOTP → success, role is `ADMIN` (not `INACTIVE_ADMIN`)
  8. log in with a backup code → success, and **the same backup code is rejected on reuse**
  9. negative: an account with `identityProvider !== CAL` and no password → `setup` returns 400 `ThirdPartyIdentityProviderEnabled` **and the UI states the reason**

  Steps 6–8 need Playwright (`PLAYWRIGHT_HEADLESS=1 yarn e2e`, run locally per
  `testing-playwright`); steps 2–5 and 9 are unit/integration-testable.
- **Security impact:** the routes themselves are sound — session-gated, password-confirmed,
  rate-limit-hooked, secrets encrypted with `CALENDSO_ENCRYPTION_KEY`, length-validated. The
  impact is **availability of a security control**: an admin who cannot complete TOTP setup
  stays `INACTIVE_ADMIN` indefinitely. That makes it release-relevant under `SECURITY_REVIEW.md`
  ("auth and signup behavior") even though nothing is exploitable.
- **Divergence impact:** a UI-only change in `apps/web/components/settings/EnableTwoFactorModal.tsx`
  plus translation keys in `packages/i18n/locales/en/common.json`. Small, but it is
  fork-owned divergence in a file upstream also edits — a merge-conflict surface. Prefer
  proposing it upstream.

**Related Track B observation:** `EnableTwoFactorModal.tsx` and `DisableTwoFactorModal.tsx`
each exist **twice** — under `apps/web/components/settings/` (imported by the view) and under
`apps/web/components/security/` (no importer found). The duplicate pair is dead surface and
belongs in the C-13 inventory.

---

## RV.4 Mass HTTP 429 on static resources — deployment-layer finding

### RV.4.1 The application cannot produce these responses

Four independent facts, each verified in `develop`:

1. **No Next.js middleware exists.** `apps/web/middleware.ts` is absent, so there is no
   application code in the request path for static files at all.
2. **`/app-store/*` is static content.** `apps/web/public/app-store/` is a real directory
   (`calendar.svg`, `messaging.svg`, `other.svg`, `payment.svg`, `video.svg`, and the
   per-app icons). No route handler matches `*app-store*` + icon/image.
3. **`/api/logo` does not rate-limit.** `apps/web/app/api/logo/route.ts` contains no
   `checkRateLimitAndThrowError` call — its only header work is
   `Cache-Control: s-maxage=86400, stale-while-revalidate=60` (line 235).
4. **The rate limiter is inert without Unkey.** `packages/lib/rateLimit.ts:36-46` — when
   `UNKEY_ROOT_KEY` is unset, `rateLimiter()` returns a fixed
   `{ success: true, limit: 10, remaining: 999, reset: 0 }` and logs a single warning. Even
   with Unkey configured, `checkRateLimitAndThrowError` throws
   `HttpError({ statusCode: 429 })` and is called from **~20 sites, all** in auth, booking,
   signup, cancel, eventTypes and 2FA handlers — never for static assets or `/api/logo`.

**Conclusion: `REVERSE_PROXY_RATE_LIMIT` or `EXTERNAL_WAF_RATE_LIMIT`.** Repository code
cannot plausibly generate 429 for `/app-store/*/icon.svg`, `logo.png`, `icon.png`, or
`/api/logo?type=favicon-16`. This is a **deployment finding**, and per `.ai/decisions.md` it
belongs to `secure-docker-blueprint`, not to this repository. The prime suspect is the
Traefik rate-limit middleware referenced in `.ai/roadmap.md`.

### RV.4.2 One genuine application-side contributing factor

`/api/logo` sets `s-maxage`, which is a **shared-cache** directive: browsers ignore it because
no `max-age` is present. Every page load therefore re-requests
`/api/logo?type=favicon-16`, `favicon-32`, `icon` and friends from the origin. A logo route
that is uncacheable *by the browser* turns ordinary navigation into a repeating request burst
— which is exactly the traffic shape a proxy rate-limiter reacts to. This does **not** cause
the 429, but it materially increases how often the limit is reached, and it also explains the
secondary "invalid Manifest icons" errors: the manifest references icon URLs that are being
throttled.

### RV.4.3 Required diagnostics (deployment side, no code change)

To attribute the 429 definitively, capture on a throttled response:

```bash
curl -sSD - -o /dev/null 'https://<host>/app-store/zoom/icon.svg'
```

and inspect for:

- `Retry-After` — present on most proxy/WAF limiters, absent from cal.forte's `HttpError` 429
- `X-RateLimit-Limit` / `X-RateLimit-Remaining` / `X-RateLimit-Reset`
- `Server`, `Via`, `CF-Ray`, `X-Cache`, or a Traefik `X-*` marker identifying the responder
- whether the body is JSON (`{"message":"Rate limit exceeded. Try again in N seconds."}` would
  indicate cal.forte's own limiter — its exact string) or the proxy's own error page

Then confirm `UNKEY_ROOT_KEY` is unset in the running container. If it is unset and the body is
not that exact string, the application is excluded conclusively.

### RV.4.4 Desired architecture

Static assets under `/app-store/*`, `/_next/static/*`, favicons and manifest icons must be
**exempt** from API-style request limiting. Recommended shape for
`secure-docker-blueprint`: apply the rate-limit middleware to `/api/**`,
`/api/auth/**` and `/api/trpc/**` only, and let static paths through with long-lived cache
headers. A single browser page load legitimately issues dozens of icon requests; a limiter
tuned for API traffic will always misfire on it.

**Optional, separate cal.forte-side improvement:** give `/api/logo` a browser-cacheable
`Cache-Control: public, max-age=86400, s-maxage=86400, stale-while-revalidate=60`. That is a
one-line change reducing origin load by roughly the number of page loads. It should be raised
upstream rather than carried as divergence, and it is **not** a fix for the 429.

---

## RV.5 Web Push / VAPID

### RV.5.1 Confirmed mechanism

- `apps/web/modules/notifications/components/WebPushContext.tsx:66`:
  `applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "")`.
  With the variable unset, the `|| ""` fallback yields an empty key and the browser rejects it
  with **`InvalidAccessError: The provided applicationServerKey is not valid`** — the exact
  observed error.
- **The client attempts subscription even when configuration is absent.** There is no
  `if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return;` guard anywhere in the provider.
- **The server side is correct and asymmetric to the client.**
  `packages/features/notifications/sendNotification.ts:16-22` logs
  *"Missing VAPID keys. Web push notifications are disabled."* and refuses to send. So the
  server disables web push while the client still offers and attempts it.
- **The error is caught and mislabelled.** `WebPushContext.tsx:73-79` specifically detects
  `InvalidAccessError` + `applicationServerKey` and shows
  *"Please enable Google services for push messaging and try again"* — blaming the user's
  browser for what is a missing server-side configuration value.
- **Reachability:** `WebPushProvider` wraps the whole app (`apps/web/app/providers.tsx:32` and
  `apps/web/pages/_app.tsx:19`); `subscribe()` is invoked from
  `apps/web/modules/settings/my-account/push-notifications-view.tsx:10` via `useWebPush`.

### RV.5.2 Is it configurable in a prebuilt image? No.

- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is a `NEXT_PUBLIC_*` variable, therefore **inlined into the
  client bundle at build time** (`.ai/branding.md` §1).
- It is **not** among the root `Dockerfile` `ARG`s (which are `NEXT_PUBLIC_LICENSE_CONSENT`,
  `NEXT_PUBLIC_WEBSITE_TERMS_URL`, `NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL`, `DATABASE_URL`,
  `NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY`, `MAX_OLD_SPACE_SIZE`, `NEXT_PUBLIC_API_V2_URL`,
  `CSP_POLICY`, `NEXT_PUBLIC_SINGLE_ORG_SLUG`, `ORGANIZATIONS_ENABLED`, `NEXT_PUBLIC_APP_NAME`,
  `NEXT_PUBLIC_COMPANY_NAME`, `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS`).
- `scripts/start.sh` rewrites **only** `BUILT_NEXT_PUBLIC_WEBAPP_URL` → `NEXT_PUBLIC_WEBAPP_URL`.
- **But `docker-compose.yml:103` passes `NEXT_PUBLIC_VAPID_PUBLIC_KEY` as a runtime
  `environment:` entry.**

**Therefore the published `cal.forte` image can never have working web push, at any
configuration, and the fork's own compose file advertises a knob that cannot function.** This
is a **fork-owned** defect (the compose file is fork-maintained), and it is the same class as
the two phantom flags already on record: the removed Jitsu telemetry opt-out
(`75a9df1812`) and the dead `OUTLOOK_LOGIN_ENABLED` (C-13).

### RV.5.3 Correction, test, impact

- **Official upstream comparison:** `WebPushContext.tsx` and `sendNotification.ts` match
  upstream. The compose-file mismatch is fork-owned.
- **Minimum safe correction — three independent parts, smallest first:**
  1. **Client guard (upstream-shaped):** return early from `subscribe()` when the key is
     absent, and hide or disable the push-notifications settings toggle. Feature absent rather
     than broken.
  2. **Compose honesty (fork-owned):** either remove `NEXT_PUBLIC_VAPID_PUBLIC_KEY` from
     `docker-compose.yml`'s runtime `environment:` block, or add it as a `Dockerfile` `ARG`
     + build arg so it actually takes effect. Keeping both `VAPID_*` lines in `environment:`
     while only the private key works is the misleading state. `VAPID_PRIVATE_KEY` is
     server-only and correctly placed.
  3. **Error message:** replace the "enable Google services" text, which misattributes a
     configuration error to the browser.
- **Regression test:** with `NEXT_PUBLIC_VAPID_PUBLIC_KEY` unset, assert no `pushManager.subscribe`
  call is made and no `InvalidAccessError` is logged; with a valid key, assert `subscribe`
  receives a non-empty `Uint8Array`.
- **Security impact:** none. Web push is optional; no secret is exposed. `VAPID_PRIVATE_KEY`
  is correctly server-only. **No keys were generated or committed in this pass.**
- **Divergence impact:** part 2 is a one-line change to a file the fork already owns and is
  already listed in `FORK_DIVERGENCE.md`. Parts 1 and 3 are upstream-shaped and should be
  proposed upstream.
- **Feeds C-10 (env-template drift check):** this is a textbook case for the semantic env
  preflight — a variable present in the deployment template that the build never consumes.
  A check that cross-references `NEXT_PUBLIC_*` names against the `Dockerfile` `ARG` list and
  the compose `environment:` block would have caught it statically.

---

## RV.6 Client warnings

### RV.6.1 `react-i18next: "You will need to pass in an i18next instance by using initReactI18next"`

**Classification: `DEVELOPMENT_WARNING`.**

- `initReactI18next` is **never called** anywhere in the repository (verified by grep across
  `apps` and `packages`).
- `packages/lib/hooks/useLocale.ts:4` imports `useTranslation` from `react-i18next`, and
  `useClientLocale` (line ~20) calls `useTranslation(namespace)` **unconditionally**, before
  any context check. With no global instance registered, react-i18next emits this warning.
- Translations actually arrive through `apps/web/app/AppRouterI18nProvider.tsx` — a plain
  React context carrying `{ translations, locale, ns }`. It does **not** register an i18next
  instance. `useLocale` prefers `appRouterContext` when present, so the eagerly-computed
  `clientI18n` value is discarded on App Router pages.
- Second importer: `packages/platform/atoms/lib/useLocale.ts:2`, same pattern.

**Impact:** none on App Router pages. The cost is a console warning on every client render
plus an unnecessary `react-i18next` code path. `isLocaleReady` is derived from
`Object.keys(i18n).length > 0`, a fragile heuristic worth noting but not acting on.
**Do not refactor** — this is upstream-shaped, touches every translated component, and offers
no user-visible gain. Record it; do not fix it.

### RV.6.2 `"markdownToSafeHTML" should not be imported on the client side.`

**Classification: `BUNDLE_ARCHITECTURE`. Explicitly *not* `SECURITY_CONCERN`.**

- The warning is emitted deliberately by `packages/lib/markdownToSafeHTML.ts:4-9`, guarded by
  `typeof window !== "undefined"`. Its own comment states the intent: *"This file imports
  markdown parser which is a costly dependency… It is still imported at some places on client
  in non-booker pages, we can gradually remove it from there and then convert it into an
  error."* Upstream knows and tolerates it.
- ~13 client components import it, including
  `apps/web/modules/bookings/components/EventMeta.tsx`,
  `apps/web/modules/event-types/components/EventTypeDescription.tsx`,
  `apps/web/modules/form-builder/components/FormBuilderField.tsx` and
  `apps/web/modules/apps/components/AppCard.tsx`.
- **Sanitisation is not weakened.** The function runs `md.render()` then `sanitizeHtml()`
  regardless of environment; executing it in the browser produces the same sanitised output.
  The cost is bundle size (`markdown-it` + `sanitize-html` shipped to the client), not safety.
- One point worth stating precisely so it is not mis-escalated later: this warning says
  nothing about whether any given call site renders **unsanitised** markdown. That would be a
  separate audit of `dangerouslySetInnerHTML` call sites, which this pass did not perform and
  which the runtime evidence does not implicate.

**Impact:** client bundle weight only. **Do not refactor** in this pass. Belongs in the Track B
audit if bundle size becomes a goal.

---

## RV.7 What this pass changes in the backlog

**Two new candidates, one ledger correction, one durable control.**

| ID | Item | Type | Prio | Ev. | Target | Disposition |
|---|---|---|---|---|---|---|
| **C-22** | Restore the `apiKeys` tRPC route (cherry-pick upstream `07a288bbd8`) and **correct its ledger row**, whose "feature/API expansion" rationale the runtime evidence refutes | bug | **P1** | **E3** (runtime-reproduced + upstream fix exists) | cal.forte | **candidate — take upstream's own 4-line fix** |
| **C-23** | CI parity check across `ENDPOINTS` / `viewerRouter` / Next adapters; prune the 7 orphan client endpoints and the stale `appsRouter` adapter | maintenance | P2 | E2 | cal.forte | candidate |
| **C-24** | Map all four TOTP-setup 400s to actionable UI messages and disable the toggle for accounts that cannot enable TOTP | bug (security capability) | P2 | E2 | cal.forte | candidate |
| **C-25** | VAPID: guard the client subscribe, and make `docker-compose.yml` stop advertising a build-time variable as a runtime one | bug + deployment | P3 | E2 | cal.forte | candidate |
| — | Mass 429 on static assets | deployment | — | CONFIRMED-not-application | **`secure-docker-blueprint`** | **not-applicable to cal.forte** |
| — | `react-i18next` warning | development-warning | — | E2 | — | **rejected** (no user impact; upstream-shaped) |
| — | `markdownToSafeHTML` client warning | bundle-architecture | — | E2 | — | **rejected** (upstream-known and deliberately tolerated) |

**Two cross-cutting consequences:**

1. **C-22 strengthens C-17 substantially.** Upstream `ab21c7f805` (#28903) is now shown to have
   done three distinct kinds of damage that cal.forte inherited: it reverted 13 merged commits,
   it deleted regression tests along with the fixes they guarded, and it **broke a shipped
   feature by removing one leg of a three-leg contract while leaving the other two wired**.
   The C-17 audit should look explicitly for the third pattern, not only for content reverts.

2. **RV.5 and RV.2 both feed C-10 (env/template drift).** A phantom compose variable and seven
   phantom client endpoints are the same failure mode as the dead `OUTLOOK_LOGIN_ENABLED`
   (C-13) and the removed telemetry opt-out: **configuration and wiring that survive a strip
   after the thing they controlled is gone.** That is now a documented, recurring class in this
   fork with four confirmed instances, and it is the strongest argument yet for making the
   parity and env-drift checks blocking rather than advisory.
