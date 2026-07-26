# Architecture & Configuration Map (read-only reference)

A visibility document for maintaining and **hardening** the fork safely: how Cal.diy is
built, what belongs where, and — crucially — **what can be turned off and where**
(env vs DB vs files). Nothing here changes behaviour; it is reference for better decisions.
Companion to [slimming-analysis.md](slimming-analysis.md) (why removing code is the wrong
lever) and [FORK_STRATEGY.md](../FORK_STRATEGY.md).

## 1. Monorepo layout

| Path | Role |
|------|------|
| `apps/web` | Main Next.js app (App Router + Pages), the UI + most routes |
| `apps/api/v2` | Standalone NestJS API v2 (platform/API consumers) |
| `packages/prisma` | DB schema (`schema.prisma`) + migrations — single source of truth for data |
| `packages/trpc` | Type-safe API layer (routers) between web and services |
| `packages/features` | Domain logic (bookings, availability, webhooks, calendars, …) |
| `packages/app-store` | 111 third-party integrations + the generated registry |
| `packages/ui` | Shared UI components |
| `packages/lib` | Shared utilities + **`constants.ts`** (branding, URLs, flags) |
| `packages/embeds` | Embeddable booking widget (core / react / snippet) |

Runtime = Next.js (web) + NestJS (api v2) + PostgreSQL (Prisma) + Redis (cache/ratelimit).

## 2. Configuration surface — three layers

Hardening happens by **configuration**, not code removal (see slimming-analysis). There are
three independent control planes:

### a) Environment variables (~162 in `.env.example`, 483 lines)
The primary control plane. Set at deploy time (in `secure-docker-blueprint`). Biggest
groups: `NEXT_PUBLIC_*` (48, build-time public), `STRIPE_*` (13), `SENTRY_*` (9),
`GOOGLE_*`, `CALCOM_*`, `EMAIL_*`, `TRIGGER_*`.

### b) Database toggles (runtime, per instance / user / team)
- **`App.enabled`** (`default false`) — which app-store apps are active.
- **`Feature`** table (`enabled default false`, types RELEASE/OPERATIONAL) — feature flags,
  optionally scoped per user/team via `UserFeatures` / `TeamFeatures`.
- Managed via the admin UI: `/settings/admin/apps/[category]` and `/settings/admin/flags`.

### c) File-based
- **Logos**: hardcoded paths in `packages/lib/constants.ts` (`LOGO`, `LOGO_DARK`,
  `LOGO_ICON` → `/calcom-logo-*.svg` in `apps/web/public`). Rebrand = swap the SVGs.
- **Theme/colors**: Tailwind-based (shared config + CSS variables) — a code/config change,
  more involved than env.

## 3. App-store: how apps are gated (answer to "only the apps I need")

Each app lives in `packages/app-store/<dirName>/` (config, `api/`, `lib/`, `static/`) and is
compiled into 12 `*.generated.*` registry files. **Apps are inert until two things are true:**

1. **`App.enabled = true`** in the DB (default `false`), and
2. a user connects **credentials** for it.

The enablement gate is `shouldEnableApp(dirName, keys)`: an app is only enabled if it has
**valid keys** (or needs none). So the *active* set is driven by **which credentials you
provide** — e.g. set only Google/Apple/CalDAV creds and only those become usable; the other
~100 apps sit in the DB `enabled = false` with no routes/credentials.

Categories (attack-surface planning): `calendar` (4), `conferencing` (24), `analytics` (12),
`crm` (6), `automation` (6), `payment` (5), `messaging` (3), `other` (6). A simple calendar
instance needs `calendar` + maybe one `conferencing`; everything else can stay disabled.

> Note: `scripts/seed-app-store.ts` is `@deprecated` (E2E only). In production, app rows are
> managed via the admin UI + the credential gate above — not a build-time hard-coded seed.

## 4. Hardening levers (all configuration, no code changes)

| Lever | Where | Effect |
|-------|-------|--------|
| `NEXT_PUBLIC_DISABLE_SIGNUP=true` | env | Lock down signup (single-user/private instance) |
| `ALLOWED_HOSTNAMES` | env | Restrict accepted hostnames (host-header hardening) |
| `CSP_POLICY` | env | Content-Security-Policy (`non-strict` available) |
| `NEXTAUTH_COOKIE_DOMAIN` | env | Scope auth cookies |
| Ratelimiting (Unkey / Upstash Redis) | env | Throttle abuse |
| `ENABLE_ASYNC_TASKER=false` | env | Disable Trigger.dev (sync fallback) |
| `ENABLE_WEBHOOKS` / `CRON_ENABLE_APP_SYNC=false` | env | Disable webhook/app-sync surface |
| `ORGANIZATIONS_ENABLED` (empty) | env | Keep teams/orgs off |
| Provide only chosen app credentials | env → DB gate | Only those apps become active |
| Disable unused apps/features | DB (`/admin/apps`, `/admin/flags`) | Shrink runtime surface |

## 5. Branding / white-labeling (MIT-licensed — free to rebrand)

Centrally env-driven in `packages/lib/constants.ts`:

- `NEXT_PUBLIC_APP_NAME` (→ `APP_NAME`, default "Cal.diy")
- `NEXT_PUBLIC_COMPANY_NAME` (default "Cal.com, Inc.")
- `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS`, `EMAIL_FROM_NAME`, `NEXT_PUBLIC_SENDER_ID`, `SENDER_NAME`

**File-based**: logos (swap `/calcom-logo-*.svg` in `apps/web/public`), theme (Tailwind).
**Residue**: ~52 files still hard-code the string "Cal.com" — full rebrand needs some code
edits, but name/company/email/logo cover the visible surface. The **embed**
(`packages/embeds`) is themable via its embed-API options.

## 6. Minimal hardened single-user instance — config template

Copy-paste starting point for `secure-docker-blueprint` (adjust to taste):

```dotenv
# --- Identity / branding ---
NEXT_PUBLIC_APP_NAME="cal.forte"
NEXT_PUBLIC_COMPANY_NAME="<you>"
NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS="security@<your-domain>"
EMAIL_FROM_NAME="cal.forte"

# --- Lock down ---
NEXT_PUBLIC_DISABLE_SIGNUP=true          # no public registration
ALLOWED_HOSTNAMES='"<your-domain>"'
CSP_POLICY=non-strict                    # enable CSP where supported
ORGANIZATIONS_ENABLED=                   # teams/orgs off

# --- Trim runtime surface ---
ENABLE_ASYNC_TASKER=false                # no Trigger.dev
CRON_ENABLE_APP_SYNC=false

# --- Apps: provide ONLY what you use → only these become enabled ---
#   Calendar: Google / Apple / CalDAV / Office365 (set the creds you need)
GOOGLE_API_CREDENTIALS=...               # google-calendar + google-meet
#   (Apple & CalDAV need no global keys — usable once a user connects them)
#   Leave Zoom/Stripe/CRM/analytics/AI creds UNSET → those apps stay enabled=false
```

## 7. Biggest challenges when hardening (where the risk is)

- **Config sprawl**: ~162 env vars across three control planes (env/DB/file) — the risk is
  *missing* a knob, not a lack of them. This document is the map.
- **DB vs env split**: some hardening is env (build/deploy), some is DB runtime state
  (`App.enabled`, feature flags via admin) — both must be set for a given instance.
- **Prisma schema is the coupling core**: apps/features hang off models + generated files;
  that's why removing code is risky and disabling is preferred.
- **Secrets**: injected at runtime (blueprint), never in the image — keep it that way
  (see the release Dockerfile note in the sync-log).
- **Upstream drift**: config knobs can change between upstream versions — re-verify this map
  on each sync (tie into the sync triage in FORK_STRATEGY).
