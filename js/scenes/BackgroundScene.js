class BackgroundScene extends Phaser.Scene {
  constructor() {
    super('BackgroundScene');
  }

  init(data) {
    this.p1 = data && data.p1 != null ? data.p1 : 0;
    this.p2 = data && data.p2 != null ? data.p2 : 1;
  }

  preload() {
    BACKGROUNDS.forEach((b) => {
      if (this.textures.exists(b.key)) {
        return;
      }
      if (b.sheet) {
        this.load.spritesheet(b.key, b.path, {
          frameWidth: b.frameW,
          frameHeight: b.frameH
        });
      } else {
        this.load.image(b.key, b.path);
      }
    });
  }

  create() {
    this.cursor = 0;

    this.drawBackground();
    this.addSunAndBeams();
    this.drawTitle();

    BACKGROUNDS.forEach((b) => {
      if (b.sheet && !this.anims.exists(`${b.key}Bg`)) {
        this.anims.create({
          key: `${b.key}Bg`,
          frames: this.anims.generateFrameNumbers(b.key, {
            start: 0,
            end: b.frames - 1
          }),
          frameRate: b.frameRate,
          repeat: -1
        });
      }
    });

    const n = BACKGROUNDS.length;
    const panelW = 380;
    const panelH = 250;
    const gap = 60;
    const totalW = n * panelW + (n - 1) * gap;
    const startX = this.scale.width / 2 - totalW / 2 + panelW / 2;
    const cy = 380;

    this.panels = BACKGROUNDS.map((b, i) => {
      const cx = startX + i * (panelW + gap);
      return this.createPanel(cx, cy, b, i, panelW, panelH);
    });

    this.prompt = this.add
      .text(this.scale.width / 2, 172, 'ELIGE EL ESCENARIO', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(2)
      .setDepth(6);

    this.add
      .text(
        this.scale.width / 2,
        695,
        'A / D  MOVER        ENTER  ELEGIR',
        {
          fontFamily: 'monospace',
          fontSize: '22px',
          color: '#ffe600'
        }
      )
      .setOrigin(0.5)
      .setLetterSpacing(1)
      .setDepth(6);

    this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,ENTER,SPACE');

    this.refresh();
  }

  drawBackground() {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x06030f).setOrigin(0);

    const g = this.add.graphics().setDepth(0);
    const horizon = 540;

    g.fillStyle(0x120a26, 1);
    g.fillRect(0, horizon, this.scale.width, this.scale.height - horizon);

    g.lineStyle(2, 0xff2d95, 0.7);
    for (let i = 0; i <= 20; i++) {
      const t = i / 20;
      g.beginPath();
      g.moveTo(640 + (t - 0.5) * 110, horizon);
      g.lineTo(640 + (t - 0.5) * 2000, this.scale.height);
      g.strokePath();
    }

    g.lineStyle(2, 0x00e5ff, 0.6);
    let y = horizon + 6;
    let step = 8;
    while (y < this.scale.height) {
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(this.scale.width, y);
      g.strokePath();
      y += step;
      step *= 1.35;
    }

    const glow = this.add
      .rectangle(0, horizon, this.scale.width, 2, 0xff2d95)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(1);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.5, to: 1 },
      duration: 700,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const scan = this.add.graphics().setDepth(20);
    scan.fillStyle(0x000000, 0.22);
    for (let i = 0; i < this.scale.height; i += 4) {
      scan.fillRect(0, i, this.scale.width, 1);
    }
  }

  addSunAndBeams() {
    const g = this.add.graphics().setDepth(1);
    const cx = 640;
    const cy = 84;
    const r = 180;

    g.fillStyle(0xff2d95, 0.18);
    g.fillCircle(cx, cy, r);

    for (let y = Math.round(cy - r); y <= cy + r; y++) {
      const dy = y - cy;
      const half = Math.sqrt(r * r - dy * dy);
      if (!half) continue;
      const band = Math.floor((y - (cy - r)) / 16) % 2;
      g.fillStyle(band ? 0xff2d95 : 0x7a2bff, 0.3);
      g.fillRect(cx - half, y, half * 2, 1);
    }

    for (let i = 0; i < 2; i++) {
      const beam = this.add
        .rectangle(cx, cy + 180, 1200, 5, i === 0 ? 0xff2d95 : 0x00e5ff, 0.12)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(1);
      beam.setOrigin(0.5);
      this.tweens.add({
        targets: beam,
        angle: i === 0 ? 360 : -360,
        duration: 16000,
        repeat: -1
      });
    }
  }

  drawTitle() {
    const cx = this.scale.width / 2;

    this.add
      .text(cx + 3, 59, 'STRI FAIT', {
        fontFamily: 'monospace',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ff2d95'
      })
      .setOrigin(0.5)
      .setLetterSpacing(6)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);

    this.add
      .text(cx - 3, 53, 'STRI FAIT', {
        fontFamily: 'monospace',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(6)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);

    const title = this.add
      .text(cx, 56, 'STRI FAIT', {
        fontFamily: 'monospace',
        fontSize: '72px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setLetterSpacing(6)
      .setDepth(4);
    title.setStroke('#ff2d95', 7);

    this.add
      .text(cx, 118, 'VERSION WIBER TURBO 2', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#c792ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(4)
      .setDepth(4);
  }

  createPanel(cx, cy, b, i, w, h) {
    const glow = this.add
      .rectangle(cx, cy, w, h, b.color, 0.12)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(5);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.12, to: 0.22 },
      duration: 900 + i * 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    const border = this.add.rectangle(cx, cy, w, h).setStrokeStyle(4, b.color).setDepth(5);
    this.add.rectangle(cx, cy, w - 12, h - 12, 0x1b0f33).setDepth(5);

    const texW = b.sheet
      ? b.frameW
      : this.textures.get(b.key).getSourceImage().width;
    const texH = b.sheet
      ? b.frameH
      : this.textures.get(b.key).getSourceImage().height;

    const innerW = w - 28;
    const innerH = h - 60;
    const scale = Math.min(innerW / texW, innerH / texH);

    let preview;
    if (b.sheet) {
      preview = this.add.sprite(cx, cy - 12, b.key).setDepth(5);
      preview.play(`${b.key}Bg`);
    } else {
      preview = this.add.image(cx, cy - 12, b.key).setDepth(5);
    }
    preview.setScale(scale);

    const name = this.add
      .text(cx, cy + h / 2 - 18, b.name, {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(1)
      .setDepth(6);

    return { index: i, cx, cy, w, h, glow, border, name };
  }

  refresh() {
    this.panels.forEach((panel) => {
      const isCursor = panel.index === this.cursor;
      panel.border.setStrokeStyle(isCursor ? 8 : 4, BACKGROUNDS[panel.index].color);
      panel.glow.setAlpha(isCursor ? 0.5 : 0.12);
      panel.name.setColor(isCursor ? '#ffe600' : '#8892b0');
    });
  }

  update() {
    const k = this.keys;
    const left = Phaser.Input.Keyboard.JustDown(k.A) || Phaser.Input.Keyboard.JustDown(k.LEFT);
    const right = Phaser.Input.Keyboard.JustDown(k.D) || Phaser.Input.Keyboard.JustDown(k.RIGHT);

    const total = BACKGROUNDS.length;

    if (left) {
      this.cursor = (this.cursor - 1 + total) % total;
      this.refresh();
    }
    if (right) {
      this.cursor = (this.cursor + 1) % total;
      this.refresh();
    }

    if (
      Phaser.Input.Keyboard.JustDown(k.ENTER) ||
      Phaser.Input.Keyboard.JustDown(k.SPACE)
    ) {
      this.confirm();
    }
  }

  confirm() {
    this.scene.start('GameScene', {
      p1: this.p1,
      p2: this.p2,
      bg: this.cursor
    });
  }
}
