#!/usr/bin/env bash
# Regression tests for scripts/fork-guard-telemetry.sh.
#
# Both directions are asserted: a guard that never fires and a guard that always fires are
# equally useless. The always-fires case is not hypothetical — the documentation exclusion
# below exists because the guard failed `develop` for naming the flag it had removed.
#
# Fixtures run in throwaway git repos. The real working tree is never touched and nothing is
# added to its index. The protected literals are assembled at run time from fragments so that
# this file does not contain them contiguously — otherwise it would need its own entry in the
# very exclusion list under test.
#
# Run locally:  yarn fork:guard:telemetry:test
# Runs in CI:   .github/workflows/forte-ci.yml

set -euo pipefail

guard="$(cd "$(dirname "$0")" && pwd)/fork-guard-telemetry.sh"
[ -f "$guard" ] || { echo "guard not found: $guard" >&2; exit 1; }

join() { local IFS=''; printf '%s' "$*"; }
ENDPOINT="$(join 't.calendso' '.' 'com')"
FLAG="$(join 'CALCOM_TELEMETRY' '_DISABLED')"
WRITE_KEY="$(join 's2s.2pvs2bbpqq1zxna97wcml' '.' 'esb6cikfrf7yn0qoh1nj1')"
NEXT_COLLECT="$(join '"next' '-collect"')"

passed=0
failed=0

# One parent directory for every fixture: fixture_repo runs inside a command substitution,
# so anything it appends to a shell array would be lost with the subshell. Nesting the
# fixtures under WORK keeps cleanup to a single unconditional rm, which also avoids a
# conditional as the EXIT trap's last command — that leaks its status into the exit code.
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

# Builds a minimal repo containing only the guard, so unrelated repository content cannot
# influence the result.
fixture_repo() {
  local dir
  dir="$(mktemp -d "$WORK/fixture.XXXXXX")"
  git -C "$dir" init -q
  git -C "$dir" config user.email "guard-test@example.invalid"
  git -C "$dir" config user.name "guard test"
  mkdir -p "$dir/scripts"
  cp "$guard" "$dir/scripts/fork-guard-telemetry.sh"
  printf '%s' "$dir"
}

write() { mkdir -p "$(dirname "$1/$2")"; printf '%s\n' "$3" > "$1/$2"; }

run_guard() {
  local dir="$1" rc=0
  git -C "$dir" add -A >/dev/null 2>&1
  bash "$dir/scripts/fork-guard-telemetry.sh" >/dev/null 2>&1 || rc=$?
  printf '%s' "$rc"
}

# expect_pass/expect_fail: exit 0 means "telemetry stays removed", exit 1 means the guard fired.
assert() {
  local name="$1" want="$2" got="$3"
  if [ "$want" = "$got" ]; then
    printf '  ok    %s\n' "$name"
    passed=$((passed + 1))
  else
    printf '  FAIL  %s — expected exit %s, got %s\n' "$name" "$want" "$got"
    failed=$((failed + 1))
  fi
}

echo "fork-guard telemetry — regression tests"
echo
echo "documentation must NOT trip the guard (exit 0):"

d="$(fixture_repo)"
write "$d" "docs/AUDIT_EVIDENCE.md" "The fork removed the $ENDPOINT endpoint and the $FLAG flag."
assert "root-level docs/*.md may name endpoint and flag" 0 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "FORK_IMPLEMENTATION_LEDGER.md" "Removed: $FLAG, key $WRITE_KEY, host $ENDPOINT."
assert "root governance *.md may name endpoint, key and flag" 0 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" ".ai/hardening-checklist.md" "$FLAG was removed; it gates nothing."
assert ".ai/*.md may name the flag" 0 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "apps/docs/content/troubleshooting.mdx" "Note: $FLAG is not used by this fork."
assert "*.mdx may name the flag" 0 "$(run_guard "$d")"

d="$(fixture_repo)"
assert "clean repository passes" 0 "$(run_guard "$d")"

echo
echo "executable / configuration surfaces MUST trip the guard (exit 1):"

d="$(fixture_repo)"
write "$d" "packages/lib/analytics.ts" "export const flag = process.env.$FLAG;"
assert "TypeScript source" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "apps/web/lib/collect.js" "const host = '$ENDPOINT';"
assert "JavaScript source" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "packages/lib/key.mjs" "export const k = '$WRITE_KEY';"
assert "ESM source carrying the write key" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "scripts/deploy.sh" "export $FLAG=1"
assert "shell script" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "Dockerfile" "ARG $FLAG=1"
assert "Dockerfile" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" ".github/workflows/deploy.yml" "  build-args: $FLAG=1"
assert "CI workflow YAML" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" ".ai/generated-config.yml" "flag: $FLAG"
assert "non-Markdown file under .ai/ (blanket directory exemption is gone)" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" ".env.example" "$FLAG=1"
assert "environment configuration example" 1 "$(run_guard "$d")"

# The reason the exclusion is by extension and not by directory.
d="$(fixture_repo)"
write "$d" "docs/deploy.sh" "export $FLAG=1"
assert "executable moved under docs/ cannot bypass the guard" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "packages/lib/telemetry.ts" "// restored"
assert "restored packages/lib/telemetry.ts" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "package.json" "{ \"dependencies\": { $NEXT_COLLECT: \"^1.0.0\" } }"
assert "next-collect declared in package.json" 1 "$(run_guard "$d")"

d="$(fixture_repo)"
write "$d" "yarn.lock" "\"next-collect@npm:1.0.0\":"
assert "next-collect present in yarn.lock" 1 "$(run_guard "$d")"

echo
echo "the documentation exclusion is what makes the positive cases pass:"

# Strip the *.md exclusion back out and confirm the original failure returns. This is the
# PR #41 condition, reproduced rather than asserted.
d="$(fixture_repo)"
sed -i.bak "/':\!\*\.md'/d" "$d/scripts/fork-guard-telemetry.sh"
rm -f "$d/scripts/fork-guard-telemetry.sh.bak"
write "$d" "docs/AUDIT_EVIDENCE.md" "The fork removed the $FLAG flag."
assert "without the *.md exclusion, documentation trips the guard again" 1 "$(run_guard "$d")"

echo
if [ "$failed" -ne 0 ]; then
  printf '\033[31m%s passed, %s FAILED\033[0m\n' "$passed" "$failed"
  exit 1
fi
printf '\033[32mfork-guard telemetry tests: %s passed\033[0m\n' "$passed"
exit 0
