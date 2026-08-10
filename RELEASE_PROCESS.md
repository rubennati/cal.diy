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

### One-time historical ancestry reconciliation

As of 2026-08-10, `origin/release` has five release-only commits ending at `f99367c3a7`
and is not an ancestor of `origin/develop`. Therefore the first promotion under this
process cannot fast-forward until that topology is reconciled. Do not force-push or reset
the protected `release` branch.

Use a dedicated reviewed branch from the then-current `origin/develop`. Record the old
release history as ancestry with an **ours-strategy merge**; this preserves the reviewed
`develop` tree while making `origin/release` an ancestor:

```bash
git fetch origin --prune --tags
git switch --create codex/reconcile-release-ancestry origin/develop
git merge --strategy=ours --no-ff origin/release \
  -m "chore(release): reconcile historical release ancestry"
git diff --exit-code HEAD^1..HEAD
git merge-base --is-ancestor origin/release HEAD
```

The empty-tree merge commit must be reviewed, pass all `develop` gates, and reach
`origin/develop` through the normal approved push/PR path. Only then use the fast-forward
promotion below. This is a one-time topology repair, not a general release technique.

### Normal fast-forward promotion

```bash
git fetch origin --prune --tags
git switch release
git merge --ff-only origin/develop
git diff --exit-code origin/develop..release
git push origin release
```

If fast-forward is impossible, stop. Do not create an ad-hoc release merge or resolve
conflicts during promotion. Reconcile branch history deliberately on `develop`, rerun all
gates, and try again.

Until the one-time reconciliation is complete, stop before promotion. Do not replace the
fast-forward with a release-side merge merely because `--ff-only` fails.

## 3. Verify Before Tagging

```bash
git fetch origin --prune --tags
git diff --exit-code origin/develop..origin/release
git status --short --branch
git log --oneline origin/release..origin/develop
git tag --list 'vX.Y.Z-N'
```

Confirm `forte-ci` succeeded for the exact `release` SHA. GitHub branch protection and tag
rulesets should require review and prevent force-push/tag deletion; these repository
settings must be verified in GitHub because they are not versioned in this repository.

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
