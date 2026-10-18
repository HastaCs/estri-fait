"""Genera un spritesheet 6x6 desde un video: extrae frames, quita el fondo
(cuadriculado o color solido) y limpia el alpha.

Uso:
    python3 tools/make_video_sheet.py <video.mp4> <salida.png> [--white]

--white: elimina tambien los trozos blancos encerrados (gaps de fondo).
"""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import make_agustin_video as av


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if len(args) < 2:
        print("uso: make_video_sheet.py <video.mp4> <salida.png> [--white]")
        raise SystemExit(1)
    remove_white = "--white" in sys.argv
    video = Path(args[0]).resolve()
    out = Path(args[1]).resolve()
    av.build(video, out.name, base=out.parent, remove_white=remove_white)


if __name__ == "__main__":
    main()
