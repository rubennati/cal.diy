> [!IMPORTANT]
> **cal.forte — a hardened, controlled fork of Cal.diy. This is not upstream.**
> Changes are reviewed on `develop`; deployable images come only from reviewed tags on
> `release`. Use a versioned, architecture-specific digest — never `latest` as a trust anchor.

# cal.forte

A security-first, review-gated fork of Cal.diy (the MIT community edition of Cal.com).
Goal: a stable, hardened, **auditable** self-host — stay current on upstream security
fixes, keep fork drift small, and shrink the attack surface. Born out of a real self-host
compromise; every change here is deliberate and documented.

**Upstream review:** Last checked **2026-08-10** through [`176037d0af`](https://github.com/rubennati/cal.diy/commit/176037d0afbe572f870a3c702985e7cd83fe6c0c). [Full fork status →](FORK_STATUS.md)

**Fork changes:** Security defaults, telemetry, CI, container runtime, and release handling
intentionally differ from Cal.diy. [See the public divergence register →](FORK_DIVERGENCE.md)

**Latest release:** [`v6.2.0-5`](https://github.com/rubennati/cal.diy/tree/v6.2.0-5)
from [`201b016984`](https://github.com/rubennati/cal.diy/commit/201b016984fe13388ccdc6a82f2669e9719d3bcc).
[Full release evidence →](FORK_STATUS.md#latest-release-evidence)

## Branch model

| Branch    | Purpose                                   | Deploy?           |
|-----------|-------------------------------------------|-------------------|
| `main`    | Untouched upstream mirror                 | no                |
| `develop` | Fork integration and review               | no                |
| `release` | Reviewed source for the GHCR Docker image | tag / digest only |

- Image: `ghcr.io/rubennati/cal.diy` — consume a **reviewed tag/digest**, never `latest`
  (latest release recorded in [FORK_STATUS.md](FORK_STATUS.md)).
- Downstream deployment: [`secure-docker-blueprint`](https://github.com/rubennati/secure-docker-blueprint/tree/main/apps/caldiy).
- Exact reviewed diff vs upstream: **https://github.com/rubennati/cal.diy/compare/main...develop**
- Exact release diff vs upstream: **https://github.com/rubennati/cal.diy/compare/main...release**

## Releases

The latest published image was built from `release` at
[`201b016984`](https://github.com/rubennati/cal.diy/commit/201b016984fe13388ccdc6a82f2669e9719d3bcc):

- AMD64: `ghcr.io/rubennati/cal.diy:v6.2.0-5@sha256:c2facc284b28e1eea76b6d82c02e680d20d648dc255ef7f74520dbf30d18b17e`
- ARM64: `ghcr.io/rubennati/cal.diy:v6.2.0-5-arm@sha256:dffa387024a68b9b057b1bdf3342a21b699bb092da4f711932f129bd932faeae`
- Evidence: [Release Docker run 31435807941](https://github.com/rubennati/cal.diy/actions/runs/31435807941)
- Downstream handoff: [secure-docker-blueprint issue #30](https://github.com/rubennati/secure-docker-blueprint/issues/30)

Tags are architecture-specific; there is currently no combined multi-architecture manifest.
See [FORK_STATUS.md](FORK_STATUS.md) for the maintenance snapshot and
[CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md) for the downstream trust contract.

## 📚 Documentation & knowledge base

Everything we know about this fork, grouped. Entry point for tooling: [.ai/index.md](.ai/index.md).

**Fork process & release**

| Doc | What |
|-----|------|
| [FORK_PROCESS.md](FORK_PROCESS.md) | branch contract & operating cycle |
| [FORK_STRATEGY.md](FORK_STRATEGY.md) | maintenance model, security-fix validation, sync cadence |
| [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md) | public register of fork-added, modified and removed behavior |
| [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) | how upstream is pulled in (security-first) |
| [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md) | commit-level accepted, partial, deferred and rejected upstream changes |
| [RELEASE_PROCESS.md](RELEASE_PROCESS.md) · [IMAGE_BUILD.md](IMAGE_BUILD.md) | cutting & building a release |
| [SECURITY_REVIEW.md](SECURITY_REVIEW.md) · [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md) | review gate & downstream trust |

**Understand the app (architecture · config · branding)**

| Doc | What |
|-----|------|
| [.ai/architecture.md](.ai/architecture.md) | monorepo layout, 3 config planes (env / DB / file), hardening levers |
| [.ai/env-reference.md](.ai/env-reference.md) | every env var: meaning, format, priority, recommendation |
| [.ai/branding.md](.ai/branding.md) | white-labeling (build vs runtime), CE-vs-EE table, paywall/teams reality |

**Harden & secure**

| Doc | What |
|-----|------|
| [.ai/hardening-checklist.md](.ai/hardening-checklist.md) | how/where to apply the top security actions |
| [config/cal.forte.env.example](config/cal.forte.env.example) | ready-to-use hardened env template (Brevo · MS · Zoom · Apple) |
| [.ai/slimming-analysis.md](.ai/slimming-analysis.md) | attack surface is config-controlled, not code |

**Operational layer (`.ai/`)**

| Doc | What |
|-----|------|
| [.ai/sync-log.md](.ai/sync-log.md) | timeline of sync / security / release rounds |
| [.ai/roadmap.md](.ai/roadmap.md) | open work |
| [.ai/decisions.md](.ai/decisions.md) · [.ai/state.md](.ai/state.md) · [.ai/project-brief.md](.ai/project-brief.md) | durable decisions · current state · brief |

**Engineering rules (adopted from upstream)** — [AGENTS.md](AGENTS.md) (= `CLAUDE.md`) ·
[agents/README.md](agents/README.md): 35 kept rules; cal.com team/PR-process rules removed.

## Security fix policy

Falling behind upstream on **security** fixes is the one drift this fork does not tolerate.
Security-relevant upstream commits are taken by default — even when a full sync is deferred.
Validate they are *real* fixes (CVE/advisory + diff, not just the commit title):
[FORK_STRATEGY.md → Security-fix validation](FORK_STRATEGY.md).

## Removed from upstream — and kept out

Upstream ships code that phones home. This fork removes it rather than switching it off,
because a disabled-by-default vendor integration still has to be re-audited by every
reviewer, and an upstream merge can silently re-arm it.

- **Usage telemetry** (Jitsu, `t.calendso.com`, with a vendor write key in the source) —
  deleted, along with the `CALCOM_TELEMETRY_DISABLED` flag, which gated nothing after
  upstream dropped `next-collect`. **Do not re-add that flag:** it would document a privacy
  control that does not exist. Enforced by `scripts/fork-guard-telemetry.sh`, a blocking
  `forte-ci` step that fails if the module, endpoint, key, flag or dependency reappear.
- **Ad-click tracking** (`gclid` / `li_fat_id`) — real and still present upstream; this fork
  ships it **off by default** in the image (`GOOGLE_ADS_ENABLED=0`, `LINKEDIN_ADS_ENABLED=0`).

Full list with rationale: [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md). One caveat worth knowing
before you audit: `type-check` runs for only 8 of 113 packages, so a green CI run is not
proof that the whole tree compiles — [.ai/quality-gates.md](.ai/quality-gates.md).

## Edition & state at a glance

- **Community Edition (MIT)** — Enterprise Edition is absent. **Present:** event types,
  availability, bookings, calendar/video integrations, payments, webhooks, API v2, embed.
  **Absent:** Workflows, Insights, SAML/SSO, audit logs, team management (details:
  [.ai/branding.md](.ai/branding.md)).
- The old cal.com "buy Enterprise" **paywall is already removed**.
- App-store apps are **disabled by default** — active only with credentials
  ([.ai/architecture.md](.ai/architecture.md) §3).

For the full upstream README (install reference), see the [`main` branch](https://github.com/rubennati/cal.diy/blob/main/README.md).
