# Cal.diy Release Contract

An image from this fork may be used by `secure-docker-blueprint` only when all of the following are true.

## Release Identity

- release tag is recorded
- source branch is `release`
- source commit SHA is recorded
- upstream source commit or tag is recorded

## Review State

- the diff is understood
- fork-only commits are identified
- no unexplained application-source drift is present

## Checks

- `yarn type-check:ci --force` completed
- relevant tests completed
- `git diff --check` completed
- release workflow target was reviewed

## Artifact Rules

- the artifact came from the fork GHCR path
- the version tag is recorded
- the image digest is recorded
- downstream secure deployment will use the reviewed tag or digest
- downstream secure deployment will not rely on `latest`

## Operational Rules

- no upstream sync was performed blindly as part of the release
- no release image was accepted without documenting known risks
- rollback target is a previous reviewed tag or digest

## Release Record Template

```text
tag:
source branch:
source commit:
upstream base:
fork-only commits:
image:
digest:
checks:
notes:
```
