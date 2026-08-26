# Audit Session Handover — 2026-08-25/26

> ### ⚠️ Superseded in part — verification delta below
>
> A later consolidation pass (2026-08-26) independently re-derived every material claim in this
> session against `develop`, then had the three load-bearing ones adversarially reviewed. This
> handover is preserved as written; **where it conflicts with
> [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md), the master wins.**
>
> The corrections below are not stylistic — they change severity and attribution:
>
> | §4 statement here | Corrected finding |
> | --- | --- |
> | slots returns "the **lowest-id** event type" | Refuted. `findFirst` has no `orderBy`; the row is unspecified, so the caller **cannot choose the victim** — an undirected leak, not a targeting primitive |
> | slots "**does not require teams**… retrieve an arbitrary event type's availability" | Half right. The *disclosure* half needs no team but is modest — on a single-account instance those slots are already public. The *serious* half is **functional corruption on the team private-link path** (`/d/[link]/[slug]`), which does need team data |
> | slots defect attributed to `ab21c7f805` | Split. `ab21c7f805` removed only the **team** branch; the unresolvable-username fallback **predates it** (upstream `95a4567f35`). Attributing it wholly to the refactor misattributes upstream behaviour to this fork |
> | "**13** upstream commits across **24** file paths, all still reverted, verified individually" | Overstated by at least one. `21500c7047` (#27309) is **not** reverted — the fix survives on `develop`. The reverts are also hunk-level, not wholesale: in a 60-file sample only 3 were byte-identical to an earlier blob |
> | TOTP "returns **four** possible 400s" | **Six.** Two more arrive via thrown errors (`parseRequestData.ts:37`, `getServerErrorFromUnknown.ts:210`) and carry **no `error` key**, so they are strictly worse than the four enumerated |
> | "there is **no** `apps/web/middleware.ts` at all" | Literally true, materially misleading. Next.js 16 renamed it — `apps/web/proxy.ts` **exists**. It performs no rate limiting and its matcher excludes `/app-store`, so the conclusion holds, but for a different reason |
> | API keys "every write fails **silently**" / "returns Next.js's HTML 404" | All three call sites are error-handled → the user sees an **error toast**. The HTML body is inference from source; only the live console string is direct evidence |
> | "a stock deployment **cannot create a team**" | True of every shipped **runtime** path, but `scripts/seed.ts` creates **7 `Team` rows** via the documented `yarn dx` chain. Severity is therefore *latent-but-real*, not theoretical |
> | "would be a **licence violation**" (§6) | Softened to repository policy. The audit establishes what the historical licences *say*, not a legal conclusion — see [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §0 |
> | "`hasPermission` returns `true`" as a live risk | It is declared in all 18 stubs and **called by zero sites**. Dead API surface |
>
> Two additions this session did not have: the API v2 `PbacGuard` is **unmounted dead code** that
> sets the flag to `false` (not a hole), and `viewer.bookings.getBookingDetails` is a **seventh**
> `BookingAccessService` consumer that discloses data.



Closing record for the external-fork intake and runtime-validation session. It exists so the
originating chat can be deleted without losing anything: everything below is either stated
here or points at a file in this repository.

| Item | Value |
| --- | --- |
| Session dates | 2026-08-25 → 2026-08-26 |
| Branch | `develop`, HEAD `41689d1d6e` throughout |
| Scope | **Analysis only.** No fix, no commit, no push, no GitHub write of any kind |
| Upstream base | Cal.com 6.2.0, merge-base `46eb533dbd`; reviewed through `176037d0af` |

## 1. What was done

Three passes, all evidence-gathering:

1. **External fork intake** — 11 forks of `calcom/cal.diy` evaluated as discovery sources only.
2. **Historical archaeology** — provenance and regression detection against upstream history,
   performed with read-only local `git` commands (this clone carries full upstream history).
3. **Runtime validation** — a live self-hosted deployment exercised manually through the UI,
   with every symptom correlated back to `develop` by reading the affected files.

## 2. What was deliberately **not** done

- No source file was fixed. No `git cherry-pick`, no commit, no branch, no tag, no push.
- No GitHub write: no issue, no label, no PR, no comment.
- No key, secret or credential was generated, printed or committed.
- No historical EE code was restored (see §6 — this is a licence constraint, not a preference).
- The direct append into `SELF_HOST_CAPABILITY_AUDIT.md` was blocked by a permission control
  mid-session and **was not worked around**; the content was written outside the repository and
  moved in afterwards on explicit instruction.

## 3. Where the evidence lives

| File | Contents |
| --- | --- |
| [EXTERNAL_FORK_INTAKE_EVIDENCE.md](EXTERNAL_FORK_INTAKE_EVIDENCE.md) | Long-form intake record, 1,991 lines. Per-candidate reasoning for C-01..C-25, the fork classification tables, the revert archaeology, the Enqira invariant audit |
| [RUNTIME_VALIDATION_FINDINGS.md](RUNTIME_VALIDATION_FINDINGS.md) | Long-form runtime record, 359 lines. Full tRPC parity matrix, exhaustive TOTP error mapping, 429 diagnostics |
| [EXTERNAL_FORK_INTAKE.md](EXTERNAL_FORK_INTAKE.md) | Curated register — the primary record |
| [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) | Capability inventory; absorbed the runtime findings in condensed form |
| [PBAC_PLACEHOLDER_AUDIT.md](PBAC_PLACEHOLDER_AUDIT.md) · [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) · [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) · [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md) | Companion audits produced alongside this session |

The two long-form files were written to `/tmp` during the pass (analysis-only discipline) and
moved here at the end. `/tmp` copies are now redundant and will vanish on reboot.

## 4. Findings that matter, in priority order

Each is independently verified against `develop`; none is taken on an external fork's word.

**P1 · Permission checks are `return true` stubs.** 18 files each declare a private
`class PermissionCheckService` whose `checkPermission`/`hasPermission` return `true`
unconditionally. `BookingAccessService.doesUserIdHaveAccessToBooking` delegates cases 3–5 to it
and is reachable from seven authenticated entry points, including `viewer.bookings.confirm`,
`handleMarkNoShow`, `BookingDetailsService` and the API v2 `BookingPbacGuard`.

*Critically: this is an architectural hazard, not a confirmed exploit.* Every vulnerable branch
is gated on team/organisation rows, and a stock deployment cannot create a team — no teams tRPC
router, no API v2 team controllers, no UI, and boot runs only `prisma migrate deploy` plus
`seed-app-store.ts` (not `scripts/seed.ts`, the only shipped code calling `prisma.team.create`).
It becomes a critical authorization bypass the moment any team row exists. Do not file it as an
active exploit. Independently corroborated: `Enqira/cal.diy` reached the same conclusion and
refused to build on those procedures, in writing.

**P1 · Slot event types resolved by slug alone on a public unauthenticated endpoint.**
`getEventTypeId` in `packages/trpc/server/routers/viewer/slots/util.ts` declares `isTeamEvent`
in its parameter type but never destructures it, so `findFirstEventTypeId` falls through to
`findFirst({ where: { slug } })` — the branch its own comment calls "shouldn't happen in
practice" — returning the lowest-id event type with that slug regardless of owner. `getSchedule`
is a `publicProcedure`. **This does not require teams to exist**: any unauthenticated caller can
pass a `usernameList[0]` that resolves to no user and retrieve an arbitrary event type's
availability by event slug alone. Unfixed upstream.

**P1 · API Keys tRPC route missing — confirmed broken at runtime.**
`apps/web/pages/api/trpc/apiKeys/[trpc].ts` was deleted by `ab21c7f805` while the router, the
client `ENDPOINTS` entry and the whole API-keys UI stayed wired. Create/edit/delete return
Next.js's HTML 404, which the tRPC client fails to parse. `list` is server-rendered, so the page
looks healthy while every write fails silently. **Upstream fixed this on 2026-06-08 in
`07a288bbd8` (4 lines) — and that commit sits in `UPSTREAM_REVIEW_LEDGER.md:76` marked
`deferred` with the rationale "Feature/API expansion not required by current fork scope",
which this evidence refutes.**

**P2 · Upstream reverted 13 of its own merged commits in one refactor.** `ab21c7f805`
(#28903, +21,362/−411,881) silently reverted 13 upstream commits across 24 file paths,
including PR #27961's `truncateOnWord` fix **together with its regression tests**, which is why
nothing turned red. All 24 paths are still in the pre-fix state on `develop`, verified
individually. None is a security fix, but the mechanism would lose one identically.

**P2 · Remaining confirmed items** — TOTP setup returns four possible 400s of which three
render as a generic `something_went_wrong`, leaving an `INACTIVE_ADMIN` with no stated route
back to admin capability; the dead `OUTLOOK_LOGIN_ENABLED` flag alongside a live
`/api/auth/signin/azure-ad` endpoint with an unconstrained Entra tenant; a Google Calendar
enrichment `PATCH` that fails an already-created event when throttled; `extractBaseEmail`
fabricating addresses from malformed input inside the blocked-email path; CSV export not
neutralising spreadsheet formula prefixes.

**Not application defects** — the mass 429 on `/app-store/*/icon.svg`, `logo.png` and
`/api/logo` cannot originate in this repository: there is no `apps/web/middleware.ts` at all,
`/app-store/*` is static, `/api/logo` has no rate-limit call, and `rateLimiter()` returns
`success: true` unconditionally unless `UNKEY_ROOT_KEY` is set. Deployment layer — belongs to
`secure-docker-blueprint`.

## 5. Method notes worth keeping

**Revert detection is reproducible.** For each commit since a chosen date that touched a file
`ab21c7f805` modified and that still exists in `develop`, compare the blob at `ab21c7f805`
against the blob at that commit's **parent**; an exact match where the commit itself changed the
file means the refactor restored the pre-commit content. This found 13 commits / 24 paths and is
a **lower bound** — the scan covered only commits since 2026-01-01 and only files still present.
Worth re-running with a wider window.

**`ab21c7f805` has three distinct damage patterns**, all inherited: content reverts; deletion of
regression tests along with the fixes they guarded; and removal of one leg of a multi-leg
contract while the other legs stay wired (the API-keys case). A future audit should look for all
three, not only the first.

**`ab21c7f805` has no ledger row.** It predates the fork base `46eb533dbd`, so
`UPSTREAM_REVIEW_LEDGER.md`'s range (`46eb533dbd..176037d0af`) never considered it — yet it is
the direct cause of four separate findings. Decide whether pre-base upstream commits can receive
rows, or add an "inherited upstream state" section.

**A recurring failure class is now confirmed four times over**: configuration and wiring that
survive a strip after the thing they controlled is gone — the removed Jitsu telemetry opt-out,
the dead `OUTLOOK_LOGIN_ENABLED`, seven orphan client `ENDPOINTS` entries, and the
`NEXT_PUBLIC_VAPID_PUBLIC_KEY` entry in `docker-compose.yml` that cannot work because the
variable is build-time inlined and is not a `Dockerfile` `ARG`. This is the strongest available
argument for making endpoint-parity and env-template checks blocking rather than advisory.

## 6. Constraints a future session must respect

- **Do not restore `packages/features/ee/**` from git history.** It held 394 files at
  `ab21c7f805^` under `packages/features/ee/LICENSE` — **the Cal.com Commercial License**, which
  permits production use only with a valid Enterprise subscription. That history is fully
  reachable in this clone. Placing it into an MIT-published fork that ships a public GHCR image
  would be a licence violation. Any team or PBAC implementation must be written from scratch.
- **The PBAC stubs block team work.** Adding team management before fixing them converts a
  dormant hazard into a live authorization bypass on booking confirm, booking details and
  mark-no-show. Sequence accordingly.
- **Never trust another fork's explanation.** Across the 11 repositories reviewed: one shipped
  hardcoded auth backdoors it later removed, one hardcodes a third party's Entra tenant GUID,
  one weakens an existing email-verification guard, one deploys via a mutable `@master` action
  bypassing reviewed image promotion. Of three testable "fixes" from one fork, one did not
  reproduce, one targeted a file this fork does not have, and one shipped tests without the fix.

## 7. Open items

Nothing is half-finished; these are decisions and follow-ups, not loose ends.

1. ~~**Issues are disabled on `rubennati/cal.diy`.**~~ **Resolved 2026-08-26** — issues were
   enabled and 29 were filed between 04:26 and 04:33 under tracker
   [#12](https://github.com/rubennati/cal.diy/issues/12). Note that
   [#25](https://github.com/rubennati/cal.diy/issues/25) rests on a claim a later verification
   pass refuted; see [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) §8.
2. **`UPSTREAM_REVIEW_LEDGER.md:76` still reads `deferred`** with the refuted rationale. The
   correction should record *why* the original decision was wrong, per the ledger's own
   convention that reversals stay visible (the `0d164da8dd` precedent).
3. **`apps/web/pages/api/trpc/apiKeys/[trpc].ts` is still missing.** API-key management remains
   broken in the UI.
4. **Two runtime questions need one command each, no code change:**
   - which TOTP 400 fires — the read-only SQL in `RUNTIME_VALIDATION_FINDINGS.md` §RV.3
   - which layer emits the 429 — the `curl -sSD -` header check in §RV.4
5. ~~**Everything in this repository is uncommitted.**~~ **Resolved 2026-08-26** — the
   consolidation pass committed the full audit set (9 `docs/*.md` plus the `.ai/` and `README.md`
   index updates) to a dedicated branch. Nothing was pushed and no PR was opened; both remain
   maintainer decisions. See [../.ai/sync-log.md](../.ai/sync-log.md) → *2026-08-26*.

## 8. Provenance caveats

- These audits were produced **alongside a concurrent process** writing into the same `docs/`
  tree. `SELF_HOST_CAPABILITY_AUDIT.md` grew from 530 to 966 lines during the session and
  developed its own `F-13`. The long-form runtime file originally used `F-20`..`F-25` to avoid that collision. The capability
  audit has since grown to `F-32`, so those ids were renamed to **`RV.1`..`RV.6`** — a local
  namespace, crosswalked to canonical ids in that file's header and in
  [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) §1.2.
- The condensed capability audit carries the substance of the runtime findings but **not the
  Fly.io / `erikmayergit` assessment**, which exists only in
  `EXTERNAL_FORK_INTAKE_EVIDENCE.md`. It was classified `not-applicable / rejected`, so the gap
  is deliberate rather than accidental — but it is a gap.
- Confidence tiers used throughout: `E0` external claim only · `E1` code path confirmed in
  cal.forte · `E2` behaviour reproduced or demonstrated · `E3` independently corroborated by
  upstream, an advisory or equivalent. **No finding was assigned P0**; nothing observed met the
  bar of a confirmed severe or actively exploitable issue.
