# REST API v2 — evaluation and roadmap

**Status: PLANNED. Nothing on this page describes current runtime behaviour.**

## Current state

The API v2 application exists in this repository as a separate NestJS service. The
published cal.forte release does **not** ship it: the release artifact is a single web
runtime, which is also what [IMAGE_BUILD.md](../../../IMAGE_BUILD.md) records.

Consequences today:

- there is no cal.forte REST API endpoint you can call;
- a `/api/v2` path on a current deployment does not reach a working API service;
- the OpenAPI document in this repository is **not** a reference for a live cal.forte API.

What does work: **API-key management, and the web integrations that consume keys** —
Zapier and Make run inside the web runtime. See [Authentication](../authentication.md).
API keys are not broken; the REST API is simply not part of the product yet.

## Candidate architecture

Evaluated, not built:

```
Web              https://<cal-forte-host>
Potential API    https://api.<cal-forte-host>/v2
```

A **separate hostname** is preferred over a path under the web host. A distinct hostname
allows routing, CORS policy, rate limiting, access logging, security middleware and the
service's enable/disable lifecycle to be governed independently of the web application.

Path routing under the web host would additionally inherit a build-time coupling: the web
application's API path only exists when an API URL is configured at build time, so
changing the API target would require rebuilding the web image. A separate host avoids
that entirely.

## What must be resolved before PLANNED becomes SUPPORTED

Ordered roughly by dependency, not by effort.

### Artifact

- [ ] **Hardened API image.** The existing API Dockerfile builds in a single stage and
      leaves the full monorepo source and build dependencies in the runtime layer. It
      needs the same multi-stage treatment as the web image before it could be published.
- [ ] **Second release image**, built independently — not a second runtime bolted into the
      web image.
- [ ] **AMD64 and ARM64**, each natively built and runtime-tested.
- [ ] **Trivy scan, CycloneDX SBOM and build provenance** per architecture digest.
- [ ] **`release-record.json` representation** covering both artifacts, so one release
      record describes web and API together.

### Authentication and authorization

- [ ] **Authentication behaviour** confirmed end to end for keys created in the web UI.
- [ ] **API-key prefix handling.** The configured prefix is currently only partly honoured
      in the API application; a non-default prefix would break key recognition.
- [ ] **Permission and scoping semantics.** An API key currently carries the full
      authority of its owner, with no scope. Whether that is the intended contract for a
      public API is a product decision, not an implementation detail.
- [ ] **Authorization review** of the endpoints that would be exposed.

### Service behaviour

- [ ] **Rate limiting** policy for a public API surface.
- [ ] **CORS and trusted origins.**
- [ ] **Health and readiness** endpoints, and their startup semantics.
- [ ] **Database and migration lifecycle.** The web application owns the schema; the API
      service must not migrate, and must not start before migrations complete.
- [ ] **Shared secrets and configuration**, including which secrets are shared with the
      web application and which are its own.

### Delivery

- [ ] **Secure Docker Blueprint integration** — routing, network placement, secret
      delivery and lifecycle, as a deployment concern rather than a product one.
- [ ] **OpenAPI publication** — see below.

## Acceptance criterion

Retained for whoever picks this up:

> A key created through the cal.forte UI must successfully authenticate to a supported
> API v2 endpoint and resolve to the identity of the user who created the key.

Identity resolution is part of the criterion, not an afterthought. A `200` response
carrying a different user's data would be a failure, not a pass.

## OpenAPI document

`docs/api-reference/v2/openapi.json` is an OpenAPI 3.0 document describing the API v2
application's controllers. It is generated from the NestJS controllers via the project's
Swagger generation script, and is not hand-maintained.

**It is a technical source, not a published API reference.** It describes the application
in the repository, not a service cal.forte offers.

Two gaps matter for future publication: the document declares no `servers` and no
`securitySchemes`, so it does not yet state where the API lives or how to authenticate
against it. Both would have to be correct before it could be rendered as user
documentation.

The intended future model:

```
OpenAPI document (generated from controllers)
  → rendered API reference
    → published only once API v2 becomes SUPPORTED
```

Endpoint lists are deliberately **not** duplicated into Markdown. A hand-maintained copy
of a generated document drifts, and a drifted API reference is worse than none.
