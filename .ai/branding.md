# Branding, White-Labeling & Edition (CE vs EE) — read-only reference

What can be rebranded, **where** it is set, and — critically — whether it changes at
**build time or runtime**. Plus what this edition actually ships. Verified by reading
`packages/lib/constants.ts`, `scripts/start.sh`, `packages/prisma/schema.prisma`, and
feature file counts (no runtime instance was exercised).

## 1. Build-time vs runtime — the key rule

Next.js inlines every `NEXT_PUBLIC_*` variable into the **client bundle at build time**.
The container entrypoint (`scripts/start.sh`) rewrites **only one** at runtime:

```
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"
```

- **`NEXT_PUBLIC_WEBAPP_URL`** → runtime-changeable (placeholder swap on boot). ✅
- **All other `NEXT_PUBLIC_*`** (incl. `APP_NAME`, `COMPANY_NAME`, `SENDER_ID`) → **baked at
  build**. Changing them needs an **image rebuild** with the value passed as a build-arg. ❌
- **Server-only** vars (e.g. `EMAIL_FROM_NAME`) → read at runtime → changeable via env. ✅
- **Logos / favicons** → static files baked into the image → rebuild or volume-mount to override.
- `start.sh` also runs the app-store seed **every boot** → apps are (re)enabled from your
  provided credentials on each start (see [architecture.md](architecture.md) §3).

### ⚠️ Current state: the image is hard-branded "Cal.diy"
`NEXT_PUBLIC_APP_NAME` is **not even a build-arg in the `Dockerfile`**, so the built image
defaults to `APP_NAME = "Cal.diy"` (from `constants.ts`). To ship a `cal.forte`-branded
image you must add the ARG to the Dockerfile and pass it in `release-docker`. Currently NOT done.

## 2. What can be branded, where, and how

| Item | Set via | Build / Runtime | How |
|------|---------|-----------------|-----|
| App name | `NEXT_PUBLIC_APP_NAME` | **build** | add Dockerfile ARG + build-arg, rebuild |
| Company name | `NEXT_PUBLIC_COMPANY_NAME` | build | same |
| Support email | `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS` | build | same |
| Email sender name | `EMAIL_FROM_NAME` (server) | **runtime** | env in blueprint |
| SMS sender id / name | `NEXT_PUBLIC_SENDER_ID` / `SENDGRID_SENDER_NAME` | build | rebuild |
| App URL | `NEXT_PUBLIC_WEBAPP_URL` | **runtime** | env (placeholder swap on boot) |
| Logo / dark / icon | files `/calcom-logo-*.svg` in `apps/web/public` | build (files) | swap files → rebuild, or volume-mount |
| Favicons / touch icons | files in `apps/web/public` | build (files) | same |
| Brand colors | DB `brandColor` / `darkBrandColor` (Team/Org) | **runtime** | UI — needs team/org |
| Instance logo / banner | DB `logoUrl` / `bannerUrl` (Org) | runtime | UI — needs org |
| Hide "Cal.com" branding | DB `hideBranding` (Team/Org) | runtime | UI — needs team/org |
| Disable signup | `NEXT_PUBLIC_DISABLE_SIGNUP` | build | rebuild |

**Bottom line:** the *instance-wide* visible brand (name, logo, colors) is **build-time** —
bake it into your GHCR image. **Team/Org-level** branding (logoUrl, colors, hideBranding) is
**runtime DB state**, but requires teams/orgs enabled. Residual: ~52 files still hard-code
the string "Cal.com".

## 3. Edition: this is the Community Edition (MIT)

`packages/features/ee/` is **empty (0 files)** — the Enterprise Edition is not present. This
is the open-source CE (cal.diy), MIT-licensed, **no license key**. Verified presence:

| Feature | In cal.diy (CE)? | Notes |
|---------|:---:|-------|
| Event types | ✅ | core |
| Availability / scheduling | ✅ | core |
| Bookings | ✅ | 254 files — the heart |
| Calendar connections | ✅ | via app-store calendar apps (credential-gated) |
| Video / conferencing | ✅ | 24 conferencing apps |
| Auth (email/password, OAuth) | ✅ | NextAuth |
| Payments | ✅ | Stripe app |
| Webhooks | ✅ | present, env-togglable |
| App-store (111 apps) | ✅ | inert unless credentialed |
| API v2 | ✅ | NestJS |
| Embed | ✅ | `packages/embeds` |
| Basic teams (data model) | ⚠️ | schema + ~12 files; limited |
| **Workflows** (reminder automations) | ❌ | 0 files (was `ee/workflows`) — no SMS/email sequence builder |
| **Insights** (analytics dashboard) | ❌ | 0 files |
| **SAML / SSO / SCIM** | ❌ | ~1 file — effectively absent |
| **Audit logs** | ❌ | EE |
| **Organizations** (multi-org admin) | ⚠️ | `ORGANIZATIONS_ENABLED` + schema exist; full admin is EE-ish → keep off |
| Routing forms | ❌ | only tip images present |

> Note: transactional emails (booking confirmation/cancel) are core and work. The
> configurable **Workflow automation builder** (reminder/SMS/email sequences) is the EE
> feature that is absent — don't assume automated reminders exist.

**Takeaway:** a solid single-user / small-team scheduling core. The enterprise and some
automation features are simply not here — for a hardened minimal instance that is a
**smaller attack surface**, not a loss.

## 4. Organizations — short answer

`ORGANIZATIONS_ENABLED` (env) toggles the org layer; the DB has org/team branding fields,
but multi-org admin is an enterprise concept. For a single-user hardened instance: **leave
orgs off**. Team/org branding (logo/colors/hideBranding) only applies if enabled.

## 5. UI reality: paywall, EE upsells & teams

**The pay-to-upgrade paywall is already removed.** `apps/web/modules/shell/UpgradeTip.tsx`
is a no-op — its own comment: *"In the open-source distribution there is no paywall – always
render children"* — and it is referenced nowhere. The old cal.com "buy this Enterprise
feature" prompts are **gone**. There is **no `LicenseRequired` UI gating** (0 usages).

Residual "upgrade" surface: `getUserTopBanners` can return `teamUpgradeBanner` /
`orgUpgradeBanner` — **billing** banners for teams/orgs, empty without billing config or
without teams/orgs enabled. `apps/web/modules/upgrade/upgrade-view.tsx` is a leftover page,
not linked from any paywall.

**Teams / shared calendar / round-robin — mixed, likely absent:**
- Round-robin & collective scheduling exist at the code level: `SchedulingType`
  (`ROUND_ROBIN`/`COLLECTIVE`/`MANAGED`), `getLuckyUser` host selection, and team event-type
  support (member assignment, team availability, API v2 team event-types).
- **But there is no way to create a team** — verified across every path: no `viewer/teams`
  CRUD router, no `createTeam` mutation, no team-settings/create page; the onboarding wizard
  is **personal-only** (no team step); the `create_new_team` i18n string is **unused** (dead);
  no CLI script; no API v2 create-team endpoint. Only residual models + team-*consumption* code remain.
- **Conclusion:** team / shared-calendar / round-robin is **not usable** in this build —
  round-robin needs a team, and there is no UI / wizard / CLI / API to create one (a
  DB-inserted `Team` row likely wouldn't surface either — no team pages). Re-adding teams
  would be a feature project, not a config toggle. A CE-stripping choice, not a bug.

## 6. To actually rebrand the image (future step, if wanted)

1. `Dockerfile` (builder stage): add `ARG NEXT_PUBLIC_APP_NAME` + `ENV NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME` (and `_COMPANY_NAME`, `_SUPPORT_MAIL_ADDRESS`).
2. Pass them as `build-args` in `release-docker` / the reusable action.
3. Replace `apps/web/public/calcom-logo-*.svg` + favicons with your assets.
4. Optionally set `EMAIL_FROM_NAME` at runtime (blueprint env).

A small, reviewable code + build change — flagged here, not done.
