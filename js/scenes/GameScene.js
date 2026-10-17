const WALK_SPEED = 200;
const WALK_MIN_X = 100;
const WALK_MAX_X = 1180;
const FIGHTER_BODY_W = 110;
const FIGHTER_BODY_H = 300;
const JUMP_DURATION_MS = 800;
const JUMP_LIFT = 130;
const JUMP_UP_MS = 350;
const JUMP_DOWN_MS = 450;
const BACKFLIP_DURATION_MS = 1100;
const BACKFLIP_SPEED = 360;
const JUMP_SPEED = 360;
const PUNCH_DURATION_MS = 600;
const TAUNT_DURATION_MS = 1200;
const DEATH_DURATION_MS = 1500;
const FIGHTER_MAX_HP = 100;
const PUNCH_DAMAGE = 20;
const KAME_DAMAGE = 20;
const PUNCH_REACH = 180;
const KAME_CHARGE_MS = 800;
const KAME_FIRE_MS = 600;
const SPECIAL_CHARGE_FRAMES = 14;
const KAME_HAND_H = 205;
const KAME_CORE = 0xffffff;
const KAME_MID = 0x66ccff;
const KAME_OUTER = 0x2a6bff;

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.startData = data || {};
    this.bgIndex = this.startData.bg != null ? this.startData.bg : 0;
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
      if (c.backflipSheet) {
        this.load.spritesheet(c.backflipSheet, c.backflipSheetPath, {
          frameWidth: c.backflipFrameW,
          frameHeight: c.backflipFrameH
        });
      }
      if (c.specialSheet) {
        this.load.spritesheet(c.specialSheet, c.specialSheetPath, {
          frameWidth: c.specialFrameW,
          frameHeight: c.specialFrameH
        });
      }
      if (c.specialSound && !this.cache.audio.exists(c.specialSound)) {
        this.load.audio(c.specialSound, c.specialSoundPath);
      }
      if (c.kneelSheet) {
        this.load.spritesheet(c.kneelSheet, c.kneelSheetPath, {
          frameWidth: c.kneelFrameW,
          frameHeight: c.kneelFrameH
        });
      }
      if (c.punchSheet) {
        this.load.spritesheet(c.punchSheet, c.punchSheetPath, {
          frameWidth: c.punchFrameW,
          frameHeight: c.punchFrameH
        });
      }
      if (c.punchSound && !this.cache.audio.exists(c.punchSound)) {
        this.load.audio(c.punchSound, c.punchSoundPath);
      }
      if (c.tauntSheet) {
        this.load.spritesheet(c.tauntSheet, c.tauntSheetPath, {
          frameWidth: c.tauntFrameW,
          frameHeight: c.tauntFrameH
        });
      }
      if (c.deathSheet) {
        this.load.spritesheet(c.deathSheet, c.deathSheetPath, {
          frameWidth: c.deathFrameW,
          frameHeight: c.deathFrameH
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
    this.p1Char = p1;
    this.p2Char = p2;

    const bgDef = BACKGROUNDS[this.bgIndex] || BACKGROUNDS[0];
    if (bgDef.sheet && !this.anims.exists(`${bgDef.key}Bg`)) {
      this.anims.create({
        key: `${bgDef.key}Bg`,
        frames: this.anims.generateFrameNumbers(bgDef.key, {
          start: 0,
          end: bgDef.frames - 1
        }),
        frameRate: bgDef.frameRate,
        repeat: -1
      });
    }

    CHARACTERS.forEach((c) => {
      if (!this.anims.exists(`${c.key}Idle`)) {
        this.anims.create({
          key: `${c.key}Idle`,
          frames: this.anims.generateFrameNumbers(c.sheet, {
            start: 0,
            end: (c.idleFrames || 8) - 1
          }),
          frameRate: c.idleFrameRate || 6,
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
          frameRate: c.walkFrameRate || 10,
          repeat: -1
        });
        this.anims.create({
          key: `${c.key}WalkBack`,
          frames: frames.slice().reverse(),
          frameRate: c.walkFrameRate || 10,
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
      if (c.backflipSheet && !this.anims.exists(`${c.key}Backflip`)) {
        this.anims.create({
          key: `${c.key}Backflip`,
          frames: this.anims.generateFrameNumbers(c.backflipSheet, {
            start: 0,
            end: c.backflipFrames - 1
          }),
          frameRate: c.backflipFrames / (BACKFLIP_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (c.specialSheet && !this.anims.exists(`${c.key}Special`)) {
        this.anims.create({
          key: `${c.key}Special`,
          frames: this.anims.generateFrameNumbers(c.specialSheet, {
            start: 0,
            end: c.specialFrames - 1
          }),
          frameRate: SPECIAL_CHARGE_FRAMES / (KAME_CHARGE_MS / 1000),
          repeat: 0
        });
      }
      if (c.specialSound && !this.sound.get(c.specialSound)) {
        this.sound.add(c.specialSound, { volume: 0.6 });
      }
      if (c.kneelSheet && !this.anims.exists(`${c.key}KneelDown`)) {
        const down = this.anims.generateFrameNumbers(c.kneelSheet, {
          start: 0,
          end: c.kneelHoldFrame
        });
        const downMs = c.kneelDownMs || 1000;
        const upMs = c.kneelUpMs || downMs;
        this.anims.create({
          key: `${c.key}KneelDown`,
          frames: down,
          frameRate: down.length / (downMs / 1000),
          repeat: 0
        });
        this.anims.create({
          key: `${c.key}KneelUp`,
          frames: down.slice().reverse(),
          frameRate: down.length / (upMs / 1000),
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
      if (c.punchSound && !this.sound.get(c.punchSound)) {
        this.sound.add(c.punchSound, { volume: 0.5 });
      }
      if (c.tauntSheet && !this.anims.exists(`${c.key}Taunt`)) {
        this.anims.create({
          key: `${c.key}Taunt`,
          frames: this.anims.generateFrameNumbers(c.tauntSheet, {
            start: 0,
            end: c.tauntFrames - 1
          }),
          frameRate: c.tauntFrames / (TAUNT_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (c.deathSheet && !this.anims.exists(`${c.key}Death`)) {
        this.anims.create({
          key: `${c.key}Death`,
          frames: this.anims.generateFrameNumbers(c.deathSheet, {
            start: 0,
            end: c.deathFrames - 1
          }),
          frameRate: c.deathFrames / (DEATH_DURATION_MS / 1000),
          repeat: 0
        });
      }
    });

    if (bgDef.sheet) {
      this.background = this.add.sprite(
        this.scale.width / 2,
        this.scale.height / 2,
        bgDef.key
      );
      this.background.setScale(
        Math.max(
          this.scale.width / bgDef.frameW,
          this.scale.height / bgDef.frameH
        )
      );
      this.background.setDepth(-1);
      this.background.play(`${bgDef.key}Bg`);
    } else {
      this.background = this.add.image(
        this.scale.width / 2,
        this.scale.height / 2,
        bgDef.key
      );
      const src = this.textures.get(bgDef.key).getSourceImage();
      const cover = Math.max(
        this.scale.width / src.width,
        this.scale.height / src.height
      );
      this.background.setScale(cover);
      this.background.setDepth(-1);
    }

    this.fighter1 = this.addFighter(p1, this.p1X, true);
    this.fighter2 = this.addFighter(p2, this.p2X, false);

    const wp = p1.walkSheet || p1.jumpSheet ? p1 : p2.walkSheet || p2.jumpSheet ? p2 : p1;
    this.walkChar = wp;
    this.walker = wp === p1 ? this.fighter1 : this.fighter2;

    const pc = p1.punchSheet ? p1 : p2.punchSheet ? p2 : null;
    this.punchChar = pc;
    this.puncher = pc === p1 ? this.fighter1 : pc === p2 ? this.fighter2 : null;

    const tc = p1.tauntSheet ? p1 : p2.tauntSheet ? p2 : null;
    this.tauntChar = tc;
    this.taunter = tc === p1 ? this.fighter1 : tc === p2 ? this.fighter2 : null;

    const dc = p1.deathSheet ? p1 : p2.deathSheet ? p2 : null;
    this.deathChar = dc;
    this.deather = dc === p1 ? this.fighter1 : dc === p2 ? this.fighter2 : null;
    this.dead = false;
    this.gameOver = false;
    this.deathKey = this.deathChar ? `${this.deathChar.key}Death` : null;

    this.jumping = false;
    this.backflipActive = false;
    this.backflipDir = 1;
    this.punching = false;
    this.taunting = false;
    this.kameActive = false;
    this.fightersColliding = false;
    this.jumpKey = this.walkChar.jumpSheet ? `${this.walkChar.key}Jump` : null;
    this.backflipKey = this.walkChar.backflipSheet
      ? `${this.walkChar.key}Backflip`
      : null;
    this.kneelChar = this.walkChar.kneelSheet ? this.walkChar : null;
    this.kneeler = this.walker;
    this.kneeling = false;
    this.kneelStanding = false;
    this.kneelDownKey = this.kneelChar ? `${this.kneelChar.key}KneelDown` : null;
    this.kneelUpKey = this.kneelChar ? `${this.kneelChar.key}KneelUp` : null;
    this.punchKey = this.punchChar ? `${this.punchChar.key}Punch` : null;
    this.tauntKey = this.tauntChar ? `${this.tauntChar.key}Taunt` : null;

    const kc = p1.kamehameha ? p1 : p2.kamehameha ? p2 : null;
    this.kameChar = kc;
    this.kamer = kc === p1 ? this.fighter1 : kc === p2 ? this.fighter2 : null;

    this.ensureParticleTexture();

    this.health1 = FIGHTER_MAX_HP;
    this.health2 = FIGHTER_MAX_HP;
    this.createHealthBars(p1, p2);

    this.walker.on('animationcomplete', (anim) => {
      if (
        (anim.key === this.jumpKey || anim.key === this.backflipKey) &&
        this.jumping
      ) {
        this.jumping = false;
        this.backflipActive = false;
        this.tweens.killTweensOf(this.walker);
        this.walker.y = this.groundY;
        this.applyIdle(this.walkChar, this.walker);
      }
      if (anim.key === this.kneelUpKey && this.kneelStanding) {
        this.kneelStanding = false;
        this.kneeling = false;
        this.applyIdle(this.kneelChar, this.kneeler);
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

    if (this.taunter) {
      this.taunter.on('animationcomplete', (anim) => {
        if (anim.key === this.tauntKey && this.taunting) {
          this.taunting = false;
          this.applyIdle(this.tauntChar, this.taunter);
        }
      });
    }

    this.keys = this.input.keyboard.addKeys('A,D,S,SPACE,F,T,Q');

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

  bodyRect(sprite) {
    return new Phaser.Geom.Rectangle(
      sprite.x - FIGHTER_BODY_W / 2,
      sprite.y - FIGHTER_BODY_H,
      FIGHTER_BODY_W,
      FIGHTER_BODY_H
    );
  }

  resolveFighterCollision() {
    if (this.dead) {
      this.fightersColliding = false;
      return;
    }
    const a = this.bodyRect(this.fighter1);
    const b = this.bodyRect(this.fighter2);
    this.fightersColliding = Phaser.Geom.Intersects.RectangleToRectangle(a, b);
    if (!this.fightersColliding) {
      return;
    }
    if (this.deather) {
      this.triggerDeath();
    }
    const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const dir = this.fighter1.x <= this.fighter2.x ? 1 : -1;
    const push = overlap / 2 + 1;
    this.fighter1.x = Phaser.Math.Clamp(this.fighter1.x - dir * push, WALK_MIN_X, WALK_MAX_X);
    this.fighter2.x = Phaser.Math.Clamp(this.fighter2.x + dir * push, WALK_MIN_X, WALK_MAX_X);
  }

  triggerDeath() {
    this.dead = true;
    const c = this.deathChar;
    const sprite = this.deather;
    if (sprite.texture.key !== c.deathSheet) {
      sprite.setTexture(c.deathSheet);
      sprite.setOrigin(0.5, c.deathOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.deathSourceH);
    }
    sprite.play(`${c.key}Death`);
    this.cameras.main.shake(200, 0.006);
  }

  createHealthBars(p1, p2) {
    const y = 34;
    const w = 520;
    const h = 26;
    this.bar1 = this.makeBar(50, false, y, w, h);
    this.bar2 = this.makeBar(this.scale.width - 50, true, y, w, h);

    this.add
      .text(50, 54, p1.name, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(0, 0)
      .setDepth(28);
    this.add
      .text(this.scale.width - 50, 54, p2.name, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(1, 0)
      .setDepth(28);

    this.updateHealthBars(true);
  }

  makeBar(x, right, y, w, h) {
    const ox = right ? 1 : 0;
    this.add.rectangle(x, y, w, h, 0x0d0f16).setOrigin(ox, 0.5).setDepth(25);
    const ghost = this.add
      .rectangle(x, y, w - 4, h - 4, 0xff8a00)
      .setOrigin(ox, 0.5)
      .setDepth(26);
    const fill = this.add
      .rectangle(x, y, w - 4, h - 4, 0x3ddc6b)
      .setOrigin(ox, 0.5)
      .setDepth(27);
    this.add
      .rectangle(x, y, w, h)
      .setStrokeStyle(3, 0xffffff)
      .setOrigin(ox, 0.5)
      .setDepth(28);
    return { fill, ghost, maxW: w - 4, h: h - 4, ghostW: w - 4 };
  }

  updateHealthBars(instant) {
    this.applyBar(this.bar1, this.health1 / FIGHTER_MAX_HP, instant);
    this.applyBar(this.bar2, this.health2 / FIGHTER_MAX_HP, instant);
  }

  applyBar(bar, ratio, instant) {
    const w = Math.max(0, bar.maxW * ratio);
    bar.fill.setDisplaySize(w, bar.h);
    bar.fill.setFillStyle(ratio > 0.5 ? 0x3ddc6b : ratio > 0.25 ? 0xffd23b : 0xff3b3b);
    if (instant) {
      bar.ghost.setDisplaySize(w, bar.h);
      bar.ghostW = w;
      return;
    }
    this.tweens.killTweensOf(bar.ghost);
    this.tweens.addCounter({
      from: bar.ghostW,
      to: w,
      duration: 450,
      ease: 'Quad.easeOut',
      onUpdate: (tw) => bar.ghost.setDisplaySize(Math.max(0, tw.getValue()), bar.h),
      onComplete: () => {
        bar.ghostW = w;
      }
    });
  }

  damageFighter(sprite, amount) {
    const isP1 = sprite === this.fighter1;
    if (isP1) {
      this.health1 = Math.max(0, this.health1 - amount);
    } else {
      this.health2 = Math.max(0, this.health2 - amount);
    }
    const hp = isP1 ? this.health1 : this.health2;
    sprite.setTintFill(0xffffff);
    this.time.delayedCall(100, () => sprite.clearTint());
    this.updateHealthBars(false);

    if (hp <= 0 && sprite === this.deather && !this.dead) {
      this.triggerDeath();
    }
    if (hp <= 0) {
      this.declareWin(sprite);
    }
  }

  declareWin(loser) {
    if (this.gameOver) {
      return;
    }
    this.gameOver = true;
    this.controlsEnabled = false;
    const winner = this.opponentOf(loser);
    const winnerChar = winner === this.fighter1 ? this.p1Char : this.p2Char;
    const delay = loser === this.deather ? DEATH_DURATION_MS : 500;
    this.time.delayedCall(delay, () => this.showWin(winnerChar));
  }

  showWin(winnerChar) {
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.cameras.main.flash(320, 255, 255, 255);
    this.cameras.main.shake(600, 0.012);

    const dim = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x06030f)
      .setOrigin(0)
      .setAlpha(0)
      .setDepth(40);
    this.tweens.add({ targets: dim, alpha: 0.6, duration: 400 });

    const rays = 24;
    for (let i = 0; i < rays; i++) {
      const ang = (i / rays) * Math.PI * 2;
      const len = 300 + (i % 2) * 120;
      const ray = this.add
        .rectangle(cx, cy - 20, 12, len, i % 2 ? 0xff2d95 : 0x00e5ff, 0.85)
        .setOrigin(0.5)
        .setDepth(41)
        .setBlendMode(Phaser.BlendModes.ADD);
      ray.setRotation(ang);
      ray.x = cx + Math.cos(ang) * (len / 2);
      ray.y = cy - 20 + Math.sin(ang) * (len / 2);
      ray.setScale(0.1, 0.1);
      this.tweens.add({
        targets: ray,
        scaleX: 1,
        scaleY: 1,
        alpha: 0,
        duration: 900,
        ease: 'Quad.easeOut',
        onComplete: () => ray.destroy()
      });
    }

    const colors = [0xff2d95, 0x00e5ff, 0xffe600, 0x7a2bff, 0xffffff];
    for (let i = 0; i < 120; i++) {
      const c = colors[i % colors.length];
      const p = this.add
        .rectangle(cx, cy - 20, 9 + Math.random() * 9, 7 + Math.random() * 9, c)
        .setDepth(45);
      const ang = Math.random() * Math.PI * 2;
      const spd = 160 + Math.random() * 420;
      this.tweens.add({
        targets: p,
        x: cx + Math.cos(ang) * spd,
        y: cy - 20 + Math.sin(ang) * spd + 260,
        angle: Math.random() * 900 - 450,
        alpha: { from: 1, to: 0 },
        duration: 900 + Math.random() * 700,
        ease: 'Cubic.easeOut',
        onComplete: () => p.destroy()
      });
    }

    const win = this.add
      .text(cx, cy - 40, 'YOU WIN!!', {
        fontFamily: 'monospace',
        fontSize: '128px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setLetterSpacing(6);
    win.setStroke('#ff2d95', 14);
    win.setScale(0.2);
    win.setAlpha(0);
    this.tweens.add({
      targets: win,
      scale: 1.12,
      alpha: 1,
      duration: 380,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: win, scale: 1, duration: 260 });
      }
    });

    const sub = this.add
      .text(cx, cy + 70, `${winnerChar.name} GANA`, {
        fontFamily: 'monospace',
        fontSize: '34px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0.5)
      .setDepth(50)
      .setLetterSpacing(4)
      .setAlpha(0);
    sub.setStroke('#0d0f16', 6);
    this.tweens.add({ targets: sub, alpha: 1, duration: 400, delay: 320 });

    this.tweens.add({
      targets: win,
      scale: 1.06,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
      delay: 700
    });
  }

  opponentOf(sprite) {
    return sprite === this.fighter1 ? this.fighter2 : this.fighter1;
  }

  punchHit(puncher) {
    const opp = this.opponentOf(puncher);
    const dir = puncher.mustFaceRight ? 1 : -1;
    const dx = opp.x - puncher.x;
    if (dx * dir > 0 && Math.abs(dx) <= PUNCH_REACH) {
      this.damageFighter(opp, PUNCH_DAMAGE);
    }
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

  applyBackflip(c, sprite) {
    if (sprite.texture.key !== c.backflipSheet) {
      sprite.setTexture(c.backflipSheet);
      sprite.setOrigin(0.5, c.backflipOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.backflipSourceH);
    }
    sprite.play(`${c.key}Backflip`);
  }

  applyKneelDown(c, sprite) {
    if (sprite.texture.key !== c.kneelSheet) {
      sprite.setTexture(c.kneelSheet);
      sprite.setOrigin(0.5, c.kneelOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.kneelSourceH);
    }
    sprite.play(`${c.key}KneelDown`);
  }

  applyKneelUp(c, sprite) {
    if (sprite.texture.key !== c.kneelSheet) {
      sprite.setTexture(c.kneelSheet);
      sprite.setOrigin(0.5, c.kneelOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.kneelSourceH);
    }
    sprite.play(`${c.key}KneelUp`);
  }

  applyPunch(c, sprite) {
    if (sprite.texture.key !== c.punchSheet) {
      sprite.setTexture(c.punchSheet);
      sprite.setOrigin(0.5, c.punchOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.punchSourceH);
    }
    sprite.play(`${c.key}Punch`);
    if (c.punchSound && this.sound.get(c.punchSound)) {
      this.sound.play(c.punchSound);
    }
  }

  applyTaunt(c, sprite) {
    if (sprite.texture.key !== c.tauntSheet) {
      sprite.setTexture(c.tauntSheet);
      sprite.setOrigin(0.5, c.tauntOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.tauntSourceH);
    }
    sprite.play(`${c.key}Taunt`);
  }

  playJumpArc(total = JUMP_DURATION_MS, opts = {}) {
    const sprite = this.walker;
    const c = this.walkChar;
    sprite.y = this.groundY;
    const amount =
      opts.lift != null
        ? opts.lift
        : c.jumpLift != null
        ? c.jumpLift
        : c.jumpArcInSheet
        ? 0
        : JUMP_LIFT;
    if (amount <= 0) {
      return;
    }
    const peakFrac =
      opts.peakFrac != null
        ? opts.peakFrac
        : c.jumpPeakFrac != null
        ? c.jumpPeakFrac
        : JUMP_UP_MS / JUMP_DURATION_MS;
    const landFrac =
      opts.landFrac != null ? opts.landFrac : c.jumpLandFrac != null ? c.jumpLandFrac : 1;
    const up = total * peakFrac;
    const down = Math.max(1, total * (landFrac - peakFrac));
    this.tweens.add({
      targets: sprite,
      y: this.groundY - amount,
      duration: up,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          y: this.groundY,
          duration: down,
          ease: 'Quad.easeIn'
        });
      }
    });
  }

  ensureParticleTexture() {
    if (this.textures.exists('spark')) {
      return;
    }
    const size = 64;
    const canvas = this.textures.createCanvas('spark', size, size);
    const ctx = canvas.getContext();
    const grd = ctx.createRadialGradient(
      size / 2, size / 2, 0,
      size / 2, size / 2, size / 2
    );
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(170,220,255,0.9)');
    grd.addColorStop(0.7, 'rgba(70,150,255,0.35)');
    grd.addColorStop(1, 'rgba(40,110,255,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, size, size);
    canvas.refresh();
  }

  playKamehameha() {
    this.kameActive = true;
    this.walkerMoving = false;

    const sprite = this.kamer;
    const dir = sprite.mustFaceRight ? 1 : -1;
    const handX = sprite.x + dir * 44;
    const handY = this.groundY - KAME_HAND_H;

    if (this.kameChar.specialSheet) {
      if (sprite.texture.key !== this.kameChar.specialSheet) {
        sprite.setTexture(this.kameChar.specialSheet);
        sprite.setOrigin(0.5, this.kameChar.specialOriginY);
        sprite.setScale(FIGHTER_TARGET_H / this.kameChar.specialSourceH);
      }
      sprite.play(`${this.kameChar.key}Special`);
    }

    if (this.kameChar.specialSound && this.sound.get(this.kameChar.specialSound)) {
      this.kameSfx = this.sound.get(this.kameChar.specialSound);
      this.kameSfx.play({
        seek: this.kameChar.specialSoundSeek || 0,
        rate: this.kameChar.specialSoundRate || 1
      });
    }

    const halo = this.add
      .circle(handX, handY, 12, KAME_OUTER, 0.6)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(21);
    const orb = this.add
      .circle(handX, handY, 12, KAME_CORE, 1)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(22);

    const rays = this.add.graphics().setDepth(21).setBlendMode(Phaser.BlendModes.ADD);
    rays.lineStyle(2, KAME_MID, 0.7);
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * Math.PI * 2;
      rays.lineBetween(0, 0, Math.cos(a) * 70, Math.sin(a) * 70);
    }
    rays.setPosition(handX, handY);
    this.tweens.add({ targets: rays, angle: 360, duration: 1400, repeat: -1 });

    this.tweens.add({ targets: halo, scale: 3, duration: KAME_CHARGE_MS, ease: 'Quad.easeIn' });
    this.tweens.add({ targets: orb, scale: 2, duration: KAME_CHARGE_MS, ease: 'Quad.easeIn' });

    const chargeEmitter = this.add
      .particles(handX, handY, 'spark', {
        lifespan: 350,
        speed: { min: 30, max: 90 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 0.9, end: 0 },
        blendMode: 'ADD',
        quantity: 5,
        frequency: 25,
        tint: [KAME_CORE, KAME_MID, KAME_OUTER]
      })
      .setDepth(23);

    this.cameras.main.shake(KAME_CHARGE_MS, 0.002);
    this.cameras.main.zoomTo(1.05, KAME_CHARGE_MS, 'Sine.easeInOut');

    this.time.delayedCall(KAME_CHARGE_MS, () => {
      chargeEmitter.destroy();
      this.fireKamehameha(handX, handY, dir, halo, orb, rays);
    });
  }

  fireKamehameha(handX, handY, dir, halo, orb, rays) {
    const length = dir === 1 ? this.scale.width - handX : handX;
    const layers = [
      { h: 110, color: KAME_OUTER, alpha: 0.4 },
      { h: 56, color: KAME_MID, alpha: 0.8 },
      { h: 20, color: KAME_CORE, alpha: 1 }
    ];
    const beams = layers.map((L, i) => {
      const r = this.add
        .rectangle(handX, handY, 100, L.h, L.color, L.alpha)
        .setOrigin(dir === 1 ? 0 : 1, 0.5)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setDepth(22)
        .setScale(0, 1);
      this.tweens.add({
        targets: r,
        scaleX: length / 100,
        duration: 110 + i * 40,
        ease: 'Quad.easeOut'
      });
      return r;
    });

    this.cameras.main.flash(180, 200, 230, 255);
    this.cameras.main.shake(KAME_FIRE_MS, 0.012);
    this.cameras.main.zoomTo(1.12, 120, 'Quad.easeOut');

    const beamEmitter = this.add
      .particles(handX, handY, 'spark', {
        lifespan: 260,
        speed: { min: 500, max: 1100 },
        angle: dir === 1 ? { min: -8, max: 8 } : { min: 172, max: 188 },
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        quantity: 8,
        frequency: 12,
        tint: [KAME_CORE, KAME_MID, KAME_OUTER]
      })
      .setDepth(23);

    rays.setScale(1.6);
    orb.setScale(2.6);

    const opp = this.kamer === this.fighter1 ? this.fighter2 : this.fighter1;
    const hits = (dir === 1 && opp.x > handX) || (dir === -1 && opp.x < handX);
    if (hits) {
      this.time.delayedCall(160, () => this.impactOpponent(opp, dir));
    }

    this.time.delayedCall(KAME_FIRE_MS, () => {
      beamEmitter.destroy();
      this.tweens.add({
        targets: beams,
        alpha: 0,
        duration: 220,
        onComplete: () => beams.forEach((b) => b.destroy())
      });
      this.tweens.add({
        targets: [orb, halo, rays],
        alpha: 0,
        duration: 220,
        onComplete: () => {
          orb.destroy();
          halo.destroy();
          rays.destroy();
        }
      });
      this.cameras.main.zoomTo(1, 260, 'Sine.easeInOut');
      this.time.delayedCall(300, () => {
        this.kameActive = false;
        this.applyIdle(this.kameChar, this.kamer);
      });
      this.time.delayedCall(
        300 + (this.kameChar.specialSoundTailMs || 1200),
        () => {
          if (this.kameSfx && this.kameSfx.isPlaying) {
            this.kameSfx.stop();
          }
        }
      );
    });
  }

  impactOpponent(opp, dir) {
    const burst = this.add
      .particles(opp.x, this.groundY - 150, 'spark', {
        lifespan: 500,
        speed: { min: 150, max: 450 },
        scale: { start: 1, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        tint: [KAME_CORE, KAME_MID, 0xffe600],
        emitting: false
      })
      .setDepth(23);
    burst.explode(40, opp.x, this.groundY - 150);
    this.time.delayedCall(700, () => burst.destroy());

    this.damageFighter(opp, KAME_DAMAGE);

    this.tweens.add({
      targets: opp,
      x: Phaser.Math.Clamp(opp.x + dir * 60, WALK_MIN_X, WALK_MAX_X),
      duration: 200,
      ease: 'Quad.easeOut'
    });
    this.cameras.main.shake(200, 0.008);
  }

  update(_, delta) {
    if (!this.controlsEnabled || !this.walker) {
      return;
    }

    this.resolveFighterCollision();

    if (this.kameActive) {
      return;
    }

    const dt = delta / 1000;
    const left = this.keys.A.isDown;
    const right = this.keys.D.isDown;

    if (this.kneelChar) {
      const sDown = this.keys.S.isDown;
      if (
        sDown &&
        !this.kneeling &&
        !this.kneelStanding &&
        !this.jumping &&
        !this.punching &&
        !this.taunting
      ) {
        this.kneeling = true;
        this.walkerMoving = false;
        this.applyKneelDown(this.kneelChar, this.kneeler);
      }
      if (this.kneeling) {
        if (!sDown && !this.kneelStanding) {
          this.kneelStanding = true;
          this.applyKneelUp(this.kneelChar, this.kneeler);
        }
        return;
      }
      if (this.kneelStanding) {
        return;
      }
    }

    if (this.jumping) {
      if (this.backflipActive) {
        this.walker.x = Phaser.Math.Clamp(
          this.walker.x + this.backflipDir * BACKFLIP_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
      } else if (left || right) {
        const dir = right ? 1 : -1;
        this.walker.x = Phaser.Math.Clamp(
          this.walker.x + dir * JUMP_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
      }
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      const facingRight = this.walker.mustFaceRight;
      const goingBack = (facingRight && left) || (!facingRight && right);

      if (this.walkChar.backflipSheet && goingBack) {
        this.jumping = true;
        this.backflipActive = true;
        this.backflipDir = right ? 1 : -1;
        this.walkerMoving = false;
        this.applyBackflip(this.walkChar, this.walker);
        this.playJumpArc(BACKFLIP_DURATION_MS, {
          lift: this.walkChar.backflipLift,
          peakFrac: this.walkChar.backflipPeakFrac,
          landFrac: this.walkChar.backflipLandFrac
        });
        this.time.delayedCall(
          BACKFLIP_DURATION_MS * (this.walkChar.backflipLandFrac || 0.639),
          () => {
            this.backflipActive = false;
          }
        );
        return;
      }

      if (this.walkChar.jumpSheet) {
        this.jumping = true;
        this.backflipActive = false;
        this.walkerMoving = false;
        this.applyJump(this.walkChar, this.walker);
        this.playJumpArc();
        return;
      }
    }

    if (
      this.punchChar &&
      Phaser.Input.Keyboard.JustDown(this.keys.F)
    ) {
      this.punching = true;
      this.applyPunch(this.punchChar, this.puncher);
      this.time.delayedCall(180, () => this.punchHit(this.puncher));
      return;
    }

    if (
      this.kameChar &&
      Phaser.Input.Keyboard.JustDown(this.keys.T)
    ) {
      this.playKamehameha();
      return;
    }

    if (
      this.tauntChar &&
      Phaser.Input.Keyboard.JustDown(this.keys.Q)
    ) {
      this.taunting = true;
      this.applyTaunt(this.tauntChar, this.taunter);
      return;
    }

    if (
      (this.punching && this.puncher === this.walker) ||
      (this.taunting && this.taunter === this.walker)
    ) {
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
