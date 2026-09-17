# Security Review

## Purpose

This is the minimum recurring security review checklist for this fork before a reviewed image is allowed to move toward downstream deployment.

It is a **per-release gate**. The per-change completion rule is
[FORK_PROCESS.md → Definition of Done](FORK_PROCESS.md#definition-of-done), and the broader
assurance strategy — ASVS mapping, risk-based CI tiers, tooling evaluation, licence policy and
the runtime/DAST model — is [SECURITY_ASSURANCE.md](SECURITY_ASSURANCE.md) (design only).

## Review Priorities

Focus on these areas first:

- auth and signup behavior
- mail transport and mailer error logging
- secret handling in workflows and builds
- cron and webhook authentication
- credential storage and encryption behavior
- public booking routes and exposed APIs
- dependency changes
- image publication path

## Minimum Review Checklist Per Release

- review the upstream diff summary
- review fork-only commits
- confirm release workflow still points to fork GHCR
- confirm no new upstream DockerHub assumption was reintroduced
- confirm no secret values were committed
- inspect build-related changes for secret-bearing build args
- inspect auth and mail logging changes
- inspect cron and webhook auth changes
- inspect dependency and lockfile changes
- reconcile every observed upstream commit in `UPSTREAM_REVIEW_LEDGER.md`
- confirm the current intake did not squash multiple upstream commits into one local commit
- confirm partial upstream intake lists exact retained and omitted behavior

## Minimum Checks Before A Release Tag

- `yarn type-check:ci --force`
- relevant tests for changed areas
- `git diff --check`
- manual review of release workflow and image destination
- manual smoke check plan for the resulting image
- lifecycle/install source-clean check
- non-publishing AMD64 and ARM64 workflow validation
- exact release-tag-to-`origin/release` identity check
- architecture-specific digest, SBOM, and provenance capture plan
- root MIT `LICENSE` present in the exact runtime image, and its content matches the
  repository root `LICENSE` byte for byte (issue #40; asserted by `docker-build-and-test`)

## Release Blocking Conditions

Do not approve a release image for downstream use if any of these are true:

- source state is not understood
- release branch content differs from expectation
- image destination is ambiguous
- only `latest` is available and the digest is not recorded
- a security-sensitive change is present without review
- a known secret-handling issue is accepted without documentation
- the release tag does not point exactly to the reviewed `origin/release` head
- the published digest is not the digest of the tested image
- either architecture or the release finalizer failed
- generated tracked files differ after install/lifecycle scripts

## Known Accepted Items — As Shipped In `v6.2.0-6`

This section records what a release operator needs to know about the state actually
published as [`v6.2.0-6`](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-6),
distinct from the generic checklist above. The full artifact record is
[FORK_STATUS.md](FORK_STATUS.md) → *Latest Release Evidence*.

All implementation blockers identified for this release were resolved before promotion.
Specifically:

- issues #43, #44, #45 (security fixes) and #32 (functional availability): fully remediated
  and closed
- issue #47 (mechanically enforced branch protection): implemented and closed
- issue #14 (slots owner-resolution): the public wrong-resource fallback is closed
  (`FIL-0018`). The issue itself remains **open** — team/private-link resolution correctness
  is deliberately out of scope while Teams are inactive
- issue #13 (PBAC placeholders): the fail-open placeholders now deny by default
  (`FIL-0019`). The issue itself remains **open** — PBAC is not implemented, only contained;
  do not read this as `PBAC_IMPLEMENTED` or `TEAMS_SECURE`
- issue #40 (MIT `LICENSE` in the runtime image): implemented (`FIL-0020`) and **closed**.
  Verified against the published artifact through the digest chain: `docker-build-and-test`
  asserted `/calcom/LICENSE` byte-equal to the repository root in the exact image it built
  (SHA-256 `95f3d2c4bf…ac321c`, both architectures), that same image was runtime-tested, its
  immutable staging digest was recorded, and the finalizer promoted that exact digest to the
  final architecture tag with `docker buildx imagetools create` — no rebuild between
  assertion and publication. Registry digest resolution and `release-record.json` agree
- issue #46 / CodeQL alert #74 (`RecurringBookingService` type confusion): shipped as an
  accepted known defect in `v6.2.0-6`; P3, availability-only, no authorization bypass
  identified. The alert remains open by deliberate disposition, not oversight
- issue #33 (team role/ownership invariants): design-only, non-blocking; no Team activation
  ships in this release

Two CRITICAL fixable library findings ship in the `v6.2.0-6` images and are accepted under
the documented report-only scanner policy: `stdlib` CVE-2025-68121 and `tar` package
CVE-2026-59873. They were visible in the release build's Trivy output and were not treated
as merge or publication blockers.

Do not read any of the above as: all security issues are fixed, all CRITICAL scanner
findings are closed, Teams are secure, or PBAC is implemented. None of those are true.

**One process gap, now closed.** For `v6.2.0-6` the GitHub Release object was created
manually after publication: `release-docker.yaml` did not produce one and no release
contract described the step. The artifact-promotion pipeline moves Release creation into
the workflow and generates its facts from `release-record.json`, so the published
announcement and the artifacts cannot disagree. `v6.2.0-6` remains the one release whose
Release object was authored by hand.

## Incident-Oriented Checks

Because a prior deployment apparently lost SMTP credentials, every release review should explicitly consider:

- can auth or mail logs leak secrets
- can build steps expose runtime secrets
- can cron or webhook secrets leak via URLs
- can the resulting image be traced back to one reviewed source state

## Immediate Rotation Targets After Any Suspected Secret Exposure

If compromise is suspected, review and rotate at least:

- SMTP credentials
- `NEXTAUTH_SECRET`
- `CALENDSO_ENCRYPTION_KEY`
- cron secrets
- webhook secrets
- OAuth client secrets
- credential sync secrets, if enabled

## This Pass Does Not Change

This file is a process checklist only. It does not claim that current source risks are fixed. It records the minimum review discipline needed before trusting a new image.
