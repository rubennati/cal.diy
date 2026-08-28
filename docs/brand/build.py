#!/usr/bin/env python3
"""Generate the cal.forte brand assets (mark, lockup, banner) as static SVG.

Type is converted to outlines from the Inter variable font already vendored in
`apps/web/public/fonts`, so the rendered assets never depend on a font being
installed on the viewer's machine — GitHub serves SVG as an image, where web
fonts do not load.

Usage (needs fonttools with woff2 support, not a repo dependency):

    python3 -m venv .venv && .venv/bin/pip install "fonttools[woff]"
    .venv/bin/python docs/brand/build.py

Palette: see docs/brand/README.md. Pass --palette to render an alternate.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path

from fontTools.misc.transform import Transform
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

ROOT = Path(__file__).resolve().parents[2]
FONT = ROOT / "apps/web/public/fonts/Inter-roman.var.woff2"
OUT = ROOT / "docs/brand"

REGULAR, MEDIUM, BOLD = 400, 500, 700


@dataclass(frozen=True)
class Palette:
    name: str
    ember: str  # accent, top of the gradient
    ember_deep: str  # accent, bottom of the gradient
    ink: str  # dark surface
    paper: str  # light surface
    text_dark: str  # text on the light surface
    text_light: str  # text on the dark surface
    steel_light: str  # muted text on the light surface
    steel_dark: str  # muted text on the dark surface
    line_light: str
    line_dark: str


PALETTES = {
    # Forge — warm copper against graphite. Deliberately unlike upstream's
    # monochrome, and unlike the blue every other security tool uses.
    "forge": Palette(
        name="forge",
        ember="#E2703A",
        ember_deep="#C0501C",
        ink="#0B0F14",
        paper="#F7F9FB",
        text_dark="#0B0F14",
        text_light="#E9EEF4",
        steel_light="#5A6673",
        steel_dark="#8B98A5",
        line_light="#E4E8ED",
        line_dark="#1E2733",
    ),
    # Steel — cool and institutional.
    "steel": Palette(
        name="steel",
        ember="#4C8DF6",
        ember_deep="#2B5FD9",
        ink="#0B0F14",
        paper="#F7F9FB",
        text_dark="#0B0F14",
        text_light="#E9EEF4",
        steel_light="#5A6673",
        steel_dark="#8B98A5",
        line_light="#E4E8ED",
        line_dark="#1E2733",
    ),
    # Signal — verified-green, closest to "audit passed".
    "signal": Palette(
        name="signal",
        ember="#2FB57C",
        ember_deep="#158A5A",
        ink="#0B0F14",
        paper="#F7F9FB",
        text_dark="#0B0F14",
        text_light="#E9EEF4",
        steel_light="#5A6673",
        steel_dark="#8B98A5",
        line_light="#E4E8ED",
        line_dark="#1E2733",
    ),
}

_fonts: dict[int, TTFont] = {}


def _font(wght: int) -> TTFont:
    if wght not in _fonts:
        _fonts[wght] = instantiateVariableFont(TTFont(FONT), {"wght": wght}, inplace=False)
    return _fonts[wght]


def text_path(text: str, wght: int, size: float, x: float, y: float, tracking: float = 0.0):
    """Outline `text` with the baseline at `y`. Returns (path_data, end_x)."""
    font = _font(wght)
    upm = font["head"].unitsPerEm
    scale = size / upm
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]
    pen = SVGPathPen(glyphs, ntos=lambda v: f"{v:.2f}")
    cursor = x
    for ch in text:
        name = cmap[ord(ch)]
        glyphs[name].draw(TransformPen(pen, Transform(scale, 0, 0, -scale, cursor, y)))
        cursor += hmtx[name][0] * scale + tracking
    return pen.getCommands(), cursor


def text_width(text: str, wght: int, size: float, tracking: float = 0.0) -> float:
    return text_path(text, wght, size, 0, 0, tracking)[1]


# Left side bearing of the first glyph, so optically-aligned lines can be nudged
# onto the same left edge instead of the same origin.
def lsb(ch: str, wght: int, size: float) -> float:
    font = _font(wght)
    scale = size / font["head"].unitsPerEm
    name = font.getBestCmap()[ord(ch)]
    return font["hmtx"][name][1] * scale


def wordmark(size: float, x: float, y: float, p: Palette, on_dark: bool) -> tuple[str, float]:
    """`cal` muted · `.` accent · `forte` full-contrast — the fork's half is the loud one."""
    tracking = -0.9 * size / 64
    body = p.text_light if on_dark else p.text_dark
    muted = p.steel_dark if on_dark else p.steel_light
    parts = [("cal", REGULAR, muted), (".", BOLD, p.ember), ("forte", BOLD, body)]
    out, cursor = [], x
    for text, wght, fill in parts:
        d, cursor = text_path(text, wght, size, cursor, y, tracking)
        out.append(f'<path d="{d}" fill="{fill}"/>')
    return "\n    ".join(out), cursor


def mark(p: Palette, grad_id: str = "fm") -> str:
    """Shield cut from a calendar grid: three day cells and one reviewed day.

    One file for every background — the cells are holes, not painted fills.
    """
    shield = (
        "M13 6 h38 a5 5 0 0 1 5 5 v21.5 c0 11.4-8 19.6-24 25.5 "
        "C16 52.1 8 43.9 8 32.5 V11 a5 5 0 0 1 5-5 Z"
    )
    cells = []
    for cx, cy in ((21, 15), (34, 15), (21, 28)):
        cells.append(f"M{cx + 2.5} {cy} h4 a2.5 2.5 0 0 1 2.5 2.5 v4 a2.5 2.5 0 0 1-2.5 2.5 h-4 "
                     f"a2.5 2.5 0 0 1-2.5-2.5 v-4 A2.5 2.5 0 0 1 {cx + 2.5} {cy} Z")
    # Check mark, authored on a 24-unit grid and scaled into the fourth cell.
    check = [(5.62, 9.83), (9.55, 13.76), (18.38, 4.93), (20.5, 7.05), (9.55, 18.0), (3.5, 11.95)]
    s, ox, oy = 9 / 24 * 1.35, 33.0, 26.4
    pts = " ".join(f"{'M' if i == 0 else 'L'}{ox + px * s:.2f} {oy + py * s:.2f}"
                   for i, (px, py) in enumerate(check))
    cells.append(f"{pts} Z")
    return (
        f'<defs><linearGradient id="{grad_id}" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0" stop-color="{p.ember}"/>'
        f'<stop offset="1" stop-color="{p.ember_deep}"/></linearGradient></defs>'
        f'\n    <path fill-rule="evenodd" fill="url(#{grad_id})" d="{shield} {" ".join(cells)}"/>'
    )


def svg(width: float, height: float, body: str, title: str) -> str:
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width:g} {height:g}" '
        f'width="{width:g}" height="{height:g}" role="img" aria-label="{title}">\n'
        f"    <title>{title}</title>\n    {body}\n</svg>\n"
    )


def build_mark(p: Palette) -> str:
    return svg(64, 64, mark(p), "cal.forte")


def build_lockup(p: Palette, on_dark: bool) -> str:
    size, mark_px, gap = 46, 64, 18
    x = mark_px + gap
    wm, end = wordmark(size, x, 52.7, p, on_dark)
    body = (
        f'<g transform="translate(0 4)">{mark(p, "lm")}</g>\n    {wm}'
    )
    return svg(round(end + 2), 72, body, "cal.forte")


def build_banner(p: Palette, on_dark: bool) -> str:
    W, H = 1200, 260
    bg = p.ink if on_dark else p.paper
    line = p.line_dark if on_dark else p.line_light
    muted = p.steel_dark if on_dark else p.steel_light
    body = p.text_light if on_dark else p.text_dark

    parts: list[str] = []
    parts.append(
        '<defs>'
        f'<clipPath id="card"><rect x="0.75" y="0.75" width="{W - 1.5}" height="{H - 1.5}" rx="20"/>'
        f'</clipPath>'
        f'<linearGradient id="fade" x1="820" y1="0" x2="1200" y2="0" gradientUnits="userSpaceOnUse">'
        f'<stop offset="0" stop-color="#fff" stop-opacity="0"/>'
        f'<stop offset="1" stop-color="#fff" stop-opacity="1"/></linearGradient>'
        f'<mask id="fadeMask"><rect x="800" y="0" width="400" height="{H}" fill="url(#fade)"/></mask>'
        f'<radialGradient id="glow"><stop offset="0" stop-color="{p.ember}" stop-opacity="'
        f'{0.16 if on_dark else 0.07}"/><stop offset="1" stop-color="{p.ember}" stop-opacity="0"/>'
        f'</radialGradient></defs>'
    )
    parts.append(f'<rect x="0.75" y="0.75" width="{W - 1.5}" height="{H - 1.5}" rx="20" '
                 f'fill="{bg}" stroke="{line}" stroke-width="1.5"/>')
    parts.append('<circle cx="100" cy="98" r="190" fill="url(#glow)"/>')

    # Calendar-grid motif, bleeding off the right edge so it reads as texture.
    cells = []
    pitch, box = 58, 44
    for row in range(5):
        for col in range(6):
            cx, cy = 900 + col * pitch, -16 + row * pitch
            if (col, row) == (4, 2):
                fill, stroke, opacity = p.ember, "none", ""
            elif (col, row) in ((2, 1), (3, 3)):
                fill, stroke, opacity = muted, "none", ' opacity="0.30"'
            else:
                fill, stroke, opacity = "none", line, ""
            cells.append(f'<rect x="{cx}" y="{cy}" width="{box}" height="{box}" rx="12" fill="{fill}" '
                         f'stroke="{stroke}" stroke-width="1.5"{opacity}/>')
    parts.append(f'<g clip-path="url(#card)" mask="url(#fadeMask)">{"".join(cells)}</g>')

    parts.append(f'<g transform="translate(56 54) scale({88 / 64})">{mark(p, "bm")}</g>')

    wm_size, wm_x, wm_baseline = 60, 180, 120
    wm, _ = wordmark(wm_size, wm_x, wm_baseline, p, on_dark)
    parts.append(wm)

    text_left = wm_x + lsb("c", REGULAR, wm_size)
    tagline = "Security-first, review-gated fork of Cal.diy"
    d, _ = text_path(tagline, REGULAR, 19, text_left - lsb("S", REGULAR, 19), 166, -0.2)
    parts.append(f'<path d="{d}" fill="{muted}"/>')

    chips = ("reviewed diffs", "digest-pinned images", "documented divergence")
    cursor = text_left
    for i, chip in enumerate(chips):
        if i:
            parts.append(f'<circle cx="{cursor + 3:.1f}" cy="201" r="2" fill="{muted}" opacity="0.6"/>')
            cursor += 16
        parts.append(f'<circle cx="{cursor + 3.5:.1f}" cy="201" r="3.5" fill="{p.ember}"/>')
        cursor += 15
        d, cursor = text_path(chip, MEDIUM, 14.5, cursor, 206, -0.1)
        parts.append(f'<path d="{d}" fill="{body}" opacity="0.82"/>')
        cursor += 14

    return svg(W, H, "\n    ".join(parts), "cal.forte — security-first, review-gated fork of Cal.diy")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--palette", default="forge", choices=sorted(PALETTES))
    ap.add_argument("--out", default=str(OUT))
    ap.add_argument("--suffix", default="")
    args = ap.parse_args()

    p = PALETTES[args.palette]
    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    sfx = args.suffix
    assets = {
        f"forte-mark{sfx}.svg": build_mark(p),
        f"forte-lockup-light{sfx}.svg": build_lockup(p, on_dark=False),
        f"forte-lockup-dark{sfx}.svg": build_lockup(p, on_dark=True),
        f"forte-banner-light{sfx}.svg": build_banner(p, on_dark=False),
        f"forte-banner-dark{sfx}.svg": build_banner(p, on_dark=True),
    }
    for name, content in assets.items():
        (out / name).write_text(content, encoding="utf-8")
        print(f"wrote {out / name}  ({len(content)} bytes)")


if __name__ == "__main__":
    main()
