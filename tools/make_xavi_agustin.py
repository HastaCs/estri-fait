import math
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "xavi_agustin.jpeg"

BG_MAX_CHROMA = 16
BG_MIN_BRIGHT = 235
MIN_COMPONENT = 20000
BLUR_RADIUS = 0.6
DILATE = True

IDLE_FRAMES = 8
SHEET_COLS = 4
PAD = 40
BREATH_AMOUNT = 0.018

TOP_REGION = 900


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


def top_components(mask, w, h):
    seen = bytearray(w * h)
    comps = []
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
        if len(pixels) < MIN_COMPONENT:
            continue
        minx = min(p % w for p in pixels)
        if minx < TOP_REGION:
            comps.append((pixels, minx))
    comps.sort(key=lambda c: c[1])
    return [c[0] for c in comps]


def remove_shadow(rgba):
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            chroma = max(r, g, b) - min(r, g, b)
            bright = (r + g + b) / 3
            if chroma <= 22 and 95 <= bright <= 216:
                px[x, y] = (r, g, b, 0)


def remove_white_regions(rgba, min_area=60):
    w, h = rgba.size
    px = rgba.load()

    def is_white(x, y):
        r, g, b, a = px[x, y]
        return a > 128 and (max(r, g, b) - min(r, g, b)) <= 20 and (r + g + b) / 3 >= 225

    seen = bytearray(w * h)
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if seen[i] or not is_white(x, y):
                continue
            queue = deque([i])
            seen[i] = 1
            pixels = []
            while queue:
                j = queue.popleft()
                pixels.append(j)
                jx, jy = j % w, j // w
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    nx, ny = jx + dx, jy + dy
                    if 0 <= nx < w and 0 <= ny < h:
                        k = ny * w + nx
                        if not seen[k] and is_white(nx, ny):
                            seen[k] = 1
                            queue.append(k)
            if len(pixels) >= min_area:
                for j in pixels:
                    px[j % w, j // w] = (255, 255, 255, 0)


def cutout(img, pixels, w, h):
    char = bytearray(w * h)
    for j in pixels:
        char[j] = 1
    alpha = Image.new("L", (w, h), 0)
    alpha.putdata([255 if char[i] else 0 for i in range(w * h)])
    if DILATE:
        alpha = alpha.filter(ImageFilter.MaxFilter(3))
    if BLUR_RADIUS > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    remove_shadow(out)
    return out.crop(out.getchannel("A").getbbox())


def make_idle_sheet(static_img, out_sheet):
    w, h = static_img.size
    cw = w + 2 * PAD
    ch = h + 2 * PAD
    rows = math.ceil(IDLE_FRAMES / SHEET_COLS)
    baseline = PAD + h
    sheet = Image.new("RGBA", (cw * SHEET_COLS, ch * rows), (0, 0, 0, 0))
    for i in range(IDLE_FRAMES):
        phase = 2 * math.pi * i / IDLE_FRAMES
        factor = 1 + BREATH_AMOUNT * (0.5 - 0.5 * math.cos(phase))
        nh = round(h * factor)
        frame = static_img.resize((w, nh), Image.LANCZOS)
        col = i % SHEET_COLS
        row = i // SHEET_COLS
        sheet.paste(frame, (col * cw + PAD, row * ch + baseline - nh), frame)
    out_sheet.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_sheet)
    print(
        f"guardado {out_sheet} sheet={sheet.size} frame={cw}x{ch} "
        f"grid={SHEET_COLS}x{rows} originY={baseline / ch:.4f} charH={h}"
    )


def crop_face(static_img, out_face):
    w, h = static_img.size
    box = (round(w * 0.16), 0, round(w * 0.88), round(h * 0.40))
    face = static_img.crop(box)
    out_face.parent.mkdir(parents=True, exist_ok=True)
    face.save(out_face)
    print(f"guardado {out_face} tamano={face.size}")


def main():
    img = Image.open(SRC).convert("RGB")
    w, h = img.size
    mask = background_mask(img)
    comps = top_components(mask, w, h)
    if len(comps) < 2:
        raise SystemExit("no se encontraron dos personajes")

    names = ["xavi", "agustin"]
    for name, pixels in zip(names, comps[:2]):
        static = cutout(img, pixels, w, h)
        if name == "xavi":
            remove_white_regions(static)
        base = BASE / "assets" / name
        base.mkdir(parents=True, exist_ok=True)
        static.save(base / f"{name}_idle.png")
        print(f"guardado {base / (name + '_idle.png')} tamano={static.size}")
        make_idle_sheet(static, base / f"{name}_idle_sheet.png")
        crop_face(static, base / f"{name}_face.png")


if __name__ == "__main__":
    main()
