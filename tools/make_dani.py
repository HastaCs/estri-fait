import math
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "dani" / "dani.jpeg"
OUT = BASE / "assets" / "dani" / "dani_idle.png"
OUT_SHEET = BASE / "assets" / "dani" / "dani_idle_sheet.png"

BG_MAX_CHROMA = 22
BG_MIN_BRIGHT = 190
MIN_COMPONENT = 20000
BLUR_RADIUS = 0.6
DILATE = True

IDLE_FRAMES = 8
SHEET_COLS = 4
PAD = 40
ANGLE_DEG = 0.8
BOB_PX = 4.0
PIVOT_BELOW_FEET = 6


def make_idle_sheet(static_img):
    w, h = static_img.size
    cw = w + 2 * PAD
    ch = h + 2 * PAD
    rows = math.ceil(IDLE_FRAMES / SHEET_COLS)
    pivot = (w / 2, h + PIVOT_BELOW_FEET)

    sheet = Image.new("RGBA", (cw * SHEET_COLS, ch * rows), (0, 0, 0, 0))
    for i in range(IDLE_FRAMES):
        phase = 2 * math.pi * i / IDLE_FRAMES
        angle = ANGLE_DEG * math.sin(phase)
        dy = round(-BOB_PX * math.sin(phase))
        frame = static_img.rotate(
            angle, resample=Image.BICUBIC, center=pivot, expand=False
        )
        col = i % SHEET_COLS
        row = i // SHEET_COLS
        sheet.paste(frame, (col * cw + PAD, row * ch + PAD + dy), frame)

    OUT_SHEET.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT_SHEET)
    origin_y = (PAD + h) / ch
    print(
        f"guardado {OUT_SHEET} sheet={sheet.size} frame={cw}x{ch} "
        f"grid={SHEET_COLS}x{rows} originY={origin_y:.4f}"
    )


def is_background(p):
    r, g, b = p
    return (max(p) - min(p)) <= BG_MAX_CHROMA and (r + g + b) / 3 >= BG_MIN_BRIGHT


def background_mask(img):
    w, h = img.size
    px = img.load()
    mask = bytearray(w * h)
    queue = deque()

    def push(x, y):
        if 0 <= x < w and 0 <= y < h:
            i = y * w + x
            if not mask[i] and is_background(px[x, y]):
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


def largest_component(mask, w, h):
    seen = bytearray(w * h)
    best = None
    best_n = 0
    for start in range(w * h):
        if mask[start] or seen[start]:
            continue
        queue = deque([start])
        seen[start] = 1
        pixels = []
        while queue:
            j = queue.popleft()
            pixels.append(j)
            x, y = j % w, j // w
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    k = ny * w + nx
                    if not mask[k] and not seen[k]:
                        seen[k] = 1
                        queue.append(k)
        if len(pixels) > best_n:
            best_n = len(pixels)
            best = pixels
    if best_n < MIN_COMPONENT:
        return None
    return best


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size

    bg = background_mask(img)
    comp = largest_component(bg, w, h)
    if comp is None:
        raise SystemExit("no se encontro el personaje")

    char = bytearray(w * h)
    for j in comp:
        char[j] = 1

    alpha = Image.new("L", (w, h), 0)
    alpha.putdata([255 if char[i] else 0 for i in range(w * h)])
    if DILATE:
        alpha = alpha.filter(ImageFilter.MaxFilter(3))
    if BLUR_RADIUS > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))

    out = img.convert("RGBA")
    out.putalpha(alpha)
    bbox = alpha.getbbox()
    out = out.crop(bbox)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    out.save(OUT)
    print(f"guardado {OUT} tamano={out.size}")

    make_idle_sheet(out)


if __name__ == "__main__":
    main()
