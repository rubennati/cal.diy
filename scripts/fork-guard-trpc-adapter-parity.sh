#!/usr/bin/env bash
# Fork guard: every `viewerRouter` key must have a Next pages-API tRPC adapter.
#
# The tRPC surface is a three-leg contract — client endpoint registry, `viewerRouter`
# key, Next API adapter. Removing one leg while the others stay wired type-checks and
# lints cleanly and fails only at runtime, as an HTML 404 that never reaches tRPC. That
# is how the `apiKeys` route broke in `ab21c7f805` and stayed broken across five
# releases (issue #32).
#
# Scope is deliberately one direction: key -> adapter. The reverse direction (orphan
# client entries, the stale `appsRouter` duplicate, the intentional `viewer` alias) is
# issue #34 and is NOT checked here — those need an allow-list this guard should not own.
set -euo pipefail

cd "$(dirname "$0")/.."

ROUTER_FILE="packages/trpc/server/routers/viewer/_router.tsx"
ADAPTER_ROOT="apps/web/pages/api/trpc"

# A guard that silently matches nothing is worse than no guard: it reports success
# forever after a refactor moves the file. Fail loudly instead.
MIN_EXPECTED_KEYS=20

if [ ! -f "$ROUTER_FILE" ]; then
  echo "FAIL: viewer router not found at $ROUTER_FILE (moved? this guard needs updating)" >&2
  exit 1
fi
if [ ! -d "$ADAPTER_ROOT" ]; then
  echo "FAIL: adapter root not found at $ADAPTER_ROOT (moved? this guard needs updating)" >&2
  exit 1
fi

# Keys inside `router({ ... })`, covering both `key: someRouter,` and shorthand `someRouter,`.
keys="$(
  awk '/^export const viewerRouter = router\(\{/{inside=1;next} inside&&/^\}\);/{inside=0} inside' "$ROUTER_FILE" \
    | sed -E 's;//.*;;' \
    | grep -oE '^[[:space:]]*[A-Za-z0-9_]+' \
    | sed 's/[[:space:]]//g' \
    | sort -u
)"

key_count="$(printf '%s\n' "$keys" | grep -c . || true)"
if [ "$key_count" -lt "$MIN_EXPECTED_KEYS" ]; then
  echo "FAIL: parsed only $key_count viewerRouter keys (expected >= $MIN_EXPECTED_KEYS)." >&2
  echo "      The router shape changed and this guard can no longer read it." >&2
  exit 1
fi

missing=""
while IFS= read -r key; do
  [ -n "$key" ] || continue
  if [ ! -f "$ADAPTER_ROOT/$key/[trpc].ts" ]; then
    missing="$missing $key"
  fi
done <<< "$keys"

if [ -n "$missing" ]; then
  echo "FAIL: viewerRouter keys with no Next API adapter:" >&2
  for key in $missing; do
    echo "  - $key  (expected $ADAPTER_ROOT/$key/[trpc].ts)" >&2
  done
  echo >&2
  echo "Every registered viewerRouter key needs an adapter or its calls 404 before" >&2
  echo "reaching tRPC. See issue #32; the parity work in both directions is issue #34." >&2
  exit 1
fi

echo "OK: all $key_count viewerRouter keys have a Next API adapter."
