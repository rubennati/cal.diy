#!/usr/bin/env bash
# Fork guard: the PBAC placeholders must never grant permission.
#
# Upstream `ab21c7f805` (#28903) deleted `packages/features/pbac/` and pasted a permissive
# `PermissionCheckService` placeholder into each of its former consumers, every one of which
# answered `checkPermission` with an unconditional `true`. That is fail-open authorization in a
# function named `checkPermission`, and nothing catches it: the placeholders type-check cleanly,
# Biome has no opinion on them, and CodeQL has no notion of an owner-scoped permission.
#
# cal.forte contains this by making the placeholders deny (issue #13). PBAC remains
# UNIMPLEMENTED; it now fails CLOSED. This guard stops an upstream sync from silently restoring
# the permissive form.
#
# Deliberately scoped: it reads only the body of each `class PermissionCheckService`, so an
# unrelated `return true` anywhere else in these files is not its business.
#
# TEMPORARY. When a real permission implementation lands, this guard should be replaced by that
# implementation's own tests rather than carried forward.
set -euo pipefail

cd "$(dirname "$0")/.."

# Every file known to declare a placeholder, as reviewed for issue #13.
EXPECTED_FILES="packages/features/bookings/services/BookingAccessService.ts
packages/features/di/watchlist/containers/watchlist.ts
packages/features/eventtypes/lib/getEventTypesByViewer.ts
packages/features/eventtypes/lib/getPublicEvent.ts
packages/features/watchlist/lib/service/OrganizationWatchlistOperationsService.ts
packages/features/watchlist/lib/service/OrganizationWatchlistQueryService.ts
packages/features/webhooks/lib/repository/WebhookRepository.ts
packages/trpc/server/procedures/pbacProcedures.ts
packages/trpc/server/routers/loggedInViewer/teamsAndUserProfilesQuery.handler.ts
packages/trpc/server/routers/viewer/bookings/get.handler.ts
packages/trpc/server/routers/viewer/eventTypes/getActiveOnOptions.handler.ts
packages/trpc/server/routers/viewer/eventTypes/getUserEventGroups.handler.ts
packages/trpc/server/routers/viewer/eventTypes/heavy/create.handler.ts
packages/trpc/server/routers/viewer/eventTypes/teamAccessUseCase.ts
packages/trpc/server/routers/viewer/eventTypes/util.ts
packages/trpc/server/routers/viewer/me/checkForInvalidAppCredentials.ts
packages/trpc/server/routers/viewer/me/get.handler.ts
packages/trpc/server/routers/viewer/ooo/outOfOffice.utils.ts"

# Discover what actually declares one now, so a placeholder added to a NEW file is caught too.
actual="$(git grep -l 'class PermissionCheckService' -- '*.ts' '*.tsx' 2>/dev/null | sort || true)"
expected="$(printf '%s\n' "$EXPECTED_FILES" | sort)"

if [ -z "$actual" ]; then
  echo "FAIL: no PermissionCheckService placeholder found at all." >&2
  echo "      Either PBAC was implemented (then retire this guard) or the guard can no" >&2
  echo "      longer see the code it protects. Both need a human." >&2
  exit 1
fi

if [ "$actual" != "$expected" ]; then
  echo "FAIL: the set of PBAC placeholder files changed." >&2
  echo "  only in the tree (new placeholder?):" >&2
  comm -23 <(printf '%s\n' "$actual") <(printf '%s\n' "$expected") | sed 's/^/    + /' >&2
  echo "  only in this guard (moved or removed?):" >&2
  comm -13 <(printf '%s\n' "$actual") <(printf '%s\n' "$expected") | sed 's/^/    - /' >&2
  echo >&2
  echo "Re-review against issue #13, then update EXPECTED_FILES deliberately." >&2
  exit 1
fi

violations=""
checked=0
while IFS= read -r file; do
  [ -n "$file" ] || continue
  # Only the class body — an unrelated `return true` elsewhere in the file is not in scope.
  body="$(awk '/class PermissionCheckService/{inside=1} inside{print} inside&&/^}/{exit}' "$file")"
  if [ -z "$body" ]; then
    echo "FAIL: could not read the placeholder body in $file" >&2
    exit 1
  fi
  # Collapse to one line so single-line and multi-line method bodies read alike.
  flat="$(printf '%s' "$body" | tr '\n' ' ')"
  case "$flat" in
    *"checkPermission"*"return true"*|*"hasPermission"*"return true"*)
      violations="$violations $file" ;;
  esac
  checked=$((checked + 1))
done <<< "$actual"

if [ "$violations" != "" ]; then
  echo "FAIL: PBAC placeholder grants permission in:" >&2
  for f in $violations; do echo "  - $f" >&2; done
  echo >&2
  echo "While PBAC is unimplemented these must deny. See issue #13 and FORK_DIVERGENCE.md." >&2
  exit 1
fi

echo "OK: all $checked PBAC placeholders fail closed."
