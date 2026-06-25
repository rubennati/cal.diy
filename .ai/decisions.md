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
- downstream secure deployment must prefer reviewed tags or digests over `latest`
- `secure-docker-blueprint` is a separate consumer repository, not part of this repository

AI-layer decision:

- keep AI collaboration lightweight and fork-specific
- do not import a full project-standard template tree into this existing fork
