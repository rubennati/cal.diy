# cal.forte Agent Documentation Index

- **[../AGENTS.md](../AGENTS.md)** — main guide (fork rules, tech stack, commands, examples)
- **[commands.md](commands.md)** — command reference
- **[knowledge-base.md](knowledge-base.md)** — domain knowledge and business rules

## Rules Index

Engineering rules adopted from upstream (cal.com team-culture / PR-process rules were
removed — see [../FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md)). Grouped by prefix
([rules/_sections.md](rules/_sections.md)).

### Architecture
- [architecture-vertical-slices](rules/architecture-vertical-slices.md) — vertical slice architecture
- [architecture-feature-boundaries](rules/architecture-feature-boundaries.md) — feature boundaries via public APIs
- [architecture-circular-dependencies](rules/architecture-circular-dependencies.md) — package dependency layering
- [architecture-features-modules](rules/architecture-features-modules.md) — packages/features vs apps/web/modules
- [architecture-page-level-auth](rules/architecture-page-level-auth.md) — auth in page.tsx, not layout.tsx

### Data Layer
- [data-repository-pattern](rules/data-repository-pattern.md) — repository pattern
- [data-repository-methods](rules/data-repository-methods.md) — repository method conventions
- [data-dto-boundaries](rules/data-dto-boundaries.md) — DTOs at boundaries
- [data-prefer-select-over-include](rules/data-prefer-select-over-include.md) — select over include
- [data-prisma-migrations](rules/data-prisma-migrations.md) — schema changes and migrations
- [data-prisma-feature-flags](rules/data-prisma-feature-flags.md) — feature flag seeding

### API
- [api-thin-controllers](rules/api-thin-controllers.md) — thin controllers
- [api-no-breaking-changes](rules/api-no-breaking-changes.md) — API stability

### Performance
- [performance-avoid-quadratic](rules/performance-avoid-quadratic.md) — avoid O(n²)
- [performance-dayjs-usage](rules/performance-dayjs-usage.md) — Day.js usage
- [performance-scheduling-complexity](rules/performance-scheduling-complexity.md) — NP-hard scheduling

### Code Quality
- [quality-simplicity](rules/quality-simplicity.md) — clarity over cleverness
- [quality-error-handling](rules/quality-error-handling.md) — ErrorWithCode vs TRPCError
- [quality-code-comments](rules/quality-code-comments.md) — comment guidelines
- [quality-imports](rules/quality-imports.md) — import / export patterns
- [quality-avoid-barrel-imports](rules/quality-avoid-barrel-imports.md) — avoid barrel imports

### Testing
- [testing-coverage-requirements](rules/testing-coverage-requirements.md) — coverage standards
- [testing-timezone](rules/testing-timezone.md) — TZ=UTC
- [testing-mocking](rules/testing-mocking.md) — mock patterns
- [testing-incremental](rules/testing-incremental.md) — incremental test fixing
- [testing-playwright](rules/testing-playwright.md) — Playwright (local)

### Design Patterns
- [patterns-dependency-injection](rules/patterns-dependency-injection.md) — dependency injection
- [patterns-factory-pattern](rules/patterns-factory-pattern.md) — factory pattern
- [patterns-app-store](rules/patterns-app-store.md) — app-store integration *(slimming candidate)*
- [patterns-trigger-dev](rules/patterns-trigger-dev.md) — Trigger.dev tasks *(slimming candidate)*

### CI/CD
- [ci-check-failures](rules/ci-check-failures.md) — handling CI failures
- [ci-type-check-first](rules/ci-type-check-first.md) — type-check before tests
- [ci-git-workflow](rules/ci-git-workflow.md) — git and CI workflow

### Reference
- [reference-file-locations](rules/reference-file-locations.md) — key file paths
- [reference-local-dev](rules/reference-local-dev.md) — local development setup
