# Roadmap

Living list of open work for the fork. Durable posture: [../FORK_STRATEGY.md](../FORK_STRATEGY.md).
Steady-state divergence: [divergence.md](divergence.md). Timeline: [sync-log.md](sync-log.md).

## Now / next (in cal.forte)

_Base documented in [state.md](state.md) (cal.com 6.2.0, merge-base `46eb533d`). The one
remaining big item is code-slimming below._

## Later (bigger — needs its own sub-plan before touching)

- **Code-slimming** — remove unused features / attack surface. Candidates: Trigger.dev,
  parts of the App-Store, EE modules. **HIGH RISK** on a cal.com monorepo: do per-module,
  behind a plan, build + `type-check:ci` gated, one reviewable PR each. Resolves the
  ❓ rules (`patterns-trigger-dev`, `patterns-app-store`, `data-prisma-feature-flags`,
  `agents/skills/calcom-api`).
- **arm64** — only if ARM deployment becomes needed (currently amd64-only by choice).

## Deferred to `secure-docker-blueprint` (separate repo, handled elsewhere)

- Runtime resource limits validated vs Cal.com reqs (min 2 vCPU / 4 GB, rec 4 vCPU / 8 GB;
  build needs ~6 GB heap, runtime is lighter — don't set the app container too low)
- Secret management (SOPS+age → Infisical when multi-service)
- Local `compose.local.yml` (no Traefik) for quick local testing
