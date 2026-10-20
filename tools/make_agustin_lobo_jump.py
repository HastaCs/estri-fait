import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import imgclean

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "jump.mp4"
OUT = BASE / "assets" / "agustin" / "transformacion" / "lobojump_sheet.png"

START = 15
END = 44
COLS = 6
ROWS = 5
PAD = 20
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def extract(video, tmp):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vsync", "0",
         str(tmp / "f%03d.png")],
        check=True,
    )
    return sorted(tmp.glob("f*.png"))


def est_bg(px, w, h):
    pts = []
    for x in range(0, w, 3):
        pts.append(px[x, 0])
        pts.append(px[x, h - 1])
    for y in range(0, h, 3):
        pts.append(px[0, y])
        pts.append(px[w - 1, y])
    r = sorted(p[0] for p in pts)[len(pts) // 2]
    g = sorted(p[1] for p in pts)[len(pts) // 2]
    b = sorted(p[2] for p in pts)[len(pts) // 2]
    return r, g, b


def cut(img):
    w, h = img.size
    px = img.load()
    br, bg, bb = est_bg(px, w, h)
    tol = 22 if br > 90 else 9

    def is_bg(p):
        return (
            abs(p[0] - br) <= tol
            and abs(p[1] - bg) <= tol
            and abs(p[2] - bb) <= tol
            and max(p[:3]) - min(p[:3]) <= 22
        )

    mask = bytearray(w * h)
    q = deque()

    def push(x, y):
        i = y * w + x
        if 0 <= x < w and 0 <= y < h and not mask[i] and is_bg(px[x, y]):
            mask[i] = 1
            q.append((x, y))

    for x in range(w):
        push(x, 0)
        push(x, h - 1)
    for y in range(h):
        push(0, y)
        push(w - 1, y)
    while q:
        x, y = q.popleft()
        for dx, dy in DIRS:
            push(x + dx, y + dy)

    out = img.convert("RGBA")
    p = out.load()
    ut = 12 if br > 90 else 6
    low, high = br - 62, br - 4
    for y in range(h):
        for x in range(w):
            if mask[y * w + x]:
                p[x, y] = (0, 0, 0, 0)
                continue
            c = p[x, y]
            chroma = max(c[:3]) - min(c[:3])
            bright = (c[0] + c[1] + c[2]) / 3
            if (
                chroma <= ut
                and abs(c[0] - br) <= ut
                and abs(c[1] - bg) <= ut
                and abs(c[2] - bb) <= ut
            ):
                p[x, y] = (0, 0, 0, 0)
            elif chroma <= 5 and low <= bright <= high:
                p[x, y] = (0, 0, 0, 0)
    return out


def main():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        files = extract(SRC, tmp)
        full = [
            cut(Image.open(f).convert("RGB"))
            for f in files[START - 1:END]
        ]

    minx, miny = full[0].width, full[0].height
    maxx, maxy = 0, 0
    for im in full:
        bb = im.getchannel("A").getbbox()
        minx = min(minx, bb[0])
        miny = min(miny, bb[1])
        maxx = max(maxx, bb[2])
        maxy = max(maxy, bb[3])
    frames = [im.crop((minx, miny, maxx, maxy)) for im in full]

    leg_ref = None
    refs = []
    for fr in frames:
        bb = fr.getchannel("A").getbbox()
        if not bb:
            continue
        y1 = bb[3]
        h = bb[3] - bb[1]
        band = fr.crop((0, max(0, y1 - max(1, int(0.10 * h))), fr.width, y1))
        b = band.getchannel("A").getbbox()
        if b:
            refs.append((b[0] + b[2]) / 2)
    if refs:
        leg_ref = sorted(refs)[len(refs) // 2]

    max_w = max(f.width for f in frames)
    max_h = max(f.height for f in frames)
    if leg_ref is not None:
        half = max(leg_ref, max_w - leg_ref)
        fw = int(2 * (half + PAD))
    else:
        fw = max_w + 2 * PAD
    fh = max_h + 2 * PAD
    baseline = fh - PAD

    sheet = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        c = i % COLS
        r = i // COLS
        cell = Image.new("RGBA", (fw, fh), (0, 0, 0, 0))
        cell.paste(fr, (int(fw / 2 - leg_ref), baseline - fr.height), fr)
        sheet.paste(cell, (c * fw, r * fh), cell)

    sheet = imgclean.dilate_alpha(imgclean.erode_alpha(sheet, 1), 2)
    sheet = imgclean.smooth_alpha(sheet, radius=0.35)
    sheet.save(OUT)
    print(
        f"{OUT.name}: frame={fw}x{fh} frames={len(frames)} "
        f"originY={baseline / fh:.4f} sourceH={max_h}"
    )


if __name__ == "__main__":
    main()
