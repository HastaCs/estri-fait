import subprocess
import sys
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

sys.path.insert(0, str(Path(__file__).resolve().parent))
import imgclean

BASE = Path(__file__).resolve().parent.parent
A = BASE / "assets" / "agustin"

COLS = 6
ROWS = 6
PAD = 20
BG_MAX_CHROMA = 25
BG_MIN_BRIGHT = 170
BLUR = 0.5
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))

JOBS = [
    ("standing.mp4", "standing_sheet.png"),
    ("caminar.mp4", "walk_sheet.png"),
    ("puño.mp4", "punch_sheet.png"),
    ("saltando.mp4", "jump_sheet.png"),
    ("backflip.mp4", "backflip_sheet.png"),
    ("especial.mp4", "special_sheet.png"),
    ("arrodillarse.mp4", "kneel_sheet.png"),
    ("patada.mp4", "kick_sheet.png"),
]


def extract_frames(video, tmp):
    subprocess.run(
        ["ffmpeg", "-v", "error", "-y", "-i", str(video), "-vsync", "0",
         str(tmp / "f%03d.png")],
        check=True,
    )
    return sorted(tmp.glob("f*.png"))


def is_bg(p):
    r, g, b = p[:3]
    return (max(p[:3]) - min(p[:3])) <= BG_MAX_CHROMA and (r + g + b) / 3 >= BG_MIN_BRIGHT


def remove_enclosed_bg(img, min_size=300):
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    for s in range(w * h):
        if seen[s]:
            continue
        x0, y0 = s % w, s // w
        if px[x0, y0][3] <= 128 or not is_bg(px[x0, y0]):
            seen[s] = 1
            continue
        q = deque([s])
        seen[s] = 1
        comp = []
        touches = False
        while q:
            j = q.popleft()
            comp.append(j)
            x, y = j % w, j // w
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    k = ny * w + nx
                    if px[nx, ny][3] <= 128:
                        touches = True
                    elif not seen[k] and is_bg(px[nx, ny]):
                        seen[k] = 1
                        q.append(k)
        if not touches and len(comp) >= min_size:
            gray = 0
            for j in comp:
                r, g, b, _ = px[j % w, j // w]
                br = (r + g + b) / 3
                if 150 <= br <= 233 and (max(r, g, b) - min(r, g, b)) <= 20:
                    gray += 1
            if gray >= 0.25 * len(comp):
                for j in comp:
                    px[j % w, j // w] = (0, 0, 0, 0)
    return img


def is_near_white(p):
    r, g, b = p[:3]
    return (max(r, g, b) - min(r, g, b)) <= 30 and (r + g + b) / 3 >= 150


def remove_near_white(img):
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            p = px[x, y]
            if p[3] > 128 and is_near_white(p):
                px[x, y] = (0, 0, 0, 0)
    return img


def is_shadow(p):
    r, g, b = p[:3]
    br = (r + g + b) / 3
    return 95 <= br <= 175 and b >= g >= r and 12 <= (b - r) <= 55


def remove_shadow(img, min_size=150):
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    for s in range(w * h):
        if seen[s]:
            continue
        x0, y0 = s % w, s // w
        if px[x0, y0][3] <= 128 or not is_shadow(px[x0, y0]):
            seen[s] = 1
            continue
        q = deque([s])
        seen[s] = 1
        comp = []
        while q:
            j = q.popleft()
            comp.append(j)
            x, y = j % w, j // w
            for dx, dy in DIRS:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    k = ny * w + nx
                    if not seen[k] and px[nx, ny][3] > 128 and is_shadow(px[nx, ny]):
                        seen[k] = 1
                        q.append(k)
        if len(comp) >= min_size:
            for j in comp:
                px[j % w, j // w] = (0, 0, 0, 0)
    return img


def remove_small_components(img, min_frac=0.25):
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    comps = []
    for s in range(w * h):
        if seen[s]:
            continue
        x0, y0 = s % w, s // w
        if px[x0, y0][3] <= 128:
            seen[s] = 1
            continue
        q = deque([s])
        seen[s] = 1
        comp = []
        while q:
            j = q.popleft()
            comp.append(j)
            x, y = j % w, j // w
            for dx, dy in DIRS:
                nx, ny = x + dx, y + dy
                if 0 <= nx < w and 0 <= ny < h:
                    k = ny * w + nx
                    if not seen[k] and px[nx, ny][3] > 128:
                        seen[k] = 1
                        q.append(k)
        comps.append(comp)
    if not comps:
        return img
    biggest = max(len(c) for c in comps)
    for c in comps:
        if len(c) < min_frac * biggest:
            for j in c:
                px[j % w, j // w] = (0, 0, 0, 0)
    return img


def cutout(img):
    w, h = img.size
    px = img.load()
    mask = bytearray(w * h)
    queue = deque()

    def push(x, y):
        i = y * w + x
        if 0 <= x < w and 0 <= y < h and not mask[i] and is_bg(px[x, y]):
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

    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if mask[i] else 255 for i in range(w * h)])
    if BLUR:
        alpha = alpha.filter(ImageFilter.GaussianBlur(BLUR))
    out = img.convert("RGBA")
    out.putalpha(alpha)
    out = remove_enclosed_bg(out)
    out = remove_small_components(out)
    return out


def build(video, out, base=None, remove_white=False):
    base = base or A
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        files = extract_frames(video, tmp)
        full = [cutout(Image.open(f).convert("RGB")) for f in files]

    minx, miny, maxx, maxy = full[0].size[0], full[0].size[1], 0, 0
    for im in full:
        bb = im.getchannel("A").getbbox()
        minx = min(minx, bb[0])
        miny = min(miny, bb[1])
        maxx = max(maxx, bb[2])
        maxy = max(maxy, bb[3])
    frames = [im.crop((minx, miny, maxx, maxy)) for im in full]

    max_w = max(f.width for f in frames)
    max_h = max(f.height for f in frames)
    fw = max_w + 2 * PAD
    fh = max_h + 2 * PAD
    baseline = fh - PAD

    sheet = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    for i, fr in enumerate(frames):
        c = i % COLS
        r = i // COLS
        x = c * fw + (fw - fr.width) // 2
        y = r * fh + baseline - fr.height
        sheet.paste(fr, (x, y), fr)

    sheet = clean_video(sheet, remove_white=remove_white)
    (base / out).parent.mkdir(parents=True, exist_ok=True)
    sheet.save(base / out)
    print(f"{out}: frame={fw}x{fh} frames={len(frames)} originY={baseline / fh:.4f}")


def clean_video(sheet, remove_white=False):
    if remove_white:
        sheet = remove_near_white(sheet)
    return imgclean.smooth_alpha(
        imgclean.bleed_colors(
            imgclean.defringe(imgclean.erode_alpha(sheet, 2), rounds=8)
        ),
        radius=0.35,
    )


def main():
    for video, out in JOBS:
        build(A / video, out)


if __name__ == "__main__":
    main()
