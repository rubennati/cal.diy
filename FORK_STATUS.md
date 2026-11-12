# Fork Status and Transparency

This page records the public maintenance status of `cal.forte`: which upstream state was
seen and reviewed, which changes were actually integrated, and which source produced the
latest release. It complements the chronological [sync log](.ai/sync-log.md) and the
public [fork divergence register](FORK_DIVERGENCE.md). Commit-level accepted, partial,
deferred, and rejected decisions are recorded in
[UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md).

## Current Snapshot

Last verified: **2026-11-12**

| Item | Current state |
| --- | --- |
| Upstream mirror observed | [`ef7954d16a`](https://github.com/rubennati/cal.diy/commit/ef7954d16a) |
| Upstream reviewed through | `ef7954d16a` on 2026-11-11 |
| Latest review range | [`176037d0af...ef7954d16a`](https://github.com/rubennati/cal.diy/compare/176037d0af...ef7954d16a) (31 commits) |
| Integrated upstream base | [`46eb533dbd`](https://github.com/rubennati/cal.diy/commit/46eb533dbd20b74686efa520684e662c0f21051c) (Cal.com 6.2.0 base) |
| Latest published source baseline | [`a5b682dd20`](https://github.com/rubennati/cal.diy/commit/a5b682dd20cb6cf9e90b52c84729f38727fc2475) |
| Reviewed publication branch | [`release`](https://github.com/rubennati/cal.diy/tree/release) |
| Latest published release | [`v6.2.0-9`](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-9) |
| Published AMD64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-9` |
| Published ARM64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-9-arm` |
| AMD64 digest | `sha256:bd6c53d80dcce24c2112c2878947d261f6bc825bda9fe93bf18e7e673d2f3034` |
| ARM64 digest | `sha256:d446cd815cd58143bd466215687d34fb2068440db0056e6fae03df45d1d5e616` |

The repository is selectively maintained. **Reviewed through** means that upstream commits
through the stated point were assessed; it does not mean that every upstream commit was
merged. Accepted changes are integrated individually and recorded in the
[sync log](.ai/sync-log.md).

## Status Terms

- **Observed:** the latest upstream-mirror commit known when this page was updated.
- **Reviewed:** the commit was included in an upstream triage or detailed review.
- **Accepted:** the change was approved for this fork.
- **Integrated:** the accepted change is present on `develop`.
- **Released:** the change is present on `release` and in a recorded image tag and digest.
- **Deferred:** the change was reviewed but intentionally not integrated at that time.

These terms are deliberately separate. In particular, an upstream review does not imply a
full sync, and an integration does not imply that an image was published.

## Latest Upstream Review

- Review date: **2026-11-11**
- Previous review anchor: `176037d0af`
- Reviewed through: `ef7954d16a` (31 commits)

| Upstream commit | Area | Review result |
| --- | --- | --- |
| `3030d88a1f` | Guest-email blocklist parsing | **Integrated in full as `07987c47de`, released in `v6.2.0-9`.** Closes a blocklist bypass through whitespace, case and `+tag`. |
| `ef7954d16a` | Custom event names | **Integrated in full as `f2a64de1e8`, released in `v6.2.0-9`.** User input is no longer interpreted as a replacement pattern. |
| `91eefbf9f4` | Dependency security audit | **Integrated in full as `f317897ad7`, released in `v6.2.0-9`.** Clears the CRITICAL advisories; the fork raised further pins on top. |
| `81ce067c1d` | Compose port binding | **Integrated in full as `9d957d75c4`.** Development compose file only. |
| `793293c461` | Node.js 20 → 22 | **Partial, as fork adaptation `04ca1f6acb`, released in `v6.2.0-9`.** Digest-pinned Node 22 base images. |
| 26 others | Functional fixes, features, translations, cleanup | Not integrated; six are `candidate`. Rows in [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md). |

## Integrated Fork State

- `main` is the upstream-near mirror.
- `develop` is the reviewed integration branch.
- `release` is the reviewed source for release tags and GHCR images.
- The historical release-only commits were reconciled as content-neutral ancestry in
  [`a4e2ff5dcd`](https://github.com/rubennati/cal.diy/commit/a4e2ff5dcd4b81c4a7731b575058892651925c73);
  release promotion is now a normal source-identical fast-forward.
- The merge-base between `develop` and the reviewed upstream line is `46eb533dbd`.
- Security fixes after that base are selectively cherry-picked; they are not evidence of a
  full upstream merge.
- Intentional fork additions, modifications, and removals are documented in
  [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md).

The exact current source difference can be inspected with the
[`main...develop` comparison](https://github.com/rubennati/cal.diy/compare/main...develop).

## Latest Release Evidence

| Evidence | Value |
| --- | --- |
| Release tag | [`v6.2.0-9`](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-9) (annotated; tag object `861a3b5bd4`) |
| Source branch | `release` |
| Source commit | [`a5b682dd20`](https://github.com/rubennati/cal.diy/commit/a5b682dd20cb6cf9e90b52c84729f38727fc2475) |
| Source tree | `3c334d53aa174653303b11980e897b8239284443` |
| Promoted `develop` commit | [`d041548515`](https://github.com/rubennati/cal.diy/commit/d041548515958df8747dc10a74c4b44f798b802a) |
| AMD64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-9` |
| ARM64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-9-arm` |
| AMD64 digest | `sha256:bd6c53d80dcce24c2112c2878947d261f6bc825bda9fe93bf18e7e673d2f3034` |
| ARM64 digest | `sha256:d446cd815cd58143bd466215687d34fb2068440db0056e6fae03df45d1d5e616` |
| Candidate validation run | [`43124326258`](https://github.com/rubennati/cal.diy/actions/runs/43124326258) — the only run that built these images |
| Release workflow run | [`43131284070`](https://github.com/rubennati/cal.diy/actions/runs/43131284070) — promotion only, no build |
| `latest` digest | `sha256:bd6c53d80dcce24c2112c2878947d261f6bc825bda9fe93bf18e7e673d2f3034` (= AMD64; convenience pointer, not the release identity) |
| SBOM artifacts | `sbom-amd64.cdx.json`, `sbom-arm64.cdx.json` (CycloneDX; attached to the GitHub Release) |
| Provenance | SLSA v1 attestations verified against both final digests on 2026-11-12 with `gh attestation verify`; build identity is `develop` commit `d041548515`, where the images were built. `release-record.json` binds that build identity to the release commit and tag |
| Release record | `release-record.json` (GitHub Release asset) |
| GitHub Release | [v6.2.0-9](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-9), published 2026-11-12 by the workflow |
| Rollback target | `v6.2.0-6` at `9b9df424e3` — AMD64 `sha256:538cbb4a22733d262057c4b2a47c700117766816f57732925b077267a0dbe0f1`, ARM64 `sha256:5b2ffcb7fc0e752a40f079a4d580571da680af91238b0bdf1dbe170f246a2250` |

**Unreleased build numbers.** `v6.2.0-7` and `v6.2.0-8` exist as Git tags and are
failed-release evidence, not releases. `v6.2.0-7` has no image. A
`ghcr.io/rubennati/cal.diy:v6.2.0-8` tag exists from the interrupted publication run: AMD64
only, pointing at a manifest list (`sha256:92b6b965…5970`) rather than a validated digest,
with no release record. It must not be deployed. Cause and fix: [.ai/sync-log.md](.ai/sync-log.md)
2026-11-12.

Downstream deployments must use a reviewed version tag or, preferably, a recorded digest.
They must not treat `latest` as a secure deployment target. The complete artifact rules are
defined in [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md).

## Known Limitations

- `type-check:ci` does not cover every workspace package; see
  [.ai/quality-gates.md](.ai/quality-gates.md).
- The Trivy image scan is currently report-only while inherited runtime-image findings are
  reduced; see [.ai/slimming-runtime-plan.md](.ai/slimming-runtime-plan.md).
- ARM64 is published under a separate `-arm` tag rather than a combined multi-architecture
  manifest.

## Maintenance Record

When an upstream review is completed, update this page and the README status line together.
Record the detailed outcome in [.ai/sync-log.md](.ai/sync-log.md), including:

- review date, start commit, and end commit
- accepted and integrated commits
- intentionally deferred commits and reasons
- ledger status and local provenance for every reviewed upstream commit
- additions, modifications, removals, and release-state changes in `FORK_DIVERGENCE.md`
- checks run and known validation gaps
- release tag, source commit, workflow run, image references, and digest when published

Process details remain authoritative in [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md),
[SECURITY_REVIEW.md](SECURITY_REVIEW.md), and [RELEASE_PROCESS.md](RELEASE_PROCESS.md).
