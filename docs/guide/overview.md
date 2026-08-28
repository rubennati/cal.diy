# Overview

cal.forte is a **hardened, review-gated fork of Cal.diy**, the MIT-licensed community
edition of Cal.com. It exists so that scheduling software can be self-hosted on the public
internet with a defensible answer to the question *"what exactly is running, and who
reviewed it?"*

It is not a rebrand and not a rewrite. The application is Cal.diy. What differs is how
changes reach a running instance.

## What the fork actually changes

| | |
| --- | --- |
| **Review gate** | every upstream change is reviewed before integration; nothing is merged wholesale. Dispositions are recorded in [UPSTREAM_REVIEW_LEDGER.md](../../UPSTREAM_REVIEW_LEDGER.md) |
| **Traceability** | each release names the exact source commit, source tree and image digests — see [FORK_STATUS.md](../../FORK_STATUS.md) |
| **Reduced surface** | telemetry removed, advertising integrations off by default, self-registration disableable |
| **Security fixes ahead of upstream** | several fixes in cal.forte are not in upstream Cal.diy; they are listed in [FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md) |
| **Deploy by digest** | images are published per architecture with recorded digests and build provenance |

## What it is not

- **Not a Cal.com replacement with enterprise features.** Commercial and enterprise
  functionality is not part of the MIT community edition and is not added here.
- **Not a hosted service.** You run it.
- **Not a general-purpose platform API host.** See [Capabilities](capabilities.md) and the
  [API v2 roadmap](roadmap/api-v2.md).

## Relationship to upstream

Upstream Cal.diy documents itself as *"strictly recommended for personal, non-production
use"*. cal.forte exists precisely because that recommendation is unsatisfying for someone
who wants to self-host it anyway: the fork's answer is not to promise more, but to make
the actual state auditable and to fix what it finds.

That means some upstream claims do **not** carry over. Where this guide is silent about a
feature you have read about in Cal.com's documentation, assume it is not supported here
until [Capabilities](capabilities.md) says otherwise.

## How to read this documentation

Every capability is classified as **SUPPORTED**, **LIMITED** or **PLANNED**. Those words
have precise meanings, defined in [Capabilities](capabilities.md). Nothing in this guide
describes behaviour that is planned as though it already worked.
