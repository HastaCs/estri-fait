"""Genera el spritesheet del puñetazo de izquierda de Agustín transformado a
partir de assets/agustin/transformacion/puñoizquierdo.png (rejilla 5x5 de
256x256). El original mira a la derecha, así que se espeja cada celda para que
mire a la izquierda (como el idle transformado).

Salida: assets/agustin/transformacion/lobopunchleft_sheet.png
"""
from pathlib import Path

from PIL import Image

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "puñoizquierdo.png"
OUT = BASE / "assets" / "agustin" / "transformacion" / "lobopunchleft_sheet.png"

COLS = 5
ROWS = 5
FW = 256
FH = 256


def main():
    img = Image.open(SRC).convert("RGBA")
    sheet = Image.new("RGBA", (COLS * FW, ROWS * FH), (0, 0, 0, 0))
    for r in range(ROWS):
        for c in range(COLS):
            cell = img.crop((c * FW, r * FH, c * FW + FW, r * FH + FH))
            cell = cell.transpose(Image.FLIP_LEFT_RIGHT)
            sheet.paste(cell, (c * FW, r * FH), cell)
    sheet.save(OUT)
    print(f"guardado {OUT} frame={FW}x{FH} frames={COLS * ROWS}")


if __name__ == "__main__":
    main()
