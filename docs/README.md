# cal.forte Documentation

cal.forte is a hardened, review-gated fork of [Cal.diy](https://cal.diy) — the MIT
community edition of Cal.com. This is the documentation for **using and operating** it.

It describes what cal.forte actually does, not what upstream does. Where the fork
deliberately differs, that difference is stated rather than inherited.

## Start here

| | |
| --- | --- |
| [Overview](guide/overview.md) | what cal.forte is, and how it differs from upstream |
| [Capabilities](guide/capabilities.md) | what is supported, limited or planned — read this first if you are evaluating |
| [Getting started](guide/getting-started.md) | running an instance |
| [Deployment contract](guide/deployment.md) | what a deployment must provide |

## Guide

| | |
| --- | --- |
| [Configuration](guide/configuration.md) | required and notable settings |
| [Authentication](guide/authentication.md) | sign-in, sessions, API keys |
| [Integrations](guide/integrations.md) | calendars, conferencing, automation |
| [Security model](guide/security.md) | what the product protects, and what it expects from the deployment |

## Operations

| | |
| --- | --- |
| [Database migrations](guide/operations/database-migrations.md) | when and how the schema changes |
| [Upgrading](guide/operations/upgrading.md) | moving between releases |
| [Background jobs](guide/operations/cron-jobs.md) | **required reading** — scheduled work needs an external trigger |
| [Troubleshooting](guide/operations/troubleshooting.md) | common symptoms |

## Roadmap

| | |
| --- | --- |
| [REST API v2](guide/roadmap/api-v2.md) | evaluated, not shipped |

## Engineering and governance records

This guide is for users and operators. The records below are the fork's engineering
memory — you should not need them to run cal.forte, and they are linked here so that a
claim in this guide can always be traced to its source.

| Record | Answers |
| --- | --- |
| [FORK_STATUS.md](../FORK_STATUS.md) | current release, image digests, upstream review point |
| [FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md) | every deliberate difference from upstream |
| [SECURITY_REVIEW.md](../SECURITY_REVIEW.md) | the per-release security gate |
| [SECURITY_ASSURANCE.md](../SECURITY_ASSURANCE.md) | what the fork does and does not verify |
| [IMAGE_BUILD.md](../IMAGE_BUILD.md) | how the published image is built |
| [RELEASE_PROCESS.md](../RELEASE_PROCESS.md) | how a release is produced |
| [FORK_PROCESS.md](../FORK_PROCESS.md) | branch model and merge gates |

Release-specific values — tags, digests, dates — live in `FORK_STATUS.md` and are
deliberately **not** repeated here, so this guide does not go stale between releases.
