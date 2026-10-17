import sys
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_actions as aga
import imgclean

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "rafa" / "muerte.png"
OUT = BASE / "assets" / "rafa" / "death_sheet.png"

COLS = 6
ROWS = 6
PAD = 20


def main():
    img = aga.clean_watermark(Image.open(SRC).convert("RGBA"))
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
    fw = max_w + 2 * PAD
    fh = max_h + 2 * PAD
    baseline = fh - PAD

    sheet = Image.new("RGBA", (fw * COLS, fh * ROWS), (0, 0, 0, 0))
    for r in range(ROWS):
        for c in range(COLS):
            b = cells.get((r, c))
            if b is None:
                continue
            minx, miny, maxx, maxy = b
            piece = img.crop((minx, miny, maxx + 1, maxy + 1))
            x = c * fw + (fw - piece.width) // 2
            y = r * fh + baseline - piece.height
            sheet.paste(piece, (x, y), piece)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    sheet = imgclean.clean(sheet)
    sheet.save(OUT)
    print(
        f"guardado {OUT} sheet={sheet.size} frame={fw}x{fh} "
        f"grid={COLS}x{ROWS} frames={len(cells)} originY={baseline / fh:.4f}"
    )


if __name__ == "__main__":
    main()
