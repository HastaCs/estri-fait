from collections import deque
from pathlib import Path

from PIL import Image

import imgclean

BASE = Path(__file__).resolve().parent.parent

ALPHA_CUT = 64
ALPHA_SOLID = 160
MIN_COMPONENT = 1500
PAD = 20
COLS = 6
ROWS = 6

WM_COLOR = (124, 48, 238)
WM_TOL = 90

DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def near(p, t, tol):
    return abs(p[0] - t[0]) + abs(p[1] - t[1]) + abs(p[2] - t[2]) <= tol


def is_watermark(r, g, b):
    if near((r, g, b), WM_COLOR, WM_TOL):
        return True
    if b >= 88 and (b - r) >= 20 and r >= g and (b - g) >= 32:
        return True
    return b > g + 10 and b >= 120 and -10 <= (r - g) <= 28


def build_watermark_mask(data, w, h):
    n = w * h
    wm = bytearray(n)
    for i in range(n):
        d = data[i]
        if d[3] > 0 and is_watermark(d[0], d[1], d[2]):
            wm[i] = 1
    dilated = bytearray(wm)
    for y in range(h):
        base = y * w
        for x in range(w):
            i = base + x
            if not wm[i]:
                continue
            if x > 0 and data[i - 1][3] > 0:
                dilated[i - 1] = 1
            if x < w - 1 and data[i + 1][3] > 0:
                dilated[i + 1] = 1
            if y > 0 and data[i - w][3] > 0:
                dilated[i - w] = 1
            if y < h - 1 and data[i + w][3] > 0:
                dilated[i + w] = 1
    return dilated


def opaque_components(data, w, h):
    n = w * h
    opaque = bytearray(n)
    for i in range(n):
        if data[i][3] > 0:
            opaque[i] = 1
    seen = bytearray(n)
    char = bytearray(n)
    for i in range(n):
        if opaque[i] and not seen[i]:
            q = deque([i])
            seen[i] = 1
            comp = []
            while q:
                j = q.popleft()
                comp.append(j)
                x, y = j % w, j // w
                for dx, dy in DIRS:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        k = ny * w + nx
                        if opaque[k] and not seen[k]:
                            seen[k] = 1
                            q.append(k)
            if len(comp) >= MIN_COMPONENT:
                for j in comp:
                    char[j] = 1
    return char


def clean_watermark(img):
    w, h = img.size
    n = w * h
    data = list(img.getdata())

    for i in range(n):
        if data[i][3] < ALPHA_CUT:
            data[i] = (0, 0, 0, 0)

    wm = build_watermark_mask(data, w, h)
    char = opaque_components(data, w, h)

    for i in range(n):
        if wm[i] and not char[i]:
            data[i] = (0, 0, 0, 0)

    known = bytearray(n)
    fill = bytearray(n)
    for i in range(n):
        if char[i]:
            if wm[i]:
                fill[i] = 1
            else:
                known[i] = 1

    queued = bytearray(n)
    order = deque()
    for i in range(n):
        if not fill[i]:
            continue
        x, y = i % w, i // w
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and known[ny * w + nx]:
                order.append(i)
                queued[i] = 1
                break

    while order:
        i = order.popleft()
        x, y = i % w, i // w
        rs = gs = bs = cnt = 0
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if known[k]:
                    d = data[k]
                    rs += d[0]
                    gs += d[1]
                    bs += d[2]
                    cnt += 1
        if cnt:
            data[i] = (rs // cnt, gs // cnt, bs // cnt, 255)
        known[i] = 1
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                k = ny * w + nx
                if fill[k] and not known[k] and not queued[k]:
                    queued[k] = 1
                    order.append(k)

    cleaned = Image.new("RGBA", (w, h))
    cleaned.putdata(data)
    return cleaned


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
                for dx, dy in DIRS:
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and mask[ny * w + nx] and not seen[ny * w + nx]:
                        seen[ny * w + nx] = 1
                        q.append(ny * w + nx)
            if n >= MIN_COMPONENT:
                comps.append((minx, miny, maxx, maxy))
    return comps


def process(src, out, clean_out=None):
    img = clean_watermark(Image.open(src).convert("RGBA"))
    w, h = img.size
    if clean_out:
        img.save(clean_out)

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
    sheet = imgclean.clean(sheet)
    sheet.save(out)
    print(
        f"guardado {out} sheet={sheet.size} frame={fw}x{fh} "
        f"grid={COLS}x{ROWS} frames={len(cells)} originY={baseline / fh:.4f}"
    )


def main():
    base = BASE / "assets" / "agustin"
    process(base / "saltando.png", base / "jump_sheet.png")
    process(base / "puño.png", base / "punch_sheet.png")
    process(base / "vacilar.png", base / "taunt_sheet.png")


if __name__ == "__main__":
    main()
