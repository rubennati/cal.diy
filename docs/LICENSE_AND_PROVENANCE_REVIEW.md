# License And Provenance Review

What the current `cal.forte` licence actually permits, where the boundaries of the MIT grant
lie, and what that means for any proposal to restore or reimplement a stripped capability.

| Item | Value |
| --- | --- |
| Branch of record | `develop` |
| Audited commit | `41689d1d6e3fbef3da14c75ee94ba254542d9235` |
| Audit date | 2026-08-25 · consolidated and language-reviewed 2026-08-26 |
| Method | reading `LICENSE`, package manifests, and git history |
| Companions | [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) · [TEAM_CAPABILITY_EVALUATION.md](TEAM_CAPABILITY_EVALUATION.md) |

> **This is an engineering provenance record, not legal advice.** It establishes *what the
> files say* and *where the boundaries are*, so that decisions are evidence-based. Items marked
> **[LEGAL]** require independent verification by a qualified person before being relied upon.

## 0. The Governing Repository Policy

Everything below explains the evidence. This is the rule the evidence supports, and it is stated as a
**repository policy**, not as a legal conclusion:

> **Historical deleted EE / commercial code must not be copied or restored into `cal.forte` unless the
> applicable licence and provenance independently permit that use.**
>
> **Default: behavioural and reference evidence only.** Reading a deleted file to understand what a
> feature did is research. Copying it — or reproducing it closely enough to be a derivative — is not
> permitted under this default.
>
> **New `cal.forte` implementation must be written cleanly from permitted sources**: the current MIT
> working tree, public interface contracts, and original work.
>
> **Required copyright and licence notices are preserved** in every case, including during rebranding.
>
> **Trademark and branding are a separate question from copyright licensing** and are decided separately
> (§3.8).

The policy is deliberately stricter than any legal conclusion this document reaches. It costs little —
everything worth building here is small enough to write fresh — and it removes the need to resolve the
open questions in §6 before doing useful work.

## 1. What The Current Licence Says — Precisely

Repository root `LICENSE`:

```
MIT License
Copyright (c) 2020-present Cal.com, Inc.
```

The MIT text grants permission to *use, copy, modify, merge, publish, distribute, sublicense,
and/or sell* copies of the Software, "subject to the following conditions". There is exactly
one condition, and it is not optional:

> The above copyright notice and this permission notice shall be included in all copies or
> substantial portions of the Software.

Read plainly, that means:

| Permitted | Required | Not granted |
| --- | --- | --- |
| Fork, modify, rebrand, run commercially, redistribute source or binaries, sublicense, relicense derivatives | Ship the copyright line **and** the full permission notice with every copy or substantial portion — including inside a **container image** | Any trademark right; any warranty; any patent grant (MIT is silent on patents) |

Three consequences that matter for this fork specifically:

1. **"MIT means anything goes" is wrong.** The notice requirement is a real, ongoing
   obligation. A `cal.forte` container image is a distribution of a substantial portion of the
   Software, so `LICENSE` must travel with it and the `Copyright (c) 2020-present Cal.com, Inc.`
   line must not be removed during rebranding. **The root `LICENSE` is not copied into the
   image.** `grep -n LICENSE Dockerfile` matches only `NEXT_PUBLIC_LICENSE_CONSENT` (lines 6 and
   28); the builder stage copies an explicit file list plus `apps`, `example-apps` and
   `packages` (lines 44-50), and the root `LICENSE` is in none of them. Sub-package licences
   *are* carried in, because they live under `packages/` — `packages/embeds/embed-core|embed-react|embed-snippet/LICENSE`
   and `packages/app-store/hitpay|stripepayment/LICENSE` — but those govern their own
   sub-packages, not the work as a whole. See §6 item 2.
2. **Rebranding is permitted; impersonation is not.** MIT grants no trademark licence. "Cal.com"
   and "Cal.diy" are the upstream project's marks. Removing them from the *user interface* is
   permitted and is what a fork should do; removing them from the *copyright notice* is not.
3. **Relicensing derivatives is permitted.** `cal.forte` may license its own new code however it
   wishes. Keeping everything MIT is the simplest choice and avoids a mixed-licence tree.

The root `package.json` has **no `license` field**. `apps/web/package.json` declares
`"version": "6.2.0"` and likewise no licence. Not an error — the `LICENSE` file governs — but
worth noting if SBOM tooling ever reports "license: UNKNOWN" for the root workspace.

## 2. The Relicensing Event

The MIT licence is **new**. It arrived with a single upstream commit:

```
ab21c7f805a089fa3a11ffd61c4a9aecc349c16c
Benny Joo <sldisek783@gmail.com>
Wed Apr 15 21:52:36 2026 +0900
refactor: Cal.diy (#28903)
2811 files deleted
```

`git show ab21c7f805^:LICENSE` — the licence **immediately before** that commit:

> Copyright (c) 2020-present Cal.com, Inc.
>
> Portions of this software are licensed as follows:
>
> * All content that resides under `…/packages/features/ee` and `…/apps/api/v2/src/ee`
>   directory of this repository (Commercial License) is licensed under the license defined in
>   "ee/LICENSE".
> * All third party components incorporated into the Cal.com Software are licensed under the
>   original license provided by the owner of the applicable component.
> * Content outside of the above mentioned directories or restrictions above is available under
>   the "AGPLv3" license as defined below.

`git show ab21c7f805:LICENSE` — the licence **at** that commit: plain MIT.

So one commit simultaneously (a) deleted every `ee/` directory and (b) relicensed what remained
from AGPLv3 to MIT. This is the single most important fact in this document.

### Historical licence map

| Path (pre-strip) | Licence then | Present at HEAD? |
| --- | --- | --- |
| `packages/features/ee/**` (incl. `teams`, `workflows`, `organizations`, `round-robin`, `billing`, `sso`, `dsync`, `managed-event-types`, `impersonation`, `api-keys`, `payments`, `users`, `deployment`, `common`, `integration-attribute-sync`) | **Cal.com Commercial License** | no |
| `apps/api/v2/src/ee/**`, `apps/api/v2/ee/**` | **Cal.com Commercial License** | no |
| `apps/web/ee/**`, `apps/web/modules/ee/**` (incl. `teams`, `workflows`, `organizations`, `billing`, `sso`, `dsync`, `posthog`, `support`) | **Cal.com Commercial License** | no |
| `apps/api/v1/**` | **Cal.com Commercial License** | no |
| `packages/features/pbac/**` (44 files) | **AGPLv3** — it was *outside* `ee/` | no |
| `packages/features/insights/**`, `routing-forms/**`, `organizations/**`, `attributes/**`, `calAIPhone/**`, `delegation-credentials/**`, `instant-meeting/**`, `routing-trace/**`, `workflows/**`, `workspace-platform/**` | **AGPLv3** | no |
| Everything retained at `ab21c7f805` | **AGPLv3 → relicensed to MIT** | yes |

The historical `ee/LICENSE` text (verbatim opening): *"The Cal.com Commercial License (the
"Commercial License") … This software … may only be used in production, if you … have agreed
to, and are in compliance with, the Cal.com Subscription Terms … Subject to the foregoing, it
is forbidden to copy, merge, publish, distribute, sublicense, and/or sell the Software."*

## 3. Provenance Categories

The task's seven categories, resolved against this repository.

### 3.1 Current working-tree MIT code — **usable**

Everything at `41689d1d6e`. Permitted: modify, extend, redistribute, sublicense. Required:
preserve the notice. This includes the entire surviving team **read** backend —
`MembershipRepository`, `EventTypeHostService`, `HostRepository`, `getLuckyUser`, the Prisma
schema — and the `apps/api/v2` `roles.guard.ts` ordered role model.

**This is the category that makes a future team feature feasible at all**: the data model and
service contracts are MIT and may be used freely as the specification for new work.

### 3.2 Newly written `cal.forte` code — **cleanest option**

Original work by this fork. No inherited obligations; may be MIT-licensed to match the tree.
**Every remediation and feature proposal in these audits falls here** — a deny-by-default
permission service, a membership-role service, a team lifecycle service, an assignment UI.

The practical rule: *read the MIT interfaces, write new code against them, never open a
pre-strip blob.*

### 3.3 External fork code — **treat as unverified**

Known intelligence sources: `Enqira/cal.diy`, `Mitch515/cal.diy`, `COG-GTM/cal.com`,
`Biji-Biji-Initiative/cal.com`.

Rules for using them:

- They are **intelligence, not authority.** Another fork's `LICENSE` file states that fork's
  claim; it does not establish that the claim is correct, nor that the code in it was theirs to
  relicense.
- A fork that reintroduced code from `packages/features/ee/**` under an MIT header would be
  **re-publishing Commercial-licensed code with a wrong notice**. Copying from it inherits the
  problem.
- Before importing a single line: identify which pre-strip path it corresponds to, and check
  that path against §2's licence map. If it maps into `ee/**`, stop.
- Behavioural observation ("their round-robin UI shows priority as a dropdown") is fine and
  carries no licence weight. Copying structure, naming and code does.
- **[LEGAL]** Any actual code import from an external fork needs its own provenance review.

### 3.4 Historical code deleted by the strip — **do not restore**

`git show <pre-strip-sha>:<path>` works. It is not permission.

- For `ee/**` paths: the blob was distributed under the **Cal.com Commercial License**, which
  explicitly forbids copying, publishing, distributing and sublicensing. Deleting the file from
  HEAD does not retroactively relicense the blob that history still contains.
- For non-`ee` paths (e.g. `packages/features/pbac`): the blob was distributed under **AGPLv3**.
  Restoring AGPLv3 code into an MIT-licensed distribution is a licence conflict in the other
  direction — AGPLv3 is copyleft, and combining it into a work distributed under MIT terms
  would require the combined work to be offered under AGPLv3, including the network
  source-availability obligation of section 13.
- **[LEGAL]** The strongest argument the other way is that Cal.com, Inc. is the copyright holder
  and can relicense its own code; someone might argue the MIT grant at HEAD covers everything
  the repository has ever contained. The counter-argument is that MIT grants rights in "the
  Software", and the Software as distributed at `ab21c7f805` is the *retained* tree — the same
  commit that granted MIT deliberately removed those files. Contributor licensing (CLA/DCO) for
  third-party contributions to the AGPL portions is a further wrinkle. **This fork should not
  rely on the permissive reading.**

**Operating rule for `cal.forte`: pre-strip blobs are read-only behavioural evidence.** Reading
one to understand *what* a feature did is reasonable engineering research. Copying it — or
reproducing it closely enough to be a derivative — is not.

### 3.5 Previous EE / commercial-licence code — **excluded by policy**

Covered by §3.4. Named here because it is the category most likely to be reached for: the
deleted `packages/features/ee/teams`, `ee/round-robin` and `apps/web/modules/ee/teams` are
exactly the code a "restore Teams" task would want.

What this audit establishes is that those blobs were distributed under a licence whose own text
conditions production use on a Cal.com Enterprise subscription and states that it is forbidden to copy,
merge, publish, distribute or sublicense the software. What it does **not** establish is a legal
conclusion about whether a later MIT grant by the same copyright holder reaches them (§6 item 1). The
§0 policy resolves that gap in the conservative direction, so no legal conclusion is needed to proceed.

### 3.6 Previous AGPL code — **incompatible in the other direction**

The bulk of the pre-strip tree, including `packages/features/pbac`. See §3.4. Note the
asymmetry: the EE category carries a *proprietary* restriction, the AGPL category a *copyleft*
obligation whose section 13 network provision would attach to a combined work. Both are excluded by the
§0 policy; the underlying reasons differ, and so would the remedies if either were ever pursued
deliberately with legal input.

### 3.7 Third-party assets and dependencies — **unchanged and separate**

The pre-strip root `LICENSE` already carved out third-party components ("licensed under the
original license provided by the owner"). The MIT relicensing does not touch them. Practical
implications for `cal.forte`:

- `yarn.lock` dependency licences are governed by each package.
- The release pipeline already produces **CycloneDX SBOMs** per architecture
  ([RELEASE_PROCESS.md](../RELEASE_PROCESS.md) §5), which is the right place to track this.
- Four in-tree sub-`LICENSE` files were checked and are all MIT © Cal.com, Inc.:
  `packages/app-store/hitpay/LICENSE`, `packages/app-store/stripepayment/LICENSE`,
  `packages/embeds/embed-core/LICENSE`, `packages/embeds/embed-react/LICENSE`,
  `packages/embeds/embed-snippet/LICENSE`.
- `.dockerignore` excludes `docs`, so these audit documents add nothing to the image.
- App-store integrations ship third-party **logos and icons** (`packages/app-store/*/static/`).
  Those are vendor trademarks, not MIT-licensed content. **[LEGAL]** if `cal.forte` ever
  distributes them beyond the scope upstream does.

### 3.8 Trademark and branding — **separate from copyright**

MIT grants no trademark rights. Applied to this fork:

| Action | Status |
| --- | --- |
| Rename the app to `cal.forte` in the UI | fine — and correct, since users must not think they are running the upstream product |
| Replace logos and favicons | fine |
| Keep `Copyright (c) 2020-present Cal.com, Inc.` in `LICENSE` | **required** |
| Keep `NEXT_PUBLIC_COMPANY_NAME` default `"Cal.com, Inc."` in `constants.ts:40` | *not* required, and arguably wrong for a fork — see [SELF_HOST_PRODUCTIZATION.md](SELF_HOST_PRODUCTIZATION.md) |
| Link the user-facing "Terms" to `https://cal.com/terms` while the copy says "cal.forte's Terms" | **a real problem** — it attributes Cal.com's legal terms to a different product; see the productization document |
| Publish under `ghcr.io/rubennati/cal.diy` | already the fork's own namespace |

Note the naming tension worth recording: the fork's repository and GHCR path are `cal.diy`
(upstream's community-edition name) while the product identity is `cal.forte`. That is a
deliberate historical artifact, not an error, but it is the kind of thing a trademark review
would ask about. **[LEGAL]**

## 4. Provenance Checklist For Each Proposed Capability

Applied to the candidates in [SELF_HOST_CAPABILITY_AUDIT.md](SELF_HOST_CAPABILITY_AUDIT.md) **§10**
(the ranked candidate registry). **Candidate ids below are the canonical registry ids**; an earlier
draft of this table used a pre-consolidation numbering in which six of nine rows named a different
candidate than the registry assigns. That numbering is retired — see the master's §1.2 crosswalk.

| Candidate | GitHub | Current-tree provenance | External reference | Copy or write? | Historical licence involved | Compatibility confidence | Needs [LEGAL]? |
| --- | --- | --- | --- | --- | --- | --- | --- |
| **P1-A** deny-by-default permission service | #13 | none needed — replaces stubs | none | **write** | none touched | **high** | no |
| **P1-A** (acceptance) authorization tests `T-01…T-14` | #13 | MIT tRPC + Vitest infrastructure | none | **write** | none | **high** | no |
| **P1-C** team role invariants (design) | #33 | MIT `MembershipRepository`, `roles.guard.ts` | none | **write** | pre-strip `ee/teams` is **Commercial** — must not be consulted as a source | **high** if written fresh | no, if fresh |
| **P2-C** legal URL configuration | #36 | MIT `constants.ts`, `Dockerfile`, `start.sh` | none | **write** | none | **high** | **yes** — the choice of *what* URLs to serve is a legal question for the operator |
| **P2-N** remove hosted-Cal upsells | #39 | MIT `apps/web` | none | **delete/edit** | none | **high** — deleting a link to a third party creates no obligation | no |
| **P1-C** (scope) team invitation lifecycle | #33 | MIT token utils + `createOrUpdateMemberships` | none | **write** | pre-strip invite UI was **Commercial** | **high** if written fresh | no, if fresh |
| **P2-G** (scope) host assignment UI | #28 | MIT `IEventTypeHostService`, `HostRepository` | possible — other forks may have UIs | **write** | pre-strip `ee/round-robin`, `modules/ee/teams` are **Commercial** | **high** if written fresh; **low** if copied from any fork | **yes** if any code is imported |
| **P3-D** rebrand hard-coded Cal.com references | #24 · #26 | MIT `constants.ts` | none | **edit** | none | **high**, provided the `LICENSE` notice is untouched | no |
| **P3-A** dead residue cleanup | #27 | MIT | none | **delete** | none | **high** | no |
| Ship the MIT `LICENSE` in the published image (§6 item 2) | #40 | MIT root `LICENSE`; `Dockerfile` | none | **copy the notice** | none — this *preserves* the existing grant | **high** | **yes** if confirmed absent from the artifact |
| Restore PBAC from history | — | — | **excluded by §0 policy** | **AGPLv3** | copyleft obligation unresolved | **yes**, if ever reconsidered |
| Restore Teams UI from history | — | — | **excluded by §0 policy** | **Cal.com Commercial** | subscription condition unresolved | **yes**, if ever reconsidered |
| Restore Workflows / Insights / SAML | — | — | **excluded by §0 policy** | **Commercial** (`ee/workflows`, `ee/sso`) / **AGPLv3** (`features/insights`) | unresolved on both counts | **yes**, if ever reconsidered |

## 5. Standing Rules

1. **Never restore code from git history because it is technically accessible.** Check §2's
   licence map first. If the path was under `ee/`, its blob was Commercial-licensed; if it was elsewhere
   pre-strip, it was AGPLv3. Under the §0 policy neither is copied into this tree absent an independent
   licence and provenance determination.
2. **Never copy old EE or commercial code into `cal.forte`** without independently establishing
   that it is permitted. Nothing in this audit establishes that, and this audit does not attempt to.
3. **Use historical implementations only as behavioural context.** Reading a deleted file to
   learn what a feature did is research; reproducing it is derivation.
4. **Treat external forks' licensing analyses as claims, not authority.** Verify against the
   pre-strip path map, not against their `LICENSE` file.
5. **Never remove the MIT notice or the `Cal.com, Inc.` copyright line** while rebranding.
   Rebrand the product surface; keep the attribution.
6. **Record provenance for every new capability** in [FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md)
   when it lands: original work, upstream cherry-pick, or third-party import.
7. **Any third-party code import gets its own provenance review** before merge, recorded in the
   divergence register with the source, its licence, and the compatibility rationale.

## 6. Unresolved Licensing Questions

All require verification before being relied upon.

1. **[LEGAL]** Does the MIT grant at `ab21c7f805` extend to files deleted *in that same commit*?
   This fork's operating assumption is **no**. A definitive answer would change what may be
   restored — but the safe default costs little, because everything worth building is small
   enough to write fresh.
2. **Confirmed from source: the root `LICENSE` is absent from the image**, because the
   `Dockerfile` never copies it (§1). **[VERIFY]** the same against a pulled image
   (`docker run --rm --entrypoint sh ghcr.io/rubennati/cal.diy:v6.2.0-5@sha256:c2facc… -c 'ls -la /calcom/LICENSE'`)
   before drawing a conclusion, since a base layer or lifecycle step could in principle add it.
   **[LEGAL]** if confirmed absent: does shipping the application without the MIT permission
   notice satisfy the licence condition? Adding one `COPY LICENSE ./` line to the `Dockerfile`
   would settle it either way — but that is a **behavioural change to the image**, which this
   documentation-only pass must not make. It is the single most actionable item in this
   document and belongs in the next release preparation, tracked in
   [SECURITY_REVIEW.md](../SECURITY_REVIEW.md)'s per-release checklist.
3. **[LEGAL]** Are third-party app-store logos and icons redistributable in the fork's image on
   the same footing as upstream's?
4. **[LEGAL]** Does the `cal.diy` repository/GHCR name alongside the `cal.forte` product
   identity create any trademark exposure?
5. **[LEGAL]** Were there contributor-licensing (CLA/DCO) terms on the pre-strip AGPLv3
   contributions that affect the relicensing analysis in §2?
6. **[VERIFY]** Do the CycloneDX SBOMs produced by `release-docker` capture dependency licences,
   or only components? This determines whether §3.7 is already covered by existing process.
7. **[LEGAL]** `packages/app-store/*/LICENSE` files exist for three apps but not the other ~108.
   Is that intentional upstream structure, or are some apps carrying unstated third-party terms?
