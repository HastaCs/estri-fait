"""Genera el spritesheet del puñetazo de Agustín transformado (lobo) a partir
de assets/agustin/transformacion/lobopuño.mp4 -> lobopunch_sheet.png.

El fondo del video es un gris sólido (~166), más oscuro que el umbral por
defecto de make_agustin_video (BG_MIN_BRIGHT=170), así que se baja para poder
recortarlo por flood-fill desde los bordes. La rejilla es 7x8 porque el vídeo
tiene 56 frames.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_video as av

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "lobopuño.mp4"
OUT = BASE / "assets" / "agustin" / "transformacion" / "lobopunch_sheet.png"


def main():
    av.BG_MIN_BRIGHT = 150
    av.COLS = 7
    av.ROWS = 8
    av.build(SRC, OUT.name, base=OUT.parent, flip=True, align_feet=True, erode=1, dilate=2)


if __name__ == "__main__":
    main()
