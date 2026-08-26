# Self-Host Capability Audit — Master Registry

Consolidated inventory of what `cal.forte` actually ships: which capabilities are reachable, which were
stripped by the upstream Cal.diy community-edition conversion, which exist only as residue, and which
defects the tree carries. This document is the **master**; it holds the single ranked candidate registry
and the proposed issue set.

| Item | Value |
| --- | --- |
| Branch of record | `develop` |
| Audited commit | `41689d1d6e3fbef3da14c75ee94ba254542d9235` |
| Upstream mirror | `origin/main` = `176037d0af` |
| Upstream base | Cal.com 6.2.0, merge-base `46eb533dbd` |
| First pass | 2026-08-25 (static) |
| Consolidated | 2026-08-26 — every material claim independently re-derived, the three load-bearing ones adversarially reviewed |
| Repository state | **documentation only** — no application code, schema, workflow, or Docker behaviour changed |

**Companion documents**

| Document | Holds |
| --- | --- |
| [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) | authorization placeholder call graph, per-endpoint verdicts, reproducible tests |
| [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) | team architecture, role model, 22 invariants, external implementation audit |
| [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) | governing provenance policy, MIT scope, the AGPL/Commercial history boundary |
| [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md) | legal URLs, residual hosted-Cal upsells, hard-coded `cal.com` references |
| [EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md) | external-fork evidence register, with per-claim verification verdicts |
| [AUDIT_SESSION_HANDOVER.md](AUDIT_SESSION_HANDOVER.md) | session closing record — carries a verification-delta banner where it is superseded |
| [EXTERNAL_FORK_INTAKE_EVIDENCE.md](EXTERNAL_FORK_INTAKE_EVIDENCE.md) · [RUNTIME_VALIDATION_FINDINGS.md](RUNTIME_VALIDATION_FINDINGS.md) | **source evidence records**, preserved as written. Subordinate to this document — see §8 |

### Why these documents live in `docs/`

Fork **process contracts** (`FORK_*.md`, `UPSTREAM_*.md`, `RELEASE_PROCESS.md`, `SECURITY_REVIEW.md`,
`CALDIY_RELEASE_CONTRACT.md`) live at the repository root, and `.ai/` is explicitly "not public
documentation" ([.ai/index.md](../.ai/index.md)). These audits are neither: they are public reference
material that changes when the code changes, not rules that govern how the fork is operated.

`docs/` currently holds only `docs/api-reference/v2` (generated); upstream's own `docs/` tree was deleted
by the strip commit `ab21c7f805`, so the namespace is free. **Caveat for future syncs:** if upstream
reintroduces a `docs/` site, check these files for path collisions. They are fork-owned and must never be
overwritten by an upstream merge.

## 1. What This Consolidation Changed

Three analysis passes ran concurrently — a static capability audit, a live-deployment runtime session,
and an external-fork intake covering 11 repositories. This pass merged them, re-derived every material
claim against `develop`, and reconciled the conflicts.

### 1.1 Finding-ID crosswalk

Findings are renumbered into one contiguous sequence. Nothing was dropped.

| New | Previous ID | Origin |
| --- | --- | --- |
| **F-01** | `F-01` / intake `C-16` | static audit; corroborated by runtime pass and by an external fork's author |
| **F-02** | intake `C-06` (re-scoped) | external fork (Mitch515), re-scoped onto a different endpoint |
| **F-03** | `F-13` | static audit |
| **F-04** | `F-07` | static audit |
| **F-05** | runtime `F-20` / `RV.1` | runtime session |
| **F-06** | runtime `F-21` / `RV.2`, supersedes static `F-04` | runtime session; extends the static finding |
| **F-07** (+ `a`, `b`, `c`) | intake `C-17`, `C-18`, `C-19` | fork-owned archaeology on upstream history |
| **F-08** | headline row 2 | static audit |
| **F-09** | `F-02` | static audit |
| **F-10** | `F-03` | static audit |
| **F-11** | `F-09` | static audit |
| **F-12** | part of `F-08` | static audit |
| **F-13** | `F-05` | static audit |
| **F-14** | `F-06` | static audit |
| **F-15** | productization §5 | static audit |
| **F-16** | intake `C-14` | fork-owned |
| **F-17** | `F-08` | static audit |
| **F-18** | `F-11` | static audit |
| **F-19** | runtime `F-24` / `RV.5` | runtime session |
| **F-20** | intake `C-13` | fork-owned, externally triggered |
| **F-21** | intake `C-08` | external fork (Mitch515) |
| **F-22** | — | new, surfaced by adversarial review of F-01's reachability |
| **F-23** | runtime `F-22` / `RV.3` | runtime session |
| **F-24** | intake `C-15` (supersedes `C-02`) | upstream regression |
| **F-25** | intake `C-03` | external fork (COG-GTM) |
| **F-26** | intake `C-04` | external fork (COG-GTM) |
| **F-27** | intake `C-01` | external fork (COG-GTM) |
| **F-28** | intake `C-07` | external fork (Mitch515) |
| **F-29** | intake `C-05` | fork-owned |
| **F-30** | `F-10` | static audit |
| **F-31** | runtime `F-25` / `RV.6` | runtime session |
| **F-32** | `F-12` | static audit |
| **D-01** | runtime `F-23` / `RV.4` | runtime session — **deployment layer** |
| **D-02** | part of runtime `F-23` | runtime session — **deployment layer** |

Retired without a successor: intake `C-02` (superseded by `C-15`/F-24 with correct provenance),
`C-09`–`C-12`, `C-20`, `C-21` (deferred or not-applicable — see
[EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md) §5.2 and §7).

### 1.2 Duplicate findings merged

| Merged into | Sources that independently found it | Resolution |
| --- | --- | --- |
| **F-01** | static audit `F-01`; intake `C-16`; runtime §9.2; `Enqira/cal.diy` author comment | One finding. Three independent parties reaching the same conclusion is recorded as corroboration (`E3`), not as three findings. |
| **F-06** | static `F-04` (2 unmounted routers) ⊂ runtime `F-21` (7 orphan client entries + stale adapter) | The runtime inventory is a strict superset and is authoritative. The static framing — "neither is an authorization risk (unreachable)" — did not cover the **inverse** case, which is F-05. |
| **F-15 / F-19** | static productization §5 (`NEXT_PUBLIC_WEBSITE_*_URL`); runtime `F-24` (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`) | Same defect class — a build-inlined `NEXT_PUBLIC_*` advertised as runtime-configurable — recorded as two instances of one pattern, with a shared root cause in §6.6. |
| **F-17 / F-12** | static `F-08` conflated dead paywall residue with the still-mounted licence mutations | Split: `F-17` is inert residue, `F-12` is a mounted endpoint. Different dispositions. |
| **F-24** | intake `C-02` (COG-GTM symptom) and `C-15` (upstream regression) | One finding with **upstream** provenance. COG-GTM is demoted to symptom reporter; the actionable artefact is upstream commit `ea0c92a267`. |

### 1.3 Claims corrected during consolidation

Seven claims from the source passes did not survive re-derivation. They are listed in §8 so they are not
re-raised.

## 2. Confidence, Provenance And Layer Vocabulary

**Confidence** — every finding below carries one.

| Tier | Meaning |
| --- | --- |
| `E1` | code-confirmed — the described code exists at the cited lines |
| `E2` | reproduced — behaviour demonstrated by execution or unambiguous control-flow trace |
| `E3` | corroborated — an independent second source agrees (upstream history, advisory, another party) |
| `RUNTIME` | observed on a live deployment; the observation is fact, its **cause** is separately rated |

**Provenance** — `upstream` (eligible for `git cherry-pick -x`) · `external-fork` (discovery only, never a
patch source) · `fork-owned` (this fork's own audit).

**Layer** — `application` (this repository) · `deployment` (`secure-docker-blueprint`) ·
`process` (fork documentation and CI).

**Capability class**

| Class | Meaning |
| --- | --- |
| `ACTIVE` | Reachable and functional end to end. |
| `BACKEND_ONLY` | Data model / services / API exist; no normal product UI. |
| `FRONTEND_STUBBED` | UI structure exists but is deliberately replaced by a null/no-op/static placeholder. |
| `ORPHAN_FRONTEND` | UI component exists with no usable backend or data source wired. |
| `SCHEMA_RESIDUE` | Database models/enums/relations remain; meaningful product implementation is absent. |
| `PARTIAL` | Significant pieces exist across layers but the capability is not usable end to end. |
| `UNSAFE_PLACEHOLDER` | A stub or permissive placeholder sits in a security-sensitive path. |
| `CONFIRMED_BROKEN` | A wired feature cannot work as shipped. |
| `REMOVED` | Genuinely absent, not merely hidden. |
| `DEAD_RESIDUE` | Present, unreachable, and recommended for deletion. |

Residue is **not** an argument for restoration. Several findings below are recommended for deletion.

## 3. The Stripping Signature

The community-edition conversion is a single upstream commit,
`ab21c7f805 refactor: Cal.diy (#28903)` (Benny Joo, 2026-04-15) — `4080 files changed, 21362
insertions(+), 411881 deletions(-)`, single parent, composed of 2811 deletions, 1030 modifications and 17
additions. It also relicensed the root `LICENSE` from AGPLv3 + Cal.com Commercial to MIT. Everything in
this audit descends from it; it is an **upstream** event, not a `cal.forte` decision.

It left five recognisable signatures. Each is worth searching for on every upstream sync.

**a. Inlined permissive stub classes.** Rather than delete callers of the removed
`packages/features/pbac`, the strip pasted a private stub into each consuming file:

```ts
class PermissionCheckService {
  constructor(_prisma?: unknown) {}
  async checkPermission(..._args: unknown[]) { return true; }
  async hasPermission(..._args: unknown[]) { return true; }
  async getTeamIdsWithPermission(..._args: unknown[]): Promise<number[]> { return []; }
}
```

The asymmetry decides the risk: `checkPermission` fails **open**, `getTeamIdsWithPermission` fails
**closed**. → **F-01**.

**b. Null-rendering components.** `apps/web/modules/event-types/components/EventTypeWebWrapper.tsx:48` —
`const EventTeamAssignmentTab = dynamic(() => Promise.resolve((_props: Record<string, unknown>) => null));`
still mounted at line 202 with real props. → **F-09**.

**c. Hard-coded local constants replacing live data.**
`apps/web/modules/filters/components/TeamsFilter.tsx:38` sets `const teams = null as …`;
`apps/web/modules/onboarding/getting-started/onboarding-view.tsx:29-30` hard-codes
`hasTeamMembership = false`. → **F-10**, **F-13**.

**d. Throwing / no-op library shims.** `packages/platform/libraries/index.ts:137-213`,
`organizations.ts`, `emails.ts:62`, `packages/app-store/delegationCredential.ts:31`,
`apps/web/pages/api/stripe/webhook.ts:10`. → **F-08**, **F-17**.

**e. Removal of one leg of a multi-leg contract while the other legs stay wired.** The most damaging
signature, because nothing type-checks or lints it. The strip removed
`apps/web/pages/api/trpc/apiKeys/[trpc].ts` while leaving the router, the client endpoint entry and the
entire UI in place; and it removed the team branch of the slots event-type resolver while leaving the
team private-link route that depends on it. → **F-05**, **F-02**.

**A sixth pattern, distinct from the strip itself:** `ab21c7f805` also reverted previously merged
upstream fixes **together with their regression tests**, which is why nothing turned red. → **F-07**.

## 4. Layer Maps For Material Capabilities

### 4.1 Team event types and host assignment

The entire backend is intact and modern; only the UI and the authorization layer were removed.

| Layer | State | Evidence |
| --- | --- | --- |
| Prisma / schema | present | `packages/prisma/schema.prisma` — `Host` (61), `HostGroup` (87), `HostLocation` (100), `SchedulingType` (42), `Team` (557), `Membership` (744) |
| Repository | present | `packages/features/host/repositories/HostRepository.ts` (353 lines), `HostLocationRepository.ts`, `packages/features/membership/repositories/MembershipRepository.ts` (741 lines) |
| Service | present | `packages/features/host/services/EventTypeHostService.ts` (218 lines) + `IEventTypeHostService.ts` |
| API / tRPC | present | `viewer.eventTypes.getHostsForAssignment`, `getHostsForAvailability`, `getChildrenForAssignment`, `getHostsWithLocationOptions`, `exportHostsForWeights`, `massApplyHostLocation`, `searchTeamMembers` |
| Authorization | **stub** | `createEventPbacProcedure` team branch (`…/eventTypes/util.ts:158-176`) → F-01 |
| Frontend | **stubbed** | `EventTypeWebWrapper.tsx:48` renders `null` |
| Navigation | absent | no team route; `Kbar.tsx:154` links to a non-existent `/settings/teams` |
| Configuration | partial | `ORGANIZATIONS_ENABLED` gates orgs; **nothing gates teams** |
| Tests | present | `EventTypeHostService.test.ts` (465 lines), `HostRepository.test.ts`, `eventTypes/__tests__/util.test.ts` (mocks the permission service, so it passes against the stub) |
| **End-to-end usable** | **no** | no team creation path; and no UI surface even with a hand-inserted `Team` |

Round-robin selection is likewise intact: `packages/features/bookings/lib/getLuckyUser.ts` (889 lines),
DI-wired into `RegularBookingService.ts:427` and API v2. The API v2 *qualification* step was
**rewritten**, not stubbed — `apps/api/v2/src/lib/services/qualified-hosts.service.ts` still honours
`isFixed`, `ROUND_ROBIN`, contact-owner and routed-member filtering.

Full treatment: [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md).

### 4.2 Authorization (PBAC)

| Layer | State | Evidence |
| --- | --- | --- |
| Prisma / schema | present | `Role`, `RolePermission`, `Membership.customRoleId`; 11 `*pbac*` migrations incl. `20260129090913_enable_pbac_globally` |
| Repository | **absent** | `packages/features/pbac/` (44 files at `ab21c7f805^`) deleted |
| Service | **stub** | 18 inlined `PermissionCheckService` copies |
| API / tRPC | present but hollow | `createTeamPbacProcedure` (1 call site), `createOrgPbacProcedure` (**0**), `createEventPbacProcedure` (10 mount points) |
| API v2 | dead stub | `pbac.guard.ts` returns `true`, but has **zero `@UseGuards` references** and sets `pbacAuthorizedRequest = false` |
| Frontend | absent | `packages/features/pbac/client/*` deleted |
| Tests | present, misleading | `eventTypes/__tests__/util.test.ts` mocks the service |
| **End-to-end usable** | **no** — and unsafe where reachable | |

### 4.3 Organizations

| Layer | State | Evidence |
| --- | --- | --- |
| Prisma / schema | present | `Team.isOrganization`, `OrganizationSettings` (704), `OrganizationOnboarding`, `Profile`, `ManagedOrganization` |
| Repository | partial | `PrismaOrgMembershipRepository.ts`, `ProfileRepository` |
| Service | **stub** | `packages/platform/libraries/organizations.ts` — org billing stub returns `0`; `getBookerBaseUrlSync` falls back to `https://app.cal.com` |
| API / tRPC | absent | no org router; `createOrgPbacProcedure` has zero callers |
| Frontend | absent + filtered | `onboarding-view.tsx:122-127` unconditionally hides the organization plan despite its own comment saying "Only show organization plan for company emails" |
| Navigation | absent | `/onboarding/organization/details` and `/onboarding/organization/brand` do not exist |
| Configuration | present | `ORGANIZATIONS_ENABLED`, `NEXT_PUBLIC_SINGLE_ORG_SLUG` still read at build time by `next.config.ts` — but `ORGANIZATIONS_ENABLED` is a `Dockerfile` ARG **not** passed by the release action |
| **End-to-end usable** | **no** | |

Two findings depend on this row: F-27's reachability changes if orgs are ever enabled, and `scripts/seed.ts`
creates 2 organization `Team` rows plus their sub-teams (F-01).

### 4.4 Webhooks (an `ACTIVE` capability, for contrast)

| Layer | State | Evidence |
| --- | --- | --- |
| Repository / service / tRPC / frontend | present | `packages/features/webhooks/**`, `viewer.webhook` at `viewer/_router.tsx:45`, `/settings/developer/webhooks` |
| Authorization | mixed | personal webhooks correct; **team webhooks bypass the ownership middleware entirely** → F-03 |
| **End-to-end usable** | **yes** for personal webhooks | |

## 5. Application Findings

### 5.1 Authorization and access control

#### F-01 · Permissive authorization placeholders — `UNSAFE_PLACEHOLDER` · `E2`+`E3` · `application`

18 production files each declare a private, byte-identical `PermissionCheckService` stub. The 18 split
three ways, and the split determines risk:

- **11 files / 19 call sites** invoke `checkPermission` → fail **open**
- **6 files** invoke only `getTeamIdsWithPermission` → fail **closed** (degraded features, not holes)
- **1 file** (`packages/features/di/watchlist/containers/watchlist.ts`) is DI wiring calling nothing

`hasPermission` is declared in all 18 and **called by zero sites** — every apparent hit is a local
variable holding a `checkPermission` result. It is dead API surface.

Of the 11 fail-open files, only **two are genuinely cross-tenant**:

| Site | Exposure |
| --- | --- |
| `packages/trpc/server/routers/viewer/eventTypes/util.ts:158-176` | the **sole** authorization for team-owned event types, gating 10 live procedures. Its `delete` handler (`delete.handler.ts:13-31`) discards `ctx` as unused `_ctx` and runs `prisma.eventType.delete({ where: { id } })` with **no ownership re-check** — a destructive cross-tenant write |
| `packages/trpc/server/routers/viewer/eventTypes/heavy/create.handler.ts:107-121` | accepts an arbitrary `teamId` — needs only a bare `Team` id, not a team event type. Its own comment claims the check "will also check for membership"; the stub checks neither |

Three more are dead (`pbacProcedures.ts` — its sole consumer returns `{ reports: [], total: 0 }`;
`createOrgPbacProcedure` — zero consumers; both watchlist services — zero container callers), two operate
only over the caller's **own** memberships (`WebhookRepository` — intra-team escalation;
`teamsAndUserProfilesQuery` / `getUserEventGroups` — UI affordance only), and two need data the default
seed does not create (`getPublicEvent` needs `team.isPrivate`; `BookingAccessService` needs bookings on
team event types).

**Reachability — the load-bearing fact, stated precisely.**

No shipped runtime path creates a `Team`: there is no teams tRPC router, no Next route, no API v2 teams
controller, and `TeamsRepository.create` has zero callers. The published image's entrypoint
`scripts/start.sh` runs only `prisma migrate deploy`, `seed-app-store.ts` and `yarn start`, so a container
started from the published image **automatically** has zero `Team` rows, and every `EventType` takes the
correctly-guarded personal-owner branch at `…/eventTypes/util.ts:150-157`.

But `scripts/seed.ts` `main()` (line 634) is unconditional — no env gate, no early return — and creates
**7 `Team` rows** (3 standalone at 1057/1106/1155, 2 organization rows at 1204/1302, and 2 org sub-teams
at 1275/1344; organizations *are* `Team` rows) together with team-owned `EventType`s and `Membership`s.
It is reachable through a documented path: `yarn dx` → turbo `@calcom/web#dx` dependsOn
`@calcom/prisma#dx` (`turbo.json:393-395`) → `db-setup` = `db-up, db-deploy, db-seed`
(`packages/prisma/package.json:19,17`) → `seed-basic` → `ts-node scripts/seed.ts`
(`agents/commands.md:9,89`). The helpers are idempotent, not additive.

Three qualifiers that must travel with this finding:

1. **"Never seeds" applies to automatic startup only.** `Dockerfile:75` does `COPY scripts scripts` and
   `Dockerfile:88-89` deliberately retains `ts-node` in the runtime image, so an operator with container
   exec can run the seed against production.
2. **On a freshly seeded instance the stubs are not the dominant risk.** The same seed creates
   `admin@example.com` with password `ADMINadmin2022!` (`scripts/seed.ts:1006-1008`) and users whose
   passwords equal their usernames. Anyone who ran it already has trivial admin access. **The stubs
   become the marginal risk on an instance that was seeded and then had real users added** — which is
   the scenario to name.
3. **Severity is narrower and deeper than "18 stubs" suggests.** The headline count inflates breadth
   while obscuring depth: two files matter, and one of them enables a destructive cross-tenant write.

**Verdict: an architectural hazard on a stock deployment, a live destructive cross-tenant write on any
instance carrying seeded team data.** It must not be filed as a demonstrated remote exploit, and it must
not be dismissed as theoretical. Full call graph and 14 reproducible tests:
[PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md).

**Explicit blocker:** F-01 is a hard prerequisite for any Team reactivation (§10, P1-A).

#### F-02 · Public slot lookup resolves event types by slug alone — `E2` · `application` · provenance split

`getEventTypeId` (`packages/trpc/server/routers/viewer/slots/util.ts:355-377`) declares
`isTeamEvent: boolean` in its parameter type (line 362) and **never destructures it**, so it
unconditionally resolves the supplied name as a username (line 367) and calls
`findFirstEventTypeId({ slug: eventTypeSlug, userId })` (line 372). When the name does not resolve,
`userId` is `undefined` and `packages/features/eventtypes/repositories/eventTypeRepository.ts:1116-1138`
skips both compound-unique branches and falls through to an **unordered** `findFirst({ where: { slug } })`
— the branch its own comment labels *"shouldn't happen in practice"*.

Nothing downstream re-checks ownership: `findForSlots` (`eventTypeRepository.ts:1241-1370`) keys purely on
`id` with no owner, team, org or `hidden` predicate, and `getSchedule` is a `publicProcedure`
(`slots/_router.tsx:18`) whose middleware chain (`publicProcedure.ts:5`) is `perfMiddleware` +
`errorConversionMiddleware` — no auth, no rate limit. The real client reaches this path:
`apps/web/modules/schedules/hooks/useSchedule.ts:92` prefers `eventTypeSlug` over `eventTypeId`.

**Two consequences at different severities.**

1. **Functional corruption — the serious one, and it needs no attacker.**
   `apps/web/lib/d/[link]/[slug]/getServerSideProps.tsx:56-57` sets `name = hashedLink.eventType.team.slug`,
   `:112` sets `isTeamEvent = true`, `:116-118` passes them through, and `:130` hardcodes
   `useApiV2 = false` so the tRPC path is taken. Every **team private-link** booker therefore sends
   `usernameList = [teamSlug]`, which resolves to no user, and silently renders **an unrelated owner's
   availability**. The same misfire hits org members requested at the root domain, because
   `packages/features/users/repositories/UserRepository.ts:253-264` pins `organization: null` when no
   `orgSlug` is supplied.
2. **Unauthenticated information disclosure — real but modest.** A junk username plus a guessed slug
   distinguishes `200` from the `NOT_FOUND` at `util.ts:373-375`, giving an instance-wide
   **slug-existence oracle**; on a `200` the caller learns some arbitrary account's free/busy times.
   Conditional escalations: seats-enabled event types also return `bookingUid` and attendee counts
   (`util.ts:1286-1289`), and any caller may set the unguarded `_enableTroubleshooter: true`
   (`slots/types.ts:34`) to obtain host user IDs (`util.ts:1408-1426`).

**Four corrections that must not be lost** (all from adversarial review):

- **Provenance is split.** `ab21c7f805` removed only the *team* branch. The unresolvable-username →
  slug-only fallback **predates it** — before upstream `95a4567f35` (2025-12-20) the body was
  `findFirst({ where: { slug, ...(teamId ? {teamId} : {}), ...(userId ? {userId} : {}) } })`, which
  degenerates identically. `ab21c7f805` **widened the trigger to team requests**; it did not create the
  unauthenticated case. Writing this up as a fork-introduced regression would misattribute upstream
  behaviour to this fork.
- **Not "the lowest-id event type".** `findFirst` has no `orderBy`; which row returns is unspecified.
  **The caller cannot choose the victim** — this is an undirected leak, not a targeting primitive.
- **Not "including hidden event types" as a consequence of this bug.** `getSchedule` already serves a
  hidden event type's slots when addressed correctly — that is upstream's documented `hidden` semantics
  (unlisted, still bookable by direct link). The missing `isTeamEvent` adds nothing there.
- **Severity.** The response is `{ slots: … }` — timestamps, not identities. No auth bypass, no write
  primitive. On a single-account instance the disclosure half has **zero** incremental value, because
  those slots are already public at `/{username}/{slug}`.

Deliberate-or-accidental: this fork has **no `/team/[slug]/[type]` route**, so removing the team branch is
plausibly deliberate pruning alongside that route removal. It nevertheless misbehaves because the
`/d/[link]/[slug]` team path survived.

#### F-03 · Webhook ownership middleware has no team branch — `UNSAFE_PLACEHOLDER` · `E1` · `application`

`packages/trpc/server/routers/viewer/webhook/util.ts:46` guards only two shapes — event-type-scoped and
user-scoped webhooks. A **team** webhook (`teamId` set, `userId = null`, `eventTypeId = null`) matches
neither and falls through to `next()` unchecked. `viewer.webhook.get` then returns the row **including
`secret`** (`WebhookRepository.ts:266`), and `viewer.webhook.edit` updates by id with no owner predicate,
so `subscriberUrl` can be repointed. `viewer.webhook.delete` is safe — it re-scopes with
`{ userId: ctx.user.id }`.

Distinct root cause from F-01: this needs a `teamId` branch in the middleware, not a permission service.
Same reachability gate. Trace: [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) §3.10.

#### F-04 · `disable-signup` bypassable by any valid verification token — `PARTIAL` · `E1` · `application`

`apps/web/app/api/auth/signup/route.ts:26-27` returns from `ensureSignupIsEnabled` **before** the token is
validated or its `teamId` inspected:

```ts
// Still allow signups if there is a team invite
if (token) return;
```

`findTokenByToken` later rejects unknown tokens with 401, so an arbitrary string does not work. But
`packages/features/auth/lib/verifyEmail.ts:65` and `:162` create `VerificationToken` rows with **no
`teamId`** for ordinary email-verification and email-change flows, valid 24 hours. Holding one lets the
bearer create accounts through `selfHostedHandler`'s `else` branch even when `disable-signup` is on — and
that branch never deletes the token (the `verificationToken.delete` call sits inside
`if (foundToken?.teamId)`), so it is **replayable** for its full lifetime.

Upstream behaviour, not a fork regression. Contradicts
[.ai/hardening-checklist.md](../.ai/hardening-checklist.md) §8 → §9.

### 5.2 Route and contract integrity

#### F-05 · API Keys tRPC route missing — `CONFIRMED_BROKEN` · `E2`+`RUNTIME` · `application`

`apps/web/pages/api/trpc/apiKeys/[trpc].ts` does not exist on `develop`, while every other leg remains
wired: `apiKeys: apiKeysRouter` at `packages/trpc/server/routers/viewer/_router.tsx:54`, `"apiKeys"` at
`packages/trpc/react/shared.ts:6`, and live UI at
`apps/web/modules/api-keys/api-keys/components/ApiKeyDialogForm.tsx:31` (`edit`), `:145`
(`utils.client.viewer.apiKeys.create.mutate` — an imperative vanilla call, not a hook) and
`ApiKeyListItem.tsx:40` (`delete`).

`resolveEndpoint` maps a 3-segment path to `parts[1]` (`packages/trpc/react/trpc.ts:32,38-41`, and a
second copy at `apps/web/app/_trpc/trpc-client.ts:16-31`), pinning these calls to the `apiKeys` batch
link. **No handler can serve that path** — verified exhaustively, since this is the finding's single
point of collapse: no `apiKeys` directory and no top-level catch-all under `apps/web/pages/api/trpc/`, no
`apps/web/app/api/trpc` route, no `/api/trpc` rewrite in `apps/web/next.config.ts` (the only `/api/*`
rewrite is the conditional `/api/v2/:path*`), and no trpc rewriting in `apps/web/proxy.ts`. `apiKeys` is
the **only** child of `viewerRouter` lacking a handler directory.

**History** — the file was deleted upstream, not by the fork:

| Commit | Date | Effect |
| --- | --- | --- |
| `cdba1920fc` (#8041, *split up routers to separate lambdas*) | 2023-05-05 | added (+4) |
| `ab21c7f805` (**#28903**) | 2026-04-15 | **deleted** (−4) |
| `07a288bbd8` (**#29517**, *fix(api): missing trpc route added for the api keys*) | 2026-06-08 | **re-added upstream** (+4) |

Verified absent at `46eb533dbd`, `ab21c7f805` and `develop`; present at `176037d0af` and `origin/main`.
`07a288bbd8` is an ancestor of `origin/main` but **not** of `develop`.

**User-visible symptom, stated defensibly.** The requests 404 at the framework level and never reach a
tRPC adapter, so the client receives a non-tRPC response. All three call sites handle the rejection — the
shared `Form` catch (`packages/ui/components/form/inputs/Form.tsx:26-31`) for create, and `onError`
handlers at `ApiKeyDialogForm.tsx:38-40` and `ApiKeyListItem.tsx:46-49` — so the symptom is an **error
toast** with the dialog left open and no key created, changed or revoked. The live session additionally
observed `Unexpected token '<', "<!DOCTYPE "…`, consistent with an HTML 404 body; that specific string is
`RUNTIME` evidence and is **not** derived from source.

`list` is genuinely unaffected: the page reads server-side via `PrismaApiKeyRepository` inside
`unstable_cache` (`…/developer/api-keys/page.tsx:23-30`), **no client component subscribes to
`viewer.apiKeys.list`**, and the `invalidate()` calls sit on code paths that never execute.

Reachable by any authenticated user — the nav entry at `SettingsLayoutAppDirClient.tsx:117-120` carries
no flag or role condition and `page.tsx` gates only on session.

**Severity, honestly.** This is a **functional-availability defect, not a vulnerability**: nothing leaks
and nothing is written, because the handler never executes. It warrants elevated priority for a hardened
fork for one specific reason: a broken `delete` leaves **no UI path to revoke a leaked API key**, and
`apps/api/v2/src/modules/auth/strategies/api-auth/api-auth.strategy.ts` consumes API keys for
authentication — the fork ships both the producer UI and a consumer.

**Ledger conflict → see §9.1.**

#### F-06 · tRPC three-leg parity — `BACKEND_ONLY` / dead surface · `E2` · `application`

Totals verified: **35** client endpoints · **27** `viewerRouter` keys · **28** Next adapters. Only
mismatching rows listed; 27 endpoints agree across all three legs.

| Endpoint | client `ENDPOINTS` | `viewerRouter` | Next adapter | Verdict |
| --- | --- | --- | --- | --- |
| **`apiKeys`** | Y | Y | **–** | **BROKEN — F-05** |
| `appBasecamp3`, `credits`, `delegationCredential`, `featureOptIn`, `filterSegments`, `payments`, `phoneNumber` | Y | – | – | 7 orphan client entries |
| `appsRouter` | – | – | Y | **Stale adapter** — `apps/web/pages/api/trpc/appsRouter/[trpc].ts` is **byte-identical** to `apps/web/pages/api/trpc/apps/[trpc].ts`; a reachable, unreferenced duplicate route on an authenticated router |
| `viewer` | Y | – | Y | **Intentional alias** — `resolveEndpoint` maps 2-segment paths to `parts[0]`; the adapter serves `loggedInViewerRouter`. Recorded so a later audit does not "fix" it |

Each of the seven orphans was verified to have **zero frontend callers**, yet each still constructs an
`httpLink` and an `httpBatchLink` at client bootstrap pointing at a non-existent path. This supersedes the
first pass's narrower finding (2 unmounted routers) and covers the inverse case that framing missed.

### 5.3 Upstream regression governance

#### F-07 · `ab21c7f805` reverted merged upstream fixes together with their tests — `E2` · `upstream` · `process`

**Mechanism confirmed; headcount not.** A source pass reported "13 upstream commits / 24 file paths, all
still reverted". Five were spot-checked:

| Commit | PR | Verdict |
| --- | --- | --- |
| `ea0c92a267` | #27961 `truncateOnWord` | **fully reverted**, source *and* test block; still reverted → **F-24** |
| `3a7122d613` | #27891 `assignmentReason` webhook rollback | **fully reverted**; still reverted → **F-07b** |
| `20dcef6680` | #27818 schedule-title validation | **fully reverted**; still reverted (client-side `pattern` only — **not** a security control) |
| `4c73695d3a` | #27491 booker timezone refresh | **partially** reverted → **F-07a** |
| `21500c7047` | #27309 remove `_count` children query | **REFUTED** — the substantive fix survives on `develop` |

So the count is overstated by at least one. A whole-file check over a 60-file sample of files
`ab21c7f805` *modified* under `packages/lib` and `packages/features` found only **3** byte-identical to an
earlier historical blob: **the rollbacks are hunk-level inside files that were also legitimately stripped
of EE code**, not a wholesale content rollback. Each path needs an individual intentional/accidental
verdict.

**Ledger scoping.** `UPSTREAM_REVIEW_LEDGER.md` has no row for `ab21c7f805`, but its declared scope is
`46eb533dbd..176037d0af` and `ab21c7f805` is **43 commits before** `46eb533dbd`. This is **not** a missing
row inside a claimed range — it is a gap in the fork's review baseline, and that changes how it is fixed.

None of the five is a security fix. The **mechanism** is the concern: a mass commit can revert a merged
fix and delete its regression test together, and neither upstream CI nor this fork's ledger noticed for
four months.

##### F-07a · Booker timezone-refresh fix partially reverted — `E2`

Of the 9 files `4c73695d3a` touched: 3 byte-identical to the pre-fix blob (`useEvent.ts`,
`packages/features/bookings/types.ts`, `publicViewer/event.handler.ts`); 1 deleted outright
(`useStableTimezone.test.ts`, 74 lines); 3 kept unrelated refactor edits with the fix hunks removed
(`BookerWebWrapper.tsx`, `getPublicEvent.ts`, `EventTypeCalendarViewComponent.tsx`); and **2 retain the
fix** (`useStableTimezone.ts`, and the hunk at `packages/platform/atoms/booker/BookerPlatformWrapper.tsx:246-252`).

The inconsistency is live: `BookerPlatformWrapper.tsx:249-250` reads `event.data.restrictionScheduleId`
and `event.data.useBookerTimezone`, but the producer `getPublicEvent.ts` no longer supplies either.

##### F-07b · Webhook payloads carry the rolled-back `assignmentReason` shape — `E2`

All 10 strip sites the upstream rollback added are absent; the runtime guard
`sanitizeAssignmentReasonForWebhook` and its Zod schema do not exist anywhere; and
`packages/features/webhooks/lib/sendPayload.ts:99-103` still carries the wide union including
`{ category: string; details?: string | null }`. The 10 regression tests are gone.

**Scope it correctly:** true for the legacy/unversioned payload paths only.
`packages/features/webhooks/lib/factory/versioned/v2021-10-20/BookingPayloadBuilder.ts:199-204` does
strip it, and `RegularBookingService.ts:2252` builds the correct legacy array shape. The leak is in the
wholesale `...evt` spreads elsewhere.

### 5.4 Stripped and stubbed capability

| ID | Finding | Class | Evidence |
| --- | --- | --- | --- |
| **F-08** | Team management removed; read backend intact | `REMOVED` + `SCHEMA_RESIDUE` | no `viewer.teams` router, no team route under `apps/web/app`, no API v2 teams controller, no create/invite mutation. `MembershipRepository` has **no update/delete** — role management has no data layer, not merely no UI |
| **F-09** | `EventTeamAssignmentTab` | `FRONTEND_STUBBED` | `EventTypeWebWrapper.tsx:48`; platform wrapper comments *"removed as part of EE code removal"*. `EventTypePlatformWrapper.tsx:18` still imports a **type** from a deleted path — invisible to CI because `apps/web` defines no `type-check` script |
| **F-10** | `TeamsFilter` | `ORPHAN_FRONTEND` | `TeamsFilter.tsx:38` hard-codes `null`, line 63 returns `null`; **zero importers**; imports `trpc` without using it. Its sibling `getTeamsFiltersFromQuery.ts` **is** live (`event-types/page.tsx:68`), so `?teamIds=` is still parsed |
| **F-11** | Watchlist organization services | `ORPHAN_BACKEND` | `packages/features/di/watchlist/containers/watchlist.ts:95,123` — `getOrganizationWatchlist{Operations,Query}Service` have **zero callers**. Would become a global blocklist-mutation hole the moment anything imports them |
| **F-12** | Licence-purchase admin mutations | `BACKEND_ONLY` | `viewer.admin.createSelfHostedLicense` / `createCoupon` (`admin/_router.ts:46,52`) POST to `https://goblin.cal.com/v1/license*` and return a `stripeCheckoutUrl` / `promotionCode`. Zero frontend callers; inert without the undocumented `CAL_SIGNATURE_TOKEN`. The wizard UI they served was deleted |

### 5.5 Commercial and branding residue

| ID | Finding | Class | Evidence |
| --- | --- | --- | --- |
| **F-13** | Onboarding v3 `$15/user/mo` team plan chooser | `ACTIVE`, dead-ends | Migration `20260213000000_enable_onboarding_v3_globally` sets the flag `true`; `start.sh` runs `migrate deploy` every boot. `apps/web/app/page.tsx` → `/onboarding/getting-started` shows "With my team — $15/user/mo" (`onboarding-view.tsx:106`; German `15 $/Benutzer/Monat`), then routes to `/onboarding/teams/details`, **which does not exist** |
| **F-14** | `cal.com/signup` upsell on the public booking page | `ACTIVE` | `bookings-single-view.tsx:1037-1060` — for every anonymous booker (`User.hideBranding` defaults `false`), a link to `https://cal.com/signup` and a form posting their email to `https://cal.com/signup?email=…`. Both a commercial upsell and a third-party disclosure |
| **F-15** | Terms/Privacy links point to `cal.com` in the release image | `ACTIVE`, mis-targeted | `constants.ts:190-192` defaults; `release-docker` does not pass the ARGs. Copy reads "you agree to **cal.forte's** Terms"; links go to Cal.com's. Shown on `/signup` **and** the public booking form |
| **F-16** | Branding build args declared but not passed | `E2` | `Dockerfile:22-24` declares three; `docker-build-and-test/action.yml:124-130` passes only `NEXT_PUBLIC_APP_NAME`. Published image still ships `Cal.com, Inc.` and `help@cal.com`. Qualifies a `FORK_DIVERGENCE.md` claim |
| **F-17** | Dead paywall / upsell residue | `DEAD_RESIDUE` | `UpgradeTip.tsx` (zero callers), `/enterprise` (body is `redirect("/")`), `/upgrade` (live route, `mailto:support@cal.com`), `getUserTopBanners` producers stubbed, ~30 `upgrade_*` i18n keys, `apps/web/public/upgrade/*.png` |
| **F-18** | Dead navigation targets | `DEAD_RESIDUE` | `Kbar.tsx:154` → `/settings/teams` (404), `:210` → `/settings/billing` (404), `:181-187` "choose a licence" → `/auth/setup?step=1` (now the admin-user step). Settings nav `license` entry at `SettingsLayoutAppDirClient.tsx:200-203`, same target. `auth/setup/page.tsx:26` accepts steps `"1".."4"` while the wizard builds two |

Full treatment: [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md).

### 5.6 Configuration semantics

#### F-19 · Web Push / VAPID — phantom configuration knob · `E2` · `application` + `process`

`apps/web/modules/notifications/components/WebPushContext.tsx:63-67` subscribes with
`applicationServerKey: urlB64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "")` with **no
guard anywhere in the provider or the render path** — `push-notifications-view.tsx:18` disables only on
`isLoading`. With the variable unset the empty key produces the observed `InvalidAccessError`, which
`:72-79` then catches and mislabels as *"Please enable Google services for push messaging"* — blaming the
browser for a missing server-side value.

The server is correct and asymmetric: `packages/features/notifications/sendNotification.ts` logs
*"Missing VAPID keys. Web push notifications are disabled."* at init (`:22`) and refuses to send via the
`isVapidConfigured` early return (`:52-55`). So the server disables the feature while the client still
offers and attempts it.

**It cannot be configured on a prebuilt image.** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` is build-inlined, is
**not** a root `Dockerfile` ARG (verified — `grep -i vapid Dockerfile` returns nothing), and
`scripts/start.sh` rewrites only `BUILT_NEXT_PUBLIC_WEBAPP_URL`.

**Correction to the source claim.** `docker-compose.yml:103` is in the **`calcom-api`** service, not the
web service — and `IMAGE_BUILD.md` records that the API v2 Dockerfile is not part of the release
artifact. The web service does receive the variable via `env_file: .env` (`docker-compose.yml:61`), where
it is equally inert. So "the fork's compose file advertises a knob on the web image" is too strong; the
accurate statement is that the variable is inert wherever it is set on a prebuilt image, and the compose
file implies otherwise.

Same root cause as F-15 — a build-inlined `NEXT_PUBLIC_*` presented as runtime-configurable. **No keys
were generated or committed.**

#### F-20 · `OUTLOOK_LOGIN_ENABLED` controls nothing while `/api/auth/signin/azure-ad` stays live · `E2`

`apps/web/server/lib/auth/login/getServerSideProps.tsx:91` hardcodes `isOutlookLoginEnabled: false`, and
`apps/web/lib/signup/getServerSideProps.tsx:58` passes only `isGoogleLoginEnabled` — so the button branches
at `login-view.tsx:216` and `signup-view.tsx:652` are both dead. Meanwhile
`next-auth-options.ts:333` registers the provider whenever `OUTLOOK_LOGIN_ENABLED` and the client
credentials are set, leaving the endpoint reachable by direct navigation.

Operators reasonably believe `OUTLOOK_LOGIN_ENABLED=false` disables Microsoft auth. It does not disable
the endpoint, and setting it `true` produces no visible change. Byte-identical upstream — inherited rot,
not a fork mistake, and the same class the fork already acted on when it removed the inert telemetry
module and its phantom opt-out (`75a9df1812`).

#### F-21 · Entra login accepts every Microsoft tenant · `E1`+`E3`

`next-auth-options.ts:333-357` constructs `AzureADProvider` with **no `tenantId`**, so `next-auth`
defaults to the `common` endpoint: every Entra tenant worldwide plus personal Microsoft accounts can
authenticate. There is no environment variable to restrict it.

**Severity is lower than it first appears, and must be stated that way.** This fork already carries the
nOAuth mitigation: `next-auth-options.ts:846-864` requires the Azure `xms_edov` claim and redirects to
`/auth/error?error=unverified-email` when absent. **This is not an account-takeover finding.** What
remains is a genuine tenant-isolation gap. Two amplifiers: `allowDangerousEmailAccountLinking: true`
(`:338`) is what makes the tenant gap matter at all, and the gate is `OUTLOOK_LOGIN_ENABLED`, whose UI is
dead (F-20) while the endpoint stays live.

Off by default — `.env.example:115` ships `OUTLOOK_LOGIN_ENABLED=false`.

#### F-22 · Two conflicting documented local-setup paths · `E1` · `process`

`agents/commands.md:9,89` documents `yarn dx`, which chains through `db-setup` → `db-seed` → `scripts/seed.ts`
and **creates 7 `Team` rows plus an `admin@example.com` account with a published password**.
`agents/rules/reference-local-dev.md:40` documents `yarn workspace @calcom/prisma db-migrate` and never
mentions `db-seed` or `dx` — yet lists the `free:free` / `pro:pro` test users that only exist after
seeding.

Two more traps for anyone testing this: root `package.json:228-231` sets `prisma.seed` to
`./packages/prisma/seed.ts`, **a path that does not exist**, so `yarn prisma db seed` from the repo root
fails and only the workspace-scoped `packages/prisma/package.json:59` path resolves; and `db-up` requires
Docker (`packages/prisma/package.json:18`), without which `run-s` aborts before `db-seed`.

This is the finding that determines F-01's real-world reachability, which is why it is recorded
separately rather than as a footnote.

### 5.7 Diagnosability

#### F-23 · TOTP setup returns an undiagnosable 400 · `E2`+`RUNTIME` · `application`

Routes `apps/web/app/api/auth/two-factor/totp/{setup,enable,disable}/route.ts`, all byte-identical to
`origin/main`.

`setup/route.ts` contains **four explicit `status: 400` returns** — `ThirdPartyIdentityProviderEnabled`
(:46), `UserMissingPassword` (:50), `TwoFactorAlreadyEnabled` (:54), `IncorrectPassword` (:64).
`EnableTwoFactorModal.tsx:111-115` special-cases **only** `IncorrectPassword`; the other three collapse to
`t("something_went_wrong")`.

**Correction to the source claim:** those four are not *every* 400. Two more reach the client through
thrown errors — `parseRequestData.ts:37` (invalid JSON) and `getServerErrorFromUnknown.ts:210` (any
non-`P2025` Prisma error) — and they carry **no `error` key at all**, so `body.error` is `undefined` and
the modal's else-branch fires. Those two are strictly worse than the four.

**The crypto is sound and is not the defect:** `authenticator.generateSecret(20)` → 32 base32 chars,
`symmetricEncrypt` with `CALENDSO_ENCRYPTION_KEY`, length asserted at `enable` and at login, 10 backup
codes from `crypto.randomBytes(5)` stored encrypted, `disable` requiring a password for `CAL` identities.

**The happy path is structurally intact.** For `identityProvider === CAL` with a password and
`twoFactorEnabled === false`, cases 1-3 cannot fire. **The exact cause of the observed live 400 is
therefore UNKNOWN from source** and requires runtime or database evidence — §12 carries the read-only
query.

**Compounding UX defect:** `two-factor-auth-view.tsx:40` computes `canSetupTwoFactor` but uses it **only**
to render an informational alert — the toggle is never disabled. Because `next-auth-options.ts:248-265`
downgrades an `ADMIN` to `INACTIVE_ADMIN` unless the admin password policy is met **and**
`twoFactorEnabled` is true, such an admin has no stated route back to admin capability.

**No proposal may weaken the server-side checks.** Every 400 is a correct refusal; only its presentation
is defective. Password confirmation and TOTP verification must remain exactly as they are.

Related dead surface: `apps/web/components/security/` (`EnableTwoFactorModal.tsx`,
`DisableTwoFactorModal.tsx`, `TwoFactorAuthAPI.ts`, `TwoFactorAuthSection.tsx`, `TwoFactorModalHeader.tsx`)
has **no importers anywhere** — entirely dead, and a duplicate of the live `apps/web/components/settings/`
set.

### 5.8 Correctness defects

| ID | Finding | Ev. | Verified state | Reachability |
| --- | --- | --- | --- | --- |
| **F-24** | `truncateOnWord` ignores `maxLength` and collapses to `"..."` | `E3` | `packages/lib/text.ts:11` hardcodes `substring(0, 148)`; `:15` `Math.min(len, lastIndexOf(" ") = -1)` → `substring(0,-1)` → `""` → result is exactly `"..."`. Test block deleted by `ab21c7f805` | **LIVE** — `apps/web/app/_utils.tsx:11,43,101`, `truncateOnWord(description, 158)` for OpenGraph metadata on public booking pages. Both call sites pass 158, so the ignored-`maxLength` half is currently harmless; the `"..."` collapse is the observable bug. Cosmetic/SEO, not a security boundary. Fix exists upstream: `ea0c92a267` (#27961) |
| **F-25** | `extractBaseEmail` fabricates addresses | `E2` | `packages/lib/extract-base-email.ts:2-6` — `"foo"` → `"foo@undefined"`; `"a@b@c"` → `"a@b"` | Reached from an unauthenticated `publicProcedure` whose schema is `z.string()`, not `z.string().email()` (`publicViewer/checkIfUserEmailVerificationRequired.schema.ts:8-13`). **No bypass demonstrated** — downstream it is a lookup key (guaranteed miss) and a blocklist comparison on the fabricated string, which cannot match a real address. Not a security defect on its own |
| **F-26** | `getProviderName` throws on a bare `integrations:` | `E2` | `packages/lib/CalEventParser.ts:200-207` — `split(":")[1]` is `""`, then `locationName[0]` on `""` is `undefined` → TypeError | Booker-controlled: the `radioInput` branch of `getBookingResponsesSchema.ts:251-275` validates only `optionValue`, leaving `value` free. But `getProviderName` is invoked only via `getLocation`, whose importers are app-store calendar/CRM services — so it needs the organizer to have a connected calendar or CRM |
| **F-27** | CSV export does not neutralise formula prefixes | `E2` | `packages/lib/csvUtils.ts:49-61` handles only `"`, `,` and `\n` — no leading `=`, `+`, `-`, `@`, TAB or CR | **Org-gated** — `BookingsCsvDownload.tsx:47-52` returns `null` unless `user.organizationId`. Exported fields include booker-controlled `title`, `attendees[].name/email`, `location`. The second cited consumer (`UserListTable.tsx:640-654`) is **dead code**: its paging loop uses a hard-coded `{ rows: [] }` and always throws first. Do not justify a fix on that path |
| **F-28** | A failed cosmetic Google Calendar PATCH discards a created event | `E2` | `googlecalendar/lib/CalendarService.ts` — insert at `:283-288`, cosmetic hangout-link `patch` at `:298-319` inside the same `try`, `catch` at `:334-345` **rethrows unconditionally** | **Broader than "throttled"** — nothing discriminates 429/`rateLimitExceeded` from any other error, so **any** PATCH failure discards a successful insert, leaving an orphaned Google event and a booking the app believes failed. Same pattern on the recurring-instance PATCH at `:268-280` |
| **F-29** | HitPay drop-in accepts `message` events from any origin | `E1` | `packages/app-store/hitpay/components/HitPayDropIn.ts:138-173` — no `event.origin` or `event.source` check | App disabled by default (`App.enabled` `@default(false)`) and needs credentials + per-event-type payment config. **Impact bounded:** a spoofed `success` cannot change server-side payment state — `HitpayPaymentComponent.tsx:70-96` only sets a ref and does a client-side `router.replace` |

### 5.9 Low severity and documentation

| ID | Finding | Class | Notes |
| --- | --- | --- | --- |
| **F-30** | Inert PostHog instrumentation | `FRONTEND_STUBBED` | `posthog.capture` in 12 `apps/web` files; **no** `posthog.init`, no `PostHogProvider`, no `posthog-js/react` import anywhere. Calls are inert. Static reading cannot prove zero network egress — §12 |
| **F-31** | Client console warnings | `DEVELOPMENT_WARNING` / `BUNDLE_ARCHITECTURE` | See below |
| **F-32** | Stale references in fork-adjacent documentation | `process` | `agents/knowledge-base.md:91`, `agents/rules/reference-file-locations.md:29`, `agents/rules/patterns-trigger-dev.md:240`, `packages/features/data-table/GUIDE.md:1156` cite `packages/features/ee/**` and `apps/web/modules/ee/**` — deleted by `ab21c7f805`. Also `FeatureOptInService.test.ts:716` `vi.doMock`s `@calcom/features/pbac/services/permission-check.service`, a deleted module — a dangling mock is a silent no-op, so whatever that test intended to assert about permissions is not asserted |

**F-31 detail.** `initReactI18next` is never called anywhere, and `packages/lib/hooks/useLocale.ts:16-29`
calls `useTranslation(namespace)` unconditionally before any context check. **But the repo-wide framing is
too broad:** `apps/web/lib/app-providers.tsx:23,30,117` uses `next-i18next`'s `appWithTranslation`, which
mounts react-i18next's `I18nextProvider`, so the **Pages Router tree has an instance**. The warning fires
only on App Router pages, and `warnOnce` dedupes it to once per page load, not per render. A second,
**un-deduplicated** `console.warn` at `useLocale.ts:65-67` fires per hook call outside App Router context.
`packages/platform/atoms/vite.config.ts:88-89` aliases both flagged modules away, so atoms consumers see
neither.

`markdownToSafeHTML` warns deliberately at `packages/lib/markdownToSafeHTML.ts:5-9` as a bundle-cost guard
with an explicit upstream comment. **17** files import it, of which **9** are client-rendered components
(not the ~13 first reported). **Sanitisation is not weakened** — `md.render()` then `sanitizeHtml()` run
regardless of environment. Stated precisely so it is not mis-escalated: this warning says nothing about
whether any call site renders *unsanitised* markdown; that would be a separate audit of
`dangerouslySetInnerHTML` sites, which this pass did not perform.

## 6. Deployment Findings

These belong to **`secure-docker-blueprint`**, not this repository. Recorded here because the evidence
that excludes application code lives here.

#### D-01 · Mass 429 on static resources — `REVERSE_PROXY_RATE_LIMIT` / `EXTERNAL_WAF_RATE_LIMIT` · `RUNTIME` observation, `E2` exclusion

Observed live: dozens of 429s on `/app-store/*/icon.svg`, `logo.png`, `icon.png`,
`/api/logo?type=favicon-16`, with secondary invalid-Manifest-icon errors.

**Application code excluded — four independent, cumulative barriers:**

1. **No edge rate limiting.** `apps/web/middleware.ts` does not exist — **but the correct statement is
   that Next.js 16 renamed it**: `apps/web/proxy.ts` **does** exist (created and `middleware.ts` deleted
   in `a9a3389039`). It performs **no** rate limiting, and its matcher (`proxy.ts:163-165`) is seven
   explicit paths, none of which matches `/app-store/*`. Anyone re-verifying by grepping for
   `middleware` will wrongly conclude there is no edge layer at all.
2. **No route handler matches `/app-store/*`.** It resolves to Next's static file server over
   `apps/web/public/app-store/`, which is **build-generated and gitignored**, populated by
   `apps/web/scripts/copy-app-store-static.js`. `next.config.ts:514-517` is a 301 redirect *to* that
   static path, not a rewrite into a handler.
3. **All 21 `checkRateLimitAndThrowError` call sites are application handlers** — 8 tRPC, 4 in
   `packages/features/auth/lib`, 7 App Router routes, 2 Pages Router booking routes — every one keyed on
   user id, hashed email or hashed IP. None is static or `/api/logo`.
4. **The limiter is a no-op by default.** `packages/lib/rateLimit.ts:36-41` returns a fixed
   `{success:true, limit:10, remaining:999, reset:0}` whenever `UNKEY_ROOT_KEY` is unset;
   `.env.example:367` ships it empty and `docker-compose.yml` never sets it.

**Upstream corroboration.** `8b17df4621` (#27674, *"Stop using Unkey for IP-based rate limiting"*, an
ancestor of HEAD) states that IP-based rate limiting was migrated *"from Unkey to Cloudflare … Cloudflare
Enterprise Advanced Rate Limiting"*, including *"Global proxy rate limiting (common namespace)"*. Its diff
removes the limiter from the proxy and replaces a matcher that **would** have matched
`/app-store/*/icon.svg` with the narrow seven-path list. That is upstream stating outright that this class
of 429 now originates at the deployment layer.

**Response-shape fingerprints** to distinguish an app 429 from an infrastructure 429 in captured traffic:

| Origin | Body | Headers |
| --- | --- | --- |
| this app, App Router | `{"message":"Rate limit exceeded. Try again in N seconds."}` | **no** `Retry-After` |
| this app, Pages Router | same plus `"data":null` | `X-Trace-Id` |
| `apps/api/v2` | `CustomThrottlerGuard - Too many requests…` | `X-RateLimit-*-<Name>` |
| **anything else** | HTML, or a body with `Retry-After` / `cf-ray` / `server: cloudflare` | **deployment layer** |

**Caveat:** no reverse-proxy configuration exists in this repository (no nginx/traefik/caddy/haproxy
files). That half of the question is `UNVERIFIABLE_STATICALLY` and must be checked against the actual
edge/CDN/WAF configuration.

**Desired architecture:** exempt static paths (`/app-store/*`, `/_next/static/*`, favicons, manifest
icons) from API-style limiting; scope the middleware to `/api/**`. A single page load legitimately issues
dozens of icon requests, so a limiter tuned for API traffic will always misfire on it.

#### D-02 · `/api/logo` has no browser-cacheable `max-age` — contributing factor, not the cause · `E1`

`apps/web/app/api/logo/route.ts:235` sets `Cache-Control: s-maxage=86400, stale-while-revalidate=60` —
`max-age` is genuinely absent (`grep -c max-age` → 0). `s-maxage` is a **shared-cache** directive that
browsers ignore, so every page load re-requests `/api/logo?type=favicon-16` and friends from the origin.
That does not cause D-01, but it materially raises how often a proxy limit is reached and explains the
secondary manifest-icon errors.

A one-line application-side improvement (`public, max-age=86400, s-maxage=86400, stale-while-revalidate=60`)
would reduce origin load and should be raised **upstream** rather than carried as divergence. It is **not**
a fix for D-01.

## 7. Confirmed Facts Versus Hypotheses

Separated explicitly, because several findings mix the two.

| Finding | Confirmed | Hypothesis / requires further evidence |
| --- | --- | --- |
| F-01 | 18 stubs, the 11/6/1 split, 19 call sites, the two cross-tenant files, `delete.handler.ts` has no ownership check, no runtime team-creation path, `seed.ts` creates 7 `Team` rows | Whether any deployed instance actually carries seeded team data |
| F-02 | the code path, the missing destructure, the unordered fallback, no downstream guard, the `/d/[link]/[slug]` team wiring | Whether any instance has duplicate event slugs; how guessable slugs are in practice (no auto-seeded default event types were found) |
| F-05 | absence of the adapter, absence of any alternative handler, the history, the live call sites, the ledger row | The exact HTML 404 body — inferred from source, observed once at runtime |
| F-23 | the four explicit 400s, the two additional thrown 400s, the modal mapping, the toggle never disabling | **Which 400 fired in the observed session — UNKNOWN.** Needs the §12 query |
| F-07 | the mechanism, and 4 of 5 spot-checked commits | The "13 commits / 24 paths" headcount — **not verified**, and overstated by at least one |
| D-01 | application code cannot produce these 429s (4 independent barriers) | **Which** proxy/WAF produces them — unknowable from this repository |
| F-30 | no `posthog.init` anywhere | Whether `posthog-js` emits network traffic without `init` |

## 8. Claims That Did Not Survive Consolidation

| Claim | Source | Disproof |
| --- | --- | --- |
| "Team event types are resolved by slug alone on the public **event** endpoint" | external fork | `getPublicEvent.ts:401-407` requires a matching team. The real defect is on `slots.getSchedule` → F-02 |
| "`21500c7047` (#27309) is among the reverted commits" | fork-owned intake | The substantive fix survives on `develop` |
| "`.ai/branding.md`'s ~52-file `Cal.com` figure is stale; it is now 3 files, all `package.json` author fields" | fork-owned intake | Wrong twice — the 3 files are `.ts`/`.tsx` and none is a `package.json`; the true count across `apps/`+`packages/` is **47**. `.ai/branding.md` is materially accurate |
| "`apps/web/middleware.ts` does not exist, therefore there is no edge layer" | runtime pass | Literally true, materially misleading — Next.js 16 renamed it to `apps/web/proxy.ts`, which exists |
| "`setup/route.ts` has exactly four 400 paths" | runtime pass | Two more reach the client via thrown errors, carrying no `error` key |
| "`docker-compose.yml:103` advertises VAPID on the web image" | runtime pass | That line is in the `calcom-api` service, which is not part of the release artifact |
| "The PBAC guard in API v2 is the most alarming instance — a guard that cannot deny" | external intake | `pbac.guard.ts` has **zero** `@UseGuards` references and sets `pbacAuthorizedRequest = false`. Dead code, not a hole |
| "`~13` client components import `markdownToSafeHTML`" | runtime pass | 17 importers, 9 client components |
| "`ab21c7f805` introduced the slots slug-only fallback" | consolidation draft | It widened the trigger to team requests; the fallback predates it (upstream `95a4567f35`) |

## 9. Documentation Corrections Required

### 9.1 Ledger correction required — **not applied by this pass**

`UPSTREAM_REVIEW_LEDGER.md:76` reads, verbatim:

```
| `07a288bbd8` | Missing API-key tRPC route | `deferred` | Feature/API expansion not required by current fork scope. |
```

Both halves of the rationale are contradicted by F-05:

- **"Feature/API expansion"** — the route existed from 2023-05-05 (`cdba1920fc`) and was removed by
  `ab21c7f805`. `07a288bbd8` is a **4-line restoration of a deleted route**, and its own upstream subject
  is *"missing trpc route added"*. The fairest characterisation is that the row **mischaracterises the
  change**; "fabricated" or "dishonest" would be unfair — upstream's own subject line invites the
  misreading.
- **"not required by current fork scope"** — contradicted by the fork's own shipped surface: the settings
  page is unconditionally linked, the router and client endpoint are registered, and
  `apps/api/v2/.../api-auth.strategy.ts` consumes API keys for authentication. The fork ships **both** the
  producer UI and a consumer. This is the stronger of the two corrections.

**This pass did not edit the ledger.** The task scope is documentation-only, and the ledger *is*
documentation — but editing a disposition row is a **review decision**, not a factual typo fix, and doing
it inside a consolidation pass would be exactly the silent rewrite the fork's own provenance rules exist
to prevent. The correction is therefore recorded here for a deliberate ledger update, which should follow
the `0d164da8dd` precedent of keeping the reversal visible.

`ab21c7f805` also needs a disposition decision — see F-07 for why it is a baseline gap rather than a
missing row.

### 9.2 Other corrections

| Document | Current statement | Evidence |
| --- | --- | --- |
| [.ai/branding.md](../.ai/branding.md) §5 | "`upgrade-view.tsx` is a leftover page" | Reachable at `/upgrade`; emits `mailto:support@cal.com` (F-17) |
| [.ai/branding.md](../.ai/branding.md) §5 | "the old 'buy this Enterprise feature' prompts are **gone**" | True for `LicenseRequired`/`UpgradeTip`; **not** true for F-13 or F-14 |
| [.ai/branding.md](../.ai/branding.md) §5 | "Basic teams ⚠️ schema + ~12 files" | Undercount: `MembershipRepository` alone is 741 lines; `packages/features/host` is 1302 |
| [.ai/branding.md](../.ai/branding.md) §1 | "`NEXT_PUBLIC_APP_NAME` is not even a build-arg … Currently NOT done" | False since `4264193f84`; contradicted by `FORK_DIVERGENCE.md` |
| [.ai/hardening-checklist.md](../.ai/hardening-checklist.md) §8 | `disable-signup` "genuinely blocks registration" | Bypassable with any live `VerificationToken` (F-04) |
| [.ai/env-reference.md](../.ai/env-reference.md) 🟡 | `NEXT_PUBLIC_WEBSITE_*_URL` listed as settable | Build-time only, and not passed by `release-docker` (F-15) |
| [FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md) | image branding baked "through explicit build arguments" | True for one of three declared ARGs (F-16) |
| `agents/rules/reference-local-dev.md` vs `agents/commands.md` | two conflicting setup paths, only one of which seeds | F-22 |
| `agents/knowledge-base.md`, `agents/rules/*`, `packages/features/data-table/GUIDE.md` | cite deleted `ee/**` paths | F-32 |

`agents/rules/**` were **not** edited: they are engineering rules governed by [AGENTS.md](../AGENTS.md),
and rewriting them is a separate deliberate change.

## 10. Ranked Candidate Registry

The single registry. Nothing here is implemented, and no issue has been created.

**Target key:** `cal.forte` = this repository · `sdb` = `secure-docker-blueprint`.

### P1

| ID | Type | Candidate | Evidence | Current state | Provenance | Security relevance | Target | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **P1-A** | Security review + remediation | **PBAC authorization audit** — replace the 18 inlined stubs with one deny-by-default module; add a `scripts/fork-guard-*.sh` in the telemetry-guard style so a `return true` permission stub cannot silently return | F-01 · `E2`+`E3` · [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) | 11 fail-open files / 19 call sites; 2 genuinely cross-tenant; one enables a destructive cross-tenant delete | upstream strip; fork-owned remediation | **Highest in this audit.** Broken access control (CWE-863) with a data-gated trigger. **Not** a demonstrated remote exploit | cal.forte | `NEEDS_SECURITY_WORK_FIRST` |
| **P1-B** | Bug (availability) | **API Keys route restoration** — `git cherry-pick -x 07a288bbd8`, plus the ledger correction in §9.1 | F-05 · `E2`+`RUNTIME` | `CONFIRMED_BROKEN`; upstream fixed 2026-06-08, not integrated | **upstream** — the only candidate here eligible for `-x` | None directly. Indirect: no UI path to revoke a leaked API key | cal.forte | `UPSTREAM_INTAKE` |
| **P1-C** | Security design | **Team authorization prerequisites** — role/ownership invariants defined before any team surface is enabled | [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) §6 (22 invariants), §10.3 (5 gaps an external implementation still had) | No invariant layer; `MembershipRepository` has no write surface | fork-owned; **must not** derive from deleted `ee/teams` | Prerequisite for any team feature | cal.forte | `DOCUMENT_ONLY` — blocked by P1-A |
| **P1-D** | Bug + hardening | **Public slot resolution** — resolve by owner/team and stop the slug-only fallback | F-02 · `E2` | Live functional corruption on team private links; modest unauthenticated slug-existence oracle | **split**: fallback is upstream and predates `ab21c7f805`; the team-branch removal is `ab21c7f805` | Real but modest — undirected availability metadata, no auth bypass, no write primitive | cal.forte | `NEEDS_SECURITY_WORK_FIRST` |

Sequencing: **P1-A first.** It is correct whether or not teams are ever enabled, it converts a silent hole
into an explicit "unsupported", and P1-C is blocked on it. P1-B is independent and the cheapest win in the
registry. P1-D needs an `api-no-breaking-changes` review because changing the fallback to `NOT_FOUND`
alters a public API's behaviour.

### P2

| ID | Type | Candidate | Evidence | Current state | Provenance | Security relevance | Target | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **P2-A** | Maintenance / audit | **Upstream regression review** — give `ab21c7f805` a disposition; decide intentional-vs-accidental per reverted path; record the detection method in `UPSTREAM_SYNC.md` | F-07 · `E2` | 4 of 5 spot-checked commits still reverted; headcount unverified | upstream | None of the five is a security fix; the **mechanism** is the concern | cal.forte | `SAFE_TO_EVALUATE` |
| **P2-B** | Bug (security capability) | **TOTP diagnostics + regression coverage** — map all six 400 paths to actionable messages; disable the toggle where setup is structurally impossible; add lifecycle tests | F-23 · `E2`+`RUNTIME` | Four 400s collapse to a generic string; two more carry no `error` key | upstream (routes byte-identical) | **Availability of a security control.** Server-side checks must not change | cal.forte | `NEEDS_SECURITY_WORK_FIRST` |
| **P2-C** | Productization | **Legal URL runtime/productization design** — choose among the four options assessed; recommendation is local routes as default with runtime substitution as override | F-15 · [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md) §5.4 | Release image links "cal.forte's Terms" to `cal.com/terms`, on the public booking page | fork-owned | None. Legal-correctness and privacy | cal.forte | `HIGH_VALUE_CANDIDATE` |
| **P2-D** | Bug + deployment | **VAPID configuration semantics** — guard the client subscribe; stop implying a build-time variable is runtime-settable; fix the misattributing error message | F-19 · `E2` | Client offers a feature the server has disabled; knob inert on a prebuilt image | app code upstream; compose file fork-owned | None. **No keys generated or committed** | cal.forte + sdb | `SAFE_TO_EVALUATE` |
| **P2-E** | Maintenance / CI | **Environment semantic preflight** — report drift between the shipped env template and the variables the code actually reads, and flag build-time vs runtime confusion | F-15, F-19, F-20 · `E1` | Four phantom knobs confirmed across three passes | fork-owned | Preventive | cal.forte | `SAFE_TO_EVALUATE` |
| **P2-F** | Maintenance / CI | **Endpoint/router parity CI** — assert every `ENDPOINTS` entry that is also a `viewerRouter` child has a matching adapter; prune the 7 orphans and the stale `appsRouter` duplicate | F-06 · `E2` | 1 broken, 7 orphans, 1 stale duplicate | fork-owned | Converts a class of silent breakage into a build failure. ~20 lines, no runtime | cal.forte | `HIGH_VALUE_CANDIDATE` |
| **P2-G** | Feature evaluation | **Team capability architecture** — decide whether multi-tenant teams are wanted, and at what cost | [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) §10 | Read backend intact; write layer, UI and authorization absent | fork-owned; external implementation exists but **must not** be cherry-picked | Adding teams **activates F-01** | cal.forte | `KEEP_DISABLED` — blocked by P1-A and P1-C |
| **P2-H** | Security hardening | **Microsoft tenant-bound authentication** — allow restricting sign-in to a configured Entra tenant | F-21 · `E1`+`E3` | No tenant concept at all; defaults to `common` | external-fork concept | Real tenant-isolation gap; **not** account takeover — the `xms_edov` guard holds | cal.forte | `SAFE_TO_EVALUATE` — sequence after the F-20 decision |
| **P2-I** | Reliability | **Google Calendar retry safety** — keep a created event when the cosmetic enrichment PATCH fails | F-28 · `E2` | `catch` rethrows unconditionally; two affected PATCH sites | external-fork concept | None | cal.forte | `SAFE_TO_EVALUATE` |
| **P2-J** | Deployment | **Deployment smoke checks** — post-deployment verification against a live URL | [EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md) §7 | Pre-publication validation already exists in `docker-build-and-test`; post-deployment does not | fork-owned | Operational assurance | **sdb** | `NOT_APPLICABLE` here |
| **P2-K** | Decision | **Outlook login surface** — wire the flag through, or remove the dead surface with a guard | F-20 · `E2` | Flag inert, endpoint live | fork-owned | Gates P2-H | cal.forte | `SAFE_TO_EVALUATE` |
| **P2-L** | Bug | **`truncateOnWord` restoration** — `git cherry-pick -x ea0c92a267` (restores the test block too) | F-24 · `E3` | Live on public OG metadata | **upstream** — eligible for `-x` | None. Cosmetic/SEO | cal.forte | `UPSTREAM_INTAKE` |

### P3

| ID | Type | Candidate | Evidence | Current state | Provenance | Target | Disposition |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **P3-A** | Maintenance | **Dead endpoint / client configuration cleanup** — `TeamsFilter`, `filterSegments`/`payments` routers, `/enterprise`, `/upgrade`, `UpgradeTip`, orphan watchlist containers, dead Kbar and settings-nav entries, `apps/web/components/security/*`, licence-purchase mutations, `apps/web/public/upgrade/*` | F-06, F-10, F-11, F-12, F-17, F-18, F-23 | `DEAD_RESIDUE` / `ORPHAN_*` | fork-owned | cal.forte | `REMOVE_DEAD_RESIDUE` — one batched, single-purpose change |
| **P3-B** | Maintenance | **i18next warning** — App Router pages only; `warnOnce`-deduped | F-31 | Upstream-shaped; touches every translated component | upstream | cal.forte | `DOCUMENT_ONLY` — do not refactor |
| **P3-C** | Maintenance | **`markdownToSafeHTML` bundle warning** — deliberate guard, sanitisation unaffected | F-31 | 17 importers, 9 client components | upstream | cal.forte | `DOCUMENT_ONLY` |
| **P3-D** | Branding | **Residual Cal.com references** — constants first (`SUPPORT_MAIL_ADDRESS`, `COMPANY_NAME`, `ROADMAP`, `CALCOM_PRIVATE_API_ROUTE`, `CONSOLE_URL`), then the reachable user-facing ones (`error-page.tsx:92`, `sendNotification.ts:15`) | F-16 · [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md) §6 | 47 files carry the literal; most are app-store metadata that legitimately names upstream | fork-owned | cal.forte | `SAFE_TO_EVALUATE` — **preserve `LICENSE` notices** |
| **P3-E** | Bug | **`extractBaseEmail` / `getProviderName` input handling** | F-25, F-26 | Confirmed; no bypass demonstrated | external-fork | cal.forte | `SAFE_TO_EVALUATE` — fold together |
| **P3-F** | Security hardening | **CSV formula-prefix neutralisation** | F-27 | Org-gated; live consumer is the bookings export | external-fork | cal.forte | `SAFE_TO_EVALUATE` |
| **P3-G** | Security hardening | **HitPay `message` origin validation** | F-29 | App off by default; impact client-side only | fork-owned | cal.forte | `DEFERRED` |
| **P3-H** | Maintenance | **Documentation corrections** (§9.2) | — | — | fork-owned | cal.forte | `DOCUMENT_ONLY` |
| **P3-I** | Deployment | **Static-asset rate-limit exemption** and the `/api/logo` cache header | D-01, D-02 | Application excluded with four barriers | fork-owned | **sdb** (D-01) · upstream (D-02) | `NOT_APPLICABLE` here |

**No P0 is assigned.** Nothing in this audit meets the bar of a confirmed severe or actively exploitable
issue on a stock deployment. F-01 is the most serious finding and is deliberately capped at P1 because its
trigger is data-gated and no exploit was demonstrated.

## 11. Proposed Issue Set — Not Created

**Blocking precondition:** `gh issue list -R rubennati/cal.diy` reports *"the 'rubennati/cal.diy'
repository has disabled issues"*. Issues must be enabled in repository settings before any of this can be
filed. That is an owner action; this pass performed no GitHub writes.

Deliberately **not** 17 flat issues. One master tracker, high-value items standing alone, small related
defects grouped.

### Master

**`[tracker] External fork & self-host improvement registry`** — `MAINTENANCE`
Scope: index the five audit documents, the candidate registry, and the standing rules for upstream vs
external-fork provenance. Links every child. Records that no external patch was adopted and no code
changed. Acceptance: every child issue below exists and is linked; `docs/` audits are referenced rather
than duplicated.

### Independent issues

| # | Title | Category | Prio | Blocks / blocked by | Scope | Acceptance evidence |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `security(pbac): replace unconditional "return true" permission stubs with a deny-by-default service` | **SECURITY REVIEW** | P1 | blocks #2, #6 | Consolidate 18 inlined stubs into one explicitly-named module returning `false` / `[]`; add a fork guard so a permissive stub cannot return through a sync. Stage per file — this exceeds the diff-size guidance. | The 14 tests in [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) §5 pass (T-01…T-14 reject, C-01…C-04 still succeed); fork guard fails CI on a reintroduced stub |
| 2 | `[decision] team role and ownership invariants before any team surface is enabled` | **SECURITY REVIEW** | P1 | blocked by #1; blocks #7 | Decide the 22 invariants in [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) §6, explicitly including ADMIN→OWNER **invite** escalation and the slug partial unique index. Design only. | A written invariant set with a disposition per row, and a recorded provenance rule barring restoration of historical EE code |
| 3 | `fix(api): restore the missing apiKeys tRPC route and correct its ledger row` | **CONFIRMED BUG** | P1 | none | `git cherry-pick -x 07a288bbd8` (4 lines). Update `UPSTREAM_REVIEW_LEDGER.md:76` to `integrated-full` **and record why the original rationale was wrong**, per the `0d164da8dd` precedent. | API key create/edit/delete succeed from `/settings/developer/api-keys`; parity check (#4) green |
| 4 | `ci(forte): assert tRPC client/router/adapter parity and prune dead endpoint surface` | **MAINTENANCE** | P2 | pairs with #3 | ~20-line static check across the three legs; remove the 7 orphan `ENDPOINTS` entries and the stale `appsRouter` adapter. No runtime needed. | CI fails on a deliberately removed adapter; 35/27/28 reconciles to a clean set |
| 5 | `fix(slots): resolve event types by owner and stop the slug-only fallback` | **CONFIRMED BUG** | P1 | none | Restore owner/team resolution in `getEventTypeId`; decide whether the fallback throws `NOT_FOUND` — a public-API behaviour change requiring `api-no-breaking-changes` review. | Team private-link booking renders the correct availability; a non-existent username returns `NOT_FOUND` rather than a foreign event type; personal happy path unchanged |
| 6 | `[decision] does cal.forte need multi-tenant team management, and at what cost` | **FEATURE EVALUATION** | P2 | blocked by #1 and #2 | Product/architecture decision only. If pursued: implement independently, never cherry-pick. | A recorded decision plus updates to `FORK_DIVERGENCE.md`, `.ai/state.md` and `.ai/branding.md` if the edition definition changes |
| 7 | `fix(2fa): surface every TOTP setup failure and disable the toggle when setup is impossible` | **CONFIRMED BUG** | P2 | none | Map all six 400 paths to distinct actionable strings; disable the toggle where structurally impossible. **Server-side checks unchanged.** | Regression suite per §12; wrong password surfaces as such; a non-CAL account states the reason |
| 8 | `[decision] self-host Terms and Privacy URL configuration` | **DEPLOYMENT** | P2 | none | Choose among the four assessed options; recommendation is local relative routes as default with runtime substitution as override. | A built image whose Terms/Privacy links do not point at `cal.com`; verified by grepping the bundle |
| 9 | `fix(branding): pass the fork company name and support address as image build args` | **CONFIRMED BUG** | P2 | pairs with #8 | Two build args in `docker-build-and-test/action.yml`. Qualify the `FORK_DIVERGENCE.md` row. | Built bundle contains the fork values, not `Cal.com, Inc.` / `help@cal.com` |
| 10 | `[audit] identify upstream fixes silently reverted by the Cal.diy refactor (#28903)` | **MAINTENANCE** | P2 | none | Produce dispositions, not patches. Extend the scan window past 2026-01-01. Give `ab21c7f805` a baseline decision. | A row per reverted path with an intentional/accidental verdict; a documented detection method in `UPSTREAM_SYNC.md` |
| 11 | `chore(auth): decide whether OUTLOOK_LOGIN_ENABLED is wired through or removed` | **FEATURE EVALUATION** | P2 | blocks #12 | Two legitimate opposite directions. Decide explicitly; if removed, add a guard. | A recorded decision and a `FORK_DIVERGENCE.md` row |
| 12 | `feat(auth): allow restricting Microsoft sign-in to a configured Entra tenant` | **SECURITY REVIEW** | P2 | blocked by #11 | Add a validated tenant env var defaulting to `common` (preserves current behaviour). | Unset / GUID / domain forms all work; the `xms_edov` guard still fires; value never inlined client-side |
| 13 | `fix(googlecalendar): keep a created event when the enrichment PATCH fails` | **CONFIRMED BUG** | P2 | none | Covers **both** PATCH sites. Converting a throw into a warning is a deliberate behaviour change, not a side effect. | Unit tests incl. a non-retryable 403; no orphaned Google event on PATCH failure |
| 14 | `fix(upstream): restore the truncateOnWord maxLength fix reverted by #28903` | **CONFIRMED BUG** | P2 | none | `git cherry-pick -x ea0c92a267`; restores its test block. | OG description for a space-less 148-char description is no longer `"..."`; restored tests pass |
| 15 | `chore: remove dead stripped-feature residue` | **MAINTENANCE** | P3 | after #4 | One batched change covering F-06/F-10/F-11/F-12/F-17/F-18/F-23 residue. Confirm zero importers immediately before deleting — the type-check gate covers 8 of 113 packages. | No route or import regressions; bundle shrinks; `FORK_DIVERGENCE.md` records the removals |
| 16 | `fix(lib): harden extractBaseEmail and getProviderName against malformed input` | **CONFIRMED BUG** | P3 | none | Two small independent defects, grouped because both are input-handling in `packages/lib` with no demonstrated bypass. | Unit tests for `"foo"`, `"a@b@c"`, `"integrations:"` |
| 17 | `security(export): neutralise spreadsheet formula prefixes in CSV export` | **SECURITY REVIEW** | P3 | none | Org-gated today; note that `ORGANIZATIONS_ENABLED` is a Dockerfile ARG not passed by the release action, so reachability changes if orgs are ever enabled. Do **not** justify on the dead members-table path. | Values beginning `= + - @ TAB CR` are neutralised; round-trip tests |
| 18 | `[deployment] exempt static asset paths from API-style rate limiting` | **DEPLOYMENT** | P2 | none | **`secure-docker-blueprint`.** Application excluded here with four independent barriers. | 429s stop on `/app-store/*`; captured headers match no in-app fingerprint |

**Not proposed as issues:** every item in [EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md) §7, plus P3-B
and P3-C (document-only), plus D-02 (raise upstream).

**Labels worth creating alongside** — type (`security-candidate`, `reliability`, `maintenance`,
`branding`, `deployment`), priority (`P0`–`P3`), evidence (`E0`–`E3`), disposition mirroring the ledger
vocabulary, provenance (`src:upstream`, `src:upstream-regression`, `src:external-fork`, `src:fork-owned`),
and scope (`scope:cal.forte`, `scope:secure-docker-blueprint`). The evidence tier is what stops a P2
hardening item from reading as a P0 vulnerability.

## 12. Findings That Still Require Runtime Evidence

| # | Question | How to answer (all read-only) |
| --- | --- | --- |
| 1 | Does any deployed instance carry `Team` rows? Decides F-01, F-03 and half of F-02. | `SELECT count(*) FROM "Team"; SELECT count(*) FROM "Membership";` |
| 2 | Which TOTP 400 fired in the observed session? | `SELECT u.id, u.email, u."identityProvider", u."twoFactorEnabled", (u."twoFactorSecret" IS NOT NULL) AS has_secret, (p.hash IS NOT NULL) AS has_password FROM users u LEFT JOIN "UserPassword" p ON p."userId" = u.id WHERE u.role = 'ADMIN';` |
| 3 | Is `onboarding-v3` enabled in the running deployment? | `SELECT slug, enabled, "updatedAt" FROM "Feature" WHERE slug IN ('onboarding-v3','disable-signup');` |
| 4 | Does the published bundle contain the `$15` badge, the `cal.com/signup` upsell and `cal.com/terms`? | `docker run --rm --entrypoint sh <image> -c "grep -rl '15/user/mo' /calcom/apps/web/.next \| head"` (and the other two strings) |
| 5 | Is the root `LICENSE` present in the image? | `docker run --rm --entrypoint sh <image> -c "ls -la /calcom/LICENSE"` — source says no; confirm before concluding |
| 6 | Which proxy/WAF produces the D-01 429s? | `curl -sSD - -o /dev/null 'https://<host>/app-store/zoom/icon.svg'`, then match against the §6 fingerprint table |
| 7 | Does `posthog-js` emit network traffic without `init`? | Browser network capture on a logged-in page |
| 8 | Does `disable-signup` actually block a POST carrying a live email-verification token? | Runtime test against a staging instance |
| 9 | Which image is actually deployed? | `docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' <image>` and the recorded digests in [FORK_STATUS.md](../FORK_STATUS.md) |

**Deployed-image drift.** `docker-compose.yml:39` still defaults to `ghcr.io/rubennati/cal.diy:v6.2.0-4`
while the current release is `v6.2.0-5`, so a deployment that did not set `CALDIY_IMAGE` is a build
behind. Full drift analysis: [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md) §7.

## 13. Findings Owned By `secure-docker-blueprint`

| Finding | Why it is not this repository's |
| --- | --- |
| **D-01** mass 429 on static resources | Application code excluded by four independent barriers; upstream `8b17df4621` states outright that this limiting now lives at the edge. No reverse-proxy configuration exists in this repository |
| **P2-J** post-deployment smoke checks | Pre-publication validation already exists in `docker-build-and-test`; verification against a live URL is the consumer's responsibility |
| Runtime resource limits, secret management, local compose variants | Already recorded in [.ai/roadmap.md](../.ai/roadmap.md) as deferred to that repository |
| The **content** behind any local `/terms` and `/privacy` routes (P2-C option D) | Deployment-owned; the fork would ship the route, not the text |

**Partly shared:** **P2-D** (VAPID) — the client guard and the error message are application changes; the
compose entry and any build-arg decision are deployment.
