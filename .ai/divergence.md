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

## Fork-added paths (ours; upstream has none)

- `.ai/` — fork operational layer for AI tools
- `.github/copilot-instructions.md`
- `.github/workflows/release-docker.yaml` — fork release CI (GHCR)
- `.github/workflows/forte-{ci,codeql,trivy,scorecard}.yml` — fork security CI (develop/release only)
- `.github/dependabot.yml` — dependency + GitHub-Actions update config
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
