class DefeatScene extends Phaser.Scene {
  constructor() {
    super('DefeatScene');
  }

  preload() {
    if (!this.textures.exists('rafaDerrotado')) {
      this.load.image('rafaDerrotado', 'assets/rafa/derrotado.jpeg');
    }
  }

  create() {
    this.canContinue = false;

    this.drawBackground();
    this.addSunAndBeams();
    this.drawTitle();
    this.addSparkles();
    this.drawPhoto();
    this.drawDialog();

    this.keys = this.input.keyboard.addKeys('ENTER,SPACE');

    this.input.keyboard.once('keydown-ENTER', () => this.continueGame());
    this.input.keyboard.once('keydown-SPACE', () => this.continueGame());
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
      .text(cx + 3, 55, 'K.O.', {
        fontFamily: 'monospace',
        fontSize: '76px',
        fontStyle: 'bold',
        color: '#ff2d95'
      })
      .setOrigin(0.5)
      .setLetterSpacing(8)
      .setAlpha(0.55)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);

    const title = this.add
      .text(cx, 52, 'K.O.', {
        fontFamily: 'monospace',
        fontSize: '76px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setLetterSpacing(8)
      .setDepth(4);
    title.setStroke('#ff2d95', 8);

    this.add
      .text(cx, 112, 'RAFA DERROTADO', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(4)
      .setDepth(4);

    this.tweens.add({
      targets: title,
      scale: 1.05,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  addSparkles() {
    const colors = [0xffffff, 0x00e5ff, 0xff2d95, 0xffe600];
    for (let i = 0; i < 40; i++) {
      const s = this.add
        .circle(
          Math.random() * this.scale.width,
          Math.random() * 600,
          1.5 + Math.random() * 1.5,
          colors[i % colors.length]
        )
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
    }
  }

  drawPhoto() {
    const cx = 360;
    const cy = 330;
    const frameW = 500;
    const frameH = 380;

    this.add
      .rectangle(cx, cy, frameW + 20, frameH + 20, 0x1b0f33)
      .setStrokeStyle(6, 0xff2d95)
      .setDepth(4);

    const img = this.add.image(cx, cy, 'rafaDerrotado').setDepth(5);
    const scale = Math.min((frameW - 16) / img.width, (frameH - 16) / img.height);
    img.setScale(scale);

    const glow = this.add
      .rectangle(cx, cy, frameW + 20, frameH + 20, 0xff2d95, 0.15)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(3);
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.15, to: 0.35 },
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  drawDialog() {
    const cx = 900;
    const cy = 400;
    const boxW = 520;
    const boxH = 300;

    this.add
      .rectangle(cx, cy, boxW, boxH, 0x0b0718, 0.92)
      .setStrokeStyle(5, 0x00e5ff)
      .setDepth(6);

    const msg =
      'ESTO NO VA A QUEDAR ASÍ...\nLLAMARÉ A RAFA BUENO\nY ME VENGARÁ.';
    this.msgText = this.add
      .text(cx - boxW / 2 + 34, cy - boxH / 2 + 40, '', {
        fontFamily: 'monospace',
        fontSize: '30px',
        fontStyle: 'bold',
        color: '#ffffff',
        lineSpacing: 14
      })
      .setDepth(7);
    this.msgText.setStroke('#ff2d95', 4);

    const nameTag = this.add
      .text(cx - boxW / 2 + 34, cy - boxH / 2 - 24, 'RAFA', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setDepth(7);
    nameTag.setStroke('#0d0f16', 5);

    let reveal = 0;
    this.time.addEvent({
      delay: 42,
      loop: true,
      callback: () => {
        reveal++;
        this.msgText.setText(msg.slice(0, reveal));
        if (reveal >= msg.length) {
          this.showPrompt();
          return;
        }
      }
    });

    this.prompt = this.add
      .text(cx, cy + boxH / 2 + 42, 'PULSA ENTER', {
        fontFamily: 'monospace',
        fontSize: '24px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(3)
      .setDepth(7)
      .setVisible(false);
  }

  showPrompt() {
    if (this.canContinue) {
      return;
    }
    this.canContinue = true;
    this.prompt.setVisible(true);
    this.tweens.add({
      targets: this.prompt,
      alpha: { from: 0.2, to: 1 },
      duration: 600,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  continueGame() {
    if (!this.canContinue) {
      return;
    }
    this.scene.start('SelectScene');
  }
}
