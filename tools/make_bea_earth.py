"""Recorta el fondo verde (chroma) de assets/bea/earth.jpg y guarda
assets/bea/bea_invocation.png con alpha real.

Flood-fill desde los bordes con clave de verde, para no borrar las tierras
verdes del interior del planeta.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import imgclean

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "bea" / "earth.jpg"
OUT = BASE / "assets" / "bea" / "bea_invocation.png"

DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
GREEN_MIN = 120
GREEN_MARGIN = 45


def is_green(p):
    r, g, b = p[:3]
    return g >= GREEN_MIN and (g - max(r, b)) >= GREEN_MARGIN


def is_pure_green(p):
    r, g, b = p[:3]
    return g >= 180 and (g - max(r, b)) >= 110


def green_mask(img):
    w, h = img.size
    px = img.load()
    mask = bytearray(w * h)
    queue = deque()

    def push(x, y):
        i = y * w + x
        if 0 <= x < w and 0 <= y < h and not mask[i] and is_green(px[x, y]):
            mask[i] = 1
            queue.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while queue:
        x, y = queue.popleft()
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)

    for y in range(h):
        for x in range(w):
            i = y * w + x
            if not mask[i] and is_pure_green(px[x, y]):
                mask[i] = 1

    return mask


def main():
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    mask = green_mask(img)
    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if mask[i] else 255 for i in range(w * h)])
    img.putalpha(alpha)

    img = imgclean.erode_alpha(img, 2)
    img = imgclean.bleed_colors(img)
    img = imgclean.smooth_alpha(img, radius=0.6)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT)
    print(f"guardado {OUT} {img.size}")


if __name__ == "__main__":
    main()
