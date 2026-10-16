import sys
from pathlib import Path

from PIL import Image, ImageFilter, ImageDraw

SRC = Path("/home/jorge/Downloads/jorge.jpg")
OUT = Path(__file__).resolve().parent.parent / "assets" / "jorge_idle.png"

BG_MIN_BRIGHTNESS = 185
BG_MAX_CHROMA = 26
ERODE_PX = 1
BLUR_RADIUS = 0.6


def is_background(px):
    r, g, b = px[:3]
    chroma = max(r, g, b) - min(r, g, b)
    brightness = (r + g + b) / 3
    return chroma <= BG_MAX_CHROMA and brightness >= BG_MIN_BRIGHTNESS


def build_background_mask(img):
    w, h = img.size
    px = img.load()
    mask = bytearray(w * h)
    stack = []

    def push(x, y):
        i = y * w + x
        if not mask[i] and is_background(px[x, y]):
            mask[i] = 1
            stack.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)

    while stack:
        x, y = stack.pop()
        if x > 0:
            push(x - 1, y)
        if x < w - 1:
            push(x + 1, y)
        if y > 0:
            push(x, y - 1)
        if y < h - 1:
            push(x, y + 1)

    return mask


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size

    bg = build_background_mask(img)

    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if bg[i] else 255 for i in range(w * h)])

    if ERODE_PX > 0:
        size = ERODE_PX * 2 + 1
        alpha = alpha.filter(ImageFilter.MinFilter(size))
    if BLUR_RADIUS > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))

    out = img.convert("RGBA")
    out.putalpha(alpha)

    bbox = alpha.getbbox()
    if bbox:
        out = out.crop(bbox)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    print(f"guardado {OUT} tamaño={out.size} bbox_origen={bbox}")


if __name__ == "__main__":
    sys.exit(main())
