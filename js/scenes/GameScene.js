const WALK_SPEED = 200;
const WALK_MIN_X = 100;
const WALK_MAX_X = 1180;
const JUMP_DURATION_MS = 800;
const JUMP_LIFT = 130;
const JUMP_UP_MS = 350;
const JUMP_DOWN_MS = 450;
const PUNCH_DURATION_MS = 600;

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  preload() {
    this.load.spritesheet('bg', 'assets/fondo_sheet.png', {
      frameWidth: 752,
      frameHeight: 360
    });
    CHARACTERS.forEach((c) => {
      this.load.spritesheet(c.sheet, c.sheetPath, {
        frameWidth: c.frameW,
        frameHeight: c.frameH
      });
      if (c.walkSheet) {
        this.load.spritesheet(c.walkSheet, c.walkSheetPath, {
          frameWidth: c.walkFrameW,
          frameHeight: c.walkFrameH
        });
      }
      if (c.jumpSheet) {
        this.load.spritesheet(c.jumpSheet, c.jumpSheetPath, {
          frameWidth: c.jumpFrameW,
          frameHeight: c.jumpFrameH
        });
      }
      if (c.punchSheet) {
        this.load.spritesheet(c.punchSheet, c.punchSheetPath, {
          frameWidth: c.punchFrameW,
          frameHeight: c.punchFrameH
        });
      }
    });
  }

  create(data) {
    this.groundY = 690;
    this.p1X = 340;
    this.p2X = 940;
    this.controlsEnabled = false;
    this.walkerMoving = false;

    const p1 = CHARACTERS[data && data.p1 != null ? data.p1 : 0];
    const p2 = CHARACTERS[data && data.p2 != null ? data.p2 : 1];

    this.anims.create({
      key: 'bg',
      frames: this.anims.generateFrameNumbers('bg', { start: 0, end: 7 }),
      frameRate: 1000 / 120,
      repeat: -1
    });

    CHARACTERS.forEach((c) => {
      if (!this.anims.exists(`${c.key}Idle`)) {
        this.anims.create({
          key: `${c.key}Idle`,
          frames: this.anims.generateFrameNumbers(c.sheet, { start: 0, end: 7 }),
          frameRate: 6,
          repeat: -1
        });
      }
      if (c.walkSheet && !this.anims.exists(`${c.key}Walk`)) {
        const frames = this.anims.generateFrameNumbers(c.walkSheet, {
          start: 0,
          end: c.walkFrames - 1
        });
        this.anims.create({
          key: `${c.key}Walk`,
          frames,
          frameRate: 10,
          repeat: -1
        });
        this.anims.create({
          key: `${c.key}WalkBack`,
          frames: frames.slice().reverse(),
          frameRate: 10,
          repeat: -1
        });
      }
      if (c.jumpSheet && !this.anims.exists(`${c.key}Jump`)) {
        this.anims.create({
          key: `${c.key}Jump`,
          frames: this.anims.generateFrameNumbers(c.jumpSheet, {
            start: 0,
            end: c.jumpFrames - 1
          }),
          frameRate: c.jumpFrames / (JUMP_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (c.punchSheet && !this.anims.exists(`${c.key}Punch`)) {
        this.anims.create({
          key: `${c.key}Punch`,
          frames: this.anims.generateFrameNumbers(c.punchSheet, {
            start: 0,
            end: c.punchFrames - 1
          }),
          frameRate: c.punchFrames / (PUNCH_DURATION_MS / 1000),
          repeat: 0
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

    const wp = p1.walkSheet || p1.jumpSheet ? p1 : p2.walkSheet || p2.jumpSheet ? p2 : p1;
    this.walkChar = wp;
    this.walker = wp === p1 ? this.fighter1 : this.fighter2;

    const pc = p1.punchSheet ? p1 : p2.punchSheet ? p2 : null;
    this.punchChar = pc;
    this.puncher = pc === p1 ? this.fighter1 : pc === p2 ? this.fighter2 : null;

    this.jumping = false;
    this.punching = false;
    this.jumpKey = this.walkChar.jumpSheet ? `${this.walkChar.key}Jump` : null;
    this.punchKey = this.punchChar ? `${this.punchChar.key}Punch` : null;

    this.walker.on('animationcomplete', (anim) => {
      if (anim.key === this.jumpKey && this.jumping) {
        this.jumping = false;
        this.tweens.killTweensOf(this.walker);
        this.walker.y = this.groundY;
        this.applyIdle(this.walkChar, this.walker);
      }
    });

    if (this.puncher) {
      this.puncher.on('animationcomplete', (anim) => {
        if (anim.key === this.punchKey && this.punching) {
          this.punching = false;
          this.applyIdle(this.punchChar, this.puncher);
        }
      });
    }

    this.keys = this.input.keyboard.addKeys('A,D,SPACE,F');

    this.playIntro();
  }

  addFighter(c, x, mustFaceRight) {
    const sprite = this.add.sprite(x, this.groundY, c.sheet);
    sprite.setOrigin(0.5, c.originY);
    sprite.setScale(FIGHTER_TARGET_H / c.sourceH);
    sprite.setFlipX(c.facesRight !== mustFaceRight);
    sprite.play(`${c.key}Idle`);
    sprite.mustFaceRight = mustFaceRight;
    return sprite;
  }

  applyIdle(c, sprite) {
    if (sprite.texture.key !== c.sheet) {
      sprite.setTexture(c.sheet);
      sprite.setOrigin(0.5, c.originY);
      sprite.setScale(FIGHTER_TARGET_H / c.sourceH);
    }
    if (!sprite.anims.isPlaying || sprite.anims.currentAnim.key !== `${c.key}Idle`) {
      sprite.play(`${c.key}Idle`);
    }
  }

  applyWalk(c, sprite, forward) {
    if (sprite.texture.key !== c.walkSheet) {
      sprite.setTexture(c.walkSheet);
      sprite.setOrigin(0.5, c.walkOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.walkSourceH);
    }
    const key = forward ? `${c.key}Walk` : `${c.key}WalkBack`;
    if (!sprite.anims.isPlaying || sprite.anims.currentAnim.key !== key) {
      sprite.play(key);
    }
  }

  applyJump(c, sprite) {
    if (sprite.texture.key !== c.jumpSheet) {
      sprite.setTexture(c.jumpSheet);
      sprite.setOrigin(0.5, c.jumpOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.jumpSourceH);
    }
    sprite.play(`${c.key}Jump`);
  }

  applyPunch(c, sprite) {
    if (sprite.texture.key !== c.punchSheet) {
      sprite.setTexture(c.punchSheet);
      sprite.setOrigin(0.5, c.punchOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.punchSourceH);
    }
    sprite.play(`${c.key}Punch`);
  }

  playJumpArc() {
    const sprite = this.walker;
    sprite.y = this.groundY;
    this.tweens.add({
      targets: sprite,
      y: this.groundY - JUMP_LIFT,
      duration: JUMP_UP_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          y: this.groundY,
          duration: JUMP_DOWN_MS,
          ease: 'Quad.easeIn'
        });
      }
    });
  }

  update(_, delta) {
    if (!this.controlsEnabled || !this.walker) {
      return;
    }

    const dt = delta / 1000;
    const left = this.keys.A.isDown;
    const right = this.keys.D.isDown;

    if (this.jumping) {
      if (left || right) {
        const dir = right ? 1 : -1;
        this.walker.x = Phaser.Math.Clamp(
          this.walker.x + dir * WALK_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
      }
      return;
    }

    if (
      this.walkChar.jumpSheet &&
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    ) {
      this.jumping = true;
      this.walkerMoving = false;
      this.applyJump(this.walkChar, this.walker);
      this.playJumpArc();
      return;
    }

    if (
      this.punchChar &&
      Phaser.Input.Keyboard.JustDown(this.keys.F)
    ) {
      this.punching = true;
      this.applyPunch(this.punchChar, this.puncher);
      return;
    }

    if (this.punching && this.puncher === this.walker) {
      return;
    }

    const moving = left || right;

    if (moving) {
      const dir = right ? 1 : -1;
      const facingRight = this.walker.mustFaceRight;
      const forward = dir === 1 ? facingRight : !facingRight;

      this.walker.x = Phaser.Math.Clamp(
        this.walker.x + dir * WALK_SPEED * dt,
        WALK_MIN_X,
        WALK_MAX_X
      );
      if (this.walkChar.walkSheet) {
        this.applyWalk(this.walkChar, this.walker, forward);
      }
      this.walkerMoving = true;
    } else if (this.walkerMoving) {
      this.applyIdle(this.walkChar, this.walker);
      this.walkerMoving = false;
    }
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
                    this.controlsEnabled = true;
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
