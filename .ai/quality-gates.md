# Quality Gates

Use these as the minimum AI-facing gates before treating a change as ready for review.

Always:

- keep the diff focused
- avoid secret exposure
- verify the target branch and scope
- check the authoritative process docs before touching release behavior

For fork/release work:

- diff is understood
- branch role is respected
- no upstream sync without approval
- no image publish without approval
- no commit without approval
- `git diff --check`
- one upstream commit per local `git cherry-pick -x` in the current intake; no new
  aggregate/squash cherry-picks
- every reviewed upstream commit has a disposition in `UPSTREAM_REVIEW_LEDGER.md`
- install/lifecycle scripts leave tracked source clean
- `scripts/fork-guard-telemetry.sh` — blocking step in `forte-ci`; fails if the removed
  upstream telemetry module, its Jitsu endpoint/key, `next-collect`, or the
  `CALCOM_TELEMETRY_DISABLED` flag reappear through a sync

## Mechanically enforced branch protection

Prior to issue #47, every gate above was convention only — nothing in GitHub prevented a
merge with `forte-ci` failing. `develop` sat red for over an hour on 2026-08-26 as a direct
consequence: PR #41 merged while the telemetry guard was failing, which meant the following
`Type check` and `Lint` steps had been silently skipped for that entire window. See
[FORK_PROCESS.md](../FORK_PROCESS.md) → *Branch Contract and Required Checks* for what is
actually enforced, and why `main` deliberately keeps a different policy from `develop` and
`release`.

The load-bearing distinction: **required status checks** (`develop`, `release`) are a
mechanical merge blocker; **report-only scanners** (CodeQL, Trivy, Scorecard) are visible
findings a human evaluates, per `SECURITY_ASSURANCE.md` §5b.3 — converting them into blocking
gates wholesale is deliberately rejected there, because their severity alone does not equal
applicability, reachability, or shipped-component status.

**No markdown gate exists.** `biome check docs/` reports *"Checked 1 file"* — Biome has no markdown
support configured here, and `lint-staged.config.mjs` covers only `js/ts/jsx/tsx` plus
`schema.prisma`. Documentation formatting and link integrity are therefore **not** machine-verified
by any gate. The 2026-08-26 audit validated its own output with an ad-hoc relative-link check; if
documentation volume keeps growing, a link checker is the cheapest gate to add.

**Coverage caveat — `type-check:ci` does not cover the repo.** turbo has 113 packages in
scope but only the packages that *define* the script actually run one (7 upstream + this
fork's `packages/lib`). Files with no importers are otherwise in no tsc program at all and
rot silently — that is how `packages/lib/telemetry.ts` kept a dangling type reference for
months. The 2026-08-26 audit found the sharper case: the 18 `return true` permission stubs
**type-check perfectly**, so neither tsc, Biome nor CodeQL flags `return true` in a function named
`checkPermission` (`../docs/PBAC_PLACEHOLDER_AUDIT.md`). Neither does anything flag a deleted
Next.js route whose router and UI remain wired (`../docs/SELF_HOST_CAPABILITY_AUDIT.md` F-05). When auditing a package for dead or rotted code, check whether it defines
`type-check` before trusting a green CI run. Remaining gaps are listed in
[roadmap.md](roadmap.md).

For release readiness, follow:

- [../RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
- [../SECURITY_REVIEW.md](../SECURITY_REVIEW.md)
- [../CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md)

Minimum release checks called out in the process layer include:

- `yarn type-check:ci --force`
- relevant tests
- reviewed GHCR target
- recorded image tag or digest
- tag commit equals the reviewed `origin/release` head
- AMD64 and ARM64 digests, SBOMs, provenance, and finalizer status are recorded
- no dependency on `latest` for secure downstream deployment
