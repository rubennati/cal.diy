# AI Index

This `.ai/` directory is a fork-specific operational layer for AI tools. It is not public documentation.

Start here, then read the authoritative docs:

- [../AGENTS.md](../AGENTS.md)
- [../FORK_PROCESS.md](../FORK_PROCESS.md)
- [../FORK_STATUS.md](../FORK_STATUS.md)
- [../FORK_DIVERGENCE.md](../FORK_DIVERGENCE.md)
- [../FORK_STRATEGY.md](../FORK_STRATEGY.md)
- [../UPSTREAM_SYNC.md](../UPSTREAM_SYNC.md)
- [../UPSTREAM_REVIEW_LEDGER.md](../UPSTREAM_REVIEW_LEDGER.md)
- [../FORK_IMPLEMENTATION_LEDGER.md](../FORK_IMPLEMENTATION_LEDGER.md)
- [../RELEASE_PROCESS.md](../RELEASE_PROCESS.md)
- [../IMAGE_BUILD.md](../IMAGE_BUILD.md)
- [../SECURITY_REVIEW.md](../SECURITY_REVIEW.md)
- [../SECURITY_ASSURANCE.md](../SECURITY_ASSURANCE.md)
- [../CALDIY_RELEASE_CONTRACT.md](../CALDIY_RELEASE_CONTRACT.md)

**Before treating a change as finished**, check
[../FORK_PROCESS.md → Definition of Done](../FORK_PROCESS.md#definition-of-done). The gates in
[quality-gates.md](quality-gates.md) are the *ready-for-review* threshold; the Definition of Done
is the *finished* threshold and includes the licence/provenance gate.

Point-in-time audits of the application tree (public, fork-owned) live in `docs/`:

- [../docs/SELF_HOST_CAPABILITY_AUDIT.md](../docs/SELF_HOST_CAPABILITY_AUDIT.md) — capability inventory + ranked candidates
- [../docs/PBAC_PLACEHOLDER_AUDIT.md](../docs/PBAC_PLACEHOLDER_AUDIT.md) — authorization placeholder call graph
- [../docs/TEAM_CAPABILITY_EVALUATION.md](../docs/TEAM_CAPABILITY_EVALUATION.md) — team architecture & security blockers
- [../docs/LICENSE_AND_PROVENANCE_REVIEW.md](../docs/LICENSE_AND_PROVENANCE_REVIEW.md) — what may and may not be restored
- [../docs/SELF_HOST_PRODUCTIZATION.md](../docs/SELF_HOST_PRODUCTIZATION.md) — legal URLs, upsell residue, branding
- [../docs/EXTERNAL_FORK_INTAKE.md](../docs/EXTERNAL_FORK_INTAKE.md) — external-fork evidence register (discovery only)
- [../docs/EXTERNAL_FORK_INTAKE_EVIDENCE.md](../docs/EXTERNAL_FORK_INTAKE_EVIDENCE.md) — long-form intake record behind that register
- [../docs/RUNTIME_VALIDATION_FINDINGS.md](../docs/RUNTIME_VALIDATION_FINDINGS.md) — runtime evidence: tRPC parity matrix, TOTP error map, 429 attribution
- [../docs/AUDIT_SESSION_HANDOVER.md](../docs/AUDIT_SESSION_HANDOVER.md) — closing record for the 2026-08-25/26 audit session: findings, constraints, open items

They correct several statements in [branding.md](branding.md) and
[hardening-checklist.md](hardening-checklist.md); see the corrections table in the capability audit.

Files in this directory:

- [project-brief.md](project-brief.md) · [state.md](state.md) · [decisions.md](decisions.md) — context & durable decisions
- [divergence.md](divergence.md) — compatibility pointer to the public divergence register
- [sync-log.md](sync-log.md) — timeline of sync / security / release rounds
- [roadmap.md](roadmap.md) — open work · [slimming-analysis.md](slimming-analysis.md) — attack-surface analysis · [slimming-runtime-plan.md](slimming-runtime-plan.md) — runtime-image slim plan
- [architecture.md](architecture.md) — architecture + configuration map (env / DB / file), hardening levers, branding
- [branding.md](branding.md) — branding / white-labeling (build vs runtime), edition (CE vs EE) table
- [env-reference.md](env-reference.md) — every env var: meaning, format, priority, hardening recommendation
- [hardening-checklist.md](hardening-checklist.md) — how/where to apply the top security actions
- [quality-gates.md](quality-gates.md) · [domains/release.md](domains/release.md) — gates & release domain
