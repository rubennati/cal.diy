# Database migrations

## How they run

Migrations are applied **automatically when the container starts**, before the application
serves traffic. The startup sequence is: wait for the database → `prisma migrate deploy` →
seed the app store → start.

You do not run migrations manually. Upgrading the image is what applies them.

## What this means in practice

**Do not start two instances through a first start against the same database at the same
time.** Migration is not coordinated between replicas. Bring one instance up, let it
finish, then scale.

**First start after an upgrade is slower.** The application is not broken; it is
migrating. Set startup timeouts and health-check grace periods accordingly.

**Migrations run forward only.** There is no automatic rollback. Rolling back to a
previous image after a migration has applied is not supported by the schema — see
[Upgrading](upgrading.md).

## Before upgrading

Back up the database. This is the only reliable way back from a migration you did not want.

A database backup without `CALENDSO_ENCRYPTION_KEY` is not a complete backup: the stored
third-party credentials cannot be decrypted without it.

## The app-store seed

Alongside migrations, start-up seeds app-store metadata. This registers which integrations
exist; it does **not** enable them or supply credentials. An integration remains inactive
until credentialed — see [Integrations](../integrations.md).
