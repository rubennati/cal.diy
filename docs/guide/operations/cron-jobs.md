# Background jobs

**Read this before relying on reminders or calendar sync.**

## The situation

Several pieces of cal.forte functionality are implemented as **HTTP endpoints that
something must call on a schedule**. The published container ships **no scheduler**. Its
startup runs migrations, seeds the app store and starts the web application — nothing
else.

Upstream runs these on Vercel's cron scheduler, which is a hosting-platform feature and
does not exist in a self-hosted container. The repository still contains that scheduler
definition; it has no effect here.

So on a default self-hosted deployment, **scheduled work does not run at all** until you
arrange for it. Nothing fails loudly. Reminders simply never arrive.

This is why the capability is classified **LIMITED** rather than SUPPORTED in the
[capability matrix](../capabilities.md).

## What is affected

| Job | Effect if never called |
| --- | --- |
| Booking reminders | organiser reminder emails for pending bookings are not sent |
| Calendar subscription refresh | subscriptions are not renewed on schedule |
| Calendar subscription cleanup | stale subscriptions accumulate |
| Selected-calendar refresh | connected-calendar state drifts |
| Queued task processing | queued background work is not processed |
| App metadata sync | app-store metadata is not refreshed |
| Timezone change handling | scheduled timezone updates are not applied |

Booking reminders are usually the one that matters first, because their absence looks like
a product defect rather than a missing scheduler.

## What you need to do

Run an external scheduler that calls the endpoints over HTTP on a schedule. This can be
anything that makes an authenticated HTTP request on a timer — a systemd timer, a cron
container, or your platform's scheduler.

Set `CRON_API_KEY` to a generated secret and have the scheduler present it. Endpoints
reject unauthenticated requests.

```bash
openssl rand -hex 32
```

Frequencies should follow the upstream scheduler definition in the repository
(`apps/web/vercel.json`) as a starting point — it records the intended cadence for each
job even though the mechanism does not apply here.

## Reaching the endpoints privately

The scheduler does **not** have to reach cal.forte over the public internet. If it runs on
the same internal network, it can call the application directly, and the scheduled
endpoints then never need to be publicly routable at all.

That is the preferable arrangement: it keeps the job endpoints off the public surface
while preserving the supported workflow. Whether your deployment does this is a
[Secure Docker Blueprint](https://github.com/rubennati/secure-docker-blueprint) concern,
not a product setting.

## Verifying

After configuring the scheduler, confirm that an authenticated call returns success rather
than `401` or `403`, and that a subsequent run has an observable effect — a pending
booking old enough to qualify producing a reminder is the clearest signal.

An unauthenticated call returning `401`/`403` is the correct, expected response and
confirms the endpoint is reachable and protected.
