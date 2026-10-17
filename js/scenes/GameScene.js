const WALK_SPEED = 320;
const WALK_MIN_X = 100;
const WALK_MAX_X = 1180;
const FIGHTER_BODY_W = 110;
const FIGHTER_BODY_H = 300;
const JUMP_DURATION_MS = 750;
const JUMP_LIFT = 130;
const JUMP_UP_MS = 350;
const JUMP_DOWN_MS = 450;
const BACKFLIP_DURATION_MS = 900;
const BACKFLIP_SPEED = 360;
const JUMP_SPEED = 360;
const PUNCH_DURATION_MS = 700;
const PUNCH_HIT_MS = 160;
const KICK_DURATION_MS = 850;
const KICK_HIT_MS = 295;
const AIR_KICK_FALL_MS = 300;
const AIR_KICK_FALL_FRAC = 0.6;
const TAUNT_DURATION_MS = 900;
const DEATH_DURATION_MS = 1200;
const FIGHTER_MAX_HP = 100;
const PUNCH_DAMAGE = 20;
const KAME_DAMAGE = 20;
const PUNCH_REACH = 180;
const KAME_CHARGE_MS = 680;
const KAME_FIRE_MS = 450;
const SPECIAL_CHARGE_FRAMES = 14;
const KAME_HAND_H = 205;
const KAME_CORE = 0xffffff;
const KAME_MID = 0x66ccff;
const KAME_OUTER = 0x2a6bff;
const CANCEL_FRACTION = 0.72;
const KNOCKBACK_DISTANCE = 50;
const KNOCKBACK_MS = 200;
const BLOCK_KNOCKBACK = 18;
const HITSTUN_MS = 320;
const BLOCK_HITSTUN_MS = 180;
const BLOCK_DAMAGE_FACTOR = 0.35;

const HITBOXES = {
  idle: { w: 90, h: 280, ox: 0, oy: -280 },
  punch: { w: 100, h: 90, ox: 50, oy: -250 },
  kick: { w: 120, h: 80, ox: 55, oy: -150 },
  crouch: { w: 100, h: 160, ox: 0, oy: -160 }
};

const AI_SPEED = 160;
const AI_APPROACH_DIST = 350;
const AI_ATTACK_DIST = 155;
const AI_RETREAT_DIST = 95;
const AI_REACTION_MS = 320;
const AI_ATTACK_COOLDOWN_MS = 1400;
const AI_BLOCK_CHANCE = 0.3;
const AI_JUMP_CHANCE = 0.12;

const SPECIAL_MAX = 100;
const SPECIAL_CHARGE_RATE = 45;
const SPECIAL_CHARGE_ANIM_SCALE = 3;
const SPECIAL_BAR_W = 300;
const SPECIAL_BAR_H = 12;
const HEAL_RATE = 12;
const HEAL_ANIM_SCALE = 1.6;

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
      if (c.kickSheet) {
        this.load.spritesheet(c.kickSheet, c.kickSheetPath, {
          frameWidth: c.kickFrameW,
          frameHeight: c.kickFrameH
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
          frames: buildIdleFrames(this.anims, c),
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
      if (c.kickSheet && !this.anims.exists(`${c.key}Kick`)) {
        this.anims.create({
          key: `${c.key}Kick`,
          frames: this.anims.generateFrameNumbers(c.kickSheet, {
            start: 0,
            end: c.kickFrames - 1
          }),
          frameRate: c.kickFrames / (KICK_DURATION_MS / 1000),
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
          frameRate: c.deathFrames / ((c.deathMs || DEATH_DURATION_MS) / 1000),
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

    this.walkChar = p1.walkSheet || p1.jumpSheet ? p1 : null;
    this.walker = this.walkChar ? this.fighter1 : null;

    this.punchChar = p1.punchSheet ? p1 : null;
    this.puncher = this.punchChar ? this.fighter1 : null;

    this.tauntChar = p1.tauntSheet ? p1 : null;
    this.taunter = this.tauntChar ? this.fighter1 : null;

    const dc = p1.deathSheet ? p1 : p2.deathSheet ? p2 : null;
    this.deathChar = dc;
    this.deather = dc === p1 ? this.fighter1 : dc === p2 ? this.fighter2 : null;
    this.dead = false;
    this.gameOver = false;
    this.deathKey = this.deathChar ? `${this.deathChar.key}Death` : null;

    this.jumping = false;
    this.backflipActive = false;
    this.backflipDir = 1;
    this.jumpDir = 0;
    this.punching = false;
    this.taunting = false;
    this.kameActive = false;
    this.fightersColliding = false;
    this.jumpKey =
      this.walkChar && this.walkChar.jumpSheet ? `${this.walkChar.key}Jump` : null;
    this.backflipKey =
      this.walkChar && this.walkChar.backflipSheet
        ? `${this.walkChar.key}Backflip`
        : null;
    this.kneelChar =
      this.walkChar && this.walkChar.kneelSheet ? this.walkChar : null;
    this.kneeler = this.kneelChar ? this.walker : null;
    this.kneeling = false;
    this.kneelStanding = false;
    this.kneelDownKey = this.kneelChar ? `${this.kneelChar.key}KneelDown` : null;
    this.kneelUpKey = this.kneelChar ? `${this.kneelChar.key}KneelUp` : null;
    this.kickChar = this.walkChar && this.walkChar.kickSheet ? this.walkChar : null;
    this.kicker = this.kickChar ? this.walker : null;
    this.kicking = false;
    this.airKicking = false;
    this.airKickFalling = false;
    this.punchStartTime = null;
    this.kickKey = this.kickChar ? `${this.kickChar.key}Kick` : null;
    this.punchKey = this.punchChar ? `${this.punchChar.key}Punch` : null;
    this.tauntKey = this.tauntChar ? `${this.tauntChar.key}Taunt` : null;

    this.kameChar = p1.kamehameha ? p1 : null;
    this.kamer = this.kameChar ? this.fighter1 : null;

    this.specialCharge = 0;
    this.channel = null;
    this.channelAura = null;
    this.channelEmitter = null;

    this.ensureParticleTexture();

    this.health1 = FIGHTER_MAX_HP;
    this.health2 = FIGHTER_MAX_HP;
    this.createHealthBars(p1, p2);
    this.createSpecialBar();

    if (this.walker) {
      this.walker.on('animationcomplete', (anim) => {
        if (
          (anim.key === this.jumpKey || anim.key === this.backflipKey) &&
          this.jumping
        ) {
          this.jumping = false;
          this.backflipActive = false;
          this.jumpDir = 0;
          this.tweens.killTweensOf(this.walker);
          this.walker.y = this.groundY;
          this.applyIdle(this.walkChar, this.walker);
        }
        if (anim.key === this.kneelUpKey && this.kneelStanding) {
          this.kneelStanding = false;
          this.kneeling = false;
          this.applyIdle(this.kneelChar, this.kneeler);
        }
        if (anim.key === this.kickKey && this.kicking) {
          if (this.airKicking) {
            this.startAirKickFall();
          } else {
            this.kicking = false;
            this.jumping = false;
            this.backflipActive = false;
            this.tweens.killTweensOf(this.walker);
            this.walker.y = this.groundY;
            this.blendToIdle(this.kickChar, this.kicker);
          }
        }
      });
    }

    if (this.puncher) {
      this.puncher.on('animationcomplete', (anim) => {
        if (anim.key === this.punchKey && this.punching) {
          this.punching = false;
          this.blendToIdle(this.punchChar, this.puncher);
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

    this.ai = {
      state: 'idle',
      nextDecision: 0,
      attackCooldown: 0,
      aiPunching: false,
      aiKicking: false,
      aiJumping: false,
      aiBlocking: false
    };

    this.fighter2.on('animationcomplete', (anim) => {
      if (!this.ai) {
        return;
      }
      const p2 = this.p2Char;
      if (anim.key === `${p2.key}Punch` && this.ai.aiPunching) {
        this.ai.aiPunching = false;
        this.blendToIdle(p2, this.fighter2);
      }
      if (anim.key === `${p2.key}Kick` && this.ai.aiKicking) {
        this.ai.aiKicking = false;
        this.blendToIdle(p2, this.fighter2);
      }
      if (
        (anim.key === `${p2.key}Jump` || anim.key === `${p2.key}Backflip`) &&
        this.ai.aiJumping
      ) {
        this.ai.aiJumping = false;
        this.tweens.killTweensOf(this.fighter2);
        this.fighter2.y = this.groundY;
        this.applyIdle(p2, this.fighter2);
      }
    });

    this.keys = this.input.keyboard.addKeys('A,D,S,SPACE,F,T,Q,V');

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

  getHitbox(sprite, state = 'idle') {
    const box = HITBOXES[state] || HITBOXES.idle;
    const dir = sprite.mustFaceRight ? 1 : -1;
    return new Phaser.Geom.Rectangle(
      sprite.x + dir * box.ox - box.w / 2,
      sprite.y + box.oy,
      box.w,
      box.h
    );
  }

  hurtState(sprite) {
    if (sprite === this.kneeler && (this.kneeling || this.kneelStanding)) {
      return 'crouch';
    }
    return 'idle';
  }

  resolveFighterCollision() {
    if (this.dead) {
      this.fightersColliding = false;
      return;
    }
    const airborne =
      this.fighter1.y < this.groundY - 8 || this.fighter2.y < this.groundY - 8;
    if (airborne) {
      this.fightersColliding = false;
      return;
    }
    const a = this.getHitbox(this.fighter1, 'idle');
    const b = this.getHitbox(this.fighter2, 'idle');
    this.fightersColliding = Phaser.Geom.Intersects.RectangleToRectangle(a, b);
    if (!this.fightersColliding) {
      return;
    }

    const overlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
    const dir = this.fighter1.x <= this.fighter2.x ? 1 : -1;
    const total = overlap + 1;

    const room1 =
      dir === 1 ? this.fighter1.x - WALK_MIN_X : WALK_MAX_X - this.fighter1.x;
    const room2 =
      dir === 1 ? WALK_MAX_X - this.fighter2.x : this.fighter2.x - WALK_MIN_X;

    let p1 = total / 2;
    let p2 = total / 2;
    if (p1 > room1) {
      p2 += p1 - room1;
      p1 = room1;
    }
    if (p2 > room2) {
      p1 += p2 - room2;
      p2 = room2;
    }
    p1 = Phaser.Math.Clamp(p1, 0, room1);
    p2 = Phaser.Math.Clamp(p2, 0, room2);

    this.fighter1.x = Phaser.Math.Clamp(
      this.fighter1.x - dir * p1,
      WALK_MIN_X,
      WALK_MAX_X
    );
    this.fighter2.x = Phaser.Math.Clamp(
      this.fighter2.x + dir * p2,
      WALK_MIN_X,
      WALK_MAX_X
    );
  }

  updateFacing() {
    const dx = this.fighter2.x - this.fighter1.x;
    if (Math.abs(dx) < 6) {
      return;
    }
    const f1Right = dx > 0;
    this.setFacing(this.fighter1, this.p1Char, f1Right);
    this.setFacing(this.fighter2, this.p2Char, !f1Right);
  }

  setFacing(sprite, c, mustFaceRight) {
    if (sprite.mustFaceRight === mustFaceRight) {
      return;
    }
    sprite.mustFaceRight = mustFaceRight;
    sprite.setFlipX(c.facesRight !== mustFaceRight);
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

  createSpecialBar() {
    const x = 50;
    const y = 84;
    this.add
      .rectangle(x, y, SPECIAL_BAR_W, SPECIAL_BAR_H, 0x0d0f16)
      .setOrigin(0, 0.5)
      .setDepth(25);
    this.specialFill = this.add
      .rectangle(x + 2, y, SPECIAL_BAR_W - 4, SPECIAL_BAR_H - 4, 0x00e5ff)
      .setOrigin(0, 0.5)
      .setDepth(27);
    this.add
      .rectangle(x, y, SPECIAL_BAR_W, SPECIAL_BAR_H)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0, 0.5)
      .setDepth(28);
    this.add
      .text(x, y - 18, 'ESPECIAL (Q)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0, 0)
      .setDepth(28);
    this.updateSpecialBar();
  }

  updateSpecialBar() {
    const ratio = Phaser.Math.Clamp(this.specialCharge / SPECIAL_MAX, 0, 1);
    const w = Math.max(0, (SPECIAL_BAR_W - 4) * ratio);
    this.specialFill.setDisplaySize(w, SPECIAL_BAR_H - 4);
    this.specialFill.setFillStyle(
      this.specialCharge >= SPECIAL_MAX ? 0xffe600 : 0x00e5ff
    );
  }

  updateSpecial(delta, walkerStunned) {
    if (!this.kamer || this.gameOver || this.kameActive) {
      this.stopChannel();
      return;
    }

    const busy =
      this.kneeling ||
      this.kneelStanding ||
      this.jumping ||
      this.punching ||
      this.kicking ||
      this.taunting;
    const canChannel = !walkerStunned && !busy;

    const qDown =
      canChannel && this.keys.Q.isDown && this.specialCharge < SPECIAL_MAX;
    const vDown =
      canChannel && this.keys.V.isDown && this.health1 < FIGHTER_MAX_HP;

    let want = null;
    if (qDown) {
      want = 'special';
    } else if (vDown) {
      want = 'heal';
    }

    if (want !== this.channel) {
      if (want) {
        this.startChannel(want);
      } else {
        this.stopChannel();
      }
    }

    if (this.channel === 'special') {
      this.specialCharge = Math.min(
        SPECIAL_MAX,
        this.specialCharge + SPECIAL_CHARGE_RATE * (delta / 1000)
      );
      this.updateSpecialBar();
    } else if (this.channel === 'heal') {
      this.health1 = Math.min(
        FIGHTER_MAX_HP,
        this.health1 + HEAL_RATE * (delta / 1000)
      );
      this.updateHealthBars(true);
    }

    if (this.channel) {
      this.updateChannelVisual();
    }
  }

  startChannel(type) {
    this.stopChannel();
    this.channel = type;
    const s = this.kamer;
    if (s && s.anims) {
      s.anims.timeScale =
        type === 'special' ? SPECIAL_CHARGE_ANIM_SCALE : HEAL_ANIM_SCALE;
    }
    const color = type === 'special' ? 0x00e5ff : 0x3ddc6b;
    const x = s ? s.x : this.p1X;
    const y = this.groundY - 150;

    this.channelObjects = [];
    this.channelTweens = [];
    this.channelTimers = [];

    const emitter = this.add
      .particles(x, y, 'spark', {
        lifespan: 620,
        speed: { min: 20, max: 130 },
        angle: type === 'heal' ? { min: 250, max: 290 } : { min: 0, max: 360 },
        scale: { start: 0.6, end: 0 },
        alpha: { start: 0.85, end: 0 },
        blendMode: 'ADD',
        quantity: 4,
        frequency: 22,
        tint: [0xffffff, color, color],
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Rectangle(-45, -150, 90, 300)
        }
      })
      .setDepth(20);
    this.channelEmitter = emitter;
    this.channelObjects.push({ obj: emitter, dy: -150 });

    if (type === 'special') {
      this.buildSuperCharge(x, color);
    }
  }

  buildSuperCharge(x, color) {
    const feetY = this.groundY;
    const bodyY = feetY - 150;

    const glow = this.add
      .ellipse(x, bodyY, 170, 350, color, 0.3)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(17);
    this.channelObjects.push({ obj: glow, dy: -150 });
    this.channelTweens.push(
      this.tweens.add({
        targets: glow,
        scaleX: { from: 0.85, to: 1.18 },
        scaleY: { from: 0.92, to: 1.08 },
        alpha: { from: 0.45, to: 0.18 },
        duration: 240,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    );

    const column = this.add
      .rectangle(x, bodyY, 130, 340, color, 0.16)
      .setBlendMode(Phaser.BlendModes.ADD)
      .setDepth(16);
    this.channelObjects.push({ obj: column, dy: -150 });
    this.channelTweens.push(
      this.tweens.add({
        targets: column,
        scaleX: { from: 0.9, to: 1.12 },
        alpha: { from: 0.22, to: 0.1 },
        duration: 300,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      })
    );

    const rise = this.add
      .particles(x, feetY, 'spark', {
        lifespan: 850,
        speedY: { min: -640, max: -260 },
        speedX: { min: -90, max: 90 },
        scale: { start: 0.95, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        quantity: 7,
        frequency: 10,
        tint: [0xffffff, color],
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Rectangle(-75, -24, 150, 48)
        }
      })
      .setDepth(21);
    this.channelObjects.push({ obj: rise, dy: 0 });

    const crackle = this.add
      .particles(x, bodyY, 'spark', {
        lifespan: 220,
        speed: { min: 220, max: 520 },
        scale: { start: 0.5, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        quantity: 2,
        frequency: 55,
        tint: [0xffffff, 0xaaeaff],
        emitZone: {
          type: 'random',
          source: new Phaser.Geom.Rectangle(-55, -150, 110, 300)
        }
      })
      .setDepth(22);
    this.channelObjects.push({ obj: crackle, dy: -150 });

    this.channelTimers.push(
      this.time.addEvent({
        delay: 340,
        loop: true,
        callback: () => {
          const ring = this.add
            .ellipse(x, feetY - 6, 70, 24)
            .setStrokeStyle(4, color, 0.9)
            .setBlendMode(Phaser.BlendModes.ADD)
            .setDepth(18);
          this.tweens.add({
            targets: ring,
            scaleX: 3.4,
            scaleY: 3.4,
            alpha: 0,
            duration: 620,
            ease: 'Cubic.easeOut',
            onComplete: () => ring.destroy()
          });
        }
      })
    );

    if (this.cameras && this.cameras.main) {
      this.cameras.main.shake(420, 0.004);
      this.cameras.main.flash(180, 120, 220, 255);
    }
  }

  stopChannel() {
    if (!this.channel) {
      return;
    }
    const s = this.kamer;
    if (s && s.anims) {
      s.anims.timeScale = 1;
    }
    if (this.channelTimers) {
      this.channelTimers.forEach((t) => t.remove(false));
      this.channelTimers = [];
    }
    if (this.channelTweens) {
      this.channelTweens.forEach((t) => t.stop());
      this.channelTweens = [];
    }
    if (this.channelObjects) {
      this.channelObjects.forEach((e) => {
        if (e.obj && e.obj.destroy) {
          e.obj.destroy();
        }
      });
      this.channelObjects = [];
    }
    this.channelEmitter = null;
    this.channel = null;
  }

  updateChannelVisual() {
    const s = this.kamer;
    if (!s || !this.channelObjects) {
      return;
    }
    this.channelObjects.forEach((e) => {
      if (e.obj && e.obj.setPosition) {
        e.obj.setPosition(s.x, this.groundY + e.dy);
      }
    });
  }

  isBlocking(sprite) {
    if (sprite === this.fighter2 && this.ai && this.ai.aiBlocking) {
      return true;
    }
    if (!this.controlsEnabled || sprite !== this.walker || !this.keys) {
      return false;
    }
    return sprite.mustFaceRight ? this.keys.A.isDown : this.keys.D.isDown;
  }

  isInHitstun(sprite) {
    return (
      !!sprite && sprite.hitstunUntil != null && this.time.now < sprite.hitstunUntil
    );
  }

  hitDirection(sprite, attacker) {
    if (attacker && attacker !== sprite) {
      const d = Math.sign(sprite.x - attacker.x);
      if (d !== 0) {
        return d;
      }
      return attacker.mustFaceRight ? 1 : -1;
    }
    return sprite.mustFaceRight ? -1 : 1;
  }

  applyKnockback(sprite, dir, distance) {
    if (!dir || !distance) {
      return;
    }
    const target = Phaser.Math.Clamp(
      sprite.x + dir * distance,
      WALK_MIN_X,
      WALK_MAX_X
    );
    this.tweens.add({
      targets: sprite,
      x: target,
      duration: KNOCKBACK_MS,
      ease: 'Quad.easeOut'
    });
  }

  flashHit(sprite, blocking) {
    sprite.setTintFill(blocking ? 0x66ccff : 0xffffff);
    this.time.delayedCall(blocking ? 120 : 140, () => sprite.clearTint());
  }

  squashHit(sprite) {
    const baseX = sprite.scaleX;
    const baseY = sprite.scaleY;
    this.tweens.add({
      targets: sprite,
      scaleX: baseX * 1.04,
      scaleY: baseY * 0.93,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut'
    });
  }

  blendToIdle(c, sprite) {
    this.applyIdle(c, sprite);
    const baseX = sprite.scaleX;
    const baseY = sprite.scaleY;
    sprite.setScale(baseX * 1.03, baseY * 0.97);
    this.tweens.add({
      targets: sprite,
      scaleX: baseX,
      scaleY: baseY,
      duration: 150,
      ease: 'Quad.easeOut'
    });
  }

  damageFighter(sprite, amount, attacker) {
    const isP1 = sprite === this.fighter1;
    const blocking = this.isBlocking(sprite);
    const dmg = blocking
      ? Math.max(1, Math.round(amount * BLOCK_DAMAGE_FACTOR))
      : amount;

    if (isP1) {
      this.health1 = Math.max(0, this.health1 - dmg);
    } else {
      this.health2 = Math.max(0, this.health2 - dmg);
    }
    const hp = isP1 ? this.health1 : this.health2;

    this.applyKnockback(
      sprite,
      this.hitDirection(sprite, attacker),
      blocking ? BLOCK_KNOCKBACK : KNOCKBACK_DISTANCE
    );
    sprite.hitstunUntil =
      this.time.now + (blocking ? BLOCK_HITSTUN_MS : HITSTUN_MS);
    this.flashHit(sprite, blocking);
    this.squashHit(sprite);
    if (this.cameras && this.cameras.main) {
      this.cameras.main.shake(150, blocking ? 0.003 : 0.006);
    }
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
    const loserChar = loser === this.fighter1 ? this.p1Char : this.p2Char;
    const delay = loser === this.deather ? loser.deathMs || DEATH_DURATION_MS : 500;
    this.time.delayedCall(delay, () => {
      this.showWin(winnerChar);
      if (loserChar.key === 'rafa') {
        this.time.delayedCall(2600, () => {
          this.scene.start('DefeatScene', { winner: winnerChar.name });
        });
      }
    });
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
    const hit = this.getHitbox(puncher, 'punch');
    const hurt = this.getHitbox(opp, this.hurtState(opp));
    if (Phaser.Geom.Intersects.RectangleToRectangle(hit, hurt)) {
      this.damageFighter(opp, PUNCH_DAMAGE, puncher);
    }
  }

  kickHit(kicker) {
    const opp = this.opponentOf(kicker);
    const hit = this.getHitbox(kicker, 'kick');
    const hurt = this.getHitbox(opp, this.hurtState(opp));
    if (Phaser.Geom.Intersects.RectangleToRectangle(hit, hurt)) {
      this.damageFighter(opp, PUNCH_DAMAGE, kicker);
    }
  }

  updateAI(delta) {
    if (
      !this.controlsEnabled ||
      this.gameOver ||
      this.kameActive ||
      !this.ai ||
      !this.fighter2
    ) {
      return;
    }
    const ai = this.ai;
    const f2 = this.fighter2;
    const f1 = this.fighter1;
    const p2 = this.p2Char;

    if (this.isInHitstun(f2)) {
      return;
    }
    if (ai.aiPunching || ai.aiKicking || ai.aiJumping) {
      return;
    }

    const now = this.time.now;
    const dt = delta / 1000;
    const dx = f1.x - f2.x;
    const dist = Math.abs(dx);
    const toward = dx < 0 ? -1 : 1;

    ai.aiBlocking = false;

    if (now >= ai.nextDecision) {
      const attackReady = now >= ai.attackCooldown;
      const playerAttacking = this.punching || this.kicking || this.taunting;

      if (playerAttacking && Math.random() < AI_BLOCK_CHANCE) {
        ai.state = 'block';
        ai.nextDecision = now + 200 + Math.random() * 150;
      } else if (dist <= AI_ATTACK_DIST && attackReady) {
        ai.state = 'attack';
        ai.nextDecision = now + AI_REACTION_MS + Math.random() * 200;
      } else if (dist < AI_RETREAT_DIST) {
        ai.state = 'retreat';
        ai.nextDecision = now + 300 + Math.random() * 250;
      } else if (dist > AI_APPROACH_DIST) {
        ai.state = 'approach';
        ai.nextDecision = now + 350 + Math.random() * 350;
      } else if (p2.jumpSheet && Math.random() < AI_JUMP_CHANCE) {
        ai.state = 'jump';
        ai.nextDecision = now + JUMP_DURATION_MS + 250;
      } else {
        ai.state = Math.random() < 0.5 ? 'approach' : 'idle';
        ai.nextDecision = now + 300 + Math.random() * 350;
      }
    }

    switch (ai.state) {
      case 'approach': {
        f2.x = Phaser.Math.Clamp(
          f2.x + toward * AI_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
        this.aiWalk(p2, f2, toward);
        if (dist <= AI_ATTACK_DIST) {
          ai.state = 'idle';
          this.applyIdle(p2, f2);
        }
        break;
      }
      case 'retreat': {
        f2.x = Phaser.Math.Clamp(
          f2.x - toward * AI_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
        this.aiWalk(p2, f2, -toward);
        break;
      }
      case 'block': {
        f2.x = Phaser.Math.Clamp(
          f2.x - toward * AI_SPEED * 0.4 * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
        ai.aiBlocking = true;
        this.aiWalk(p2, f2, -toward);
        break;
      }
      case 'attack': {
        if (dist <= AI_ATTACK_DIST + 45 && now >= ai.attackCooldown) {
          if (p2.kickSheet && p2.punchSheet) {
            if (Math.random() < 0.6) {
              this.aiDoPunch();
            } else {
              this.aiDoKick();
            }
          } else if (p2.punchSheet) {
            this.aiDoPunch();
          } else if (p2.kickSheet) {
            this.aiDoKick();
          } else {
            this.applyIdle(p2, f2);
          }
          ai.attackCooldown = now + AI_ATTACK_COOLDOWN_MS + Math.random() * 700;
          ai.state = 'idle';
        } else {
          f2.x = Phaser.Math.Clamp(
            f2.x + toward * AI_SPEED * dt,
            WALK_MIN_X,
            WALK_MAX_X
          );
          this.aiWalk(p2, f2, toward);
        }
        break;
      }
      case 'jump': {
        if (p2.backflipSheet && Math.random() < 0.4) {
          this.aiDoBackflip(toward);
        } else {
          this.aiDoJump(toward);
        }
        break;
      }
      case 'idle':
      default:
        this.applyIdle(p2, f2);
        break;
    }
  }

  aiWalk(p2, f2, dir) {
    if (!p2.walkSheet) {
      return;
    }
    const forward = dir === 1 ? f2.mustFaceRight : !f2.mustFaceRight;
    this.applyWalk(p2, f2, forward);
  }

  aiHit(attacker, state) {
    const opp = this.fighter1;
    const hit = this.getHitbox(attacker, state);
    const hurt = this.getHitbox(opp, this.hurtState(opp));
    if (Phaser.Geom.Intersects.RectangleToRectangle(hit, hurt)) {
      this.damageFighter(opp, PUNCH_DAMAGE, attacker);
    }
  }

  aiDoPunch() {
    const p2 = this.p2Char;
    const f2 = this.fighter2;
    if (!p2.punchSheet) {
      return;
    }
    this.ai.aiPunching = true;
    this.ai.aiBlocking = false;
    if (f2.texture.key !== p2.punchSheet) {
      f2.setTexture(p2.punchSheet);
      f2.setOrigin(0.5, p2.punchOriginY);
      f2.setScale(FIGHTER_TARGET_H / p2.punchSourceH);
    }
    f2.play(`${p2.key}Punch`);
    if (p2.punchSound && this.sound.get(p2.punchSound)) {
      this.sound.play(p2.punchSound);
    }
    this.time.delayedCall(PUNCH_HIT_MS, () => this.aiHit(f2, 'punch'));
  }

  aiDoKick() {
    const p2 = this.p2Char;
    const f2 = this.fighter2;
    if (!p2.kickSheet) {
      return;
    }
    this.ai.aiKicking = true;
    this.ai.aiBlocking = false;
    if (f2.texture.key !== p2.kickSheet) {
      f2.setTexture(p2.kickSheet);
      f2.setOrigin(0.5, p2.kickOriginY);
      f2.setScale(FIGHTER_TARGET_H / p2.kickSourceH);
    }
    f2.play(`${p2.key}Kick`);
    this.time.delayedCall(KICK_HIT_MS, () => this.aiHit(f2, 'kick'));
  }

  aiDoJump(toward) {
    const p2 = this.p2Char;
    const f2 = this.fighter2;
    if (!p2.jumpSheet) {
      this.applyIdle(p2, f2);
      return;
    }
    this.ai.aiJumping = true;
    this.ai.aiBlocking = false;
    if (f2.texture.key !== p2.jumpSheet) {
      f2.setTexture(p2.jumpSheet);
      f2.setOrigin(0.5, p2.jumpOriginY);
      f2.setScale(FIGHTER_TARGET_H / p2.jumpSourceH);
    }
    f2.play(`${p2.key}Jump`);
    const lift = p2.jumpLift != null ? p2.jumpLift : JUMP_LIFT;
    const peak = p2.jumpPeakFrac != null ? p2.jumpPeakFrac : 0.45;
    const land = p2.jumpLandFrac != null ? p2.jumpLandFrac : 1;
    f2.y = this.groundY;
    this.tweens.add({
      targets: f2,
      y: this.groundY - lift,
      duration: JUMP_DURATION_MS * peak,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: f2,
          y: this.groundY,
          duration: Math.max(1, JUMP_DURATION_MS * (land - peak)),
          ease: 'Quad.easeIn'
        });
      }
    });
    this.tweens.add({
      targets: f2,
      x: Phaser.Math.Clamp(f2.x - toward * 120, WALK_MIN_X, WALK_MAX_X),
      duration: JUMP_DURATION_MS,
      ease: 'Linear'
    });
  }

  aiDoBackflip(toward) {
    const p2 = this.p2Char;
    const f2 = this.fighter2;
    if (!p2.backflipSheet) {
      this.aiDoJump(toward);
      return;
    }
    this.ai.aiJumping = true;
    this.ai.aiBlocking = false;
    if (f2.texture.key !== p2.backflipSheet) {
      f2.setTexture(p2.backflipSheet);
      f2.setOrigin(0.5, p2.backflipOriginY);
      f2.setScale(FIGHTER_TARGET_H / p2.backflipSourceH);
    }
    f2.play(`${p2.key}Backflip`);
    const lift = p2.backflipLift != null ? p2.backflipLift : JUMP_LIFT;
    const peak = p2.backflipPeakFrac != null ? p2.backflipPeakFrac : 0.45;
    const land = p2.backflipLandFrac != null ? p2.backflipLandFrac : 1;
    f2.y = this.groundY;
    this.tweens.add({
      targets: f2,
      y: this.groundY - lift,
      duration: BACKFLIP_DURATION_MS * peak,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: f2,
          y: this.groundY,
          duration: Math.max(1, BACKFLIP_DURATION_MS * (land - peak)),
          ease: 'Quad.easeIn'
        });
      }
    });
    this.tweens.add({
      targets: f2,
      x: Phaser.Math.Clamp(f2.x - toward * 150, WALK_MIN_X, WALK_MAX_X),
      duration: BACKFLIP_DURATION_MS,
      ease: 'Quad.easeOut'
    });
  }

  startAirKickFall() {
    if (!this.airKicking || this.airKickFalling) {
      return;
    }
    this.airKickFalling = true;
    this.tweens.killTweensOf(this.walker);
    this.tweens.add({
      targets: this.walker,
      y: this.groundY,
      duration: AIR_KICK_FALL_MS,
      ease: 'Sine.easeIn',
      onComplete: () => {
        this.airKicking = false;
        this.airKickFalling = false;
        this.kicking = false;
        this.jumping = false;
        this.backflipActive = false;
        this.jumpDir = 0;
        this.blendToIdle(this.kickChar, this.kicker);
      }
    });
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

  applyKick(c, sprite) {
    if (sprite.texture.key !== c.kickSheet) {
      sprite.setTexture(c.kickSheet);
      sprite.setOrigin(0.5, c.kickOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.kickSourceH);
    }
    sprite.play(`${c.key}Kick`);
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
    this.punching = false;
    this.taunting = false;

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

    try {
      if (this.kameChar.specialSound && this.sound.get(this.kameChar.specialSound)) {
        this.kameSfx = this.sound.get(this.kameChar.specialSound);
        this.kameSfx.play({
          seek: this.kameChar.specialSoundSeek || 0,
          rate: this.kameChar.specialSoundRate || 1
        });
      }
    } catch (e) {
      this.kameSfx = null;
    }
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

    this.damageFighter(opp, KAME_DAMAGE, this.kamer);

    this.cameras.main.shake(200, 0.008);
  }

  update(_, delta) {
    if (!this.controlsEnabled) {
      return;
    }

    this.resolveFighterCollision();
    this.updateFacing();
    this.updateAI(delta);

    if (!this.walker || this.kameActive) {
      return;
    }

    const dt = delta / 1000;
    const walkerStunned = this.isInHitstun(this.walker);
    const puncherStunned = this.puncher ? this.isInHitstun(this.puncher) : false;
    const taunterStunned = this.taunter ? this.isInHitstun(this.taunter) : false;
    const kamerStunned = this.kamer ? this.isInHitstun(this.kamer) : false;

    this.updateSpecial(delta, walkerStunned);
    if (this.channel) {
      return;
    }

    const left = !walkerStunned && this.keys.A.isDown;
    const right = !walkerStunned && this.keys.D.isDown;

    const punchOpen =
      !this.punching ||
      this.punchStartTime == null ||
      this.time.now - this.punchStartTime >= PUNCH_DURATION_MS * CANCEL_FRACTION;
    const walkerBusy =
      this.punching && this.puncher === this.walker && !punchOpen;

    if (this.kneelChar) {
      const sDown = !walkerStunned && this.keys.S.isDown;
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
      } else if (this.jumpDir) {
        this.walker.x = Phaser.Math.Clamp(
          this.walker.x + this.jumpDir * JUMP_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
      }
      if (
        this.kickChar &&
        !this.kicking &&
        !this.airKicking &&
        !walkerStunned &&
        Phaser.Input.Keyboard.JustDown(this.keys.F)
      ) {
        this.kicking = true;
        this.airKicking = true;
        this.tweens.killTweensOf(this.walker);
        this.applyKick(this.kickChar, this.kicker);
        this.time.delayedCall(KICK_HIT_MS, () => this.kickHit(this.kicker));
        this.time.delayedCall(
          KICK_DURATION_MS * AIR_KICK_FALL_FRAC,
          () => this.startAirKickFall()
        );
      }
      return;
    }

    if (
      !walkerStunned &&
      !walkerBusy &&
      Phaser.Input.Keyboard.JustDown(this.keys.SPACE)
    ) {
      const facingRight = this.walker.mustFaceRight;
      const goingBack = (facingRight && left) || (!facingRight && right);

      if (this.walkChar.backflipSheet && goingBack) {
        this.punching = false;
        this.taunting = false;
        this.jumping = true;
        this.backflipActive = true;
        this.jumpDir = 0;
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
        this.punching = false;
        this.taunting = false;
        this.jumping = true;
        this.backflipActive = false;
        this.jumpDir = right ? 1 : left ? -1 : 0;
        this.walkerMoving = false;
        this.applyJump(this.walkChar, this.walker);
        this.playJumpArc();
        return;
      }
    }

    if (
      this.punchChar &&
      !puncherStunned &&
      punchOpen &&
      Phaser.Input.Keyboard.JustDown(this.keys.F)
    ) {
      this.punching = true;
      this.punchStartTime = this.time.now;
      this.applyPunch(this.punchChar, this.puncher);
      this.time.delayedCall(PUNCH_HIT_MS, () => this.punchHit(this.puncher));
      return;
    }

    if (
      this.kameChar &&
      !kamerStunned &&
      Phaser.Input.Keyboard.JustDown(this.keys.T)
    ) {
      if (this.specialCharge >= SPECIAL_MAX) {
        this.specialCharge = 0;
        this.updateSpecialBar();
        this.stopChannel();
        this.playKamehameha();
      }
      return;
    }

    if (walkerBusy || (this.taunting && this.taunter === this.walker)) {
      return;
    }

    const moving = left || right;

    if (moving) {
      if (this.punching && this.puncher === this.walker) {
        this.punching = false;
      }
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
