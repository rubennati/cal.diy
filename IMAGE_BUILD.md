# Image Build

## Purpose

This document describes the current image build assets in this repository and the intended release source of truth.

## Current Build Assets

Web image build:

- [Dockerfile](/Users/rb3nt/Code/cal.diy/Dockerfile:1)

API v2 image build:

- [apps/api/v2/Dockerfile](/Users/rb3nt/Code/cal.diy/apps/api/v2/Dockerfile:1)

Release workflow:

- [.github/workflows/release-docker.yaml](/Users/rb3nt/Code/cal.diy/.github/workflows/release-docker.yaml:1)

Reusable build helper:

- [.github/actions/docker-build-and-test/action.yml](/Users/rb3nt/Code/cal.diy/.github/actions/docker-build-and-test/action.yml:1)

## Current Release Source Of Truth

For the fork release process, the source of truth is the GHCR image produced by the release workflow from a reviewed tag on `release`.

That means:

- the workflow output is the deployable artifact
- the tag identifies the reviewed source state
- the digest identifies the exact image to deploy

## Current Behavior Summary

- The published release image is currently `linux/amd64` only (verified on the
  `v6.2.0-2` manifest: amd64 + a build attestation, no arm64). arm64 is not required
  for now; revisit the reusable action's multi-arch output if ARM deployment is needed.
- The reusable action publishes to `ghcr.io/rubennati/cal.diy`.
- The workflow currently builds from the root [Dockerfile](/Users/rb3nt/Code/cal.diy/Dockerfile:1).
- The API v2 Dockerfile exists, but it is not the current fork GHCR release artifact.

## Release Guidance

- Use reviewed version tags for release publication.
- Prefer digests for downstream secure deployment.
- Do not rely on `latest` for secure deployment.
- Treat branch-based workflow dispatch outputs as test artifacts unless explicitly promoted later.

## Build Inputs To Watch

During every release review, inspect:

- workflow tag source
- image name and registry
- build arguments
- runtime environment expectations
- test step behavior
- whether any secret-like value is used during build

## Current Known Follow-Up Items

These are not changed in this pass, but they should be corrected later:

- README still references upstream DockerHub
- docker docs still reference upstream DockerHub
- `docker-compose.yml` still points at upstream image names
- workflow wording still needs to stay aligned with actual GHCR behavior

## What This Repository Should Hand To Downstream

Downstream secure deployment should receive:

- reviewed release tag
- GHCR image reference
- image digest
- short release note describing the source commit and checks run

## Practical Release Output Format

Use a simple release record like:

```text
tag: vX.Y.Z
source branch: release
source commit: <sha>
upstream base: <sha-or-tag>
image: ghcr.io/rubennati/cal.diy:vX.Y.Z
digest: sha256:<digest>
checks: type-check, tests, smoke-check
```
