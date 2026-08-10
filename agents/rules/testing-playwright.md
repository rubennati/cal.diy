---
title: Playwright E2E Testing
impact: HIGH
impactDescription: E2E tests catch integration issues before production
tags: testing, playwright, e2e
---

# Playwright E2E Testing

## Running Tests

Use the command format:

```bash
PLAYWRIGHT_HEADLESS=1 yarn e2e [test-file.e2e.ts]
```

This format includes the proper timezone setting, virtual display server, and uses the repository's e2e runner.

**Do not use** the standard `yarn playwright test` command.

## Local Testing First

Always ensure Playwright tests pass locally before pushing code. The user requires fast local e2e feedback loops instead of relying on CI, which is too slow for development iteration.

**Never push test code until those tests are passing locally first.**

## CI Behavior

This fork does not run Playwright E2E in CI — the upstream E2E workflows are disabled
(see [FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md) → Security And Privacy Changes). E2E is a **local** tool:
run the relevant specs locally before pushing changes that touch booking / auth /
calendar flows. Fork CI (`forte-ci`) covers type-check + lint only.
