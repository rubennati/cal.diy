# Upgrading

## The model

An upgrade is: pull the new image digest, stop the old container, start the new one. The
new container applies any pending migrations at start.

There is no in-place update mechanism and no upgrade command.

## Sequence

1. **Read the release notes** for the version you are moving to. They state what changed
   and what the release deliberately does not claim.
2. **Back up the database**, and confirm you still hold `CALENDSO_ENCRYPTION_KEY`.
3. **Select the digest** for your architecture from
   [FORK_STATUS.md](../../../FORK_STATUS.md). Pin the digest, not the tag.
4. **Start the new container.** Allow extra time for migrations.
5. **Verify** that the login page loads and that a booking page renders.

## Skipping versions

Migrations are cumulative and applied in order, so moving across several releases at once
generally works. The risk is not the migration mechanism but the size of the behavioural
delta you absorb in one step, unreviewed. Prefer moving one release at a time when you
can.

## Rolling back

**Rolling back the image does not roll back the database.** Once a migration has applied,
an older image may not run against the new schema.

A safe rollback is: restore the database backup taken before the upgrade, *and* start the
previous image digest. Either alone is unreliable.

The previous release digest is recorded as the rollback target in
[FORK_STATUS.md](../../../FORK_STATUS.md).

## Verifying what you are running

The application exposes its exact version, which is the fastest way to confirm an upgrade
took effect rather than a stale container still serving.

For artifact-level verification, every released digest carries build provenance binding it
to the source commit and tag:

```bash
gh attestation verify oci://ghcr.io/rubennati/cal.diy@sha256:<digest> --repo rubennati/cal.diy
```
