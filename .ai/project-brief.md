# Project Brief

This repository is a controlled fork of Cal.diy.

Purpose:

- review upstream changes before they become deployable artifacts
- keep fork-only drift small and auditable
- produce reviewed GHCR images for downstream consumption

Branch intent:

- `main`: intended upstream mirror
- `develop`: review/integration
- `release`: reviewed release/tag/GHCR branch

Important boundary:

- `secure-docker-blueprint` is a separate repository with separate responsibilities
- this repository produces reviewed images; it does not define downstream deployment hardening
