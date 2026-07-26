> [!IMPORTANT]
> **This is the `release` branch of cal.forte — the hardened Cal.diy fork.**
> Every commit here is meant to be shippable. The deployable artifact is the GHCR
> image built from a **reviewed tag** on this branch — consumed by digest, never `latest`.

# cal.forte — release

Reviewed release source for the fork's Docker image `ghcr.io/rubennati/cal.diy`.
Development and review happen on [`develop`](https://github.com/rubennati/cal.diy/tree/develop);
this branch only carries states that are ready to ship.

## What you may deploy

- a reviewed **version tag** (`vX.Y.Z`), or
- the corresponding **image digest** (`sha256:…`) — preferred

Never deploy from `develop`. Never treat `latest` as a secure input.

## Diff vs upstream

Always-current: **https://github.com/rubennati/cal.diy/compare/main...release**

## Downstream consumer

The reviewed image is consumed by the separate
[`secure-docker-blueprint`](https://github.com/rubennati/secure-docker-blueprint/tree/main/apps/caldiy)
repository, pinned by tag/digest. This repository produces reviewed images; it does
not define downstream deployment hardening.

## Rules that apply

- [RELEASE_PROCESS.md](RELEASE_PROCESS.md) — release runbook
- [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md) — what downstream may trust
- [IMAGE_BUILD.md](IMAGE_BUILD.md) — image source of truth
- [SECURITY_REVIEW.md](SECURITY_REVIEW.md) — security review gate

## Release record

Each release records tag, source commit, upstream base, fork-only commits, image and
digest — template in [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md).
