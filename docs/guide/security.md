# Security model

What the product does, what it expects the deployment to do, and what it does not claim.

## Division of responsibility

cal.forte is an application. It is not a deployment platform, and it does not secure the
host it runs on.

| The product provides | The deployment must provide |
| --- | --- |
| authentication and session handling | TLS termination |
| encryption of stored third-party credentials | a reverse proxy |
| authorization within the application | network isolation and firewalling |
| reviewed, digest-pinned release artifacts | rate limiting and WAF, if wanted |
| build provenance and SBOMs | backups and monitoring |
| a documented configuration contract | secret storage and delivery |

The production deployment reference is
[Secure Docker Blueprint](https://github.com/rubennati/secure-docker-blueprint). This
documentation does not duplicate it.

## What the fork changes relative to upstream

The full register is [FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md). The security-relevant
themes:

- **Telemetry removed.** The inert usage-telemetry module and its opt-out flag are gone,
  and a blocking CI guard prevents an upstream sync from reintroducing them.
- **Advertising integrations disabled by default.**
- **Trust boundaries repaired.** Several fixes exist in cal.forte that are not upstream —
  Zoho server-location constraint, Intercom endpoint authentication, and a fail-closed
  public slot lookup.
- **Authorization fails closed.** Upstream's permission placeholders answer *yes*; the
  fork's answer *no*, so a missing implementation cannot grant access.
- **Release identity.** Images are published per architecture with recorded digests and
  build provenance; deployments are expected to pin a digest.

## What is verified, and what is not

Being explicit about this matters more than a reassuring summary.

| Verified per release | Not verified |
| --- | --- |
| the exact image runs and serves | penetration testing |
| the MIT licence ships in the image, byte-identical | dynamic application security testing |
| container image vulnerability scan **reported** | that all reported findings are fixed |
| SBOM generated per architecture | that dependencies are free of unknown vulnerabilities |
| build provenance attested per digest | |

**Vulnerability scanners are report-only.** A green release does not mean the image
contains no known vulnerabilities; it means the identity and regression gates passed.
Accepted findings for a release are recorded in
[SECURITY_REVIEW.md](../../SECURITY_REVIEW.md), and the reasoning for not blocking on
scanner severity alone is in [SECURITY_ASSURANCE.md](../../SECURITY_ASSURANCE.md).

## Known limitations that affect security posture

- **API keys have no scope.** A key carries the full authority of its owner. Revocation is
  the only control — see [Authentication](authentication.md).
- **PBAC is not implemented.** It denies rather than grants, which is safe, but it means
  no fine-grained permission model exists.
- **Teams are not usable.** Team-scoped authorization gaps inherited from upstream have no
  reachable path in a normal instance, because no shipped path creates a team.
- **Scheduled endpoints are token-protected but externally invoked.** See
  [Background jobs](operations/cron-jobs.md) and set `CRON_API_KEY`.

## Reporting

Security contact and process: [SECURITY.md](../../SECURITY.md). Reports go to the fork
maintainer, not to upstream Cal.com.
