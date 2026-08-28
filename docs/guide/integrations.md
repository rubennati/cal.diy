# Integrations

## How integrations become active

App-store applications ship in the image but are **inactive until credentialed**. Adding
an integration means supplying its credentials, not installing anything.

This is deliberate: an uncredentialed app has no configuration, no tokens and no outbound
calls.

## Calendars

| Provider | Status |
| --- | --- |
| Google Calendar | SUPPORTED |
| Outlook / Office 365 | SUPPORTED |
| Apple Calendar, CalDAV | SUPPORTED |
| Exchange, ICS feed | SUPPORTED |
| Zoho Calendar | SUPPORTED — hardened by the fork |
| Lark, Feishu | EVALUATING |

**Zoho** carries a fork-specific change worth knowing. Upstream builds the Zoho API
hostname from an OAuth parameter, which allowed a crafted value to redirect credentials to
another host — and the value was persisted and reused on later token refreshes. cal.forte
maps a closed set of regions to hostnames fixed at build time and refuses anything else.
An unrecognised region is rejected rather than used. This also repairs upstream's `ca` and
`cn` regions, which pointed at hostnames that do not exist.

### Keeping calendars in sync

Calendar subscription refresh is implemented as a **scheduled endpoint**, and the
container ships no scheduler. Without an external trigger, subscriptions are not refreshed
on a schedule. See [Background jobs](operations/cron-jobs.md).

## Conferencing

Cal Video (Daily.co), Zoom, Google Meet, Microsoft Teams, Webex and Jitsi are present and
credential-driven. Recording is a commercial capability and is not included.

## Automation

| Integration | Status | Notes |
| --- | --- | --- |
| Webhooks (personal) | SUPPORTED | configured per user |
| Zapier | SUPPORTED | authenticates with an API key |
| Make | SUPPORTED | authenticates with an API key |
| n8n, Pipedream | EVALUATING | present, not exercised |
| Workflows | NOT INCLUDED | absent from the fork |

Zapier and Make run **inside the web runtime**. This is why API keys are a working
capability even though the REST API is not shipped — see
[Authentication](authentication.md) and the [API v2 roadmap](roadmap/api-v2.md).

## Intercom

Present and hardened by the fork. Upstream served its configuration endpoint without
authentication and validated the submitted booking link with a pattern whose unescaped
dots matched hosts it should not have, then followed redirects. cal.forte verifies
Intercom's documented request signature, refuses the request when the app is
unconfigured, compares parsed URL components instead of a string pattern, and does not
follow redirects.

## Payments

Stripe and PayPal apps are present and require provider credentials. Not exercised by this
project's release validation — treat as EVALUATING.
