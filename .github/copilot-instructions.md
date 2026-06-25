# Copilot Instructions

This repository is a controlled fork of Cal.diy.

- Read [AGENTS.md](../AGENTS.md) first.
- Use [FORK_PROCESS.md](../FORK_PROCESS.md), [RELEASE_PROCESS.md](../RELEASE_PROCESS.md), and [SECURITY_REVIEW.md](../SECURITY_REVIEW.md) for fork and release behavior.
- Treat `main` as the intended upstream mirror branch, `develop` as review/integration, and `release` as the reviewed release/tag/GHCR branch.
- Do not assume upstream sync already exists.
- Do not sync upstream, publish images, or create commits unless explicitly approved.
- Do not print, copy, commit, or expose secrets.
- Keep app source changes minimal, evidence-based, and reviewed.
- `secure-docker-blueprint` is a separate repository that only consumes reviewed images, tags, or digests.
