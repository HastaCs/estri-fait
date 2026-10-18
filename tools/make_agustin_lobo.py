"""Recorta el fondo negro de assets/agustin/transformacion/lobo.png y guarda
assets/agustin/transformacion/lobo_invocation.png con alpha real.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import imgclean

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "lobo.png"
OUT = BASE / "assets" / "agustin" / "transformacion" / "lobo_invocation.png"

DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))
BLACK_MAX = 14
BLACK_CHROMA = 18


def is_background(p):
    r, g, b = p[:3]
    return (r + g + b) / 3 <= BLACK_MAX and (max(p[:3]) - min(p[:3])) <= BLACK_CHROMA


def black_mask(img):
    w, h = img.size
    px = img.load()
    mask = bytearray(w * h)
    queue = deque()

    def push(x, y):
        i = y * w + x
        if 0 <= x < w and 0 <= y < h and not mask[i] and is_background(px[x, y]):
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

    return mask


def main():
    img = Image.open(SRC).convert("RGBA")
    w, h = img.size
    mask = black_mask(img)
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
