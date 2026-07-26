# Roadmap

Living list of open work for the fork. Durable posture: [../FORK_STRATEGY.md](../FORK_STRATEGY.md).
Steady-state divergence: [divergence.md](divergence.md). Timeline: [sync-log.md](sync-log.md).

## Now / next (in cal.forte)

_Base documented in [state.md](state.md) (cal.com 6.2.0, merge-base `46eb533d`). The one
remaining big item is code-slimming below._

## Later (bigger — needs its own sub-plan before touching)

- **Code-slimming** — analysed in [slimming-analysis.md](slimming-analysis.md):
  attack surface is mostly **config-controlled** (app-store apps default-disabled in the
  DB; async-tasker / webhooks / app-sync / orgs are env-gated; EE is absent in the DIY
  edition). The real lever is **configuration hardening in `secure-docker-blueprint`**,
  not code removal. Actual code deletion is high-risk / low-gain and optional (image size
  only). The ❓ rules stay (kept, marked in divergence).
- **arm64** — only if ARM deployment becomes needed (currently amd64-only by choice).

## Deferred to `secure-docker-blueprint` (separate repo, handled elsewhere)

- Runtime resource limits validated vs Cal.com reqs (min 2 vCPU / 4 GB, rec 4 vCPU / 8 GB;
  build needs ~6 GB heap, runtime is lighter — don't set the app container too low)
- Secret management (SOPS+age → Infisical when multi-service)
- Local `compose.local.yml` (no Traefik) for quick local testing
