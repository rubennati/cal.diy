# Release notes prose

Optional hand-written prose for a release, one file per tag: `vX.Y.Z-N.md`.

`Release Docker`'s promote job prepends this file verbatim to the GitHub Release body and
then appends an artifact table it generates from `release-record.json`. When no file exists
for a tag, the Release carries the generated artifact record alone and the workflow emits a
notice.

Keep the facts out of here. Digests, refs, source SHA, source tree and workflow run IDs are
rendered from `release-record.json` so the announcement cannot drift from the artifacts —
restating them by hand reintroduces exactly the drift that generation prevents.

Write what the artifact record cannot say: why the release matters, which attack paths it
closes, what it deliberately does **not** claim, and what an operator must know before
upgrading.
