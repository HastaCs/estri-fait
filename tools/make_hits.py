"""Genera el spritesheet de impactos (destellos) desde assets/hits/hit.gif.

- Usa 2 frames del GIF para una animacion corta (impacto -> disipacion).
- Convierte el fondo oscuro en alpha (el brillo hace de opacidad).
- Genera varias tintas en filas: cada color tiene sus 2 frames.

Salida: assets/hits/hit_sheet.png (2 columnas x N colores).
"""
import sys
from pathlib import Path

from PIL import Image, ImageSequence

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "hits" / "hit.gif"
OUT = BASE / "assets" / "hits" / "hit_sheet.png"

PICK = (1, 4)
PAD = 6
CROP_BOTTOM = 55
BG_DARK = 45
BG_RANGE = 155

COLORS = [
    ("hitWhite", (255, 255, 255)),
    ("hitYellow", (255, 230, 90)),
    ("hitOrange", (255, 150, 50)),
    ("hitRed", (255, 70, 70)),
    ("hitCyan", (90, 230, 255)),
    ("hitMagenta", (255, 90, 230)),
    ("hitGreen", (90, 255, 150)),
]


def to_alpha(frame):
    frame = frame.convert("RGB")
    w, h = frame.size
    px = frame.load()
    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    op = out.load()
    for y in range(h):
        for x in range(w):
            r, g, b = px[x, y]
            lum = (r + g + b) / 3
            a = int(max(0, min(255, (lum - BG_DARK) * 255 / BG_RANGE)))
            op[x, y] = (255, 255, 255, a)
    return out


def main():
    im = Image.open(SRC)
    frames = [fr.convert("RGB") for fr in ImageSequence.Iterator(im)]
    chosen = [
        to_alpha(
            frames[i].crop(
                (0, 0, frames[i].width, frames[i].height - CROP_BOTTOM)
            )
        )
        for i in PICK
    ]

    minx, miny, maxx, maxy = chosen[0].size[0], chosen[0].size[1], 0, 0
    for fr in chosen:
        bb = fr.getchannel("A").getbbox()
        minx = min(minx, bb[0])
        miny = min(miny, bb[1])
        maxx = max(maxx, bb[2])
        maxy = max(maxy, bb[3])
    crop = (minx, miny, maxx, maxy)

    cw = maxx - minx + 2 * PAD
    ch = maxy - miny + 2 * PAD
    sheet = Image.new("RGBA", (cw * len(PICK), ch * len(COLORS)), (0, 0, 0, 0))

    for row, (_name, color) in enumerate(COLORS):
        for col, fr in enumerate(chosen):
            piece = fr.crop(crop)
            tinted = Image.new("RGBA", piece.size, (color[0], color[1], color[2], 0))
            tinted.putalpha(piece.getchannel("A"))
            sheet.alpha_composite(tinted, (col * cw + PAD, row * ch + PAD))

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT)
    print(
        f"frame={cw}x{ch} cols={len(PICK)} rows={len(COLORS)} "
        f"colors={','.join(c[0] for c in COLORS)}"
    )


if __name__ == "__main__":
    main()
