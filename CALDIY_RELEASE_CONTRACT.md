# Cal.diy Release Contract

An image from this fork may be used by `secure-docker-blueprint` only when all of the following are true.

## Release Identity

- release tag is recorded
- source branch is `release`
- source commit SHA is recorded
- upstream source commit or tag is recorded
- release tag is annotated, matches `vX.Y.Z-N`, and points exactly to `origin/release` head

## Review State

- the diff is understood
- fork-only commits are identified
- no unexplained application-source drift is present
- every upstream commit is represented in `UPSTREAM_REVIEW_LEDGER.md`
- no new intake collapsed multiple upstream commits into an aggregate local commit; the
  immutable historical exception `75c8f5c18f` is fully mapped in the ledger
- partial upstream intake is explicitly scoped and justified

## Checks

- `yarn type-check:ci --force` completed
- relevant tests completed
- `git diff --check` completed
- release workflow target was reviewed
- install/lifecycle scripts left tracked source unchanged
- non-publishing AMD64 and ARM64 image validation completed

## Artifact Rules

- the artifact came from the fork GHCR path
- the version tag is recorded
- the image digest is recorded
- separate AMD64 and ARM64 image references/digests are recorded
- SBOM artifacts and build-provenance attestations are recorded
- the release finalization job completed after both architectures
- downstream secure deployment will use the reviewed tag or digest
- downstream secure deployment will not rely on `latest`

## Operational Rules

- no upstream sync was performed blindly as part of the release
- no release image was accepted without documenting known risks
- rollback target is a previous reviewed tag or digest
- manual workflow dispatch did not publish an image
- an existing release tag or GHCR version tag was not overwritten

## Release Record Template

```text
tag:
source branch:
source commit:
upstream base:
fork-only commits:
amd64 image:
amd64 digest:
arm64 image:
arm64 digest:
workflow run:
SBOM artifacts:
provenance attestations:
checks:
notes:
```
