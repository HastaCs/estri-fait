"""Genera el spritesheet de correr (hacia delante) de Agustín transformado
(lobo) a partir de assets/agustin/transformacion/correr.mp4 -> loborun_sheet.png.

Mismo tratamiento que el puñetazo transformado: el fondo es un gris sólido
(~166), por debajo del umbral por defecto de make_agustin_video, así que se
baja BG_MIN_BRIGHT. Rejilla 7x8 (56 frames).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_video as av

BASE = Path(__file__).resolve().parent.parent
SRC = BASE / "assets" / "agustin" / "transformacion" / "correr.mp4"
OUT = BASE / "assets" / "agustin" / "transformacion" / "loborun_sheet.png"


def main():
    av.BG_MIN_BRIGHT = 150
    av.COLS = 7
    av.ROWS = 8
    av.build(SRC, OUT.name, base=OUT.parent, flip=True)


if __name__ == "__main__":
    main()
