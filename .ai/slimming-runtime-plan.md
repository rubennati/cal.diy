# Runtime-Image Slimming — plan (read-only analysis)

The built image ships the whole monorepo build tree (all `node_modules` incl. dev, all
`apps/web` incl. tests): the runner does `COPY --from=builder-two /calcom ./` and the build
does `RUN yarn install` (every dependency). Next.js `standalone` is enabled
(`BUILD_STANDALONE=true`) but **unused**. This inflates image size and the Trivy CVE count
(most findings are dev/build tooling) — and is why the Trivy image scan is currently
report-only, not blocking.

## The key constraint

The container boot (`scripts/start.sh`) runs:

```
npx prisma migrate deploy   # prisma is a PROD dep → survives a prune ✅
npx ts-node --transpile-only scripts/seed-app-store.ts   # ts-node is a DEV dep ⚠️
next start                  # prod runtime ✅
```

A naive `--production` prune **breaks the boot seed** because `ts-node` is a devDependency
(in `apps/web` + `packages/prisma`). Prisma CLI is fine (prod dep). This constraint drives
the staging below.

## Staged plan (low → high risk; each gated by a test build)

### Stage 1 — exclude test files (low-risk, do first)
`.dockerignore` currently excludes `.next`, `node_modules`, coverage, `.turbo`, docs — but
NOT tests. Add:

```
**/playwright
**/e2e
**/__tests__
**/__mocks__
**/*.test.*
**/*.spec.*
```

Removes `apps/web/playwright/` (81 files) + all test sources from the image → kills the Trivy
"Stripe secret" false positives. Runtime-safe (tests aren't used at boot).

### Stage 2 — drop dev dependencies (the big win)
Blocker: the boot seed needs `ts-node`. Fix first, then prune:

1. **Pre-compile the seed** at build time (e.g. `esbuild scripts/seed-app-store.ts` →
   `seed-app-store.js`) and change `start.sh` to `node scripts/seed-app-store.js` → `ts-node`
   no longer needed at runtime.
2. Add a production prune before the runner copy (`yarn workspaces focus --production`, or copy
   only prod `node_modules`). Drops vitest, esbuild, `@depot/cli`, turbo, biome, etc.

→ removes most dev/build-tooling CVEs + a large size drop. Risk: MODERATE — must confirm no
other runtime path needs a dev dep.

### Stage 3 — full Next.js standalone (optional, biggest win)
Copy only `.next/standalone` + `.next/static` + `public` + prisma + scripts (+ compiled seed);
start via `node server.js`. Only if Stage 2 isn't enough; highest risk (the standalone trace
may miss cal.com's non-standard boot steps).

## How to test safely

`release-docker` already has a **Test runtime** health-check step. Validate each stage with a
**non-publishing** build: `workflow_dispatch` with `PUSH_IMAGE=false` (or a throwaway tag).
Only promote to a real release once a test build boots + serves green. When Stage 2 lands and
the CVE count drops, flip the Trivy scan back to **blocking** (`exit-code: 1`) in
`.github/actions/docker-build-and-test/action.yml`.
