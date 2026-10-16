# AGENTS.md

Juego de pelea 2D **"STRI FAIT — Version Wiber Turbo 2"**, con **Phaser 3.80.1 por CDN y JS sin build**. Dos escenas. Contenido, nombres y comentarios en español.

## Ejecutar / verificar
- No hay npm, build, lint ni tests. **No crear `package.json`** ni instalar dependencias.
- Servir estático desde la raíz: `python3 -m http.server 8000` → `http://localhost:8000`.
  Abrir `index.html` con `file://` falla: el navegador bloquea la carga de imágenes (CORS).
- Única verificación automática: `node --check js/characters.js js/main.js js/scenes/GameScene.js js/scenes/SelectScene.js`.

## Estructura / arranque
- `index.html` carga **en orden**: Phaser (CDN) → `js/characters.js` → `js/scenes/GameScene.js` → `js/scenes/SelectScene.js` → `js/main.js`. El orden importa. No hay módulos: las clases y `CHARACTERS` son globales.
- Escenas en `js/main.js` (`scene: [SelectScene, GameScene]`): **`SelectScene`** (elegir 2 de 6 luchadores; muestra **cuerpo entero animado** del personaje resaltado) → **`GameScene`** (combate, recibe `{p1, p2}` = índices de `CHARACTERS`; reproduce intro **ROUND 1 / FIGHT!**).
- Canvas fijo 1280x720 con `Phaser.Scale.FIT`.

## Personajes (`js/characters.js`)
`CHARACTERS` es la fuente de verdad (jorge, dani, bea, merche, xavi, agustin, rafa). Por personaje: `face`, `sheet` (texture key), `sheetPath`, `frameW/frameH`, `originY` (base de los pies), `sourceH` (alto del personaje en píxeles, para escalar), `facesRight`, `color`. `GameScene` carga todos los sheets y escala cada uno a `FIGHTER_TARGET_H` (`scale = FIGHTER_TARGET_H / sourceH`).
- Regla de orientación (en `GameScene.addFighter`): el de la **izquierda mira a la derecha** y el de la **derecha a la izquierda**; `flipX = facesRight !== mustFaceRight`.
- Al añadir un personaje: crea su sheet + cara, añade una entrada a `CHARACTERS`; no hardcodees tamaños en las escenas.

## Assets y spritesheets (lo más fácil de romper)
Los **tamaños de frame viven en `CHARACTERS`** y deben coincidir con el PNG real:
- `assets/fondo_sheet.png` — 752x360, 8 frames (generado desde `assets/fondo.gif`); fondo animado, se dibuja cubriendo el canvas (`scale=2`).
- `assets/jorge/breathe_sheet_HD.png` — 768x1280, 8 frames; idle con **alpha real**, se usa tal cual.
- `assets/dani/dani_idle_sheet.png` — 643x908, 8 frames (4x2); generado por `tools/make_dani.py`.
- `assets/bea/bea_idle_sheet.png` (330x529) y `assets/merche/merche_idle_sheet.png` (357x525) — 8 frames (4x2); generados por `tools/make_bea_merche.py`.
- `assets/xavi/xavi_idle_sheet.png` (531x669) y `assets/agustin/agustin_idle_sheet.png` (393x598) — 8 frames (4x2); generados por `tools/make_xavi_agustin.py`.
- `assets/rafa/rafa_idle_sheet.png` (371x450) — 8 frames (4x2); generado por `tools/make_rafa.py` (recorta el personaje de **arriba a la izquierda** de una imagen con 4).
- Cada personaje tiene también `<key>_face.png` para la selección.
- `assets/audio/audio1.mp3` — música de fondo; se **carga y reproduce una sola vez** en `SelectScene` (volumen 0.3) y continúa sonando en `GameScene` (no volver a cargarla/reproducirla ahí).

`groundY`, `p1X` y `p2X` son constantes manuales en `GameScene.create`. Los `origin` son fracciones atadas a la base de los pies de cada sheet; al cambiar un sheet hay que recalcular `originY`/`sourceH`.

El arte de origen llega a menudo como **JPEG con "transparencia falsa"** (fondo de cuadros o color sólido incrustado). Se elimina con flood-fill desde los bordes sobre píxeles claros y de bajo croma (ver `tools/`). Los PNG con alpha real no se procesan. Las sombras grises bajo los pies se quitan por color (gris medio sin croma). Los parches blancos encerrados (huecos entre brazos/piernas, dientes de horquilla) se quitan por componentes conexos blancos (ver `make_xavi_agustin.py`).

Mantener cada spritesheet por debajo de 8192px de ancho (límite de textura GPU): usar rejillas (4x2, 5x3), no tiras largas.

## tools/ (generadores Pillow, ejecución manual)
- `make_dani.py` — `assets/dani/dani.jpeg` → `dani_idle.png`, `dani_idle_sheet.png` (respiración por rotación suave).
- `make_bea_merche.py` — `assets/bea_merche.jpeg` → recorta Bea y Merche, quita sombras y genera sus `*_idle.png`/`*_idle_sheet.png` (respiración por estiramiento vertical anclado a los pies) y `*_face.png`.
- `make_xavi_agustin.py` — `assets/xavi_agustin.jpeg` → recorta Xavi y Agustín y genera sus `*_idle.png`/`*_idle_sheet.png`/`*_face.png` (igual que Bea/Merche; a Xavi le quita además las zonas blancas encerradas).
- `make_rafa.py` — `assets/rafa/rafa.jpeg` → recorta el personaje de arriba a la izquierda (imagen con 4) y genera sus `*_idle.png`/`*_idle_sheet.png`/`*_face.png`.
- `make_faces.py` — recorta las caras de Jorge y Dani para la selección.
- `make_sprites.py` y `cutout.py` — **obsoletos**: sus rutas `SRC` hardcodeadas ya no existen. No ejecutar a ciegas.
- `fondo_sheet.png` se generó ad-hoc (frames del GIF → tira horizontal); no hay script que lo reproduzca.

El usuario intercambia y borra ficheros de `assets/` a mano. Si un asset que antes funcionaba da 404, puede estar en la papelera: `/media/jorge/datos/.Trash-1000/files` o `~/.local/share/Trash/files`.
