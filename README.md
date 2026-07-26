> [!IMPORTANT]
> **cal.forte — a hardened, controlled fork of Cal.diy. This is not upstream.**
> You are on the `develop` (integration / review) branch. It intentionally diverges
> from upstream and is **not a deployment target**. Deployable images are built only
> from the `release` branch. Read the rules below before using anything here.

# cal.forte

A security-first, review-gated fork of [Cal.diy](https://github.com/rubennati/cal.diy/blob/main/README.md).
Upstream is excellent in scope and features, but self-hosting it demands care — this
fork exists to keep that care **explicit and auditable**: stay current on upstream
security fixes, keep fork-only drift small, and shrink the attack surface over time.

Upstream marketing, badges and unused material are intentionally removed here to cut
noise. For the full upstream README (install/config reference), see the
[`main` branch](https://github.com/rubennati/cal.diy/blob/main/README.md).

## Branch model

| Branch    | Purpose                                     | Deploy?            |
|-----------|---------------------------------------------|--------------------|
| `main`    | Untouched upstream mirror                   | no                 |
| `develop` | Fork integration & review (this branch)     | no                 |
| `release` | Reviewed source for the GHCR Docker image   | tag / digest only  |

Full contract: [FORK_PROCESS.md](FORK_PROCESS.md)

## What differs from upstream

Exact, always-current diff (no hand-maintained list to rot):
**https://github.com/rubennati/cal.diy/compare/main...develop**

- *Which kinds* of change are allowed, and which sensitive areas must not drift:
  [FORK_PROCESS.md → Allowed Fork Divergence](FORK_PROCESS.md).
- *Why* each sync/security round was done the way it was: [.ai/sync-log.md](.ai/sync-log.md).

## Security fix policy

Falling behind upstream on **security** fixes is the one drift this fork does not
tolerate. Security-relevant upstream commits are taken by default — even when a full
sync is deferred and `develop` otherwise stays consciously curated. The process and
the quick scan command live in [UPSTREAM_SYNC.md → Security Fix Priority](UPSTREAM_SYNC.md).

## Rules that apply

- [FORK_PROCESS.md](FORK_PROCESS.md) — branch contract & operating cycle
- [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) — how upstream is pulled in (security-first)
- [RELEASE_PROCESS.md](RELEASE_PROCESS.md) — how a release is cut
- [IMAGE_BUILD.md](IMAGE_BUILD.md) — how the image is built
- [SECURITY_REVIEW.md](SECURITY_REVIEW.md) — security review gate
- [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md) — what downstream may trust
- [AGENTS.md](AGENTS.md) + [.ai/](.ai/) — engineering rules & AI operating layer

## Running it

Images are published to `ghcr.io/rubennati/cal.diy` (the image path keeps the
`cal.diy` name for now; `cal.forte` is the fork's identity). Consume a **reviewed
tag or digest** from the `release` branch — never `latest`. The downstream deployment
lives in the separate [`secure-docker-blueprint`](https://github.com/rubennati/secure-docker-blueprint/tree/main/apps/caldiy)
repository.
