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
- **The published artifact is the validated artifact.** Application images are built
  exactly once, during candidate validation. Tagging promotes those immutable digests;
  it never rebuilds.
- Candidate evidence is keyed by the source **tree**, not the commit SHA. Promotion
  deliberately creates a new merge commit whose tree is identical to the approved
  candidate, so the tree is what proves "same source" — the SHA cannot.
- The hand-off identity between validation and publication is a **digest** recorded in a
  `candidate-record-<tree>` artifact. Candidate image tags are garbage-collection handles
  and are never trusted as the hand-off identity.
- Releasing requires no local Docker daemon. Every artifact assertion happens in CI, on
  native runners, against the exact image that is published.
- `latest` is convenience metadata, updated only after promotion succeeds;
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
7. Run `Release Docker` manually on `develop`. **This is the only time application images
   are built in the release path.** It builds AMD64 and ARM64 natively, runtime-tests each
   exact image, asserts the root `LICENSE` byte-for-byte inside it, scans it, generates its
   CycloneDX SBOM, pushes it to a tree-keyed candidate tag, and records both immutable
   digests in a `candidate-record-<tree>` artifact. It cannot publish a release tag.

   If `develop` moves after this run, the candidate record no longer matches the tree and
   publication will refuse to proceed — re-run the dispatch on the new candidate.

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

Pushing the tag runs `Release Docker` in **promotion** mode. It builds nothing.

`prepare`:

1. rejects a malformed or lightweight tag, or one not pointing at `origin/release` HEAD
2. rejects a `release` tree that differs from `origin/develop`
3. requires successful `forte-ci`, `forte-codeql` and `forte-trivy` push runs for the exact
   release SHA
4. locates the `candidate-record-<tree>` artifact for this exact tree and reads both
   validated digests from it — **if no unexpired record exists for this tree, the release
   stops here.** There is no fallback that builds something new

`promote`:

5. resolves each recorded digest directly in the registry, by digest, not by candidate tag
6. refuses to overwrite an existing final version tag
7. creates the final `vX.Y.Z-N` and `vX.Y.Z-N-arm` tags from those exact digests with
   `docker buildx imagetools create`
8. updates the convenience `latest` tag to the AMD64 digest
9. attests SLSA build provenance for both final digests
10. downloads the candidate SBOMs produced against those same images
11. writes `release-record.json`
12. creates the GitHub Release, generating its facts **from `release-record.json`** and
    attaching both SBOMs and the record itself

Step 12 is why release facts cannot drift between the artifacts and the announcement: the
published table is rendered from the same JSON the pipeline emitted. Hand-written prose for
a release is optional and lives at `docs/release-notes/vX.Y.Z-N.md` in the release tree; when
present it is prepended verbatim, when absent the Release carries the artifact record alone.

Because no image is rebuilt, the digest published under `vX.Y.Z-N` is byte-identical to the
image that passed the runtime test, the `LICENSE` assertion and the Trivy scan during
candidate validation. Verifying the release therefore requires no local Docker daemon —
and the release contract does not ask for one.

**Non-transactional caveat, unchanged.** GHCR tag creation is not atomic. If promotion fails
between tag operations the release is incomplete, and all resulting tags must be inspected
before preparing a new build-number release.

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
