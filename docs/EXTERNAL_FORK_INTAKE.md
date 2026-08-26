# External Fork Intake Register

Findings discovered by reading **other forks of Cal.diy**, each re-verified against this tree before
being recorded. External forks are **discovery sources only**; nothing here is provenance for a
`git cherry-pick -x`, and no external patch has been adopted.

| Item | Value |
| --- | --- |
| Branch of record | `develop` |
| Audited commit | `41689d1d6e3fbef3da14c75ee94ba254542d9235` |
| Intake pass | 2026-08-25 · consolidated and re-verified 2026-08-26 |
| Repository state | analysis only — no tracked file changed, no GitHub write, no cherry-pick |
| Long-form evidence | [EXTERNAL_FORK_INTAKE_EVIDENCE.md](EXTERNAL_FORK_INTAKE_EVIDENCE.md) — per-candidate reasoning, preserved as written and subordinate to this register |
| Companions | [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) (master + candidate registry) · [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) · [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) · [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) |

## 1. Why This Register Exists Separately

[UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md) is defined as the disposition record for
**upstream** commits, and its provenance rules assume `git cherry-pick -x` against
`calcom/cal.diy`. External-fork material has no such provenance: recording it there would imply an
upstream lineage that does not exist. This register keeps the two vocabularies apart.

One consequence is load-bearing and is repeated throughout: **a claim originating in another fork is
evidence of nothing until it has been re-derived against this tree.** Several claims below did not
survive that step.

## 2. Evidence And Provenance Vocabulary

| Tier | Meaning |
| --- | --- |
| `E0` | claim only — asserted by the source, not demonstrated here |
| `E1` | code-confirmed — the described code exists in this tree at the cited lines |
| `E2` | reproduced — the behaviour was demonstrated (execution, or an unambiguous control-flow trace) |
| `E3` | corroborated — an independent second source (upstream history, an advisory, or another party) agrees |

| Provenance | Meaning |
| --- | --- |
| `upstream` | originates in `calcom/cal.diy`; eligible for normal ledger treatment and `-x` cherry-pick |
| `external-fork` | originates in a third-party fork; **discovery only**, never a patch source |
| `fork-owned` | found by this fork's own audit; the external repo was only the trigger |

**Primary-provenance rule.** Where upstream history explains a finding, upstream is the provenance and
the external fork is demoted to "symptom reporter". C-15 is the worked example: COG-GTM surfaced a
`truncateOnWord` symptom, but the defect is an upstream regression with a known upstream fix commit, so
the correct action changed from "author a fork fix" to "cherry-pick the upstream commit".

## 3. Sources

Eleven repositories were examined across two rounds. Classification: **A** = active divergent fork,
**B** = historical snapshot (provenance evidence only).

| Repo | Class | Fork of | Merge-base with `calcom/cal.diy@main` | Notes |
| --- | --- | --- | --- | --- |
| `COG-GTM/cal.com` | A | `calcom/cal.diy` | `77b2be13b2` (2026-03-31) | `main` is a stale upstream snapshot; all work in 31 unmerged `devin/*` PR branches. Zero CI, zero reviews. **Lead generator only.** |
| `Mitch515/cal.diy` | A | `calcom/cal.diy` | `180ede28f0` (2026-05-14) | Highest-quality external material: real repro narratives, focused diffs, tests. Heavily contaminated with customer-specific content incl. a hard-coded Entra tenant GUID. |
| `Biji-Biji-Initiative/cal.com` | A | `calcom/cal.diy` | `facc0745d3` (2026-04-06) | Deployment/CI fork. Its notable app commit `80aa00e362` removes **auth backdoors that fork itself introduced**. |
| `Enqira/cal.diy` | A | `calcom/cal.diy` | base `176037d0af` | Author-original multi-tenant team management, `857c362ed2` (59 files, +3636/−21). See [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md). |
| `erikmayergit/cal.diy` | A | `calcom/cal.diy` | — | Fly.io deployment config only. |
| `Drakkarrr`, `millionco`, `skdas20`, `PeerRich/calendso`, `Singhshashi18`, `retrogtx` | B | — | — | Historical snapshots. Contributed provenance and regression evidence only; zero fork-specific code between them. |

Two of the five Class-A forks are based on code **older** than this fork's own base `46eb533dbd`
(2026-05-03), so their patches describe an older tree and every claim was re-checked file by file.

**A standing caution, evidenced.** `Biji-Biji-Initiative` commit `80aa00e362` removes a hard-coded API
key that bypassed `ApiAuthStrategy` and `CustomThrottlerGuard` — a vulnerability that fork introduced
itself. It was never upstream and is not in this tree. It is retained here as the concrete argument for
the fork's "never trust another fork" rule.

## 4. Verification Method Applied In This Consolidation

Every candidate below was independently re-checked against `develop` at `41689d1d6e` by a reviewer that
did not see the original intake write-up, and the load-bearing ones were then attacked by an adversarial
reviewer. Verdicts in the tables are **this fork's**, not the source's. Where the two disagree, the
disagreement is recorded rather than resolved silently.

Five source claims did not survive verification. They are listed in §7.

## 5. Register

Master-document finding IDs (`F-nn` / `D-nn`) are cross-referenced where the candidate became a durable
finding. Candidate IDs (`C-nn`) are preserved so the original analysis stays traceable.

### 5.1 Confirmed against this tree

**The master audit is canonical for `F-nn` identifiers.** The `Master ID` column below is a pointer
into [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) §1.1/§1.2, not an independent
numbering. An earlier revision of this table was **off by one for every candidate mapping to F-23 or
above** — C-15, C-07, C-03, C-04, C-01 and C-05 each named `F-(n-1)` — because it skipped F-23, a
runtime finding that has no entry in this register. Corrected below; the master was not changed.

| ID | Finding | Source | Provenance | Ev. | Verified state on `develop` | Master ID | GitHub |
| --- | --- | --- | --- | --- | --- | --- | --- |
| C-06 | Public unauthenticated slot lookup resolves an event type by slug alone | Mitch515 `ab5d8542d3` | **upstream regression** (`ab21c7f805`) | **E2** | Confirmed — **and the source's wording is wrong**; see §6.1 | **F-02** | #14 |
| C-16 | Permission checks are `return true` stubs across 18 files | fork-owned; corroborated by Enqira | upstream strip | **E2+E3** | Confirmed: 18 production files, 11 fail-open / 6 fail-closed / 1 DI-wiring | **F-01** | #13 |
| C-15 | `truncateOnWord` ignores `maxLength`; collapses to `"..."` with no word break | upstream `ea0c92a267` (#27961); symptom via COG-GTM #31 | **upstream regression** | **E3** | Confirmed; live on public booking-page OpenGraph metadata | **F-24** |
| C-17 | `ab21c7f805` (#28903) silently reverted merged upstream fixes | fork-owned | upstream | **E2** (partial) | Confirmed as a mechanism; the "13 commits / 24 paths" headcount is **not** verified — see §6.2 | **F-07** | #20 |
| C-18 | Booker timezone slot-refresh fix (#27491) partially reverted | fork-owned | upstream | **E2** | Confirmed, with a concrete live inconsistency — see §6.3 | **F-07a** | #19 |
| C-19 | Webhook payloads carry the `assignmentReason` shape upstream rolled back (#27891) | fork-owned | upstream | **E2** | Confirmed for legacy/unversioned payload paths only — see §6.4 | **F-07b** | #21 |
| C-13 | `OUTLOOK_LOGIN_ENABLED` controls nothing while `/api/auth/signin/azure-ad` stays live | fork-owned; triggered by Mitch515 `ea863eac76` | upstream rot | **E2** | Confirmed on both login and signup | **F-20** | #22 |
| C-08 | Entra login accepts every Microsoft tenant, unconfigurable | Mitch515 `c46a03d8e9` | external-fork (concept) | **E1+E3** | Confirmed; severity reduced by an existing guard — see §6.5 | **F-21** | #23 |
| C-07 | A failing cosmetic Google Calendar PATCH discards an already-created event | Mitch515 `36a40b4cb4` | external-fork (concept) | **E2** | Confirmed, and **broader than claimed** — see §6.6 | **F-28** |
| C-03 | `extractBaseEmail` fabricates addresses from malformed input | COG-GTM #31 | external-fork | **E2** | Confirmed; reachable from an unauthenticated endpoint, but no bypass demonstrated | **F-25** |
| C-04 | `getProviderName` throws a `TypeError` on a bare `integrations:` location | COG-GTM #31 | external-fork | **E2** | Confirmed; requires a connected calendar/CRM to reach | **F-26** |
| C-01 | CSV export does not neutralise spreadsheet formula prefixes | COG-GTM #31 | external-fork | **E2** | Confirmed; org-gated, and one of the two cited consumers is dead code | **F-27** |
| C-05 | HitPay drop-in accepts `message` events from any origin | fork-owned (COG-GTM #1 partial) | external-fork | **E1** | Confirmed; app disabled by default and impact is client-side only | **F-29** |
| C-14 | Branding build args declared in the `Dockerfile` but never passed by the release workflow | fork-owned | fork-owned | **E2** | Confirmed; but the source's own correction to `.ai/branding.md` is wrong — see §7 | **F-16** | #24 |
| C-20 | Multi-tenant team management (Enqira) | Enqira `857c362ed2` | external-fork | **E2** | Not adopted. Audited as an architecture decision in [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) §10 | — | #28 |

### 5.2 Deferred, no action proposed

| ID | Finding | Why deferred |
| --- | --- | --- |
| C-09 | Upstream drift **reporting** (never enforcement) | Concept only. The source's own implementation (`fc37a2cac4`) auto-syncs and fails the build when behind — directly contrary to `.ai/decisions.md` and `UPSTREAM_SYNC.md`. Only the reporting idea survives. |
| C-10 | Env-template-vs-code drift check | Overlaps the environment-semantics work already proposed as a candidate; sequence behind it. |
| C-11 | API v2 build stage runs as root | `already-covered` — non-root runtime shipped in `6800e65e06` (`v6.2.0-5`). |
| C-12 | LIA / Mereka deployment-specific changes | `not-applicable` — customer-specific. |
| C-21 | Fly.io deployment additions | `not-applicable` / `rejected` — see §7. |

## 6. Where This Fork's Verification Differs From The Source

These are the corrections that matter. Each was produced by re-deriving the claim against `develop`.

### 6.1 C-06 is real but is stated on the wrong endpoint

The source describes "team event types resolved by slug alone on a public unauthenticated endpoint" and
points at the public event endpoint. **On that endpoint the claim is false.**
`packages/features/eventtypes/lib/getPublicEvent.ts:401-407` builds
`{ team: { ...getSlugOrRequestedSlug(username), parent: orgQuery } }` — a matching team **is** required.

The defect is on a different public endpoint, and it is broader than "team event types":

- `packages/trpc/server/routers/viewer/slots/_router.tsx:18` — `getSchedule` is a `publicProcedure`
- `packages/trpc/server/routers/viewer/slots/util.ts:355-364` — `getEventTypeId` declares `isTeamEvent`
  in its parameter **type** and never destructures it
- `util.ts:367-372` — always `findFirstEventTypeId({ slug: eventTypeSlug, userId })`; `userId` is
  `undefined` whenever the username does not resolve
- `packages/features/eventtypes/repositories/eventTypeRepository.ts:1130-1139` — with neither `teamId`
  nor `userId`, falls through to `findFirst({ where: { slug } })`, the branch its own comment labels
  *"shouldn't happen in practice"*

Regression attribution verified with `git log -L 355,378:…/slots/util.ts`: `ab21c7f805` removed the
`if (isTeamEvent) { teamId = await this.getTeamIdFromSlug(...) } else { userId = ... }` branch.

**No team is required to reach it**, which is why this — not the PBAC stubs — is the most reachable
authorization-adjacent finding in the whole audit. Recorded as **F-02**; wording finalised there after
adversarial review.

### 6.2 C-17's mechanism is confirmed; its headcount is not

Confirmed: `ab21c7f805` is a single-parent commit — `4080 files changed, 21362 insertions(+),
411881 deletions(-)`, composed of 2811 deletions, 1030 modifications, 17 additions — and it reverted
merged upstream fixes **together with their regression tests**, which is why nothing turned red.

Not confirmed: the "13 upstream commits / 24 file paths" figure. Five commits were spot-checked:

| Commit | PR | Verdict |
| --- | --- | --- |
| `ea0c92a267` | #27961 `truncateOnWord` | **fully reverted**, source *and* test block; still reverted on `develop` |
| `3a7122d613` | #27891 `assignmentReason` webhook rollback | **fully reverted**; still reverted |
| `20dcef6680` | #27818 schedule-title validation | **fully reverted**; still reverted |
| `4c73695d3a` | #27491 booker timezone refresh | **partially** reverted (§6.3) |
| `21500c7047` | #27309 remove `_count` children query | **REFUTED** — the substantive fix survives on `develop`; only one comment line matches the pre-fix blob |

So the count is overstated by at least one, and the 24-path figure is correspondingly inflated. A
whole-file check over a 60-file sample of files `ab21c7f805` *modified* under `packages/lib` and
`packages/features` found only 3 byte-identical to an earlier historical blob — **the rollbacks are
hunk-level inside files that were also legitimately stripped of EE code**, not a wholesale content
rollback. Any future audit must judge each path individually.

One further precision on the ledger point. `UPSTREAM_REVIEW_LEDGER.md` genuinely has no row for
`ab21c7f805`, but the ledger declares its scope as `46eb533dbd..176037d0af` and `ab21c7f805` is **43
commits before** `46eb533dbd`. This is therefore **not an omission inside a range the ledger claimed to
cover** — it is a gap in the fork's review baseline. That distinction matters for how it is fixed.

### 6.3 C-18 — the "inconsistent state" is concrete

Of the 9 files `4c73695d3a` touched: 3 are byte-identical to the pre-fix blob (`useEvent.ts`,
`packages/features/bookings/types.ts`, `publicViewer/event.handler.ts`), 1 was deleted outright
(`useStableTimezone.test.ts`, 74 lines), 3 kept unrelated refactor edits but had the fix hunks removed
(`BookerWebWrapper.tsx`, `getPublicEvent.ts`, `EventTypeCalendarViewComponent.tsx`), and **2 retain the
fix** — `packages/features/bookings/Booker/hooks/useStableTimezone.ts` and the hunk in
`packages/platform/atoms/booker/BookerPlatformWrapper.tsx:246-252`.

The inconsistency is live: `BookerPlatformWrapper.tsx:249-250` reads `event.data.restrictionScheduleId`
and `event.data.useBookerTimezone`, but the producer `getPublicEvent.ts` no longer supplies either field.

### 6.4 C-19 must be scoped to the unversioned payload paths

Confirmed: all 10 `assignmentReason` strip sites the upstream rollback added are absent; the runtime
guard `sanitizeAssignmentReasonForWebhook` and its Zod schema do not exist anywhere on `develop`; and
`packages/features/webhooks/lib/sendPayload.ts:99-103` still carries the wide union including
`{ category: string; details?: string | null }` that upstream narrowed away. The 10 regression tests the
rollback added are also gone.

**But it is not universal.** `packages/features/webhooks/lib/factory/versioned/v2021-10-20/BookingPayloadBuilder.ts:199-204`
does strip `assignmentReason`, so consumers on the versioned path are unaffected; and
`RegularBookingService.ts:2252` builds its own payload with the correct legacy array shape. The leak is
in the wholesale `...evt` spreads on the legacy/unversioned paths.

### 6.5 C-08's severity is lower than the source implies

The tenant gap is real: `packages/features/auth/lib/next-auth-options.ts:333-357` constructs
`AzureADProvider` with **no `tenantId`**, and `next-auth`'s provider defaults to the `common` endpoint.
There is no environment variable anywhere to restrict it.

The source does not mention that this fork already carries the nOAuth mitigation:
`next-auth-options.ts:846-864` requires the Azure `xms_edov` (email-domain-owner-verified) claim and
redirects to `/auth/error?error=unverified-email` when it is absent. **This is therefore not an
account-takeover finding** and must not be filed as one. What remains is a genuine tenant-isolation gap:
any Microsoft identity worldwide can sign in to an instance that enables Outlook login.

Two amplifiers the source also omits, recorded so severity is neither inflated nor understated:
`allowDangerousEmailAccountLinking: true` (`next-auth-options.ts:338`) is what makes the tenant gap
matter at all; and the gate is `OUTLOOK_LOGIN_ENABLED`, whose UI is dead (C-13) while the endpoint stays
live — so an operator can enable the provider and see no button, and still have the endpoint reachable.

### 6.6 C-07 is broader than "throttled"

`packages/app-store/googlecalendar/lib/CalendarService.ts` creates the event at `:283-288`, then runs a
cosmetic hangout-link `patch` at `:298-319` inside the same `try`; the `catch` at `:334-345` **rethrows
unconditionally**. Nothing in the file discriminates a 429 / `rateLimitExceeded` from any other error, so
**any** failure of the cosmetic PATCH discards a successful insert — leaving an orphaned Google event and
a booking the app believes failed. The same unguarded pattern also exists on the recurring-instance PATCH
at `:268-280`.

## 7. Claims That Did Not Survive Verification

Recorded so they are not re-raised.

| Claim | Source | Disproof |
| --- | --- | --- |
| C-06 as worded (public **event** endpoint resolves team events by slug alone) | Mitch515 | `getPublicEvent.ts:401-407` requires a matching team. The real defect is on `slots.getSchedule` (§6.1). |
| `21500c7047` (#27309) is among the reverted commits | fork-owned intake | The substantive fix survives on `develop`: `children: true` occurrences in `eventTypeRepository.ts` are 0 at `develop`, same as post-fix. |
| "`.ai/branding.md`'s '~52 files hard-code Cal.com' is stale — the literal now appears in 3 files, all `package.json` author fields" | fork-owned intake | **Wrong twice.** A `.ts`/`.tsx`-only search yields 3 files, and they are `apps/docs/app/layout.tsx`, `packages/types/environment.d.ts`, `packages/lib/constants.ts` — **not** `package.json` author fields. Across `apps/` + `packages/` the literal appears in **47** files (44 `.json`, mostly app-store `config.json`; 2 `.ts`; 1 `.tsx`), plus 5 `LICENSE` files where it is a **required notice that must stay**. `.ai/branding.md`'s figure is materially accurate. |
| In-place `emails.sort()` side effect | COG-GTM `66c378fd2f` | `emailSchema.array().safeParse(value)` returns a **new** array, so sorting it cannot reach `responses[field.name]`. Disproved by direct execution. |
| `teams/create` `Math.random()` → `randomBytes` | COG-GTM `a3186a9dca` | `apps/web/app/api/teams/create/route.ts` exists in neither this fork nor upstream `main`. |
| `xms_edov` bypass via `tid` match | Mitch515 `2a4bfef5e6` | **Weakens** the email-domain-ownership guard this fork already has. Rejected. |
| Hard-coded `WEALTH_NAVIGATOR_TENANT_ID` | Mitch515 `b573bd746f` | Bakes a third party's Entra tenant GUID in as a default. Not applicable. |
| Automatic upstream sync with auto-PR | Biji-Biji `fc37a2cac4` | Contradicts `.ai/decisions.md` and `UPSTREAM_SYNC.md`; their `upstream-drift.yml` fails the build when behind, which is permanently red for a selectively-maintained fork. |
| Live smoke-check / release-gate scripts | Biji-Biji ×4 | `already-covered`: `.github/actions/docker-build-and-test/action.yml` already builds once, boots the exact image, polls `/auth/login`, Trivy-scans, emits a CycloneDX SBOM, refuses tag overwrite and captures the digest. What is missing is **post-deployment** verification — the consumer's job. |
| App-store seed enable fix | Biji-Biji `1b1779fe58` | `already-covered`: `scripts/seed-app-store.ts:52-54` and `PrismaAppRepository.ts:17` already call `shouldEnableApp(dirName, keys ?? foundApp?.keys)`. |
| Fly.io workflow / `fly.toml` | erikmayergit | Mutable `@master` / `@v4` action refs, `flyctl deploy --local-only` bypassing reviewed image promotion, hard-coded customer host, and a `CALCOM_TELEMETRY_DISABLED` build arg that would trip this fork's own blocking telemetry guard. |
| COG-GTM test-coverage PRs #2–#4, #6–#30 | COG-GTM | ~27 unreviewed, CI-unchecked, agent-generated PRs against a base older than this fork's, several targeting Insights/Stripe/DI surfaces this edition does not ship. |
| Enqira team implementation as a cherry-pick | Enqira | ~3,600 lines across 59 files; would activate F-01; carries an ADMIN→OWNER invite escalation and a slug TOCTOU race. Evaluated as an architecture decision, never as an intake. |
| Restoring `packages/features/ee/**` from git history | history is reachable in this clone | That tree carried the Cal.com Commercial License. See [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §3.4 — **must not** be copied or restored unless licence and provenance independently permit it. |

## 8. Interaction With The Upstream Ledger

| Item | Detail |
| --- | --- |
| **`ab21c7f805` has no ledger row, and the reason is structural.** | It is 43 commits before the ledger's declared start `46eb533dbd`. The fix is a decision about whether pre-base upstream commits may receive rows, or whether an "inherited upstream state" section is added — not a missing-row correction. |
| **C-15 is the only candidate here eligible for `-x` provenance.** | `ea0c92a267` is a genuine upstream commit, so it belongs in `UPSTREAM_REVIEW_LEDGER.md` under the normal rules. Everything else in this register is external-fork or fork-owned. |
| **F-01 interacts with a documented gate limitation.** | The 18 stubs type-check perfectly, and `packages/features` / `packages/trpc` do not define `type-check` ([.ai/quality-gates.md](../.ai/quality-gates.md)). Nothing flags `return true` in a function named `checkPermission`. |
| **F-01 suggests a second fork guard.** | `scripts/fork-guard-telemetry.sh` exists because a sync can silently reintroduce removed code. A permission-stub guard is the same pattern applied to the inverse risk: code that must not silently *remain*. |
| **C-13 continues an existing divergence.** | The dead `OUTLOOK_LOGIN_ENABLED` flag is the same "documented flag that controlled nothing" pattern as the telemetry removal (`75a9df1812`). |
| **C-14 qualifies a divergence-register claim.** | [FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md) → *`cal.forte` image branding* says the fork name is baked "through explicit build arguments". True for `NEXT_PUBLIC_APP_NAME` only; two of the three declared args are never passed. |
| **A separate register is required.** | Recording external-fork material in the upstream ledger would imply `-x` provenance for a non-upstream author. This document is that register. |

## 9. Standing Rules For External Intake

1. External forks are **discovery sources only**. Never `git cherry-pick -x` from one — the `-x`
   provenance line would name a commit outside upstream.
2. Re-derive every claim against this tree before recording it. Five claims in this pass did not survive.
3. Where upstream history explains a finding, **upstream is the provenance** and the external fork is
   demoted to symptom reporter.
4. Take the *shape* of a fix, not the patch, unless licence and provenance independently permit
   otherwise — see [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md).
5. Separate generic changes from customer-specific ones. Several sources mix them in a single commit.
6. Treat another fork's licensing analysis as a claim, not authority.
7. A fork that removes a vulnerability it introduced is evidence about **that fork**, not about upstream
   or this tree.
