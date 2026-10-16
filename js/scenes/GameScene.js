class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.spritesheet('bg', 'assets/fondo_sheet.png', {
      frameWidth: 752,
      frameHeight: 360
    });
    CHARACTERS.forEach((c) =>
      this.load.spritesheet(c.sheet, c.sheetPath, {
        frameWidth: c.frameW,
        frameHeight: c.frameH
      })
    );
  }

  create(data) {
    this.groundY = 690;
    this.p1X = 340;
    this.p2X = 940;

    const p1 = CHARACTERS[data && data.p1 != null ? data.p1 : 0];
    const p2 = CHARACTERS[data && data.p2 != null ? data.p2 : 1];

    this.anims.create({
      key: 'bg',
      frames: this.anims.generateFrameNumbers('bg', { start: 0, end: 7 }),
      frameRate: 1000 / 120,
      repeat: -1
    });

    CHARACTERS.forEach((c) => {
      const key = `${c.key}Idle`;
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(c.sheet, { start: 0, end: 7 }),
          frameRate: 6,
          repeat: -1
        });
      }
    });

    this.background = this.add.sprite(
      this.scale.width / 2,
      this.scale.height / 2,
      'bg'
    );
    this.background.setScale(2);
    this.background.setDepth(-1);
    this.background.play('bg');

    this.fighter1 = this.addFighter(p1, this.p1X, true);
    this.fighter2 = this.addFighter(p2, this.p2X, false);
  }

  addFighter(c, x, mustFaceRight) {
    const sprite = this.add.sprite(x, this.groundY, c.sheet);
    sprite.setOrigin(0.5, c.originY);
    sprite.setScale(FIGHTER_TARGET_H / c.sourceH);
    sprite.setFlipX(c.facesRight !== mustFaceRight);
    sprite.play(`${c.key}Idle`);
    return sprite;
  }
}
