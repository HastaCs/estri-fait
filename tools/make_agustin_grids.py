import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_actions as aga
import imgclean

BASE = Path(__file__).resolve().parent.parent
A = BASE / "assets" / "agustin"

COLS = 6
ROWS = 6
PAD = 20

JOBS = [
    ("saltando.png", "jump_sheet.png", "preserve"),
    ("puño.png", "punch_sheet.png", "bottom"),
    ("vacilar.png", "taunt_sheet.png", "bottom"),
    ("standing.png", "standing_sheet.png", "bottom"),
    ("caminar.png", "walk_sheet.png", "bottom"),
    ("patada-voladora", "kick_sheet.png", "bottom"),
    ("especial.png", "special_sheet.png", "bottom"),
]


def extract(src, out, align):
    img = aga.clean_watermark(Image.open(src).convert("RGBA"))
    w, h = img.size
    pitch_x = w // COLS
    pitch_y = h // ROWS

    cells = {}
    for (minx, miny, maxx, maxy) in aga.components(img):
        cx = (minx + maxx) // 2
        cy = (miny + maxy) // 2
        c = min(COLS - 1, max(0, cx // pitch_x))
        r = min(ROWS - 1, max(0, cy // pitch_y))
        b = cells.get((r, c))
        if b is None:
            cells[(r, c)] = [minx, miny, maxx, maxy]
        else:
            b[0] = min(b[0], minx)
            b[1] = min(b[1], miny)
            b[2] = max(b[2], maxx)
            b[3] = max(b[3], maxy)

    max_w = max(b[2] - b[0] + 1 for b in cells.values())
    max_h = max(b[3] - b[1] + 1 for b in cells.values())

    if align == "preserve":
        fh = pitch_y + 2 * PAD
        ground_rel = max(b[3] - r * pitch_y for (r, c), b in cells.items())
        baseline = PAD + ground_rel
    else:
        fh = max_h + 2 * PAD
        baseline = fh - PAD
    fw = max_w + 2 * PAD

    sheet = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    for (r, c), b in cells.items():
        piece = img.crop((b[0], b[1], b[2] + 1, b[3] + 1))
        x = c * fw + (fw - piece.width) // 2
        y = r * fh + (PAD + (b[1] - r * pitch_y) if align == "preserve" else baseline - piece.height)
        sheet.paste(piece, (x, y), piece)

    sheet = imgclean.clean(sheet)
    sheet.save(out)
    print(
        f"{out.name}: frame={fw}x{fh} frames={len(cells)} originY={baseline / fh:.4f}"
    )


def main():
    for src, out, align in JOBS:
        extract(A / src, A / out, align)


if __name__ == "__main__":
    main()
