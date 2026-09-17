# Troubleshooting

Symptoms in the order they are usually met.

## Reminder emails never arrive

Almost always the missing scheduler, not a mail problem. The container runs no scheduled
jobs by itself — see [Background jobs](cron-jobs.md).

Confirm mail separately by triggering a booking-confirmation email, which is sent
directly rather than on a schedule. If confirmations arrive and reminders do not, it is
the scheduler.

## Calendars stop syncing after a while

Subscription refresh is a scheduled job. Same cause as above.

## `/api/v2/...` does not work

Expected. The published release ships no REST API service; a `/api/v2` path does not reach
a working API. This is not a misconfiguration you can fix with settings.

API **keys** still work for the supported web integrations. See
[the capability matrix](../capabilities.md) and the
[API v2 roadmap](../roadmap/api-v2.md).

## An integration is present but does nothing

App-store apps are inactive until credentialed. Presence in the UI is not activation — see
[Integrations](../integrations.md).

## A setting from Cal.com documentation has no effect

Plausible rather than surprising. Upstream configuration surfaces sometimes survive in the
fork even where their implementation does not.

Check [FORK_DIVERGENCE.md](../../../FORK_DIVERGENCE.md) and
[SELF_HOST_CAPABILITY_AUDIT.md](../../SELF_HOST_CAPABILITY_AUDIT.md) before assuming you
have misconfigured something.

## Container will not start

In order of likelihood:

1. **Database unreachable.** The container waits for it and logs the wait.
2. **A required variable is missing** — `DATABASE_URL`, `NEXTAUTH_SECRET`,
   `CALENDSO_ENCRYPTION_KEY`, `NEXT_PUBLIC_WEBAPP_URL`.
3. **Migrations still running.** First start after an upgrade takes noticeably longer;
   check whether the health check is simply impatient.
4. **Wrong architecture tag.** Images are per-architecture — see
   [Deployment contract](../deployment.md).

## Links or OAuth callbacks point to the wrong host

`NEXT_PUBLIC_WEBAPP_URL` does not match the URL users actually reach. This produces
subtly wrong behaviour rather than an error.

## Integrations broke after restoring a backup

`CALENDSO_ENCRYPTION_KEY` differs from the one in use when the credentials were stored.
Stored credentials cannot be decrypted with a different key and must be reconnected.

## Two-factor setup fails without explanation

A known diagnosability defect —
[#35](https://github.com/rubennati/cal.diy/issues/35).

## Establishing what you are running

The application exposes its exact version. For artifact-level verification, confirm the
running digest against [FORK_STATUS.md](../../../FORK_STATUS.md) and verify its
provenance — see [Upgrading](upgrading.md).
