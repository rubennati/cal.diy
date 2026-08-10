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

The release finalizer uploads `release-record.json` containing source SHA, architecture
image references, architecture digests, workflow run ID, and the convenience `latest`
digest. GitHub build-provenance attestations are pushed for both architecture images.

## Current Security Gates

- Runtime health check: blocking.
- Existing-tag overwrite protection: blocking.
- Tag/source identity validation: blocking.
- `forte-ci` install/source-clean check, fork guard, and typecheck: blocking.
- Trivy image scan: **report-only** (`exit-code: 0`) while inherited runtime findings remain.
- Biome in `forte-ci`: report-only until inherited baseline findings are resolved.

Do not describe report-only checks as release gates. Accepted findings and re-enable
conditions are tracked in [.ai/slimming-runtime-plan.md](.ai/slimming-runtime-plan.md).

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
