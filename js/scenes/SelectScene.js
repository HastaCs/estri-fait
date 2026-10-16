class SelectScene extends Phaser.Scene {
  constructor() {
    super('SelectScene');
  }

  preload() {
    CHARACTERS.forEach((c) => this.load.image(c.face, `assets/${c.key}/${c.key}_face.png`));
  }

  create() {
    this.cursor = 0;
    this.p1 = null;
    this.p2 = null;

    this.drawBackground();
    this.drawTitle();

    const xs = [220, 500, 780, 1060];
    this.panels = CHARACTERS.map((c, i) => this.createPanel(xs[i], 380, c, i));

    this.add
      .text(this.scale.width / 2, 660, 'A / D  MOVER        ENTER  ELEGIR        (P1 y despues P2)', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setLetterSpacing(2);

    this.prompt = this.add
      .text(this.scale.width / 2, 620, 'JUGADOR 1: ELIGE TU LUCHADOR', {
        fontFamily: 'monospace',
        fontSize: '24px',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(2);

    this.keys = this.input.keyboard.addKeys('A,D,LEFT,RIGHT,ENTER,SPACE');

    this.refresh();
  }

  drawBackground() {
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a0614).setOrigin(0);

    const g = this.add.graphics();
    const horizon = 470;

    g.fillStyle(0x120a26, 1);
    g.fillRect(0, horizon, this.scale.width, this.scale.height - horizon);

    g.lineStyle(2, 0xff2d95, 0.55);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      g.beginPath();
      g.moveTo(640 + (t - 0.5) * 90, horizon);
      g.lineTo(640 + (t - 0.5) * 1800, this.scale.height);
      g.strokePath();
    }

    g.lineStyle(2, 0x00e5ff, 0.5);
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

    g.fillStyle(0x1b0f33, 1);
    g.fillRect(0, 150, this.scale.width, 320);

    for (let i = 0; i < this.scale.height; i += 4) {
      this.add.rectangle(0, i, this.scale.width, 1, 0x000000, 0.18).setOrigin(0);
    }
  }

  drawTitle() {
    const title = this.add
      .text(this.scale.width / 2, 82, 'ESTRI FAIT', {
        fontFamily: 'monospace',
        fontSize: '84px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setLetterSpacing(6);
    title.setStroke('#ff2d95', 8);
    title.setShadow(0, 8, '#7a2bff', 0, true, true);

    this.add
      .text(this.scale.width / 2, 150, 'ELIGE DOS LUCHADORES', {
        fontFamily: 'monospace',
        fontSize: '26px',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(4);

    this.tweens.add({
      targets: title,
      scale: 1.03,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });
  }

  createPanel(cx, cy, c, i) {
    const w = 260;
    const h = 300;

    const glow = this.add.rectangle(cx, cy, w, h, c.color, 0.12);
    const border = this.add.rectangle(cx, cy, w, h).setStrokeStyle(4, c.color);
    const inner = this.add.rectangle(cx, cy, w - 14, h - 14, 0x1b0f33);

    const image = this.add.image(cx, cy - 14, c.face);
    const scale = Math.min((w - 36) / image.width, (h - 84) / image.height);
    image.setScale(scale);

    const name = this.add
      .text(cx, cy + h / 2 - 28, c.name, {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0.5)
      .setLetterSpacing(2);

    const badgeP1 = this.add
      .text(cx - 6, cy - h / 2 - 18, 'P1', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setVisible(false);

    const badgeP2 = this.add
      .text(cx + 44, cy - h / 2 - 18, 'P2', {
        fontFamily: 'monospace',
        fontSize: '26px',
        fontStyle: 'bold',
        color: '#ff2d95'
      })
      .setOrigin(0.5)
      .setVisible(false);

    return { index: i, cx, cy, w, h, glow, border, name, badgeP1, badgeP2 };
  }

  refresh() {
    this.panels.forEach((panel) => {
      const isCursor = panel.index === this.cursor;
      const chosen = panel.index === this.p1 || panel.index === this.p2;
      panel.border.setStrokeStyle(isCursor ? 8 : 4, CHARACTERS[panel.index].color);
      panel.glow.setAlpha(isCursor ? 0.35 : chosen ? 0.2 : 0.1);
      panel.name.setColor(chosen ? '#ffe600' : isCursor ? '#ffffff' : '#8892b0');
      panel.badgeP1.setVisible(panel.index === this.p1);
      panel.badgeP2.setVisible(panel.index === this.p2);
    });

    if (this.p1 === null) {
      this.prompt.setText('JUGADOR 1: ELIGE TU LUCHADOR').setColor('#00e5ff');
    } else if (this.p2 === null) {
      this.prompt.setText('JUGADOR 2: ELIGE TU LUCHADOR').setColor('#ff2d95');
    }
  }

  update() {
    const k = this.keys;
    const left = Phaser.Input.Keyboard.JustDown(k.A) || Phaser.Input.Keyboard.JustDown(k.LEFT);
    const right = Phaser.Input.Keyboard.JustDown(k.D) || Phaser.Input.Keyboard.JustDown(k.RIGHT);

    if (left && this.cursor > 0) {
      this.cursor--;
      this.refresh();
    }
    if (right && this.cursor < CHARACTERS.length - 1) {
      this.cursor++;
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
    if (this.p1 === null) {
      this.p1 = this.cursor;
    } else if (this.p2 === null) {
      this.p2 = this.cursor;
    }
    this.refresh();

    if (this.p1 !== null && this.p2 !== null) {
      this.scene.start('GameScene', { p1: this.p1, p2: this.p2 });
    }
  }
}
