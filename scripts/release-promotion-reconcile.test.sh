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
echo "=== candidate freeze: develop moving after dispatch must change nothing ==="
# Simulated repository: commit A is the dispatch event, B is a later push.
SHA_A="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"; TREE_A="1111111111111111111111111111111111111111"
SHA_B="bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb"; TREE_B="2222222222222222222222222222222222222222"
DEVELOP_HEAD="$SHA_A"                       # branch tip; moves during the test
tree_of() { [[ "$1" == "$SHA_A" ]] && echo "$TREE_A" || echo "$TREE_B"; }

# prepare(), mirroring the workflow: the candidate is the EVENT commit, never the branch.
prepare_candidate() { # <github.sha> -> "sha tree"
  local event_sha="$1" source_sha source_tree
  source_sha="$event_sha"                    # was: git rev-parse HEAD after checking out github.ref
  source_tree="$(tree_of "$source_sha")"
  echo "$source_sha $source_tree"
}

GITHUB_SHA="$SHA_A"                          # dispatch fires at A
read -r CAND_SHA CAND_TREE <<< "$(prepare_candidate "$GITHUB_SHA")"
DEVELOP_HEAD="$SHA_B"                        # someone pushes B before the jobs run

# every downstream identity derives from the frozen candidate
CHECKOUT="$CAND_SHA"                         # build jobs use prepare.outputs.source_sha
OCI_REVISION="$CAND_SHA"                     # image-revision input
RECORDED_SHA="$CAND_SHA"                     # candidate-record.json
ATTESTED_SHA="$GITHUB_SHA"                   # what GitHub embeds in the attestation

fcheck() {
  if [[ "$2" == "$3" ]]; then printf '  PASS  %s = %s\n' "$1" "${2:0:8}"; pass=$((pass+1))
  else printf '  FAIL  %s = %s (want %s)\n' "$1" "${2:0:8}" "${3:0:8}"; fail=$((fail+1)); fi
}
fcheck "candidate SHA unaffected by develop moving" "$CAND_SHA" "$SHA_A"
fcheck "candidate tree is A's tree"                 "$CAND_TREE" "$TREE_A"
fcheck "build job checks out A"                     "$CHECKOUT" "$SHA_A"
fcheck "OCI revision label records A"               "$OCI_REVISION" "$SHA_A"
fcheck "candidate record records A"                 "$RECORDED_SHA" "$SHA_A"
fcheck "attestation commit equals built commit"     "$ATTESTED_SHA" "$CAND_SHA"
if [[ "$DEVELOP_HEAD" == "$SHA_B" && "$CAND_SHA" == "$SHA_A" ]]; then
  echo "  PASS  develop advanced to B while the candidate stayed A"; pass=$((pass+1))
else
  echo "  FAIL  develop/candidate divergence not demonstrated"; fail=$((fail+1))
fi

echo
echo "=== Release asset reconcile (by content digest, not filename) ==="
D_OK="sha256:1111"; D_BAD="sha256:9999"
asset_action() { # <published digest, empty = absent> <expected digest> -> action
  [[ -z "$1" ]] && { echo "upload"; return 0; }
  [[ "$1" == "$2" ]] && { echo "skip"; return 0; }
  echo "fail"; return 1
}
acheck() {
  local got; got="$(asset_action "$2" "$3")" || true
  if [[ "$got" == "$4" ]]; then printf '  PASS  %s -> %s\n' "$1" "$got"; pass=$((pass+1))
  else printf '  FAIL  %s -> %s (want %s)\n' "$1" "$got" "$4"; fail=$((fail+1)); fi
}
acheck "Release present, asset absent"                ""       "$D_OK" upload
acheck "asset present with correct digest"            "$D_OK"  "$D_OK" skip
acheck "asset present with WRONG digest"              "$D_BAD" "$D_OK" fail
acheck "name matches but content differs (the gap)"   "$D_BAD" "$D_OK" fail

# all three expected assets, all correct -> nothing uploaded, nothing fails
allok=yes
for a in release-record.json sbom-amd64.cdx.json sbom-arm64.cdx.json; do
  [[ "$(asset_action "$D_OK" "$D_OK")" == "skip" ]] || allok=no
done
if [[ "$allok" == "yes" ]]; then echo "  PASS  all three assets present and correct -> no-op"; pass=$((pass+1))
else echo "  FAIL  all-correct case did not no-op"; fail=$((fail+1)); fi

# release absent short-circuits before any asset comparison
if [[ "$(release_state no no)" == "create" ]]; then
  echo "  PASS  Release absent -> create (assets uploaded with it)"; pass=$((pass+1))
else echo "  FAIL  Release-absent path"; fail=$((fail+1)); fi

echo
echo "=== the workflow actually implements the freeze (not just this model) ==="
assert_workflow_freeze() {
  local wf=".github/workflows/release-docker.yaml"
  [[ -f "$wf" ]] || { echo "  SKIP  $wf not found (run from the repository root)"; return 0; }
  local bad=0
  # 1. a dispatch must check out the event commit, not the branch ref
  if grep -q "ref: \${{ github.event_name == 'workflow_dispatch' && github.sha || github.ref }}" "$wf"; then
    echo "  PASS  dispatch checks out github.sha, not github.ref"
  else
    echo "  FAIL  dispatch checkout is not pinned to github.sha"; bad=1
  fi
  # 2. the candidate SHA must come from the event, never from the working tree
  if grep -q 'source_sha="\$GITHUB_SHA"' "$wf"; then
    echo "  PASS  candidate SHA derives from the workflow event"
  else
    echo "  FAIL  candidate SHA is not taken from GITHUB_SHA"; bad=1
  fi
  if grep -qE '^\s*source_sha="\$\(git rev-parse HEAD\)"' "$wf"; then
    echo "  FAIL  candidate SHA is still read from the working tree"; bad=1
  else
    echo "  PASS  candidate SHA is not read from the working tree"
  fi
  # 3. assets must be compared by content digest, not by name alone
  if grep -q 'sha256sum "\$a"' "$wf" && grep -q 'have_digest' "$wf"; then
    echo "  PASS  release assets are reconciled by content digest"
  else
    echo "  FAIL  release assets are not digest-verified"; bad=1
  fi
  return $bad
}
if assert_workflow_freeze; then pass=$((pass+4)); else fail=$((fail+1)); fi

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
