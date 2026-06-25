# Release Process

## Purpose

This document describes how a reviewed state in this fork becomes a tagged GHCR image.

## Release Inputs

Before starting a release:

- `develop` contains the reviewed candidate state
- release gates have passed
- the `develop...release` delta is understood
- the intended version tag is known
- the operator is ready to record the image digest after publish

## Branch Flow

The intended release flow is:

1. review `develop`
2. promote that reviewed state to `release`
3. tag `release`
4. let the GHCR workflow build and publish from the tag
5. capture the digest
6. give downstream deployment the tag and digest

## Promotion Rules

- `release` should represent a reviewed, shippable state.
- If `release` is behind `develop`, update `release` deliberately.
- Do not add unrelated edits during release promotion.
- Prefer a simple promotion path that is easy to audit later.

## Tagging Rules

- Create versioned tags from `release`.
- Treat tags as immutable release identities.
- Keep release notes tied to the exact tag.

## Current Workflow Shape

The current release workflow is:

- [.github/workflows/release-docker.yaml](/Users/rb3nt/Code/cal.diy/.github/workflows/release-docker.yaml:1)

The reusable build helper is:

- [.github/actions/docker-build-and-test/action.yml](/Users/rb3nt/Code/cal.diy/.github/actions/docker-build-and-test/action.yml:1)

The workflow already publishes to:

- `ghcr.io/rubennati/cal.diy`

## Release Modes

### Official release mode

- source branch: `release`
- trigger: reviewed version tag
- output: release image for downstream use

### Temporary validation mode

- source branch: any reviewed branch
- trigger: manual workflow dispatch with `BUILD_FROM_BRANCH=true`
- output: temporary validation tag

Temporary validation tags are useful for testing, but they are not trusted release inputs for secure deployment.

## Downstream Consumption Rule

- `secure-docker-blueprint` should consume reviewed version tags or, preferably, digests.
- Downstream secure deployment must not depend on `latest`.
- If the workflow continues to publish `latest`, treat it as convenience only, not as the secure source of truth.

## Required Release Record

Every release should record:

- version tag
- `release` branch commit SHA
- upstream source commit or tag
- fork-only commits included
- GHCR image reference
- GHCR digest for amd64
- GHCR digest for arm64, if published separately
- release gates run
- manual smoke checks completed

## Rollback Rule

Rollback should point to the previous reviewed version tag or digest, not to `latest`.

## Minimum Release Gates

Before the tag is created:

- reviewed diff understood
- no unexplained fork-only app-source drift
- `yarn type-check:ci --force`
- relevant tests
- build path understood
- image destination confirmed as fork GHCR
- no open question about whether downstream should consume the output
