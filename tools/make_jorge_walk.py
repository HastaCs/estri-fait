from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "jorge" / "caminando.jpeg"
OUT = BASE / "assets" / "jorge" / "walk_sheet.png"

BG_MAX_BRIGHT = 18
BG_MAX_CHROMA = 14
BLUR_RADIUS = 0.6
PAD = 20
COLS = 4


def is_background(p):
    r, g, b = p
    return (r + g + b) / 3 <= BG_MAX_BRIGHT and (max(p) - min(p)) <= BG_MAX_CHROMA


def background_mask(img):
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


def content_runs(mask, w, h):
    cols = [any(not mask[y * w + x] for y in range(h)) for x in range(w)]
    runs = []
    start = None
    for x, c in enumerate(cols):
        if c and start is None:
            start = x
        if not c and start is not None:
            runs.append((start, x - 1))
            start = None
    if start is not None:
        runs.append((start, w - 1))
    return runs


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size

    mask = background_mask(img)
    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if mask[i] else 255 for i in range(w * h)])
    if BLUR_RADIUS > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))
    rgba = img.convert("RGBA")
    rgba.putalpha(alpha)

    runs = content_runs(mask, w, h)
    frames = []
    for (x0, x1) in runs:
        minx, miny, maxx, maxy = x1, h, x0, 0
        for x in range(x0, x1 + 1):
            for y in range(h):
                if not mask[y * w + x]:
                    minx = min(minx, x)
                    maxx = max(maxx, x)
                    miny = min(miny, y)
                    maxy = max(maxy, y)
        frames.append((minx, miny, maxx, maxy))

    max_w = max(f[2] - f[0] + 1 for f in frames)
    max_h = max(f[3] - f[1] + 1 for f in frames)
    fw = max_w + 2 * PAD
    fh = max_h + 2 * PAD
    baseline = fh - PAD
    rows = (len(frames) + COLS - 1) // COLS

    sheet = Image.new("RGBA", (fw * COLS, fh * rows), (0, 0, 0, 0))
    for i, (minx, miny, maxx, maxy) in enumerate(frames):
        piece = rgba.crop((minx, miny, maxx + 1, maxy + 1))
        col = i % COLS
        row = i // COLS
        x = col * fw + (fw - piece.width) // 2
        y = row * fh + baseline - piece.height
        sheet.paste(piece, (x, y), piece)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT)
    print(
        f"guardado {OUT} sheet={sheet.size} frame={fw}x{fh} "
        f"grid={COLS}x{rows} frames={len(frames)} originY={baseline / fh:.4f}"
    )


if __name__ == "__main__":
    main()
