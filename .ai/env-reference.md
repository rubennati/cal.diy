# Environment Variable Reference (read-only)

Every relevant variable from `.env.example` — meaning, format, priority, and a hardening
recommendation. Built for a **single-user / small, security-first self-host**. Reference
for decisions; nothing here changes behaviour.

**Build-time vs runtime:** `NEXT_PUBLIC_*` are baked into the image **at build** (change =
rebuild with build-args); everything else is **runtime** env. See [branding.md](branding.md) §1.

Priority legend: 🔴 required · 🟠 security/hardening · 🟡 branding · 🔵 integration (only if used)
· ⚪ optional / dev / hosted-only (leave empty).

---

## 🔐 Top security actions (do these first)

1. **Generate strong secrets and inject them via Docker secrets** (never bake into the image):
   `NEXTAUTH_SECRET` (`openssl rand -base64 32`), `CALENDSO_ENCRYPTION_KEY` (32 chars,
   `openssl rand -base64 24`), `DATABASE_URL` (contains the DB password),
   `EMAIL_SERVER_PASSWORD` (the SMTP secret — *the class of key that leaked before*).
2. **Override `CRON_API_KEY`** — `.env.example` ships a **public default**
   (`0cc0e6c35519bba620c9360cfe3e68d0`). If left as-is, anyone can call cron endpoints.
   Set a random value.
3. **Kill ad tracking** (default ON): `GOOGLE_ADS_ENABLED=0`, `LINKEDIN_ADS_ENABLED=0`.
   Usage telemetry needs no flag — the module is removed from this fork
   (hardening-checklist.md §3).
4. **Lock down**: `NEXT_PUBLIC_DISABLE_SIGNUP=true` (build), `ALLOWED_HOSTNAMES` = your
   domain only, `CSP_POLICY=non-strict`, `NEXTAUTH_COOKIE_DOMAIN` = your domain.
5. **Leave every unused integration empty** — an empty key = the app stays disabled and makes
   no outbound calls (smaller attack surface).
6. Optional anti-bot: Cloudflare **Turnstile** on the booker/signup (`NEXT_PUBLIC_CLOUDFLARE_SITEKEY`
   + `CLOUDFLARE_TURNSTILE_SECRET`).

---

## 🔴 Required core

| Variable | Meaning | Format / Recommendation |
|----------|---------|-------------------------|
| `DATABASE_URL` | Postgres connection (with password) | `postgresql://user:pass@host:5432/db` — **secret** |
| `DATABASE_DIRECT_URL` | Direct DB conn for migrations (pooler bypass) | same as `DATABASE_URL` if no pooler |
| `NEXT_PUBLIC_WEBAPP_URL` | Public app URL | `https://your-domain` — **runtime-replaceable** (only NEXT_PUBLIC that is) |
| `NEXTAUTH_URL` | NextAuth base URL | = `NEXT_PUBLIC_WEBAPP_URL` |
| `NEXTAUTH_SECRET` | Session/JWT signing key | `openssl rand -base64 32` — **secret, required** |
| `CALENDSO_ENCRYPTION_KEY` | AES-256 key that **encrypts stored app credentials** in the DB | 32 chars, `openssl rand -base64 24` — **secret, required** (protects OAuth/SMTP keys at rest) |
| `TZ` | Process timezone | `UTC` (keep) |

## 🟠 Security & hardening

| Variable | Meaning | Recommendation |
|----------|---------|----------------|
| `CRON_API_KEY` | Auth for cron endpoints | ⚠️ **override the shipped default** with a random value |
| `NEXT_PUBLIC_DISABLE_SIGNUP` | Disable public registration | `true` for private instance (build-time) |
| `ALLOWED_HOSTNAMES` | Accepted Host headers | `'"your-domain"'` — anti host-header injection |
| `CSP_POLICY` | Content-Security-Policy | `non-strict` (only value supported) |
| `NEXTAUTH_COOKIE_DOMAIN` | Auth cookie scope | your domain |
| `GOOGLE_ADS_ENABLED` / `LINKEDIN_ADS_ENABLED` | Ad-click tracking (**default `1`**) | `0` (disable — no external tracking) |
| `BLACKLISTED_GUEST_EMAILS` | Block emails from being booking guests | optional allow/deny hardening |
| ~~`CALCOM_TELEMETRY_DISABLED`~~ | **Removed in this fork** — the telemetry module it gated is gone; the flag was a no-op | do not set / do not re-add |
| `UNKEY_ROOT_KEY` | Rate-limiting via Unkey | optional; set to enable throttling |
| `NEXT_PUBLIC_CLOUDFLARE_SITEKEY` / `CLOUDFLARE_TURNSTILE_SECRET` | Turnstile CAPTCHA | optional anti-bot on booker/signup |
| `NEXT_PUBLIC_CLOUDFLARE_USE_TURNSTILE_IN_BOOKER` | Enable Turnstile in booker | `1` if using Turnstile |
| `NEXT_PUBLIC_VERCEL_USE_BOTID_IN_BOOKER` | Vercel BotID in booker | Vercel-only; leave empty |
| `TWILIO_OPT_OUT_ENABLED` | SMS opt-out handling | only with Twilio |
| `PGSSLMODE` | Postgres TLS mode | set per your DB TLS setup |

### Encryption secrets (generate + inject; only if the feature is used)
| Variable | Protects |
|----------|----------|
| `CALCOM_SERVICE_ACCOUNT_ENCRYPTION_KEY` | service-account keys (`openssl rand -base64 24`) |
| `CALCOM_APP_CREDENTIAL_ENCRYPTION_KEY` | app credential-sync (24 bytes) — only with credential sync |
| `CALCOM_CREDENTIAL_SYNC_SECRET` / `_HEADER_NAME` / `_ENDPOINT` | credential-sync webhook — only for that feature |
| `CAL_VIDEO_RECORDING_TOKEN_SECRET` | Daily video recording tokens (`openssl rand -base64 32`) |
| `GOOGLE_WEBHOOK_TOKEN` / `MICROSOFT_WEBHOOK_TOKEN` | verifies inbound calendar webhooks — set if using Google/MS calendar |

## 🟡 Branding (build-time — see branding.md)

| Variable | Meaning |
|----------|---------|
| `NEXT_PUBLIC_APP_NAME` | App name (default "Cal.diy") |
| `NEXT_PUBLIC_COMPANY_NAME` | Company/footer name |
| `NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS` | Support email shown in UI |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | From header + display name (runtime) |
| `NEXT_PUBLIC_SENDER_ID` | SMS sender id (≤11 chars, letters/numbers/spaces) |
| `NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL` / `_TERMS_URL` | your legal URLs |
| `NEXT_PUBLIC_HEAD_SCRIPTS` / `NEXT_PUBLIC_BODY_SCRIPTS` | inject custom scripts (⚠️ XSS risk — leave empty unless needed) |

## 📧 Email / SMTP (required for notifications)

| Variable | Meaning | Recommendation |
|----------|---------|----------------|
| `EMAIL_SERVER_HOST` / `_PORT` | SMTP server | your provider (e.g. `smtp.…:587`) |
| `EMAIL_SERVER_USER` | SMTP user | your mailbox |
| `EMAIL_SERVER_PASSWORD` | SMTP password | **secret — inject via Docker secret** (this is the leak class) |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | From address / name | your domain sender |
| `SEND_FEEDBACK_EMAIL` | inbox for user feedback | optional |
| `RESEND_API_KEY` | Resend transactional email (alt to SMTP) | optional |
| `SENDGRID_API_KEY` / `SENDGRID_EMAIL` / `SENDGRID_SYNC_API_KEY` / `NEXT_PUBLIC_SENDGRID_SENDER_NAME` | SendGrid (workflow emails / sync) | optional; workflows are absent (CE) → usually unneeded |
| `AWAITING_PAYMENT_EMAIL_DELAY_MINUTES` | payment-reminder delay | only with payments |

## 🔵 Integrations — set only what you use (else leave empty → app stays disabled)

**Google (calendar / meet / login):** `GOOGLE_API_CREDENTIALS` (JSON), `GOOGLE_LOGIN_ENABLED`,
`GOOGLE_CALENDAR_API_KEY` (holidays), `GOOGLE_WEBHOOK_TOKEN`/`_URL`. Self-host tip: configure the
Google app as **Internal** so only your org can log in.
**Microsoft/Office365:** `OUTLOOK_LOGIN_ENABLED`, `MICROSOFT_WEBHOOK_TOKEN`/`_URL` (+ MS_GRAPH_* in seed).
**Video:** Daily (`CAL_VIDEO_*` incl. S3 bucket for recordings), `HUDDLE01_API_TOKEN`, Zoom (seed).
**Payments (Stripe):** `STRIPE_PRIVATE_KEY`, `STRIPE_CLIENT_ID`, `STRIPE_WEBHOOK_SECRET`(+`_APPS`/`_BILLING`),
and many `STRIPE_*_PRICE_ID` / plan/credits/org vars — **hosted-billing plumbing; leave empty for a
self-host that doesn't sell seats.**
**CRM:** `CLOSECOM_CLIENT_ID/_SECRET`, `SALESFORCE_GRAPHQL_*` — only with those CRMs.
**SMS:** `TWILIO_VERIFY_SID`, `TWILIO_OPT_OUT_ENABLED`, `DUB_*` (SMS link shortener), `SINK_*`.
**AI (Cal.ai voice):** `RETELL_AI_KEY` + `RETELL_AI_TEST_*`, `CAL_AI_CALL_RATE_PER_MINUTE`,
`STRIPE_PHONE_NUMBER_MONTHLY_PRICE_ID`, `NEXT_PUBLIC_CAL_AI_PHONE_NUMBER_MONTHLY_PRICE` — leave empty.
**Push notifications:** `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY`
(`npx web-push generate-vapid-keys`) — optional.
**Avatar prefill:** `AVATARAPI_USERNAME`/`_PASSWORD` — optional.
**Localization:** `LINGO_DOT_DEV_API_KEY` — optional.
**Content moderation:** `IFFY_API_KEY` — optional.

## 📊 Analytics / support widgets — leave EMPTY for a private/hardened instance

Each loads a **third-party script / sends data out**. Empty = off.
`NEXT_PUBLIC_POSTHOG_KEY`/`_HOST`, `NEXT_PUBLIC_INTERCOM_APP_ID`/`INTERCOM_SECRET`/`INTERCOM_API_TOKEN`,
`NEXT_PUBLIC_ZENDESK_KEY`, `NEXT_PUBLIC_HELPSCOUT_KEY`, `NEXT_PUBLIC_FRESHCHAT_TOKEN`/`_HOST`,
`NEXT_PUBLIC_FORMBRICKS_*`, all `SENTRY_*` / `NEXT_PUBLIC_SENTRY_DSN*` (error tracking — enable only
if you run your own Sentry).

## ⚪ Organizations / Vercel / DNS — leave empty (single-user)

`ORGANIZATIONS_ENABLED`, `ORGANIZATIONS_AUTOLINK`, `NEXT_PUBLIC_ORGANIZATIONS_*`,
`NEXT_PUBLIC_SINGLE_ORG_SLUG`, `PROJECT_ID_VERCEL`/`TEAM_ID_VERCEL`/`AUTH_BEARER_TOKEN_VERCEL`,
`CLOUDFLARE_DNS`/`_ZONE_ID`/`AUTH_BEARER_TOKEN_CLOUDFLARE` — org/multi-tenant + Vercel/Cloudflare
subdomain automation; not needed self-hosted single-user. `SAML_DATABASE_URL`/`SAML_ADMINS` — SAML is
EE/absent. `NEXT_PUBLIC_HOSTED_CAL_FEATURES` — keep empty (auto-off when self-hosted).

## ⚪ Advanced / tuning (sensible defaults exist)

Booking/availability tuning: `NEXT_PUBLIC_MINUTES_TO_BOOK`, `NEXT_PUBLIC_BOOKER_NUMBER_OF_DAYS_TO_LOAD`,
`NEXT_PUBLIC_AVAILABILITY_SCHEDULE_INTERVAL`, `NEXT_PUBLIC_QUERY_*` (reservation/slots intervals — keep
slot-interval high to limit load), `NEXT_PUBLIC_INVALIDATE_AVAILABLE_SLOTS_ON_BOOKING_FORM`,
`NEXT_PUBLIC_QUICK_AVAILABILITY_ROLLOUT`. Misc: `NEXT_PUBLIC_LOGGER_LEVEL` (0–6; `3`=info),
`DATABASE_CHUNK_SIZE`, `INSIGHTS_DATABASE_URL` (Insights absent → empty), `API_KEY_PREFIX` (`cal_`),
`NEXT_PUBLIC_API_V2_URL`, `EDGE_CONFIG` (Vercel-only), Tasker: `ENABLE_ASYNC_TASKER`(false),
`TRIGGER_*`, `TASKER_ENABLE_WEBHOOKS`/`_EMAILS` (0), `CRON_ENABLE_APP_SYNC` (false),
`ORGANIZER_EMAIL_EXEMPT_DOMAINS`, `DIRECTORY_IDS_TO_LOG` (SCIM debug), `SALESFORCE_GRAPHQL_*`.

## ⚪ Dev / E2E / CI only (never set in production)

`NEXT_PUBLIC_IS_E2E`, `E2E_TEST_*` (Apple/QA/GCal creds, MailHog), `E2E_TEST_MAILHOG_ENABLED`,
`SEED_PLATFORM_OAUTH_*`, `SEED_OAUTH2_*`, `CAL_VIDEO_MEETING_LINK_FOR_TESTING`,
`RETELL_AI_TEST_*`, `LOCAL_TESTING_DOMAIN_VERCEL`.

---

## Notes for future syncs
- Re-check this list on each upstream sync — new vars appear and defaults change (e.g. the
  ad-tracking defaults). Tie into the sync triage in FORK_STRATEGY.
- Anything named `*_SECRET`, `*_KEY`, `*_PASSWORD`, `*_TOKEN`, or `DATABASE_URL` is a secret →
  Docker-secret injection, never in the image or git.
