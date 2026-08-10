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

## Status (as of 2026-08-10)

**Identity:** `cal.forte` — hardened, review-gated fork of Cal.diy (MIT community edition).
Upstream intake is selective and recorded commit-by-commit in
[../UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md).

**Branches:** `main` = untouched upstream mirror · `develop` = integration/review ·
`release` = reviewed source for the GHCR image (currently `f99367c3`).

**Latest release:** `v6.2.0-4` — `ghcr.io/rubennati/cal.diy:v6.2.0-4`,
digest `sha256:9818a0be6404bbcf6b330847868d2673ded00b9786ecb6683f49e907cf77a1a8`
(amd64; arm64 is published as a separate `-arm` tag, no merged multi-arch manifest).
Contains: cal.forte branding, hardened defaults (ad-tracking off, plus the then-still-present
`CALCOM_TELEMETRY_DISABLED=1`), next-auth 4.24.15, websocket-driver 0.7.5, and a slimmed
image (Stage 1 + 2).

**Unreleased on `develop`:** the upstream telemetry module and the
`CALCOM_TELEMETRY_DISABLED` flag are **gone** (the flag gated nothing — see
[divergence.md](divergence.md)). No runtime behaviour changes, but the Dockerfile did, so
the next image differs from `v6.2.0-4`. `packages/lib` now type-checks in CI, and four
orphaned rotted files were deleted.

**Release topology blocker:** `origin/release` ends at `f99367c3` with five historical
release-only commits and is not an ancestor of `origin/develop`. Complete the one-time
content-neutral ancestry reconciliation in [../RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
before the next fast-forward promotion; never force-push `release` to bypass it.

**Security posture:**
- Security fixes are taken from upstream by default; validate they are *real* fixes
  (CVE/advisory + diff) per [../FORK_STRATEGY.md](../FORK_STRATEGY.md).
- Fork CI: `forte-ci` (install/**fork-guard**/type-check/biome), `forte-codeql`,
  `forte-trivy`, `forte-scorecard`, Dependabot. Upstream workflows disabled on `main`.
- **Known gate limitation:** `type-check:ci` covers only the 8 packages that define the
  script, out of 113 in turbo's scope. Files with no importers are in no tsc program and rot
  unnoticed. Do not read a green CI run as "the tree compiles" —
  [quality-gates.md](quality-gates.md), remaining gaps in [roadmap.md](roadmap.md).
- The **Trivy image scan is report-only** (not blocking) until the runtime image is slimmed —
  the inherited image ships dev/build tooling whose CVEs would block every release.
  Rationale + re-enable condition: [slimming-runtime-plan.md](slimming-runtime-plan.md).

**Slimming:** feature/code removal was analysed and rejected (attack surface is
config-controlled — [slimming-analysis.md](slimming-analysis.md)). Runtime-image slimming
**Stage 1 + 2 are done, verified and shipped** in `v6.2.0-4` (CRITICALs 8 → 4). Stage 3
(full Next.js standalone) is **deliberately not pursued**: it would rewrite the boot chain
(`turbo run start`, `ts-node` seed, `prisma migrate`) for mostly a size win —
[slimming-runtime-plan.md](slimming-runtime-plan.md).

**Not in this edition:** Workflows, Insights, SAML/SSO, audit logs, and **team creation**
(no UI/wizard/CLI/API) → no team calendars / round-robin. The Enterprise paywall/upsell UI is
already removed upstream-side. Details: [branding.md](branding.md).

## Upstream base

- Tracks cal.com **6.2.0** (`apps/web/package.json` on `main` and `develop`).
- Fork divergence point (merge-base `develop`↔`origin/main`): **`46eb533d`**.
- Mirror `origin/main` last reviewed through `176037d0af`: 50 commits past base, still the
  6.2.0 patch line. Eight complete upstream patches are integrated, one security fix is
  prepared locally, and 41 are not integrated. Exact dispositions and historical aggregate
  provenance are in [../UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md).
- ⚠️ The repo's `v6.2.0` tag points at a **fork** commit (`a39c99f5`), **not** the upstream
  release. Fork release tags are `v6.2.0-1..-4`. Pin bases to the merge-base / real upstream tag.

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
