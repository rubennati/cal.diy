# Slimming Analysis (read-only)

Investigation of "code-slimming / attack-surface reduction" candidates. **No code was
removed** — this records what makes sense and what does not.

## Headline finding

**Most attack surface is already controllable by configuration, not code.** Removing
feature code from this cal.com monorepo is high-risk (deep coupling, 12 generated
`app-store/*.generated.*` files, constant conflict with upstream syncs) and mostly
**unnecessary**:

- App-store apps are **disabled by default** in the DB
  (`App.enabled Boolean @default(false)`) — dormant app code has no active routes or
  credentials until an app is explicitly enabled.
- Major subsystems are **env-gated**: `ENABLE_ASYNC_TASKER` (Trigger.dev),
  `ENABLE_WEBHOOKS`, `CRON_ENABLE_APP_SYNC` (default `false`), `ORGANIZATIONS_ENABLED`.

So the effective lever is **configuration hardening in `secure-docker-blueprint`**, not
deleting code from the fork.

## Candidate by candidate

### Trigger.dev (async tasker) — DISABLE, don't remove
Only ~20 files import `@trigger.dev`; toggled by `ENABLE_ASYNC_TASKER` (falls back to
synchronous execution). Set it off in the deployment env. Removal = high-risk, no gain.
Rule impact: `patterns-trigger-dev` becomes effectively N/A (kept; noted in divergence).

### App-store (111 apps) — CONTROL via DB, don't delete
Apps default to `enabled = false`. Enable only what you use (e.g. `googlecalendar`,
`applecalendar`, `caldavcalendar`, one video app). The other ~100 sit dormant. Deleting an
app touches the 12 `*.generated.*` files (rebuilt by app-store-cli) and risks the build;
the payoff (dormant code) is small. **Not recommended** unless reducing image size / build
time becomes a real goal. If ever done: clearly-isolated apps only, via app-store-cli
regeneration, one reviewable PR each, build + `type-check:ci` gated.

### EE (enterprise) — not present
`packages/features/ee/` is effectively empty; this is the DIY / open-source edition
("no license key required"). Nothing meaningful to slim.

### Teams / Organizations — keep disabled via env
`ORGANIZATIONS_ENABLED` (off), Stripe team vars (inert without config). Leave disabled.

### Webhooks / app-sync — disable if unused (env)
`ENABLE_WEBHOOKS`, `CRON_ENABLE_APP_SYNC=false` (already default off).

## What makes sense vs not

| Action | Verdict |
|--------|---------|
| Disable async-tasker / webhooks / app-sync / orgs via env (blueprint) | ✅ sensible, low-risk |
| Enable only the calendar/video apps you use (DB) | ✅ sensible, low-risk |
| Delete Trigger.dev code | ❌ high-risk, no gain — disable instead |
| Delete EE | ❌ nothing there |
| Delete dormant app-store apps | ⚠️ optional, high-effort / low-gain, only for image size |

## Where the real work lives

Attack-surface reduction here is **deployment configuration** → `secure-docker-blueprint`
(env flags + which apps are enabled in the DB), which is handled separately. The fork
itself needs little-to-no code removal.
