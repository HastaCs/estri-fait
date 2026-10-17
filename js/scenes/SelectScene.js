class SelectScene extends Phaser.Scene {
  constructor() {
    super('SelectScene');
  }

  preload() {
    if (!this.cache.audio.exists('bgm')) {
      this.load.audio('bgm', 'assets/audio/audio1.mp3');
    }
    CHARACTERS.forEach((c) => {
      this.load.image(c.face, `assets/${c.key}/${c.key}_face.png`);
      this.load.spritesheet(c.sheet, c.sheetPath, {
        frameWidth: c.frameW,
        frameHeight: c.frameH
      });
    });
  }

  create() {
    this.cursor = 0;
    this.p1 = null;
    this.p2 = null;
    this.previewH = 350;

    this.drawBackground();
    this.addSunAndBeams();
    this.drawTitle();
    this.addSparkles();

    this.startMusic();

    CHARACTERS.forEach((c) => {
      const key = `${c.key}Idle`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: buildIdleFrames(this.anims, c),
          frameRate: c.idleFrameRate || 6,
          repeat: -1
        });
      }
    });

    this.preview = this.add.sprite(300, 560, CHARACTERS[0].sheet);
    this.preview.setOrigin(0.5, CHARACTERS[0].originY);
    this.preview.setDepth(6);

    this.previewName = this.add
      .text(300, 614, CHARACTERS[0].name, {
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(6);

    const cols = [585, 785, 985, 1185];
    const rows = [270, 450];
    this.panels = CHARACTERS.map((c, i) => {
      const cx = cols[i % 4];
      const cy = rows[Math.floor(i / 4)];
      return this.createPanel(cx, cy, c, i);
    });

    this.prompt = this.add
      .text(300, 172, 'JUGADOR 1: ELIGE TU LUCHADOR', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(1)
      .setDepth(6);

    this.add
      .text(this.scale.width / 2, 695, 'A / D  MOVER        W / S  FILA        ENTER  ELEGIR', {
        fontFamily: 'monospace',
        fontSize: '22px',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setLetterSpacing(1)
      .setDepth(6);

    this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,ENTER,SPACE,W,S,UP,DOWN');

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

    g.fillStyle(0x1b0f33, 0.92);
    g.fillRect(520, 210, this.scale.width - 520, 440);

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
      g.fillStyle(band ? 0xff2d95 : 0x7a2bff, 0.30);
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

    const ghost = this.add
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

    const ghost2 = this.add
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

    this.add
      .text(cx, 148, 'ELIGE TU LUCHADOR (VS CPU)', {
        fontFamily: 'monospace',
        fontSize: '20px',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(4);

    this.tweens.add({
      targets: title,
      scale: 1.04,
      duration: 850,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  addSparkles() {
    const colors = [0xffffff, 0x00e5ff, 0xff2d95, 0xffe600];
    const positions = [];
    for (let i = 0; i < 46; i++) {
      positions.push({
        x: Math.random() * this.scale.width,
        y: Math.random() * 600
      });
    }

    positions.forEach((p, i) => {
      const s = this.add
        .circle(p.x, p.y, 1.5 + Math.random() * 1.5, colors[i % colors.length])
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(7);
      this.tweens.add({
        targets: s,
        alpha: { from: 0, to: 1 },
        scale: { from: 0.4, to: 1.3 },
        duration: 500 + Math.random() * 900,
        yoyo: true,
        repeat: -1,
        delay: Math.random() * 900,
        ease: 'Sine.easeInOut'
      });
    });
  }

  createPanel(cx, cy, c, i) {
    const w = 180;
    const h = 170;

    const glow = this.add
      .rectangle(cx, cy, w, h, c.color, 0.12)
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

    const border = this.add.rectangle(cx, cy, w, h).setStrokeStyle(4, c.color).setDepth(5);
    const inner = this.add.rectangle(cx, cy, w - 12, h - 12, 0x1b0f33).setDepth(5);

    const image = this.add.image(cx, cy - 10, c.face).setDepth(5);
    const scale = Math.min((w - 28) / image.width, (h - 52) / image.height);
    image.setScale(scale);

    const name = this.add
      .text(cx, cy + h / 2 - 16, c.name, {
        fontFamily: 'monospace',
        fontSize: '18px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(1)
      .setDepth(6);

    const badgeP1 = this.add
      .text(cx - 4, cy - h / 2 - 14, 'P1', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(6);

    const badgeP2 = this.add
      .text(cx + 30, cy - h / 2 - 14, 'P2', {
        fontFamily: 'monospace',
        fontSize: '20px',
        fontStyle: 'bold',
        color: '#ff2d95'
      })
      .setOrigin(0.5)
      .setVisible(false)
      .setDepth(6);

    return { index: i, cx, cy, w, h, glow, border, name, badgeP1, badgeP2 };
  }

  showPreview(i) {
    const c = CHARACTERS[i];
    this.preview.setTexture(c.sheet);
    this.preview.setOrigin(0.5, c.originY);
    this.preview.setScale(this.previewH / c.sourceH);
    this.preview.setFlipX(c.facesRight !== true);
    this.preview.play(`${c.key}Idle`);
    this.previewName.setText(c.name);
  }

  refresh() {
    this.panels.forEach((panel) => {
      const isCursor = panel.index === this.cursor;
      const chosen = panel.index === this.p1 || panel.index === this.p2;
      panel.border.setStrokeStyle(isCursor ? 8 : 4, CHARACTERS[panel.index].color);
      panel.glow.setAlpha(isCursor ? 0.5 : 0.12);
      panel.name.setColor(chosen ? '#ffe600' : isCursor ? '#ffffff' : '#8892b0');
      panel.badgeP1.setVisible(panel.index === this.p1);
      panel.badgeP2.setVisible(panel.index === this.p2);
    });

    this.showPreview(this.cursor);

    if (this.p1 === null) {
      this.prompt.setText('JUGADOR 1: ELIGE TU LUCHADOR').setColor('#00e5ff');
    } else {
      this.prompt.setText('CPU: AGUSTIN').setColor('#ff2d95');
    }
  }

  update() {
    const k = this.keys;
    const left = Phaser.Input.Keyboard.JustDown(k.A) || Phaser.Input.Keyboard.JustDown(k.LEFT);
    const right = Phaser.Input.Keyboard.JustDown(k.D) || Phaser.Input.Keyboard.JustDown(k.RIGHT);
    const up = Phaser.Input.Keyboard.JustDown(k.W) || Phaser.Input.Keyboard.JustDown(k.UP);
    const down = Phaser.Input.Keyboard.JustDown(k.S) || Phaser.Input.Keyboard.JustDown(k.DOWN);

    const total = CHARACTERS.length;

    if (left) {
      this.cursor = (this.cursor - 1 + total) % total;
      this.refresh();
    }
    if (right) {
      this.cursor = (this.cursor + 1) % total;
      this.refresh();
    }
    if (up) {
      this.cursor = (this.cursor - 4 + total) % total;
      this.refresh();
    }
    if (down) {
      this.cursor = (this.cursor + 4) % total;
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
    if (this.p1 !== null) {
      return;
    }

    this.p1 = this.cursor;
    this.p2 = CHARACTERS.findIndex((c) => c.key === 'agustin');
    if (this.p2 < 0) {
      this.p2 = this.p1;
    }

    this.refresh();
    this.celebrate(this.panels[this.p1], 'P1', 0x00e5ff);
    this.time.delayedCall(420, () => {
      this.celebrate(this.panels[this.p2], 'CPU', 0xff2d95);
    });
    this.time.delayedCall(1250, () => {
      this.scene.start('BackgroundScene', { p1: this.p1, p2: this.p2 });
    });
  }

  celebrate(panel, label, color) {
    const cx = panel.cx;
    const cy = panel.cy;
    const hex = `#${color.toString(16).padStart(6, '0')}`;

    this.cameras.main.flash(160, 255, 255, 255);
    this.cameras.main.shake(220, 0.005);

    const ring = this.add.circle(cx, cy, 40).setStrokeStyle(6, color).setDepth(15);
    ring.setBlendMode(Phaser.BlendModes.ADD);
    this.tweens.add({
      targets: ring,
      scale: 6.5,
      alpha: { from: 1, to: 0 },
      duration: 650,
      ease: 'Cubic.easeOut',
      onComplete: () => ring.destroy()
    });

    const rays = 18;
    for (let i = 0; i < rays; i++) {
      const ang = (i / rays) * Math.PI * 2;
      const len = 230 + (i % 2) * 70;
      const ray = this.add
        .rectangle(cx, cy, 9, len, i % 2 ? color : 0xffffff, 0.9)
        .setOrigin(0.5)
        .setDepth(15)
        .setBlendMode(Phaser.BlendModes.ADD);
      ray.setRotation(ang);
      ray.x = cx + Math.cos(ang) * (len / 2);
      ray.y = cy + Math.sin(ang) * (len / 2);
      ray.setScale(0.15, 0.15);
      this.tweens.add({
        targets: ray,
        scaleX: 1,
        scaleY: 1,
        alpha: 0,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => ray.destroy()
      });
    }

    const confettiColors = [0xff2d95, 0x00e5ff, 0xffe600, 0x7a2bff, 0xffffff];
    for (let i = 0; i < 54; i++) {
      const c = confettiColors[i % confettiColors.length];
      const p = this.add
        .rectangle(cx, cy, 8 + Math.random() * 8, 6 + Math.random() * 8, c)
        .setDepth(16);
      const ang = Math.random() * Math.PI * 2;
      const spd = 130 + Math.random() * 300;
      this.tweens.add({
        targets: p,
        x: cx + Math.cos(ang) * spd,
        y: cy + Math.sin(ang) * spd + 170,
        angle: Math.random() * 720 - 360,
        alpha: { from: 1, to: 0 },
        duration: 750 + Math.random() * 550,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }

    const stamp = this.add
      .text(cx, cy, label, {
        fontFamily: 'monospace',
        fontSize: '92px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setDepth(20)
      .setLetterSpacing(2);
    stamp.setStroke(hex, 9);
    stamp.setScale(0.2);
    stamp.setAlpha(0);
    this.tweens.add({
      targets: stamp,
      scale: 1.15,
      alpha: 1,
      duration: 260,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: stamp,
          scale: 1,
          duration: 220,
          onComplete: () => {
            this.tweens.add({
              targets: stamp,
              alpha: 0,
              scale: 1.4,
              duration: 320,
              delay: 150,
              onComplete: () => stamp.destroy()
            });
          }
        });
      }
    });

    panel.glow.setAlpha(0.7);
    this.tweens.add({
      targets: panel.glow,
      alpha: 0.12,
      duration: 700
    });
  }

  startMusic() {
    if (!this.sound.get('bgm')) {
      this.sound.add('bgm', { loop: true, volume: 0.3 });
    }
    if (!this.sound.get('bgm').isPlaying) {
      this.sound.play('bgm');
    }
  }
}
