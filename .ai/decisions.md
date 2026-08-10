# Decisions

Durable fork decisions:

- this repository is a controlled fork of Cal.diy
- `main` is intended as the upstream mirror branch
- `develop` is the review/integration branch
- `release` is the reviewed release/tag/GHCR branch
- upstream sync requires explicit approval
- image publish requires explicit approval
- commit creation requires explicit approval
- secrets must never be printed, copied, committed, or exposed
- app source changes must be minimal, evidence-based, and reviewed
- selective upstream intake uses one `git cherry-pick -x` per upstream commit
- multiple upstream commits must never be squashed into a local aggregate commit
- partial upstream intake must identify retained/omitted scope in `UPSTREAM_REVIEW_LEDGER.md`
- downstream secure deployment must prefer reviewed tags or digests over `latest`
- `secure-docker-blueprint` is a separate consumer repository, not part of this repository
- manual Docker workflow dispatch is validation-only and cannot publish
- a release tag must be annotated, match `vX.Y.Z-N`, and point exactly to `origin/release`
- the exact runtime-tested/scanned image is the image that gets pushed
- AMD64/ARM64 digests, SBOMs, provenance, and finalizer status are release evidence

AI-layer decision:

- keep AI collaboration lightweight and fork-specific
- do not import a full project-standard template tree into this existing fork
