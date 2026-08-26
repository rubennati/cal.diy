# PBAC Placeholder / Authorization Audit

Complete call-graph audit of the permission-check placeholders left behind by the upstream
community-edition strip, and of every procedure wrapper that depends on them.

| Item | Value |
| --- | --- |
| Branch of record | `develop` |
| Audited commit | `41689d1d6e3fbef3da14c75ee94ba254542d9235` |
| Audit date | 2026-08-25 · independently re-verified and adversarially reviewed 2026-08-26 |
| Method | static source reading only — **no instance was deployed, no exploit was executed** |
| Companion | [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) · [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) |

This is a fifth document beyond the four originally scoped. The authorization audit spans
event types, bookings, webhooks, out-of-office, public event pages and API v2 — it is not a
teams topic and not a capability inventory, and burying it inside either would make the one
artifact a reviewer most needs the hardest to find.

## 1. What Was Removed And What Replaced It

Upstream commit `ab21c7f805 refactor: Cal.diy (#28903)` deleted `packages/features/pbac/`
(44 files: domain models, `PermissionRepository`, `RoleRepository`, `permission-registry.ts`,
`permission-check.service.ts`, React hooks). It did **not** delete the call sites. Instead,
each consuming file received a private, inlined replacement class:

```ts
class PermissionCheckService {
  constructor(_prisma?: unknown) {}
  async checkPermission(..._args: unknown[]) { return true; }
  async hasPermission(..._args: unknown[]) { return true; }
  async getTeamIdsWithPermission(..._args: unknown[]): Promise<number[]> { return []; }
}
```

The database side of PBAC was **not** removed: `Role`, `RolePermission` and
`Membership.customRoleId` remain in `packages/prisma/schema.prisma`, and eleven `*pbac*`
migrations still run on boot — including `20260129090913_enable_pbac_globally`. The schema
therefore advertises a permission system that has no implementation.

### The asymmetry that decides everything

| Method | Stub returns | Failure direction | Consequence |
| --- | --- | --- | --- |
| `checkPermission(...)` | `true` | **open** | every caller treats the actor as authorized |
| `hasPermission(...)` | `true` | **open** | *declared in all 18 stubs but called by zero sites* — see below |
| `getTeamIdsWithPermission(...)` | `[]` | **closed** | callers scope to an empty team set; feature degrades, no data leaks |

The 18 files split three ways, and the split is what determines risk:

- **11 files call `checkPermission` → fail OPEN.** These are the audit.
- **6 files call only `getTeamIdsWithPermission` → fail CLOSED.** An empty allow-list narrows results;
  it cannot widen them. These are degraded features, not holes (§4).
- **1 file** — `packages/features/di/watchlist/containers/watchlist.ts` — declares the stub and calls no
  method; it is DI wiring that injects the stub into two fail-open consumers.

`hasPermission` is declared in every stub and **invoked by nothing**. Every apparent call site is a local
variable named `hasPermission` holding a `checkPermission(...)` result. It is dead API surface, and
naming it as a live risk would overstate the finding.

## 2. Inventory Of Stub Declarations

Eighteen production files (plus two test files that mock the service and therefore pass
against the stub).

| # | File | Stub line | Method used | Verdict |
| --- | --- | --- | --- | --- |
| 1 | `packages/trpc/server/procedures/pbacProcedures.ts` | 7 | `checkPermission` | `UNREACHABLE` (§3.1) |
| 2 | `packages/trpc/server/routers/viewer/eventTypes/util.ts` | 15 | `checkPermission` | **`CONFIRMED_UNSAFE`** (§3.2) |
| 3 | `packages/trpc/server/routers/viewer/eventTypes/heavy/create.handler.ts` | 13 | `checkPermission` | **`CONFIRMED_UNSAFE`** (§3.3) |
| 4 | `packages/features/bookings/services/BookingAccessService.ts` | 6 | `checkPermission` | **`CONFIRMED_UNSAFE`** (§3.4) |
| 5 | `packages/features/webhooks/lib/repository/WebhookRepository.ts` | 22 | `checkPermission` | `POTENTIALLY_UNSAFE` (§3.5); see also §3.10 |
| 6 | `packages/features/eventtypes/lib/getPublicEvent.ts` | 28 | `checkPermission` | `POTENTIALLY_UNSAFE` (§3.6) |
| 7 | `packages/trpc/server/routers/viewer/eventTypes/getUserEventGroups.handler.ts` | 14 | `checkPermission` | `POTENTIALLY_UNSAFE` (§3.7) |
| 8 | `packages/trpc/server/routers/viewer/eventTypes/teamAccessUseCase.ts` | 3 | `checkPermission` | `POTENTIALLY_UNSAFE` (§3.7) |
| 9 | `packages/trpc/server/routers/loggedInViewer/teamsAndUserProfilesQuery.handler.ts` | 11 | `checkPermission` | `POTENTIALLY_UNSAFE` (§3.8) |
| 10 | `packages/features/watchlist/lib/service/OrganizationWatchlistOperationsService.ts` | 17 | `checkPermission` | `UNREACHABLE` (§3.9) |
| 11 | `packages/features/watchlist/lib/service/OrganizationWatchlistQueryService.ts` | 6 | `checkPermission` | `UNREACHABLE` (§3.9) |
| 12 | `packages/features/di/watchlist/containers/watchlist.ts` | 29 | wiring only | `UNREACHABLE` (§3.9) |
| 13 | `packages/trpc/server/routers/viewer/bookings/get.handler.ts` | 21 | `getTeamIdsWithPermission` | `SAFE_BY_OTHER_CONTROL` (§4) |
| 14 | `packages/features/eventtypes/lib/getEventTypesByViewer.ts` | 18 | `getTeamIdsWithPermission` | `SAFE_BY_OTHER_CONTROL` (§4) |
| 15 | `packages/trpc/server/routers/viewer/eventTypes/getActiveOnOptions.handler.ts` | 12 | `getTeamIdsWithPermission` | `SAFE_BY_OTHER_CONTROL` (§4) |
| 16 | `packages/trpc/server/routers/viewer/me/get.handler.ts` | 11 | `getTeamIdsWithPermission` | `SAFE_BY_OTHER_CONTROL` (§4) |
| 17 | `packages/trpc/server/routers/viewer/me/checkForInvalidAppCredentials.ts` | 7 | `getTeamIdsWithPermission` | `SAFE_BY_OTHER_CONTROL` (§4) |
| 18 | `packages/trpc/server/routers/viewer/ooo/outOfOffice.utils.ts` | 4 | `getTeamIdsWithPermission` | `SAFE_BY_OTHER_CONTROL` (§4) |

Test files that mock it: `packages/features/bookings/services/BookingAccessService.test.ts:42`,
`packages/features/feature-opt-in/services/FeatureOptInService.test.ts:704`. Also
`packages/trpc/server/routers/viewer/eventTypes/__tests__/util.test.ts` exercises
`createEventPbacProcedure` against a mocked service — so the existing suite proves nothing
about the shipped behaviour.

## 3. Call Graphs

Reading key: `endpoint → wrapper → check → additional scoping → mutation/query`.

### 3.1 `createTeamPbacProcedure` / `createOrgPbacProcedure` — `UNREACHABLE`

```
viewer.bookings.getWrongAssignmentReports          (bookings/_router.tsx:136)
  → createTeamPbacProcedure("booking.readTeamBookings", [ADMIN, OWNER, MEMBER])
      → stub checkPermission  → true          (pbacProcedures.ts:33-38)
  → (no further scoping)
  → getWrongAssignmentReportsHandler
      → return { reports: [], total: 0 }      ← static stub, no query at all
```

`getWrongAssignmentReports.handler.ts` never touches the database. Arbitrary `teamId` input is
accepted and ignored. No data exposure.

`createOrgPbacProcedure` has **zero call sites** anywhere in the tree.

**Verdict:** `UNREACHABLE`. Latent: the moment a real handler is wired behind
`createTeamPbacProcedure`, it inherits an always-true check over a client-supplied `teamId`.

### 3.2 `createEventPbacProcedure` — **`CONFIRMED_UNSAFE`** (gated on a team event type existing)

`packages/trpc/server/routers/viewer/eventTypes/util.ts:103-196`. The middleware loads the
event type by `input.eventTypeId ?? input.id` and then branches:

```ts
if (!event.teamId) {
  // personal event — REAL check
  if (event.userId !== ctx.user.id && !event.users.find(u => u.id === ctx.user.id)) throw FORBIDDEN;
} else {
  // team event — STUB check
  const hasPermission = await new PermissionCheckService().checkPermission({...}); // === true
  if (!hasPermission) throw FORBIDDEN;   // never taken
}
```

Personal event types are correctly protected. **Team event types have no access control at
all** — not even a membership test.

Mount points:

| Endpoint | File:line | Permission requested | Handler does its own check? |
| --- | --- | --- | --- |
| `viewer.eventTypes.get` | `eventTypes/procedures/get.ts:6` | `eventType.read` | no |
| `viewer.eventTypes.delete` | `eventTypes/_router.ts:104` | `eventType.delete` | **no** |
| `viewer.eventTypes.getHostsForAvailability` | `_router.ts:156` | `eventType.update` | no |
| `viewer.eventTypes.getHostsForAssignment` | `_router.ts:170` | `eventType.update` | no |
| `viewer.eventTypes.exportHostsForWeights` | `_router.ts:184` | `eventType.update` | derives `teamId` from the event only |
| `viewer.eventTypes.getChildrenForAssignment` | `_router.ts:198` | `eventType.update` | no |
| `viewer.eventTypes.getHostsWithLocationOptions` | `_router.ts:212` | `eventType.update` | no |
| `viewer.eventTypes.massApplyHostLocation` | `_router.ts:226` | `eventType.update` | no |
| `viewer.eventTypesHeavy.duplicate` | `heavy/_router.ts:19` | `eventType.create` | no |
| `viewer.eventTypesHeavy.update` | `heavy/_router.ts:29` | `eventType.update` | no |

Worst case, `delete`:

```
viewer.eventTypes.delete({ id })
  → createEventPbacProcedure("eventType.delete", [ADMIN, OWNER])
      → event.teamId set → stub checkPermission → true
  → deleteHandler                                   (delete.handler.ts:13-31)
      → prisma.eventTypeCustomInput.deleteMany({ where: { eventTypeId: id } })
      → prisma.eventType.delete({ where: { id } })  ← no ownership predicate
```

The handler even names its context parameter `ctx: _ctx`, i.e. it deliberately does not use
the session. Any authenticated user can delete any team-owned event type by numeric id.

Highest-value read path, `getHostsForAssignment`:

```
viewer.eventTypes.getHostsForAssignment({ eventTypeId })
  → stub check → true
  → EventTypeHostService.getHostsForAssignment          (EventTypeHostService.ts:63)
      → HostRepository.findHostsPaginatedIncludeUserForAssignment
      → returns [{ userId, name, email, avatarUrl, priority, weight, ... }]
```

`email` is returned. `getChildrenForAssignment` (line 97) likewise returns
`owner.email` and `owner.username`.

**Contrast:** the same file exports `eventOwnerProcedure` (line 24) which contains a *real*
team check — `teamMember?.role === "ADMIN" || "OWNER"` — but it has **zero call sites**. The
correct implementation is present and unused; the stubbed one is wired in.

### 3.3 `viewer.eventTypesHeavy.create` — **`CONFIRMED_UNSAFE`**

```
viewer.eventTypesHeavy.create({ teamId, schedulingType, ... })
  → authedProcedure                            ← no PBAC wrapper at all (heavy/_router.ts:11)
  → createHandler                              (heavy/create.handler.ts)
      → if (teamId && schedulingType):
            hasCreatePermission = stub.checkPermission(...)   // === true   (line 107)
            if (!isSystemAdmin && !hasOrgEventTypeCreatePermission && !hasCreatePermission)
                throw UNAUTHORIZED             ← never taken
            data.team = { connect: { id: teamId } }
      → prisma.eventType.create(data)
```

The comment above the check reads *"Only check for team-level permissions — this will also
check for membership"*. That guarantee no longer holds. Any authenticated user can create an
event type owned by an arbitrary `teamId`, then manage it through §3.2.

### 3.4 `BookingAccessService` — **`CONFIRMED_UNSAFE`**, widest blast radius

`packages/features/bookings/services/BookingAccessService.ts:56-138`. Cases 1 and 2 (organizer,
host) are real. Cases 3, 4 and 5 all call the stub:

| Case | Line | Condition | Stub result |
| --- | --- | --- | --- |
| 3 | 87 | booking's event type has a `teamId` | `true` |
| 4 | 115 | booking owner has an `organizationId` | `true` |
| 5 | 128 | **loop over every team the booking owner belongs to** | `true` on the first iteration |

Case 5 is the important one: it applies to **personal** bookings. If the organizer is a member
of at least one team, `doesUserIdHaveAccessToBooking` returns `true` for any caller.

Consumers:

```
viewer.bookings.confirm              (confirm.handler.ts:166)        → confirm/reject someone else's booking
viewer.bookings.getBookingDetails    (BookingDetailsService.ts:16)   → DATA DISCLOSURE: reschedule chain + tracking
viewer.bookings.reportBooking        (reportBooking.handler.ts:30)
viewer.bookings.reportWrongAssignment (reportWrongAssignment.handler.ts:21)
viewer.bookings.hasWrongAssignmentReport (hasWrongAssignmentReport.handler.ts:21)
packages/features/handleMarkNoShow.ts:280                            → mark attendees no-show
apps/api/v2 BookingPbacGuard          (booking-pbac.guard.ts:44)
    → on success sets request.pbacAuthorizedRequest = true
    → RolesGuard (roles.guard.ts:20-24) then SKIPS legacy role checking entirely
```

Seven consumers. `viewer.bookings.getBookingDetails` (`bookings/_router.tsx:82`, `authedProcedure`) was
missed by the first pass of this audit; it routes through
`packages/features/bookings/services/BookingDetailsService.ts:16`, which throws `Forbidden` on a false
result and otherwise returns the booking's reschedule chain and `tracking` payload. It is the clearest
data-disclosure consumer of the three stubbed cases.

The API v2 chain is the sharpest edge: a stubbed check sets a flag that causes the *real*
`RolesGuard` to be bypassed for `/bookings/:bookingUid` read and write endpoints
(`bookings.controller.ts:226,247,570`, `booking-attendees.controller.ts:51,74,98`).

### 3.5 `WebhookRepository` — `POTENTIALLY_UNSAFE`

`packages/features/webhooks/lib/repository/WebhookRepository.ts`. Two sites:

- Lines 417-441: iterates `user.teams` (the caller's own memberships) and stubs `webhook.read`,
  `webhook.update`, `webhook.delete`. A team `MEMBER` receives `canModify: true` /
  `canDelete: true`.
- Line 547: builds the `whereConditions` team filter from `user.teams` with a stubbed
  `webhook.read`.

Scope is confined to teams the caller already belongs to, so this is **privilege escalation
within a team**, not cross-tenant access. Whether it becomes exploitable depends on whether
the write endpoints re-check — not traced here.

**Minimum reproducing test:** user A is `MEMBER` of team T which owns a webhook; assert that
`viewer.webhook.get`/update/delete for that webhook is rejected for A.

### 3.6 `getPublicEvent` — `POTENTIALLY_UNSAFE` (information disclosure)

`packages/features/eventtypes/lib/getPublicEvent.ts:534-556`:

```ts
let canViewPrivateTeamMembers = false;
if (currentUserId && event.teamId) {
  canViewPrivateTeamMembers = await stub.checkPermission({ permission: "team.read", ... }); // true
}
if (event.team?.isPrivate && !canViewPrivateTeamMembers) users = [];
```

`Team.isPrivate` exists specifically to hide member identities on public booking pages. With
the stub, **any logged-in user** — not just team members — sees the member list of a private
team's event. Anonymous visitors are still protected, because the branch requires
`currentUserId`.

Reached through `viewer.public.event` (`publicViewer/event.handler.ts`) and API v2
`event-types.controller.ts`.

### 3.7 Event-group listing — `POTENTIALLY_UNSAFE` (UI affordance)

- `getUserEventGroups.handler.ts:74` — `canCreateEventType` is computed with the stub for each
  team group and surfaced to the UI.
- `teamAccessUseCase.ts:36-44` — `filterTeamsByEventTypeReadPermission` passes every membership
  through, i.e. it filters nothing.

Both iterate the caller's **own** memberships, so no cross-tenant leak. The effect is that the
UI offers actions the user should not have — which then succeed, because §3.2 and §3.3 do not
stop them.

### 3.8 `teamsAndUserProfilesQuery` — `POTENTIALLY_UNSAFE` (UI affordance)

`teamsAndUserProfilesQuery.handler.ts:105-155`. When `input.withPermission` is supplied, every
membership passes the filter and `readOnly` is computed from the stub result rather than from
`[ADMIN, OWNER]`. A `MEMBER` is presented as having write access. Own-memberships only.

There is also a latent index bug worth noting: `hasPermissionForFiltered` is built with
`.filter(...)` (line 122) but indexed in parallel with the *filtered* `teamsData` (line 154).
The two arrays only align when every check passes — which, with the stub, they always do.

### 3.10 Webhook ownership middleware — missing team branch (independent of the stubs)

Not a PBAC placeholder, but found while tracing §3.5 and materially more serious.

`packages/trpc/server/routers/viewer/webhook/util.ts:8-66` is the ownership middleware behind
**every** `viewer.webhook` endpoint (`list`, `get`, `create`, `edit`, `delete`, `testTrigger`,
`getByViewer`). Its final branch reads:

```ts
if (webhook.eventTypeId) {
  ... eventType.userId !== ctx.user.id -> FORBIDDEN
} else if (webhook.userId && webhook.userId !== ctx.user.id) {
  throw new TRPCError({ code: "FORBIDDEN" });
}
```

A **team** webhook has `teamId` set, `userId = null` and `eventTypeId = null`. Both branches are
skipped, so the middleware falls through to `next()` with no check performed at all.

Downstream:

| Endpoint | Handler scoping | Result for a team webhook |
| --- | --- | --- |
| `viewer.webhook.get` | `get.handler.ts:12` — `ctx` is unused (`ctx: _ctx`); calls `webhookRepository.findByWebhookId(id)` | **reads the row including `secret`** (`WebhookRepository.ts:266`) |
| `viewer.webhook.edit` | `edit.handler.ts:24,52` — `findUnique({ where: { id } })` then `update({ where: { id } })`, no owner predicate | **rewrites `subscriberUrl`**, redirecting booking payloads |
| `viewer.webhook.delete` | `delete.handler.ts:18-27` — re-scopes with `{ userId: ctx.user.id }` | no match → silent no-op (safe) |

`edit.handler` does carry an explicit `if (webhook.platform)` ADMIN check (line 46-51);
`get.handler` does not, so platform webhooks are also readable.

**Verdict:** `CONFIRMED_UNSAFE`, gated on a webhook row with `userId = null` existing —
i.e. a team webhook or a platform (OAuth-client) webhook. Unreachable on a clean
`cal.forte` instance for the same reason as §3.2. Distinct root cause: this needs a
`teamId` branch in the middleware, not a permission service.

**Minimum reproducible test:** create `Webhook(teamId = T.id, userId = null, eventTypeId = null,
secret = "s")`; as user `B` (not a member of `T`) call `viewer.webhook.get({ id })` and assert
`FORBIDDEN` and that `secret` is not returned; call `viewer.webhook.edit({ id, subscriberUrl:
"https://attacker.example" })` and assert `FORBIDDEN` and that the row is unchanged.

### 3.9 Watchlist services — `UNREACHABLE`

`OrganizationWatchlistOperationsService` guards `watchlist.create`, `watchlist.update` and
`watchlist.delete` behind the stub (lines 49-56, 64, 69, 79, 129);
`OrganizationWatchlistQueryService` guards reads (line 41). Both are constructed only by
`packages/features/di/watchlist/containers/watchlist.ts:95,123`, and
`getOrganizationWatchlistOperationsService` / `getOrganizationWatchlistQueryService` have
**no callers anywhere in the tree**.

**Verdict:** `UNREACHABLE` today. This is the clearest `REMOVE_DEAD_RESIDUE` candidate in the
audit: dead code that would become a global blocklist-mutation hole the moment anything imports it.

## 4. Fail-Closed Sites — `SAFE_BY_OTHER_CONTROL`

**Six files** call only `getTeamIdsWithPermission`, receive `[]`, and consequently deny. They are listed
for completeness and because each one is a **feature that silently does nothing**. `getEventTypesByViewer.ts`
makes two calls, which is why a call-site count reads as seven:

| Site | Effect of `[]` |
| --- | --- |
| `bookings/get.handler.ts:120` | the four `if (teamIdsWithBookingPermission?.length)` branches (lines 254, 277, 302, 324) never execute → only own bookings are returned; `allAccessibleUserIds` is `[]` so any `userIds` filter other than self throws `FORBIDDEN` (line 159-163) |
| `getEventTypesByViewer.ts:61-71` | team event types are never listed for the viewer |
| `getActiveOnOptions.handler.ts:223` | no team options offered |
| `me/get.handler.ts:111` | `canUpdateTeams` is always `false` |
| `me/checkForInvalidAppCredentials.ts:24` | `{ teamId: { in: [] } }` matches nothing → team credential banners never appear |
| `ooo/outOfOffice.utils.ts:12-20` | `isAdminForUser` returns `false` immediately → nobody can manage another user's out-of-office |

Note the interaction with `filters.teamIds`: `bookings/get.handler.ts:137` still passes the
**client-supplied** `filters?.teamIds` into `getEventTypeIdsFromTeamIdsFilter` (line 877). That
value narrows a result set that is independently scoped by the fail-closed branches above, so
it is not an IDOR today — but it is a client-controlled `teamId` reaching a raw
`$queryRaw`-built `IN` list (parameterised via `Prisma.join`, so not injectable). Worth a
second look during P1-A.

## 5. Minimum Reproducible Authorization Tests

Every `CONFIRMED_UNSAFE` finding needs the same fixture and none of it exists today, because
teams cannot be created through the product. The fixture must be built with direct database
inserts.

**Shared fixture**

1. users `A` and `B`, both with valid sessions
2. `Team T`
3. `Membership(user=A, team=T, role=OWNER, accepted=true)` — and **no** membership for `B`
4. `EventType E` with `teamId = T.id`, `schedulingType = ROUND_ROBIN`
5. `Host(user=A, eventType=E)`
6. `Booking BK` with `userId = A` and `eventTypeId` = a **personal** event type of `A` (for the case-5 test)

**Assertions** (each must currently be expected to FAIL, i.e. the endpoint wrongly succeeds):

| ID | As | Call | Expected after remediation |
| --- | --- | --- | --- |
| T-01 | `B` | `viewer.eventTypes.delete({ id: E.id })` | `FORBIDDEN`; `E` still exists |
| T-02 | `B` | `viewer.eventTypesHeavy.create({ teamId: T.id, schedulingType: "COLLECTIVE", ... })` | `UNAUTHORIZED`; no row created |
| T-03 | `B` | `viewer.eventTypesHeavy.update({ id: E.id, title: "x" })` | `FORBIDDEN` |
| T-04 | `B` | `viewer.eventTypes.getHostsForAssignment({ eventTypeId: E.id })` | `FORBIDDEN`; no email in response |
| T-05 | `B` | `viewer.eventTypes.getChildrenForAssignment({ eventTypeId: E.id })` | `FORBIDDEN` |
| T-06 | `B` | `viewer.eventTypes.massApplyHostLocation({ eventTypeId: E.id, locationType: "inPerson", address: "x" })` | `FORBIDDEN`; no `HostLocation` written |
| T-07 | `B` | `viewer.eventTypes.get({ id: E.id })` | `FORBIDDEN` |
| T-08 | `B` | `viewer.bookings.confirm({ bookingId: BK.id, confirmed: true })` | `FORBIDDEN`; `BK.status` unchanged |
| T-09 | `B` | `handleMarkNoShow` for `BK` | `FORBIDDEN` |
| T-10 | `B` | API v2 `GET /v2/bookings/{BK.uid}` | `403` |
| T-11 | `B` (a `MEMBER` of `T`) | `viewer.webhook` update/delete on a `T`-owned webhook | `FORBIDDEN` |
| T-12 | `B` | `viewer.public.event` for a `T` event where `T.isPrivate = true` | member list empty |
| T-13 | `B` | `viewer.webhook.get({ id })` for a `T`-owned webhook | `FORBIDDEN`; `secret` not returned |
| T-14 | `B` | `viewer.webhook.edit({ id, subscriberUrl })` for a `T`-owned webhook | `FORBIDDEN`; row unchanged |

Control assertions that must keep passing (guard against over-correction):

| ID | As | Call | Expected |
| --- | --- | --- | --- |
| C-01 | `A` | `viewer.eventTypes.delete` on `A`'s **personal** event type | succeeds |
| C-02 | `A` | `viewer.bookings.confirm` on `A`'s own booking | succeeds |
| C-03 | `A` | `viewer.eventTypes.getByViewer` | own event types listed |
| C-04 | anonymous | public booking page for `A`'s personal event | renders |

**Note on running these:** the fixture requires a `Team` row, which the product cannot create.
Building the fixture is itself evidence that the exposure is not reachable through the shipped
UI — but tRPC endpoints are reachable by any authenticated HTTP client regardless of UI.

## 6. Reachability Assessment

This section decides the finding's severity, and it must not be simplified in either direction.

### 6.1 No shipped runtime path creates a Team

Verified exhaustively over all tracked files:

- no `teams` tRPC router under `packages/trpc/server/routers/viewer/`
- no team route under `apps/web/app`
- no API v2 teams controller — `apps/api/v2/src/modules/teams/teams/` holds only `teams.repository.ts`
  and `validators/`, `endpoints.module.ts` imports no `TeamsModule`, and
  `TeamsRepository.create` (`teams.repository.ts:14-18`) has **zero callers**
- the published image's entrypoint `scripts/start.sh` runs only `prisma migrate deploy`,
  `seed-app-store.ts` and `yarn start`

So a container started from the published image **automatically** has zero `Team` rows, every `EventType`
takes the correctly-guarded personal-owner branch at `…/eventTypes/util.ts:150-157`, and an attacker
cannot bootstrap a `Team` themselves.

### 6.2 But the developer seed creates seven of them

`scripts/seed.ts` `main()` (line 634) is unconditional — no environment gate, no early return — and
creates:

| Source | Rows |
| --- | --- |
| `createTeamAndAddUsers` at `:1057`, `:1106`, `:1155` | 3 standalone `Team` rows, each with team-owned `EventType`s and `Membership`s |
| `createOrganizationAndAddMembersAndTeams` at `:1204`, `:1302` | 2 organization rows (organizations **are** `Team` rows — `prisma.team.create` at `:277`) |
| the sub-teams those two create at `:1275`, `:1344` | 2 more `Team` rows |

**Seven `Team` rows**, not the three a first reading suggests. Both helpers are idempotent, not additive —
`createTeamAndAddUsers` swallows the unique-constraint error (`:56-60`) and
`createOrganizationAndAddMembersAndTeams` early-returns on an existing slug (`:149-157`).

The chain is a documented setup path: `yarn dx` → turbo `@calcom/web#dx` dependsOn `@calcom/prisma#dx`
(`turbo.json:393-395`) → `db-setup` = `db-up, db-deploy, db-seed` (`packages/prisma/package.json:19,17`)
→ `seed-basic` → `ts-node scripts/seed.ts`, documented at `agents/commands.md:9` and `:89`.

Two traps for anyone testing this: root `package.json:228-231` points `prisma.seed` at
`./packages/prisma/seed.ts`, **a path that does not exist**, so `yarn prisma db seed` from the repo root
fails and only the workspace-scoped `packages/prisma/package.json:59` path resolves; and `db-up` requires
Docker, without which `run-s` aborts before `db-seed` ever runs.

### 6.3 Three qualifiers that must travel with this finding

1. **"Never seeds" applies to automatic startup only.** `Dockerfile:75` does `COPY scripts scripts` and
   `Dockerfile:88-89` deliberately retains `ts-node` in the runtime image, and `seed-basic` ships. An
   operator with container exec can run the seed against production.
2. **The fork documents two conflicting setup paths.** `agents/commands.md` documents the seeding `yarn dx`;
   `agents/rules/reference-local-dev.md:40` documents a **non-seeding** `db-migrate` — while listing the
   `free:free` / `pro:pro` users that only exist after seeding. Recorded separately as F-22 in the master
   audit.
3. **On a freshly seeded instance these stubs are not the dominant risk.** The same seed creates
   `admin@example.com` with password `ADMINadmin2022!` (`scripts/seed.ts:1006-1008`) and users whose
   passwords equal their usernames. Anyone who ran it already has trivial admin access. **The stubs become
   the marginal risk on an instance that was seeded and then had real users added** — that is the scenario
   this finding is really about.

### 6.4 What a Team row actually enables, per site

The prerequisite is usually a team-owned **`EventType`**, not merely a `Team` row, because
`…/eventTypes/util.ts:150-157` correctly guards personal event types and only falls through to the stub
when `event.teamId` is non-null. The seed satisfies this — each `createTeamAndAddUsers` call passes
`eventTypes: { createMany: … }`.

| Site | Needs |
| --- | --- |
| `createEventPbacProcedure` (10 procedures, incl. the destructive `delete`) | a team-owned `EventType` |
| `heavy/create.handler.ts:107-121` | **only a bare `Team` id** — small sequential integers |
| `BookingAccessService` case 3 | a `Booking` whose event type has a `teamId` |
| `BookingAccessService` case 5 | the booking **owner** to have any `Membership` — widens *personal* bookings |
| `WebhookRepository` | an actual `Membership` for the caller — intra-team escalation only |
| `getPublicEvent` | `team.isPrivate = true`, which **the seed does not create** |

### 6.5 Verdict

**An architectural hazard on a stock deployment; a live destructive cross-tenant write on any instance
carrying seeded team data.**

It must not be reported as a demonstrated remote exploit — no exploit was executed, and no shipped route
lets an attacker create the precondition. It must equally not be dismissed as theoretical: the precondition
is created by a documented developer command, and `viewer.eventTypes.delete` then performs
`prisma.eventType.delete({ where: { id } })` with no ownership re-check.

The trigger also appears the moment any team feature is enabled — which is precisely the change this fork
would make if it pursued team support. **That is why this is ranked ahead of the feature work, not
alongside it.**

`BookingAccessService` case 5 is the exception worth flagging separately: it degrades **personal** booking
access and depends only on the *organizer* having a membership, not on the booking being a team booking.

## 7. Remediation Options (Assessed, Not Implemented)

### Option 1 — Central deny-by-default module (recommended)

Replace the eighteen inlined classes with one fork-owned module that returns `false` from
`checkPermission`/`hasPermission` and `[]` from `getTeamIdsWithPermission`.

- **Security** correct by construction; converts a silent hole into an explicit "unsupported"
- **Effort** small; mechanical
- **Behaviour change** team event-type endpoints start returning `FORBIDDEN` instead of
  succeeding — which is the point, and affects no reachable user flow today
- **Divergence cost** low: the eighteen duplicated classes are already fork-visible on every
  upstream sync; one module is strictly easier to reconcile
- **Licence** entirely new fork code

### Option 2 — Membership-based fallback

Implement `checkPermission` against `Membership.role` using the `fallbackRoles` argument each
call site already passes (that argument is the upstream non-PBAC fallback and is present at
every site).

- **Security** correct for the role model that actually exists; keeps team endpoints functional
- **Effort** small–medium; needs the invariants in [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) §6
- **Divergence cost** medium — it is a real behavioural fork
- **Licence** must be **written from scratch**. The deleted `packages/features/pbac` was under
  AGPLv3 pre-strip (it was outside `ee/`), which is *not* compatible with redistributing this
  MIT tree. See [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §3.
- **Prerequisite for** any team feature

### Option 3 — Remove the wrappers entirely

Delete `createEventPbacProcedure`/`createTeamPbacProcedure` and replace them with the existing
real `eventOwnerProcedure` (which is already in the tree, correct, and unused).

- **Security** correct for event types; does not address `BookingAccessService`, webhooks, or
  `getPublicEvent`
- **Effort** small
- **Divergence cost** medium — larger diff against upstream than Option 1
- **Note** attractive because the correct code already exists at `util.ts:24`; it is the
  narrowest fix that removes real risk

### Option 4 — Do nothing, document only

- **Security** relies entirely on "no teams exist", an unverifiable data property that any
  restore, migration or future feature breaks silently
- **Not recommended**

## 8. Open Questions

1. **Do any deployed instances carry `Team` rows?** Unanswerable from source; requires
   `SELECT count(*) FROM "Team";`. This single query decides whether §6.5's second clause applies.
2. Does anything other than `BookingPbacGuard` set `request.pbacAuthorizedRequest = true`? Only
   `pbac.guard.ts:14` (sets `false`) and `booking-pbac.guard.ts:56` were found; a fresh grep on every
   sync is cheap insurance.
3. Do the API v2 webhook and event-type write endpoints re-check ownership independently of
   `RolesGuard`? Not traced.
4. What state do the eleven PBAC migrations leave `Role` / `RolePermission` in on a fresh database?
   `20260129090913_enable_pbac_globally` suggests upstream expects PBAC on by default, while nothing here
   reads those tables.
5. `packages/features/feature-opt-in/services/FeatureOptInService.test.ts:716` calls
   `vi.doMock("@calcom/features/pbac/services/permission-check.service", …)` — a module path deleted by
   `ab21c7f805`. The service itself declares no stub and does not import it. **A dangling mock of a
   non-existent module is silently a no-op in Vitest**, so whatever that test intended to assert about
   permissions is not being asserted.
6. §3.10 shows the ownership gap is not only in the permission service. A systematic re-read of every
   `.use(...)` middleware in `packages/trpc/server/routers/viewer/**` for missing `teamId` branches was
   **not** performed and should accompany P1-A.
