# Capability matrix

**This is the canonical, user-facing record of what cal.forte supports.** Where any other
document in this repository disagrees with this page about product capability, this page
wins and the other document is wrong.

## Why this page exists in this form

Upstream feature tables answer one question with one tick: *does the product have X?* That
is not enough for a fork. A capability can exist in the codebase, be claimed by upstream
documentation, and still not be usable in the release you are running — and each of those
is a different fact.

So every row answers four separate questions, and they are never collapsed:

1. **Cal.com** — does the commercial product offer it?
2. **Cal.diy claim** — does current upstream Community Edition documentation claim it?
3. **cal.forte status** — what does the current cal.forte release actually support?
4. **Verification** — what evidence supports that status?

A ✅ in column 2 is an *inventory item to investigate*, not a statement about cal.forte.

## Vocabulary

### Product status

| Status | Meaning |
| --- | --- |
| **SUPPORTED** | usable in the published release through a normal user workflow |
| **LIMITED** | usable, but with a constraint you must know before relying on it |
| **PLANNED** | not in the published release; intended or under active design |
| **NOT INCLUDED** | deliberately absent, with no current intent to add it |
| **EVALUATING** | implementation exists; whether the release supports it end to end is not yet established |

### Verification

Status says what the product does. Verification says how well we know it. They are
independent — a SUPPORTED feature can still have open findings.

| Term | Meaning |
| --- | --- |
| **RUNTIME VERIFIED** | exercised against a running instance |
| **CODE VERIFIED** | the implementation was read and confirmed to exist and connect |
| **REVIEWED** | passed the fork's security review for a release |
| **OPEN FINDINGS** | works, and has recorded findings against it |
| **NOT YET VERIFIED** | inherited from upstream, not independently checked |

No row is labelled "secure" or "safe". Those are not properties this matrix can assert.

## Scheduling and bookings

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Event types | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | core product; exercised by the release runtime test |
| Booking management | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | |
| Recurring event types | ✅ | ✅ | **LIMITED** | OPEN FINDINGS | recurring request bodies are not validated at runtime — accepted known defect, [#46](https://github.com/rubennati/cal.diy/issues/46) |
| Private links (hashed URLs) | ✅ | ✅ | **EVALUATING** | NOT YET VERIFIED | |
| Paid events (Stripe / PayPal) | ✅ | ✅ | **EVALUATING** | CODE VERIFIED | app-store apps present; requires provider credentials, unexercised here |
| Seated events | ✅ | ✅ | **EVALUATING** | NOT YET VERIFIED | |
| Teams | ✅ | ❌ | **PLANNED** | CODE VERIFIED | schema and services exist; **no shipped runtime path creates a team**. [Evaluation](../TEAM_CAPABILITY_EVALUATION.md) |
| Team event types (round-robin / collective) | ✅ | ❌ | **PLANNED** | CODE VERIFIED | backend intact, UI and authorization removed upstream |
| Managed event types | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | |
| Instant meeting | ✅ | ❌ | **NOT INCLUDED** | NOT YET VERIFIED | |
| Organizations | ✅ | ❌ | **PLANNED** | CODE VERIFIED | no org router; no runtime path |

## Availability

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Availability schedules | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | |
| Date overrides | ✅ | ✅ | **EVALUATING** | NOT YET VERIFIED | |
| Buffer times, minimum notice, booking limits | ✅ | ✅ | **EVALUATING** | NOT YET VERIFIED | |
| Travel schedules | ✅ | ✅ | **EVALUATING** | CODE VERIFIED | present in the tree |
| Out of office | ✅ | ✅ | **EVALUATING** | CODE VERIFIED | present in the tree |

## Calendar integrations

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Google, Outlook / Office 365, Apple, CalDAV, Exchange, ICS feed | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | require provider credentials; see [Integrations](integrations.md) |
| Zoho Calendar | ✅ | ✅ | **SUPPORTED** | REVIEWED | fork-specific hardening: server locations constrained to documented regions |
| Lark, Feishu | ✅ | ✅ | **EVALUATING** | NOT YET VERIFIED | |
| Calendar subscription refresh | ✅ | — | **LIMITED** | CODE VERIFIED | implemented as a scheduled endpoint; needs an external trigger — [Background jobs](operations/cron-jobs.md) |

## Video and conferencing

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Cal Video (Daily.co), Zoom, Google Meet, Teams, Webex, Jitsi | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | require provider credentials |
| Video recordings | ✅ | ❌ | **NOT INCLUDED** | — | commercial capability |

## Authentication

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Email / password | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | [Authentication](authentication.md) |
| Google OAuth | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | |
| Microsoft / Entra OAuth | ✅ | ✅ | **LIMITED** | OPEN FINDINGS | tenant restriction is not enforced by default — see [Authentication](authentication.md) |
| Self-registration | ✅ | ✅ | **SUPPORTED, disableable** | REVIEWED | disable on a single-operator instance |
| SAML SSO, SCIM | ✅ | ❌ | **NOT INCLUDED** | — | enterprise capability |
| Impersonation | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | code present despite the upstream ❌; release support not established |
| API keys | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | creation and revocation in the UI — read the [API and integrations](#automation-integrations-and-api) note below |
| PBAC (permission-based access control) | ✅ | ❌ | **PLANNED** | REVIEWED | not implemented; the fork's placeholders **deny** rather than grant |

## Automation, integrations and API

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Webhooks (personal) | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | |
| Webhooks (team) | ✅ | ❌ | **PLANNED** | OPEN FINDINGS | depends on Teams; ownership middleware has no team branch |
| Zapier | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | runs inside the web runtime and consumes API keys |
| Make | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | as above |
| n8n, Pipedream | ✅ | ✅ | **EVALUATING** | CODE VERIFIED | present in the app store; not exercised |
| CRM, messaging, AI-agent apps | ✅ | ✅ | **EVALUATING** | NOT YET VERIFIED | app-store apps are disabled until credentialed |
| Intercom | ✅ | ✅ | **SUPPORTED** | REVIEWED | fork-specific hardening: configure endpoint authenticated |
| **REST API v2** | ✅ | ✅ | **PLANNED** | CODE VERIFIED | **the published release ships no API service.** [Roadmap](roadmap/api-v2.md) |
| API v1 (legacy) | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | not present in the fork |
| Platform / OAuth clients | ✅ | ✅ | **PLANNED** | CODE VERIFIED | part of the API v2 application; not shipped |
| Embed | ✅ | ✅ | **EVALUATING** | CODE VERIFIED | packages present; not exercised |
| Workflows (automations) | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | absent from the tree |
| Routing forms | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | partial code present despite the upstream ❌ |

### API keys are supported; the REST API is not

These are different things and conflating them is the single most common misreading of
this product.

**API-key management is SUPPORTED.** Keys are created and revoked in the UI, stored as a
SHA-256 hash, and honoured today by the web-based automation integrations — Zapier and
Make — which run inside the web runtime.

**REST API v2 is PLANNED.** The API v2 application exists in the repository, but the
published release is a single web runtime and does not ship it. A `/api/v2` path on a
current deployment does not reach a working API.

So the UI statement *"API keys allow other apps to communicate with cal.forte"* is
accurate. *"cal.forte offers a public REST API"* is not, yet. See
[roadmap/api-v2.md](roadmap/api-v2.md).

## Analytics and enterprise

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Insights dashboard | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | absent from the tree |
| Attributes and segments, delegation, workspace platform, admin panel | ✅ | ❌ | **NOT INCLUDED** | — | enterprise capabilities |
| Ad-click tracking | ✅ | — | **NOT INCLUDED** | REVIEWED | removed by the fork |
| Usage telemetry | ✅ | — | **NOT INCLUDED** | REVIEWED | removed by the fork; a CI guard prevents reintroduction |

## Operations

| Capability | cal.forte status | Verification | Notes |
| --- | --- | --- | --- |
| Database migrations | **SUPPORTED** | RUNTIME VERIFIED | applied automatically at start — [details](operations/database-migrations.md) |
| Scheduled / background jobs | **LIMITED** | CODE VERIFIED | no scheduler ships in the container — [details](operations/cron-jobs.md) |
| AMD64 and ARM64 images | **SUPPORTED** | RUNTIME VERIFIED | per-architecture tags, each runtime-tested natively |
| Build provenance and SBOM | **SUPPORTED** | RUNTIME VERIFIED | per released digest |
| Multi-architecture manifest | **NOT INCLUDED** | — | architecture-specific tags only |

## How a row changes

A capability moves to **SUPPORTED** only when evidence shows the *user workflow* working
end to end — not when the code exists, and not when upstream claims it.

| Change | Required evidence |
| --- | --- |
| → SUPPORTED | the supported user workflow demonstrated end to end, and the release that contains it identified |
| → LIMITED | the constraint documented, with the finding or design decision it follows from |
| → PLANNED | a roadmap page describing what must be resolved first |
| → NOT INCLUDED | confirmation of absence, and the reason |
| EVALUATING → anything | the evidence that closed the gap |

The technical inventory behind these rows is
[SELF_HOST_CAPABILITY_AUDIT.md](../SELF_HOST_CAPABILITY_AUDIT.md), which uses a finer
evidence vocabulary (`E1` code-confirmed, `E2` reproduced, `E3` corroborated). That audit
is the evidence layer; this page is the product layer. When they disagree, the audit is
the fact and this page needs correcting.

The intended flow is one-directional, so there is exactly one place to change:

```
technical audit / evidence
  → this capability matrix (canonical)
    → README "at a glance" summary
    → feature-specific documentation
```

**Proposed, not implemented:** a CI check asserting that every capability named in the
README summary also appears here with the same status, so the landing page cannot drift
from this registry. It would fit alongside the existing fork guards in `forte-ci`.
