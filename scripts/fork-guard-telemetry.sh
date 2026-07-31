#!/usr/bin/env bash
# Fork guard: upstream's Jitsu usage-telemetry must not come back through a sync.
#
# Upstream removed `next-collect` (#25146) but left packages/lib/telemetry.ts behind with a
# live Jitsu server-to-server write key and endpoint. It was unreachable — no importers, no
# middleware, no dependency — but a later upstream merge restoring any of those pieces would
# have re-armed it silently. This fork deleted the module; this check makes that deletion
# enforceable instead of a one-time cleanup.
#
# Run locally:  yarn fork:guard:telemetry
# Runs in CI:   .github/workflows/forte-ci.yml (blocking)

set -euo pipefail

cd "$(dirname "$0")/.."

fail=0
report() {
  printf '\n\033[31mFORK GUARD FAILED\033[0m — %s\n' "$1"
  fail=1
}

# Only tracked files, so a stray local build artefact or an unrelated node_modules copy
# cannot fail the build.
tracked_grep() {
  git grep -n --fixed-strings -- "$1" -- \
    ':!scripts/fork-guard-telemetry.sh' \
    ':!.ai/' \
    ':!.github/workflows/forte-ci.yml' \
    2>/dev/null || true
}

# 1. The dependency that would make the module functional again.
if git grep -n --fixed-strings '"next-collect"' -- '*package.json' >/dev/null 2>&1; then
  report "next-collect is declared as a dependency again:"
  git grep -n --fixed-strings '"next-collect"' -- '*package.json'
fi

if [ -f yarn.lock ] && grep -q 'next-collect' yarn.lock; then
  report "next-collect appears in yarn.lock."
fi

# 2. The endpoint and the inherited write key, wherever they resurface.
for needle in "t.calendso.com" "s2s.2pvs2bbpqq1zxna97wcml.esb6cikfrf7yn0qoh1nj1"; do
  hits="$(tracked_grep "$needle")"
  if [ -n "$hits" ]; then
    report "the upstream telemetry endpoint/key is back in tracked source:"
    printf '%s\n' "$hits"
  fi
done

# 3. The module itself, and the flag that pretended to control it.
if [ -f packages/lib/telemetry.ts ]; then
  report "packages/lib/telemetry.ts was restored — delete it again (see .ai/divergence.md)."
fi

hits="$(tracked_grep "CALCOM_TELEMETRY_DISABLED")"
if [ -n "$hits" ]; then
  report "CALCOM_TELEMETRY_DISABLED is back. It gates nothing in this fork; re-adding it
  documents a privacy control that does not exist. Remove it from:"
  printf '%s\n' "$hits"
fi

if [ "$fail" -ne 0 ]; then
  printf '\nSee .ai/divergence.md → "Fork-removed upstream paths" before overriding.\n\n'
  exit 1
fi

echo "fork-guard: telemetry stays removed ✓"
