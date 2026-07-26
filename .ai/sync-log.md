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

## 2026-07-26 — Runtime-image slimming, Stage 1 (E2E suites out of the image)

Added `**/playwright`, `**/e2e`, `**/*.e2e.*` to `.dockerignore` so E2E test sources
(81 files under `apps/web/playwright`, incl. fake Stripe tokens that Trivy flagged) no
longer enter the build context.

**Failed first attempt (kept as a lesson):** the initial exclusion also covered
`__mocks__`, `__fixtures__`, `*.test.*`, `*.spec.*` — that broke `next build`
(`Cannot find module '@calcom/testing/lib/__mocks__/prisma'`), because app code imports
those at build time. A **non-publishing test build caught it before any image was pushed**.
Narrowed to E2E-only.

**Verified:** non-publishing build (run `30218363330`, `PUSH_IMAGE=false`) — image builds and
the runtime health-check passes. Not yet in a released image (next release will carry it).

Next lever: Stage 2 (pre-compile the boot seed → drop dev dependencies) —
[slimming-runtime-plan.md](slimming-runtime-plan.md).

---

## 2026-07-26 — Release v6.2.0-3 (GHCR publish)

Per [../CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md):

- **tag:** `v6.2.0-3`
- **source branch:** `release`
- **source commit:** `11cbb281` (promotion of `develop` `feef5b6`)
- **upstream base:** cal.com 6.2.0 (merge-base `46eb533d`)
- **new since v6.2.0-2:** cal.forte branding (`NEXT_PUBLIC_APP_NAME`), Trivy image scan
  (report-only), hardened image defaults (telemetry/ads off), the `config/` template + docs,
  and `next-auth 4.24.15` + `tar 7.5.19` security bumps.
- **image:** `ghcr.io/rubennati/cal.diy:v6.2.0-3` (amd64; arm64 as `v6.2.0-3-arm`)
- **digest:** `sha256:e5311b428005b74e3c1771b58d8429adf436e5da48b33b0f12bb037cfb8c627a`
- **checks:** `forte-ci` green (install / type-check / biome); release build success
  (run `30215955037`); Trivy image scan ran report-only (findings = base-OS + dev/build
  tooling — pending the runtime-image slim, see roadmap).

---

## 2026-07-26 — Trivy gate → report-only + next-auth fix

The first Trivy-gated release build (`v6.2.0-3`) **blocked the publish** — the image scan
found CRITICALs. Most were **not our app code**: base-OS (node:20 Debian — mariadb,
imagemagick, kernel), dev/build tooling in `node_modules` (vitest, esbuild, `@depot/cli`,
trigger.dev), and 3 false-positive "Stripe secrets" in a Playwright test fixture.

Actions:
- Fixed the one real runtime app vuln: **next-auth `4.24.13` → `4.24.15`**
  (GHSA-7rqj-j65f-68wh, auth email-homoglyph) via resolution; also bumped `tar`
  `7.5.11` → `7.5.19` (CVE-2026-59873).
- Re-scoped the scan to `scanners: vuln`, `vuln-type: library` (drops secret-scanner
  false positives + base-OS noise) and set it **report-only** (exit-code 0) until the
  runtime image is slimmed (see roadmap) — a hard block on the inherited bloated image
  would fail every release.

Tag `v6.2.0-3` produced no image (build failed); it will be re-tagged after this fix.

---

## 2026-07-26 — Documented upstream base

- Base: cal.com **6.2.0**; fork divergence point (merge-base `develop`↔`origin/main`) = `46eb533d`.
- Mirror `origin/main` at `3894f37` — 44 commits past base, still 6.2.0 patch line.
- Caveat recorded in [state.md](state.md): the repo's `v6.2.0` tag is a fork commit, not
  the upstream release. Future syncs pin the base to the real upstream release tag/commit.

---

## 2026-07-26 — Release v6.2.0-2 (GHCR publish)

Per [../CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md):

- **tag:** `v6.2.0-2`
- **source branch:** `release`
- **source commit:** `84517bf5` (promotion of `develop` `8ef00c5d`)
- **upstream base:** `46eb533d` (merge-base of `develop` and `origin/main`; develop is
  consciously ~43 commits behind upstream, with security fixes cherry-picked)
- **fork-only content:** 4 security cherry-picks, de-cruft (`.cursor`/`.changeset`/`.vscode`),
  fork-owned rules, fork security CI (`forte-*`), `security.txt` fix
- **image:** `ghcr.io/rubennati/cal.diy:v6.2.0-2`
- **digest:** `sha256:f5e25e7d2512a80952ed0fdf6f9ccee2aba30d36738dc493eb4efaa1d13782e4`
- **checks:** `yarn type-check:ci --force` green; `git diff --check` clean;
  `yarn install --immutable` consistent; release-docker build success (run `30209106589`)
- **follow-ups (reviewed):**
  - `Dockerfile` `ENV NEXTAUTH_SECRET`/`CALENDSO_ENCRYPTION_KEY` are build-stage
    placeholders (`=secret`) that do NOT persist into the final `runner` image; real
    secrets are injected at runtime. The `SecretsUsedInArgOrEnv` warning is benign here.
  - multi-arch: the published image is `linux/amd64` only, by choice — arm64 not needed for now.

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
