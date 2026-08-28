#!/usr/bin/env bash
# Deterministic harness for the release promotion state machine.
#
# The promote job is the one part of the release path that can neither be
# rehearsed nor rolled back: it publishes immutable version tags. Its recovery
# behaviour therefore has to be established before a release, not during one.
#
# The `reconcile()` below is the workflow's function with exactly two
# substitutions — the registry write and the failure exit — and
# `assert_no_drift` verifies that those are the ONLY differences. A harness that
# silently tests a stale copy of the logic is worse than no harness.
#
# Registry state is simulated in a temp directory (no `declare -A`, so this runs
# on macOS's bash 3.2 as well as the runners' bash 5). Nothing is pulled,
# pushed or built.

set -uo pipefail

WANT_AMD="sha256:aaaa000000000000000000000000000000000000000000000000000000000000"
WANT_ARM="sha256:bbbb000000000000000000000000000000000000000000000000000000000000"
OTHER="sha256:cccc000000000000000000000000000000000000000000000000000000000000"
IMAGE_NAME="ghcr.io/rubennati/cal.diy"

REG="$(mktemp -d)"
trap 'rm -rf "$REG"' EXIT
key() { printf '%s' "$1" | tr -c 'A-Za-z0-9' '_'; }
reg_reset() { rm -rf "${REG:?}"/*; }
reg_set() { printf '%s' "$2" > "$REG/$(key "$1")"; }
reg_get() { cat "$REG/$(key "$1")" 2>/dev/null || true; }

digest_of() { reg_get "$1"; }
fake_create() { reg_set "$2" "${3##*@}"; }   # --tag <ref> <image@digest>

# --- workflow logic; only the two marked lines differ from release-docker.yaml
reconcile() {
  local ref="$1" want="$2" have
  have="$(digest_of "$ref")"
  if [[ -z "$have" ]]; then
    fake_create --tag "$ref" "$IMAGE_NAME@$want"
    have="$(digest_of "$ref")"
    if [[ "$have" != "$want" ]]; then
      echo "::error::$ref resolved to $have after creation, expected $want"
      return 1
    fi
    echo "created  $ref -> $have"
  elif [[ "$have" == "$want" ]]; then
    echo "existing $ref already resolves to $have; nothing to do"
  else
    echo "::error::$ref already exists and points to $have, not the validated $want."
    echo "::error::A published version tag is immutable and will not be redirected."
    return 1
  fi
}
# ----------------------------------------------------------------------------

AMD_REF="$IMAGE_NAME:v9.9.9-1"
ARM_REF="$IMAGE_NAME:v9.9.9-1-arm"
pass=0; fail=0

check() { # <name> <expected rc> <expected amd> <expected arm>
  local name="$1" want_rc="$2" want_amd="$3" want_arm="$4" rc=0
  reconcile "$AMD_REF" "$WANT_AMD" >/dev/null 2>&1 || rc=1
  if [[ $rc -eq 0 ]]; then reconcile "$ARM_REF" "$WANT_ARM" >/dev/null 2>&1 || rc=1; fi
  local got_amd got_arm
  got_amd="$(reg_get "$AMD_REF")"; [[ -z "$got_amd" ]] && got_amd="<absent>"
  got_arm="$(reg_get "$ARM_REF")"; [[ -z "$got_arm" ]] && got_arm="<absent>"
  if [[ "$rc" == "$want_rc" && "$got_amd" == "$want_amd" && "$got_arm" == "$want_arm" ]]; then
    printf '  PASS  %s\n' "$name"; pass=$((pass+1))
  else
    printf '  FAIL  %s\n        rc=%s want %s | amd=%s want %s | arm=%s want %s\n' \
      "$name" "$rc" "$want_rc" "$got_amd" "$want_amd" "$got_arm" "$want_arm"; fail=$((fail+1))
  fi
}

echo "=== promotion reconcile ==="
reg_reset
check "no final tags -> both created" 0 "$WANT_AMD" "$WANT_ARM"

reg_reset; reg_set "$AMD_REF" "$WANT_AMD"
check "AMD64 already correct, ARM64 absent -> ARM64 created" 0 "$WANT_AMD" "$WANT_ARM"

reg_reset; reg_set "$AMD_REF" "$WANT_AMD"; reg_set "$ARM_REF" "$WANT_ARM"
check "both already correct -> no-op, release completes" 0 "$WANT_AMD" "$WANT_ARM"

reg_reset; reg_set "$AMD_REF" "$OTHER"
check "AMD64 has a different digest -> fail hard, not redirected" 1 "$OTHER" "<absent>"

reg_reset; reg_set "$AMD_REF" "$WANT_AMD"; reg_set "$ARM_REF" "$OTHER"
check "ARM64 has a different digest -> fail hard, AMD64 untouched" 1 "$WANT_AMD" "$OTHER"

echo
echo "=== latest pointer (mutable, so repeating must be safe) ==="
reg_reset
latest_move() { # idempotent move of `latest` onto the release AMD64 digest
  local have; have="$(digest_of "$IMAGE_NAME:latest")"
  [[ "$have" != "$WANT_AMD" ]] && fake_create --tag "$IMAGE_NAME:latest" "$IMAGE_NAME@$WANT_AMD"
  digest_of "$IMAGE_NAME:latest"
}
a="$(latest_move)"; b="$(latest_move)"
if [[ "$a" == "$WANT_AMD" && "$b" == "$WANT_AMD" ]]; then
  echo "  PASS  latest converges and is stable across repeats"; pass=$((pass+1))
else
  echo "  FAIL  latest: first=$a second=$b want $WANT_AMD"; fail=$((fail+1))
fi

echo
echo "=== GitHub Release reconcile ==="
release_state() { # <exists> <body mentions both digests> -> action
  [[ "$1" != "yes" ]] && { echo "create"; return 0; }
  [[ "$2" != "yes" ]] && { echo "fail"; return 1; }
  echo "complete-assets"
}
rcheck() {
  local got; got="$(release_state "$2" "$3")" || true
  if [[ "$got" == "$4" ]]; then printf '  PASS  %s -> %s\n' "$1" "$got"; pass=$((pass+1))
  else printf '  FAIL  %s -> %s want %s\n' "$1" "$got" "$4"; fail=$((fail+1)); fi
}
rcheck "Release absent"                   no  no  create
rcheck "Release present and consistent"   yes yes complete-assets
rcheck "Release present but inconsistent" yes no  fail

echo
echo "=== harness tests the SHIPPED logic, not a stale copy ==="
assert_no_drift() {
  local wf=".github/workflows/release-docker.yaml" self="${BASH_SOURCE[0]}"
  [[ -f "$wf" ]] || { echo "  SKIP  $wf not found (run from the repository root)"; return 0; }
  extract() { sed -n '/^ *reconcile() {$/,/^ *}$/p' "$1" | sed 's/^[[:space:]]*//' | grep -v '^$'; }
  # The two intended substitutions, normalised away; anything else is drift.
  normalise() { sed -e 's/docker buildx imagetools create/fake_create/' -e 's/^exit 1$/return 1/'; }
  if diff -q <(extract "$wf" | normalise) <(extract "$self" | normalise) >/dev/null 2>&1; then
    echo "  PASS  reconcile() matches $wf (modulo the registry stub and exit/return)"
    return 0
  fi
  echo "  FAIL  reconcile() has drifted from $wf"
  diff <(extract "$wf" | normalise) <(extract "$self" | normalise) | head -20
  return 1
}
if assert_no_drift; then pass=$((pass+1)); else fail=$((fail+1)); fi

echo
echo "$pass passed, $fail failed"
[[ $fail -eq 0 ]]
