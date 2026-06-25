# Quality Gates

Use these as the minimum AI-facing gates before treating a change as ready for review.

Always:

- keep the diff focused
- avoid secret exposure
- verify the target branch and scope
- check the authoritative process docs before touching release behavior

For fork/release work:

- diff is understood
- branch role is respected
- no upstream sync without approval
- no image publish without approval
- no commit without approval
- `git diff --check`

For release readiness, follow:

- [../RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
- [../SECURITY_REVIEW.md](../SECURITY_REVIEW.md)
- [../CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md)

Minimum release checks called out in the process layer include:

- `yarn type-check:ci --force`
- relevant tests
- reviewed GHCR target
- recorded image tag or digest
- no dependency on `latest` for secure downstream deployment
