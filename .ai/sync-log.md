# Sync Log

Running record of upstream-sync and security-cherry-pick rounds for this fork.
Newest first. This is the **"why"** companion to the raw git history: what was
taken from upstream, what was intentionally skipped, and the reason.

Security-labelled upstream commits are taken by default
(see [../UPSTREAM_SYNC.md](../UPSTREAM_SYNC.md) → Security Fix Priority).
Durable principles live in [decisions.md](decisions.md); this file is the timeline.

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

**Checks:** `git diff --check` clean. `yarn type-check:ci --force` and a
`yarn install` lockfile verification are to be run before the next release promotion.

---

<!-- Template for the next entry:

## YYYY-MM-DD — <short title>

**Context:** …
**Upstream base reviewed:** …
**Taken:** …
**Intentionally NOT taken (+ reason):** …
**Checks:** …
-->
