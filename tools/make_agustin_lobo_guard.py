"""Genera el spritesheet de cubrirse de Agustín transformado (lobo) desde
assets/agustin/transformacion/agustransformadocover.mp4 -> loboguard_sheet.png.

Igual que puñetazo/correr: el vídeo mira a la derecha (se espeja para que mire
a la izquierda, como el idle transformado) y el fondo es un damero claro que
se recorta por flood-fill. Se alinea por los pies.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_video as av

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "agustransformadocover.mp4"
OUT = BASE / "assets" / "agustin" / "transformacion" / "loboguard_sheet.png"


def main():
    av.COLS = 6
    av.ROWS = 6
    av.build(SRC, OUT.name, base=OUT.parent, align_feet=True)


if __name__ == "__main__":
    main()
