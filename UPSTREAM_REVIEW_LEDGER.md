# Upstream Review Ledger

This ledger is the public commit-level record of what this fork did with upstream changes.
It covers **upstream commits only**, including the ones deliberately not taken. What the fork
then *implemented* — provenance, licence status, security impact, validation and guards — is
recorded in [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md). An accepted upstream
commit has a row in both: this one records the **disposition**, that one records the
**implementation**.
It complements the chronological [.ai/sync-log.md](.ai/sync-log.md): the sync log explains
review rounds, while this file gives every reviewed upstream commit a durable disposition.

- Last reconciled: **2026-08-10**
- Upstream range: `46eb533dbd..176037d0af` (50 commits)
- Current integrated count: **9 full upstream patches**
- Prepared but not integrated: **0**
- Not integrated: **41**

## Status Vocabulary

| Status | Meaning |
| --- | --- |
| `integrated-full` | The complete upstream patch is present as its own local commit. |
| `integrated-squashed` | The complete upstream patch is present, but historical local packaging combined it with other patches. This status is historical only and must not be created again. |
| `already-covered` | Equivalent behavior existed independently; evidence must identify the local implementation. |
| `partial` | Only identified parts were accepted. Exact files/hunks and the reason must be recorded. |
| `prepared` | Reviewed and validated on a local review branch, but not integrated into `develop`. |
| `candidate` | Relevant and awaiting a deliberate integration decision. |
| `deferred` | Reviewed and intentionally postponed. |
| `rejected` | Reviewed and intentionally excluded from this fork. |
| `not-applicable` | The affected feature or code path is absent or disabled in this fork. |

## Provenance Rules

- One upstream commit becomes one local commit, applied with `git cherry-pick -x`.
- Never squash multiple upstream commits into one local commit.
- Keep required fork adaptations in a separate follow-up commit that names the upstream SHA.
- If only part of an upstream patch is acceptable, do not describe it as a cherry-pick.
  Record `partial`, the exact files or hunks retained, omitted behavior, and the reason.
- A full upstream release merge may preserve upstream's original commits and merge topology;
  it must not squash them into a synthetic aggregate commit.
- Every status change records the review date, local commit when applicable, validation, and
  release containing the change.

## Integrated Upstream Commits

Review date for this historical security intake: **2026-07-26**. Provenance and status were
reconciled against current history on **2026-08-10**.

| Upstream | Status | Local evidence | Notes |
| --- | --- | --- | --- |
| `fb0149453e` | `integrated-full` | `4d41b2c77d` | SECURITY.md wording; cherry-picked with provenance. |
| `9104545a18` | `integrated-full` | `b8fb288779` | Password-update UX and translation; full patch. |
| `0d164da8dd` | `integrated-full` | `91356f1650` | Password validation; initially rejected over legacy weak-password deletion risk, later accepted in full. The decision reversal should remain visible. |
| `b97cd6203d` | `integrated-full` | `ec0dfcf9cc` | Dependency security audit; cherry-picked with provenance. |
| `743f988d30` | `integrated-squashed` | `75c8f5c18f` | Full `shell-quote` 1.8.4 patch. Historical aggregate; do not repeat this packaging. |
| `4026669e68` | `integrated-squashed` | `75c8f5c18f` | Full unauthenticated `/api/me` 401 patch. Historical aggregate. |
| `ca03f007df` | `integrated-squashed` | `75c8f5c18f` | Full verified-phone lookup patch. Historical aggregate. |
| `561cf889ab` | `integrated-squashed` | `75c8f5c18f` | Full Daily webhook BookingRepository patch. Historical aggregate. |
| `038381aeca` | `integrated-full` | `29d686fa67` | Forwarded-IP whitespace / banlist-bypass fix; cherry-picked with `-x` on 2026-08-10. Fork-only formatting follow-up: `2ea6ff49b0`. Targeted tests passed (23/23) and filtered `@calcom/lib` type-check passed. First released in `v6.2.0-5`. |
| `717fed8f86` | `integrated-full` | `943f646850` | Vitest 4.0.16 → 4.1.8 across `vitest`, `@vitest/ui`, `@vitest/coverage-v8` and `packages/testing`; remediates `GHSA-5xrq-8626-4rwp` / `CVE-2026-47429` (Trivy alert #380, issue #45). Cherry-picked with `-x` on 2026-08-27, applied without conflict. The earlier `candidate` note asked to re-check advisory applicability before the next dependency round; that check was performed and the advisory still applied. Not yet released. |
| `07a288bbd8` | `integrated-full` | `da40b51567` | Missing API-key tRPC adapter (`apps/web/pages/api/trpc/apiKeys/[trpc].ts`), restoring API-key create, edit and **revoke** (issue #32). Cherry-picked with `-x` on 2026-08-27, applied without conflict; the resulting blob is byte-identical to upstream. **Reviewed reversal on 2026-08-27, not a typo correction:** the prior `deferred` decision read this as *"Feature/API expansion not required by current fork scope"*, and re-review against the shipped tree disproved both halves. It is not a feature expansion but the restoration of a deleted leg of an already-wired contract — `apiKeys` was the only `viewerRouter` key of 27 without an adapter — and it is inside fork scope because the settings page, the router key and the client endpoint all ship, and API v2 accepts API keys as bearer credentials. The decision reversal should remain visible. Fork-only follow-ups: `97b74f8c46` (trailing newline), `0af5714714` (parity guard). Not yet released. |

The four patches represented by `75c8f5c18f` have aggregate file statistics matching the
sum of their upstream patches. No partial hunk intake was found. Their provenance is weak
because the local commit message does not contain the four upstream SHAs; this ledger is the
durable corrective record.

## Reviewed Upstream Commits Not Integrated

Commits through `3894f37e14` were reviewed by **2026-07-26** and reconciled on
**2026-08-10**. The six commits after that anchor (`ab0b9e1fb5..176037d0af`) were reviewed
on **2026-08-10**. A later status change must record its own date in the decision text.

| Upstream | Subject / area | Status | Decision |
| --- | --- | --- | --- |
| `a4a01a0fa8` | Remove attribute entrypoints | `deferred` | Cleanup/refactor; no security need. |
| `180ede28f0` | System font fallback for non-Latin scripts | `deferred` | UI compatibility improvement. |
| `287cea3001` | `getQueryParam` typo | `deferred` | No runtime impact. |
| `e003426580` | ProfilesRepository write service | `deferred` | Broad repository refactor. |
| `ff184db553` | Arabic upload/download translation | `deferred` | Translation-only. |
| `d1ad4ea8b2` | Persist cancellation-reason setting | `candidate` | Functional event-type fix; integrate if affected. |
| `c645c0cbf7` | Conferencing metadata null check | `candidate` | Defensive runtime fix; requires focused relevance review. |
| `75c5eb8531` | Membership write service | `deferred` | Repository refactor. |
| `ecfb05ba55` | Rethrow unexpected selected-calendar deletion errors | `candidate` | Error-handling correctness; requires API v2 review. |
| `a216f6b785` | i18n typo | `deferred` | Copy-only. |
| `642c38582e` | CLAUDE.md symlink casing | `not-applicable` | Fork owns `AGENTS.md`/`CLAUDE.md` guidance. |
| `dcd0da831f` | Signup repository refactor | `deferred` | Auth-sensitive refactor; no demonstrated security requirement. |
| `70a883b191` | CI cancellation retry | `not-applicable` | Upstream CI behavior is not used by fork CI. |
| `4e529cbad1` | User-table infinite scroll | `deferred` | UI feature. |
| `ebf696a991` | Remove console logging / tRPC typing | `candidate` | Logging and type-safety improvement; inspect for sensitive output impact. |
| `1599dfd515` | Username suffix zero-padding | `deferred` | Functional polish. |
| `7469444aea` | Confirmation dialog alignment | `deferred` | UI-only. |
| `c0b13fb120` | Remove Discussions links | `deferred` | Documentation-only. |
| `a46d5f8dd4` | Upstream Claude rule frontmatter | `not-applicable` | Fork-owned AI instructions take precedence. |
| `051ae77279` | Remove obsolete TypeScript comment | `deferred` | Cleanup-only. |
| `62317bd4e1` | Seat-payment booking fields and locale | `candidate` | Payment/booking correctness; requires focused review. |
| `5d6d4d30cc` | App-category metadata typing | `deferred` | Refactor/type-safety improvement. |
| `53e32a5bba` | Return 404 for missing booking | `candidate` | API behavior correction; requires compatibility review. |
| `8f89c082e8` | Hebrew duration spacing | `deferred` | Translation-only. |
| `032962f577` | Markdown headings in event descriptions | `deferred` | Rendering improvement; review sanitization before intake. |
| `188aaa1857` | Cancellation ICS `METHOD:CANCEL` | `candidate` | Email/calendar interoperability fix. |
| `f3284f581f` | Windows Prisma troubleshooting | `deferred` | Upstream setup documentation. |
| `ca90ca2c94` | App-store credential repository refactor | `deferred` | Credential-sensitive refactor; no demonstrated required fix. |
| `0968bcef01` | Synchronize Cal.diy `iCalUID` events | `candidate` | Calendar synchronization correctness. |
| `bb7c87cae1` | Instance URL in push-test notification | `candidate` | Self-host correctness. |
| `009f91d163` | Skip null user-field responses | `candidate` | Booking parser robustness. |
| `761b780aa2` | Refund all paid seat payments on cancellation | `candidate` | Payment correctness; high-impact and requires dedicated tests. |
| `f004349273` | Rename location helper | `deferred` | Refactor-only. |
| `3894f37e14` | Hebrew duration spacing | `deferred` | Translation-only. |
| `ab0b9e1fb5` | Remove obsolete Booker lint suppression | `deferred` | No runtime impact. |
| `8418db70c7` | Add Clara app | `rejected` | New external integration is outside the hardened fork scope. |
| `5e3fe3cbe6` | Stable phone-input country fallback | `candidate` | Booking UX correctness; lower priority. |
| `b2c28a23ab` | Language update functionality | `deferred` | UI/profile behavior; no security requirement. |
| `176037d0af` | Preserve custom email reply-to | `candidate` | Relevant mail behavior fix; requires focused review. |

## Updating This Ledger

For every upstream review:

1. append every newly observed upstream commit
2. assign a status and review date in this ledger
3. link the local commit when integrated
4. record partial intake precisely rather than implying full inclusion
5. update [FORK_STATUS.md](FORK_STATUS.md) and [.ai/sync-log.md](.ai/sync-log.md)
6. record the first release tag and image digest containing each integrated change

Git patch equivalence is useful evidence but not sufficient by itself: historical squashes,
conflict resolutions, and fork adaptations can defeat `git cherry`. Reconcile this ledger
against both patch IDs and documented local commits.
