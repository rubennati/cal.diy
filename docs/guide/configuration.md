# Configuration

cal.forte is configured entirely through environment variables. This page covers what you
must set and what is worth knowing; it is not an exhaustive list of every upstream
variable.

The shipped `.env.example` in the repository root remains the complete reference.

## Required

Four settings have no safe default.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | signs sessions |
| `CALENDSO_ENCRYPTION_KEY` | encrypts stored third-party credentials |
| `NEXT_PUBLIC_WEBAPP_URL` | the public URL of the instance |

Generate the secrets with a real random source:

```bash
openssl rand -base64 32
```

**`CALENDSO_ENCRYPTION_KEY` is not rotatable in place.** Every stored integration
credential is encrypted with it. If you lose it, those credentials cannot be decrypted and
every connected calendar and conferencing account must be reconnected. Back it up with the
same care as the database.

`NEXT_PUBLIC_WEBAPP_URL` is partly baked into the image at build time and substituted at
container start. Setting it to something other than the URL users actually reach produces
subtle breakage in links and callbacks rather than an obvious failure.

## Strongly recommended

| Variable | Value | Why |
| --- | --- | --- |
| `NEXT_PUBLIC_DISABLE_SIGNUP` | `true` | an instance you operate for yourself has no reason to accept public registrations |
| `CRON_API_KEY` | a generated secret | protects the scheduled-job endpoints — see [Background jobs](operations/cron-jobs.md) |

## Notable behaviour

**App-store apps are disabled until credentialed.** Integrations do not become active by
being present in the image; each requires its own credentials. See
[Integrations](integrations.md).

**Advertising and telemetry defaults differ from upstream.** The fork removes usage
telemetry outright and disables advertising integrations by default. This is not a setting
you need to find — it is the shipped default, recorded in
[FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md).

**Some upstream variables control nothing in this fork.** Upstream configuration surfaces
survive stripping even when their implementation does not. If a variable you found in
upstream documentation appears to have no effect, that is plausible; check
[FORK_DIVERGENCE.md](../../FORK_DIVERGENCE.md) and
[SELF_HOST_CAPABILITY_AUDIT.md](../SELF_HOST_CAPABILITY_AUDIT.md) before assuming
misconfiguration.

**Content Security Policy depends on your deployment.** The application can emit CSP in
report-only mode; whether it is enforced is a deployment policy decision, not a product
default.

## Secrets handling

Prefer file-based secrets over environment variables where your deployment supports it,
and never bake secrets into an image. The [deployment contract](deployment.md) states what
the product requires; how secrets are delivered is the deployment's decision.
