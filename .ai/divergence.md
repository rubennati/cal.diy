# Divergence Register

What this fork deliberately **adds, removes, or keeps divergent** relative to upstream.
This is the durable companion to the time-ordered [sync-log.md](sync-log.md): the sync-log
says *when/why* something changed; this file says *what the steady-state divergence is*.

**On every upstream sync, re-apply this.** Upstream may re-introduce removed paths or
overwrite modified ones — the maintainer (or AI) checks this register during the sync
review (see [../UPSTREAM_SYNC.md](../UPSTREAM_SYNC.md)).

## Fork-removed upstream paths (delete again if a sync re-introduces them)

- `.cursor/` — cal.com Cursor AI rules/skills; this fork uses Claude Code
- `.changeset/` — cal.com NPM release machinery; this fork does not publish to NPM
- `.vscode/` — cal.com editor settings
- `SPEC-WORKFLOW.md` — cal.com spec-driven-development process
- `packages/lib/telemetry.ts` — upstream's Jitsu usage telemetry (endpoint `t.calendso.com`
  + inherited server-to-server write key). Already inert upstream after `next-collect` was
  removed (#25146): no importers, no dependency, no `middleware.ts` — but it read as live to
  anyone auditing the fork, and a sync restoring any of those pieces would have re-armed it
  silently. Removed together with the `CALCOM_TELEMETRY_DISABLED` flag (`.env.example`,
  `turbo.json`, `docker-compose.yml`, `packages/types/environment.d.ts`, `Dockerfile`) and
  `TELEMETRY_DEBUG`, which only that module read. The flag was documented as a hardening step
  while gating nothing — do not re-add it as one.
  **Enforced:** `scripts/fork-guard-telemetry.sh`, blocking step in `forte-ci`.
  Note the module sat outside every gate — `packages/lib` defines no `type-check` task, which
  is why its dangling `CollectOpts` type reference went unnoticed for months.
- `packages/lib/domainManager/` (3 files) — Vercel/Cloudflare domain automation for
  organizations. Orphaned *and* broken: the Cal.diy refactor (`ab21c7f805`) removed the EE
  package that exported `subdomainSuffix`, deleting the import but leaving both call sites, so
  the code would throw a `ReferenceError` on first use. No importers anywhere.
- `packages/lib/formbricks.ts` — orphaned duplicate of the live feedback path in
  `packages/trpc/server/routers/viewer/feedback/_router.ts`; called `api.client.people`, which
  no longer exists in `@formbricks/api@3.0.0`. Formbricks itself stays — it is wired up and in
  use. `@formbricks/api` in `packages/lib/package.json` is now unused (trpc declares its own),
  and `@formbricks/js` is declared there but consumed by `apps/web`, which does not declare it
  — both want cleaning up in a dependency pass, not here.
- cal.com team-culture / PR-process rules under `agents/rules/`:
  `culture-accountability`, `culture-leverage-ai`, `quality-thorough-code-review`,
  `quality-no-followup-prs`, `quality-pr-creation`, `quality-review-checklist`,
  `quality-code-review`, `_template`

## Fork-modified upstream files (keep OUR version on merge)

Protected via `.gitattributes` (`merge=ours`) where marked [guarded]:

- `README.md` — cal.forte identity (branch-specific) [guarded]
- `.well-known/security.txt` — fork security contact, not cal.com [guarded]
- `AGENTS.md` (+ `CLAUDE.md` symlink) — fork-owned AI guide (cal.com team/process stripped)
- `agents/rules/README.md`, `agents/rules/_sections.md` — fork-owned rules index
- `Dockerfile` — cal.forte branding build-args + hardened runtime defaults (ad-tracking off;
  no telemetry flag — the module itself is removed, see above)
- `.github/actions/docker-build-and-test/action.yml` — Trivy image-gate + branding build-arg
- `lint-staged.config.mjs` — adds `--no-errors-on-unmatched` to the Biome pre-commit task.
  Its glob matches paths `biome.json` hard-ignores (`**/*.d.ts`, `packages/prisma/zod`,
  `dist`, `build`, `coverage`), and Biome exits non-zero on "No files were processed", so
  staging only such files failed the hook outright. Upstream carries the same mismatch;
  re-apply if a sync overwrites it.

## Fork-added paths (ours; upstream has none)

- `.ai/` — fork operational layer for AI tools
- `.github/copilot-instructions.md`
- `.github/workflows/release-docker.yaml` — fork release CI (GHCR)
- `.github/workflows/forte-{ci,codeql,trivy,scorecard}.yml` — fork security CI (develop/release only)
- `scripts/fork-guard-telemetry.sh` — blocking CI guard for the removed telemetry module
- `.github/dependabot.yml` — dependency + GitHub-Actions update config
- `config/cal.forte.env.example` — hardened first-instance env template
- process docs: `FORK_PROCESS.md`, `UPSTREAM_SYNC.md`, `RELEASE_PROCESS.md`,
  `IMAGE_BUILD.md`, `SECURITY_REVIEW.md`, `CALDIY_RELEASE_CONTRACT.md`

## Kept engineering rules (adopted from upstream)

The ~37 remaining `agents/rules/*` (architecture, data, api, performance, quality,
testing, patterns, ci, reference) are cal.com's engineering rules, kept because they
describe how to safely maintain this codebase. Manifesto/blog framing removed.

## CI policy

Upstream workflows on `main` are disabled at the GitHub Actions level (not by editing
`main`, which stays a pristine mirror): `changesets.yml`, `i18n.yml`,
`nextjs-bundle-analysis.yml`. Only `release-docker.yaml` and the fork's own
`forte-*` security workflows stay active.
Re-check for newly-triggered upstream workflows after each mirror update
(`gh workflow list --all`).

The fork's own security CI (`forte-ci` lint+type-check, `forte-codeql`, `forte-trivy`,
`forte-scorecard`) runs on `develop`/`release` only, never `main`. Findings surface
under Security → Code scanning.

## Pending slimming decision (decide when the codebase is slimmed)

- `agents/rules/patterns-trigger-dev` — only if Trigger.dev is kept
- `agents/rules/patterns-app-store`, `agents/rules/data-prisma-feature-flags` — only if kept
- `agents/skills/calcom-api` — only if the Cal API is used
- `package.json` — inert `changesets-*` scripts (NPM release); remove in a later package.json pass
