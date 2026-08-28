# Fork Divergence Register

This is the public record of what `cal.forte` deliberately adds, changes, or removes
relative to upstream Cal.diy. It answers a different question from the upstream review
ledger:

- [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md) records which upstream commits
  were accepted, deferred, rejected, or prepared.
- [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) records **how each material
  change was implemented** — provenance, licence classification, security impact, validation,
  guards and rollback. This register is the *steady state*; that ledger is the *per-change*
  record and retains superseded and reverted entries that this register correctly drops.
- This document records behavior and maintenance work created specifically for this fork.
- [FORK_STATUS.md](FORK_STATUS.md) records the current review and release snapshot.
- [.ai/sync-log.md](.ai/sync-log.md) provides the chronological implementation history.

MIT does not require a divergence register, but publishing one makes the fork easier to
audit, maintain, and trust.

## Current Basis

Last reconciled: **2026-08-11**

| Item | Value |
| --- | --- |
| Upstream base | Cal.com 6.2.0 at merge-base `46eb533dbd` |
| Upstream reviewed through | `176037d0af` on 2026-08-10 |
| Latest published fork baseline | `201b016984` |
| Latest published fork release | `v6.2.0-5` |
| Exact source comparison | [`main...develop`](https://github.com/rubennati/cal.diy/compare/main...develop) |

`Released` below names the first fork release known to contain the change. `Unreleased`
means the change is on `develop` but is not yet represented by the latest published release.
The source comparison remains authoritative for exact lines; this register describes
material intent and behavior.

## Identity And Operating Model

| Fork divergence | Type | Reason and effect | Evidence | Release state |
| --- | --- | --- | --- | --- |
| `cal.forte` identity and fork-owned README | Modified | Clearly distinguishes the hardened fork from upstream and exposes branch, review, and image trust boundaries. | `6423cafece`, `5a38545dab` | Released by `v6.2.0-2`; status updates continue on `develop` |
| Controlled `main` / `develop` / `release` model | Added | Separates the upstream mirror, reviewed integration, and image publication source. | `73a5313f2a`, process documents | Released by `v6.2.0-1`; hardened rules by `v6.2.0-5` |
| Public upstream decision ledger | Added | Gives every reviewed upstream commit a durable disposition and provenance record. | `679c4f058c`, `UPSTREAM_REVIEW_LEDGER.md` | Released by `v6.2.0-5` |
| Fork-owned AI collaboration guidance | Added/modified | Replaces upstream team-process instructions with concise rules for this controlled fork. | `31b42d3fef`, `6e41b14ce8` | Introduced in `v6.2.0-1`; expanded by `v6.2.0-2` |
| Hardened deployment environment template | Added | Documents secure defaults without committing deployment secrets or private branding. | `d057ef3915`, `config/cal.forte.env.example` | Released by `v6.2.0-3` |

## Security And Privacy Changes

| Fork divergence | Type | Reason and effect | Evidence | Release state |
| --- | --- | --- | --- | --- |
| Inert Jitsu usage-telemetry module and phantom opt-out removed | Removed | Eliminates dormant phone-home code and avoids documenting a flag that controlled nothing. A blocking guard prevents reintroduction. | `75a9df1812`, `scripts/fork-guard-telemetry.sh` | Released by `v6.2.0-5` |
| Advertising integrations disabled by default in the image | Modified | Sets privacy-first runtime defaults for Google and LinkedIn advertising. | `d057ef3915`, root `Dockerfile` | Released by `v6.2.0-3` |
| Fork security contact | Modified | Vulnerability reports are directed to the fork owner rather than upstream Cal.com. | `d7747a32d9`, `.well-known/security.txt` | Released by `v6.2.0-2` |
| Fork security CI | Added | Runs fork-owned type checking, CodeQL, Trivy, Scorecard, telemetry guard, and dependency monitoring on review/release branches rather than executing the broad upstream CI estate. | `68d13f4d28`, `.github/workflows/forte-*` | Released by `v6.2.0-2`; latest hardening by `v6.2.0-5` |
| Explicit Trivy image policy | Added | Scans the exact runtime-tested image. Findings remain report-only while inherited runtime CVEs are reduced; accepted exceptions and the re-enable condition are documented rather than presented as a blocking gate. | `38e498f196`, `.trivyignore`, `IMAGE_BUILD.md` | Released by `v6.2.0-3`; latest pipeline hardening by `v6.2.0-5` |
| `packages/lib` type-check coverage repaired | Modified | Brings previously uncompiled library files into the TypeScript gate and removes code that had silently rotted outside CI. | `88e8f9e226` | Released by `v6.2.0-5` |
| Zoho Calendar server locations constrained to documented regions | Modified | Upstream concatenates the OAuth `location` parameter into the Zoho hostname, so a crafted value directed `client_id`/`client_secret` and user tokens at an attacker-chosen host — including via the value persisted on the credential and reused at token refresh. The fork maps a closed set of regions to hosts fixed at build time and fails closed on anything else. Security regression tests are the guard. Also repairs the `ca` and `cn` regions, which upstream builds as non-existent hosts. | issue #43, `packages/app-store/zohocalendar/lib/zohoServerLocation.ts` | Released by `v6.2.0-6` |
| Intercom configuration endpoint authenticated and its outbound check constrained | Modified | Upstream serves `POST /api/integrations/intercom/configure` with no authentication and no Intercom signature verification, and validates the submitted booking link with a regex interpolated from `CAL_URL` whose unescaped dots admit hosts such as `cal-example-com`, then follows redirects. The fork verifies Intercom's documented `X-Body-Signature` HMAC, refuses the request when the app is unconfigured, resolves the request target from parsed URL components against `CAL_URL`, and stops following redirects. Security regression tests are the guard. | issue #44, `packages/app-store/intercom/lib/resolveCalBookingUrl.ts`, `packages/app-store/intercom/lib/verifyCanvasSignature.ts` | Released by `v6.2.0-6` |
| Public slot lookup fails closed when the event owner cannot be resolved | Modified | Upstream resolves an event type by slug alone when neither owner nor team is known, and a slug is unique only within an owner. On the unauthenticated `slots.getSchedule`, an unresolvable username therefore returned a different owner's event type and its availability under the requested one's name, and nothing downstream re-checked ownership. The fork returns null, which the sole caller already converts to `NOT_FOUND`. Repository regression tests are the guard. Containment only: team private-link resolution stays out of scope while Teams are inactive (issues #13, #33). | issue #14, `packages/features/eventtypes/repositories/eventTypeRepository.ts` | Released by `v6.2.0-6` |
| PBAC permission placeholders deny instead of granting | Modified | Upstream `ab21c7f805` deleted `packages/features/pbac/` and left a placeholder `PermissionCheckService` in each of its 18 consumers, every one answering `checkPermission` and `hasPermission` with an unconditional `true` — fail-open authorization in a function named `checkPermission`, still present on `calcom/cal.diy@main`. The fork returns `false` (and keeps the existing `[]` for `getTeamIdsWithPermission`), so a missing implementation can never grant access. PBAC remains UNIMPLEMENTED and Teams remain unsupported; this only stops seeded or restored Team rows from being decided fail-open. A blocking guard plus updated tests prevent reintroduction — eleven pre-existing tests had asserted the permissive behaviour as correct. Reevaluate when upstream implements PBAC under a compatible licence. | issue #13, `scripts/fork-guard-pbac-fail-closed.sh` | Released by `v6.2.0-6` |

Upstream-derived security patches are intentionally not listed as fork inventions. Their
source and local evidence belong in
[UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md).

## Container And Deployment Changes

| Fork divergence | Type | Reason and effect | Evidence | Release state |
| --- | --- | --- | --- | --- |
| Fork GHCR namespace | Modified | Publishes images to `ghcr.io/rubennati/cal.diy` instead of upstream Docker Hub/Scarf endpoints. | `d9dd269ed8` | Fork tag `v6.2.0` (not the upstream release tag) |
| `cal.forte` image branding | Modified | Bakes the fork application name through explicit build arguments. | `4264193f84` | Released by `v6.2.0-3` |
| URL-safe database-password guidance | Modified | Warns operators that URL-reserved characters break interpolated PostgreSQL URLs and recommends hexadecimal secrets. | `aa4f4bff79`, `docker-compose.yml` | Released by `v6.2.0-1` |
| Runtime image slimming, stages 1 and 2 | Modified | Excludes tests/E2E assets and removes dev-only tooling while retaining runtime-required Turbo, Prisma, and seed tooling. | `b14e95dbea`, `78527ca3f5`, `08db6081bd` | Released by `v6.2.0-4` |
| Immutable Docker and Action inputs | Modified | Pins base-image digests and third-party Action SHAs, uses immutable Yarn installs, and lets Dependabot propose deliberate updates. | `32aac7c9fa` | Released by `v6.2.0-5` |
| Non-root web and API runtimes | Modified | Runs application processes as the built-in `node` user; only required Next.js/Turbo runtime paths remain writable. API v2 also gains a health check. | `6800e65e06` | Released by `v6.2.0-5` |
| Fork image selected by Compose | Modified | Uses the fork GHCR image and supports `CALDIY_IMAGE` override so deployment can pin a reviewed digest. PostgreSQL and Redis are digest-pinned. | `32aac7c9fa`, `docker-compose.yml` | Released by `v6.2.0-5` |
| Root MIT LICENSE copied into the runtime image | Modified | The MIT licence's condition is that the notice ships with the Software, and a container image is a distribution of a substantial portion of it. The root `LICENSE` was never copied through any Docker stage into the final image, verified against the exact pinned `v6.2.0-5` digest before implementing (`ls /calcom/LICENSE` exits 2). `builder-two`'s root-metadata copy line now includes `LICENSE`, which `runner` inherits by copying the whole `builder-two` tree. A blocking image-level assertion in `docker-build-and-test` compares the image copy byte-for-byte against the repository source on every build. No legal conclusion is drawn; the licence text, including the Cal.com copyright line, is unmodified. | issue #40, root `Dockerfile`, `.github/actions/docker-build-and-test/action.yml` | Released by `v6.2.0-6` |

## Release And Supply-Chain Changes

| Fork divergence | Type | Reason and effect | Evidence | Release state |
| --- | --- | --- | --- | --- |
| Validation-only manual Docker workflow | Modified | Manual dispatch can build, smoke-test, scan, and create SBOMs but cannot publish. | `74f8665e6a` | Released by `v6.2.0-5` |
| Strict release identity | Added | Publication requires an annotated `vX.Y.Z-N` tag on the reviewed `release` source with a tree equal to `develop`. | `74f8665e6a` | Released by `v6.2.0-5` |
| Build once, publish the tested image | Modified | Removes the previous post-validation rebuild; each architecture pushes the exact image that passed runtime and scan checks. | `74f8665e6a` | Released by `v6.2.0-5` |
| Two-architecture finalization | Added | AMD64 and ARM64 publish first to unique staging references; public version tags and `latest` are finalized only after both jobs succeed. | `74f8665e6a` | Released by `v6.2.0-5` |
| Registry evidence | Added | Captures GHCR digests, CycloneDX SBOMs, provenance attestations, workflow identity, and `release-record.json`. | `74f8665e6a` | Released by `v6.2.0-5` |
| Secure downstream contract | Added | Requires `secure-docker-blueprint` to consume reviewed architecture tags or preferably digests, never `latest` as a trust anchor. | `73a5313f2a`, `74f8665e6a` | Contract introduced earlier; latest enforcement released by `v6.2.0-5` |

GHCR retagging is not transactional. A failed finalization is treated as an incomplete
release and requires inspection before a new build-number tag is prepared.

## Deliberately Removed Upstream Scope

| Removed scope | Why it stays removed | Evidence / guard | Release state |
| --- | --- | --- | --- |
| `.cursor/`, `.changeset/`, `.vscode/`, `SPEC-WORKFLOW.md` | Upstream editor, NPM-release, and team-process machinery is not used by this fork. | `d7747a32d9` | Released by `v6.2.0-2` |
| Upstream team-culture and PR-process AI rules | They describe Cal.com's organization rather than safe engineering of this repository. Technical rules remain. | `b8c32d0aca`, `6e41b14ce8` | Released by `v6.2.0-2` |
| Broad upstream GitHub workflow set | It targets Cal.com's infrastructure, secrets, release process, cron operation, and test estate. Fork-owned workflows replace the required gates. Removing these workflow files does not remove the corresponding application routes; production scheduling is a deployment responsibility. | fork baseline, fork workflows | Fork baseline |
| `packages/lib/domainManager/` | Orphaned and broken Vercel/Cloudflare organization-domain automation with no importers. | `88e8f9e226` | Released by `v6.2.0-5` |
| `packages/lib/formbricks.ts` duplicate | Orphaned duplicate of the live feedback path and incompatible with the installed API client. The active Formbricks integration remains. | `88e8f9e226` | Released by `v6.2.0-5` |
| `packages/lib/telemetry.ts` and related flags | Inert telemetry code and its misleading controls are removed and guarded against return. | `75a9df1812`, fork guard | Released by `v6.2.0-5` |

Removal does not automatically mean an upstream feature is unsupported. Each row states
the actual removed scope; adjacent live integrations remain unless explicitly named.

## Maintenance And Developer Workflow Changes

| Fork divergence | Type | Reason and effect | Evidence | Release state |
| --- | --- | --- | --- | --- |
| Fork-owned `CODEOWNERS` | Modified | Removes Cal.com organization ownership assumptions and assigns review responsibility within this fork. | `a39c99f5e0` | Fork tag `v6.2.0` |
| README and security-contact merge guards | Added | `.gitattributes` marks identity/security-contact files with `merge=ours` so reviewed syncs do not silently restore upstream content. Each clone must configure the documented merge driver. | `6423cafece`, `d7747a32d9` | Released by `v6.2.0-2` |
| Robust Biome pre-commit handling | Modified | Allows staged sets containing only Biome-ignored generated/declaration paths without incorrectly failing because no files were processed. | `778b4200f7`, `lint-staged.config.mjs` | Released by `v6.2.0-5` |
| Public fork process documentation | Added | Defines branch ownership, upstream intake, divergence, security review, release evidence, image handling, and downstream responsibility as auditable contracts. | root `FORK_*`, `UPSTREAM_*`, `RELEASE_PROCESS.md`, `IMAGE_BUILD.md` | Introduced in `v6.2.0-1`; continuously maintained |
| Documentation-only fast path in `forte-ci` | Added | A pull request touching only markdown spent roughly eight minutes in the required `ci` check running an install, a type-check and a Biome pass over a tree it had not changed — none of which produced enforced signal about markdown. `ci` still always runs and always resolves; the fast path skips expensive *steps*, keyed off a one-rule allowlist (a changed path is documentation only if it ends in `.md`), with every other path, every push event, and any unavailable changed-file list taking the full path. Keyed on extension rather than directory because `docs/` also holds `docs/brand/build.py` and the generated `docs/api-reference/v2/openapi.json`. The four fork guards moved ahead of installation and now run on both paths, joined by `git diff --check`. Release evidence is unaffected: `release-docker.yaml` validates push-event runs, which have no fast path. | `32584ba05b`, FIL-0022 | Released by `v6.2.0-6` |
| Mechanically enforced branch protection on `develop`/`release` | Added | Every merge gate described in this fork's process documents was convention only — nothing in GitHub actually blocked a merge with a failing `forte-ci`, and `develop` sat red for over an hour on 2026-08-26 as a direct result. The required status check (`ci`, GitHub's job id) is now enforced with `enforce_admins: true` on both branches, plus code-owner review on `release`. CodeQL, Trivy and Scorecard remain report-only by deliberate design and are not required checks. Fail-closed merge behaviour was demonstrated, not merely configured — PR #51 pushed a deliberately failing `ci` and the API confirmed `mergeable_state: blocked`. | issue #47, `2482ce292b`, PR #51 | Released by `v6.2.0-6` |

## Intentionally Retained Upstream Components

- The Cal.diy application architecture and MIT community-edition feature set remain the
  foundation of the fork.
- Approximately 35 upstream engineering rules remain because they describe this codebase's
  architecture, data, testing, API, and quality constraints.
- Formbricks remains active through its live tRPC integration; only the orphan duplicate was
  removed.
- Turbo, Prisma migration tooling, `ts-node` app-store seeding, and Trigger.dev's runtime SDK
  remain because the current image startup or application imports still require them.
- ARM64 remains a separate `-arm` image tag rather than a combined multi-architecture
  manifest.

## Maintenance Rules

Update this register whenever a fork-owned change materially alters runtime behavior,
security posture, deployment, CI, release handling, branding, or maintained source scope.

For every material divergence:

1. classify it as `Added`, `Modified`, or `Removed`
2. explain the operational reason and user/security effect
3. record the fork commit or enforceable file as evidence
4. mark the first release containing it, or `Unreleased`
5. identify any guard or merge rule needed to preserve it during upstream review
6. update the release state when the change ships

During every upstream review, check whether upstream now implements an equivalent solution.
If it does, prefer converging and retire the fork divergence deliberately rather than
maintaining duplicate behavior forever. Retired entries remain in the chronological sync
log; this register describes the current steady state.
