# Upstream Sync

## Purpose

This document describes the repeatable sync process for bringing upstream Cal.diy changes into this fork without deploying blindly.

This pass does not add the `upstream` remote. When that remote is added later, use this document as the runbook.

## Preconditions

Before starting a sync:

- local worktree is clean
- no in-progress release is using `release`
- current fork-only changes are understood
- the upstream target commit or tag is known
- the operator has time to review the diff, not just merge it
- the fork README merge guard is active in this clone (one-time):
  `git config merge.ours.driver true` (keeps the fork's own README; see `.gitattributes`)

## Remote Layout Target

Expected remotes after later setup:

- `origin`
  - this fork
- `upstream`
  - original Cal.diy repository

## Sync Outcome Target

The intended flow is:

1. fetch upstream
2. compare upstream to local `main`
3. update `main` to the desired upstream state
4. merge or rebase that reviewed state into `develop`
5. run release gates on `develop`
6. promote to `release` only after review

## Suggested Command Sequence

Use these commands after the `upstream` remote exists:

```bash
git fetch origin --tags
git fetch upstream --tags
git log --oneline --decorate origin/main..upstream/main
git diff --stat origin/main...upstream/main
git merge-base origin/main upstream/main
```

If the target is an upstream release tag, compare against that tag directly:

```bash
git fetch upstream --tags
git log --oneline --decorate origin/main..upstream/<tag>
git diff --stat origin/main...upstream/<tag>
```

## Review Checklist Before Updating `main`

Review at least these areas in the upstream diff:

- auth and signup
- email and mail transport
- cron and webhook routes
- Dockerfiles and image build behavior
- GitHub workflows
- Prisma schema and migrations
- public booking routes and rewrites
- dependency and lockfile changes
- example env files

## Security Fix Priority

Being behind upstream on security fixes is the one drift this fork does not tolerate.

- Every sync review scans the pending upstream commits for security-relevant work
  before deciding what to defer.
- Security-relevant upstream commits are **taken by default**, even when a full sync
  is deferred and `develop` otherwise stays consciously curated.
- If a security-relevant commit is intentionally not taken, the reason is recorded in
  [.ai/sync-log.md](.ai/sync-log.md).
- Quick scan for pending security-relevant commits:

```bash
git log --oneline --no-merges develop..origin/main \
  | grep -iE "secur|password|auth|session|token|xss|csrf|inject|sanitiz|escap|audit|shell-quote|401|403"
```

## Branch Update Discipline

- Update `main` first.
- Do not skip `main` and merge upstream directly into `develop`.
- Keep `develop` as the branch where conflicts are reviewed and resolved.
- Keep `release` free of surprise integration work.

## Conflict Rules

- Fork-owned files need manual review every sync.
- If an application-source conflict appears in a security-sensitive area, stop and review it deliberately.
- If a change is fork-specific and must stay divergent, document the reason in the release notes.

## Promotion Into `develop`

After `main` reflects the chosen upstream state:

1. compare `main...develop`
2. merge or rebase `main` into `develop`
3. inspect fork-owned drift
4. run release gates
5. record what changed

Suggested comparison commands:

```bash
git diff --stat main...develop
git log --oneline --decorate main..develop
```

## What Must Be Recorded For Each Sync

- upstream commit or tag reviewed
- resulting `main` commit
- resulting `develop` commit
- fork-only files kept intentionally divergent
- security-sensitive upstream areas reviewed
- checks run before release promotion
- an entry appended to [.ai/sync-log.md](.ai/sync-log.md): what was taken, what was
  intentionally skipped, and why

## Things Not To Do

- do not sync upstream directly into `release`
- do not publish a release image from an unreviewed sync
- do not assume docs and image references remain correct after upstream changes
- do not collapse fork-only workflow/docs changes into app-source review without calling them out
