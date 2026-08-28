# Self-Host Productization

Branding, legal URLs, residual commercial messaging and hard-coded Cal.com references in
`cal.forte`, with the evidence needed to decide what to change.

| Item | Value |
| --- | --- |
| Branch of record | `develop` |
| Audited commit | `41689d1d6e3fbef3da14c75ee94ba254542d9235` |
| Audit date | 2026-08-25 · consolidated and re-verified 2026-08-26 |
| Method | static source reading, independently re-verified per finding. **No image was pulled and no instance was deployed by this pass.** §7 records the one area carrying live-deployment evidence from a separate manual session. |
| Companions | [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) · [LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) |

Guiding principle, restated: *a self-hosted MIT distribution should not present irrelevant
hosted-Cal.com commercial upgrade prompts unless there is a deliberate and documented reason.*
This does **not** mean removing required licence notices — see
[LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §1.

## 1. Verdict Up Front

The claim in [.ai/branding.md](../.ai/branding.md) §5 and [README.md](../README.md) — *"the
pay-to-upgrade paywall is already removed"* — is **accurate about the paywall** and
**incomplete about commercial messaging**.

- The *gating* mechanism is genuinely gone: `LicenseRequired` has zero usages, `UpgradeTip`
  is a pass-through with zero callers, no `NEXT_PUBLIC_LICENSE_CONSENT` banner exists.
- But **two commercial Cal.com prompts are still reachable in a fresh install**, and one of
  them is on the public booking page.

**A fresh image built from current `develop` can still present a commercial Cal.com upsell
during normal self-host onboarding, and to every anonymous booker.** Both findings are
upstream-inherited, both are small and well-isolated.

## 2. Residual Commercial Messaging — Classified

| # | Reference | Location | Class | Notes |
| --- | --- | --- | --- | --- |
| 1 | `$15/user/mo` team plan badge | `apps/web/modules/onboarding/getting-started/onboarding-view.tsx:106` + `packages/i18n/locales/*/common.json` `onboarding_plan_team_badge` | **`ACTIVE_AND_REACHABLE`** | §3 |
| 2 | `https://cal.com/signup` upsell + email form | `apps/web/modules/bookings/views/bookings-single-view.tsx:1037-1060` | **`ACTIVE_AND_REACHABLE`** | §4 |
| 3 | `$37/user/mo` organization badge | `onboarding-view.tsx:114` | `DEAD_RESIDUE` | filtered out unconditionally at lines 122-127 |
| 4 | `/upgrade` page | `apps/web/app/(use-page-wrapper)/upgrade/page.tsx` + `apps/web/modules/upgrade/upgrade-view.tsx` | `ACTIVE_AND_REACHABLE` (benign) | renders "You are all set" with a `mailto:support@cal.com` button; mutations are locally stubbed |
| 5 | `/enterprise` page | `apps/web/app/(use-page-wrapper)/enterprise/page.tsx` | `DEAD_RESIDUE` | body is `redirect("/")` |
| 6 | `UpgradeTip` | `apps/web/modules/shell/UpgradeTip.tsx` | `DEAD_RESIDUE` | comment: *"In the open-source distribution there is no paywall – always render children"*; **zero callers** |
| 7 | `LicenseRequired` | — | `REMOVED` | zero usages anywhere |
| 8 | `NEXT_PUBLIC_LICENSE_CONSENT` | `Dockerfile:6,28`; `docker-compose.yml:46`; `release-docker` passes `agree` | `DEAD_RESIDUE` | no application code reads it; only i18n strings `accept_our_license` / `remove_banner_instructions` mention it |
| 9 | `teamUpgradeBanner` / `orgUpgradeBanner` | `packages/trpc/server/routers/viewer/me/getUserTopBanners.handler.ts:16-17,50-51` | `DEAD_RESIDUE` | producers stubbed to `null` / `false`; `LayoutBanner.tsx` has no branch for either key |
| 10 | `~30 upgrade_* / plan_upgrade* i18n keys` | `packages/i18n/locales/*/common.json` | `DEAD_RESIDUE` | e.g. `plan_upgrade_teams`, `upgrade_feature_round_robin`, `upgrade_to_organizations`, `upgrade_team_to_orgs_with_price` |
| 11 | Marketing screenshots | `apps/web/public/upgrade/*.png` (5), `apps/web/public/tips/teams*.jpg` | `DEAD_RESIDUE` | shipped in the image |
| 12 | `ORGANIZATION_SELF_SERVE_PRICE = 37` | `packages/lib/constants.ts:143-145` | `DEAD_RESIDUE` | no consumer traced |
| 13 | `IS_TEAM_BILLING_ENABLED` | `packages/lib/constants.ts:130-133` | `CONDITIONAL` → effectively off | requires `STRIPE_*` **and** `HOSTED_CAL_FEATURES`; `IS_SELF_HOSTED` is true for any non-`cal.com` host, so `HOSTED_CAL_FEATURES` is false |
| 14 | `IS_PREMIUM_USERNAME_ENABLED` | `packages/lib/constants.ts:167-169` | `HOSTED_ONLY` | requires `IS_CALCOM` — false on a self-host. Also selects the signup handler (`route.ts:66`), so self-hosts take `selfHostedHandler` |
| 15 | Stripe billing webhooks | `apps/web/pages/api/stripe/webhook.ts`, `.../stripepayment/webhook.ts` | `REMOVED` (404 stubs) | *"Billing webhooks are not available in community edition"* |
| 16 | `/settings/billing` Kbar entry | `apps/web/modules/shell/Kbar.tsx:205-211` | `DEAD_RESIDUE` | route does not exist → 404 |
| 17 | `viewer.admin.createSelfHostedLicense` | `packages/trpc/server/routers/viewer/admin/_router.ts:46` + `createSelfHostedLicenseKey.handler.ts` | **`CONDITIONAL`** | mounted admin mutation that POSTs to `https://goblin.cal.com/v1/license` and returns a `stripeCheckoutUrl`; **zero frontend callers**; inert unless `CAL_SIGNATURE_TOKEN` is set — §2.1 |
| 18 | `viewer.admin.createCoupon` | `admin/_router.ts:52` + `createCoupon.handler.ts` | **`CONDITIONAL`** | same shape; POSTs to `…/v1/license/coupon`, returns `promotionCode` |
| 19 | Admin settings nav entry "license" | `apps/web/app/(use-page-wrapper)/settings/(settings-layout)/SettingsLayoutAppDirClient.tsx:200-203` | `DEAD_RESIDUE` (misleading) | labelled `license`, links to `/auth/setup?step=1`, which is now the **admin-user** step |
| 20 | Kbar "choose_a_license" | `apps/web/modules/shell/Kbar.tsx:181-187` | `DEAD_RESIDUE` (misleading) | same target |
| 21 | Setup wizard step enum | `apps/web/app/(use-page-wrapper)/auth/setup/page.tsx:26` | `DEAD_RESIDUE` | `z.enum(["1","2","3","4"])` while `setup-view.tsx` builds only **two** steps |
| 22 | `refer` / Dub referrals | `apps/web/modules/shell/useBottomNavItems.ts:33-43`, `apps/web/app/(use-page-wrapper)/refer` | `CONDITIONAL` | gated by `IS_DUB_REFERRALS_ENABLED` ← `NEXT_PUBLIC_DUB_PROGRAM_ID`, empty by default |

### 2.1 The license wizard — UI removed, backend still mounted

The setup wizard's licence step is genuinely gone. `apps/web/modules/auth/setup-view.tsx` now
builds exactly two steps — `administrator_user` and `enable_apps` — and the components
`ChooseLicense.tsx`, `EnterpriseLicense.tsx` and `LicenseSelection.tsx` were deleted by
`ab21c7f805`. `apps/web/components/setup/` contains only `AdminUser.tsx` and `StepDone.tsx`.
So a fresh self-host is **not** asked to choose a licence. That part of
[.ai/branding.md](../.ai/branding.md) §5 is correct.

What survives is the **server half**. `packages/trpc/server/routers/viewer/admin/_router.ts:46,52`
still mounts:

```
viewer.admin.createSelfHostedLicense  → POST https://goblin.cal.com/v1/license        → { stripeCheckoutUrl }
viewer.admin.createCoupon            → POST https://goblin.cal.com/v1/license/coupon → { promotionCode, couponId }
```

Both are HMAC-signed with `process.env.CAL_SIGNATURE_TOKEN` and both throw immediately if it is
unset. `CAL_SIGNATURE_TOKEN` appears **nowhere** in `.env.example`,
`config/cal.forte.env.example`, the `Dockerfile`, or `docker-compose.yml`, so on any normal
deployment these mutations fail closed. Neither has a frontend caller.

Assessment: `BACKEND_ONLY` residue of the removed licence-purchase wizard, `CONDITIONAL` on an
undocumented environment variable, and doubly gated behind `authedAdminProcedure` plus an
explicit `ctx.user.role !== "ADMIN"` check. **Not a live upsell**, but it is a mounted endpoint
whose only purpose is to initiate a commercial Cal.com purchase, and the two nav entries that
used to lead to it now point at an unrelated wizard step. Clean `REMOVE_DEAD_RESIDUE`
candidates.

## 3. Finding 1 — The `$15/user/mo` Onboarding Plan Chooser

This is almost certainly the "approximately EUR 15 team option" that was observed in a
deployed instance. The evidence chain:

**The string.** `packages/i18n/locales/en/common.json:4433`

```json
"onboarding_plan_team_badge": "$15/user/mo",
```

German — the likely locale of the observation — renders it as
`packages/i18n/locales/de/common.json:4396`:

```json
"onboarding_plan_team_badge": "15 $/Benutzer/Monat",
```

A "15 $/Benutzer/Monat" badge in a German UI is readily remembered as "about €15 for teams".

**Where it renders.** `apps/web/modules/onboarding/getting-started/onboarding-view.tsx:103-110`
builds a plan card with `badge: t("onboarding_plan_team_badge")`, rendered as a `<Badge>` at
lines 192-201 next to the title "With my team".

**Why it is reachable.** Two migrations:

```
packages/prisma/migrations/20251005102651_add_onboarding_v3_feature_flag/migration.sql
  INSERT INTO "Feature" (slug, enabled, …) VALUES ('onboarding-v3', false, …) ON CONFLICT DO NOTHING;

packages/prisma/migrations/20260213000000_enable_onboarding_v3_globally/migration.sql
  UPDATE "Feature" SET "enabled" = true, "updatedAt" = CURRENT_TIMESTAMP WHERE "slug" = 'onboarding-v3';
```

`scripts/start.sh` runs `npx prisma migrate deploy` on **every container boot**, so the flag is
`true` in any database this image has ever started against. No later migration turns it off.

**The path a new user takes.**

```
sign up → /auth/verify-email → apps/web/app/page.tsx
  → checkOnboardingRedirect()                        (onboardingUtils.ts:24-79)
      shouldShowOnboarding = !completedOnboarding && !organizationId && createdDate > 2021-09-01
      onboardingV3Enabled = true
      → "/onboarding/getting-started"
  → apps/web/app/(use-page-wrapper)/onboarding/layout.tsx  → flag on → renders
  → .../onboarding/getting-started/page.tsx                → renders <OnboardingView>
  → plan cards: "For personal use — Free" | "With my team — $15/user/mo"
```

**And it dead-ends.** `onboarding-view.tsx:78-85`:

```ts
if (selectedPlan === "organization")  router.push("/onboarding/organization/details");
else if (selectedPlan === "team")     router.push("/onboarding/teams/details");
else if (selectedPlan === "personal") router.push("/onboarding/personal/settings");
```

`apps/web/app/(use-page-wrapper)/onboarding/` contains exactly `getting-started/`, `personal/`
and `layout.tsx`. **Neither `teams/details` nor `organization/details` exists** → Next.js 404.
`apps/web/modules/onboarding/components/onboarding-continuation-prompt.tsx:56` likewise pushes
to a non-existent `/onboarding/teams/invite`, though it can never trigger because its
`teamDetails` store state can never be populated.

So a new self-host user is shown a paid Cal.com team plan, and choosing it produces a 404.

**Provenance.** `git log` for the enable migration shows upstream commits `7aefefc31f`,
`227ed64b49`, `f5a813f531`, and `git cat-file -e origin/main:…` confirms the file is present on
the upstream mirror. **This is upstream behaviour inherited by the fork, not a `cal.forte`
change.**

**Mitigations available today**, in ascending order of divergence:

| Option | Mechanism | Effect | Cost |
| --- | --- | --- | --- |
| Runtime, no code change | admin UI `/settings/admin/flags` → disable `onboarding-v3` | falls back to the legacy `/getting-started` wizard, which is **personal-only** (`UserSettings → ConnectCalendars → ConnectedVideo → SetupAvailability → UserProfile` — no team step) | zero code, but must be re-done after any database reset, and the migration re-enables it on a **fresh** database |
| Fork migration | a `cal.forte`-owned migration setting `enabled = false` | survives fresh installs | small; a fork-owned migration is a permanent divergence to reconcile each sync |
| Remove the plan step | delete the team card from `plans` | onboarding goes straight to personal setup | small; touches one array |
| Rewrite the badge | change the i18n value | keeps the step, drops the price | smallest edit, but leaves a dead-end route |

Recommended for evaluation: **disable the flag by fork migration** — it removes the price
prompt *and* the 404 in one deterministic change, and it does not fork any component.

## 4. Finding 2 — Hosted Cal.com Signup Upsell On The Public Booking Page

`apps/web/modules/bookings/views/bookings-single-view.tsx:1037-1060`:

```tsx
{session === null && !(userIsOwner || props.hideBranding) && (
  <>
    <a href="https://cal.com/signup">{t("create_booking_link_with_calcom", { appName: APP_NAME })}</a>
    <form onSubmit={(e) => { … router.push(`https://cal.com/signup?email=${target.email.value}`); }}>
      <EmailInput name="email" defaultValue={email} placeholder="rick.astley@cal.com" />
      <Button type="submit">{t("try_for_free")}</Button>
    </form>
  </>
)}
```

**Conditions.** `session === null` (an anonymous booker), not the event owner, and
`hideBranding` false. `User.hideBranding` defaults to `false`
(`packages/prisma/schema.prisma:416`), and `shouldHideBrandingForUserEvent`
(`packages/features/profile/lib/hideBranding.ts:161-172`) resolves to `owner.hideBranding ??
false`. So on a default instance **the block renders for every anonymous booker on the
booking-confirmation page**.

**Why this matters more than the onboarding badge:**

1. It is on a **public** page, seen by the operator's guests rather than the operator.
2. It sends the booker's email address to a **third party** (`cal.com`) in a **URL query
   string** — the exact pattern the fork's own privacy posture argues against.
3. The link text renders as *"Create your own booking link with cal.forte"* (the i18n key takes
   `appName`), while the href goes to Cal.com's commercial signup. The branding and the
   destination disagree.

**Mitigation available today without code change:** a self-hosted user can enable
`hideBranding` in `/settings/my-account/appearance` — the page passes
`hasPaidPlan = IS_SELF_HOSTED ? true : …` (`appearance/page.tsx:46`), so the toggle is
functional on a self-host. That suppresses the block. It is per-user, opt-in, undiscoverable,
and off by default.

**Recommendation for evaluation:** remove the block, or gate it on `IS_CALCOM`. Deleting a link
to a third party creates no licensing obligation
([LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §4).

## 5. Terms, Privacy And Legal URLs

### 5.1 The exact UI

`packages/i18n/locales/en/common.json:3302`:

```json
"signing_up_terms": "By proceeding, you agree to {{appName}}'s <0>Terms</0> and <1>Privacy Policy</1>.",
```

Rendered in **two** places, both with `values={{ appName: APP_NAME }}`:

| Page | File:line | Audience |
| --- | --- | --- |
| Signup | `apps/web/modules/signup-view.tsx:748` (`href` at 754, 761) | new users |
| **Public booking form** | `apps/web/modules/bookings/components/BookEventForm/BookEventForm.tsx:181` (`href` at 187, 194) | **every booker**, gated only on `!isPlatform` |

A third variant at `BookEventForm.tsx:203-222` uses `proceeding_agreement` + `terms` +
`privacy_policy` for `isPlatformBookerEmbed`.

### 5.2 The exact hrefs in a normal `cal.forte` release image

`packages/lib/constants.ts:190-192`:

```ts
export const WEBSITE_PRIVACY_POLICY_URL =
  process.env.NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL || "https://cal.com/privacy";
export const WEBSITE_TERMS_URL = process.env.NEXT_PUBLIC_WEBSITE_TERMS_URL || "https://cal.com/terms";
```

`.github/actions/docker-build-and-test/action.yml:124-130` — the complete build-arg list used
by `release-docker`:

```
NEXT_PUBLIC_WEBAPP_URL=http://localhost:3000
NEXT_PUBLIC_API_V2_URL=http://localhost:5555/api/v2
NEXT_PUBLIC_LICENSE_CONSENT=agree
NEXT_PUBLIC_APP_NAME=cal.forte
DATABASE_URL=…
DATABASE_DIRECT_URL=…
```

`NEXT_PUBLIC_WEBSITE_TERMS_URL` and `NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL` are **not passed**,
even though `Dockerfile:7-8,29-30` accepts them as `ARG`/`ENV`.

**Therefore, in `ghcr.io/rubennati/cal.diy:v6.2.0-5` the generated hrefs are:**

| Link | href |
| --- | --- |
| Terms | `https://cal.com/terms` |
| Privacy Policy | `https://cal.com/privacy` |

and the surrounding sentence reads **"By proceeding, you agree to cal.forte's Terms and Privacy
Policy."** The copy names one product; the links point at another company's legal terms. On the
public booking page this is shown to people who have no relationship with either.

### 5.3 Why runtime env cannot fix it

Next.js replaces `process.env.NEXT_PUBLIC_*` at **build** time via the bundler, in both server
and client output. The image's only runtime substitution is `scripts/start.sh`:

```sh
scripts/replace-placeholder.sh "$BUILT_NEXT_PUBLIC_WEBAPP_URL" "$NEXT_PUBLIC_WEBAPP_URL"
```

and `scripts/replace-placeholder.sh` is a `sed -i` over files matching a literal string in
`apps/web/.next/` and `apps/web/public/`. It substitutes exactly one value: the webapp URL.

So: **setting `NEXT_PUBLIC_WEBSITE_TERMS_URL` in a deployment `.env` has no effect on a
prebuilt image.** The value is only consulted where the code path is evaluated at runtime in
Node, which for these two constants it is not, because `constants.ts` is bundled. This
correction applies to [.ai/env-reference.md](../.ai/env-reference.md), which lists them under
"🟡 Branding" without the build-time caveat, and to
[config/cal.forte.env.example](../config/cal.forte.env.example), which does not mention them at all.

**[VERIFY]** by grepping a pulled image: `grep -rl "cal.com/terms" /calcom/apps/web/.next` should
match. This audit did not pull an image.

### 5.4 Option analysis (assessed, **not implemented**)

#### Option A — Bake generic `cal.forte` URLs into the public image

Pass `NEXT_PUBLIC_WEBSITE_TERMS_URL` / `_PRIVACY_POLICY_URL` as build args in `release-docker`
pointing at fork-owned public pages.

| Dimension | Assessment |
| --- | --- |
| Security | neutral |
| Privacy | improved — no third-party legal-page fetch from the booking flow |
| Usability | poor for the operator: generic fork terms do not describe *their* data processing, which is what a booker actually needs |
| Immutable image | fully compatible |
| `secure-docker-blueprint` | no override possible without rebuild |
| Maintenance | the fork must author and host real legal pages — an ongoing, non-code obligation |
| Fallback risk | **eliminated** |

**Verdict:** removes the wrong-attribution problem but replaces it with a different wrong
attribution. Not recommended alone.

#### Option B — Require legal URLs as private build parameters

Operators build their own image with their own URLs.

| Dimension | Assessment |
| --- | --- |
| Security | neutral |
| Privacy | best — operator's own pages |
| Usability | poor: forces every operator to build, defeating the point of a published reviewed image |
| Immutable image | incompatible with a single shared artifact |
| `secure-docker-blueprint` | contradicts the digest-pinning model in [CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md) |
| Maintenance | high, and duplicated per operator |
| Fallback risk | high — an operator who forgets a build arg silently ships `cal.com/terms` |

**Verdict:** conflicts with the fork's own release model.

#### Option C — Extend the existing runtime placeholder substitution

Bake sentinels (e.g. `http://NEXT_PUBLIC_WEBSITE_TERMS_URL_PLACEHOLDER`) at build time and have
`start.sh` call `replace-placeholder.sh` twice more.

| Dimension | Assessment |
| --- | --- |
| Security | needs care — the substituted value lands in HTML `href` attributes, so it must be validated as an absolute `http(s)` URL. `replace-placeholder.sh` is an unvalidated `sed -i` today |
| Privacy | best available for a shared image — each deployment serves its own URLs |
| Usability | best: one published image, per-deployment configuration |
| Immutable image | **compatible by design** — this is exactly what the mechanism already does for `NEXT_PUBLIC_WEBAPP_URL` |
| `secure-docker-blueprint` | ideal: plain runtime env on a pinned digest |
| Maintenance | medium — the sentinel must survive upstream syncs of `constants.ts`, and boot time grows with each `sed` pass over `.next` |
| Fallback risk | needs an explicit unset behaviour: fail closed, fall back to Option D's relative routes, or leave the sentinel visible (never acceptable) |

**Verdict:** the strongest fit for this fork's stated architecture. It reuses a mechanism
already trusted for the webapp URL and preserves the "one reviewed digest, many deployments"
model. Its cost is real but bounded, and it is the only option that is simultaneously
immutable-image-compatible and operator-accurate.

#### Option D — Local relative routes `/terms` and `/privacy`

Point the constants at in-app routes; the deployment supplies content.

| Dimension | Assessment |
| --- | --- |
| Security | neutral–good — same-origin, no external navigation from the booking flow |
| Privacy | best — no third-party request at all |
| Usability | good, provided the routes actually render something; a 404 behind "Terms" is worse than a wrong link |
| Immutable image | compatible, but the *content* still has to come from somewhere (volume mount, DB, or a build-time page) |
| `secure-docker-blueprint` | good — content can be volume-mounted the same way logos already are ([.ai/hardening-checklist.md](../.ai/hardening-checklist.md) §9) |
| Maintenance | low in code, but adds two new fork-owned routes that upstream does not have |
| Fallback risk | **the sharpest failure mode**: if content is not supplied, the links 404 |

**Verdict:** attractive and simple, and it composes well with Option C — relative routes as the
*default*, runtime substitution as the *override*.

#### Comparison

| | A bake generic | B private build | C runtime substitution | D local routes |
| --- | --- | --- | --- | --- |
| Immutable-image compatible | ✅ | ❌ | ✅ | ✅ |
| Operator-accurate content | ❌ | ✅ | ✅ | ✅ |
| Blueprint-friendly | ⚠️ | ❌ | ✅ | ✅ |
| No third-party request | ✅ | ✅ | depends on the value | ✅ |
| Silent-wrong-value risk | none | **high** | low, with a defined unset behaviour | none (fails loudly as 404) |
| Code change size | tiny | tiny | small–medium | small |
| New fork-owned surface | legal pages | none | 2 sentinels + `start.sh` | 2 routes |

**Nothing here is implemented.** If this is pursued, the combination worth evaluating first is
**D as the default with C as the override**: the shipped image never points at `cal.com`, an
operator who does nothing gets a same-origin page they control, and an operator who has real
hosted legal pages can point at them with plain runtime env.

## 6. Inventory Of Hard-Coded Cal.com References

Classification: `KEEP_UPSTREAM_REFERENCE` (genuinely refers to upstream and should),
`REPLACE_WITH_CAL_FORTE_DEFAULT`, `MAKE_CONFIGURABLE`, `REMOVE`, `UNKNOWN`.

### 6.1 `packages/lib/constants.ts` — the highest-leverage file

| Line | Constant | Value | Class | Rationale |
| --- | --- | --- | --- | --- |
| 37 | `WEBSITE_URL` | `https://cal.com` | `MAKE_CONFIGURABLE` | already env-driven; default is upstream's marketing site |
| 39 | `SUPPORT_MAIL_ADDRESS` | `help@cal.com` | `REPLACE_WITH_CAL_FORTE_DEFAULT` | a self-host must not direct users to Cal.com support. `Dockerfile:24` already has the ARG; `release-docker` does not pass it |
| 40 | `COMPANY_NAME` | `Cal.com, Inc.` | `REPLACE_WITH_CAL_FORTE_DEFAULT` | appears in user-facing copy; distinct from the `LICENSE` copyright line, which **must stay** |
| 41-42 | `SENDER_ID` / `SENDER_NAME` | `Cal` / `Cal.diy` | `MAKE_CONFIGURABLE` | SMS sender identity |
| 111 | `ROADMAP` | `https://cal.com/roadmap` | `REMOVE` | upstream's roadmap is not this fork's |
| 112 | `DESKTOP_APP_LINK` | `https://cal.com/download` | `KEEP_UPSTREAM_REFERENCE` | the desktop app really is Cal.com's |
| 113 | `JOIN_COMMUNITY` | `github.com/calcom/cal.diy/discussions` | `KEEP_UPSTREAM_REFERENCE` | accurate; upstream deferred removing it (ledger `c0b13fb120`) |
| 114 | `POWERED_BY_URL` | `https://go.cal.com/booking` | `UNKNOWN` | **no consumer found** in this tree — likely `REMOVE` after confirming |
| 115-116 | `DOCS_URL`, `DEVELOPER_DOCS` | `cal.com/docs`, `developer.cal.com` | `KEEP_UPSTREAM_REFERENCE` | the docs describe this codebase |
| 189 | `CALCOM_PRIVATE_API_ROUTE` | `https://goblin.cal.com` | `REMOVE` | consumed by `viewer.admin.createSelfHostedLicense` and `viewer.admin.createCoupon` (§2.1). Both fail closed without `CAL_SIGNATURE_TOKEN`, so the default is latent rather than live egress — but a hosted-Cal internal endpoint baked in as a default is exactly what this fork removes elsewhere |
| 190-192 | `WEBSITE_PRIVACY_POLICY_URL`, `WEBSITE_TERMS_URL` | `cal.com/privacy`, `cal.com/terms` | `MAKE_CONFIGURABLE` | §5 |
| 201-215 | transcription/recording icons | `https://app.cal.com/*.svg` | `REPLACE_WITH_CAL_FORTE_DEFAULT` | only used when `IS_PRODUCTION` is false, so dev-only; still an external fetch |
| 62-68 | `CONSOLE_URL` | `console.cal.com` / `console.cal.dev` | `REMOVE` | hosted-only console |

### 6.2 `https://app.cal.com` fallbacks

Fourteen sites use `process.env.NEXT_PUBLIC_WEBAPP_URL || "https://app.cal.com"`:
`packages/features/CalendarEventBuilder.ts:28`, `bookings/lib/handleCancelBooking.ts:223`,
`bookings/lib/payment/getBooking.ts:19`, `bookings/lib/service/RegularBookingService.ts:1324`,
`eventtypes/lib/getEventTypeById.ts:24`, `getEventTypesByViewer.ts:25,27`,
`getPublicEvent.ts:42`, `trpc/.../eventTypes/utils/transformUtils.ts:8,10`,
`platform/libraries/organizations.ts:6`, `apps/web/next.config.ts:520`,
`apps/web/modules/auth/verify-view.tsx:22`, `packages/app-store/stripepayment/api/paymentCallback.ts:125`.

**Class: `REPLACE_WITH_CAL_FORTE_DEFAULT`** — but low priority. `NEXT_PUBLIC_WEBAPP_URL` is
always set in a real deployment (it is the one runtime-substituted variable), so the fallback is
unreachable in practice. It is a latent correctness bug, not an active leak. The safer
correction is to fail loudly on an unset webapp URL rather than to swap in a different literal.

### 6.3 Direct user-facing links

| Location | Link | Class |
| --- | --- | --- |
| `apps/web/modules/bookings/views/bookings-single-view.tsx:1041,1051` | `cal.com/signup` (+ email) | **`REMOVE`** — §4 |
| `apps/web/modules/upgrade/upgrade-view.tsx:47` | `mailto:support@cal.com` | `REPLACE_WITH_CAL_FORTE_DEFAULT` (or remove with the page) |
| `packages/trpc/server/routers/loggedInViewer/addNotificationsSubscription.handler.ts:68` | `url: "https://app.cal.com/"` in a push notification | `REPLACE_WITH_CAL_FORTE_DEFAULT` — upstream already fixed this; ledger `bb7c87cae1` is a `candidate` |
| `apps/web/modules/shell/Kbar.tsx:428` | `cal.com/help/welcome?search=…` | `KEEP_UPSTREAM_REFERENCE` — it sends the query string to cal.com, so **[VERIFY]** privacy expectations |
| ~20 `cal.com/help/*` deep links in `EventAdvancedTab.tsx`, `EventLimitsTab.tsx`, `FormBuilder.tsx`, `RecurringEventController.tsx`, `RequiresConfirmationController.tsx`, `DisableReschedulingController.tsx`, `BlockedEntriesTable.tsx`, `Embed.tsx` | feature help pages | `KEEP_UPSTREAM_REFERENCE` — they document features this fork actually ships; replacing them means writing ~20 help pages |
| `apps/web/modules/webhooks/components/WebhookListItem.tsx:141`, `packages/features/webhooks/lib/constants.ts:35,43` | webhook version docs | `KEEP_UPSTREAM_REFERENCE` |
| `apps/web/modules/api-keys/.../ApiKeyDialogForm.tsx:166` | `cal.com/integrate` | `KEEP_UPSTREAM_REFERENCE` |
| `packages/emails/src/templates/DailyVideoDownloadRecordingEmail.tsx:92` | `cal.com/docs/enterprise-features/teams/cal-video-recordings` | `REMOVE` — links to *enterprise* docs for a feature this edition lacks |
| `packages/app-store/basecamp3/lib/CalendarService.ts:93` | writes `https://app.cal.com/booking/{uid}` into third-party calendar entries | **`REPLACE_WITH_CAL_FORTE_DEFAULT`** — this puts a wrong, externally visible link into a customer's Basecamp |
| `packages/app-store/intercom/api/get.ts:81` | `https://app.cal.com/embed/embed.js` | `MAKE_CONFIGURABLE` — loads a script from a third party |
| `apps/web/lib/csp.ts:28` | `child-src app.cal.com;` | `UNKNOWN` — a CSP allowance for a host this fork does not use; **[VERIFY]** whether tightening breaks embeds |
| `packages/embeds/embed-core/src/embed.ts:344-347` | rewrites a configured origin of `https://cal.com` to `https://app.cal.com` (comment: *"cal.com has rewrite issues on Safari"*) | `KEEP_UPSTREAM_REFERENCE` — a workaround for upstream's own hosts; harmless for a self-host origin |
| `packages/platform/atoms/**` (3 sites) | `https://app.cal.com${logo}` | `KEEP_UPSTREAM_REFERENCE` — platform atoms target the hosted product |

### 6.4 Branding levers already available

From [.ai/branding.md](../.ai/branding.md), re-verified:

| Lever | Build/runtime | Passed by `release-docker`? |
| --- | --- | --- |
| `NEXT_PUBLIC_APP_NAME` | build | ✅ `cal.forte` |
| `NEXT_PUBLIC_COMPANY_NAME` | build | ❌ ARG exists (`Dockerfile:23`), not passed → `Cal.com, Inc.` |
| `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS` | build | ❌ ARG exists (`Dockerfile:24`), not passed → `help@cal.com` |
| `NEXT_PUBLIC_WEBSITE_TERMS_URL` / `_PRIVACY_POLICY_URL` | build | ❌ ARG exists (`Dockerfile:7-8`), not passed → `cal.com/*` |
| `NEXT_PUBLIC_WEBAPP_URL` | **runtime** | ✅ via placeholder substitution |
| `EMAIL_FROM_NAME` | runtime | n/a — server-side |
| Logos / favicons | files | volume-mountable per file |

Three of the four accepted branding ARGs are wired end to end in the `Dockerfile` and then not
supplied by the release workflow. That is a **one-line-per-variable** gap, and it is why the
published image still says `Cal.com, Inc.` and `help@cal.com`.

This qualifies a claim in [FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md) → *`cal.forte` image branding*,
which states the fork name is baked "through explicit build arguments" (`4264193f84`, `v6.2.0-3`).
That is true for `NEXT_PUBLIC_APP_NAME` **only**; the register row should be qualified either way.

### 6.5 Hard-coded Cal.com support addresses

A separate inventory from the URL list above, because the consumers differ.

| Location | Context | Class |
| --- | --- | --- |
| `packages/lib/constants.ts:39` | `SUPPORT_MAIL_ADDRESS` default `help@cal.com` | `REPLACE_WITH_CAL_FORTE_DEFAULT` |
| `apps/web/components/error/error-page.tsx:92` | **`mailto:support@cal.com` on the generic error page** — user-facing and reachable | `REPLACE_WITH_CAL_FORTE_DEFAULT` |
| `apps/web/modules/upgrade/upgrade-view.tsx:50` | "Contact support" on the live `/upgrade` route | `REMOVE` with the page |
| `packages/features/notifications/sendNotification.ts:15` | `webpush.setVapidDetails("mailto:support@cal.com", …)` — the address push providers contact about this deployment's subscriptions | `REPLACE_WITH_CAL_FORTE_DEFAULT` |
| `packages/emails/src/templates/{TeamInviteEmail,OrgAutoInviteEmail,OrganizationCreationEmail}.tsx` | invite emails | `REMOVE` — unreachable in this edition (no invite path) |
| ~20 × `packages/app-store/*/_metadata.ts` `email: "help@cal.com"` | app-store publisher metadata, surfaced in the app-store UI | `KEEP_UPSTREAM_REFERENCE` — it genuinely is upstream's app |
| `packages/app-store/stripepayment/**` (3 sites) | premium-username / team-billing support text | `DEAD_RESIDUE` — hosted-only paths |
| `packages/types/environment.d.ts:64`, `apps/web/modules/apps/components/_storybookData.ts` | type default and storybook fixture | `KEEP_UPSTREAM_REFERENCE` |

### 6.6 A correction to a correction — the "Cal.com literal" count

An earlier intake pass recorded that [.ai/branding.md](../.ai/branding.md)'s claim of *"~52 files still
hard-code the string Cal.com"* was stale, and that the literal "now appears in **3** files, all
`package.json` author fields". **That correction is itself wrong, twice**, and must not be propagated:

- A `.ts`/`.tsx`-only search does return 3 files — but they are `apps/docs/app/layout.tsx`,
  `packages/types/environment.d.ts` and `packages/lib/constants.ts`. **None is a `package.json` author field.**
- Across `apps/` + `packages/` the literal `Cal.com` appears in **47** files: 44 `.json` (mostly
  app-store `config.json` publisher/description fields), 2 `.ts`, 1 `.tsx` — plus 5 `LICENSE` files
  where it is the **required copyright notice and must stay**
  ([LICENSE_AND_PROVENANCE_REVIEW.md](LICENSE_AND_PROVENANCE_REVIEW.md) §1).

`.ai/branding.md`'s original figure is materially accurate. The actionable subset is small; the bulk is
app-store metadata that legitimately names upstream's apps.

## 7. Where The Deployed Image May Differ From `develop`

The EUR-15 observation came from a running deployment; this audit read source. Sources of drift,
and what would settle each.

| Possible cause | Assessment | Evidence that would settle it |
| --- | --- | --- |
| **Older source revision** | plausible | compare the image's `org.opencontainers.image.revision` label against `41689d1d6e` |
| **Older container image** | plausible | `docker inspect` the running container's image digest; compare with the digests in [FORK_STATUS.md](../FORK_STATUS.md) |
| **Stale deployment** | plausible | `docker-compose.yml:39` still defaults to `ghcr.io/rubennati/cal.diy:v6.2.0-4` while the current release is `v6.2.0-5` — a deployment that did not set `CALDIY_IMAGE` is a build behind |
| **Non-primary route** | **ruled out** | `/onboarding/getting-started` is the primary post-signup destination via `apps/web/app/page.tsx` |
| **Upstream Cal.com flow still reachable** | **confirmed as the cause** | the `$15` badge and the `onboarding-v3` migration are both present on `origin/main`, i.e. upstream, and are inherited unchanged |
| **Database state** | relevant | `onboarding-v3` is a `Feature` row; someone may have toggled it either way in `/settings/admin/flags` |
| **Locale** | relevant | German renders `15 $/Benutzer/Monat` |
| **Another cause** | possible | not excluded by static reading |

**Conclusion:** the finding does **not** require an older image to explain. Current `develop`
reproduces it. The other drift vectors above should still be checked, because they determine
whether *other* observations from that deployment are attributable to this tree.

### Evidence to capture for exact version identification

Nothing here changes state; all are read-only.

```bash
docker inspect --format '{{index .Config.Labels "org.opencontainers.image.revision"}}' <image>
docker inspect --format '{{index .Config.Labels "org.opencontainers.image.version"}}' <image>
docker image inspect --format '{{index .RepoDigests 0}}' <image>
```

```bash
# does the built bundle contain the price string and the upsell?
docker run --rm --entrypoint sh <image> -c "grep -rl '15/user/mo' /calcom/apps/web/.next | head"
docker run --rm --entrypoint sh <image> -c "grep -rl 'cal.com/signup' /calcom/apps/web/.next | head"
docker run --rm --entrypoint sh <image> -c "grep -rl 'cal.com/terms'  /calcom/apps/web/.next | head"
# is the MIT notice present? (see LICENSE_AND_PROVENANCE_REVIEW.md §6)
docker run --rm --entrypoint sh <image> -c "ls -la /calcom/LICENSE"
```

```sql
-- is the onboarding flag on in this deployment?
SELECT slug, enabled, "updatedAt" FROM "Feature" WHERE slug IN ('onboarding-v3','disable-signup');
-- do teams exist? (decides every finding in PBAC_PLACEHOLDER_AUDIT.md §6)
SELECT count(*) FROM "Team";
SELECT count(*) FROM "Membership";
```

Record the results in [.ai/sync-log.md](../.ai/sync-log.md) alongside the release record, so
future observations can be attributed to a known source state.

## 8. Open Questions

1. **[VERIFY]** Does the published `v6.2.0-5` bundle contain `15/user/mo`, `cal.com/signup` and
   `cal.com/terms`? Static reading says yes; confirm against the image.
2. **[VERIFY]** Is `onboarding-v3` enabled in the existing deployment's `Feature` table, or was
   it toggled?
3. **Answered:** `CALCOM_PRIVATE_API_ROUTE` is consumed by the two admin licence mutations
   (§2.1). Remaining question: is there any reason to keep them mounted in a fork that will
   never buy a Cal.com licence?
4. **[VERIFY]** Is `POWERED_BY_URL` consumed anywhere? No consumer was found.
5. Does tightening `apps/web/lib/csp.ts:28` (`child-src app.cal.com`) break the embed?
6. Should `Kbar.tsx:428`, which sends the user's search query to `cal.com/help`, be gated or
   removed on a privacy-first self-host?
7. If Option C is pursued, what is the correct behaviour when the substitution value is unset —
   fail the boot, fall back to relative routes, or fall back to the current constant?
8. Who authors the legal content under Option D, and does the fork or the operator own it?
   **[LEGAL]**
