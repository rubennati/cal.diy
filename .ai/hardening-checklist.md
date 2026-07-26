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
| `NEXT_PUBLIC_DISABLE_SIGNUP` | `true` | **build** (needs a build-arg — see branding.md §1) |
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
