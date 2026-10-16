from collections import deque
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent.parent

ALPHA_CUT = 64
ALPHA_SOLID = 160
MIN_COMPONENT = 1500
PAD = 20
COLS = 6
ROWS = 6


def clean_alpha(img):
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < ALPHA_CUT:
                px[x, y] = (0, 0, 0, 0)
    return img


def components(img):
    w, h = img.size
    px = img.load()
    mask = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            if px[x, y][3] > ALPHA_SOLID:
                mask[y * w + x] = 1
    seen = bytearray(w * h)
    comps = []
    for i in range(w * h):
        if mask[i] and not seen[i]:
            q = deque([i])
            seen[i] = 1
            minx = maxx = i % w
            miny = maxy = i // w
            n = 0
            while q:
                j = q.popleft()
                n += 1
                x, y = j % w, j // w
                minx = min(minx, x)
                maxx = max(maxx, x)
                miny = min(miny, y)
                maxy = max(maxy, y)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and mask[ny * w + nx] and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        q.append(ny * w + nx)
            if n >= MIN_COMPONENT:
                comps.append((minx, miny, maxx, maxy))
    return comps


def process(src, out):
    img = clean_alpha(Image.open(src).convert("RGBA"))
    w, h = img.size
    pitch_x = w // COLS
    pitch_y = h // ROWS

    grid = {}
    for (minx, miny, maxx, maxy) in components(img):
        cx = (minx + maxx) // 2
        cy = (miny + maxy) // 2
        grid[(cy // pitch_y, cx // pitch_x)] = (minx, miny, maxx, maxy)

    cells = []
    ground_rel = 0
    for r in range(ROWS):
        for c in range(COLS):
            bb = grid.get((r, c))
            if bb is None:
                continue
            cells.append((r, c, bb))
            ground_rel = max(ground_rel, bb[3] - r * pitch_y)

    max_w = max(bb[2] - bb[0] + 1 for (_, _, bb) in cells)
    fw = max_w + 2 * PAD
    fh = pitch_y + 2 * PAD
    baseline = PAD + ground_rel

    sheet = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    for (r, c, (minx, miny, maxx, maxy)) in cells:
        piece = img.crop((minx, miny, maxx + 1, maxy + 1))
        x = c * fw + (fw - piece.width) // 2
        y = r * fh + PAD + (miny - r * pitch_y)
        sheet.paste(piece, (x, y), piece)

    out.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out)
    print(
        f"guardado {out} sheet={sheet.size} frame={fw}x{fh} "
        f"grid={COLS}x{ROWS} frames={len(cells)} originY={baseline / fh:.4f}"
    )


def main():
    base = BASE / "assets" / "agustin"
    process(base / "saltando.png", base / "jump_sheet.png")
    process(base / "puño.png", base / "punch_sheet.png")


if __name__ == "__main__":
    main()
