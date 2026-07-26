> [!IMPORTANT]
> **cal.forte — a hardened, controlled fork of Cal.diy. This is not upstream.**
> You are on the `develop` (integration / review) branch — it diverges from upstream and
> is **not a deployment target**. Deployable images come only from the `release` branch.

# cal.forte

A security-first, review-gated fork of Cal.diy (the MIT community edition of Cal.com).
Goal: a stable, hardened, **auditable** self-host — stay current on upstream security
fixes, keep fork drift small, and shrink the attack surface. Born out of a real self-host
compromise; every change here is deliberate and documented.

## Branch model

| Branch    | Purpose                                   | Deploy?           |
|-----------|-------------------------------------------|-------------------|
| `main`    | Untouched upstream mirror                 | no                |
| `develop` | Fork integration & review (this branch)   | no                |
| `release` | Reviewed source for the GHCR Docker image | tag / digest only |

- Image: `ghcr.io/rubennati/cal.diy` — consume a **reviewed tag/digest**, never `latest`
  (latest release recorded in [.ai/sync-log.md](.ai/sync-log.md)).
- Downstream deployment: [`secure-docker-blueprint`](https://github.com/rubennati/secure-docker-blueprint/tree/main/apps/caldiy).
- Exact diff vs upstream: **https://github.com/rubennati/cal.diy/compare/main...develop**

## 📚 Documentation & knowledge base

Everything we know about this fork, grouped. Entry point for tooling: [.ai/index.md](.ai/index.md).

**Fork process & release**

| Doc | What |
|-----|------|
| [FORK_PROCESS.md](FORK_PROCESS.md) | branch contract & operating cycle |
| [FORK_STRATEGY.md](FORK_STRATEGY.md) | maintenance model, security-fix validation, sync cadence |
| [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) | how upstream is pulled in (security-first) |
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
| [.ai/slimming-analysis.md](.ai/slimming-analysis.md) | attack surface is config-controlled, not code |

**Operational layer (`.ai/`)**

| Doc | What |
|-----|------|
| [.ai/divergence.md](.ai/divergence.md) | steady-state divergence (added / removed / modified) |
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

## Edition & state at a glance

- **Community Edition (MIT)** — Enterprise Edition is absent. **Present:** event types,
  availability, bookings, calendar/video integrations, payments, webhooks, API v2, embed.
  **Absent:** Workflows, Insights, SAML/SSO, audit logs, team management (details:
  [.ai/branding.md](.ai/branding.md)).
- The old cal.com "buy Enterprise" **paywall is already removed**.
- App-store apps are **disabled by default** — active only with credentials
  ([.ai/architecture.md](.ai/architecture.md) §3).

For the full upstream README (install reference), see the [`main` branch](https://github.com/rubennati/cal.diy/blob/main/README.md).
