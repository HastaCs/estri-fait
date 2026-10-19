"""Genera el spritesheet de andar (hacia atrás) de Agustín transformado (lobo)
desde assets/agustin/transformacion/walking.mp4 -> lobowalk_sheet.png.

Se alinea por los pies. El fondo es un damero claro que se recorta por
flood-fill.
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_video as av

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "walking.mp4"
OUT = BASE / "assets" / "agustin" / "transformacion" / "lobowalk_sheet.png"


def main():
    av.COLS = 6
    av.ROWS = 6
    av.build(SRC, OUT.name, base=OUT.parent, align_feet=True)


if __name__ == "__main__":
    main()
