# Fork Implementation Ledger

The durable record of **what `cal.forte` actually changed** — every material fork-owned or
intentionally divergent implementation that has landed, is planned, or has been withdrawn.

This is the answer to *"why does this fork's code differ from Cal.diy here, who decided it, on
what evidence, and what was verified?"* — asked years later, by someone who was not present.

| Item | Value |
| --- | --- |
| Scope | implemented and planned **cal.forte** changes |
| Granularity | one entry per **material change**, not per commit |
| Authority | canonical for implementation provenance, licence status and security impact |
| Companion registers | [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md) · [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md) · [docs/EXTERNAL_FORK_INTAKE.md](docs/EXTERNAL_FORK_INTAKE.md) |
| Completion rule | [FORK_PROCESS.md → Definition of Done](FORK_PROCESS.md#definition-of-done) |

---

## 1. What this ledger is, and what it is not

The fork already documents **analysis**, **intake** and **release**. What it did not have is a
record of **implementation**: the moment an evaluated candidate becomes code in this tree.

| Question | Answered by |
| --- | --- |
| What did upstream do, and did we take it? | [UPSTREAM_REVIEW_LEDGER.md](UPSTREAM_REVIEW_LEDGER.md) |
| What is the fork's current steady-state difference from upstream? | [FORK_DIVERGENCE.md](FORK_DIVERGENCE.md) |
| What did another fork reveal, and did it survive verification? | [docs/EXTERNAL_FORK_INTAKE.md](docs/EXTERNAL_FORK_INTAKE.md) |
| What is wrong with the tree right now? | [docs/SELF_HOST_CAPABILITY_AUDIT.md](docs/SELF_HOST_CAPABILITY_AUDIT.md) |
| **What did we implement, from what source, and what did we verify?** | **this document** |
| What was published, when, from which commit and digest? | [FORK_STATUS.md](FORK_STATUS.md) · [RELEASE_PROCESS.md](RELEASE_PROCESS.md) |
| What happened, chronologically? | [.ai/sync-log.md](.ai/sync-log.md) |

### It is explicitly **not**

- **Not a commit log.** Formatting, refactoring, dependency bumps and typo fixes get **no entry**
  unless they change security posture, product behaviour, provenance, or a maintenance boundary.
- **Not a replacement for `UPSTREAM_REVIEW_LEDGER.md`.** That ledger owns the disposition of
  *upstream commits* — including the ones deliberately **not** taken. This ledger only ever
  records things that were **implemented here**. An upstream commit reviewed and deferred appears
  in the upstream ledger and **never** appears here.
- **Not a replacement for `FORK_DIVERGENCE.md`.** That register answers *"what is different
  today?"* in steady state, grouped by theme, and is the public-facing summary. This ledger
  answers *"how did it get that way?"* per change, and retains superseded and reverted entries
  that the divergence register correctly drops.
- **Not an issue tracker.** GitHub issues carry the evaluation; this ledger carries the outcome.

### The rule that keeps it from becoming a commit log

> An entry is required when the change alters **security posture, privacy posture, attack
> surface, product behaviour, provenance, licence obligations, or a maintenance boundary** —
> or when a future maintainer would be misled by its absence.
>
> Everything else is git history, and git history is sufficient for it.

If you are unsure, ask: *would a reviewer auditing this fork's trustworthiness need to know?*
If yes, write the entry.

---

## 2. Change types

A small, stable taxonomy. Do not extend it casually — a growing taxonomy is a sign the
categories are wrong, not that the work is novel.

| Type | Meaning |
| --- | --- |
| `UPSTREAM_FIX` | An official upstream commit taken into this fork, normally by `git cherry-pick -x`. Also requires an `UPSTREAM_REVIEW_LEDGER.md` row |
| `FORK_FIX` | A defect fixed by fork-owned code, with no upstream equivalent taken |
| `EXTERNAL_INSPIRED_FIX` | A defect **discovered** through an external fork or third-party report, then implemented natively here. Carries `Source usage: BEHAVIOURAL_REFERENCE` (or `DESIGN_REFERENCE`) with `Implementation relationship: CAL_FORTE_NATIVE` — see §6 |
| `SECURITY_HARDENING` | Reduces exploitability or strengthens a control, without a specific known defect |
| `PRIVACY_HARDENING` | Reduces data collection, outbound communication, or third-party exposure |
| `ATTACK_SURFACE_REDUCTION` | Removes reachable code, routes, endpoints or dependencies |
| `PRODUCTIZATION` | Makes the fork coherent as its own self-host distribution — identity, branding, legal URLs, operator-facing defaults |
| `FEATURE` | Adds a capability that did not previously exist or was unreachable. Requires §5 |
| `FEATURE_REMOVAL` | Deliberately removes an inherited capability. Requires §7 |
| `DEPLOYMENT_HARDENING` | Container, image, build or release-pipeline security |
| `UPSTREAM_DIVERGENCE` | A deliberate behavioural difference from upstream that is none of the above — recorded so a future sync does not "correct" it |

A change may carry a **primary** type and at most one **secondary** type. More than two means it
should probably be two entries.

---

## 3. Provenance: two independent axes

Provenance is recorded on **two axes that must never be collapsed into one**:

- **Implementation relationship** — what the resulting implementation *is*, relative to any
  external source.
- **Source usage** — how far an external source was actually *used*, from not at all through to
  source incorporation.

Recording only one of these is how a record ends up implying independence where material was in
fact incorporated, or implying incorporation where only behaviour was observed. Both are
required.

### 3.1 Implementation relationship

| Value | Meaning |
| --- | --- |
| `CAL_FORTE_NATIVE` | Implementation authored for cal.forte without incorporating an external implementation |
| `OFFICIAL_UPSTREAM_CHERRY_PICK` | An official upstream commit incorporated through the approved cherry-pick process, with `-x` provenance preserved |
| `OFFICIAL_UPSTREAM_ADAPTATION` | Implementation derived or adapted from an official upstream change, with local modifications |
| `EXTERNAL_REFERENCE` | An external repository served as discovery, behavioural, design or implementation-reference evidence; the resulting implementation is cal.forte-owned |
| `EXTERNAL_ADAPTATION` | External implementation material was incorporated or adapted. **Requires explicit licence and provenance clearance before merge** |
| `THIRD_PARTY_INTEGRATION` | An external component, package or tool is deliberately integrated under its own licence and obligations |
| `HISTORICAL_REFERENCE_ONLY` | A historical implementation was inspected as evidence or reference. It is **not** an approved implementation source |

### 3.2 Source usage

| Value | Meaning |
| --- | --- |
| `NONE` | No external source consulted |
| `BEHAVIOURAL_REFERENCE` | Observed what the software *does* — symptoms, responses, reachability |
| `DESIGN_REFERENCE` | Studied architecture, data model or control flow at the design level |
| `IMPLEMENTATION_REFERENCE` | Read the external implementation itself to understand it, without incorporating it |
| `SOURCE_INCORPORATED` | External source was incorporated substantially as-is |
| `SOURCE_ADAPTED` | External source was incorporated and modified |

### 3.3 How the axes combine

| Situation | Source usage | Implementation relationship |
| --- | --- | --- |
| External fork identifies a defect; cal.forte implements independently | `BEHAVIOURAL_REFERENCE` | `CAL_FORTE_NATIVE` |
| Official upstream commit cherry-picked | `SOURCE_INCORPORATED` | `OFFICIAL_UPSTREAM_CHERRY_PICK` |
| Upstream change taken but modified for this tree | `SOURCE_ADAPTED` | `OFFICIAL_UPSTREAM_ADAPTATION` |
| Restricted implementation inspected only to understand product behaviour | `BEHAVIOURAL_REFERENCE` or `DESIGN_REFERENCE` | `CAL_FORTE_NATIVE` or `HISTORICAL_REFERENCE_ONLY` |
| A package is added as a dependency | `NONE` (its source is not incorporated into ours) | `THIRD_PARTY_INTEGRATION` |
| Fork-owned work with no external input | `NONE` | `CAL_FORTE_NATIVE` |

**The controlling rule:** an implementation is not described as native or independent when
external implementation material was in fact incorporated or adapted. `SOURCE_INCORPORATED` and
`SOURCE_ADAPTED` are incompatible with `CAL_FORTE_NATIVE`, and the combination must never appear
in an entry.

### 3.4 Permitted source usage by licence disposition

`IMPLEMENTATION_REFERENCE` deserves particular care. Reading an implementation is a materially
different act from observing behaviour, and it carries a higher risk of producing a derivative
work. This repository therefore applies a conservative matrix rather than a general rule.

For sources classified `RESTRICTED_REFERENCE_ONLY` or `UNKNOWN_BLOCKED`:

| Source usage | Disposition |
| --- | --- |
| `BEHAVIOURAL_REFERENCE` | Potentially acceptable **where access and the applicable terms permit** |
| `DESIGN_REFERENCE` | Potentially acceptable **where access and the applicable terms permit** |
| `IMPLEMENTATION_REFERENCE` | **`REQUIRES_REVIEW`** — not proceeded with until reviewed and recorded |
| `SOURCE_INCORPORATED` | **Not approved** without explicit licence and provenance clearance |
| `SOURCE_ADAPTED` | **Not approved** without explicit licence and provenance clearance |

"Potentially acceptable" is deliberate wording. This document records evidence and applies a
repository policy; it does not make legal determinations, and nothing here should be read as a
categorical statement that any particular use is lawful. Where the answer matters, it is a
**[LEGAL]** question — see
[docs/LICENSE_AND_PROVENANCE_REVIEW.md](docs/LICENSE_AND_PROVENANCE_REVIEW.md) §0.

Four constraints hold regardless of disposition:

- **Public visibility does not imply unrestricted source usage.**
- **A repository-level licence declaration does not automatically establish provenance for every
  file it contains**, including files it inherited, vendored or imported from elsewhere.
- **Third-party dependencies retain their own licences and obligations.**
- **cal.forte's intended MIT distribution model does not require every dependency to be MIT** —
  it requires that each component's own terms permit the intended use, and that any resulting
  obligation is recorded and discharged.

---

## 4. Licence and provenance classification

`cal.forte` intends to remain MIT-distributable. **This does not mean every source must be MIT.**
Third-party components keep their own licences and obligations; the question is always whether
the intended *use* is permitted and what obligations follow.

| Classification | Meaning | Consequence |
| --- | --- | --- |
| `PERMISSIVE_COMPATIBLE` | MIT/BSD/Apache-2.0-style, no practical friction | proceed; preserve notices |
| `COMPATIBLE_WITH_OBLIGATIONS` | Permitted, but attribution / NOTICE / source-availability duties attach | proceed **and record the obligation and where it is discharged** |
| `REQUIRES_REVIEW` | Copyleft, unusual terms, or an unclear boundary | do not merge until reviewed and recorded |
| `RESTRICTED_REFERENCE_ONLY` | Commercial, source-available, or otherwise licence-incompatible with the intended distribution model | **Not approved for source incorporation or adaptation.** Permitted source usage is governed by the §3.4 matrix |
| `UNKNOWN_BLOCKED` | The applicable licence could not be established | **The safe default.** Not approved for source incorporation until resolved; source usage is governed by the §3.4 matrix |

### Assumptions that are explicitly forbidden

- that publicly visible source may automatically be incorporated or adapted;
- that "open source" implies compatibility with the intended distribution model;
- that the absence of a licence file means unrestricted use;
- that source in git history carries the working tree's *current* licence;
- that an external fork's declared repository licence governs every file it contains, including
  files it inherited or incorporated from elsewhere.

The last two matter concretely here: `packages/features/ee/**` was **Cal.com Commercial** and
`packages/features/pbac/**` was **AGPLv3** before the upstream strip, and both remain reachable
in this clone's history. See
[docs/LICENSE_AND_PROVENANCE_REVIEW.md](docs/LICENSE_AND_PROVENANCE_REVIEW.md) §0 and §3.4–§3.6.

### The clean-provenance path

For restricted, commercial, source-available, licence-incompatible or unclear sources — anything
not `PERMISSIVE_COMPATIBLE` — the intended engineering workflow is:

```
external observation / reference
        →  independent requirement
        →  independent design
        →  cal.forte-native implementation
```

…where legally and contractually permitted.

Every entry taking this path records all five of:

| Field | Expected value on this path |
| --- | --- |
| **Source usage** | `BEHAVIOURAL_REFERENCE` or `DESIGN_REFERENCE` |
| **Implementation relationship** | `CAL_FORTE_NATIVE` |
| **Licence disposition** | the §4 classification of the source that was observed |
| **Independent verification** | what was reproduced or re-derived against this tree |
| **Implementation provenance** | the permitted sources the implementation was actually written against |

The external source is retained as **reference evidence** and is never described as the
implementation source.

**A material change is not Done until its implementation relationship, source usage and licence
disposition are all recorded** — see
[FORK_PROCESS.md → Definition of Done](FORK_PROCESS.md#definition-of-done).

**A material change is not Done until its licence/provenance status is recorded.**

---

## 5. Entry schema

Every material change uses this shape. Fields that genuinely do not apply are written `n/a` —
never left blank, because a blank field is indistinguishable from an unanswered one.

```markdown
### FIL-NNNN · <title>

| Field | Value |
| --- | --- |
| Status | planned \| implemented \| released \| superseded \| reverted |
| Type | <primary> (+ <secondary>) |
| GitHub issue | #NN or n/a |
| PR | #NN or n/a |
| Local commit(s) | `<sha>` … |
| Released in | `vX.Y.Z-N` or `unreleased` |
| Implementation relationship | one of §3.1 |
| Source usage | one of §3.2 |
| Upstream source | repo + commit + PR + intake method + `-x` line, or n/a |
| External source | repo + commit/PR **as reference evidence**, or n/a |
| Licence disposition | one of §4 |
| Licence obligations | attribution / NOTICE / source-availability, or none |
| Independent verification | what was reproduced or re-derived against this tree, or n/a |

**Problem / desired outcome** — what a user or operator gets, not what the code does.

**Decision and rationale** — why this, why now, what was rejected.

**Implementation summary** — what actually changed, at file granularity.

**Intentional divergence from upstream** — what a future sync must not "correct", or `none`.

**Impact assessment**

| Dimension | Value |
| --- | --- |
| Security impact | … |
| Privacy impact | … |
| Attack-surface impact | increased / reduced / unchanged + why |
| New trust boundary | yes/no |
| New public endpoint | yes/no |
| New authenticated mutation | yes/no |
| New persistent state or schema | yes/no |
| New external communication | yes/no |
| Compatibility impact | … |

**Validation** — tests, gates, manual checks actually run. Not what should be run.

**Guards / CI** — what prevents silent regression or upstream reintroduction.

**Rollback / disable** — how to undo or switch off, or why that is not possible.

**Related documentation** — the other registers updated.

**Upstream re-evaluation trigger** — the condition under which this is revisited.
```

Any `yes` in the impact table is a **review trigger**, not merely a note. Five `yes` answers on
one entry is a design review, not a pull request.

---

## 6. External forks are intelligence, never patch sources

Formal policy, restating [docs/EXTERNAL_FORK_INTAKE.md](docs/EXTERNAL_FORK_INTAKE.md) §9 as a
binding implementation rule:

```
external source
      ↓  independent reproduction against this tree
      ↓  official upstream comparison  (is there a real upstream fix to take instead?)
      ↓  security and provenance review
      ↓  cal.forte-owned implementation
```

— **unless** the actual implementation source is an independently verified official upstream
commit, in which case the entry is `UPSTREAM_FIX` / `OFFICIAL_UPSTREAM_CHERRY_PICK` and the external fork is
demoted to *symptom reporter*.

An entry must never blur these two claims, and the two-axis model in §3 exists to keep them
apart:

| Claim | Recorded as | Clearance needed |
| --- | --- | --- |
| The defect was **identified from** `X`; the implementation is ours | `Source usage: BEHAVIOURAL_REFERENCE` · `Implementation relationship: CAL_FORTE_NATIVE` | none beyond the normal licence disposition of the observed source |
| External implementation material was **incorporated or adapted** from `X` | `Source usage: SOURCE_INCORPORATED` or `SOURCE_ADAPTED` · `Implementation relationship: EXTERNAL_ADAPTATION` | **explicit licence and provenance clearance before merge** |

Neither claim is more respectable than the other. What is not acceptable is recording the
second as though it were the first.

The register already carries the reason this rule exists: one evaluated fork had shipped
hard-coded authentication backdoors it later removed; another hard-codes a third party's tenant
GUID; a third weakens an email-verification guard this fork relies on. Of three testable
"fixes" from one fork, one did not reproduce, one targeted a file this fork does not have, and
one shipped tests without the fix.

---

## 7. Feature records are security records

A `FEATURE` entry must additionally answer all of the following. **"Restored the existing UI" is
not an acceptable description** when enabling it materially changes reachability or attack
surface — the UI was the only thing missing precisely because everything behind it was reachable
already.

| Required for every `FEATURE` | Why |
| --- | --- |
| What capability is enabled | the user-visible claim |
| What previously did not exist **or was unreachable** | reachability is the security-relevant half |
| Authorization model | who may do it, enforced where |
| New reachable routes | the actual new surface |
| New data exposure | fields, not endpoints |
| New mutations | especially unauthenticated or cross-tenant ones |
| Trust boundaries crossed | where attacker-controlled input meets privileged code |
| Failure modes | what happens when the check is unavailable |
| Abuse cases | how it is misused, not how it is used |
| Required security regression tests | named, and passing |

### 7.1 Worked example — how a Teams entry would look

**Teams are not implemented, and nothing here proposes implementing them.** This is the
canonical illustration of what a high-risk feature entry must contain, because Teams is the
change most likely to be attempted and most likely to be under-documented.

A future `FIL-nnnn · Team management` entry could not be accepted without:

| Requirement | Where the prerequisite is recorded |
| --- | --- |
| **PBAC resolution first** — the 18 `return true` permission stubs replaced by a real or deny-by-default service | [docs/PBAC_PLACEHOLDER_AUDIT.md](docs/PBAC_PLACEHOLDER_AUDIT.md) · GitHub [#13](https://github.com/rubennati/cal.diy/issues/13) |
| **Role and ownership invariants decided** — all 22, explicitly including ADMIN→OWNER escalation via the *invite* path, not only via role change | [docs/TEAM_CAPABILITY_EVALUATION.md](docs/TEAM_CAPABILITY_EVALUATION.md) §6 · GitHub [#33](https://github.com/rubennati/cal.diy/issues/33) |
| **Invite lifecycle** — issuance, expiry, single-use, revocation, and a genuine pending state (token signup currently auto-accepts) | TEAM_CAPABILITY_EVALUATION §5 |
| **Cross-team IDOR controls** — arbitrary `teamId` / `eventTypeId` must not resolve | PBAC_PLACEHOLDER_AUDIT §3.2, §3.3 |
| **Public team exposure** — what a `/team/[slug]` page discloses, and whether private and non-existent teams are indistinguishable | TEAM_CAPABILITY_EVALUATION §10.2 |
| **Slug namespace decision** — user and team slugs share one public namespace; this must be settled **before the first slug is issued**, because changing it later breaks public links | TEAM_CAPABILITY_EVALUATION §6 invariant 18 |
| **Licence/provenance** — `packages/features/ee/teams` was **Cal.com Commercial**; `packages/features/pbac` was **AGPLv3**. Implemented natively: `Source usage: DESIGN_REFERENCE` · `Implementation relationship: CAL_FORTE_NATIVE` | [docs/LICENSE_AND_PROVENANCE_REVIEW.md](docs/LICENSE_AND_PROVENANCE_REVIEW.md) §3.4–§3.6 |
| **Tests** — the T-01…T-14 authorization suite rejecting, and C-01…C-04 (control) still passing | PBAC_PLACEHOLDER_AUDIT §5 |

The impact table for such an entry would read `yes` on **new public endpoint**, **new
authenticated mutation**, **new persistent state**, and **new trust boundary** — four triggers,
which is why it is a design review rather than a pull request.

---

## 8. Removals are first-class changes

Deleting inherited code is a change to the product and gets a full entry. A removal entry adds:

| Field | Why it matters |
| --- | --- |
| **What was removed** | precise paths, flags, endpoints, dependencies |
| **Disabled or deleted?** | a disabled feature still has to be re-audited by every reviewer; a deleted one does not |
| **Why removal was preferred** | over configuration, over leaving it inert |
| **Security / privacy value** | the actual gain |
| **Compatibility impact** | who notices, and how |
| **Guard against upstream reintroduction** | the check that fails CI if a sync brings it back |

The last field is the one that makes removals durable. An unguarded removal is a temporary
removal: the next upstream merge re-arms it silently, and the divergence register still claims
it is gone.

---

## 9. Where each record belongs

Avoid duplicate full descriptions. Link instead.

| Event | Record in |
| --- | --- |
| Upstream commit reviewed (taken, deferred, rejected, partial) | `UPSTREAM_REVIEW_LEDGER.md` |
| …and it was **implemented** here | **+ this ledger** (`UPSTREAM_FIX` / `OFFICIAL_UPSTREAM_CHERRY_PICK` or `OFFICIAL_UPSTREAM_ADAPTATION`) |
| Fork-owned change implemented | **this ledger** |
| …and it changes steady-state behaviour a user or auditor would notice | **+ `FORK_DIVERGENCE.md`** |
| External-fork finding evaluated | `docs/EXTERNAL_FORK_INTAKE.md` |
| …and it was eventually implemented | **+ this ledger** (`EXTERNAL_INSPIRED_FIX` / `EXTERNAL_REFERENCE`) |
| Audit finding about the current tree | `docs/SELF_HOST_CAPABILITY_AUDIT.md` (§10.1 coverage table) |
| Release published — tag, commit, digests, evidence | `FORK_STATUS.md`, `RELEASE_PROCESS.md` |
| Chronological narrative of a round | `.ai/sync-log.md` |

**Rule of thumb:** the upstream ledger is about *upstream's* commits; this ledger is about
*ours*. A change can legitimately appear in both — an upstream fix we took has an upstream
disposition **and** an implementation record — but the two entries answer different questions
and must not be copies of each other.

---

## 10. Status vocabulary

| Status | Meaning | Relation to `FORK_STATUS.md` |
| --- | --- | --- |
| `planned` | Decided and scoped, not yet implemented. Has an issue; has no commit | ≈ `Accepted` |
| `implemented` | Present on `develop`; not yet in a published release | = `Integrated` |
| `released` | Present in a published release tag | = `Released` |
| `superseded` | Replaced by a later entry, which must be named | — |
| `reverted` | Removed from the tree. The entry **stays**, with the reason | — |

**This is an implementation lifecycle, not a second review lifecycle.**
[FORK_STATUS.md](FORK_STATUS.md) → *Status Terms* remains the single source for the review
vocabulary (`Observed` · `Reviewed` · `Accepted` · `Integrated` · `Released` · `Deferred`), and
those terms are deliberately separate from one another there. The mapping column above exists so
the two are never confused. `Observed`, `Reviewed` and `Deferred` have **no** counterpart here,
because nothing reaches this ledger until it is implemented.

`superseded` and `reverted` entries are never deleted. A ledger that only records successes is
not a provenance record.

---

## 10b. Worked examples of the provenance model

Six short examples showing how the two axes combine. **Examples A and F are real** and point at
the entries below. **B, C, D and E are illustrative** — they are marked as such and describe no
historical event.

### A · Official upstream cherry-pick *(real — see `FIL-0007`)*

| Field | Value |
| --- | --- |
| Type | `UPSTREAM_FIX` |
| Source usage | `SOURCE_INCORPORATED` |
| Implementation relationship | `OFFICIAL_UPSTREAM_CHERRY_PICK` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` (MIT, same project) |

Upstream `038381aeca` incorporated with `git cherry-pick -x`, provenance line preserved, fork
adaptation kept in a separate follow-up commit. Requires a row in `UPSTREAM_REVIEW_LEDGER.md`
as well as here.

### B · Official upstream adaptation *(illustrative)*

| Field | Value |
| --- | --- |
| Type | `UPSTREAM_FIX` |
| Source usage | `SOURCE_ADAPTED` |
| Implementation relationship | `OFFICIAL_UPSTREAM_ADAPTATION` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

An upstream fix whose patch does not apply cleanly because this fork removed an adjacent
subsystem. The upstream logic is retained and modified for the local tree. This is **not** a
cherry-pick and must not claim `-x` provenance: `UPSTREAM_SYNC.md` requires such intake to be
recorded as `partial`, naming the retained and omitted scope.

### C · External fork as behavioural reference, native implementation *(illustrative)*

| Field | Value |
| --- | --- |
| Type | `EXTERNAL_INSPIRED_FIX` |
| Source usage | `BEHAVIOURAL_REFERENCE` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| External source | the fork and commit, **as reference evidence** |
| Independent verification | the defect reproduced against this tree before any code was written |
| Licence disposition | that of the observed source; irrelevant to the output, since nothing was incorporated |

An external fork's commit message describes a defect. The defect is reproduced here, upstream is
checked for an existing fix, and an implementation is written against this tree. The external
repository is named as reference evidence and is never described as the implementation source.

### D · Restricted historical implementation, reference only *(illustrative)*

| Field | Value |
| --- | --- |
| Type | `FEATURE` or `FORK_FIX` |
| Source usage | `BEHAVIOURAL_REFERENCE` or `DESIGN_REFERENCE` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Licence disposition | `RESTRICTED_REFERENCE_ONLY` |

Pre-strip `packages/features/ee/**` was distributed under the Cal.com Commercial License and
`packages/features/pbac/**` under AGPLv3; both remain reachable in this clone's history. Either
may be inspected to understand *what a feature did*. Neither is an approved implementation
source, and `IMPLEMENTATION_REFERENCE` against them is `REQUIRES_REVIEW` under §3.4. The
implementation is written against current-tree MIT interfaces.

Where the historical material is inspected but the work does not proceed to an implementation,
the relationship is `HISTORICAL_REFERENCE_ONLY`.

### E · Third-party dependency or tool integration *(illustrative)*

| Field | Value |
| --- | --- |
| Type | `SECURITY_HARDENING` (or as applicable) |
| Source usage | `NONE` — the component is consumed, not incorporated into our source |
| Implementation relationship | `THIRD_PARTY_INTEGRATION` |
| Licence disposition | the component's own — `PERMISSIVE_COMPATIBLE` or `COMPATIBLE_WITH_OBLIGATIONS` |
| Licence obligations | attribution / NOTICE / source-availability, **and where each is discharged** |

Adding a package or CI tool. **The component keeps its own licence**; the question is whether the
intended use is permitted and what obligations follow. `Source usage: NONE` is correct because
our source does not contain theirs — this is dependency consumption, not incorporation. A
component whose licence cannot be established is `UNKNOWN_BLOCKED`.

### F · Feature removal / attack-surface reduction *(real — see `FIL-0001`)*

| Field | Value |
| --- | --- |
| Type | `PRIVACY_HARDENING` + `FEATURE_REMOVAL` |
| Source usage | `NONE` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` — removal of inherited MIT-licensed source |

Removals carry the §8 fields as well: what was removed, whether it was disabled or deleted, why
removal was preferred, the security or privacy value, compatibility impact, and **the guard that
prevents silent upstream reintroduction**.

---

## 11. Entries

Backfilled from evidence already documented in `FORK_DIVERGENCE.md`,
`UPSTREAM_REVIEW_LEDGER.md`, `FORK_STATUS.md` and `.ai/sync-log.md`. **No history was
reconstructed or inferred.** Where a field could not be established from existing documentation
it is marked `BACKFILL_REQUIRED` rather than guessed.

Backfilled entries are deliberately more concise than the §5 schema requires: they record what
the existing registers actually establish. **New entries use the full schema.**

**How `Released in` was established.** Every release attribution below was confirmed by
`git tag --contains <sha>`, not taken on a register's word. Where a register row and tag
containment disagree, the disagreement is recorded in §12 rather than resolved silently. Note
that `.ai/sync-log.md` does not cover every round — several 2026-08-10 commits have bare subject
lines and no chronological entry — which is why `Validation` is `BACKFILL_REQUIRED` on those.

---

### FIL-0001 · Remove the inert Jitsu usage-telemetry module and its phantom opt-out

| Field | Value |
| --- | --- |
| Status | released |
| Type | `PRIVACY_HARDENING` (+ `FEATURE_REMOVAL`) |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `75a9df1812` |
| Released in | `v6.2.0-5` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Upstream source | n/a — upstream retains the module |
| External source | n/a |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` — deletion of MIT-licensed inherited code |
| Licence obligations | none |

**Problem / desired outcome.** Upstream shipped a usage-telemetry module (Jitsu,
`t.calendso.com`) with a vendor write key in source, plus a `CALCOM_TELEMETRY_DISABLED` flag
that **gated nothing** after upstream dropped `next-collect`. An operator setting that flag
believed they had disabled a privacy control that did not exist.

**Decision and rationale.** Delete rather than disable. A disabled-by-default vendor
integration still has to be re-audited by every reviewer, and an upstream merge can silently
re-arm it. Documenting a flag that controls nothing is worse than having no flag.

**Implementation summary.** Removed `packages/lib/telemetry.ts` and related flags; removed the
`next-collect` dependency; removed `CALCOM_TELEMETRY_DISABLED`.

**Intentional divergence from upstream.** Yes, permanent. A sync must not restore the module,
the endpoint, the write key, the flag or the dependency.

| Dimension | Value |
| --- | --- |
| Security impact | Removes a hard-coded third-party credential from source |
| Privacy impact | **Primary gain** — eliminates dormant outbound telemetry |
| Attack-surface impact | Reduced — one fewer dependency and outbound path |
| New trust boundary | no |
| New public endpoint | no |
| New authenticated mutation | no |
| New persistent state or schema | no |
| New external communication | no — **removes** one |
| Compatibility impact | None. The flag it removes was already inert |

**Removal specifics** (per §8): code **deleted**, not disabled. Removal preferred because an
inert integration imposes recurring audit cost and can be silently re-armed.

**Validation.** `BACKFILL_REQUIRED` — the guard script is documented; the original validation
run is not.

**Guards / CI.** `scripts/fork-guard-telemetry.sh`, a **blocking** `forte-ci` step. Four
independent checks: `next-collect` absent from manifests and `yarn.lock`; endpoint and write key
absent from tracked source; `packages/lib/telemetry.ts` absent; `CALCOM_TELEMETRY_DISABLED`
absent. Scans tracked files only, with four documented exclusions for files that must be able to
name what was removed.

**Rollback / disable.** Not applicable — reintroduction is the failure mode the guard prevents.

**Related documentation.** `FORK_DIVERGENCE.md` → Security And Privacy Changes; `README.md` →
Removed from upstream; `.ai/quality-gates.md`.

**Upstream re-evaluation trigger.** Upstream removing the module itself, at which point the
guard can retire.

---

### FIL-0002 · Disable advertising integrations by default in the image

| Field | Value |
| --- | --- |
| Status | released |
| Type | `PRIVACY_HARDENING` |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `d057ef3915` |
| Released in | `v6.2.0-3` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** Upstream ad-click tracking (`gclid` / `li_fat_id`) is real and
still present. A privacy-first self-host should not enable it silently.

**Decision and rationale.** Set privacy-first runtime defaults in the published image
(`GOOGLE_ADS_ENABLED=0`, `LINKEDIN_ADS_ENABLED=0`) rather than delete the code — unlike
telemetry, this is a legitimate opt-in feature for some operators.

**Implementation summary.** Root `Dockerfile` defaults.

**Intentional divergence from upstream.** Yes — defaults only, not behaviour.

| Dimension | Value |
| --- | --- |
| Privacy impact | **Primary gain** — no third-party ad tracking unless explicitly enabled |
| Attack-surface impact | Unchanged — code remains present |
| New external communication | no — suppresses existing ones by default |
| Compatibility impact | Operators wanting ad tracking must opt in explicitly |

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Guards / CI.** None. **This is a known weakness**: an upstream sync could change the default
back without failing any check.

**Related documentation.** `FORK_DIVERGENCE.md`; `README.md`.

---

### FIL-0003 · Run web and API v2 as non-root, with an API v2 health check

| Field | Value |
| --- | --- |
| Status | released |
| Type | `DEPLOYMENT_HARDENING` |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `6800e65e06` |
| Released in | `v6.2.0-5` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** Application processes ran as root in the container.

**Decision and rationale.** Drop to the built-in `node` user before `CMD`; keep writable only
the Next.js/Turbo runtime paths that genuinely require it.

**Implementation summary.** Root `Dockerfile` and `apps/api/v2/Dockerfile`; `USER node`; API v2
gains a `HEALTHCHECK`.

| Dimension | Value |
| --- | --- |
| Security impact | Container escape and in-container privilege abuse materially harder |
| Attack-surface impact | Reduced |
| Compatibility impact | Deployments mounting volumes must match ownership |

**Scope note.** The **build** stage still runs as root. That delta was evaluated separately and
**rejected** — the builder layer is discarded and not part of the published image, so the cost
exceeded the benefit. Recorded in `docs/EXTERNAL_FORK_INTAKE.md` (candidate `C-11`).

**Validation.** Runtime smoke test in `docker-build-and-test` boots the exact image and polls
`/auth/login`.

**Guards / CI.** The release pipeline's runtime test would fail if the image could not start as
`node`.

**Related documentation.** `FORK_DIVERGENCE.md` → Container And Deployment Changes;
`IMAGE_BUILD.md`.

---

### FIL-0004 · Pin Docker base images and third-party Action SHAs; immutable installs

| Field | Value |
| --- | --- |
| Status | released |
| Type | `DEPLOYMENT_HARDENING` (+ `SECURITY_HARDENING`) |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `32aac7c9fa` |
| Released in | `v6.2.0-5` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** Mutable base-image tags and floating Action refs mean the same
source can produce a different artefact, and a compromised upstream tag silently enters the
build.

**Decision and rationale.** Pin base images by digest, third-party Actions by commit SHA, and
use `yarn install --immutable`. Let Dependabot propose deliberate updates rather than accepting
drift.

**Implementation summary.** `Dockerfile`s, `.github/workflows/**`, `docker-compose.yml`
(PostgreSQL and Redis digest-pinned; `CALDIY_IMAGE` override supported).

| Dimension | Value |
| --- | --- |
| Security impact | Removes a supply-chain substitution path |
| Attack-surface impact | Reduced |
| Compatibility impact | Updates become explicit PRs rather than silent drift |

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Guards / CI.** `forte-scorecard` reports on Pinned-Dependencies (**report-only**). Dependabot
covers npm, Actions and base images weekly.

**Known limitation.** Pinning is **not** enforced by a blocking check — a future workflow edit
could unpin without failing CI. See the assurance model's licence/dependency gate design in
[SECURITY_ASSURANCE.md](SECURITY_ASSURANCE.md).

**Related documentation.** `FORK_DIVERGENCE.md`; `IMAGE_BUILD.md`.

---

### FIL-0005 · Strict release identity, build-once, two-architecture finalisation, registry evidence

| Field | Value |
| --- | --- |
| Status | released |
| Type | `DEPLOYMENT_HARDENING` |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `74f8665e6a` |
| Released in | `v6.2.0-5` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** A published image must be traceable to exactly one reviewed
source state, and the artefact that was tested must be the artefact that ships.

**Decision and rationale.** Four coupled changes: publication requires an annotated `vX.Y.Z-N`
tag on `release` whose tree equals `develop`; the post-validation rebuild was removed so each
architecture pushes the exact image that passed runtime and scan checks; AMD64 and ARM64 publish
to staging references first and public tags are finalised only after both succeed; and the run
captures digests, CycloneDX SBOMs, provenance attestations, workflow identity and
`release-record.json`. Manual dispatch can validate but **cannot publish**.

| Dimension | Value |
| --- | --- |
| Security impact | Closes the "tested one image, shipped another" gap; makes release evidence durable |
| Attack-surface impact | Unchanged |
| Compatibility impact | Releases require the full pipeline to succeed; partial releases are treated as incomplete |

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Guards / CI.** The release workflow itself is the guard — **blocking on identity and
provenance**. Note that GHCR retagging is not transactional: a failed finalisation is an
incomplete release requiring inspection before a new build number.

**Related documentation.** `FORK_DIVERGENCE.md` → Release And Supply-Chain Changes;
`RELEASE_PROCESS.md`; `CALDIY_RELEASE_CONTRACT.md`.

---

### FIL-0006 · Replace the upstream CI estate with fork-owned security CI

| Field | Value |
| --- | --- |
| Status | released |
| Type | `SECURITY_HARDENING` (+ `UPSTREAM_DIVERGENCE`) |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `68d13f4d28`; later hardening in `74f8665e6a`, `38e498f196` |
| Released in | `v6.2.0-2`; latest hardening `v6.2.0-5` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** Upstream's CI targets Cal.com's infrastructure, secrets, release
process and test estate. Running it here is meaningless and leaks fork configuration into
upstream-shaped jobs.

**Decision and rationale.** Disable the upstream workflow set; run a small fork-owned estate
instead — `forte-ci` (type-check + telemetry guard, blocking; Biome report-only), plus
`forte-codeql`, `forte-trivy` and `forte-scorecard`.

**Intentional divergence from upstream.** Yes. Removing these workflow files does **not** remove
the corresponding application routes; production scheduling is a deployment responsibility.

| Dimension | Value |
| --- | --- |
| Security impact | Adds SAST, dependency/secret/misconfiguration and posture scanning on review branches |
| Attack-surface impact | Reduced in CI — far fewer workflows with far narrower permissions |
| Compatibility impact | Upstream E2E is not run here; E2E is a local tool |

**Known limitation, stated plainly.** **Every vulnerability scanner in this fork is
report-only.** The blocking gates are about *identity and regression* (type-check, telemetry
guard, release identity), never about *findings*. `type-check` also covers only 8 of 113
packages. A green CI run is therefore not evidence that the tree is free of known
vulnerabilities. This is the central input to the tiered model in
[SECURITY_ASSURANCE.md](SECURITY_ASSURANCE.md).

**Granularity note.** The `FORK_DIVERGENCE.md` row for this is an **aggregate**: the telemetry
guard arrived later in `75a9df1812` (`FIL-0001`) and the Dependabot / SHA-pinning half in
`32aac7c9fa` (`FIL-0004`). This entry covers the CI estate itself, not those.

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Related documentation.** `FORK_DIVERGENCE.md`; `.ai/quality-gates.md`; `SECURITY_REVIEW.md`.

---

### FIL-0007 · Take upstream's forwarded-IP whitespace fix (banlist bypass)

| Field | Value |
| --- | --- |
| Status | released |
| Type | `UPSTREAM_FIX` (+ `SECURITY_HARDENING`) |
| GitHub issue | n/a — predates the backlog |
| PR | n/a |
| Local commit(s) | `29d686fa67`; fork-only formatting follow-up `2ea6ff49b0` |
| Released in | `v6.2.0-5` |
| Implementation relationship | `OFFICIAL_UPSTREAM_CHERRY_PICK` |
| Upstream source | `calcom/cal.diy` commit `038381aeca`; intake by `git cherry-pick -x` on 2026-08-10 |
| External source | n/a |
| Source usage | `SOURCE_INCORPORATED` — the upstream implementation itself, under MIT |
| Licence disposition | `PERMISSIVE_COMPATIBLE` (MIT, same project) |
| Licence obligations | none beyond the existing MIT notice |

**Problem / desired outcome.** Untrimmed whitespace in forwarded headers allowed an IP-banlist
bypass.

**Decision and rationale.** Security-relevant upstream commits are taken by default. Taken in
full, as one cherry-pick, per the selective-intake rule.

**Implementation summary.** Trims forwarded-header whitespace before banlist evaluation. Fork
adaptation kept in a separate follow-up commit, as required.

| Dimension | Value |
| --- | --- |
| Security impact | Closes an IP-banlist bypass |
| Attack-surface impact | Unchanged |
| Compatibility impact | None observed |

**Validation.** Targeted tests passed 23/23; filtered `@calcom/lib` type-check passed.

**Related documentation.** `UPSTREAM_REVIEW_LEDGER.md` → `038381aeca` = `integrated-full`;
`FORK_STATUS.md` → Latest Upstream Review; `.ai/sync-log.md`.

**Upstream re-evaluation trigger.** None — converged with upstream.

**This is the canonical `UPSTREAM_FIX` example**: it appears in *both* ledgers, and the two
entries answer different questions. The upstream ledger records the **disposition** of
`038381aeca`; this entry records **what we implemented and verified**.

---

### FIL-0008 · Repair `packages/lib` type-check coverage and delete the rot it exposed

| Field | Value |
| --- | --- |
| Status | released |
| Type | `ATTACK_SURFACE_REDUCTION` (+ `FEATURE_REMOVAL`) |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `88e8f9e226` |
| Released in | `v6.2.0-5` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** Files in `packages/lib` sat outside the TypeScript gate and had
silently rotted. Bringing them into the gate surfaced orphaned code.

**Decision and rationale.** Fix the gate, then delete what the gate proved was dead rather than
repairing code with no importers.

**Implementation summary.** Brought previously uncompiled `packages/lib` files into the
type-check program. Removed `packages/lib/domainManager/` (orphaned, broken Vercel/Cloudflare
organisation-domain automation, **no importers**) and the duplicate
`packages/lib/formbricks.ts` (orphan of the live feedback path, incompatible with the installed
API client — the active Formbricks integration remains).

**Removal specifics** (per §8): code **deleted**, not disabled, because both had zero importers.

| Dimension | Value |
| --- | --- |
| Security impact | Less unreachable code that a future change could make reachable |
| Attack-surface impact | Reduced |
| Compatibility impact | None — no importers existed |

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Guards / CI.** The repaired type-check program is itself the guard for `packages/lib`.
**Coverage remains 8 of 113 packages overall** — `.ai/sync-log.md` records extending it to the
other 105 as intentionally **not** taken, so this entry must not be read as fixing the gate
generally.

**Granularity note.** Commit `88e8f9e226` carries three `FORK_DIVERGENCE.md` rows (the gate
repair and two removals). They are one entry here because the removals were a direct consequence
of the repair and share its rationale.

**Related documentation.** `FORK_DIVERGENCE.md` → Deliberately Removed Upstream Scope;
`.ai/quality-gates.md`.

---

### FIL-0009 · Bake the `cal.forte` application name into the image

| Field | Value |
| --- | --- |
| Status | released — **incomplete, see below** |
| Type | `PRODUCTIZATION` |
| GitHub issue | [#24](https://github.com/rubennati/cal.diy/issues/24) (completion) |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `4264193f84` |
| Released in | `v6.2.0-3` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` — rebranding is permitted; the MIT notice is **not** touched |
| Licence obligations | The `Copyright (c) 2020-present Cal.com, Inc.` line in `LICENSE` must remain. Rebranding the product surface is permitted; removing attribution is not |

**Problem / desired outcome.** The image should present the fork's identity, not upstream's.

**Decision and rationale.** Pass branding as explicit build arguments rather than patching
constants, so the divergence stays in build configuration.

**Implementation summary.** `NEXT_PUBLIC_APP_NAME=cal.forte` passed by the release action;
`Dockerfile` declares the branding ARGs.

| Dimension | Value |
| --- | --- |
| Security impact | Minor but real — a support address pointing at a third party is a misdirection channel |
| Attack-surface impact | Unchanged |
| Compatibility impact | Build-time only; changing it requires a rebuild and a new tag |

**Known incompleteness — recorded rather than hidden.** The `Dockerfile` declares **three**
branding ARGs (`NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_COMPANY_NAME`,
`NEXT_PUBLIC_SUPPORT_MAIL_ADDRESS`, lines 22-24) plus **two** legal-URL ARGs
(`NEXT_PUBLIC_WEBSITE_TERMS_URL`, `NEXT_PUBLIC_WEBSITE_PRIVACY_POLICY_URL`, lines 7-8). Of those
five, the release action passes **one** — `NEXT_PUBLIC_APP_NAME`. The published image therefore
still ships
`COMPANY_NAME = "Cal.com, Inc."`, `SUPPORT_MAIL_ADDRESS = "help@cal.com"` and
`cal.com/terms` · `cal.com/privacy`. `FORK_DIVERGENCE.md`'s claim that branding is baked
"through explicit build arguments" is true for `NEXT_PUBLIC_APP_NAME` **only**. Tracked as
GitHub [#24](https://github.com/rubennati/cal.diy/issues/24) (P3) and
[#36](https://github.com/rubennati/cal.diy/issues/36) (P2, legal URLs).

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Guards / CI.** None. A future entry should add a built-bundle assertion.

**Related documentation.** `FORK_DIVERGENCE.md`; `docs/SELF_HOST_PRODUCTIZATION.md` §6.4;
`docs/SELF_HOST_CAPABILITY_AUDIT.md` F-16.

---

### FIL-0010 · Redirect vulnerability reports to the fork owner

| Field | Value |
| --- | --- |
| Status | released |
| Type | `PRODUCTIZATION` (+ `SECURITY_HARDENING`) |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `d7747a32d9` |
| Released in | `v6.2.0-2` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** A fork that diverges from upstream must receive its own
vulnerability reports; sending reporters to upstream loses fork-specific findings.

**Implementation summary.** `.well-known/security.txt` and `SECURITY.md` point at the fork
owner. Same commit removed unused upstream scope (`.cursor/`, `.changeset/`, `.vscode/`,
`SPEC-WORKFLOW.md`).

| Dimension | Value |
| --- | --- |
| Security impact | Fork-specific reports reach someone who can act on them |
| Attack-surface impact | Reduced (unused tooling scope removed) |

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Guards / CI.** `.gitattributes` marks identity and security-contact files `merge=ours`, so a
reviewed sync does not silently restore upstream content. **Each clone must configure the merge
driver** (`git config merge.ours.driver true`) — an unconfigured clone loses the guard.

**Related documentation.** `FORK_DIVERGENCE.md`; `UPSTREAM_SYNC.md` → Preconditions.

---

### FIL-0011 · Slim the runtime image (stages 1 and 2)

| Field | Value |
| --- | --- |
| Status | released |
| Type | `ATTACK_SURFACE_REDUCTION` |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `b14e95dbea`, `78527ca3f5`, `08db6081bd` |
| Released in | `v6.2.0-4` |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** The runtime image carried test assets and dev-only tooling.

**Decision and rationale.** Exclude tests and E2E assets, remove dev-only tooling, but retain
Turbo, Prisma migration tooling and `ts-node` app-store seeding because current image startup
still requires them.

| Dimension | Value |
| --- | --- |
| Security impact | Fewer executables and less code in the running container |
| Attack-surface impact | Reduced |
| Compatibility impact | None for supported runtime paths |

**Known consequence.** Retaining `ts-node` and `scripts/` means an operator with container exec
can run `scripts/seed.ts` against production — which creates 7 `Team` rows and an
`admin@example.com` account with a published password. This is the reachability qualifier on
`docs/SELF_HOST_CAPABILITY_AUDIT.md` F-01 and F-22.

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Related documentation.** `FORK_DIVERGENCE.md`; `.ai/slimming-runtime-plan.md`.

---

### FIL-0012 · Publish to the fork's own GHCR namespace

| Field | Value |
| --- | --- |
| Status | released |
| Type | `UPSTREAM_DIVERGENCE` |
| GitHub issue | n/a — predates the issue backlog |
| PR | `BACKFILL_REQUIRED` |
| Local commit(s) | `d9dd269ed8` |
| Released in | fork tag `v6.2.0` (not the upstream release tag) |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** A reviewed fork image must never be confused with an upstream
artefact.

**Implementation summary.** Publishes to `ghcr.io/rubennati/cal.diy` instead of upstream Docker
Hub / Scarf endpoints.

| Dimension | Value |
| --- | --- |
| Security impact | Downstream can pin a digest this fork controls |
| Attack-surface impact | Unchanged |
| Compatibility impact | Downstream must use the fork reference; `latest` is not a trust anchor |

**Naming caveat.** The repository and GHCR path are `cal.diy` while the product identity is
`cal.forte` — a deliberate historical artefact, flagged for trademark review in
`docs/LICENSE_AND_PROVENANCE_REVIEW.md` §3.8.

**Validation.** `BACKFILL_REQUIRED` — no per-change validation record survives for this
commit. See §11's note on the 2026-08-10 round.

**Related documentation.** `FORK_DIVERGENCE.md`; `CALDIY_RELEASE_CONTRACT.md`.

---

### FIL-0013 · Scope the telemetry guard to executable surfaces

| Field | Value |
| --- | --- |
| Status | merged-not-released |
| Type | `MAINTENANCE` / `SECURITY_GUARD_CORRECTION` |
| GitHub issue | n/a |
| PR | `BACKFILL_REQUIRED` — to be filled when this branch is opened as a PR |
| Local commit(s) | `BACKFILL_REQUIRED` — this entry ships in the same commit it describes |
| Released in | not yet released |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `NONE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Problem / desired outcome.** The guard added with the telemetry removal (`75a9df1812`) searched
every tracked file except `.ai/`, `README.md`, the workflow and itself. Once the governance and
audit records landed on `develop`, the guard began failing on documentation that merely *named*
the removed indicators — `FORK_IMPLEMENTATION_LEDGER.md`, `docs/EXTERNAL_FORK_INTAKE.md` and
`docs/EXTERNAL_FORK_INTAKE_EVIDENCE.md`. This is a false-positive scope defect, not a
vulnerability: the protected invariant was never breached, and no telemetry behaviour returned.

**Implementation summary.** Exclusions are now by file semantics rather than by directory:
`*.md` and `*.mdx` are out of scope, everything else is in. The blanket `.ai/` and
`forte-ci.yml` exemptions are removed, so a non-Markdown file in either location is now scanned
for the first time. The guard itself remains the one unavoidable exception. The protected
indicators, the blocking CI step and the deletion of `packages/lib/telemetry.ts` are unchanged.

| Dimension | Value |
| --- | --- |
| Security impact | Invariant preserved; scan scope is net wider on executable surfaces |
| Attack-surface impact | Unchanged — no product code touched |
| Compatibility impact | None |

**Scope deliberately given up.** The guard previously failed if a hardening document
re-advertised `CALCOM_TELEMETRY_DISABLED` as a live control. A fixed-string search cannot tell
that apart from a record that the flag was removed, which is precisely why it fired on the audit
set. Documentation accuracy remains a review obligation under `SECURITY_ASSURANCE.md`; it is no
longer claimed to be machine-enforced.

**Validation.** `scripts/fork-guard-telemetry.test.sh` — 18 assertions covering both directions,
including that an executable placed under `docs/` is still scanned, and that removing the `*.md`
exclusion reproduces the original failure. Guard passes on the real tree; harness verified to
report a failure when an expectation is inverted.

**Related documentation.** `FORK_DIVERGENCE.md` (telemetry removal row); `.ai/divergence.md`;
`.ai/quality-gates.md`.

---

### FIL-0014 · Zoho server-location trust-boundary hardening

| Field | Value |
| --- | --- |
| Status | implemented |
| Type | `SECURITY_HARDENING` / `FORK_FIX` |
| GitHub issue | [#43](https://github.com/rubennati/cal.diy/issues/43) |
| PR | `BACKFILL_REQUIRED` — no PR opened at implementation time |
| Local commit(s) | `BACKFILL_REQUIRED` — this entry ships in the commit it describes |
| Released in | not yet released |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `IMPLEMENTATION_REFERENCE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Source usage detail.** The inherited in-tree implementation was read and repaired, and the
sibling in-tree `zohocrm` and `zoho-bigin` callbacks supplied the allowlist convention this fork
now follows for the same vendor. Region domains come from Zoho's own multi-DC documentation. No
external fork was consulted, and no third-party implementation text was incorporated. All source
material is either this MIT tree or official vendor documentation.

**Problem / desired outcome.** `packages/app-store/zohocalendar` accepted the OAuth `location`
query parameter, type-checked it as a string, mapped `us` and `au` to domain fragments and passed
every other value through unchanged into `https://accounts.zoho.${value}` and
`https://calendar.zoho.${value}`. The token request carries the app's `client_id` and
`client_secret` in its query string, so a `location` of `attacker.example` or
`com@attacker.example` directed those credentials at an attacker-chosen host.

The value was then **persisted** into `ZohoAuthCredentials.server_location` and re-read by
`lib/CalendarService.ts` for token refresh, calendar requests and user-info requests. Because the
attacker's host also supplies `expires_in`, a past value forces a refresh on every subsequent
call — turning a single callback into a durable exfiltration channel for the instance-wide
`client_secret` that required no further attacker action. That persistence path is the part no
scanner flagged.

**Implementation summary.** A canonical region model in `lib/zohoServerLocation.ts` maps the nine
data centres Zoho documents to hosts fixed at build time. `resolveZohoRegion` accepts only a
known region identifier or one of the four domain fragments earlier revisions persisted, and
returns `null` for everything else; `requireZohoRegion` throws on `null`. Both the callback and
every `CalendarService` request path resolve before any credential is read or sent. No hostname
is built by concatenating caller-supplied text anywhere in the app.

Two regions were also **functionally broken** and are repaired by the same change: `ca` produced
`zoho.ca` and `cn` produced `zoho.cn`, where Zoho documents `zohocloud.ca` and `zoho.com.cn`.
Neither could ever have worked.

| Dimension | Value |
| --- | --- |
| Security impact | Reduces credential-exfiltration / SSRF-style trust-boundary risk; a Zoho URL host can no longer inherit caller-supplied text |
| New trust boundary | **NO** — hardens an existing one |
| Public endpoint | **NO** — the callback already required an authenticated session (`callback.ts`), and that check is unchanged |
| Authenticated mutation | **YES** — the callback creates a `Credential` and `SelectedCalendar` row; unchanged except that the persisted region is now validated |
| Persistent state | **YES** — `server_location` is now written as a canonical region and revalidated on every read |
| External communication | **NO NEW** communication; the existing Zoho calls are constrained to documented Zoho hosts |
| Attack-surface impact | Narrowed |
| Compatibility impact | Existing credentials keep working via the legacy aliases; `ca` and `cn` connections start working for the first time |

**Legacy credential behaviour.** A stored value that resolves — a region identifier, or `com`,
`com.au`, `com.cn`, `zohocloud.ca` — continues to work and is rewritten to its canonical region on
the next refresh. Anything else fails closed **before** any request is made, with an error naming
neither the stored value nor any credential material, and directing the operator to reconnect the
app. Nothing is silently normalised into a usable host.

**Validation.** `packages/app-store/zohocalendar/lib/zohoServerLocation.test.ts` (mapping
primitive, 35 rejected input classes) and
`packages/app-store/zohocalendar/lib/CalendarService.serverLocation.test.ts` (behavioural: a
poisoned persisted value reaches no `fetch` on either the valid-token or expired-token path).
Plus `yarn type-check:ci --force`, `yarn biome check`, and the telemetry fork guard and its
self-test.

**Guard.** Security regression tests, not a source-text check. The invariant asserted is
behavioural — every Zoho URL resolves to one of a fixed host set regardless of input — which
survives refactoring, where grepping for a template literal would not. Upstream still carries the
unsafe construction, so an upstream sync that restores it fails these tests.

**Rollback.** Reverting reintroduces the security defect and must not be done to resolve a merge
conflict. One asymmetry matters: this change persists a canonical region (`us`, `au`) where the
previous code persisted a domain fragment (`com`, `com.au`). Older code reading a
newly-written credential would build `accounts.zoho.us`, which is not a Zoho host, so a revert
also degrades US and Australian connections until those credentials are recreated. Prefer fixing
forward.

**Upstream reevaluation trigger.** Official upstream changes Zoho region or host handling, adds
its own validation, or publishes a security fix for `packages/app-store/zohocalendar`. At
implementation time `calcom/cal.diy` carried the same affected behaviour with no fix available.

**Related documentation.** Issue #43; `SECURITY_ASSURANCE.md` §2 (the finding is
`CONFIRMED_SECURITY_DEFECT`, not a confirmed exploited vulnerability — no exploitation was
observed).

---

### FIL-0015 · Intercom configuration request-boundary hardening

| Field | Value |
| --- | --- |
| Status | implemented |
| Type | `SECURITY_HARDENING` / `FORK_FIX` |
| GitHub issue | [#44](https://github.com/rubennati/cal.diy/issues/44) |
| PR | `BACKFILL_REQUIRED` — no PR opened at implementation time |
| Local commit(s) | `BACKFILL_REQUIRED` — this entry ships in the commit it describes |
| Released in | not yet released |
| Implementation relationship | `CAL_FORTE_NATIVE` |
| Source usage | `IMPLEMENTATION_REFERENCE` |
| Licence disposition | `PERMISSIVE_COMPATIBLE` |

**Source usage detail.** The inherited in-tree implementation was read and repaired. The raw-body
webhook route shape follows the existing in-repo convention used by the `alby`, `paypal`,
`btcpayserver` and `stripepayment` webhooks. The signature scheme is Intercom's own documented
Canvas Kit mechanism. No external fork was consulted and no third-party implementation text was
incorporated.

**Problem / desired outcome.** `POST /api/integrations/intercom/configure` was reachable with no
authentication and no Intercom signature verification, on every deployment, whether or not the
Intercom app was installed — the app-store dispatcher
(`apps/web/pages/api/integrations/[...args].ts`) requires a session only for the `add` endpoint, and
the `intercom` handler map entry is unconditional. From that entry point,
`lib/isValidCalURL.ts` built its host check as a regex interpolated from `CAL_URL` without escaping,
so every `.` in the host became a wildcard and single-label names such as `cal-example-com` — which
resolve inside a container network — passed a gate meant to admit only `cal.example.com`. `fetch`
then followed redirects, so any open redirect on the instance origin would have handed the
destination decision back to the response. The same unauthenticated entry point also performed
database reads keyed by a caller-supplied `admin.id`, and wrote the unauthenticated request body to
the server log via `console.dir`.

The legitimate flow had to keep working: Intercom's servers call this endpoint during Canvas Kit
configuration, and an operator must still be able to submit a booking link on their own instance and
have it checked.

**Implementation summary.** Two controls, matching the two halves of the defect.

*Caller authenticity.* `configure` now verifies Intercom's documented `X-Body-Signature` — hex
HMAC-SHA256 over the raw request body, keyed with the app's OAuth `client_secret` — using a
timing-safe comparison. Because the signature covers the raw bytes, body parsing is disabled and the
handler reads the stream itself under a 64 KiB cap; a dedicated route at
`apps/web/pages/api/integrations/intercom/configure.ts` re-declares that config, following the
existing webhook convention and taking Next.js routing precedence over the catch-all dispatcher. If
no client secret is configured the request is refused rather than served, so an uninstalled app is no
longer an open endpoint. `console.dir` of the request body is removed.

*Outbound destination.* `lib/resolveCalBookingUrl.ts` replaces the regex with parsed-URL component
comparison — scheme, port, and host equal to `CAL_URL`'s or an explicit single-dot-boundary
subdomain of it — and rebuilds the request target from those validated components, so caller text
never decides scheme, host or port. Userinfo is rejected rather than stripped. Redirects are no
longer followed (`redirect: "manual"`); a redirect is treated as "not a booking link".

| Dimension | Value |
| --- | --- |
| Security impact | Removes an unauthenticated server-side request primitive and the unauthenticated database read reachable from it |
| New trust boundary | **NO** — constrains an existing one; Intercom was already a caller and this instance was already the fetch target |
| Public endpoint | **WAS YES, NOW NO** — the endpoint is still publicly routable but now serves only signature-verified Intercom requests |
| Authenticated mutation | **NO** — no persistent write; the handler returns canvas JSON |
| Persistent state | **NO** change |
| External communication | **NO NEW** communication; the existing liveness check is constrained to this instance and no longer follows redirects |
| Attack-surface impact | Narrowed |
| Compatibility impact | Legitimate Intercom configuration is unchanged. A submitted link that only resolves via a redirect is now rejected — deliberate, and documented in the code |

**Rate limiting.** Not added, and the reasoning is recorded rather than left implicit: after
signature verification an unauthenticated caller cannot reach any work at all, and a caller holding
the client secret is Intercom. The one remaining pre-authentication cost is reading and hashing a
body, which the 64 KiB cap bounds. Application-level rate limiting would add a control without a
corresponding residual risk.

**Validation.** `resolveCalBookingUrl.test.ts` (URL model, including the `cal-example-com` and
`calxexamplexcom` shapes named in issue #44, plus userinfo, ports, schemes, IPv4/IPv6 literals,
loopback, RFC1918 and link-local metadata), `verifyCanvasSignature.test.ts` (HMAC accept/reject,
tampered body, wrong secret, malformed and absent signatures, unconfigured secret), and
`isValidCalURL.test.ts` (no request before validation, request target is this instance,
`redirect: "manual"`, redirect treated as invalid, no credentials attached). Plus
`yarn type-check`, Biome, and the telemetry guard and its self-test.

**Guard.** Behavioural regression tests, not a source-text check. The asserted invariant — every
resolved request target is this instance, and no unsigned request reaches the step handlers —
survives refactoring, where grepping for a template literal would not. Upstream still carries the
unsafe construction, so a sync that restores it fails these tests.

**Rollback.** Reverting restores an unauthenticated server-side request primitive on every
deployment and must not be done to resolve a merge conflict. Note one asymmetry: the dedicated
route file must be removed together with the handler change, or Next.js will route `configure` to a
handler whose body parsing assumptions no longer match.

**Upstream reevaluation trigger.** Official upstream adds Canvas Kit signature verification, changes
the Intercom configuration flow, or publishes a security fix for
`packages/app-store/intercom`. At implementation time `calcom/cal.diy` carried the same affected
behaviour in every touched file with no fix available.

**Related documentation.** Issue #44; `SECURITY_ASSURANCE.md` §2 — the finding is
`CONFIRMED_SECURITY_DEFECT`; no exploitation was observed or attempted.

---

## 12. Items requiring provenance research

Recorded so they are neither forgotten nor invented. **Do not write entries for these until the
evidence exists.**

| Item | What is missing | Where to look |
| --- | --- | --- |
| Historical aggregate `75c8f5c18f` | Four upstream security patches (`743f988d30`, `4026669e68`, `ca03f007df`, `561cf889ab`) were squashed into one local commit whose message names none of them. File statistics match the sum, and no partial-hunk intake was found, but the provenance is weak by the fork's own standard | `UPSTREAM_REVIEW_LEDGER.md` → Integrated Upstream Commits |
| Earlier upstream intakes | `fb0149453e`→`4d41b2c77d`, `9104545a18`→`b8fb288779`, `0d164da8dd`→`91356f1650`, `b97cd6203d`→`ec0dfcf9cc` have ledger rows but no recorded validation or first-release mapping | `UPSTREAM_REVIEW_LEDGER.md`; `.ai/sync-log.md` |
| `0d164da8dd` decision reversal | Initially rejected over legacy weak-password deletion risk, later accepted in full. The reversal is visible but its rationale is not captured as an implementation record | `UPSTREAM_REVIEW_LEDGER.md` |
| PR numbers for every backfilled entry | The fork's early work appears to predate a PR-based flow | GitHub PR list; `.ai/sync-log.md` |
| Validation performed for `FIL-0001`–`FIL-0006`, `FIL-0008`–`FIL-0012` | Guards and outcomes are documented; the specific checks run at the time are not | `.ai/sync-log.md` |
| Fork-owned `CODEOWNERS` (`a39c99f5e0`), Biome pre-commit handling (`778b4200f7`), URL-safe DB-password guidance (`aa4f4bff79`), Trivy image policy (`38e498f196`) | Each has evidence in `FORK_DIVERGENCE.md` but was judged below the materiality bar for a standalone entry. Re-evaluate if any becomes security-relevant | `FORK_DIVERGENCE.md` |

---

## 13. Maintaining this ledger

1. Allocate the next `FIL-NNNN`. Numbers are never reused, even for withdrawn entries.
2. Fill every schema field; `n/a` is an answer, blank is not.
3. Classify **implementation relationship** (§3.1) and **source usage** (§3.2) — both, always,
   as independent answers. Never record source incorporation or adaptation alongside a native
   claim.
4. Record the **licence disposition** (§4) and any obligation, with where it is discharged.
   Steps 3 and 4 together are a **Definition-of-Done gate**.
5. Link, do not duplicate: the upstream ledger, the divergence register and the audit documents
   keep their own responsibilities.
6. Update `Status` when the change reaches a release, is superseded, or is reverted. Never
   delete an entry.
7. If the change alters steady-state behaviour, add or update the corresponding
   `FORK_DIVERGENCE.md` row and link it here.

The completion rule these steps serve is
[FORK_PROCESS.md → Definition of Done](FORK_PROCESS.md#definition-of-done).
