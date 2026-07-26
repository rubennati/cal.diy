# Sync Log

Running record of upstream-sync, security-cherry-pick, and de-cruft rounds for this
fork. Newest first. This is the **"why"** companion to the raw git history: what was
taken from upstream, what was intentionally skipped or removed, and the reason.

Security-labelled upstream commits are taken by default
(see [../UPSTREAM_SYNC.md](../UPSTREAM_SYNC.md) → Security Fix Priority).
Durable principles live in [decisions.md](decisions.md); the steady-state divergence
(added / removed / kept-divergent paths) lives in [divergence.md](divergence.md);
this file is the timeline.

---

## 2026-07-26 — Fork de-cruft (remove cal.com-only cruft)

Removed upstream paths that are cal.com-specific and unused by this fork
(now tracked in [divergence.md](divergence.md) so future syncs re-apply the cut):

- `.cursor/` — cal.com Cursor AI rules/skills (fork uses Claude Code)
- `.changeset/` — cal.com NPM release machinery (fork does not publish to NPM)
- `.vscode/` — cal.com editor settings

Fixed:

- `.well-known/security.txt` — replaced cal.com security contact with the fork's own
  (the file is served on the running instance and was misdirecting vulnerability
  reports to cal.com). Guarded via `.gitattributes` (`merge=ours`).

Note: `package.json` still carries inert `changesets-*` scripts; left in place to avoid
upstream merge friction — candidate for a later package.json cleanup.

---

## 2026-07-26 — Security catch-up cherry-picks

**Context:** `develop` was 43 commits behind `origin/main`; 6 of the pending
commits were security-relevant. Given the fork's purpose (hardening), those were
brought forward without a full sync. `develop` otherwise stays consciously curated.

**Upstream base reviewed:** `origin/main`

**Taken** (cherry-picked with `-x` onto `develop`):

| Commit (upstream) | Fix |
|-------------------|-----|
| `fb0149453e` | `SECURITY.md` wording (#29292) |
| `9104545a18` | password update form UX + translation (#29544) |
| `0d164da8dd` | implement missing password validation (#27634) |
| `b97cd6203d` | security audit — pin `i18next-fs-backend ^2.6.6` (#29657) |

**Already present** (cherry-pick came out empty — no action needed): both were
already covered by the earlier `security:` cherry-pick `75c8f5c1`:

- `743f988d30` — shell-quote 1.8.4 (#29535)
- `4026669e68` — 401 instead of 409 for unauthenticated `/api/me` (#29538)

**Intentionally NOT taken this round:** the remaining ~37 non-security upstream
commits — deferred to a deliberate full sync.

**Checks:** `git diff --check` clean; `yarn type-check:ci --force` green (9/9);
`yarn install --immutable` lockfile-consistent.

---

<!-- Template for the next entry:

## YYYY-MM-DD — <short title>

**Context:** …
**Upstream base reviewed:** …
**Taken:** …
**Intentionally NOT taken (+ reason):** …
**Checks:** …
-->
