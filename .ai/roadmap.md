# Roadmap

Living list of open work for the fork. Durable posture: [../FORK_STRATEGY.md](../FORK_STRATEGY.md).
Steady-state divergence: [../FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md). Timeline: [sync-log.md](sync-log.md).

## Now / next (in cal.forte)

- **Work the audit candidate registry.** The 2026-08-26 audit produced one ranked registry at
  [../docs/SELF_HOST_CAPABILITY_AUDIT.md](../docs/SELF_HOST_CAPABILITY_AUDIT.md) §10 (P1-A…P3-I),
  plus a proposed issue set in §11. **Nothing from it is implemented.** Ordering that matters:
  - **P1-A — deny-by-default permission service.** Replace the 18 inlined `return true` stubs with
    one explicitly-named module plus a fork guard in the `scripts/fork-guard-telemetry.sh` style.
    Correct whether or not Teams is ever enabled, and P1-C is blocked on it. Exceeds the diff-size
    guidance — stage it per file.
  - **P1-B — restore the API-keys tRPC route.** `git cherry-pick -x 07a288bbd8` (4 lines), and
    correct the ledger row that called it "feature/API expansion". Cheapest win in the registry, and
    it converges with upstream rather than diverging.
  - **P1-D — public slot resolution.** Needs an `api-no-breaking-changes` review, because making the
    fallback `NOT_FOUND` changes a public API's behaviour.
  - **P2-F — tRPC three-leg parity CI.** ~20 lines, no runtime, and it converts a whole class of
    silent breakage (which is how P1-B's defect survived four months) into a build failure.
  The registry is now filed as GitHub issues — tracker
  [#12](https://github.com/rubennati/cal.diy/issues/12), children #13–#40, created 2026-08-26 by a
  separate pass. P1s: [#13](https://github.com/rubennati/cal.diy/issues/13) (PBAC),
  [#32](https://github.com/rubennati/cal.diy/issues/32) (API keys),
  [#33](https://github.com/rubennati/cal.diy/issues/33) (team invariants),
  [#14](https://github.com/rubennati/cal.diy/issues/14) (slots). Two caveats: nine findings still need
  runtime or database evidence (master §12), and issue
  [#25](https://github.com/rubennati/cal.diy/issues/25) needs restating — its `Cal.com`-literal premise
  was refuted (master §8).

- **Slim the runtime image** — the built image still ships dev/build tooling (vitest,
  esbuild, `@depot/cli`, trigger.dev) + Playwright test files, inflating both image size and
  the CVE count. Prune them from the runner stage. This is the prerequisite for flipping the
  Trivy image-scan from **report-only** back to a **blocking** gate (see the note in
  `.github/actions/docker-build-and-test/action.yml`). Staged plan:
  [slimming-runtime-plan.md](slimming-runtime-plan.md).

- **Extend `type-check` coverage to the remaining packages.** Only 8 of 113 packages in
  turbo's scope define the script, so files with no importers sit in no tsc program and rot
  unnoticed — four such files were found and deleted in `packages/lib` alone (telemetry,
  domainManager ×3, formbricks). Unmeasured, largest first: `packages/features` (971 files),
  `packages/trpc` (823), `apps/api/v2` (624), `packages/prisma` (396). Expect the same two
  causes as in `packages/lib`: a rotted `tsconfig` (no `lib`, missing ambient `.d.ts`, no
  `paths` for `exports`-only packages) plus test-fixture drift. Do one package per commit
  and record a pre-change test baseline before touching fixtures — completing a fixture can
  legitimately change what a test asserts.
- **Formbricks dependency cleanup** (touches `yarn.lock`, hence separate):
  `@formbricks/api` in `packages/lib/package.json` is unused since `formbricks.ts` was
  deleted (`packages/trpc` declares its own), and `@formbricks/js` is declared there but
  consumed by `apps/web`, which does not declare it — move the declaration rather than
  dropping it.
- **Verify the deletions in a release image.** The four deleted files had no importers and
  the full type-check is green, but no image has been built from this state yet.

_Base documented in [state.md](state.md) (cal.com 6.2.0, merge-base `46eb533d`). The other
big item is feature code-slimming below._

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
- Secret management: keep injecting secrets at **runtime** (Docker secrets) — they must never
  enter git or the image. **Do NOT use git-committed encrypted secrets (SOPS/git-crypt):**
  `secure-docker-blueprint` is a *public* repo, so ciphertext would be permanently
  harvestable and the history unerasable. If central management is ever needed, use a
  **secrets store outside git** (e.g. self-hosted Infisical, Vault) that still hands the app
  runtime-injected secrets.
- Local `compose.local.yml` (no Traefik) for quick local testing
