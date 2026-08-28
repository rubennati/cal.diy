# Getting started

This page gets one instance running. It does not cover production hardening — that is the
deployment implementation's job, described in [Deployment contract](deployment.md).

## What you need

- a container runtime
- PostgreSQL
- Redis
- a hostname you control, and TLS in front of it
- outbound internet access from the application (calendars, SMTP, OAuth providers)

cal.forte is published as **per-architecture image tags** for `linux/amd64` and
`linux/arm64`. There is no combined multi-architecture manifest — pick the tag for your
platform.

## Get the current image reference

Release tags and their digests are recorded in [FORK_STATUS.md](../../FORK_STATUS.md).
They are deliberately not repeated here, so this page does not go stale.

**Deploy by digest, not by tag, and never by `latest`.** A version tag identifies a
release; a digest identifies the exact bytes that were tested. `latest` is a convenience
pointer with no release meaning.

```
ghcr.io/rubennati/cal.diy:<version>@sha256:<digest>        # amd64
ghcr.io/rubennati/cal.diy:<version>-arm@sha256:<digest>    # arm64
```

## Minimum configuration

Four settings have no safe default and must be provided. Generating them is covered in
[Configuration](configuration.md).

| | |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | session signing secret |
| `CALENDSO_ENCRYPTION_KEY` | encrypts stored third-party credentials |
| `NEXT_PUBLIC_WEBAPP_URL` | the public URL of your instance |

Losing `CALENDSO_ENCRYPTION_KEY` makes every stored integration credential
unrecoverable. Treat it as a secret you back up, not one you regenerate.

## First start

On start the container waits for the database, applies pending migrations, seeds the app
store, and starts the web application on port `3000`. You do not run migrations yourself —
see [Database migrations](operations/database-migrations.md).

The first start is slower than later ones because migrations and seeding run.

## Create the first account

If self-registration is enabled, sign up through the UI. Then **disable it** —
a scheduling instance you operate yourself has no reason to accept public registrations,
and an open signup form is both an attack foothold and a spam surface:

```
NEXT_PUBLIC_DISABLE_SIGNUP=true
```

## Before you rely on it

Two things are easy to miss and both are documented separately because they change what
the product does for you:

1. **[Background jobs](operations/cron-jobs.md)** — without an external scheduler,
   reminder emails and calendar refresh never run.
2. **[Capabilities](capabilities.md)** — particularly the difference between API keys
   (supported) and a REST API (planned).

## Next

- [Configuration](configuration.md) — what else you can set
- [Integrations](integrations.md) — connecting calendars and conferencing
- [Security model](security.md) — what the product expects the deployment to provide
