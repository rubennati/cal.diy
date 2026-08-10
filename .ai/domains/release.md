# Release Domain

Release work in this fork is tightly scoped.

Rules:

- use [../../RELEASE_PROCESS.md](../../RELEASE_PROCESS.md) as the main release runbook
- use [../../IMAGE_BUILD.md](../../IMAGE_BUILD.md) for image source-of-truth guidance
- use [../../CALDIY_RELEASE_CONTRACT.md](../../CALDIY_RELEASE_CONTRACT.md) for downstream handoff requirements
- do not publish images without explicit approval
- do not assume branch-dispatch test artifacts are trusted releases
- do not treat `latest` as a safe downstream deployment target
- manual workflow dispatch is validation-only and must never publish
- release tags must be annotated, match `vX.Y.Z-N`, and point exactly to `origin/release`
- publish the exact image that was runtime-tested and scanned; never rebuild between gate and push
- record architecture-specific registry digests, SBOMs, provenance, and finalizer status

Branch intent reminder:

- `main`: intended upstream mirror
- `develop`: review/integration
- `release`: reviewed release/tag/GHCR branch

Downstream boundary:

- `secure-docker-blueprint` is a separate repository
- this repository hands off reviewed image tags and, preferably, digests
