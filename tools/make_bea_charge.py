"""Genera assets/bea/charge_sheet.png (6x6) desde bea-chargeki.mp4.

El video tiene: borde blanco exterior, damero GRIS de fondo y los "vientos"
de la carga en BLANCO. El recorte generico (clave = claro y bajo croma)
borraba tambien los vientos. Aqui:
  1) quitamos el borde blanco con flood-fill desde los bordes (solo blanco),
  2) quitamos el damero gris con flood-fill (solo gris),
conservando el blanco de los vientos (no conectado al borde).
"""
import subprocess
import sys
import statistics
import tempfile
from collections import deque
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import imgclean
BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "bea" / "bea-chargeki.mp4"
OUT = BASE / "assets" / "bea" / "charge_sheet.png"

COLS = 6
ROWS = 6
PAD = 20
DIRS = ((1, 0), (-1, 0), (0, 1), (0, -1))


def is_white(p):
    r, g, b = p[:3]
    return (max(p[:3]) - min(p[:3])) <= 8 and (r + g + b) / 3 >= 243


def is_gray(p):
    r, g, b = p[:3]
    return (max(p[:3]) - min(p[:3])) <= 12 and 150 <= (r + g + b) / 3 <= 242


def flood(removed, px, w, h, seeds, pred):
    q = deque()
    for x, y in seeds:
        i = y * w + x
        if not removed[i] and pred(px[x, y]):
            removed[i] = 1
            q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in DIRS:
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h:
                i = ny * w + nx
                if not removed[i] and pred(px[nx, ny]):
                    removed[i] = 1
                    q.append((nx, ny))


def remove_enclosed_gray(img, min_size=120):
    """Borra los huecos grises encerrados (p. ej. entre las piernas)."""
    w, h = img.size
    px = img.load()
    seen = bytearray(w * h)
    for s in range(w * h):
        if seen[s]:
            continue
        x0, y0 = s % w, s // w
        if px[x0, y0][3] <= 128 or not is_gray(px[x0, y0]):
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
                    if (
                        not seen[k]
                        and px[nx, ny][3] > 128
                        and is_gray(px[nx, ny])
                    ):
                        seen[k] = 1
                        q.append(k)
        if len(comp) >= min_size:
            for j in comp:
                x, y = j % w, j // w
                r, g, b, _ = px[x, y]
                px[x, y] = (r, g, b, 0)
    return img


def tint_winds(img, color=(70, 180, 255)):
    """Tine de azul los vientos (pixeles blancos claros)."""
    w, h = img.size
    px = img.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a < 8:
                continue
            if max(r, g, b) - min(r, g, b) <= 30 and (r + g + b) / 3 >= 210:
                px[x, y] = (
                    r * color[0] // 255,
                    g * color[1] // 255,
                    b * color[2] // 255,
                    a,
                )
    return img


def cutout(img):
    w, h = img.size
    px = img.load()
    removed = bytearray(w * h)
    edges = [(x, y) for x in range(w) for y in (0, h - 1)]
    edges += [(x, y) for y in range(h) for x in (0, w - 1)]
    flood(removed, px, w, h, edges, is_white)

    seeds = []
    for y in range(h):
        for x in range(w):
            i = y * w + x
            if removed[i] or not is_gray(px[x, y]):
                continue
            if (
                x == 0
                or y == 0
                or x == w - 1
                or y == h - 1
                or removed[i - 1]
                or removed[i + 1]
                or removed[i - w]
                or removed[i + w]
            ):
                seeds.append((x, y))
    flood(removed, px, w, h, seeds, is_gray)

    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if removed[i] else 255 for i in range(w * h)])
    out = img.convert("RGBA")
    out.putalpha(alpha)
    out = remove_enclosed_gray(out)
    out = imgclean.erode_alpha(out, 1)
    out = imgclean.bleed_colors(out)
    out = imgclean.smooth_alpha(out, radius=0.6)
    return tint_winds(out)


def main():
    with tempfile.TemporaryDirectory() as d:
        tmp = Path(d)
        subprocess.run(
            ["ffmpeg", "-v", "error", "-y", "-i", str(SRC), "-vsync", "0",
             str(tmp / "f%03d.png")],
            check=True,
        )
        files = sorted(tmp.glob("f*.png"))
        frames = [cutout(Image.open(f).convert("RGB")) for f in files]

    info = []
    for im in frames:
        w, h = im.size
        px = im.load()
        bb = im.getchannel("A").getbbox()
        xs = []
        bottom = bb[1]
        for y in range(bb[1], bb[3]):
            for x in range(bb[0], bb[2]):
                R, G, B, A = px[x, y]
                if A < 128:
                    continue
                if (R + G + B) / 3 < 140:
                    xs.append(x)
                    if y > bottom:
                        bottom = y
        refX = int(statistics.median(xs)) if xs else (bb[0] + bb[2]) // 2
        info.append((bb, refX, bottom))

    max_left = max(refX - bb[0] for bb, refX, _ in info)
    max_right = max(bb[2] - refX for bb, refX, _ in info)
    max_top = max(refY - bb[1] for bb, _, refY in info)
    max_bottom = max(bb[3] - refY for bb, _, refY in info)
    fw = max_left + max_right + 2 * PAD
    fh = max_top + max_bottom + 2 * PAD
    target_x = PAD + max_left
    target_y = PAD + max_top

    sheet = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    for i, im in enumerate(frames):
        bb, refX, refY = info[i]
        c = i % COLS
        r = i // COLS
        x = c * fw + (target_x - refX)
        y = r * fh + (target_y - refY)
        sheet.paste(im, (x, y), im)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(OUT)
    print(f"guardado {OUT} frame={fw}x{fh} frames={len(frames)} originY={target_y / fh:.4f}")


if __name__ == "__main__":
    main()
