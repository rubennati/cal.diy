# Release Process

## Purpose

This runbook defines how a reviewed `develop` state becomes an immutable release tag and a
traceable GHCR image. Publication is approval-gated and never happens from manual branch
validation.

## Release Invariants

- `main` is the upstream mirror, `develop` is integration/review, and `release` is the
  reviewed publication branch.
- Upstream commits remain individually traceable; selective intake uses one
  `git cherry-pick -x` per upstream commit and never a squash aggregate.
- The tagged `release` source tree must equal the approved `develop` candidate tree.
- A release tag must match `vX.Y.Z-N`, be annotated, and point exactly to
  `origin/release` HEAD.
- Version tags and GHCR tags are immutable identities and must not be overwritten.
- Manual workflow dispatch is validation-only and cannot publish.
- `latest` is convenience metadata, updated only after both architecture jobs succeed;
  downstream must never rely on it.

## 1. Prepare The Candidate On `develop`

1. Confirm the worktree is clean and `develop` matches `origin/develop`.
2. Reconcile [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md).
3. Review every commit pending for release and every fork-owned conflict/adaptation.
4. Run:

```bash
YARN_ENABLE_SCRIPTS=false corepack yarn install --immutable
corepack yarn type-check:ci --force
git diff --check
```

5. Run focused tests for changed security/runtime paths.
6. Run `forte-ci`, CodeQL, and Trivy on `develop` and record known non-blocking findings.
7. Run `Release Docker` manually on `develop`. This builds, runtime-tests, scans, and
   produces SBOM artifacts for AMD64 and ARM64, but cannot publish.

## 2. Promote To `release`

The target model is a source-identical promotion. Do not edit files during promotion.

`release` is a protected branch: it requires a pull request, requires the `ci` check, blocks
force-push, and applies to administrators. **A direct `git push origin release` is refused —
including for the maintainer.** Promotion therefore goes through a pull request like any
other change.

### Normal promotion — pull request, merged with "Create a merge commit"

```bash
git fetch origin --prune --tags

# Confirm release is still contained in develop. If this fails, stop and
# reconcile deliberately on develop; never force-push or reset release.
git merge-base --is-ancestor origin/release origin/develop

# The promotion PR needs a branch; it carries no commits of its own.
git switch --create release-promotion/vX.Y.Z-N origin/develop
git push origin release-promotion/vX.Y.Z-N
```

Open a pull request from that branch into `release`, wait for `ci`, and merge it with
GitHub's **"Create a merge commit"**. Do not use "Squash and merge" or "Rebase and merge".

**Why a merge commit, and why not the alternatives.** All three methods are enabled on this
repository, and only one preserves what the fork's own contracts require:

| Method | Resulting `release` tree | Effect on history |
| --- | --- | --- |
| **Create a merge commit** | **identical to `develop`** — the merge is trivially fast-forwardable, so it takes `develop`'s tree verbatim | keeps every reviewed commit and its SHA, including upstream authorship and `(cherry picked from commit …)` trailers |
| Squash and merge | identical | collapses the whole delta into one synthetic commit — forbidden by [FORK_PROCESS.md](FORK_PROCESS.md) and by [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md)'s `integrated-squashed` rule ("must not be created again") |
| Rebase and merge | identical | rewrites every commit SHA and drops the PR merge commits, invalidating the `Local commit(s)` evidence recorded in [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) and breaking `release`↔`develop` ancestry |

The release workflow checks the **tree**, not the commit SHA
(`release_tree != develop_tree` is the failure condition in
`.github/workflows/release-docker.yaml`), so a merge commit satisfies it exactly. Because
`release` is always an ancestor of `develop` at promotion time, the merge introduces no
content of its own — see the verification below, which proves this rather than assuming it.

### After merging: bring the merge commit back to `develop`

The promotion merge commit exists only on `release`. Merge it back so `release` stays an
ancestor of `develop` for the next cycle — the same pattern the `v6.2.0-5` history already
follows. Do this **after** tagging, so `develop` does not move between the promotion and the
tag; the workflow compares `release` against `origin/develop` at tag time.

## 3. Verify Before Tagging

```bash
git fetch origin --prune --tags

# 1. release contains the approved candidate
git merge-base --is-ancestor origin/develop origin/release

# 2. the trees are identical — this is what release-docker.yaml actually checks
test "$(git rev-parse origin/release^{tree})" = "$(git rev-parse origin/develop^{tree})"

# 3. no release-only diff was introduced by the promotion
git diff --exit-code origin/develop origin/release

# 4. the tag name is still free
git tag --list 'vX.Y.Z-N'
```

All four commands must succeed silently. Check 2 is the one the release workflow enforces;
checks 1 and 3 catch a promotion that carried unintended content.

Then confirm on GitHub that **`forte-ci`, `forte-codeql` and `forte-trivy` each have a
successful `push`-event run on `release` for the exact promoted SHA** — the workflow's
`Require successful release gates for exact source SHA` step queries all three and refuses to
publish otherwise. Merging the promotion PR triggers them; wait for them before tagging.

GitHub branch protection and tag rulesets should require review and prevent
force-push/tag deletion; these repository settings must be verified in GitHub because they
are not versioned in this repository.

## 4. Create And Push The Release Tag

```bash
git switch release
git tag -a vX.Y.Z-N -m "Release vX.Y.Z-N"
git show --no-patch --decorate vX.Y.Z-N
git push origin vX.Y.Z-N
```

The workflow independently rejects malformed/lightweight tags and tags that do not point to
the current `origin/release` head.

## 5. Workflow Publication

For each architecture, the workflow:

1. checks out the validated tag
2. builds one local image
3. runtime-tests that exact image
4. scans that exact image with Trivy (currently report-only)
5. generates a CycloneDX SBOM
6. pushes the exact tested image under a unique workflow staging tag
7. records the staging registry digest

After both architecture jobs succeed, the finalizer verifies both staging digests, refuses
to overwrite existing public version tags, creates the final AMD64 and ARM64 tags, updates
the convenience `latest` tag to AMD64, creates provenance attestations for the final
digests, and uploads `release-record.json`. If either architecture job fails, no public
version tag or `latest` update occurs. GHCR tag creation itself is not transactional; if
the finalizer fails between tag operations, the release is incomplete and all resulting
tags must be inspected before a new build-number release is prepared.

## 6. Release Record And Downstream Handoff

Record:

- release tag and exact source SHA
- upstream base and all accepted upstream ledger entries
- fork-only commits/adaptations
- AMD64 image reference and registry digest
- ARM64 image reference and registry digest
- workflow run URL/ID
- SBOM artifacts and provenance attestation status
- validation commands and known accepted risks
- previous reviewed rollback tag/digest

`secure-docker-blueprint` is a separate repository. It receives a reviewed architecture
specific digest and release metadata; it does not consume `latest`.

## Failure And Rollback Rules

- If tag validation fails, fix branch/tag preparation; do not bypass the workflow check.
- If a build fails after tag push, keep the immutable Git tag as failed release evidence and
  create a new build-number tag after the fix.
- Never delete/reuse a published version tag or overwrite its GHCR tag.
- If only one architecture published, mark the release incomplete and do not hand it off.
- Roll back downstream to a previously recorded digest, never to `latest`.
