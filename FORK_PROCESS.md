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

## Allowed Fork Divergence

Fork-owned changes should stay small and obvious.

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
