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

**Coverage caveat — `type-check:ci` does not cover the repo.** turbo has 113 packages in
scope but only the packages that *define* the script actually run one (7 upstream + this
fork's `packages/lib`). Files with no importers are otherwise in no tsc program at all and
rot silently — that is how `packages/lib/telemetry.ts` kept a dangling type reference for
months. When auditing a package for dead or rotted code, check whether it defines
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
