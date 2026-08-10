# Engineering Rules (adopted from upstream)

Modular, machine-readable engineering rules kept in this fork because they describe how
to safely maintain **this codebase**. They originate from cal.com's engineering
standards; the fork keeps the technical rules and has removed cal.com's team-culture and
PR-process rules (see [../../FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md)).

## Sections

Rules are grouped by filename prefix (see [_sections.md](_sections.md)):

| Prefix | Section | Impact |
|--------|---------|--------|
| `architecture-` | Architecture | CRITICAL |
| `data-` | Data Layer | HIGH |
| `api-` | API Design | HIGH |
| `performance-` | Performance | HIGH |
| `quality-` | Code Quality | HIGH |
| `testing-` | Testing | MEDIUM-HIGH |
| `patterns-` | Design Patterns | MEDIUM |
| `ci-` | CI/CD | MEDIUM |
| `reference-` | Reference | LOW |

## Rule format

Each file states the rule, **why** it matters, and an incorrect/correct example.

## Pending slimming decision

A few rules describe features this fork may drop when the codebase is slimmed —
`patterns-trigger-dev`, `patterns-app-store`, `data-prisma-feature-flags`. Tracked in
[../../FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md).
