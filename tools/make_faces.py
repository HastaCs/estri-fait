from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent.parent

JORGE_SRC = BASE / "assets" / "jorge" / "breathe_sheet_HD.png"
JORGE_OUT = BASE / "assets" / "jorge" / "jorge_face.png"
JORGE_BOX = (250, 280, 520, 560)

DANI_SRC = BASE / "assets" / "dani" / "dani_idle.png"
DANI_OUT = BASE / "assets" / "dani" / "dani_face.png"
DANI_BOX = (140, 0, 430, 240)


def crop_face(src, box, out):
    img = Image.open(src).convert("RGBA")
    face = img.crop(box)
    out.parent.mkdir(parents=True, exist_ok=True)
    face.save(out)
    print(f"guardado {out} tamano={face.size}")


def main():
    crop_face(JORGE_SRC, JORGE_BOX, JORGE_OUT)
    crop_face(DANI_SRC, DANI_BOX, DANI_OUT)


if __name__ == "__main__":
    main()
