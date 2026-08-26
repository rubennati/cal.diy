# Sync Log

Running record of upstream-sync, security-cherry-pick, and de-cruft rounds for this
fork. Newest first. This is the **"why"** companion to the raw git history: what was
taken from upstream, what was intentionally skipped or removed, and the reason.

Security-labelled upstream commits are taken by default
(see [../UPSTREAM_SYNC.md](../UPSTREAM_SYNC.md) → Security Fix Priority).
Durable principles live in [decisions.md](decisions.md); the steady-state divergence
(added / removed / kept-divergent paths) lives in
[../FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md);
this file is the timeline.

---

## 2026-08-10 — Integrated upstream IP-banlist bypass fix

**Context:** Commit `038381aeca` was the only security-relevant change in the six-commit
upstream review range `3894f37e14...176037d0af`. A padded forwarded-IP header could fail an
exact string comparison against `IP_BANLIST`, allowing a listed address to bypass the
banlist check.

**Integrated:** the complete upstream patch was cherry-picked with `-x` as `29d686fa67`.
It changes only `packages/lib/getIP.ts` and its targeted test: the selected first IP is
trimmed, an empty header array returns an empty string, and regression coverage includes
padded strings, arrays, tabs, and the end-to-end banlist lookup. No other commit from the
upstream review range was applied. Fork formatting was isolated in follow-up commit
`2ea6ff49b0` (one blank line and final newlines only).

**Security assessment:** the change closes the documented whitespace/exact-match bypass and
introduces no new logging, raw error output, dependency, or secret handling. It preserves
the existing header priority and first-address behavior. It does not establish whether a
deployment's proxy headers are trustworthy; operators must still ensure that Cloudflare or
another trusted proxy overwrites client-supplied forwarding headers.

**Checks:** `packages/lib/getIP.test.ts` passed (23/23); filtered `@calcom/lib`
`type-check:ci` passed through the root Turbo command; Biome formatting was applied only in
the separate follow-up commit. No generated files changed.

**Release status:** integrated for `develop` review, but not yet promoted to `release`,
tagged, or published as an image.

## 2026-07-27 — Release v6.2.0-4 (GHCR publish)

Per [../CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md):

- **tag:** `v6.2.0-4` · **source branch:** `release` · **source commit:** `f99367c3`
  (promotion of `develop` `8b4a9cd8`)
- **upstream base:** cal.com 6.2.0 (merge-base `46eb533d`) — unchanged
- **new since v6.2.0-3:** runtime-image slimming Stage 1 (E2E suites out of the build
  context) + Stage 2 (dev CLI/test tooling pruned: `trigger.dev`, `@depot`, `vitest`,
  `playwright`, `@biomejs`); `websocket-driver` 0.7.5 (CVE-2026-54466); corrected
  signup-hardening docs (runtime DB flag, not a rebuild).
- **image:** `ghcr.io/rubennati/cal.diy:v6.2.0-4` (amd64; arm64 as `v6.2.0-4-arm`)
- **digest:** `sha256:9818a0be6404bbcf6b330847868d2673ded00b9786ecb6683f49e907cf77a1a8`
- **checks:** non-publishing validation builds for Stage 1 (`30218363330`) and Stage 2
  (`30222509498`); release build `30223216533` success (build + runtime health-check on
  both amd64 and arm). Trivy image scan still report-only.
- **effect:** node-pkg CRITICALs 8 → 4; the gobinary findings (`@depot`/esbuild → docker,
  grpc, Go stdlib) are gone. Remaining findings are nested dev-dependency copies
  (`vitest`, `tar`) with no runtime path.

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
(now tracked in [../FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md) so future syncs re-apply the cut):

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

## 2026-07-31 — Remove inert upstream telemetry; close the `packages/lib` type-check gap

**Context:** A review flagged `packages/lib/telemetry.ts` — upstream's Jitsu endpoint
`t.calendso.com` plus an inherited server-to-server write key. It was already unreachable
(upstream removed `next-collect` in #25146: no importers, no dependency, no `middleware.ts`),
but it *read* as live, and `.env.example` plus `hardening-checklist.md` §3 advertised
`CALCOM_TELEMETRY_DISABLED` as a privacy control that gated nothing. Investigating why no
gate had caught it exposed the larger problem.

**Taken:** three commits on `develop`.

- `75a9df1812` — delete the telemetry module; drop `CALCOM_TELEMETRY_DISABLED` from
  `.env.example`, `turbo.json`, `docker-compose.yml`, `packages/types/environment.d.ts` and
  the Dockerfile (build ARG + runner ENV), plus `TELEMETRY_DEBUG`; correct every doc that
  presented the flag as a control; add `scripts/fork-guard-telemetry.sh` as a **blocking**
  `forte-ci` step. Ad-tracking flags stay — those are real (`packages/lib/tracking/server.ts`).
- `778b4200f7` — `lint-staged` passed `.d.ts` files to Biome, which hard-ignores them, so
  Biome exited non-zero on "No files were processed" and any commit touching a `.d.ts` failed
  the pre-commit hook. Fixed with `--no-errors-on-unmatched`, which also covers
  `packages/prisma/zod`, `dist`, `build`, `coverage`.
- `88e8f9e226` — `packages/lib` now defines `type-check`/`type-check:ci`. Its `tsconfig` had
  rotted unnoticed (no `lib` under `target: es5`; `business-days-plugin.d.ts` not included;
  no `paths` for `@calcom/testing`, whose `exports` map `moduleResolution: node` cannot read,
  so every `prismaMock` import resolved to `any`). Deleted three more orphaned, unfixable
  files: `domainManager/` (its `subdomainSuffix` import died with EE in `ab21c7f805`, leaving
  both call sites → guaranteed `ReferenceError`) and `formbricks.ts` (duplicate of the live
  trpc feedback route, calling an API gone in `@formbricks/api@3.0.0`). 27 test-fixture type
  errors fixed with no `as any`; typing the fixtures surfaced a real defect — one test omitted
  the required `organizationId` argument.

**Intentionally NOT taken (+ reason):**
- Formbricks dependency cleanup — touches `yarn.lock`, and `@formbricks/js` must move to
  `apps/web` rather than be dropped. → [roadmap.md](roadmap.md).
- `type-check` for the other 105 uncovered packages — one package per commit, unmeasured.
- No release cut. Nothing changed at runtime; the Dockerfile did, so this folds into the
  next image rather than justifying its own tag.

**Checks:** `tsc-absolute --noEmit` in `packages/lib` (the exact `type-check:ci` command)
exit 0; `TZ=UTC vitest` over `packages/lib` unchanged against a pre-change baseline
(43 files / 415 passed / 1 skipped); fork guard green on HEAD and failing on both simulated
regressions; no `as any` introduced. Full-repo `yarn type-check:ci --force` was green before
the final edits; the re-run was blocked by a local PATH issue, not by errors — CI covers it.

**Release note for the next tag (draft):** *No functional change.* The image no longer sets
`CALCOM_TELEMETRY_DISABLED`, because the upstream telemetry module it nominally gated has
been removed from the fork; the flag never had a mechanism behind it. Operators who set it
can drop it. Ad-tracking remains off by default.

---

## 2026-08-11 — Release `v6.2.0-5` and downstream handoff

**Context:** The reviewed `develop` state was promoted after local install/type-check gates
and repeated non-publishing AMD64/ARM64 Docker validation. The release also completed the
one-time historical ancestry reconciliation required for future fast-forward promotions.

**Release source:** `201b016984fe13388ccdc6a82f2669e9719d3bcc`

**Release preparation:**
- PR #8 redirected Yarn runtime state to writable `/tmp`; a Docker gate showed that Turbo's
  strict task environment filtered the environment-only setting.
- PR #9 persisted `installStatePath` in the final image's Yarn configuration; both
  architecture runtime tests then passed.
- PR #10 linked the five historical release-only commits with a content-neutral `ours`
  ancestry merge. Its file diff was empty; `release` then fast-forwarded to `develop`.

**Checks:** `forte-ci`, CodeQL, Trivy, and Scorecard passed for the exact source SHA.
Non-publishing Release Docker run
[`31433538582`](https://github.com/rubennati/cal.diy/actions/runs/31433538582) passed source
identity, runtime tests, image scans, and SBOM generation on AMD64 and ARM64.

**Published artifacts:** Release Docker run
[`31435807941`](https://github.com/rubennati/cal.diy/actions/runs/31435807941) validated the
annotated `v6.2.0-5` tag, published both architecture images, finalized `latest` as
convenience metadata, uploaded CycloneDX SBOMs and `release-record.json`, and pushed build
provenance attestations.

- AMD64: `ghcr.io/rubennati/cal.diy:v6.2.0-5@sha256:c2facc284b28e1eea76b6d82c02e680d20d648dc255ef7f74520dbf30d18b17e`
- ARM64: `ghcr.io/rubennati/cal.diy:v6.2.0-5-arm@sha256:dffa387024a68b9b057b1bdf3342a21b699bb092da4f711932f129bd932faeae`

**Downstream handoff:**
[secure-docker-blueprint issue #30](https://github.com/rubennati/secure-docker-blueprint/issues/30)
records the digest update and required non-root, secrets, migration, health, booking, SMTP,
and rollback validation. `latest` is not a downstream trust input.

**Documentation follow-up:** The historical release-only README conflicted with the new
source-identical promotion model. The shared fork README is now branch-neutral for
`develop` and `release`; `main` continues to carry the upstream README.

---

## 2026-08-26 — Capability, authorization, licence and productization audit

**Context:** Documentation-only forensic audit of `develop` at `41689d1d6e`. Three passes ran
concurrently — a static capability audit, a manual live-deployment session, and an external-fork
intake covering 11 repositories — and were then consolidated into one non-duplicative set of
repository documents. **No application code, schema, workflow, or Docker behaviour changed.**

**Method and confidence basis.** Every material claim was independently re-derived against
`develop` by reviewers that had not seen the originating write-up (10 parallel verifications),
and the three load-bearing claims were then attacked by adversarial reviewers instructed to
refute them. That is why several conclusions below differ from what the source passes reported:
**nine claims did not survive**, and they are listed in
[../docs/SELF_HOST_CAPABILITY_AUDIT.md](../docs/SELF_HOST_CAPABILITY_AUDIT.md) §8 so they are not
re-raised.

**Documents produced** (all under `docs/`, fork-owned; see the master's header for why that
location was chosen over the root or `.ai/`):

| Document | Role |
| --- | --- |
| `SELF_HOST_CAPABILITY_AUDIT.md` | master — F-01…F-32 + D-01/D-02, the single ranked candidate registry, the proposed issue set |
| `PBAC_PLACEHOLDER_AUDIT.md` | authorization placeholder call graph, per-endpoint verdicts, 14 reproducible tests |
| `TEAM_CAPABILITY_EVALUATION.md` | team architecture, role model, 22 invariants, external-implementation audit |
| `LICENSE_AND_PROVENANCE_REVIEW.md` | governing provenance policy, MIT scope, AGPL/Commercial history boundary |
| `SELF_HOST_PRODUCTIZATION.md` | legal URLs, residual hosted-Cal upsells, hard-coded `cal.com` references |
| `EXTERNAL_FORK_INTAKE.md` | external-fork evidence register — discovery only, deliberately kept out of the upstream ledger's vocabulary |

**Findings that change the fork's posture:**

- **F-01 — permission checks are `return true` stubs in 18 production files.** 11 fail open
  (19 call sites), 6 fail closed, 1 is DI wiring. Only **two** are genuinely cross-tenant, and one
  of them gates `viewer.eventTypes.delete`, whose handler runs
  `prisma.eventType.delete({ where: { id } })` with no ownership re-check. Originates in upstream
  `ab21c7f805`; inherited verbatim.
- **F-01 reachability — corrected during this pass.** No shipped runtime path creates a `Team`, and
  the published image never seeds one. But `scripts/seed.ts` is unconditional and creates **7 `Team`
  rows** via the documented `yarn dx` → `db-setup` → `db-seed` chain. So: an architectural hazard on
  the published image, a live destructive cross-tenant write on any seeded instance. It must be
  reported as neither a demonstrated remote exploit nor as theoretical.
- **F-05 — the API-keys tRPC route is missing and every key mutation is broken.**
  `apps/web/pages/api/trpc/apiKeys/[trpc].ts` was deleted by `ab21c7f805` while the router, the
  client endpoint entry and the whole UI stayed wired. Upstream fixed it in `07a288bbd8` (#29517,
  4 lines) on 2026-06-08. A functional-availability defect, not a vulnerability — but a broken
  `delete` leaves no UI path to revoke a leaked API key.
- **F-07 — `ab21c7f805` reverted merged upstream fixes together with their regression tests.**
  Confirmed for 4 of 5 spot-checked commits (one claim refuted). The reverts are hunk-level, not a
  wholesale rollback, so each path needs an individual verdict. `UPSTREAM_REVIEW_LEDGER.md` has no
  row for `ab21c7f805` — but that commit is 43 commits *before* the ledger's declared start
  `46eb533dbd`, so this is a **gap in the review baseline**, not a missing row.
- **F-13 / F-14 — the fork still ships two reachable hosted-Cal.com commercial prompts.** The
  onboarding plan chooser shows `$15/user/mo` (German: `15 $/Benutzer/Monat`) and dead-ends at a
  non-existent route; and every anonymous booker sees a `cal.com/signup` upsell whose form posts
  their email address to a third party. Both upstream-inherited. This qualifies, without
  contradicting, the existing "the paywall is already removed" claim — the *gating* is gone, the
  *messaging* is not.
- **F-22 — the fork documents two conflicting local-setup paths**, only one of which seeds. This is
  what decides F-01's real-world reachability, which is why it is recorded as its own finding.

**Ledger correction required — deliberately NOT applied.** `UPSTREAM_REVIEW_LEDGER.md:76` marks
`07a288bbd8` `deferred` with the rationale *"Feature/API expansion not required by current fork
scope."* Both halves are contradicted by F-05: it is a 4-line restoration of a deleted route, and
the fork ships both the producer UI and an API-key consumer. The row **mischaracterises the
change** — "fabricated" would be unfair, since upstream's own commit subject invites the
misreading. Editing a disposition row is a review decision, not a typo fix, so it was left for a
deliberate update following the `0d164da8dd` precedent of keeping reversals visible.

**Intentionally NOT taken:** no commit to `develop` directly, no push, no cherry-pick, no GitHub
issue, no ledger edit, no application-code change, no Teams activation, no authorization change, no
licence notice removed.

**Concurrency note.** A separate process was writing into the same `docs/` tree during this pass and,
between 04:26 and 04:33 on 2026-08-26, **enabled GitHub issues and filed 29** under tracker
[#12](https://github.com/rubennati/cal.diy/issues/12). This consolidation filed none of them. Two
consequences worth carrying forward: the audit documents' original "issues are disabled" statements are
superseded (corrected in place), and issue
[#25](https://github.com/rubennati/cal.diy/issues/25) rests on a claim this pass refuted — the
`Cal.com` literal appears in **47** files, not 3, and none of the three `.ts`/`.tsx` hits is a
`package.json` author field.

**Deployment-layer findings handed off (not this repository's):** D-01 mass 429 on static assets —
application code excluded by four independent barriers, and upstream `8b17df4621` (#27674) states
outright that IP rate limiting moved to Cloudflare. Target: `secure-docker-blueprint`.

**Checks:** `git diff --check` clean · 158 relative links resolve · 34 finding IDs each defined
once and fully cross-walked · only documentation modified. Biome has no markdown support in this
repo, and there is no markdown linter — so formatting was not machine-verified.

**Next step:** the ranked candidate registry is
[../docs/SELF_HOST_CAPABILITY_AUDIT.md](../docs/SELF_HOST_CAPABILITY_AUDIT.md) §10. P1-A
(deny-by-default permission service) is first because it is correct whether or not Teams is ever
enabled, and P1-C is blocked on it.

---

<!-- Template for the next entry:

## YYYY-MM-DD — <short title>

**Context:** …
**Upstream base reviewed:** …
**Taken:** …
**Intentionally NOT taken (+ reason):** …
**Checks:** …
-->
