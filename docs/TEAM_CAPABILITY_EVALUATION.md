# Team Capability Evaluation

Architecture and security investigation of what remains of Teams in `cal.forte`, what is
missing, what was deliberately stubbed, and what would be required before any team feature
could be considered.

| Item | Value |
| --- | --- |
| Branch of record | `develop` |
| Audited commit | `41689d1d6e3fbef3da14c75ee94ba254542d9235` |
| Audit date | 2026-08-25 · consolidated and re-verified 2026-08-26 |
| Method | static source reading, independently re-verified per finding — **no instance was deployed or exercised** |
| Companions | [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) · [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) · [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) · [EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md) |

**Nothing in this document is a recommendation to enable Teams.** It is the evidence a future
decision would need.

## 1. Revalidation Of The Prior Observations

Each previously recorded observation was re-derived from source rather than carried forward.

| # | Prior observation | Verdict | Evidence |
| --- | --- | --- | --- |
| 1 | Prisma still contains `Team` | **confirmed** | `packages/prisma/schema.prisma:557-651` — 70+ fields incl. `hideBranding`, `isPrivate`, `parentId`, `isOrganization`, `rrResetInterval`, `rrTimestampBasis` |
| 2 | Prisma still contains `Membership` | **confirmed** | `schema.prisma:744-766`, `@@unique([userId, teamId])`, indexed on `teamId`, `userId`, `accepted`, `role`, `customRoleId` |
| 3 | `MembershipRole` = MEMBER / ADMIN / OWNER | **confirmed** | `schema.prisma:738-742` — exactly three values, no `@map` |
| 4 | accepted/pending memberships remain | **confirmed** | `Membership.accepted Boolean @default(false)` (line 747) plus a dedicated `@@index([accepted])` |
| 5 | team-linked `VerificationToken` remains | **confirmed** | `schema.prisma:767-782` — `teamId Int?`, `team Team?`, `@@index([teamId])`, `expiresInDays Int?` |
| 6 | signup can consume a team-associated token | **confirmed** | `apps/web/app/api/auth/signup/handlers/selfHostedHandler.ts:34-160`; same in `calcomSignupHandler.ts:94-190` |
| 7 | `MembershipRepository` contains substantial logic | **confirmed, and larger than previously recorded** | 741 lines, 20+ methods |
| 8 | team EventTypes remain | **confirmed** | `EventType.teamId`, `EventType.team`, `EventType.schedulingType` |
| 9 | `Host` / `HostLocation` remain | **confirmed** | `schema.prisma:61-86` and `100-116`; plus `HostGroup` (87-99), not previously recorded |
| 10 | ROUND_ROBIN / COLLECTIVE / MANAGED remain | **confirmed** | `schema.prisma:42-46` |
| 11 | host priority / weights / assignment remain | **confirmed** | `Host.priority`, `Host.weight`, `Host.isFixed`, `Host.scheduleId`, `Host.groupId`, `Host.memberId`; `getLuckyUser.ts` is 889 lines and DI-wired |
| 12 | `EventTypeHostService` remains | **confirmed** | `packages/features/host/services/EventTypeHostService.ts`, 218 lines, implements `IEventTypeHostService` |
| 13 | eventTypes tRPC endpoints for host/team ops remain | **confirmed** | 8 endpoints, enumerated in §3 |
| 14 | `EventTeamAssignmentTab` is frontend-stubbed | **confirmed** | `EventTypeWebWrapper.tsx:48` → `() => null`; platform wrapper says *"removed as part of EE code removal"* |
| 15 | `TeamsFilter` has complete UI but null team data | **confirmed, and stronger** | `TeamsFilter.tsx:38` hard-codes `null`; the component additionally has **zero importers** |
| 16 | the viewer router has no teams CRUD router | **confirmed** | `packages/trpc/server/routers/viewer/_router.tsx` — 27 keys, none is `teams` |

Three corrections and additions to the prior record:

- **`MembershipRepository` has no write surface beyond creation.** It exposes `static create`
  (line 124) and `static createMany` (line 165) and **no** update, delete, role-change or
  accept method. Role management does not merely lack a UI — the data layer for it does not
  exist.
- **`HostGroup` was not previously recorded.** It is a real model with a `Host.groupId`
  relation and is threaded through `EventTypeHostService` and `getLuckyUser`.
- **API v2 has team code but no mounted controllers.** `apps/api/v2/src/modules/teams/`
  contains repositories, services and pipes but **no controller**, and
  `apps/api/v2/src/modules/endpoints.module.ts` imports no `TeamsModule` or
  `OrganizationsModule`. There is no HTTP surface.

## 2. Answers To The Scoped Questions

### A. What is already complete and reusable as current-tree MIT code?

| Component | Path | Size | Quality note |
| --- | --- | --- | --- |
| Team / Membership / Host schema | `packages/prisma/schema.prisma` | — | complete, indexed, with cascade rules |
| `MembershipRepository` | `packages/features/membership/repositories/MembershipRepository.ts` | 741 lines | read side is thorough: `hasMembership` (accepted-only), `findRoleByUserIdAndTeamId`, `searchMembers` (cursor-paginated), `hasAcceptedMembershipByEmail`, `hasPendingInviteByUserId`, `findTeamAdminsByTeamId`, `findAcceptedMembersWithUserProfile`, `listAcceptedTeamMemberIds` |
| `MembershipService` | `packages/features/membership/services/membershipService.ts` | 40 lines | correct: returns `isMember:false` unless `accepted` |
| `HostRepository` | `packages/features/host/repositories/HostRepository.ts` | 353 lines | paginated host queries with search |
| `HostLocationRepository` | `packages/features/host/repositories/HostLocationRepository.ts` | 60 lines | `upsertMany` |
| `EventTypeHostService` | `packages/features/host/services/EventTypeHostService.ts` | 218 lines | interface-first; **`searchTeamMembers` performs its own `hasMembership` check** (line 153) and `exportHostsForWeights` derives `teamId` from the event *"to prevent cross-team enumeration"* (line 186) |
| `LuckyUserService` | `packages/features/bookings/lib/getLuckyUser.ts` | 889 lines | DI-wired into `RegularBookingService.ts:427` and API v2 |
| `createOrUpdateMemberships` | `packages/features/auth/signup/utils/createOrUpdateMemberships.ts` | — | transactional; creates `Profile` for org context |
| Invite email template | `packages/emails/src/templates/TeamInviteEmail.tsx`, `packages/emails/templates/team-invite-email.ts`, `packages/emails/lib/utils/team-invite-utils.ts` | — | complete, but the sender has no callers |
| Tests | `EventTypeHostService.test.ts` (465), `HostRepository.test.ts` (78), `getLuckyUser.test.ts` | — | real unit coverage of the host/round-robin layer |

The backend that survived is **not** low-quality residue. `EventTypeHostService` is
interface-driven, paginated, and contains two explicitly security-motivated design choices.
That is what makes the stubbed authorization above it so incongruous.

### B. What is missing?

| Missing | Consequence |
| --- | --- |
| Team creation (any path) | No `viewer.teams` router, no page, no API v2 controller, no CLI, no seed. A team can only be created by a direct database insert. |
| Membership write layer | `MembershipRepository` has no update/delete. No accept, no decline, no role change, no removal. |
| Invitation issuance | Nothing anywhere creates a `VerificationToken` with a `teamId`. `sendTeamInviteEmail` (`packages/emails/organization-email-service.ts:25`) has zero callers. |
| Team pages | No `/teams`, `/settings/teams`, `/team/[slug]`. `Kbar.tsx:154` links to `/settings/teams`, which 404s. |
| Public team booking page | No `apps/web/app` route renders a team profile. |
| Member list / role UI | Deleted with `apps/web/modules/ee/teams`. |
| Real permission service | `packages/features/pbac` deleted; see [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md). |
| Team billing | `TeamBilling` model remains; `packages/app-store/stripepayment/lib/team-billing.ts` and `TeamBillingPortalService.ts` remain; no router mounts them. |

### C. What was deliberately stubbed?

| Stub | Path | Shape |
| --- | --- | --- |
| Assignment tab | `apps/web/modules/event-types/components/EventTypeWebWrapper.tsx:48` | `dynamic(() => Promise.resolve((_props) => null))` |
| Assignment tab (platform) | `packages/platform/atoms/event-types/wrappers/EventTeamAssignmentTabPlatformWrapper.tsx` | `return null`, with an explicit "removed as part of EE code removal" comment |
| Teams filter | `apps/web/modules/filters/components/TeamsFilter.tsx:38` | `const teams = null as …` |
| Onboarding membership state | `apps/web/modules/onboarding/getting-started/onboarding-view.tsx:29-30` | `hasTeamMembership = false`, `isPendingMembership = false` |
| Organization plan visibility | `onboarding-view.tsx:122-127` | unconditional `return false`, contradicting its own comment |
| Wrong-assignment reports | `packages/trpc/server/routers/viewer/bookings/getWrongAssignmentReports.handler.ts` | `return { reports: [], total: 0 }` |
| Upgrade banners | `packages/trpc/server/routers/viewer/me/getUserTopBanners.handler.ts:16-17` | `async () => null`, `async () => false` |
| Round-robin reassignment | `packages/platform/libraries/index.ts:137,149` | `// No-op in community edition` |
| Org user creation | `packages/platform/libraries/index.ts:198` | throws |
| Permission checks | 18 files | `checkPermission → true` |
| API v2 PBAC guard | `apps/api/v2/src/modules/auth/guards/pbac/pbac.guard.ts` | `return true`, and **never referenced by any `@UseGuards`** |

### D. What is unsafe to expose without new authorization?

Ranked. All are gated on team data existing; see
[PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) §6.

1. `viewer.eventTypes.delete` — unconditional `prisma.eventType.delete` for team events
2. `viewer.eventTypesHeavy.create` — accepts an arbitrary `teamId`
3. `viewer.eventTypesHeavy.update` / `.duplicate`
4. `viewer.eventTypes.getHostsForAssignment` / `getChildrenForAssignment` — return member emails
5. `viewer.eventTypes.massApplyHostLocation` — writes `HostLocation` rows for all hosts
6. `viewer.webhook.get` / `.edit` for team webhooks — reads `secret`, rewrites `subscriberUrl`
7. `BookingAccessService` case 5 — widens **personal** booking access whenever the organizer has any membership
8. `getPublicEvent` — discloses private-team members to any logged-in user

`viewer.eventTypes.searchTeamMembers` is the counter-example: it is a bare `authedProcedure`
accepting an arbitrary `teamId`, but `EventTypeHostService.searchTeamMembers` calls
`membershipRepository.hasMembership` first and throws `Forbidden`. It is safe **by service-layer
control**, and it demonstrates the pattern the other endpoints should follow.

### E. What could be restored with minimal new code?

Honest answer: **almost nothing, and the small items are not the useful ones.**

| Candidate | New code required | Verdict |
| --- | --- | --- |
| Deny-by-default permission service | ~40 lines + 18 call-site edits | small — and it *removes* capability |
| Membership-role permission service | ~150 lines + invariants | small–medium, but it is the gateway to everything else |
| Re-enable the assignment tab UI | a full React tab (host list, priority, weights, groups, locations) | **not** minimal; the deleted implementation was Commercial-licensed and cannot be copied |
| Team creation | router + mutation + slug validation + transaction + owner membership + UI | medium |
| Invitation lifecycle | token issue/expire/consume/revoke + email + accept UI + enumeration handling | medium–large |
| Team settings / member management | repository write layer (absent) + service + UI | large |

The often-repeated framing "the backend is done, we just need UI" is only half right. The
**read** backend is done. The **write** backend for membership does not exist, and the
authorization layer does not exist.

### F. What would require substantial new implementation?

- Any team **management** surface (create, invite, accept/decline, role change, remove, transfer ownership, delete team)
- Public team booking pages and team profile routing
- Team branding (`Team.hideBranding`, `logoUrl`, `brandColor`) plumbed to a UI
- Team billing (models exist; no product path, and none is wanted in a self-host)
- Organizations in any form
- A real PBAC/role system if custom roles (`Membership.customRoleId`, `Role`, `RolePermission`) were ever to be honoured

### G. What should remain disabled for attack-surface reasons?

- **Organizations** — largest surface, least value for a personal/small-team host, and the org
  code paths (`createOrgPbacProcedure`, `getUserOrganizationAndTeams`, `Profile` machinery) are
  the least exercised in this tree.
- **Team billing / Stripe team plumbing** — no self-host reason to sell seats; every
  `STRIPE_*_PRICE_ID` left empty keeps it inert.
- **Custom roles (PBAC)** — the `Role`/`RolePermission` tables are seeded by eleven migrations
  but nothing reads them. Honouring them would mean implementing an entire permission engine.
  A three-value `MembershipRole` is sufficient for a small self-host and is far easier to
  reason about.
- **Managed event types (`SchedulingType.MANAGED`)** — parent/child event propagation across
  users is the most complex assignment mode and the least valuable at this scale.
- **Instant meetings** (`InstantMeetingToken`, `Team.instantMeetingTokens`) — token-bearing
  team surface with no UI.

## 3. Layer Map: Teams

| Layer | State | Evidence |
| --- | --- | --- |
| Prisma / schema | **present** | `Team` (557), `Membership` (744), `MembershipRole` (738), `VerificationToken.teamId` (767), `TeamFeatures` (1405), `TeamBilling` (2607), `Host`/`HostGroup`/`HostLocation` (61/87/100) |
| Repository (read) | **present** | `MembershipRepository` (741 lines), `HostRepository` (353), `HostLocationRepository` (60), `PrismaOrgMembershipRepository` (61) |
| Repository (write) | **absent** | only `MembershipRepository.create` / `.createMany`; no team repository at all in `packages/features` |
| Service | **partial** | `MembershipService` (40), `EventTypeHostService` (218), `LuckyUserService` (889); no team lifecycle service |
| API / tRPC | **partial** | 8 team-adjacent `viewer.eventTypes.*` endpoints + `loggedInViewer.teamsAndUserProfilesQuery`; **no** teams CRUD router |
| API v2 | **absent (unmounted)** | `apps/api/v2/src/modules/teams/**` has repositories/services but no controller; `endpoints.module.ts` imports no teams module |
| Authorization | **stub** | 18 `PermissionCheckService` copies; `webhook/util.ts:46` has no team branch |
| Frontend components | **stubbed / orphaned** | `EventTeamAssignmentTab` → `null`; `TeamsFilter` → `null` with zero importers; `AssignAllTeamMembers.tsx` and `CheckedTeamSelect.tsx` survive in `packages/features/eventtypes/components/` |
| Navigation / routes | **absent** | no team route; dead `Kbar.tsx:154` link to `/settings/teams` |
| Configuration / env | **partial** | `ORGANIZATIONS_ENABLED` gates orgs only; **nothing gates teams** — there is no kill switch to point at |
| Tests | **partial** | host/round-robin well covered; zero tests for team lifecycle or team authorization |
| **End-to-end usable** | **no** | Team creation is impossible through the product; even a hand-inserted `Team` row surfaces no UI |

## 4. Current Role Semantics, Derived From Code

There is **no central definition** of what MEMBER/ADMIN/OWNER may do. Semantics are whatever
each call site's inline comparison says. Every occurrence found:

| Location | Rule expressed | Notes |
| --- | --- | --- |
| `packages/features/membership/services/membershipService.ts:30-32` | `isOwner = role === OWNER`; `isAdmin = isOwner \|\| role === ADMIN`; requires `accepted` | the closest thing to a canonical definition; **no callers were traced** |
| `packages/trpc/server/routers/viewer/eventTypes/util.ts:69-73` (`eventOwnerProcedure`) | team event requires `ADMIN` or `OWNER` | correct — and **unused** |
| `createEventPbacProcedure` `fallbackRoles` arguments | `[ADMIN, OWNER]` for create/update/delete; `[ADMIN, OWNER, MEMBER]` for read | the argument is passed everywhere and **never consulted**, because the stub ignores it |
| `packages/features/auth/signup/utils/createOrUpdateMemberships.ts:64-71` | token signup creates `role: MEMBER, accepted: true` | the only role assignment in the tree |
| `MembershipRepository.findTeamAdminsByTeamId:583` | `role in [ADMIN, OWNER]` **and** `team.parentId != null` | sub-team scoped only |
| `apps/api/v2/src/modules/auth/guards/roles/roles.guard.ts` + `apps/api/v2/src/lib/roles/constants.ts` | ordered `TEAM_ROLES` / `ORG_ROLES` with `hasMinimumRole`, org-admin outranks team | **the only real, ordered role model in the tree** — and it is only reachable on API v2 routes that are not mounted for teams |
| `packages/app-store/_utils/throwIfNotHaveAdminAccessToTeam.ts` | admin-access assertion for app installs | present, app-store scoped |

**Conclusion:** the intended semantics are recoverable (ADMIN ⊂ OWNER, accepted required,
MEMBER reads) but they are expressed as scattered string comparisons in at least seven places
and are enforced in none of the reachable team paths. `roles.guard.ts` shows what a proper
ordered model looks like and is the natural template — it is MIT current-tree code.

## 5. Invitation Lifecycle, As It Exists Today

```
[ MISSING ]  issue invite  → nothing creates VerificationToken{ teamId }
[ MISSING ]  send email    → sendTeamInviteEmail() has zero callers
[ PRESENT ]  redeem        → POST /api/auth/signup?token=…
                              ensureSignupIsEnabled: `if (token) return;`   ← before validation
                              findTokenByToken   → 401 if unknown
                              throwIfTokenExpired→ 401 if past `expires`
                              validateAndGetCorrectedUsernameForTeam
                              prisma.user.upsert
                              createOrUpdateMemberships → role MEMBER, accepted TRUE
                              prisma.verificationToken.delete   ← ONLY inside the teamId branch
[ MISSING ]  decline / revoke / resend / expire-sweep
```

Four properties worth recording before any invite feature is designed:

1. **Auto-accept on redemption.** `createOrUpdateMemberships` sets `accepted: true`. There is no
   pending state for token signups — which is why
   `apps/web/app/(use-page-wrapper)/onboarding/getting-started/page.tsx:31-36` redirects users
   with any membership straight past the plan chooser.
2. **Single-use only on the team path.** The `verificationToken.delete` call sits inside
   `if (foundToken?.teamId)`. A token **without** a `teamId` is never consumed and is replayable
   for its full 24-hour life.
3. **The `disable-signup` gate is opened by any token.** `route.ts:26` returns before validation,
   so email-verification tokens (`verifyEmail.ts:65`, `:162` — created with no `teamId`) also
   open it. See **F-04** in the capability audit (filed as GitHub issue #38). This finding was
   `F-07` in the pre-consolidation static-audit numbering; `F-07` now names an unrelated
   upstream-revert finding.
4. **Email normalization is partial.** `selfHostedHandler.ts:28` lowercases the email;
   `MembershipRepository.hasAcceptedMembershipByEmail:611` lowercases on lookup. No
   normalization of `+` aliases or Unicode confusables, and `VerificationToken.identifier` is
   stored as given at `verifyEmail.ts:66`.

## 6. Invariants That Would Have To Hold Before Any Team Feature Ships

Each row states the invariant, whether anything enforces it today, and what would have to
exist. **None of this is implemented, and this document does not propose implementing it.**

| # | Invariant | Enforced today? | What would be needed |
| --- | --- | --- | --- |
| 1 | MEMBER cannot manage membership | **no** — no membership mutations exist at all | a write layer that role-gates every mutation |
| 2 | ADMIN cannot grant OWNER | **no** | explicit target-role validation; decide deliberately whether OWNER is grantable |
| 3 | ADMIN cannot remove or demote OWNER | **no** | actor-role vs target-role comparison on every change |
| 4 | Destructive operations are OWNER-only (delete team, transfer ownership) | **no** | dedicated OWNER assertions, not "isAdmin" |
| 5 | The last OWNER cannot be removed or demoted | **no** | `COUNT(role=OWNER)` guard **inside** the same transaction as the change |
| 6 | Accepted membership required for member-scoped reads | **partial** | `hasMembership` (accepted-only) exists and is used by `searchTeamMembers`; every other endpoint bypasses it |
| 7 | Cross-team ids must not permit IDOR | **no** | see [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) §3.2/§3.3 — arbitrary `teamId` and `eventTypeId` are accepted |
| 8 | Team event access derives from team membership | **no** | the stub bypasses it entirely |
| 9 | Host assignment cannot pull users from another team | **partial** | `createEventPbacProcedure` validates `input.users ⊆ team members` (`util.ts:186-200`) and `eventOwnerProcedure` does the same (`util.ts:79-84`) — but only when `input.users` is supplied; `massApplyHostLocation` and direct `Host` writes are not covered |
| 10 | Public team pages expose only intended information | **no** | `getPublicEvent` `isPrivate` handling is stubbed |
| 11 | Pending invitations grant no accepted-member privileges | **n/a today** | token signup auto-accepts; a real invite flow must introduce a genuine pending state |
| 12 | Invitation tokens expire | **partial** | `throwIfTokenExpired` works, but `expires` is set only by the creator — and no creator exists |
| 13 | Invitation tokens are single-use | **partial** | consumed only on the `teamId` path (§5.2) |
| 14 | Invitations can be revoked | **no** | no revoke path; deletion of the token row is the only mechanism |
| 15 | Email normalized before matching | **partial** | lowercasing only (§5.4) |
| 16 | Enumeration resistance | **no** | `signup` returns a distinguishable 409 `USER_ALREADY_EXISTS`; acceptable for signup, must be re-evaluated for an invite endpoint |
| 17 | Slug collisions handled | **partial** | `Team.@@unique([slug, parentId])` (schema:648) enforces uniqueness at the database level; no application-level pre-check exists because no creation path exists |
| 18 | User slug vs team slug collision | **unhandled** | `User.username` and `Team.slug` occupy the same public path namespace (`/[user]` vs a future `/team/[slug]`); `isUsernameReservedDueToMigration` exists for users only |
| 19 | Concurrent team creation is safe | **n/a** | must be a transaction that creates `Team` + OWNER `Membership` atomically, relying on the unique index rather than a read-then-write check |
| 20 | CSRF assumptions hold for mutations | **inherited** | tRPC mutations ride NextAuth session cookies; `NEXTAUTH_COOKIE_DOMAIN` and `ALLOWED_HOSTNAMES` are the current controls. **Not independently verified in this audit.** |
| 21 | Transaction boundaries are correct | **partial** | `createOrUpdateMemberships` uses `prisma.$transaction`; nothing else does |
| 22 | Role changes are auditable | **no** | `Membership` has `createdAt`/`updatedAt` but no audit row; `packages/features/booking-audit` exists for bookings only and would need extending |

Invariants 5, 7, 8 and 18 are the ones that cannot be retrofitted cheaply. 5 needs
transaction-scoped counting; 7 and 8 need the permission layer; 18 is a routing-namespace
decision that must be made **before** the first team slug is ever issued, because changing it
later breaks public links.

## 7. Reachability Summary

On a `cal.forte` container started from the **published image** and used through the product:

- a team **cannot be created through any shipped runtime path** — no tRPC router, no Next route, no API v2
  controller, and `TeamsRepository.create` has zero callers
- the entrypoint `scripts/start.sh` runs only `prisma migrate deploy`, `seed-app-store.ts` and `yarn start`
- therefore no `Membership`, team `EventType`, `Host` or team `Webhook` row comes into existence
  automatically, and every team-gated authorization gap in
  [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) has **no reachable exploit on that instance**

**But this is a property of the data, not of the code, and one documented command creates the data.**
`scripts/seed.ts` `main()` is unconditional and creates **7 `Team` rows** — 3 standalone, 2 organization
rows, 2 org sub-teams — together with team-owned `EventType`s and `Membership`s. It is reached by
`yarn dx` → `db-setup` → `db-seed` → `seed-basic`, documented at `agents/commands.md:9,89`. The runtime
image also retains `ts-node` and ships `scripts/`, so an operator with container exec can run it against
production.

Two further qualifiers, because severity depends on them:

- On a **freshly seeded** instance the authorization stubs are not the dominant risk — the same seed
  creates `admin@example.com` with the published password `ADMINadmin2022!` and users whose passwords
  equal their usernames. The stubs matter on an instance that was **seeded and then had real users
  added**.
- The fork documents **two conflicting setup paths**: `agents/commands.md` documents the seeding `yarn dx`,
  while `agents/rules/reference-local-dev.md:40` documents a non-seeding `db-migrate` — yet lists the
  `free:free` / `pro:pro` users that only exist after seeding.

The precondition also appears the moment any team feature is enabled. That is exactly why the
authorization work is ranked ahead of the feature work in
[SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) §10, and why §10.4 of this document calls
F-01 a hard prerequisite. Full reachability analysis:
[PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) §6.

## 8. Licensing Constraint On Any Future Team Work

The deleted team implementation lived in `packages/features/ee/teams` and
`apps/web/modules/ee/teams`, both governed by `packages/features/ee/LICENSE` —
**the Cal.com Commercial License**, which forbids copying, publishing, distributing and
sublicensing without a valid Cal.com Enterprise subscription.

Recovering it with `git show <pre-strip>:packages/features/ee/teams/...` is technically trivial
and **must not be done**. Any team feature in `cal.forte` has to be written from scratch, using
the current-tree MIT interfaces (`IEventTypeHostService`, `MembershipRepository`, the Prisma
schema) as the specification. Full analysis, including the different — and also incompatible —
status of the AGPLv3 `packages/features/pbac`, is in
[LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md).

## 9. Open Questions

1. Does any existing `cal.forte` deployment already contain `Team` or `Membership` rows? Not
   answerable from source; decides whether §7 holds in practice.
2. `MembershipService` (`membershipService.ts`) has no traced callers — is it dead code, or is
   it reached through a path this audit missed?
3. `Membership.customRoleId` → `Role` is a live foreign key. What do the eleven PBAC migrations
   leave in `Role`/`RolePermission` on a fresh database, and does anything read it?
4. `packages/features/eventtypes/components/AssignAllTeamMembers.tsx` has **zero importers**
   and is orphaned alongside the assignment tab. `CheckedTeamSelect.tsx` is re-exported by the
   barrel `apps/web/modules/event-types/components/index.ts:3` and its `CheckedSelectOption`
   type is imported by `packages/features/eventtypes/components/dialogs/HostEditDialogs.tsx:23`
   — whether `HostEditDialogs` itself is reachable was not traced.
5. Is CSRF protection on tRPC mutations sufficient for a future team-invite acceptance
   endpoint? Invariant 20 was inherited, not verified.
6. `apps/api/v2/src/modules/teams/**` is compiled but unmounted — is it in any tsc program that
   CI actually runs? (`type-check:ci` covers 8 of 113 packages.)


## 10. External Evidence — A Working Team Implementation On This Same Line

`Enqira/cal.diy` (`857c362ed2`, merged as `d14faffdce`, 59 files, +3636/−21, base `176037d0af`) is an
author-original multi-tenant team implementation written **against the stripped cal.diy line this fork is
on**. It is not a restoration of deleted upstream code: all 59 team files are additions, and none matches
a historical `packages/features/ee/**` path.

**Nothing from it has been adopted, and adopting it as a patch is not proposed.** It is recorded here for
one reason: it is the only available worked example of what these invariants cost to satisfy, and it
independently corroborates this audit's central security finding.

### 10.1 Independent corroboration of F-01

Their `packages/trpc/server/procedures/teamProcedures.ts` deliberately does **not** use
`createTeamPbacProcedure`, and says why in a comment: *"the `PermissionCheckService` that backs it is a
stub whose `checkPermission` always resolves `true`, so every one of those procedures is currently a
no-op."*

That is a second party, reading the same code independently, reaching this audit's F-01 conclusion in
writing. Their replacement reads `Membership` directly with `accepted: true` and three tiers
(`teamMemberProcedure` / `teamAdminProcedure` / `teamOwnerProcedure`) — which is
[PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) §7 Option 2, implemented.

### 10.2 Which of §6's invariants their design satisfies

Read from their tree, mapped onto the invariant numbers in §6. This is **external evidence**, not a
verification of their code by this fork.

| §6 invariant | Their result |
| --- | --- |
| 2 · ADMIN cannot grant OWNER | **PASS** in `changeMemberRole` — requires acting OWNER when the target role is OWNER **or** the target is an OWNER |
| 3 · ADMIN cannot remove/demote OWNER | **PASS** — same guard, mirrored in `removeMember` |
| 4 · OWNER-only destructive ops | **PASS** — `delete` on `teamOwnerProcedure`; `update`/`inviteMember`/`revokeInvite`/`removeMember`/`changeMemberRole` on `teamAdminProcedure`; `get`/`listMembers` on `teamMemberProcedure` |
| 5 · Last OWNER protected | **PASS** — enforced in `changeMemberRole`, `removeMember`, and the leave branch of `acceptOrLeave` (`ownerCount <= 1`, counting only `accepted: true`) |
| 6 · Accepted membership required | **PASS** — and `acceptOrLeave` correctly sits on `authedProcedure`, since an invitee is not yet an accepted member; accept is idempotent |
| 10 · Public team page exposes only intended data | **PASS** — `select` not `include`, scoped `parentId: null, isOrganization: false`, `eventTypes` filtered to `hidden: false`, `isPrivate` → `notFound`. **No member list, no emails.** Private and non-existent teams both return `notFound`, so there is no enumeration oracle |
| 12/13 · Token expiry and strength | **PASS** — `randomBytes(32).toString("hex")`, 7-day expiry, duplicate-invite guard filtering `expires: { gt: new Date() }` |
| 17/18 · Slug namespace | **PASS on logic** — `create.handler.ts` runs `slugify` then **both** `isSlugTaken` and `isUsernameTaken`, with a comment explaining that `@@unique([slug, parentId])` does not bind when `parentId` is null |

### 10.3 Gaps their implementation still has

These are independent findings, not items from their design document. They are the most useful part of
this section, because they show which invariants are easy to miss even when the author is being careful.

1. **ADMIN can invite a new OWNER — privilege escalation.** `inviteMember` sits on `teamAdminProcedure`,
   and the input schema accepts `role: z.nativeEnum(MembershipRole).default(MEMBER)` with no restriction.
   An ADMIN therefore manufactures an OWNER through the invite path — the exact escalation
   `changeMemberRole` correctly forbids. **This fails §6 invariant 2 through a different door**, and it
   is the single most instructive result here: guarding role *changes* is not enough if role *creation*
   is unguarded.
2. **Slug uniqueness is a TOCTOU race.** The handler documents that the DB constraint does not bind for
   `parentId: null`, then implements check-then-create in application code. Two concurrent `create` calls
   with the same slug both pass and both insert. The correct fix is a partial unique index
   (`CREATE UNIQUE INDEX … ON "Team"(slug) WHERE "parentId" IS NULL`) — a migration, which is
   "Ask first" scope under [AGENTS.md](../AGENTS.md). This is §6 invariant 19.
3. **Asymmetric email normalization.** Invites lowercase the address; the account lookup is an exact
   match. Where a user row holds a mixed-case address, an invite silently issues a *signup* token for an
   address that already has an account. §6 invariant 15.
4. **Unbounded tenant creation.** `create` is on plain `authedProcedure`: any authenticated user can
   create unlimited teams, each consuming a slug in the shared user/team public namespace — a squatting
   and resource-exhaustion surface for a self-host.
5. **Invite-token replay not verified.** Their comment says the pre-existing signup handler burns the
   token via `createOrUpdateMemberships`. §5.2 of this document shows that is true **only** on the
   `teamId` branch — a token without a `teamId` is never consumed. Their assumption is plausible for
   their own flow but was not traced end to end, and must not be assumed.

### 10.4 The conclusion that matters

**Adding teams to this line activates F-01.** Team rows populate `bookingOwner.teams`, which turns
`BookingAccessService` case 5 into a live authorization decision on booking confirm, booking details,
mark-no-show and the API v2 guard. Enqira guarded their own new routes and left the pre-existing ones
untouched — which is the correct scope for their fork, and exactly the gap this fork would inherit.

That is the empirical form of §7's ordering: **F-01 is a hard prerequisite for any team work**, and it is
not satisfied by writing careful new team code.

### 10.5 Licence constraint, restated

`packages/features/ee/` held **394 files** at `ab21c7f805^` and 0 afterwards, under
`packages/features/ee/LICENSE` — the Cal.com Commercial License. That history resolves in this clone
today. Enqira's own code is clean of it (all files are new), but any implementation here must be written
independently. Full analysis and the governing rule:
[LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §3.4–§5.
