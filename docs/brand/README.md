# cal.forte brand

The fork's own visual identity. It exists because a hardened distribution should be
recognisable *as itself* — a reader landing on this repository, or on a running instance,
should be able to tell in one second that this is not upstream Cal.diy and not Cal.com.

Trademark boundary, in one line: MIT grants no trademark rights, so this fork ships **its
own** mark and never Cal.com's — while the `Copyright (c) 2020-present Cal.com, Inc.`
notice stays exactly where it is. The reasoning is in
[LICENSE_AND_PROVENANCE_REVIEW.md §3.8](../LICENSE_AND_PROVENANCE_REVIEW.md).

## Assets

| File | Use |
| --- | --- |
| [`forte-banner-dark.svg`](forte-banner-dark.svg) · [`forte-banner-light.svg`](forte-banner-light.svg) | README header, docs covers, release notes. Paired via `<picture>` so each GitHub theme gets the right one |
| [`forte-lockup-dark.svg`](forte-lockup-dark.svg) · [`forte-lockup-light.svg`](forte-lockup-light.svg) | mark + wordmark on a transparent background — slides, in-app header, anywhere the banner is too big |
| [`forte-mark.svg`](forte-mark.svg) | the shield alone: favicon, avatar, container-registry icon. One file for every background — the cells are transparent holes, not painted fills |

## The mark

A shield cut from a calendar grid: three day cells and one reviewed day. It is the fork's
argument in one shape — a calendar you can audit. It stays legible down to 16 px, where the
silhouette and the accent carry it.

## Palette — "Forge"

Warm copper on graphite. Chosen to be unlike upstream's monochrome *and* unlike the blue that
every other security tool defaults to.

| Token | Hex | Use |
| --- | --- | --- |
| `ember` | `#E2703A` | the accent: mark, dots, badge fills, one grid cell |
| `ember-deep` | `#C0501C` | bottom of the mark's gradient only |
| `ink` | `#0B0F14` | dark surface, and text on light surfaces |
| `paper` | `#FFFFFF` | light surface |
| `text-light` | `#E9EEF4` | text on `ink` |
| `steel-light` / `steel-dark` | `#5A6673` / `#8B98A5` | muted text — taglines, the `cal` half of the wordmark |
| `line-light` / `line-dark` | `#E4E8ED` / `#1E2733` | hairlines, card borders, grid cells |

`ember` is a **graphic** accent. It clears 4.5:1 on `ink`, but only ~3.6:1 on white — fine for
large display type, borders and shapes, not for body copy on a light background.

## Type

[Inter](https://rsms.me/inter/) (SIL OFL 1.1), the typeface the app already ships in
`apps/web/public/fonts`. In the wordmark, `cal` is Regular and muted, the dot is the accent,
and `forte` is Bold — the fork's half is the loud half.

All type in these assets is **converted to outlines**. GitHub serves SVG as an image, where web
fonts never load, so anything left as `<text>` would render in whatever font the viewer happens
to have.

## Regenerating

`build.py` is the source of truth; the SVGs are build output, committed so the README works
without a toolchain. It needs `fonttools` — a local tool, deliberately not a repo dependency:

```bash
python3 -m venv .venv && .venv/bin/pip install "fonttools[woff]"
.venv/bin/python docs/brand/build.py
```

`--palette steel|signal` renders the two alternates that were considered, so the choice can be
re-examined without redrawing anything.

## Where the identity is applied — and where it is not

| Surface | State |
| --- | --- |
| Repository README | **done** — banner + badge row |
| Brand assets and guide | **done** — this directory |
| GitHub repo description, topics, social preview | **not done** — repository settings, still upstream's |
| App logo, favicon, `NEXT_PUBLIC_APP_NAME` in the published image | **not done** — build-time, needs a Dockerfile `ARG`; see [`.ai/branding.md`](../../.ai/branding.md) |
| Terms / Privacy links in the app | **not done** — still point at Cal.com; see [`SELF_HOST_PRODUCTIZATION.md`](../SELF_HOST_PRODUCTIZATION.md) |
