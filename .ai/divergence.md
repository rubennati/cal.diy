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

## Fork-modified upstream files (keep OUR version on merge)

Protected via `.gitattributes` (`merge=ours`) so upstream merges don't overwrite them:

- `README.md` — cal.forte identity (branch-specific)
- `.well-known/security.txt` — fork security contact, not cal.com

## Fork-added paths (ours; upstream has none)

- `.ai/` — fork operational layer for AI tools
- `.github/copilot-instructions.md`
- `.github/workflows/release-docker.yaml` — fork CI (GHCR)
- process docs: `FORK_PROCESS.md`, `UPSTREAM_SYNC.md`, `RELEASE_PROCESS.md`,
  `IMAGE_BUILD.md`, `SECURITY_REVIEW.md`, `CALDIY_RELEASE_CONTRACT.md`

## Under review (inherited from upstream, decision pending)

- `agents/rules/`, `CLAUDE.md`, `AGENTS.md`, `SPEC-WORKFLOW.md` — these are **cal.com's**
  engineering/AI rules, not fork-authored. Planned: migrate to the fork's own
  standard (`rubennati/ai-project-standard`) and thin out cal.com-specific guidance.
- `package.json` — still carries inert `changesets-*` scripts (NPM release); left in
  place to avoid merge friction, candidate for removal in a later package.json pass.
