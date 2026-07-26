# State

Current AI operating assumptions for this fork:

- the fork/release process layer is documented in the root process docs
- upstream sync is approval-gated and must not be assumed
- image publication is approval-gated
- commit creation is approval-gated
- app source changes should be kept smaller than process and workflow changes unless the task clearly requires more

Current documented process baseline:

- fork/release doc layer committed in `73a5313`

Current upstream base:

- The fork tracks cal.com **6.2.0** (`apps/web/package.json` on `main` and `develop`).
- Fork divergence point (merge-base of `develop` and `origin/main`): **`46eb533d`** — the
  last upstream commit `develop` shares with the mirror.
- Upstream mirror `origin/main` is at `3894f37`: 44 commits past the base, still in the
  6.2.0 patch line (no 6.3.0). Those include the already-cherry-picked security fixes;
  the rest are deferred features/refactors.
- ⚠️ Caveat: the repo's own `v6.2.0` tag points at a **fork** commit (`a39c99f5`, "clean
  fork setup"), **not** the upstream cal.com 6.2.0 release. Fork release tags are
  `v6.2.0-1`, `v6.2.0-2`. When pinning a base, use the merge-base / real upstream release,
  not this tag.

Always verify live repo state before acting:

- remotes
- current branch
- staged changes
- workflow targets
