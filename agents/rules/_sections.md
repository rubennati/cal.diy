# Sections

Filename-prefix groups for the engineering rules in this directory. Rules are adopted
from upstream cal.com and kept as this fork's own standard; cal.com's team-culture
rules have been removed.

## Architecture (architecture) — CRITICAL
Vertical-slice organisation, feature boundaries, circular-dependency prevention, page-level auth.

## Data Layer (data) — HIGH
Repository pattern, DTO boundaries, `select` over `include`, Prisma migrations.

## API Design (api) — HIGH
Thin controllers, no breaking changes.

## Performance (performance) — HIGH
Algorithm complexity, Day.js usage, scheduling complexity.

## Code Quality (quality) — HIGH
Clarity over cleverness, error handling, comments, imports, no barrel imports.

## Testing (testing) — MEDIUM-HIGH
Coverage, timezone, mocking, incremental fixing, Playwright.

## Design Patterns (patterns) — MEDIUM
Dependency injection, factory pattern. (`app-store`, `trigger-dev` pending slimming decision.)

## CI/CD (ci) — MEDIUM
Type-check-first, git workflow, CI-failure triage.

## Reference (reference) — LOW
File locations, local development.
