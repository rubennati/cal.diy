# State

Where the fork stands right now, and the rules that govern acting on it.
Timeline: [sync-log.md](sync-log.md) · open work: [roadmap.md](roadmap.md) ·
steady-state divergence: [divergence.md](divergence.md).

## Operating assumptions (approval gates)

- upstream sync is approval-gated and must not be assumed
- image publication is approval-gated
- commit creation is approval-gated
- app source changes stay smaller than process/workflow changes unless the task requires more
- **no `Co-Authored-By: Claude` trailer** in this repo's commits
- this repo is **public** → never commit real/personal data (company, support address,
  personal logo); those belong in the private deployment

## Status (as of 2026-07-26)

**Identity:** `cal.forte` — hardened, review-gated fork of Cal.diy (MIT community edition).
41 fork commits since the upstream base.

**Branches:** `main` = untouched upstream mirror · `develop` = integration/review ·
`release` = reviewed source for the GHCR image (currently `11cbb281`).

**Latest release:** `v6.2.0-3` — `ghcr.io/rubennati/cal.diy:v6.2.0-3`,
digest `sha256:e5311b428005b74e3c1771b58d8429adf436e5da48b33b0f12bb037cfb8c627a`
(amd64; arm64 is published as a separate `-arm` tag, no merged multi-arch manifest).
Contains: cal.forte branding, hardened defaults (telemetry/ads off), next-auth 4.24.15.

**Security posture:**
- Security fixes are taken from upstream by default; validate they are *real* fixes
  (CVE/advisory + diff) per [../FORK_STRATEGY.md](../FORK_STRATEGY.md).
- Fork CI: `forte-ci` (install/type-check/biome), `forte-codeql`, `forte-trivy`,
  `forte-scorecard`, Dependabot. Upstream workflows disabled on `main`.
- The **Trivy image scan is report-only** (not blocking) until the runtime image is slimmed —
  the inherited image ships dev/build tooling whose CVEs would block every release.
  Rationale + re-enable condition: [slimming-runtime-plan.md](slimming-runtime-plan.md).

**Slimming:** feature/code removal was analysed and rejected (attack surface is
config-controlled — [slimming-analysis.md](slimming-analysis.md)). Runtime-image slimming
Stage 1 (E2E suites out of the image) is **done and verified**; Stage 2 (drop dev deps,
needs the boot seed pre-compiled) is the next lever.

**Not in this edition:** Workflows, Insights, SAML/SSO, audit logs, and **team creation**
(no UI/wizard/CLI/API) → no team calendars / round-robin. The Enterprise paywall/upsell UI is
already removed upstream-side. Details: [branding.md](branding.md).

## Upstream base

- Tracks cal.com **6.2.0** (`apps/web/package.json` on `main` and `develop`).
- Fork divergence point (merge-base `develop`↔`origin/main`): **`46eb533d`**.
- Mirror `origin/main` at `3894f37`: 44 commits past base, still 6.2.0 patch line. Security
  fixes among them are cherry-picked; the rest are deferred features/refactors.
- ⚠️ The repo's `v6.2.0` tag points at a **fork** commit (`a39c99f5`), **not** the upstream
  release. Fork release tags are `v6.2.0-1..-3`. Pin bases to the merge-base / real upstream tag.

## Knowledge base map

Understand the app: [architecture.md](architecture.md) (layout, 3 config planes, hardening
levers) · [env-reference.md](env-reference.md) (every env var, prioritised) ·
[branding.md](branding.md) (white-labeling build-vs-runtime, CE-vs-EE).
Apply it: [hardening-checklist.md](hardening-checklist.md) ·
[../config/cal.forte.env.example](../config/cal.forte.env.example).
Process: [../FORK_PROCESS.md](../FORK_PROCESS.md) · [../FORK_STRATEGY.md](../FORK_STRATEGY.md) ·
[../UPSTREAM_SYNC.md](../UPSTREAM_SYNC.md) · [../RELEASE_PROCESS.md](../RELEASE_PROCESS.md).

## Always verify live repo state before acting

remotes · current branch · staged changes · workflow targets
