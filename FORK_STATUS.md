# Fork Status and Transparency

This page records the public maintenance status of `cal.forte`: which upstream state was
seen and reviewed, which changes were actually integrated, and which source produced the
latest release. It complements the chronological [sync log](.ai/sync-log.md) and the
steady-state [divergence record](.ai/divergence.md).

## Current Snapshot

Last verified: **2026-08-10**

| Item | Current state |
| --- | --- |
| Upstream mirror observed | [`176037d0af`](https://github.com/rubennati/cal.diy/commit/176037d0afbe572f870a3c702985e7cd83fe6c0c) |
| Upstream reviewed through | `176037d0af` on 2026-08-10 |
| Latest review range | [`3894f37e14...176037d0af`](https://github.com/rubennati/cal.diy/compare/3894f37e14...176037d0af) (6 commits) |
| Integrated upstream base | [`46eb533dbd`](https://github.com/rubennati/cal.diy/commit/46eb533dbd20b74686efa520684e662c0f21051c) (Cal.com 6.2.0 base) |
| Reviewed `develop` content baseline | [`7927cd2ac7`](https://github.com/rubennati/cal.diy/commit/7927cd2ac7049c7c3e009b2da8fed4da664b603f) (before this status documentation) |
| Reviewed release source | `release` at [`f99367c3a7`](https://github.com/rubennati/cal.diy/commit/f99367c3a75a0b69b59a058caf5e2114c5c0fb7d) |
| Latest published release | [`v6.2.0-4`](https://github.com/rubennati/cal.diy/tree/v6.2.0-4) |
| Published image | `ghcr.io/rubennati/cal.diy:v6.2.0-4` |
| AMD64 digest | `sha256:9818a0be6404bbcf6b330847868d2673ded00b9786ecb6683f49e907cf77a1a8` |

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
| `038381aeca` | IP parsing / banlist enforcement | **Security-relevant; pending integration review.** Trims forwarded-header whitespace to prevent an IP-banlist bypass. |
| `176037d0af` | Email reply-to handling | Relevant functional fix; candidate for selective integration. |
| `5e3fe3cbe6` | Booking phone input | Useful fallback fix; lower priority. |
| `b2c28a23ab` | Language settings | Functional UI fix; deferred pending need. |
| `8418db70c7` | Clara app listing | New integration/feature; not required by the hardened fork. |
| `ab0b9e1fb5` | Booker lint cleanup | No runtime impact; deferred. |

No commit from this review range has been represented as integrated merely because it was
reviewed. The IP-banlist fix should be handled first in the next selective upstream round.

## Integrated Fork State

- `main` is the upstream-near mirror.
- `develop` is the reviewed integration branch.
- `release` is the reviewed source for release tags and GHCR images.
- The merge-base between `develop` and the reviewed upstream line is `46eb533dbd`.
- Security fixes after that base are selectively cherry-picked; they are not evidence of a
  full upstream merge.
- Intentional fork changes and removed upstream behavior are documented in
  [.ai/divergence.md](.ai/divergence.md).

The exact current source difference can be inspected with the
[`main...develop` comparison](https://github.com/rubennati/cal.diy/compare/main...develop).

## Latest Release Evidence

| Evidence | Value |
| --- | --- |
| Release tag | [`v6.2.0-4`](https://github.com/rubennati/cal.diy/tree/v6.2.0-4) |
| Source branch | `release` |
| Source commit | [`f99367c3a7`](https://github.com/rubennati/cal.diy/commit/f99367c3a75a0b69b59a058caf5e2114c5c0fb7d) |
| Promoted `develop` commit | [`8b4a9cd8`](https://github.com/rubennati/cal.diy/commit/8b4a9cd8) |
| AMD64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-4` |
| ARM64 image | `ghcr.io/rubennati/cal.diy:v6.2.0-4-arm` |
| AMD64 digest | `sha256:9818a0be6404bbcf6b330847868d2673ded00b9786ecb6683f49e907cf77a1a8` |
| Release workflow run | [`30223216533`](https://github.com/rubennati/cal.diy/actions/runs/30223216533) |

Downstream deployments must use a reviewed version tag or, preferably, a recorded digest.
They must not treat `latest` as a secure deployment target. The complete artifact rules are
defined in [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md).

## Known Limitations

- `type-check:ci` does not cover every workspace package; see
  [.ai/quality-gates.md](.ai/quality-gates.md).
- The Trivy image scan is currently report-only while inherited runtime-image findings are
  reduced; see [.ai/slimming-runtime-plan.md](.ai/slimming-runtime-plan.md).
- The latest reviewed upstream range contains a security-relevant IP-banlist fix that is not
  yet recorded as integrated.
- ARM64 is published under a separate `-arm` tag rather than a combined multi-architecture
  manifest.

## Maintenance Record

When an upstream review is completed, update this page and the README status line together.
Record the detailed outcome in [.ai/sync-log.md](.ai/sync-log.md), including:

- review date, start commit, and end commit
- accepted and integrated commits
- intentionally deferred commits and reasons
- checks run and known validation gaps
- release tag, source commit, workflow run, image references, and digest when published

Process details remain authoritative in [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md),
[SECURITY_REVIEW.md](SECURITY_REVIEW.md), and [RELEASE_PROCESS.md](RELEASE_PROCESS.md).
