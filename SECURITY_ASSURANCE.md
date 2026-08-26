# Security Assurance Model

How `cal.forte` intends to gain and keep confidence that the software it publishes is safe to
run on the public internet — and, just as importantly, what it does **not** currently verify.

| Item | Value |
| --- | --- |
| Status | **design only.** Nothing here is implemented by this document |
| Scope | the application and its build/release path |
| Out of scope | deployment, reverse proxy, WAF, runtime infrastructure → [`secure-docker-blueprint`](https://github.com/rubennati/secure-docker-blueprint) |
| Companions | [SECURITY_REVIEW.md](SECURITY_REVIEW.md) (per-release gate) · [IMAGE_BUILD.md](IMAGE_BUILD.md) · [FORK_PROCESS.md → Definition of Done](FORK_PROCESS.md#definition-of-done) |

> **No compliance claim is made anywhere in this document.** ASVS is used as a *requirements and
> verification reference*, not as a badge. Any future statement of the form "cal.forte meets ASVS
> L*n*" would require the relevant requirements to have actually been verified, with evidence.

---

## 1. The honest starting position

An inventory of every control that exists today, verified against
`.github/workflows/`, `.github/actions/`, `.github/dependabot.yml` and `scripts/`.

| Workflow / control | Category | Trigger | Blocking? |
| --- | --- | --- | --- |
| `forte-ci.yml` — `yarn type-check:ci` | TESTS | PR + push → `develop`, `release` | **blocking** |
| `forte-ci.yml` — `scripts/fork-guard-telemetry.sh` | REGRESSION GUARD | same | **blocking** |
| `forte-ci.yml` — Biome lint | TESTS | same | report-only |
| `forte-codeql.yml` | SAST | PR + push + weekly (Tue) | report-only |
| `forte-trivy.yml` (`vuln`, `secret`, `misconfig`) | DEPENDENCIES · SECRETS · IAC | PR + push + weekly (Mon) | report-only |
| `forte-scorecard.yml` | GITHUB_ACTIONS posture | weekly (Mon) + push `develop` | report-only |
| `release-docker.yaml` | CONTAINER · SBOM · provenance | `v*` tags, dispatch | **blocking on identity/provenance**, not on findings |
| `.github/actions/docker-build-and-test` | CONTAINER · SBOM | invoked by release | split |
| `.github/dependabot.yml` | DEPENDENCIES · ACTIONS · base images | weekly, 4 ecosystems | non-blocking by construction |
| GitHub secret scanning + push protection | SECRETS | platform | push protection blocks |

**Covered:** SECRETS · SAST · DEPENDENCIES · CONTAINER · IAC · SBOM · GITHUB_ACTIONS
**Not covered:** **LICENCES** (§4) · **DAST** (§7) · **MALWARE** — the last of these is uncovered
by deliberate assessment rather than oversight; see §5c.

### 1.1 The finding that shapes everything below

> **Every vulnerability scanner in this repository is report-only.**
> The blocking gates are about **identity and regression** — type-check, the telemetry guard,
> release-tag identity, digest equality — never about **findings**.

That is a defensible position for a small fork (a chronically red gate gets ignored, and the
project deliberately chose not to block on inherited runtime CVEs it cannot fix). But it has a
consequence that must be stated plainly:

**A green CI run is not evidence that the tree is free of known vulnerabilities.** Combined with
`type-check` covering only 8 of 113 packages ([.ai/quality-gates.md](.ai/quality-gates.md)), the
current signal is weaker than it looks.

The design below does not propose blocking on everything. It proposes blocking on the small set
of things where a false negative is unrecoverable, and keeping everything else visible.

---

## 2. Security finding vocabulary

Scanners, external reports and code review all produce "findings". They do not all produce the
same *kind* of claim, and collapsing them is how a fork ends up publishing a vulnerability
disclosure it cannot substantiate — or ignoring a real one because an earlier false alarm
exhausted its credibility.

| Tier | Meaning | What is established |
| --- | --- | --- |
| `OBSERVATION` | Something was noticed. No claim of defect | a pattern, a scanner hit, a report |
| `SECURITY_CANDIDATE` | Plausibly security-relevant; not yet substantiated in this tree | the code exists as described |
| `CONFIRMED_DEFECT` | The software demonstrably behaves incorrectly | reproduced against this tree |
| `CONFIRMED_SECURITY_DEFECT` | A confirmed defect in a security-relevant control or path | reproduced, and the security relevance is argued |
| `CONFIRMED_VULNERABILITY` | A confirmed security defect that is **demonstrably reachable and exploitable** in a shipped configuration | reproduced **and** reachability demonstrated |

This layers onto — it does not replace — the existing `E0`–`E3` evidence tiers used in `docs/`.
Evidence tier says *how well established the observation is*; finding tier says *what kind of
claim is being made about it*.

### 2.1 What does not, by itself, justify `CONFIRMED_VULNERABILITY`

- a scanner reporting it;
- an external fork or third party calling it a vulnerability;
- the presence of a dangerous-looking code pattern;
- behaviour whose reachability has not been demonstrated.

Reachability is the load-bearing distinction, and this fork has a concrete worked example: the
permissive permission placeholders are a `CONFIRMED_SECURITY_DEFECT` — fail-open authorization
behaviour, reproduced by tracing the call graph — but **not** a `CONFIRMED_VULNERABILITY`,
because no shipped runtime path creates the team rows every affected branch requires. That
distinction is not a technicality; it is the difference between an accurate record and an
overstated one.

### 2.2 Preferred phrasing at each level

Where the evidence supports only the lower tiers, prefer precise descriptive language over the
word "vulnerability":

- "authorization hazard"
- "fail-open authorization behaviour"
- "security-relevant defect"
- "potential cross-tenant impact"
- "unverified reachability"

These are not softer synonyms. They state exactly what was established, which is what a reader
assessing the fork's trustworthiness actually needs.

---

## 3. ASVS as the requirements reference

[OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) is
adopted as the **vocabulary and checklist** for what "secure enough" means for an
internet-facing scheduling application — not as a certification target.

### 3.1 Why ASVS rather than a bespoke list

The fork already produces excellent *finding-driven* security work. What it lacks is a
*requirement-driven* frame: a way to notice that a whole category was never examined. ASVS
supplies that, and its chapters map cleanly onto areas this fork has already audited.

### 3.2 Area mapping — what exists, what is proposed

| ASVS area | Existing cal.forte coverage | Gap / proposed verification |
| --- | --- | --- |
| **Authentication** | NextAuth; `xms_edov` claim guard; admin password policy + TOTP downgrade to `INACTIVE_ADMIN` | `disable-signup` bypass (issue [#38](https://github.com/rubennati/cal.diy/issues/38)); Entra tenant unrestricted ([#23](https://github.com/rubennati/cal.diy/issues/23)); TOTP diagnosability ([#35](https://github.com/rubennati/cal.diy/issues/35)) |
| **Session management** | NextAuth cookies; `NEXTAUTH_COOKIE_DOMAIN`, `ALLOWED_HOSTNAMES` | **Not independently verified.** CSRF assumptions on tRPC mutations are *inherited*, per TEAM_CAPABILITY_EVALUATION §6 invariant 20 |
| **Authorization / access control** | Real checks on personal resources | **The weakest area.** 18 permissive permission stubs ([#13](https://github.com/rubennati/cal.diy/issues/13)); webhook middleware missing a team branch; a 14-test suite is specified but not yet written |
| **Input validation** | zod at tRPC boundaries | `extractBaseEmail` / `getProviderName` malformed input ([#16](https://github.com/rubennati/cal.diy/issues/16)); one unauthenticated endpoint takes `z.string()` where an email is meant |
| **Cryptography** | `symmetricEncrypt` with `CALENDSO_ENCRYPTION_KEY`; TOTP secrets and backup codes encrypted at rest | Audited as **sound** for TOTP. No broader crypto review has been performed |
| **Data protection** | `select` over `include` as a standing rule; `credential.key` never exposed | CSV formula-prefix neutralisation ([#17](https://github.com/rubennati/cal.diy/issues/17)); booker email posted to a third party ([#39](https://github.com/rubennati/cal.diy/issues/39)) |
| **API / web services** | tRPC + API v2; `api-no-breaking-changes` rule | tRPC three-leg parity is unverified ([#34](https://github.com/rubennati/cal.diy/issues/34)); a public slots endpoint resolves by slug alone ([#14](https://github.com/rubennati/cal.diy/issues/14)) |
| **Configuration** | Hardened env template; `.ai/env-reference.md`; digest-pinned images | Four confirmed phantom knobs ([#30](https://github.com/rubennati/cal.diy/issues/30)); MIT `LICENSE` absent from the image ([#40](https://github.com/rubennati/cal.diy/issues/40)) |
| **Logging / error handling** | `ErrorWithCode` / `TRPCError` discipline; mailer-logging incident checks in `SECURITY_REVIEW.md` | No structured review of what is logged at what level, or whether secrets can reach logs |
| **File / resource handling** | Limited surface — avatars, app-store static assets | Not reviewed |

### 3.3 Is ASVS Level 2 the right long-term target?

**Assessment: yes as an aspiration, no as a near-term commitment.**

- **L1** is too weak for an application holding calendar data, OAuth credentials and booking
  PII, and reachable unauthenticated.
- **L2** is the standard level for applications handling sensitive data, and most of its
  requirements are things this fork already believes it wants.
- **L3** demands architectural rigour and evidence depth disproportionate to a single-maintainer
  self-host distribution.

The blocker is not ambition, it is prerequisite: **L2's access-control chapter cannot be
satisfied while the permission service is a stub.** Sequencing therefore is: fix authorization
([#13](https://github.com/rubennati/cal.diy/issues/13)) → write the authorization regression
suite → *then* assess L2 area by area, recording verified/not-verified per requirement.

Until that assessment exists, **cal.forte makes no ASVS claim at all.**

---

## 4. Licence and dependency policy

Design for the **LICENCES** gap. The classification vocabulary lives in
[FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) §4; this section defines how it
would be enforced.

### 4.1 Policy

The goal is **not** "everything must be MIT". Third-party components keep their own licences;
the question is whether the intended use is permitted and what obligations follow.

| Bucket | Licences | CI behaviour |
| --- | --- | --- |
| **ALLOW** | MIT, ISC, BSD-2/3, Apache-2.0, Unlicense, CC0, Python-2.0, Zlib | pass silently |
| **REVIEW** | MPL-2.0, LGPL-2.1/3.0, EPL-2.0, CDDL, and any licence with attribution or source-availability duties | pass, but **require an explicit recorded decision** before merge |
| **BLOCK UNTIL REVIEWED** | GPL-2.0/3.0, AGPL-3.0, SSPL, BUSL, Elastic, Commons Clause, any "source-available" or commercial term, **and anything with no detectable licence** | fail the check |

`UNKNOWN` is treated as **BLOCK**, never as ALLOW. That is the single most important line in
this policy: the failure mode being defended against is a dependency whose licence nobody ever
established.

**Do not fail a build merely because a dependency is not MIT.** AGPL in a *devDependency* that
is never distributed is a different question from AGPL linked into the published image, and the
policy must be able to express that distinction — scope by dependency type, not by name alone.

### 4.2 Obligations handling

For anything in **REVIEW**:

- record the obligation in the ledger entry (`Licence obligations`);
- if attribution is required, it is discharged in a `NOTICE` file shipped **in the image** —
  which interacts directly with the finding that the root `LICENSE` is currently *not* copied
  into the image at all ([#40](https://github.com/rubennati/cal.diy/issues/40));
- if source-availability is required, record where the corresponding source is published.

### 4.3 Where it would run

Licence checking belongs in the **fast tier when manifests change** and in the **nightly tier**
in full. It is cheap when scoped to a lockfile diff and expensive when scanning a whole
`node_modules`, so those are deliberately different jobs.

---

## 5. Risk-based CI tiers

Do not run every expensive tool on every change. Four tiers, by what a false negative costs.

### Tier 1 — PR / fast gates *(minutes; blocks merge)*

| Check | Status |
| --- | --- |
| `yarn type-check:ci` | **exists**, blocking |
| Telemetry fork guard | **exists**, blocking |
| Biome lint | exists, report-only — candidate for promotion |
| Affected unit tests | **gap** — the fork runs no test job in CI today |
| Secret scanning | exists (platform push protection + Trivy `secret`) |
| Incremental SAST on the diff | **gap** — CodeQL is full-repo and slow |
| Dependency + **licence** check **when manifests/lockfiles change** | **gap** (licence) |
| Docker / IaC checks **when those files change** | partial (Trivy `misconfig`, unconditional) |
| tRPC three-leg parity check | **gap** — designed in [#34](https://github.com/rubennati/cal.diy/issues/34) |

### Tier 2 — merge to `develop` *(tens of minutes; visible, mostly non-blocking)*

Broader test suite · full CodeQL · dependency vulnerability scan · container and filesystem
scan · Actions security checks · SBOM generation.

### Tier 3 — nightly / weekly *(unbounded; never blocks)*

Full CodeQL across all languages · full-repository SAST · complete dependency/OSV scan ·
**complete licence-policy scan** · image vulnerability scan · SBOM consistency check against the
last release · optional binary-artefact scanning where justified.

### Tier 4 — release gate *(blocking; this is the real gate)*

Already substantially implemented by `release-docker.yaml`. Proposed additions marked ▲.

| Check | State |
| --- | --- |
| Release image build, build-once | exists |
| Strict release identity (tag = reviewed `release` head; tree = `develop`) | exists, blocking |
| Runtime smoke test of the exact image | exists |
| Secrets check | exists |
| SAST status **recorded** (not necessarily clean) | ▲ |
| Dependency status **recorded** | ▲ |
| **Licence/provenance gate** — no unresolved `UNKNOWN_BLOCKED`, ledger entries complete | ▲ |
| Container CVE scan | exists (Trivy, report-only by explicit policy) |
| SBOM per architecture | exists |
| Provenance attestation, digest capture, two-architecture finalisation | exists, blocking |
| **Security regression tests** (once the authorization suite exists) | ▲ |
| Deployment smoke test | exists at image level |
| DAST against approved staging | ▲ — see §6 |

**What should become blocking, and nothing more:** the licence/provenance gate, and the
authorization regression suite once it exists. Both are cases where a false negative is
unrecoverable — a licence violation ships in a public image, and an access-control regression
is exactly the class this fork's largest finding is about. CVE counts should stay report-only
until the inherited-CVE backlog is reduced, as `IMAGE_BUILD.md` already reasons.

---

## 5b. Scanner finding disposition

**A scanner reporting something does not make it release-blocking.** A scanner emits an
`OBSERVATION` (§2). Turning that into a decision requires a disposition, and the disposition is
a human judgement recorded once — not re-litigated at every release.

### 5b.1 Dispositions

| Disposition | Meaning | Recorded |
| --- | --- | --- |
| `CONFIRMED` | The finding is real and applies to a shipped component | remediate, or move to `ACCEPTED_RISK` / `DEFERRED_WITH_EXPIRY` with reasons |
| `ACCEPTED_RISK` | Real, but accepted deliberately | rationale + reviewer + re-review trigger |
| `FALSE_POSITIVE` | The tool is wrong about this code | why, so the same hit is not re-triaged each run |
| `NOT_APPLICABLE` | Real upstream, but the affected path is absent, unreachable or not shipped in this artefact | the reachability argument |
| `DEFERRED_WITH_EXPIRY` | Real and not yet addressed | **an explicit expiry date or re-review trigger.** Never open-ended |

`DEFERRED_WITH_EXPIRY` is the one that keeps this honest. A deferral without an expiry is an
`ACCEPTED_RISK` that nobody admitted to accepting.

### 5b.2 Exception record

Every non-`CONFIRMED`-and-fixed finding records:

| Field | Notes |
| --- | --- |
| Finding and tool | tool, rule/CVE id, version |
| Affected **shipped** component | if it is not in the published artefact, say so — that is usually the whole answer |
| Severity | as reported, and as assessed here if they differ |
| Exploitability / reachability | the §2 discipline: is the path reachable in a shipped configuration? |
| Rationale | why this disposition |
| Reviewer and date | who decided |
| Expiry / re-review trigger | required for `DEFERRED_WITH_EXPIRY`; recommended for `ACCEPTED_RISK` |

The existing `.trivyignore` is this mechanism in embryo — entries there should carry the same
fields rather than a bare suppression.

### 5b.3 What actually blocks

Blocking is a function of **severity × applicability × reachability × shipped-component ×
available mitigation** — never scanner severity alone. A `CRITICAL` in a devDependency that is
never distributed is not a release blocker; a `MEDIUM` in an authentication path that ships and
is reachable may well be.

**Do not convert report-only scanners into blocking gates wholesale.** The two candidates for
blocking named in §5's Tier 4 remain the only ones proposed:

1. the **licence/provenance gate** — no unresolved `UNKNOWN_BLOCKED`, ledger entries complete;
2. the **authorization regression suite**, once it exists.

Both are cases where a false negative is unrecoverable — a licence obligation breached in a
published image, or a re-opened access-control defect. Everything else stays visible and
dispositioned rather than blocking, which is also the reasoning `IMAGE_BUILD.md` already applies
to inherited runtime CVEs.

---

## 5c. Position on malware scanning

**Malware scanning is a risk-based assurance category, not a mandatory gate on ordinary
TypeScript source changes.** Running a malware scanner across application source on every PR
produces noise, not assurance, and would be adding a tool to fill a category rather than to
answer a question.

Where it *is* proportionate:

| Target | Why |
| --- | --- |
| Downloaded or vendored binary artefacts | the classic supply-chain insertion point |
| Published release artefacts | what downstream actually consumes |
| Unusual package lifecycle payloads | `postinstall` and friends are a known npm attack path — and the fork already uses `yarn install --immutable`, which constrains but does not eliminate this |
| Externally supplied files, if such a capability ever exists | none is known in this tree today |

**Current assessment: not warranted.** This fork vendors no binaries, and its published artefact
is a container image already scanned by Trivy. The honest position is that MALWARE is an
*uncovered category by deliberate choice*, revisited if the fork ever vendors binaries, ships a
non-image artefact, or accepts externally supplied files — not a gap to be closed for
completeness.

---

## 6. Tooling evaluation

Existing tools first. **Do not add a tool to increase tool count.**

| Tool | Unique value | Overlap | Cost | FP risk | Where | Block? | Verdict |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **CodeQL** *(have)* | Deep dataflow SAST | — | high | low-med | Tier 2/3 | no | **keep**; move full runs to nightly, keep PR runs diff-scoped if supported |
| **Trivy** *(have)* | fs + image; vuln/secret/misconfig in one | overlaps Grype, partly Gitleaks | med | med | Tier 2/3/4 | no | **keep**. Already the widest-coverage single tool here |
| **Dependabot** *(have)* | Automated update PRs | overlaps OSV for discovery | free | low | continuous | no | **keep** |
| **Scorecard** *(have)* | Repo/Actions posture | partial `zizmor` overlap | low | low | Tier 3 | no | **keep**, weekly |
| **Syft** *(have, via release)* | SBOM | — | low | — | Tier 4 | n/a | **keep** |
| **Semgrep** | Fast, targeted, *custom* rules — could encode fork-specific invariants (e.g. "no `return true` in a function named `checkPermission`") | overlaps CodeQL for generic bugs | low | med | Tier 1 | selected rules only | **adopt** — the custom-rule capability is the unique value, not generic SAST |
| **Gitleaks** | History-aware secret scanning | overlaps Trivy `secret` + push protection | low | med | Tier 1 | yes | **defer** — three overlapping controls already; adopt only if a real gap appears |
| **OSV-Scanner** | Broad advisory DB, lockfile-native | substantial Trivy/Dependabot overlap | low | low | Tier 3 | no | **defer** |
| **ORT** | Full licence + provenance; NOTICE generation | none today | **high** setup | med | Tier 3 | no | **evaluate second** — the right answer at scale, disproportionate now |
| **ScanCode Toolkit** | Deep per-file licence detection | overlaps ORT | high | med | Tier 3 | no | **defer** |
| **licence check via SBOM metadata** | Cheapest path to the LICENCES gap — reuse the SBOM already produced | — | **very low** | med | Tier 1 (manifest change) + 4 | **yes**, on policy | **adopt first** — closes the gap using an artefact that already exists |
| **zizmor** | Actions-specific vulnerability patterns | partial Scorecard overlap | low | low | Tier 2 | no | **adopt** — cheap, and the fork's Actions are its supply chain |
| **actionlint** | Actions syntax/correctness | none | very low | very low | Tier 1 | yes | **adopt** — trivially cheap |
| **OWASP ZAP** | DAST — baseline/passive | none | med | med | staging only | no | **adopt later**, §7 |
| **Nuclei** | Curated template checks | overlaps ZAP | med | **high** if uncurated | staging only | no | **defer**; only a hand-picked template set |
| **testssl.sh** | TLS configuration | none | low | low | staging | no | **`secure-docker-blueprint`** — TLS terminates there |

**Recommended adoption order:** `actionlint` → SBOM-based licence policy → `zizmor` → Semgrep
with fork-specific rules → ZAP baseline against staging → reconsider ORT.

---

## 7. Dynamic and runtime security

Four distinct layers, deliberately separated because they have different owners.

| Layer | Owner | Verification |
| --- | --- | --- |
| **Source / CI** | cal.forte | Tiers 1–3 |
| **Image** | cal.forte | Tier 4 — scan, SBOM, provenance, digest |
| **Deployment** | `secure-docker-blueprint` | compose/runtime config, secrets, resource limits |
| **Runtime / external** | `secure-docker-blueprint` | TLS, headers, WAF, rate limiting, monitoring |

### 7.1 Proposed model

```
PR                → fast static gates
develop / nightly → deep static, dependency, licence, image analysis
release candidate → deploy to an approved staging instance → DAST + security smoke tests
production        → passive operational monitoring only
```

### 7.2 Candidate runtime checks

Health and availability · TLS certificate validity and expiry · security headers · unexpected
public endpoints · authentication behaviour · **selected authorization regression probes** ·
ZAP baseline/passive scan · a small curated Nuclei set · rate-limit behaviour · public metadata
leakage.

### 7.3 Rules of engagement

- **Active DAST targets an explicitly approved staging environment.** Never production by
  default.
- **No aggressive automated testing against production**, ever, without separate authorisation.
- Production verification is **passive** — observation, not probing.
- Anything that is a property of the deployment rather than the application belongs to
  `secure-docker-blueprint`. The mass-429 finding (`D-01`) is the worked example: application
  code was excluded by four independent barriers, so it was redirected rather than fixed here.

---

## 8. Per-release security evidence

The goal is **not** certification paperwork. It is being able to answer, months later:

> *"What security evidence existed when this image was released?"*

without reconstructing it.

Much of this is already captured — `release-docker.yaml` produces digests, SBOMs, provenance
attestations and `release-record.json`, and `FORK_STATUS.md` records the release evidence block.
The proposal is to **consolidate the references into one record per release**, not to re-create
what exists.

| Field | Source |
| --- | --- |
| Source commit (`release` head) and tag | `FORK_STATUS.md`; release workflow |
| **Implementation-ledger entries first shipped in this release** | [FORK_IMPLEMENTATION_LEDGER.md](FORK_IMPLEMENTATION_LEDGER.md) |
| **Provenance / licence status** — no unresolved `UNKNOWN_BLOCKED` | ledger §4 fields |
| Tests run | CI run |
| SAST result **as a status with dispositions (§5b), not a pass/fail** | CodeQL |
| Dependency status | Trivy / Dependabot |
| Secret-scan result | Trivy `secret`, push protection |
| Container scan result + **dispositioned** exceptions (§5b) | Trivy, `.trivyignore` |
| SBOM per architecture | release workflow |
| DAST result | staging run, once §7 exists |
| **Known accepted risks** (`ACCEPTED_RISK`) | `SECURITY_REVIEW.md`; `.trivyignore` rationale |
| **Deferred findings** (`DEFERRED_WITH_EXPIRY`, each with its expiry) | open GitHub issues at release time |
| Security exceptions | recorded per §5b.2, with an expiry — never open-ended |

The last three matter most. A release record that lists only what passed is marketing; one that
records what was knowingly deferred is evidence.

**Suggested home:** extend `FORK_STATUS.md`'s existing *Latest Release Evidence* block with the
ledger-entry list and the deferred-findings list, rather than creating a parallel document.
`FORK_PROCESS.md` → *Required Release Record* already names most of the other fields.

---

## 9. What this document does not do

- It implements nothing. No workflow, tool, policy file or gate is created by it.
- It makes **no compliance claim** — ASVS or otherwise.
- It does not weaken any existing control.
- It does not assign deployment or runtime infrastructure work to this repository.

Adopting any part of it is a change like any other, and therefore subject to
[FORK_PROCESS.md → Definition of Done](FORK_PROCESS.md#definition-of-done) and an entry in the
implementation ledger.
