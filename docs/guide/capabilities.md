# Capability matrix

**This is the canonical, user-facing product answer for what cal.forte supports.** Where
another document in this repository disagrees with this page *about product capability*,
this page is the one to read.

It is not, however, above the evidence. The matrix interprets technical evidence into a
product statement; it does not overrule it. When an audit or a runtime observation
contradicts a row here, the evidence is the fact and **this page is wrong and must be
corrected**.

## Why four columns

Upstream feature tables answer one question with one tick: *does the product have X?* That
is not enough for a fork. A capability can exist in the codebase, be claimed by upstream
documentation, and still not be part of the release you are running — and each of those is
a different fact.

So every row answers four separate questions, never collapsed:

1. **Cal.com** — does the commercial product offer it?
2. **Cal.diy claim** — does upstream Community Edition documentation claim it?
3. **cal.forte status** — is it part of the current published cal.forte product?
4. **Verification** — how deeply has that been checked?

Known findings are a **fifth**, separate thing, and live in Notes. A capability can be
SUPPORTED, RUNTIME VERIFIED, and still have an open finding against it — those three
statements do not conflict.

## Upstream reference provenance

Columns 1 and 2 are **reported values, not independent verification.**

| | |
| --- | --- |
| Source | <https://www.cal.diy/> — the Cal.diy vs Cal.com comparison table |
| Checked | 2026-08-28 |
| **Cal.com** column | as *reported by that table*. Not verified against Cal.com by this project |
| **Cal.diy claim** column | as *reported by that table*. It is an inventory item to investigate, not evidence about cal.forte |
| **cal.forte status / Verification** | derived from this repository and its releases |

A ✅ in either upstream column has never been treated as evidence about this fork. Two
rows contradict the upstream table outright — see the notes on impersonation and routing
forms.

## Status vocabulary

Status describes **product intent and current availability**.

| Status | Meaning |
| --- | --- |
| **SUPPORTED** | intentionally part of the current published product, with a normal supported user or operator workflow |
| **LIMITED** | part of the product, with a constraint you must know before relying on it |
| **PLANNED** | not in the current product, and cal.forte has **explicitly decided** to pursue it |
| **NOT INCLUDED** | deliberately absent, with no current intent to add it |
| **EVALUATING** | not currently available or not established as usable, and **the direction has not been decided** |

SUPPORTED is a product statement, not a testing statement. It does not mean "runtime
tested" — that is what the Verification column is for.

**PLANNED requires a decision, not a wish.** Existing code, a schema table, or an open
engineering issue is not a product commitment. Where the direction is genuinely undecided,
the row says EVALUATING even when substantial implementation exists.

## Verification vocabulary

Verification describes **evidence depth only**. It says nothing about quality, safety or
absence of findings.

| Term | Meaning |
| --- | --- |
| **RUNTIME VERIFIED** | exercised against a running instance, by this project |
| **CODE VERIFIED** | the implementation was read and confirmed to exist and connect |
| **REVIEWED** | passed the fork's security review for a release |
| **NOT YET VERIFIED** | inherited from upstream, not independently checked |

### What the release test actually covers

The release pipeline's runtime test starts the exact published image and requests
`/auth/login`, accepting a `200` or a redirect. That is the whole of it.

It therefore establishes that **the application starts, migrations apply, and the login
route serves** — and nothing about event types, bookings, availability or any integration.
No row below credits it with more. End-to-end browser tests exist in the repository but
are not run in CI, so they are not cited as verification either.

## Scheduling and bookings

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Event types | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | core product. Not exercised by any automated test this project runs |
| Booking management | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | as above |
| Availability schedules | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | |
| Recurring event types | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | **Open finding:** recurring request bodies are not validated at runtime — accepted known defect [#46](https://github.com/rubennati/cal.diy/issues/46) |
| Private links (hashed URLs) | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | |
| Paid events (Stripe / PayPal) | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | requires provider credentials |
| Seated events | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | |
| Date overrides, buffers, booking limits | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | |
| Travel schedules, out of office | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | |
| Teams | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | not part of this edition (`.ai/state.md`): no shipped runtime path creates a team. Whether that changes is the **open** decision [#28](https://github.com/rubennati/cal.diy/issues/28). [Evaluation](../TEAM_CAPABILITY_EVALUATION.md) |
| Team event types (round-robin / collective) | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | backend intact; depends entirely on the Teams decision |
| Managed event types, instant meeting | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | |
| Organizations | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | no org router and no runtime path. **No recorded product decision** either way |

## Calendar, video and conferencing

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Google, Outlook / Office 365, Apple, CalDAV, Exchange, ICS feed | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | require provider credentials |
| Zoho Calendar | ✅ | ✅ | **SUPPORTED** | REVIEWED | fork hardening: server locations constrained to documented regions |
| Lark, Feishu | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | |
| Calendar subscription refresh | ✅ | — | **LIMITED** | CODE VERIFIED | scheduled endpoint; needs an external trigger — [Background jobs](operations/cron-jobs.md) |
| Cal Video, Zoom, Google Meet, Teams, Webex, Jitsi | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | require provider credentials |
| Video recordings | ✅ | ❌ | **NOT INCLUDED** | — | commercial capability |

## Authentication

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Email / password sign-in | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | the login route is exercised by the release test |
| Google OAuth | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | |
| Microsoft / Entra OAuth | ✅ | ✅ | **LIMITED** | CODE VERIFIED | **Open finding:** tenant restriction is not enforced by default — [#23](https://github.com/rubennati/cal.diy/issues/23) |
| Self-registration | ✅ | ✅ | **SUPPORTED** | REVIEWED | can be disabled with `NEXT_PUBLIC_DISABLE_SIGNUP`; recommended on a single-operator instance. **Open finding:** invitation-token interaction — [#38](https://github.com/rubennati/cal.diy/issues/38) |
| Two-factor (TOTP) | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | **Open finding:** setup failures are undiagnosable — [#35](https://github.com/rubennati/cal.diy/issues/35) |
| API keys | ✅ | ✅ | **SUPPORTED** | RUNTIME VERIFIED | creation and revocation observed on a deployed instance. Keys carry full user authority — no scope. See [Authentication](authentication.md) |
| SAML SSO, SCIM | ✅ | ❌ | **NOT INCLUDED** | — | enterprise capability |
| Impersonation | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | code present **despite the upstream ❌**; release support not established |
| PBAC | ✅ | ❌ | **EVALUATING** | REVIEWED | not implemented; the fork's placeholders **deny** rather than grant ([#13](https://github.com/rubennati/cal.diy/issues/13)). A security containment, **not** a decision to build PBAC |

## Automation, integrations and API

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Webhooks (personal) | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | |
| Webhooks (team) | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | depends on the undecided Teams direction. **Open finding:** ownership middleware has no team branch |
| Zapier | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | runs inside the web runtime; consumes API keys |
| Make | ✅ | ✅ | **SUPPORTED** | CODE VERIFIED | as above |
| n8n, Pipedream | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | present in the app store |
| CRM, messaging, AI-agent apps | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | inactive until credentialed |
| Intercom | ✅ | ✅ | **SUPPORTED** | REVIEWED | fork hardening: configure endpoint authenticated |
| **REST API v2** | ✅ | ✅ | **PLANNED** | CODE VERIFIED | **the published release ships the web runtime only.** The one row with an explicit decision: [roadmap](roadmap/api-v2.md) |
| API v1 (legacy) | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | not present in the fork |
| Platform / OAuth clients | ✅ | ✅ | **EVALUATING** | CODE VERIFIED | part of the API v2 application; **no separate product decision** |
| Embed | ✅ | ✅ | **SUPPORTED** | NOT YET VERIFIED | packages present |
| Workflows | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | absent from the tree |
| Routing forms | ✅ | ❌ | **EVALUATING** | CODE VERIFIED | partial code present **despite the upstream ❌** |

### API keys are supported; the REST API is not

These are different things, and conflating them is the most common misreading of this
product.

**API-key management is SUPPORTED.** Keys are created and revoked in the UI, stored as a
SHA-256 hash, and honoured today by the web-based automation integrations — Zapier and
Make — which run inside the web runtime.

**REST API v2 is PLANNED.** The API v2 application exists in the repository, but the
published release is the **web runtime only** and does not ship it. A `/api/v2` path on a
current deployment does not reach a working API service.

So *"API keys allow other apps to communicate with cal.forte"* is accurate. *"cal.forte
offers a public REST API"* is not, yet. See [roadmap/api-v2.md](roadmap/api-v2.md).

## Analytics, privacy and enterprise

| Capability | Cal.com | Cal.diy claim | cal.forte status | Verification | Notes |
| --- | --- | --- | --- | --- | --- |
| Insights dashboard | ✅ | ❌ | **NOT INCLUDED** | CODE VERIFIED | absent from the tree |
| Attributes, delegation, workspace platform, admin panel | ✅ | ❌ | **NOT INCLUDED** | — | enterprise capabilities |
| Usage telemetry | ✅ | — | **NOT INCLUDED** | REVIEWED | module, endpoint and dependency **removed**; a blocking CI guard prevents reintroduction |

## Operations

| Capability | cal.forte status | Verification | Notes |
| --- | --- | --- | --- |
| Database migrations | **SUPPORTED** | RUNTIME VERIFIED | applied at container start; exercised by the release test — [details](operations/database-migrations.md) |
| Application startup | **SUPPORTED** | RUNTIME VERIFIED | the published image is started and serves before release |
| Scheduled / background jobs | **LIMITED** | CODE VERIFIED | no scheduler ships in the container — [details](operations/cron-jobs.md) |
| AMD64 and ARM64 images | **SUPPORTED** | RUNTIME VERIFIED | per-architecture tags, each started natively before release |
| Build provenance and SBOM | **SUPPORTED** | RUNTIME VERIFIED | per released digest |
| Multi-architecture manifest | **NOT INCLUDED** | — | architecture-specific tags only |

## Authority and how a row changes

```
technical evidence / audits          the facts
  → product interpretation           what the facts mean for the product
    → this capability matrix         the canonical user-facing answer
      → README summary
      → feature documentation
```

One-directional, so there is one place to change. The matrix is canonical **for the
product question**; it never overrides contradictory technical evidence. New evidence that
invalidates a row makes the row wrong, not the evidence.

The technical inventory beneath these rows is
[SELF_HOST_CAPABILITY_AUDIT.md](../SELF_HOST_CAPABILITY_AUDIT.md), which uses a finer
vocabulary (`E1` code-confirmed, `E2` reproduced, `E3` corroborated).

| Change | Required evidence |
| --- | --- |
| → SUPPORTED | the capability is intended to be part of the product and has a normal supported workflow |
| → LIMITED | the constraint documented, with the finding or design decision behind it |
| → PLANNED | an explicit, citable cal.forte decision to pursue it |
| → NOT INCLUDED | confirmation of absence, and the reason |
| → EVALUATING | the direction is not decided, or usability is not established |
| Verification upgrade | independent of status: cite what was checked and how |

**Proposed, not implemented:** a CI check asserting that every capability named in the
README summary appears here with the same status, so the landing page cannot drift from
this registry.
