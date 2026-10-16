from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "jorge" / "Gemini_Generated_Image_mksz8gmksz8gmksz.jpeg"
OUT_IDLE = BASE / "assets" / "jorge_idle_sheet.png"
OUT_JUMP = BASE / "assets" / "jorge_jump_sheet.png"

BG = (72, 90, 114)
BG_TOL = 45
BLUR_RADIUS = 0.6

COLS = 5
FRAME_W = 162
FRAME_H = 190

COLS_X = [(2, 163), (168, 330), (335, 496), (501, 663), (668, 829)]
ROWS_IDLE = [(64, 250), (255, 443), (448, 634)]
ROWS_JUMP = [(694, 884), (890, 1080), (1086, 1275)]

IDLE_BASELINE = 184
IDLE_CX = 81
IDLE_TARGET_H = 176
ALPHA_THRESHOLD = 128
CELL_INSET = 5


def is_background(p):
    return abs(p[0] - BG[0]) + abs(p[1] - BG[1]) + abs(p[2] - BG[2]) <= BG_TOL


def build_cutout(img):
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
    for (x0, x1) in COLS_X:
        for (y0, y1) in ROWS_IDLE + ROWS_JUMP:
            push(x0 + 8, y0 + 8)
            push(x1 - 8, y0 + 8)
            push(x0 + 8, y1 - 8)

    while queue:
        x, y = queue.popleft()
        push(x - 1, y)
        push(x + 1, y)
        push(x, y - 1)
        push(x, y + 1)

    alpha = Image.new("L", (w, h), 255)
    alpha.putdata([0 if mask[i] else 255 for i in range(w * h)])
    if BLUR_RADIUS > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(BLUR_RADIUS))

    out = img.convert("RGBA")
    out.putalpha(alpha)
    return out


def cell_bbox(piece):
    mask = piece.getchannel("A").point(lambda v: 255 if v > ALPHA_THRESHOLD else 0)
    return mask.getbbox()


def make_sheet(src, rows, out_path, normalize):
    sheet = Image.new("RGBA", (FRAME_W * COLS, FRAME_H * len(rows)), (0, 0, 0, 0))
    for r, (y0, y1) in enumerate(rows):
        for c, (x0, x1) in enumerate(COLS_X):
            piece = src.crop((x0 + 1, y0 + 1, x1, y1))
            frame = Image.new("RGBA", (FRAME_W, FRAME_H), (0, 0, 0, 0))

            if normalize:
                bb = cell_bbox(piece)
                if bb:
                    crop = piece.crop(bb)
                    scale = IDLE_TARGET_H / crop.height
                    nw = round(crop.width * scale)
                    nh = round(crop.height * scale)
                    crop = crop.resize((nw, nh), Image.LANCZOS)
                    frame.paste(
                        crop,
                        (round(IDLE_CX - nw / 2), IDLE_BASELINE - nh),
                        crop,
                    )
            else:
                frame.paste(piece, (0, 0), piece)

            sheet.paste(frame, (c * FRAME_W, r * FRAME_H))

    out_path.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(out_path)
    print(f"guardado {out_path} sheet={sheet.size} frame={FRAME_W}x{FRAME_H} grid={COLS}x{len(rows)}")


def main():
    img = Image.open(SRC).convert("RGB")
    src = build_cutout(img)
    make_sheet(src, ROWS_IDLE, OUT_IDLE, normalize=True)
    make_sheet(src, ROWS_JUMP, OUT_JUMP, normalize=False)


if __name__ == "__main__":
    main()
