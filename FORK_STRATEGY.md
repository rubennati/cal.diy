# Fork Strategy

How `cal.forte` is maintained long-term — the "why and how we go forward" layer.
Companion to [FORK_PROCESS.md](FORK_PROCESS.md) (branch/release mechanics) and
[UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) (sync runbook). Living roadmap: [.ai/roadmap.md](.ai/roadmap.md).

## Posture: stable, security-first, minimal divergence

This fork is **not** chasing upstream features. The current feature set is sufficient
for its purpose (a stable, hardened, auditable self-host image). Therefore:

- **Pull by default:** security fixes, dependency/vulnerability fixes, and changes to
  interfaces we depend on (auth, booking, calendar sync, Prisma schema, public routes,
  Docker/build, webhooks/cron).
- **Skip by default:** new features, UI churn, refactors — unless a security fix
  depends on them. Record deferrals in [.ai/sync-log.md](.ai/sync-log.md).
- **Minimise the fork:** every fork-only change is maintenance cost. Prefer removing
  cruft over adding. Track steady-state divergence in
  [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md).

This mirrors documented fork best practice: keep the upstream mirror untouched, keep
custom changes small/isolated/documented, and minimise divergence so future syncs stay
cheap. Lagging on upstream security fixes is the main fork risk ("one-day
vulnerabilities") — hence security is taken by default.

## Adding features (opt-in, deliberate)

Wanting a feature is fine, but it is a conscious decision, not a default. Either pull
the specific upstream feature commits deliberately, or add a fork-owned change — in both
cases record it in [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md) so the divergence stays known.

## Upstream base: pin to a release tag

`main` mirrors upstream; `develop` should be based on a **named upstream release tag**,
not an arbitrary `main` commit, so the fork's base is identifiable and reproducible.
Record the base tag in each [sync-log](.ai/sync-log.md) entry.

## Upstream commit triage (every sync)

1. List what changed since our base: `git log --oneline <base>..origin/main`.
2. Classify each commit: **security** / **interface-we-depend-on** / **feature-or-other**.
3. Record every commit in [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md).
4. Take security + required-interface; defer the rest and record why.
5. Security scan command: [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) → Security Fix Priority.

## Security-fix validation (don't trust the commit subject)

A commit titled `fix: security …` is a claim, not proof. Before taking it, confirm it
is a real, relevant fix:

- **Real advisory/CVE?** Check the linked PR/issue for a GHSA/CVE id or security label.
- **Read the diff, not the title.** Does it actually change a security-relevant path
  (auth, input validation, escaping, access control, a vulnerable dependency)?
- **Does it affect us?** If the code path/feature isn't in our (possibly slimmed) build,
  mark it N/A rather than taking it blindly.
- **Dependency bumps:** confirm the package is actually used and the advisory applies
  (direct vs transitive).
- Cherry-pick one upstream commit at a time with `-x` (records the upstream SHA); add the
  CVE/GHSA id to the message when one exists.

## Commit provenance and partial intake

- Never squash multiple upstream commits into one local commit.
- Keep fork-specific adaptations in a separate follow-up commit that names the upstream SHA.
- If only part of an upstream change is suitable, record it as `partial` in
  [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md), including retained and omitted
  behavior. Do not label a hand-selected patch as a full cherry-pick.
- A deliberate full upstream release merge may preserve the original upstream commits and
  merge topology. It must not replace them with one synthetic aggregate commit.
- Historical aggregate commit `75c8f5c18f` remains immutable; its four complete upstream
  patches are mapped individually in the ledger and the pattern must not be repeated.

## Cadence

- Scan upstream for security-relevant changes on a regular cadence (e.g. weekly) and
  before cutting any release, using the triage above.
- A scan that takes nothing is still recorded — a dated "no security-relevant changes"
  line in the sync-log — so the timeline shows the fork was actively watched.
