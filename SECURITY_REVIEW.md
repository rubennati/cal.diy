# Security Review

## Purpose

This is the minimum recurring security review checklist for this fork before a reviewed image is allowed to move toward downstream deployment.

## Review Priorities

Focus on these areas first:

- auth and signup behavior
- mail transport and mailer error logging
- secret handling in workflows and builds
- cron and webhook authentication
- credential storage and encryption behavior
- public booking routes and exposed APIs
- dependency changes
- image publication path

## Minimum Review Checklist Per Release

- review the upstream diff summary
- review fork-only commits
- confirm release workflow still points to fork GHCR
- confirm no new upstream DockerHub assumption was reintroduced
- confirm no secret values were committed
- inspect build-related changes for secret-bearing build args
- inspect auth and mail logging changes
- inspect cron and webhook auth changes
- inspect dependency and lockfile changes

## Minimum Checks Before A Release Tag

- `yarn type-check:ci --force`
- relevant tests for changed areas
- `git diff --check`
- manual review of release workflow and image destination
- manual smoke check plan for the resulting image

## Release Blocking Conditions

Do not approve a release image for downstream use if any of these are true:

- source state is not understood
- release branch content differs from expectation
- image destination is ambiguous
- only `latest` is available and the digest is not recorded
- a security-sensitive change is present without review
- a known secret-handling issue is accepted without documentation

## Incident-Oriented Checks

Because a prior deployment apparently lost SMTP credentials, every release review should explicitly consider:

- can auth or mail logs leak secrets
- can build steps expose runtime secrets
- can cron or webhook secrets leak via URLs
- can the resulting image be traced back to one reviewed source state

## Immediate Rotation Targets After Any Suspected Secret Exposure

If compromise is suspected, review and rotate at least:

- SMTP credentials
- `NEXTAUTH_SECRET`
- `CALENDSO_ENCRYPTION_KEY`
- cron secrets
- webhook secrets
- OAuth client secrets
- credential sync secrets, if enabled

## This Pass Does Not Change

This file is a process checklist only. It does not claim that current source risks are fixed. It records the minimum review discipline needed before trusting a new image.
