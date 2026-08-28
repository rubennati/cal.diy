# Fork Process

## Purpose

This fork exists so upstream Cal.diy changes are reviewed before they become deployable artifacts.

The goal is a simple operating model:

1. Mirror upstream into `main`.
2. Review and integrate in `develop`.
3. Promote reviewed code to `release`.
4. Tag `release`.
5. Publish a reviewed GHCR image from that tag.
6. Let downstream infrastructure consume the reviewed tag or, preferably, the published digest.

## Branch Contract

- `main`
  - Intended upstream mirror branch.
  - Should stay as close to upstream as possible.
  - Do not add fork-only release/process commits here unless explicitly required and documented.
- `develop`
  - Integration and review branch.
  - Upstream changes are inspected here first.
  - Local fixes that are being considered for release are reviewed here before promotion.
- `release`
  - Release branch for reviewed tags and GHCR publication.
  - Every commit on this branch should have a clear reason to be shippable.
  - Target state: the tagged source tree is identical to the approved `develop` candidate;
    release-only application or workflow edits are forbidden.
- tags
  - Tags represent reviewed release points.
  - Tags are the release inputs that downstream secure deployment should trust.

## Branch Contract and Required Checks

Everything above is convention; this section is what GitHub actually enforces, as of issue
#47. Re-read via `gh api repos/rubennati/cal.diy/branches/<branch>/protection` before trusting
this table — this document records a decision, not a live API mirror.

| Branch | Protected | PR required | Required status check | Approvals | Force-push | Deletion | `enforce_admins` |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `main` | yes | no | none | none | blocked | blocked | false |
| `develop` | yes | yes | `ci` (strict) | 0 | blocked | blocked | true |
| `release` | yes | yes | `ci` (strict) | 0, code-owner | blocked | blocked | true |

**Why `main` differs.** `main` is the upstream mirror; none of `forte-ci`, `forte-codeql` or
`forte-trivy` trigger there at all — their `on:` blocks are scoped to `develop`/`release` only.
Requiring `ci` on `main` would not raise the bar, it would make `main` permanently unmergeable,
since the check that would need to pass never runs. `main`'s existing protection (no force-push,
no deletion) is left as-is.

**Why `ci` and not a scanner.** The single required check is the `ci` job from
`.github/workflows/forte-ci.yml` — GitHub's job id, not the workflow's display name
(`forte-ci`). It covers lifecycle-script integrity, the telemetry fork guard and its self-test,
`type-check:ci`, and Biome. CodeQL, Trivy and Scorecard stay **report-only** and are not
required checks anywhere — see `SECURITY_ASSURANCE.md` §5b.3, which argues against converting
vulnerability scanners into blocking gates wholesale, since scanner severity alone does not
establish applicability or reachability. Recent evidence for this fork includes both genuine
fixes (Zoho, Intercom, Vitest) and reviewed false positives (Giphy, `useBooking`, four Stripe
placeholder findings) — a severity-only gate would have blocked merges on the false positives
too.

**What `ci` green actually means depends on the event.** The `ci` job always runs and always
resolves — that is a precondition of it being the required context, and it is why the fast path
below skips *steps* rather than the job or the workflow. But its coverage is not identical on
every event:

| Event | Fork guards + whitespace check | Install · lifecycle · `type-check:ci` · Biome |
| --- | --- | --- |
| any `push` to `develop` / `release` | always | always |
| PR touching any path outside `**/*.md` and `docs/**` | always | always |
| PR touching *only* `**/*.md` and `docs/**` | always | skipped |

The classification is an **allowlist**: a changed path is documentation only if it matches
`**/*.md` or `docs/**`, and everything else — including any directory added to this repository
later — takes the full path. An unavailable or empty changed-file list also takes the full
path. This is deliberate; a denylist would silently fast-path the next unfamiliar directory.

Two consequences worth stating plainly. First, a green `ci` on a documentation-only PR is
**not** evidence that the tree type-checks — it is evidence that the fork guards hold and that
nothing outside the allowlist changed. Second, that distinction never reaches a release,
because `release-docker.yaml` validates successful **push**-event runs for an exact SHA, and
push events have no fast path. Release evidence therefore never depends on which paths a
commit happened to touch. The same reasoning governs `forte-codeql.yml`, whose `paths-ignore`
is scoped to its `pull_request` trigger only.

The four fork guards run before dependency installation because each is a plain shell script
needing only git and coreutils. That is what makes them affordable on every event, and it also
makes the full path fail fast on a guard violation instead of after a ~4-minute install.

**`enforce_admins: true` on `develop` and `release`.** With a single maintainer, a check that
can be silently bypassed during an ordinary merge is not mechanically enforced at all — it is
the same convention-only gate this section replaces, wearing a different label. `enforce_admins`
closes that: the maintainer cannot merge past a failing required check in the normal PR-merge
flow. This is deliberately **not** the same thing as being permanently locked out — recovery
from a broken or over-strict gate is an explicit `PATCH` to branch protection (a visible,
attributable settings change), never an invisible bypass folded into a routine merge.

**Zero required approvals.** Both `develop` and `release` require a pull request but 0
approving reviews, because the sole maintainer cannot approve their own PR — a `>0` requirement
would create a self-review deadlock GitHub does not resolve. `release` additionally requires a
code-owner review via the existing `.github/CODEOWNERS` (`@rubennati` for `.github/`), which
predates this issue and is preserved unchanged.

**Verification, not merely stated.** After a deliberately failing `ci` was pushed on a temporary
branch, [PR #51](https://github.com/rubennati/cal.diy/pull/51) showed `mergeable_state: blocked`
(REST) and `mergeStateStatus: BLOCKED` (the CLI's GraphQL-backed view) — both re-read from the
API after the fact, not merely observed once. The failing step was exactly the intended one
(the telemetry guard), which also confirmed steps 8-10 skip on that failure the same way they
did during the original 2026-08-26 incident. The PR was closed unmerged and the temporary
branch deleted immediately after; it never reached `develop`.

## Allowed Fork Divergence

Fork-owned changes should stay small and obvious.
The authoritative list of current fork additions, modifications, and removals is
[FORK_DIVERGENCE.md](FORK_DIVERGENCE.md). A material fork-owned change is incomplete until
that register records its rationale, evidence, maintenance rule, and release state — and until
it satisfies the [Definition of Done](#definition-of-done) below.

Expected fork-owned areas:

- `.github/`
- root process docs
- release metadata
- image naming and fork-specific publishing references
- emergency hardening patches that are documented in the release notes

Areas that should not drift casually:

- auth logic
- booking logic
- secret handling
- cron and webhook behavior
- Prisma schema and migrations
- public route behavior

## Definition of Done

**A material change is not complete merely because the code works and the tests pass.**

This is the single normative completion rule for this fork. It is stated **here only** —
other documents reference it rather than restating it, so there is one place to change.

A change is **material** when it alters security posture, privacy posture, attack surface,
product behaviour, provenance, licence obligations, or a maintenance boundary. Formatting,
refactoring and routine dependency bumps are not material unless they do one of those things.

A material change is **Done** when all of the following that apply are true:

| # | Requirement | Recorded in |
| --- | --- | --- |
| 1 | The decision is recorded — why this change, why now, what was rejected | the GitHub issue, then the implementation ledger |
| 2 | **Implementation relationship is classified** — native, upstream cherry-pick, upstream adaptation, external reference, external adaptation, third-party integration, or historical reference only | [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) §3.1 |
| 3 | **Source usage is classified** wherever an external source was consulted at all — from behavioural reference through to source incorporation | [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) §3.2 |
| 4 | **Licence disposition is recorded**, together with any attribution or source-availability obligation and where it is discharged | [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) §4 |
| 5 | Security impact is reviewed — including attack surface, new endpoints, new mutations, new persistent state, new outbound communication | the ledger's impact table; [SECURITY_REVIEW.md](SECURITY_REVIEW.md) for release-blocking conditions |
| 6 | Tests pass, and any **new** regression test the change requires exists and is named | the ledger's Validation field |
| 7 | **The implementation ledger is updated** | [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) |
| 8 | If upstream-derived: the upstream ledger is updated with the commit's disposition | [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md) |
| 9 | If it changes steady-state behaviour: the divergence register is updated | [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md) |
| 10 | Any guard needed to stop silent regression or upstream reintroduction exists | `scripts/fork-guard-*.sh`, CI, or `.gitattributes` |
| 11 | Release documentation is updated when the change ships | [FORK_STATUS.md](FORK_STATUS.md), [RELEASE_PROCESS.md](RELEASE_PROCESS.md) |

Requirements **2-4 are a hard gate**: a change whose implementation relationship, source usage or
licence disposition is unrecorded is not Done, regardless of code quality. The default classification when no licence can be
established is `UNKNOWN_BLOCKED`.

Requirement **10 is what makes a removal durable.** An unguarded removal is a temporary removal:
the next upstream merge re-arms it silently while the divergence register still claims it is
gone.

### Three thresholds, deliberately distinct

A change passes through three separate bars. Conflating them is how a fork ends up believing a
merged change is finished when its provenance was never recorded.

| Threshold | Means | Owned by |
| --- | --- | --- |
| `READY_FOR_REVIEW` | The change compiles, gates pass, and it can be sensibly reviewed | [.ai/quality-gates.md](.ai/quality-gates.md) |
| `DONE` | The change is **complete as a change** — the table above is satisfied and the record exists | **this section** |
| `RELEASED` | The change is in a published tag and image, with release evidence captured | [RELEASE_PROCESS.md](RELEASE_PROCESS.md), [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md), [FORK_STATUS.md](FORK_STATUS.md) |

A change can be `READY_FOR_REVIEW` and merged while still not `DONE` — that is precisely the gap
this section closes. `DONE` does not imply `RELEASED`; the ledger's `Status` field tracks the
transition, and `FORK_STATUS.md`'s *Status Terms* remains the canonical review vocabulary.

**Non-material changes** — formatting, refactoring, routine dependency bumps that touch none of
the material dimensions above — need only `READY_FOR_REVIEW`. Do not manufacture ledger entries
or provenance classifications for them; an over-applied rule is abandoned faster than an
under-applied one.

## Release Rules

- Do not deploy directly from `develop`.
- Do not treat `latest` as a secure deployment input.
- `secure-docker-blueprint` should consume reviewed version tags or image digests.
- Prefer digests for secure deployment whenever possible.
- Every release should be explainable in terms of:
  - upstream base commit or tag
  - fork-only commits
  - checks performed
  - resulting image tag
  - resulting image digest
- A release tag must point exactly to the current reviewed `origin/release` head.
- Manual branch validation must never publish an image.
- A release is incomplete until AMD64, ARM64, provenance/SBOM, digest capture, and the
  finalization job have all succeeded.

## Normal Operating Cycle

1. Inspect upstream changes.
2. Update `main` to the observed upstream state.
3. Integrate approved upstream commits one at a time with `git cherry-pick -x`, or perform
   an explicitly approved history-preserving release-base merge without squashing.
4. Review the diff, especially fork-owned paths and security-sensitive areas.
5. Run release gates.
6. Promote reviewed code to `release`.
7. Create a release tag from `release`.
8. Publish the GHCR image from that tag.
9. Record the resulting digest and release notes.

Every upstream decision is recorded in [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md).
Historical aggregate commit `75c8f5c18f` is documented there and must not be used as a
precedent.

## Things This Repository Should Not Assume

- Upstream changes are safe without review.
- DockerHub references are authoritative for this fork.
- A branch-triggered test image is equivalent to a release image.
- `latest` is an acceptable secure deployment input.

## Required Release Record

Every release should capture at least:

- release tag
- `release` branch commit SHA
- upstream source commit or tag
- fork-only commits included
- GHCR image reference
- GHCR image digest
- checks run
- known accepted risks, if any
