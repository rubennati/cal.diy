# cal.forte — Development Guide for AI Agents

`cal.forte` is a hardened, controlled fork of Cal.diy in a Yarn/Turbo monorepo.
Prioritise **security, type safety, and small, reviewable diffs**.

The engineering rules referenced below are *adopted from upstream cal.com* and kept
because they describe how to safely maintain **this codebase** — not because they are
team process. cal.com's team-culture, review-ritual and PR-process rules have been
removed on purpose (see [.ai/divergence.md](.ai/divergence.md)).

## Controlled Fork Rules

The fork/release process docs are authoritative for branch and release behaviour:

- [FORK_PROCESS.md](FORK_PROCESS.md) · [FORK_STRATEGY.md](FORK_STRATEGY.md) · [UPSTREAM_SYNC.md](UPSTREAM_SYNC.md) · [RELEASE_PROCESS.md](RELEASE_PROCESS.md)
- [IMAGE_BUILD.md](IMAGE_BUILD.md) · [SECURITY_REVIEW.md](SECURITY_REVIEW.md) · [CALDIY_RELEASE_CONTRACT.md](CALDIY_RELEASE_CONTRACT.md)
- AI operational layer: [.ai/](.ai/) — index, state, decisions, [sync-log](.ai/sync-log.md), [divergence](.ai/divergence.md)

Durable fork rules:

- `main` is the upstream mirror; `develop` is review/integration; `release` is the reviewed tag/GHCR branch
- no upstream sync, image publish, or commit without explicit approval
- app source changes must be minimal, evidence-based, and reviewed
- security-relevant upstream commits are taken by default (see UPSTREAM_SYNC.md → Security Fix Priority)
- selective upstream intake is one upstream commit per local `git cherry-pick -x`; never
  squash multiple upstream commits into a local aggregate commit
- secrets must never be printed, copied, committed, or exposed
- **do NOT add the `Co-Authored-By: Claude` trailer to commits in this repo**
- `secure-docker-blueprint` is a separate consumer repo; do not treat `latest` as a secure deploy target

## Do

- Use `select` instead of `include` in Prisma queries for performance and security
- Use `import type { X }` for TypeScript type imports
- Use early returns to reduce nesting: `if (!booking) return null;`
- Use `ErrorWithCode` for errors in non-tRPC files (services, repositories, utilities); use `TRPCError` only in tRPC routers
- Use conventional commits: `feat:`, `fix:`, `refactor:`
- Run `yarn type-check:ci --force` before concluding CI failures are unrelated to your changes
- Import directly from source files, not barrel files (e.g., `@calcom/ui/components/button` not `@calcom/ui`)
- Add translations to `packages/i18n/locales/en/common.json` for all UI strings
- Use `date-fns` or native `Date` instead of Day.js when timezone awareness isn't needed
- Put permission checks in `page.tsx`, never in `layout.tsx`
- Use `ast-grep` for searching if available; otherwise use `rg` (ripgrep), then fall back to `grep`
- Use Biome for formatting and linting
- Only add code comments that explain **why**, not **what** — see [quality-code-comments](agents/rules/quality-code-comments.md)

## Don't

- Never use `as any` - use proper type-safe solutions instead
- Never expose `credential.key` field in API responses or queries
- Never commit secrets or API keys
- Never combine multiple upstream commits into one local cherry-pick/squash commit
- Never modify `*.generated.ts` files directly - they're created by app-store-cli
- Never put business logic in repositories - that belongs in Services
- Never use barrel imports from index.ts files
- Never skip running type checks before pushing

## Commands

See [agents/commands.md](agents/commands.md) for the full reference. Key commands:

```bash
yarn type-check:ci --force  # Type check (always run before pushing)
yarn biome check --write .  # Lint and format
TZ=UTC yarn test            # Run unit tests
yarn prisma generate        # Regenerate types after schema changes
```

## Boundaries

### Always do
- Run type check on changed files before committing
- Run relevant tests before pushing
- Use `select` in Prisma queries
- Follow conventional commits for commit/PR titles
- Run Biome before pushing

### Ask first
- Adding new dependencies
- Schema changes to `packages/prisma/schema.prisma`
- Changes affecting multiple packages
- Deleting files
- Running full build or E2E suites

### Never do
- Commit secrets, API keys, or `.env` files
- Expose `credential.key` in any query
- Use `as any` type casting
- Force push or rebase shared branches without explicit approval
- Modify generated files directly

## Diff size

Keep diffs small and single-purpose: aim for **< 500 lines and < 10 code files**
(docs, lockfiles and generated files excluded). Split larger work by layer
(schema → backend → UI) or by dependency order.

## Project Structure

```
apps/web/                    # Main Next.js application
packages/prisma/             # Database schema (schema.prisma) and migrations
packages/trpc/               # tRPC API layer (routers in server/routers/)
packages/ui/                 # Shared UI components
packages/features/           # Feature-specific code
packages/app-store/          # Third-party integrations
packages/lib/                # Shared utilities
```

### Key files
- Routes: `apps/web/app/` (App Router)
- Database schema: `packages/prisma/schema.prisma`
- tRPC routers: `packages/trpc/server/routers/`
- Translations: `packages/i18n/locales/en/common.json`

## Tech Stack

- **Framework**: Next.js (App Router in some areas)
- **Language**: TypeScript (strict)
- **Database**: PostgreSQL with Prisma ORM
- **API**: tRPC for type-safe APIs
- **Auth**: NextAuth.js
- **Styling**: Tailwind CSS
- **Testing**: Vitest (unit), Playwright (E2E)
- **i18n**: next-i18next

## Code Examples

### Good error handling

```typescript
// Good - Descriptive error with context
throw new Error(`Unable to create booking: User ${userId} has no available time slots for ${date}`);

// Bad - Generic error
throw new Error("Booking failed");
```

For which error class to use (`ErrorWithCode` vs `TRPCError`), see [quality-error-handling](agents/rules/quality-error-handling.md).

### Good Prisma query

```typescript
// Good - Use select for performance and security
const booking = await prisma.booking.findFirst({
  select: { id: true, title: true, user: { select: { id: true, name: true, email: true } } }
});

// Bad - Include fetches all fields including sensitive ones
const booking = await prisma.booking.findFirst({ include: { user: true } });
```

### Good imports

```typescript
// Good - Type imports and direct paths
import type { User } from "@prisma/client";
import { Button } from "@calcom/ui/components/button";

// Bad - Regular import for types, barrel imports
import { User } from "@prisma/client";
import { Button } from "@calcom/ui";
```

### API v2 Imports (apps/api/v2)

When importing from `@calcom/features` or `@calcom/trpc` into `apps/api/v2`, **do not import
directly** — the API v2 app's `tsconfig.json` lacks path mappings for these modules, which
causes "module not found" errors. Re-export from `packages/platform/libraries/index.ts` and
import from `@calcom/platform-libraries` instead.

## When Stuck

- Ask a clarifying question before making large speculative changes
- Propose a short plan for complex tasks
- Fix type errors before test failures - they're often the root cause
- Run `yarn prisma generate` if you see missing enum/type errors

## Engineering rules (adopted from upstream)

Modular rules live in [agents/rules/](agents/rules/): architecture, data, API,
performance, patterns, testing, and quality. See [agents/README.md](agents/README.md)
for the index and [agents/knowledge-base.md](agents/knowledge-base.md) for domain knowledge.
