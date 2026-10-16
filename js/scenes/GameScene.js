class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.spritesheet('bg', 'assets/fondo_sheet.png', {
      frameWidth: 752,
      frameHeight: 360
    });
    if (!this.cache.audio.exists('bgm')) {
      this.load.audio('bgm', 'assets/audio/audio1.mp3');
    }
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

    if (!this.sound.get('bgm')) {
      this.sound.add('bgm', { loop: true, volume: 0.6 });
    }
    if (!this.sound.get('bgm').isPlaying) {
      this.sound.play('bgm');
    }

    this.fighter1 = this.addFighter(p1, this.p1X, true);
    this.fighter2 = this.addFighter(p2, this.p2X, false);

    this.playIntro();
  }

  addFighter(c, x, mustFaceRight) {
    const sprite = this.add.sprite(x, this.groundY, c.sheet);
    sprite.setOrigin(0.5, c.originY);
    sprite.setScale(FIGHTER_TARGET_H / c.sourceH);
    sprite.setFlipX(c.facesRight !== mustFaceRight);
    sprite.play(`${c.key}Idle`);
    return sprite;
  }

  playIntro() {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2 - 60;

    const dim = this.add
      .rectangle(cx, cy, this.scale.width, 180, 0x000000, 0.35)
      .setDepth(29);

    const round = this.add
      .text(cx, cy, 'ROUND 1', {
        fontFamily: 'monospace',
        fontSize: '120px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0)
      .setScale(2.5);
    round.setStroke('#ff2d95', 10);

    const fight = this.add
      .text(cx, cy, 'FIGHT!', {
        fontFamily: 'monospace',
        fontSize: '150px',
        fontStyle: 'bold',
        color: '#ff4444'
      })
      .setOrigin(0.5)
      .setDepth(30)
      .setAlpha(0)
      .setScale(0.2);
    fight.setStroke('#ffffff', 8);

    this.tweens.add({
      targets: round,
      alpha: 1,
      scale: 1,
      duration: 250,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(800, () => {
          this.tweens.add({
            targets: round,
            alpha: 0,
            scale: 1.7,
            duration: 180,
            onComplete: () => round.destroy()
          });

          this.tweens.add({
            targets: fight,
            alpha: 1,
            scale: 1,
            duration: 140,
            ease: 'Back.easeOut',
            onComplete: () => {
              this.time.delayedCall(520, () => {
                this.tweens.add({
                  targets: fight,
                  alpha: 0,
                  scale: 2,
                  duration: 220,
                  onComplete: () => {
                    fight.destroy();
                    dim.destroy();
                  }
                });
              });
            }
          });
        });
      }
    });
  }
}
