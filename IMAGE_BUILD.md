# Image Build

## Source Of Truth

The deployable artifact is the GHCR image produced from a validated annotated tag on
`release` by [.github/workflows/release-docker.yaml](.github/workflows/release-docker.yaml).
The root [Dockerfile](Dockerfile) builds the web image; the API v2 Dockerfile is not part of
the current fork release artifact.

## Workflow Modes

### Manual validation

`workflow_dispatch` checks out the selected ref and builds AMD64 and ARM64 with synthetic
validation tags. It runtime-tests, scans, and generates SBOMs but has read-only package
permissions and cannot publish.

### Tag publication

A pushed tag publishes only if all source-identity checks pass:

- annotated tag
- exact `vX.Y.Z-N` format
- tag commit equals current `origin/release` HEAD
- no existing architecture tag would be overwritten

Architecture jobs push the exact tested images under unique workflow staging tags. Only
after both succeed does the finalizer create `vX.Y.Z-N` for AMD64 and `vX.Y.Z-N-arm` for
ARM64. The finalizer then moves `latest` to AMD64. Registry retagging is not transactional:
if finalization fails between tag operations, treat the release as incomplete and inspect
all public tags before retrying. `latest` is convenience only and is not a downstream trust
input.

## Artifact Integrity

Each architecture is built once. The same local image is runtime-tested, scanned, assigned
an SBOM, and then pushed with `docker push`; there is no second untested rebuild. The
registry digest is read after push and exposed as a job output.

The release promote job uploads `release-record.json` containing source SHA, source tree,
architecture image references, final architecture digests, the validated candidate digests
those were promoted from, the candidate validation run, the publication run ID, and the
convenience `latest` digest. GitHub build-provenance attestations are pushed for both final
architecture digests, and the GitHub Release is generated from that same record.

**Images are built exactly once.** The build happens during candidate validation on
`develop`; publication promotes the recorded immutable digests with
`docker buildx imagetools create` and rebuilds nothing. The digest published under
`vX.Y.Z-N` is therefore byte-identical to the image that passed the runtime test, the
`LICENSE` byte-equality assertion and the Trivy scan. Verifying a release needs no local
Docker daemon.

## Current Security Gates

- Runtime health check: blocking (at candidate validation, on the image that is published).
- Root `LICENSE` byte-equality inside the image: blocking (same image).
- Existing-tag overwrite protection on final version tags: blocking.
- Tag/source identity validation: blocking.
- Candidate-record presence for the exact release tree: blocking. Publication cannot
  proceed without validation evidence for that tree, and has no build fallback.
- `forte-ci` install/source-clean check, fork guard, and typecheck: blocking.
- Trivy image scan: **report-only** (`exit-code: 0`) while inherited runtime findings remain.
- Biome in `forte-ci`: report-only until inherited baseline findings are resolved.

Do not describe report-only checks as release gates. Accepted findings and re-enable
conditions are tracked in [.ai/slimming-runtime-plan.md](.ai/slimming-runtime-plan.md).

## Candidate Images Are Public

The GHCR package `ghcr.io/rubennati/cal.diy` is **public**. This was verified against the
live registry, not assumed: an anonymous token with no credentials resolves
`manifests/v6.2.0-6` with HTTP 200, and so do the intermediate `staging-*` tags left behind
by the v6.2.0-6 release.

Candidate validation pushes `candidate-<tree>-amd64` / `-arm64` into that same package, so
**release candidates are publicly pullable before the release exists**. That is an accepted
property of this pipeline, not an oversight, for two reasons:

- the source those images are built from is already public on `develop` before any release,
  so a candidate image discloses nothing the repository has not already published;
- digest promotion requires the final tag and the validated digest to live in the same
  repository, and moving candidates to a private package would either break digest identity
  or add a cross-repository copy step whose failure modes are worse than the exposure it
  removes.

What this does **not** license:

- candidate tags are not release identities. They are garbage-collection handles, and the
  release contract's rule stands: deploy a reviewed version tag or, preferably, a digest;
- a candidate image carries no guarantee that it will ever be released. It may be superseded
  or abandoned;
- if a future release ever needs to ship a fix before its source is public, this property
  must be revisited **before** that release, because the candidate image would then disclose
  the fix ahead of the announcement.

Intermediate tags are not currently pruned. The `staging-*` tags from `v6.2.0-6` remain
published; the artifact-promotion pipeline stops creating new `staging-*` tags but does not
retroactively remove them.

## OCI Label Semantics

Images are built during candidate validation, and promotion cannot alter a label without
altering the digest — which would defeat the entire point. The labels therefore describe the
**build**, not the release:

| Label | Value |
| --- | --- |
| `org.opencontainers.image.revision` | the pinned candidate commit |
| `org.opencontainers.image.version` | the candidate tag (`candidate-<tree>`) |
| `org.opencontainers.image.source` | the repository |

The mapping from that build identity to the release identity lives in `release-record.json`
and in the GitHub Release, which record candidate SHA, source tree, release SHA and the
immutable tag together. Reading `image.version` as the release tag would be a mistake; it
names the candidate that was validated.

## Reproducibility Rules

- Yarn installs use `--immutable`.
- Docker builds must not download an unpinned build CLI through `npx`.
- Lifecycle generation must leave tracked source clean; `forte-ci` fails otherwise.
- Base images and third-party Actions should be pinned to immutable digests/commit SHAs and
  updated deliberately.
- Build args contain synthetic test/database values only; runtime secrets are generated per
  workflow run and masked.
- `.env.example` is not evaluated as shell code by the release workflow.

## Downstream Handoff

Provide:

```text
tag:
source commit:
amd64 image:
amd64 digest:
arm64 image:
arm64 digest:
workflow run:
SBOM artifacts:
provenance attestations:
checks:
known risks:
rollback digest:
```

`secure-docker-blueprint` chooses the required architecture and pins the corresponding
digest. It remains a separate repository with separate deployment responsibility.
