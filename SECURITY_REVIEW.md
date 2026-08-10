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
- reconcile every observed upstream commit in `UPSTREAM_REVIEW_LEDGER.md`
- confirm the current intake did not squash multiple upstream commits into one local commit
- confirm partial upstream intake lists exact retained and omitted behavior

## Minimum Checks Before A Release Tag

- `yarn type-check:ci --force`
- relevant tests for changed areas
- `git diff --check`
- manual review of release workflow and image destination
- manual smoke check plan for the resulting image
- lifecycle/install source-clean check
- non-publishing AMD64 and ARM64 workflow validation
- exact release-tag-to-`origin/release` identity check
- architecture-specific digest, SBOM, and provenance capture plan

## Release Blocking Conditions

Do not approve a release image for downstream use if any of these are true:

- source state is not understood
- release branch content differs from expectation
- image destination is ambiguous
- only `latest` is available and the digest is not recorded
- a security-sensitive change is present without review
- a known secret-handling issue is accepted without documentation
- the release tag does not point exactly to the reviewed `origin/release` head
- the published digest is not the digest of the tested image
- either architecture or the release finalizer failed
- generated tracked files differ after install/lifecycle scripts

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
