# Deployment contract

What cal.forte requires from a deployment. **This page deliberately contains no
deployment instructions.**

Provider guides, host hardening, reverse-proxy setup, firewalling, backup and monitoring
are the responsibility of
[Secure Docker Blueprint](https://github.com/rubennati/secure-docker-blueprint), which is
the production deployment source of truth. Duplicating that here would create two
documents that disagree.

What follows is the product contract a deployment implementation must satisfy.

## Runtime services

| Service | Required | Notes |
| --- | --- | --- |
| cal.forte web application | yes | the published image; a single runtime |
| PostgreSQL | yes | the application owns its schema |
| Redis | yes | |
| Scheduler | **conditional** | required for scheduled work — [Background jobs](operations/cron-jobs.md) |
| API service | no | none is shipped — [roadmap](roadmap/api-v2.md) |

## Interfaces

| | |
| --- | --- |
| Application port | `3000` |
| Public interface | HTTP, behind a TLS-terminating reverse proxy |
| Direct host port exposure | not required, and not recommended |

The application expects to be reached at `NEXT_PUBLIC_WEBAPP_URL`. Serving it at a
different externally visible URL produces broken links and callbacks rather than an
obvious failure.

## Persistent state

| State | Where |
| --- | --- |
| All application data | PostgreSQL |
| Cache and transient state | Redis |

The container itself holds no durable state. Back up the database; the container is
replaceable.

`CALENDSO_ENCRYPTION_KEY` is part of your backup surface — without it, credentials in the
database cannot be decrypted.

## Configuration and secrets

Required: `DATABASE_URL`, `NEXTAUTH_SECRET`, `CALENDSO_ENCRYPTION_KEY`,
`NEXT_PUBLIC_WEBAPP_URL`. Recommended: `CRON_API_KEY`, `NEXT_PUBLIC_DISABLE_SIGNUP`.

Full detail in [Configuration](configuration.md). How secrets are delivered is the
deployment's decision; file-based secrets are preferable to environment variables where
supported.

## Startup and migrations

On start the container waits for the database, applies pending migrations, seeds the app
store, then serves the application.

Consequences a deployment must respect:

- **Do not run two instances through a first start against the same database
  simultaneously.** Migration is not coordinated between replicas.
- The database must be reachable before the application is considered failed; the
  container waits.
- First start is slower than subsequent starts.

See [Database migrations](operations/database-migrations.md).

## Health

The application serves HTTP once ready. A request to a public route returning `200` or a
redirect is a sufficient readiness signal; the release pipeline uses exactly that against
`/auth/login`.

Allow generous startup time before declaring failure — migrations run first.

## Supported architectures

`linux/amd64` and `linux/arm64`, published as **separate tags**, each built and
runtime-tested on native hardware.

There is no combined multi-architecture manifest. A deployment must select the correct
architecture tag explicitly.

## Artifact selection

Pin a **digest**, not a tag, and never `latest`. Current digests are recorded in
[FORK_STATUS.md](../../FORK_STATUS.md); how images are built and what is asserted about
them is in [IMAGE_BUILD.md](../../IMAGE_BUILD.md).

Every released digest carries build provenance and a CycloneDX SBOM.

## Outbound network

The application needs outbound internet access for calendar providers, SMTP and OAuth.
A full egress lockdown breaks integrations. This is a documented residual risk rather than
something the product resolves.
