---
title: CI Check Failure Handling
impact: HIGH
impactDescription: Misinterpreting CI failures wastes debugging time
tags: ci, debugging, workflow
---

# CI Check Failure Handling

## The fork's CI

Only fork-owned workflows run — the upstream workflows are disabled on `main`
(see [FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md) → Security And Privacy Changes):

- **`forte-ci`** — four fork guards + a whitespace check (blocking, every event), then
  `yarn type-check:ci` (blocking) + Biome lint (report-only for now)
- **`forte-codeql` / `forte-trivy` / `forte-scorecard`** — security scans; findings go to
  **Security → Code scanning** and do not block merges
- **`release-docker`** — builds and publishes the GHCR image on `v*` tags only

`forte-ci` takes a fast path on pull requests whose changed files *all* match `**/*.md` or
`docs/**`: the guards and whitespace check still run, install/type-check/Biome do not. Every
push, and every PR touching anything else, takes the full path. So on a documentation-only PR,
a green `ci` does not tell you the tree type-checks — run `yarn type-check:ci --force` locally
if you need that. See [FORK_PROCESS.md](../../FORK_PROCESS.md) → *Branch Contract and Required
Checks*.

## What to focus on

1. A red **`forte-ci`** run is the one that matters — start with the type-check step.
2. Security-scan findings surface in the Security tab; triage them there, they are not
   PR blockers.
3. Fix type errors first — they are often the root cause and can surface through
   dependencies or type inference even in files you did not touch.

## Before blaming CI

Reproduce locally first:

```bash
yarn install --immutable
yarn type-check:ci --force
```

If it passes locally but fails in CI, compare the runner's Node/yarn setup against
`.github/workflows/forte-ci.yml` before assuming a real regression.
