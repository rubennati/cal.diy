# Hardening Checklist — how to apply the Top Security Actions

Where and how to set each lever for a self-host. **build** = Docker build-arg (baked in,
rebuild to change) · **runtime** = env in the deployment · **secret** = generate + inject as
a Docker secret (never in the image or git). Full catalog: [env-reference.md](env-reference.md).
These are applied in `secure-docker-blueprint` (deployment), not in the fork.

## 1. Secrets — generate once, inject as Docker secrets

```bash
openssl rand -base64 32   # NEXTAUTH_SECRET, CAL_VIDEO_RECORDING_TOKEN_SECRET
openssl rand -base64 24   # CALENDSO_ENCRYPTION_KEY (32-char AES-256) and other *_ENCRYPTION_KEY
```

| Secret | Why |
|--------|-----|
| `NEXTAUTH_SECRET` | signs auth sessions |
| `CALENDSO_ENCRYPTION_KEY` | **encrypts stored app credentials at rest** (the SMTP/OAuth keys) |
| `DATABASE_URL` | contains the DB password |
| `EMAIL_SERVER_PASSWORD` | SMTP password — the leak class |

Never in the image / compose / git. Rotate if exposed.

## 2. Override the shipped cron default ⚠️
`CRON_API_KEY` ships as `0cc0e6c3…` in `.env.example`. Set your own (runtime):
```
CRON_API_KEY=<openssl rand -hex 16>
```

## 3. Kill telemetry / ad tracking (default ON) — runtime
```
CALCOM_TELEMETRY_DISABLED=1
GOOGLE_ADS_ENABLED=0
LINKEDIN_ADS_ENABLED=0
```

## 4. Lock down access
| Lever | Value | Where |
|-------|-------|-------|
| Disable signup | **DB feature flag `disable-signup`** | **runtime** — admin UI `/settings/admin/flags`, no rebuild (preferred) |
| `NEXT_PUBLIC_DISABLE_SIGNUP` | `true` | build-baked; the DB flag above is the runtime-capable path |
| `ALLOWED_HOSTNAMES` | `'"your-domain"'` | runtime |
| `CSP_POLICY` | `non-strict` | build (already a Dockerfile ARG) |
| `NEXTAUTH_COOKIE_DOMAIN` | `your-domain` | runtime |

## 5. Optional anti-bot (Cloudflare Turnstile)
`NEXT_PUBLIC_CLOUDFLARE_SITEKEY` (build), `CLOUDFLARE_TURNSTILE_SECRET` (runtime secret),
`NEXT_PUBLIC_CLOUDFLARE_USE_TURNSTILE_IN_BOOKER=1`.

## 6. Keep unused integrations empty
Every empty key = that app stays disabled and makes no outbound calls. Set only the
calendar/video credentials you actually use (architecture.md §3, env-reference.md 🔵).

> Reminder: `NEXT_PUBLIC_*` levers are build-time — they need build-args in `release-docker`
> (see the branding change in the Dockerfile). Non-`NEXT_PUBLIC_*` levers are runtime env.

## 7. Ready-to-use config

A curated, public-safe env template with hardened defaults for the common calendar use-case
(Brevo SMTP · Microsoft Outlook/Teams · Zoom · Apple/CalDAV · optional Google) lives at
[`../config/cal.forte.env.example`](../config/cal.forte.env.example). Copy it into your private
deployment, fill the placeholders, inject secrets as Docker secrets.

The image already ships **telemetry + ad-tracking OFF by default** (runner-stage ENV) — no need
to set those; override via runtime env only if you ever want them on.

## 8. First run (don't lock yourself out) — do this immediately after deploy

Signup is **open by default**. Sequence on a fresh instance:

1. Deploy, open the app, **create your own account first**.
2. Then disable signup at runtime: `/settings/admin/flags` → enable **`disable-signup`**
   (seeded by migration `20230601181657_disable_signup_feature_flag`).
   It is enforced **server-side** — both `POST /api/auth/signup` and the signup page check it,
   so it genuinely blocks registration, not just the UI link.
3. Verify: open `/signup` in a private window — it must refuse.

Leaving this step out means **anyone can register on your instance**.

## 9. Overriding baked-in files (logos) without wiping the folder

Mounting a volume over a **directory** shadows everything in it — the container's default assets
vanish. So **mount individual files**, never the whole `public/` folder:

```yaml
# secure-docker-blueprint docker-compose — override just the logo files, siblings intact
volumes:
  - ./branding/logo-white-word.svg:/calcom/apps/web/public/calcom-logo-white-word.svg:ro
  - ./branding/logo-word-black.svg:/calcom/apps/web/public/cal-logo-word-black.svg:ro
  - ./branding/icon.svg:/calcom/apps/web/public/cal-com-icon-white.svg:ro
```

Mounting over `/calcom/apps/web/public` as a whole would blank out every other public asset.
