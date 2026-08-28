# Fork Status and Transparency

This page records the public maintenance status of `cal.forte`: which upstream state was
seen and reviewed, which changes were actually integrated, and which source produced the
latest release. It complements the chronological [sync log](.ai/sync-log.md) and the
public [fork divergence register](FORK_DIVERGENCE.md). Commit-level accepted, partial,
deferred, and rejected decisions are recorded in
[UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md).

## Current Snapshot

Last verified: **2026-08-28**

| Item | Current state |
| --- | --- |
| Upstream mirror observed | [`176037d0af`](https://github.com/rubennati/cal.diy/commit/176037d0afbe572f870a3c702985e7cd83fe6c0c) |
| Upstream reviewed through | `176037d0af` on 2026-08-10 |
| Latest review range | [`3894f37e14...176037d0af`](https://github.com/rubennati/cal.diy/compare/3894f37e14...176037d0af) (6 commits) |
| Integrated upstream base | [`46eb533dbd`](https://github.com/rubennati/cal.diy/commit/46eb533dbd20b74686efa520684e662c0f21051c) (Cal.com 6.2.0 base) |
| Latest published source baseline | [`9b9df424e3`](https://github.com/rubennati/cal.diy/commit/9b9df424e3f3ad94fd4a5fc4c5387764f1dbce65) |
| Reviewed publication branch | [`release`](https://github.com/rubennati/cal.diy/tree/release) |
| Latest published release | [`v6.2.0-6`](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-6) |
| Published AMD64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-6` |
| Published ARM64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-6-arm` |
| AMD64 digest | `sha256:538cbb4a22733d262057c4b2a47c700117766816f57732925b077267a0dbe0f1` |
| ARM64 digest | `sha256:5b2ffcb7fc0e752a40f079a4d580571da680af91238b0bdf1dbe170f246a2250` |

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

- Review date: **2026-08-10**
- Previous review anchor: `3894f37e14`
- Reviewed through: `176037d0af`

| Upstream commit | Area | Review result |
| --- | --- | --- |
| `038381aeca` | IP parsing / banlist enforcement | **Integrated in full on 2026-08-10 as `29d686fa67` and released in `v6.2.0-5`.** Trims forwarded-header whitespace to prevent an IP-banlist bypass. |
| `176037d0af` | Email reply-to handling | Relevant functional fix; candidate for selective integration. |
| `5e3fe3cbe6` | Booking phone input | Useful fallback fix; lower priority. |
| `b2c28a23ab` | Language settings | Functional UI fix; deferred pending need. |
| `8418db70c7` | Clara app listing | New integration/feature; not required by the hardened fork. |
| `ab0b9e1fb5` | Booker lint cleanup | No runtime impact; deferred. |

Only the IP-banlist fix from this review range has been integrated. The other five commits
retain their recorded candidate, deferred, or rejected status.

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
| Release tag | [`v6.2.0-6`](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-6) (annotated; tag object `02d429dad2`) |
| Source branch | `release` |
| Source commit | [`9b9df424e3`](https://github.com/rubennati/cal.diy/commit/9b9df424e3f3ad94fd4a5fc4c5387764f1dbce65) |
| Source tree | `8db16d911d822c19331aaabb406eb846cacec673` |
| Promoted `develop` commit | [`889b7cc6ce`](https://github.com/rubennati/cal.diy/commit/889b7cc6ceabebb6b8d4465ebc9181189d96c071) |
| AMD64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-6` |
| ARM64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-6-arm` |
| AMD64 digest | `sha256:538cbb4a22733d262057c4b2a47c700117766816f57732925b077267a0dbe0f1` |
| ARM64 digest | `sha256:5b2ffcb7fc0e752a40f079a4d580571da680af91238b0bdf1dbe170f246a2250` |
| Release workflow run | [`33159543959`](https://github.com/rubennati/cal.diy/actions/runs/33159543959) |
| `latest` digest | `sha256:538cbb4a22733d262057c4b2a47c700117766816f57732925b077267a0dbe0f1` (= AMD64; convenience pointer, not the release identity) |
| SBOM artifacts | `release-sbom-amd64-v6.2.0-6`, `release-sbom-arm64-v6.2.0-6` (CycloneDX 1.6, 5,499 components each; also attached to the GitHub Release) |
| Provenance | SLSA v1 attestations verified against both final digests; `sourceRepositoryDigest` = release commit at `refs/tags/v6.2.0-6` |
| Release record | `release-record.json` (workflow artifact and GitHub Release asset) |
| GitHub Release | [v6.2.0-6](https://github.com/rubennati/cal.diy/releases/tag/v6.2.0-6), published 2026-08-28 |
| Rollback target | `v6.2.0-5` at `201b016984` — AMD64 `sha256:c2facc284b…d18b17e`, ARM64 `sha256:dffa387024…932faeae` |
| Downstream handoff | [secure-docker-blueprint issue #30](https://github.com/rubennati/secure-docker-blueprint/issues/30) |

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
