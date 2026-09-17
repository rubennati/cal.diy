# State

Where the fork stands right now, and the rules that govern acting on it.
Timeline: [sync-log.md](sync-log.md) · open work: [roadmap.md](roadmap.md) ·
steady-state divergence: [../FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md).

## Operating assumptions (approval gates)

- upstream sync is approval-gated and must not be assumed
- image publication is approval-gated
- commit creation is approval-gated
- app source changes stay smaller than process/workflow changes unless the task requires more
- **no `Co-Authored-By: Claude` trailer** in this repo's commits
- this repo is **public** → never commit real/personal data (company, support address,
  personal logo); those belong in the private deployment

## Status (as of 2026-08-11)

**Identity:** `cal.forte` — hardened, review-gated fork of Cal.diy (MIT community edition).
Upstream intake is selective and recorded commit-by-commit in
[../UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md).

**Branches:** `main` = untouched upstream mirror · `develop` = integration/review ·
`release` = reviewed source for GHCR images. The latest published source is `9b9df424e3`.

**Latest release:** `v6.2.0-6` from `9b9df424e3` (published 2026-08-28):
- AMD64: `ghcr.io/rubennati/cal.diy:v6.2.0-6@sha256:538cbb4a22733d262057c4b2a47c700117766816f57732925b077267a0dbe0f1`
- ARM64: `ghcr.io/rubennati/cal.diy:v6.2.0-6-arm@sha256:5b2ffcb7fc0e752a40f079a4d580571da680af91238b0bdf1dbe170f246a2250`
- rollback target: `v6.2.0-5` from `201b016984` — AMD64 `sha256:c2facc284b28e1eea76b6d82c02e680d20d648dc255ef7f74520dbf30d18b17e`, ARM64 `sha256:dffa387024a68b9b057b1bdf3342a21b699bb092da4f711932f129bd932faeae`

It contains the telemetry removal and guard, repaired `packages/lib` type-check coverage,
the IP-banlist whitespace fix, non-root runtimes, immutable build inputs, and the hardened
two-architecture release pipeline. Release Docker run `31435807941` produced SBOMs,
provenance, and the authoritative release record. Downstream handoff is tracked in
`secure-docker-blueprint` issue #30.

**Release topology:** the one-time content-neutral ancestry reconciliation completed in
`a4e2ff5dcd`; `develop` and `release` were source-identical at published SHA `201b016984`.
Future promotions use the normal fast-forward process in
[../RELEASE_PROCESS.md](../RELEASE_PROCESS.md).

**Security posture:**
- Security fixes are taken from upstream by default; validate they are *real* fixes
  (CVE/advisory + diff) per [../FORK_STRATEGY.md](../FORK_STRATEGY.md).
- Fork CI: `forte-ci` (**fork-guards**/whitespace, then install/type-check/biome),
  `forte-codeql`, `forte-trivy`, `forte-scorecard`, Dependabot. Upstream workflows disabled
  on `main`. PRs changing only `*.md` skip install/type-check/biome; pushes never do.
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
(no UI/wizard/CLI/API) → no team calendars / round-robin. Details: [branding.md](branding.md).

⚠️ **Two claims in `branding.md` were corrected by the 2026-08-26 audit** — read
[../docs/SELF_HOST_CAPABILITY_AUDIT.md](../docs/SELF_HOST_CAPABILITY_AUDIT.md) §9.2 before relying
on them. The Enterprise *paywall gating* is genuinely gone, but two **reachable** hosted-Cal.com
commercial prompts remain (an onboarding `$15/user/mo` plan chooser that dead-ends, and a
`cal.com/signup` upsell shown to every anonymous booker). And "no team creation" is true of every
shipped **runtime** path but not of `scripts/seed.ts`, which creates 7 `Team` rows via the
documented `yarn dx` path — which is what decides the severity of the authorization finding below.

**Audit posture (as of 2026-08-26, documentation only — nothing fixed):**
The capability/authorization/licence/productization audit is recorded in
[../docs/](../docs/) — master: `SELF_HOST_CAPABILITY_AUDIT.md`. Three items bear on release
decisions:
- **Authorization placeholders (F-01).** 18 production files carry `return true` permission stubs;
  11 fail open. An architectural hazard on the published image, a live destructive cross-tenant
  write on any seeded instance. Ranked P1-A and a hard prerequisite for any Teams work.
- **API keys are broken (F-05).** `apps/web/pages/api/trpc/apiKeys/[trpc].ts` is missing, so every
  create/edit/delete fails. Upstream fixed it in `07a288bbd8`; the ledger row for that commit needs
  correcting (see §9.1 of the master — deliberately not edited by the audit).
- **Upstream can move backwards (F-07).** `ab21c7f805` reverted merged upstream fixes together with
  their regression tests. The sync model has no provision for this; `UPSTREAM_SYNC.md` should gain
  one.

## Upstream base

- Tracks cal.com **6.2.0** (`apps/web/package.json` on `main` and `develop`).
- Fork divergence point (merge-base `develop`↔`origin/main`): **`46eb533d`**.
- Mirror `origin/main` last reviewed through `176037d0af`: 50 commits past base, still the
  6.2.0 patch line. Nine complete upstream patches are integrated, none are prepared, and
  41 are not integrated. Exact dispositions and historical aggregate
  provenance are in [../UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md).
- ⚠️ The repo's `v6.2.0` tag points at a **fork** commit (`a39c99f5`), **not** the upstream
  release. Fork release tags are `v6.2.0-1..-5`. Pin bases to the merge-base / real upstream tag.

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
