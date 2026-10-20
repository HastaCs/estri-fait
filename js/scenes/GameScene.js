const WALK_SPEED = 320;
const WORLD_PAD = 340;
const WALK_MIN_X = -WORLD_PAD + 80;
const WALK_MAX_X = 1280 + WORLD_PAD - 80;
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
const GUARD_RANGE = 220;
const HITSTOP_MS = 60;
const BLOCK_HITSTOP_MS = 35;
const LIGHT_KNOCKBACK = 34;
const CHARGE_SFX_MAX = 0.7;
const CHARGE_SFX_RAMP_MS = 600;
const CHARGE_SFX_FADE_MS = 300;

const HITBOXES = {
  idle: { w: 90, h: 280, ox: 0, oy: -280 },
  punch: { w: 100, h: 90, ox: 50, oy: -250 },
  transformPunch: { w: 200, h: 90, ox: 100, oy: -250 },
  kick: { w: 120, h: 80, ox: 55, oy: -150 },
  crouch: { w: 100, h: 160, ox: 0, oy: -160 }
};

const HIT_FX = {
  sheet: 'hitFxSheet',
  path: 'assets/hits/hit_sheet.png',
  frameW: 472,
  frameH: 497,
  frameRate: 18,
  targetH: 200,
  colors: [
    'hitWhite',
    'hitYellow',
    'hitOrange',
    'hitRed',
    'hitCyan',
    'hitMagenta',
    'hitGreen'
  ]
};

const HIT_SOUNDS = ['punch1Sfx', 'punch2Sfx'];

const TEST_P2_JORGE = true;
const TEST_P2_TRANSFORM = false;
const TEST_NO_DAMAGE = true;
const TEST_AUTO_GUARD = true;

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
const CAT_TARGET_H = 110;
const CAT_SPEED = 620;
const CAT_INTRO_MS = 1500;
const CAMEL_DASH_MS = 1000;

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  init(data) {
    this.startData = data || {};
    this.bgIndex = this.startData.bg != null ? this.startData.bg : 0;
    const i1 = this.startData.p1 != null ? this.startData.p1 : 0;
    const i2 = TEST_P2_JORGE
      ? CHARACTERS.findIndex((c) => c.key === 'jorge')
      : TEST_P2_TRANSFORM
      ? CHARACTERS.findIndex((c) => c.key === 'agustin')
      : this.startData.p2 != null
      ? this.startData.p2
      : 1;
    this.p2Index = i2;
    this.fighterChars =
      i1 === i2 ? [CHARACTERS[i1]] : [CHARACTERS[i1], CHARACTERS[i2]];
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
    if (!this.textures.exists(HIT_FX.sheet)) {
      this.load.spritesheet(HIT_FX.sheet, HIT_FX.path, {
        frameWidth: HIT_FX.frameW,
        frameHeight: HIT_FX.frameH
      });
    }
    if (!this.cache.audio.exists('punch1Sfx')) {
      this.load.audio('punch1Sfx', 'assets/hits/punch1.mp3');
    }
    if (!this.cache.audio.exists('punch2Sfx')) {
      this.load.audio('punch2Sfx', 'assets/hits/punch2.mp3');
    }
    this.fighterChars.forEach((c) => {
      if (!this.textures.exists(c.sheet)) {
        this.load.spritesheet(c.sheet, c.sheetPath, {
          frameWidth: c.frameW,
          frameHeight: c.frameH
        });
      }
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
      if (c.jumpForwardSheet) {
        this.load.spritesheet(c.jumpForwardSheet, c.jumpForwardSheetPath, {
          frameWidth: c.jumpForwardFrameW,
          frameHeight: c.jumpForwardFrameH
        });
      }
      if (c.guardSheet) {
        this.load.spritesheet(c.guardSheet, c.guardSheetPath, {
          frameWidth: c.guardFrameW,
          frameHeight: c.guardFrameH
        });
      }
      if (c.hitSheet) {
        this.load.spritesheet(c.hitSheet, c.hitSheetPath, {
          frameWidth: c.hitFrameW,
          frameHeight: c.hitFrameH
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
      if (c.transformSheet && !this.textures.exists(c.transformSheet)) {
        this.load.spritesheet(c.transformSheet, c.transformSheetPath, {
          frameWidth: c.transformFrameW,
          frameHeight: c.transformFrameH
        });
      }
      if (c.transformPunchSheet && !this.textures.exists(c.transformPunchSheet)) {
        this.load.spritesheet(c.transformPunchSheet, c.transformPunchSheetPath, {
          frameWidth: c.transformPunchFrameW,
          frameHeight: c.transformPunchFrameH
        });
      }
      if (
        c.transformPunchLeftSheet &&
        !this.textures.exists(c.transformPunchLeftSheet)
      ) {
        this.load.spritesheet(
          c.transformPunchLeftSheet,
          c.transformPunchLeftSheetPath,
          {
            frameWidth: c.transformPunchLeftFrameW,
            frameHeight: c.transformPunchLeftFrameH
          }
        );
      }
      if (c.transformJumpSheet && !this.textures.exists(c.transformJumpSheet)) {
        this.load.spritesheet(c.transformJumpSheet, c.transformJumpSheetPath, {
          frameWidth: c.transformJumpFrameW,
          frameHeight: c.transformJumpFrameH
        });
      }
      if (c.transformKickSheet && !this.textures.exists(c.transformKickSheet)) {
        this.load.spritesheet(c.transformKickSheet, c.transformKickSheetPath, {
          frameWidth: c.transformKickFrameW,
          frameHeight: c.transformKickFrameH
        });
      }
      if (c.transformRunSheet && !this.textures.exists(c.transformRunSheet)) {
        this.load.spritesheet(c.transformRunSheet, c.transformRunSheetPath, {
          frameWidth: c.transformRunFrameW,
          frameHeight: c.transformRunFrameH
        });
      }
      if (c.transformGuardSheet && !this.textures.exists(c.transformGuardSheet)) {
        this.load.spritesheet(
          c.transformGuardSheet,
          c.transformGuardSheetPath,
          {
            frameWidth: c.transformGuardFrameW,
            frameHeight: c.transformGuardFrameH
          }
        );
      }
      if (c.transformWalkSheet && !this.textures.exists(c.transformWalkSheet)) {
        this.load.spritesheet(
          c.transformWalkSheet,
          c.transformWalkSheetPath,
          {
            frameWidth: c.transformWalkFrameW,
            frameHeight: c.transformWalkFrameH
          }
        );
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
      if (c.gabiSheet && !this.textures.exists(c.gabiSheet)) {
        this.load.spritesheet(c.gabiSheet, c.gabiSheetPath, {
          frameWidth: c.gabiFrameW,
          frameHeight: c.gabiFrameH
        });
      }
      if (c.gabiInvocation && !this.textures.exists(c.gabiInvocation)) {
        this.load.image(c.gabiInvocation, c.gabiInvocationPath);
      }
      if (c.specialInvocation && !this.textures.exists(c.specialInvocation)) {
        this.load.image(c.specialInvocation, c.specialInvocationPath);
      }
      if (c.gabiSound && !this.cache.audio.exists(c.gabiSound)) {
        this.load.audio(c.gabiSound, c.gabiSoundPath);
      }
      if (c.chargeSound && !this.cache.audio.exists(c.chargeSound)) {
        this.load.audio(c.chargeSound, c.chargeSoundPath);
      }
      if (c.chargeSheet && !this.textures.exists(c.chargeSheet)) {
        this.load.spritesheet(c.chargeSheet, c.chargeSheetPath, {
          frameWidth: c.chargeFrameW,
          frameHeight: c.chargeFrameH
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
    this.testP2Guard = false;
    this.testGuardNext = 0;
    this.hitstopUntil = 0;
    if (this.tweens) {
      this.tweens.timeScale = 1;
    }
    if (this.anims) {
      this.anims.globalTimeScale = 1;
    }

    const p1 = CHARACTERS[data && data.p1 != null ? data.p1 : 0];
    const p2 = CHARACTERS[
      this.p2Index != null
        ? this.p2Index
        : data && data.p2 != null
        ? data.p2
        : 1
    ];
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

    HIT_FX.colors.forEach((key, i) => {
      if (!this.anims.exists(key)) {
        this.anims.create({
          key,
          frames: this.anims.generateFrameNumbers(HIT_FX.sheet, {
            frames: [i * 2, i * 2 + 1]
          }),
          frameRate: HIT_FX.frameRate,
          repeat: 0
        });
      }
    });

    this.fighterChars.forEach((c) => {
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
        const jumpDur = c.jumpDurationMs || JUMP_DURATION_MS;
        this.anims.create({
          key: `${c.key}Jump`,
          frames: this.anims.generateFrameNumbers(c.jumpSheet, {
            start: 0,
            end: c.jumpFrames - 1
          }),
          frameRate: c.jumpFrameRate || c.jumpFrames / (jumpDur / 1000),
          repeat: 0
        });
      }
      if (c.jumpForwardSheet && !this.anims.exists(`${c.key}JumpForward`)) {
        const jumpDur = c.jumpDurationMs || JUMP_DURATION_MS;
        this.anims.create({
          key: `${c.key}JumpForward`,
          frames: this.anims.generateFrameNumbers(c.jumpForwardSheet, {
            start: 0,
            end: c.jumpForwardFrames - 1
          }),
          frameRate: c.jumpForwardFrameRate || c.jumpForwardFrames / (jumpDur / 1000),
          repeat: 0
        });
      }
      if (c.guardSheet && !this.anims.exists(`${c.key}Guard`)) {
        const holdStart = c.guardHoldStart != null ? c.guardHoldStart : 0;
        const holdEnd = c.guardHoldEnd != null ? c.guardHoldEnd : c.guardFrames - 1;
        this.anims.create({
          key: `${c.key}Guard`,
          frames: this.anims.generateFrameNumbers(c.guardSheet, {
            start: 0,
            end: holdStart
          }),
          frameRate: c.guardUpFrameRate || 30,
          repeat: 0
        });
        this.anims.create({
          key: `${c.key}GuardHold`,
          frames: this.anims.generateFrameNumbers(c.guardSheet, {
            start: holdStart,
            end: holdEnd
          }),
          frameRate: c.guardHoldFrameRate || 10,
          repeat: -1,
          yoyo: true
        });
        this.anims.create({
          key: `${c.key}GuardDown`,
          frames: this.anims.generateFrameNumbers(c.guardSheet, {
            start: holdEnd,
            end: c.guardFrames - 1
          }),
          frameRate: c.guardDownFrameRate || 20,
          repeat: 0
        });
      }
      if (
        c.transformGuardSheet &&
        !this.anims.exists(`${c.key}TransformGuard`)
      ) {
        const holdStart =
          c.transformGuardHoldStart != null ? c.transformGuardHoldStart : 0;
        const holdEnd =
          c.transformGuardHoldEnd != null
            ? c.transformGuardHoldEnd
            : c.transformGuardFrames - 1;
        this.anims.create({
          key: `${c.key}TransformGuard`,
          frames: this.anims.generateFrameNumbers(c.transformGuardSheet, {
            start: 0,
            end: holdStart
          }),
          frameRate: c.transformGuardUpFrameRate || 40,
          repeat: 0
        });
        this.anims.create({
          key: `${c.key}TransformGuardHold`,
          frames: this.anims.generateFrameNumbers(c.transformGuardSheet, {
            start: holdStart,
            end: holdEnd
          }),
          frameRate: c.transformGuardHoldFrameRate || 8,
          repeat: -1,
          yoyo: true
        });
        const downFrames = [];
        for (let f = holdStart; f >= 0; f--) {
          downFrames.push(f);
        }
        this.anims.create({
          key: `${c.key}TransformGuardDown`,
          frames: this.anims.generateFrameNumbers(c.transformGuardSheet, {
            frames: downFrames
          }),
          frameRate: c.transformGuardDownFrameRate || 40,
          repeat: 0
        });
      }
      if (c.transformWalkSheet && !this.anims.exists(`${c.key}TransformWalk`)) {
        const walkFrames = [];
        for (let f = c.transformWalkFrames - 1; f >= 0; f--) {
          walkFrames.push(f);
        }
        this.anims.create({
          key: `${c.key}TransformWalk`,
          frames: this.anims.generateFrameNumbers(c.transformWalkSheet, {
            frames: walkFrames
          }),
          frameRate: c.transformWalkFrameRate || 16,
          repeat: -1
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
      if (c.transformSheet && !this.anims.exists(`${c.key}TransformIdle`)) {
        this.anims.create({
          key: `${c.key}TransformIdle`,
          frames: this.anims.generateFrameNumbers(c.transformSheet, {
            start: 0,
            end: c.transformFrames - 1
          }),
          frameRate: c.transformIdleFrameRate || 20,
          repeat: -1
        });
      }
      if (c.gabiSound && !this.sound.get(c.gabiSound)) {
        this.sound.add(c.gabiSound, { volume: 0.8 });
      }
      if (c.chargeSound && !this.sound.get(c.chargeSound)) {
        this.sound.add(c.chargeSound, { loop: true, volume: 0 });
      }
      if (c.gabiSheet && !this.anims.exists(`${c.key}Gabi`)) {
        this.anims.create({
          key: `${c.key}Gabi`,
          frames: this.anims.generateFrameNumbers(c.gabiSheet, {
            start: 0,
            end: c.gabiFrames - 1
          }),
          frameRate: 20,
          repeat: -1
        });
      }
      if (c.chargeSheet && !this.anims.exists(`${c.key}Charge`)) {
        const auraStart =
          c.chargeAuraStart != null ? c.chargeAuraStart : c.chargeFrames - 1;
        const auraEnd =
          c.chargeAuraEnd != null ? c.chargeAuraEnd : c.chargeFrames - 1;
        this.anims.create({
          key: `${c.key}Charge`,
          frames: this.anims.generateFrameNumbers(c.chargeSheet, {
            start: 0,
            end: auraStart
          }),
          frameRate: c.chargeFrameRate || 18,
          repeat: 0
        });
        if (!this.anims.exists(`${c.key}ChargeLoop`)) {
          this.anims.create({
            key: `${c.key}ChargeLoop`,
            frames: this.anims.generateFrameNumbers(c.chargeSheet, {
              start: auraStart,
              end: auraEnd
            }),
            frameRate: c.chargeLoopFrameRate || 16,
            repeat: -1,
            yoyo: true
          });
        }
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
            end: c.kickEndFrame != null ? c.kickEndFrame : c.kickFrames - 1
          }),
          frameRate: c.kickFrameRate || c.kickFrames / (KICK_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (
        c.kickSheet &&
        c.airKickEndFrame != null &&
        !this.anims.exists(`${c.key}AirKick`)
      ) {
        this.anims.create({
          key: `${c.key}AirKick`,
          frames: this.anims.generateFrameNumbers(c.kickSheet, {
            start: 0,
            end: c.airKickEndFrame
          }),
          frameRate: c.kickFrameRate || c.kickFrames / (KICK_DURATION_MS / 1000),
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
          frameRate: c.punchFrameRate || c.punchFrames / (PUNCH_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (c.transformPunchSheet && !this.anims.exists(`${c.key}TransformPunch`)) {
        this.anims.create({
          key: `${c.key}TransformPunch`,
          frames: this.anims.generateFrameNumbers(c.transformPunchSheet, {
            start: 0,
            end: c.transformPunchFrames - 1
          }),
          frameRate:
            c.transformPunchFrameRate ||
            c.transformPunchFrames / (PUNCH_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (
        c.transformPunchLeftSheet &&
        !this.anims.exists(`${c.key}TransformPunchLeft`)
      ) {
        this.anims.create({
          key: `${c.key}TransformPunchLeft`,
          frames: this.anims.generateFrameNumbers(c.transformPunchLeftSheet, {
            start:
              c.transformPunchLeftStartFrame != null
                ? c.transformPunchLeftStartFrame
                : 0,
            end:
              c.transformPunchLeftEndFrame != null
                ? c.transformPunchLeftEndFrame
                : c.transformPunchLeftFrames - 1
          }),
          frameRate: c.transformPunchLeftFrameRate || 55,
          repeat: 0
        });
      }
      if (
        c.transformJumpSheet &&
        !this.anims.exists(`${c.key}TransformJump`)
      ) {
        this.anims.create({
          key: `${c.key}TransformJump`,
          frames: this.anims.generateFrameNumbers(c.transformJumpSheet, {
            start: 0,
            end: (c.transformJumpFrames || 25) - 1
          }),
          frameRate:
            c.transformJumpFrameRate ||
            (c.transformJumpFrames || 25) /
              ((c.transformJumpDurationMs || 1000) / 1000),
          repeat: 0
        });
      }
      if (
        c.transformKickSheet &&
        !this.anims.exists(`${c.key}TransformKick`)
      ) {
        this.anims.create({
          key: `${c.key}TransformKick`,
          frames: this.anims.generateFrameNumbers(c.transformKickSheet, {
            start: 0,
            end: (c.transformKickFrames || 21) - 1
          }),
          frameRate: c.transformKickFrameRate || 40,
          repeat: 0
        });
      }
      if (c.transformRunSheet && !this.anims.exists(`${c.key}TransformRun`)) {
        const runStart =
          c.transformRunStartFrame != null ? c.transformRunStartFrame : 0;
        const runEnd =
          c.transformRunEndFrame != null
            ? c.transformRunEndFrame
            : c.transformRunFrames - 1;
        this.anims.create({
          key: `${c.key}TransformRun`,
          frames: this.anims.generateFrameNumbers(c.transformRunSheet, {
            start: runStart,
            end: runEnd
          }),
          frameRate: c.transformRunFrameRate || 24,
          repeat: -1
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
          frameRate: c.tauntFrameRate || c.tauntFrames / (TAUNT_DURATION_MS / 1000),
          repeat: 0
        });
      }
      if (c.hitSheet && !this.anims.exists(`${c.key}Hit`)) {
        const start = c.hitStartFrame != null ? c.hitStartFrame : 0;
        const end = c.hitEndFrame != null ? c.hitEndFrame : c.hitFrames - 1;
        this.anims.create({
          key: `${c.key}Hit`,
          frames: this.anims.generateFrameNumbers(c.hitSheet, {
            start,
            end
          }),
          frameRate: c.hitFrameRate || 20,
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

    const bgSrc = bgDef.sheet
      ? null
      : this.textures.get(bgDef.key).getSourceImage();
    const bgTexW = bgDef.sheet ? bgDef.frameW : bgSrc.width;
    const bgCover = bgDef.sheet
      ? Math.max(
          this.scale.width / bgDef.frameW,
          this.scale.height / bgDef.frameH
        )
      : Math.max(
          this.scale.width / bgSrc.width,
          this.scale.height / bgSrc.height
        );
    const bgW = bgTexW * bgCover;
    const makeBgTile = (dx, flip) => {
      let s;
      if (bgDef.sheet) {
        s = this.add.sprite(
          this.scale.width / 2 + dx,
          this.scale.height / 2,
          bgDef.key
        );
        s.play(`${bgDef.key}Bg`);
      } else {
        s = this.add.image(
          this.scale.width / 2 + dx,
          this.scale.height / 2,
          bgDef.key
        );
      }
      s.setScale(bgCover).setDepth(-1).setFlipX(flip);
      s.bgBaseX = this.scale.width / 2 + dx;
      return s;
    };
    this.bgTiles = [
      makeBgTile(0, false),
      makeBgTile(-bgW, true),
      makeBgTile(bgW, true)
    ];
    this.background = this.bgTiles[0];
    this.bgPanMax = bgDef.pan != null ? bgDef.pan : Math.min(bgW / 2, 420);
    this.bgParallax = bgDef.parallax != null ? bgDef.parallax : 0.35;
    this.bgOffset = 0;

    this.fighter1 = this.addFighter(p1, this.p1X, true);
    this.fighter2 = this.addFighter(p2, this.p2X, false);

    this.cameras.main.setBounds(
      -WORLD_PAD,
      0,
      1280 + WORLD_PAD * 2,
      this.scale.height
    );
    this.camTarget = this.add.zone(640, this.scale.height / 2, 2, 2);
    this.cameras.main.startFollow(this.camTarget, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(this.scale.width * 0.42, this.scale.height);

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
    this.jumpForwardKey =
      this.walkChar && this.walkChar.jumpForwardSheet
        ? `${this.walkChar.key}JumpForward`
        : null;
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
    this.airKickKey =
      this.kickChar && this.kickChar.airKickEndFrame != null
        ? `${this.kickChar.key}AirKick`
        : null;
    this.transformKickKey =
      this.kickChar && this.kickChar.transformKickSheet
        ? `${this.kickChar.key}TransformKick`
        : null;
    this.punchKey = this.punchChar ? `${this.punchChar.key}Punch` : null;
    this.transformPunchKey =
      this.punchChar && this.punchChar.transformPunchSheet
        ? `${this.punchChar.key}TransformPunch`
        : null;
    this.transformPunchLeftKey =
      this.punchChar && this.punchChar.transformPunchLeftSheet
        ? `${this.punchChar.key}TransformPunchLeft`
        : null;
    this.transformJumpKey =
      this.walkChar && this.walkChar.transformJumpSheet
        ? `${this.walkChar.key}TransformJump`
        : null;
    this.punchComboUntil = 0;
    this.punchComboNext = null;
    this.punchWasLeft = false;
    this.tauntKey = this.tauntChar ? `${this.tauntChar.key}Taunt` : null;

    this.kameChar = p1.kamehameha ? p1 : null;
    this.kamer = this.kameChar ? this.fighter1 : null;
    this.catChar = p1.catAttack ? p1 : null;
    this.cater = this.catChar ? this.fighter1 : null;
    this.camelChar = p1.travelAttack ? p1 : null;
    this.cameler = this.camelChar ? this.fighter1 : null;
    this.transformChar = p1.transformAttack ? p1 : null;
    this.transformer = this.transformChar ? this.fighter1 : null;
    this.specialer = this.kamer || this.cater || this.cameler || this.transformer;
    this.specialChar = this.kameChar || this.catChar || this.camelChar || this.transformChar;
    this.catActive = false;
    this.catHitDone = false;
    this.camelActive = false;
    this.camelHitDone = false;
    this.transformActive = false;
    this.fighter1.transformed = false;
    this.fighter2.transformed = false;
    if (TEST_P2_TRANSFORM) {
      this.fighter2.transformed = true;
    }

    this.guardChar = p1.guardSheet ? p1 : null;
    this.p2guardChar = p2.guardSheet ? p2 : null;

    this.p2walkChar =
      p2.walkSheet || p2.jumpSheet || p2.jumpForwardSheet ? p2 : null;
    this.p2state = {
      walkMoving: false,
      jumping: false,
      backflipActive: false,
      backflipDir: 1,
      jumpDir: 0,
      kneeling: false,
      kneelStanding: false
    };

    this.specialCharge = 0;
    this.channel = null;
    this.channelEmitter = null;
    this.chargeSfx = null;
    this.chargeRamp = null;

    this.ensureParticleTexture();

    this.health1 = FIGHTER_MAX_HP;
    this.health2 = FIGHTER_MAX_HP;
    this.createHealthBars(p1, p2);
    this.createSpecialBar();

    if (this.walker) {
      this.walker.on('animationcomplete', (anim) => {
        if (
          (anim.key === this.jumpKey ||
            anim.key === this.jumpForwardKey ||
            anim.key === this.backflipKey ||
            anim.key === this.transformJumpKey) &&
          (this.jumping || this.jumpLanded)
        ) {
          this.jumping = false;
          this.backflipActive = false;
          this.jumpDir = 0;
          this.jumpLanded = false;
          this.tweens.killTweensOf(this.walker);
          this.walker.y = this.groundY;
          this.applyIdle(this.walkChar, this.walker);
        }
        if (anim.key === this.kneelUpKey && this.kneelStanding) {
          this.kneelStanding = false;
          this.kneeling = false;
          this.applyIdle(this.kneelChar, this.kneeler);
        }
        if ((anim.key === this.kickKey ||
            anim.key === this.airKickKey ||
            anim.key === this.transformKickKey) &&
          this.kicking) {
          if (this.airKicking) {
            if (this.walker.y >= this.groundY - 1) {
              this.airKicking = false;
              this.kicking = false;
              this.jumping = false;
              this.backflipActive = false;
              this.jumpDir = 0;
              this.blendToIdle(this.kickChar, this.kicker);
            }
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
        if (
          (anim.key === this.punchKey ||
            anim.key === this.transformPunchKey ||
            anim.key === this.transformPunchLeftKey) &&
          this.punching
        ) {
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

    [this.fighter1, this.fighter2].forEach((sprite, i) => {
      const c = i === 0 ? p1 : p2;
      if (!c.hitSheet) {
        return;
      }
      sprite.on('animationcomplete', (anim) => {
        if (anim.key === `${c.key}Hit` && sprite.hitPlaying) {
          sprite.hitPlaying = false;
          this.applyIdle(c, sprite);
        }
      });
    });

    this.ai = {
      state: 'idle',
      nextDecision: 0,
      attackCooldown: 0,
      aiPunching: false,
      aiKicking: false,
      aiJumping: false,
      aiBlocking: false
    };
    this.aiEnabled = false;

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

      const p2w = this.p2walkChar;
      if (p2w && this.p2state) {
        if (
          (anim.key === `${p2w.key}Jump` ||
            anim.key === `${p2w.key}JumpForward` ||
            anim.key === `${p2w.key}Backflip`) &&
          this.p2state.jumping
        ) {
          this.p2state.jumping = false;
          this.p2state.backflipActive = false;
          this.p2state.jumpDir = 0;
          this.tweens.killTweensOf(this.fighter2);
          this.fighter2.y = this.groundY;
          this.applyIdle(p2w, this.fighter2);
        }
        if (anim.key === `${p2w.key}KneelUp` && this.p2state.kneelStanding) {
          this.p2state.kneelStanding = false;
          this.p2state.kneeling = false;
          this.applyIdle(p2w, this.fighter2);
        }
      }
    });

    this.fighter1.on('animationcomplete', (anim) => {
      const c = this.specialChar;
      if (c && c.chargeSheet && this.channel === 'special' && anim.key === `${c.key}Charge`) {
        if (this.anims.exists(`${c.key}ChargeLoop`)) {
          this.fighter1.play(`${c.key}ChargeLoop`);
        }
      }
    });

    [this.fighter1, this.fighter2].forEach((sprite, i) => {
      const c = i === 0 ? p1 : p2;
      if (!c.guardSheet && !c.transformGuardSheet) {
        return;
      }
      sprite.on('animationcomplete', (anim) => {
        const transformGuard = anim.key === `${c.key}TransformGuard`;
        if (
          (anim.key === `${c.key}Guard` || transformGuard) &&
          sprite.guarding
        ) {
          sprite.play(
            transformGuard
              ? `${c.key}TransformGuardHold`
              : `${c.key}GuardHold`
          );
        } else if (
          anim.key === `${c.key}GuardDown` ||
          anim.key === `${c.key}TransformGuardDown`
        ) {
          this.applyIdle(c, sprite);
        }
      });
    });

    this.keys = this.input.keyboard.addKeys('A,D,S,SPACE,W,F,T,Q,V,H,B,G');
    this.p2keys = this.input.keyboard.addKeys('I,J,K,L');
    this.debugHitboxes = false;
    this.hitboxGfx = this.add.graphics().setDepth(1000);

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

  contactPoint(hit, hurt) {
    const inter = Phaser.Geom.Rectangle.Intersection(hit, hurt);
    if (!inter || inter.width <= 0 || inter.height <= 0) {
      return null;
    }
    return { x: inter.centerX, y: inter.centerY };
  }

  updateBackgroundParallax() {
    if (!this.bgTiles || !this.bgTiles.length || !this.fighter1) {
      return;
    }
    const focus =
      this.fighter2 != null
        ? (this.fighter1.x + this.fighter2.x) / 2
        : this.fighter1.x;
    const target = Phaser.Math.Clamp(
      (focus - this.scale.width / 2) * this.bgParallax,
      -this.bgPanMax,
      this.bgPanMax
    );
    this.bgOffset = Phaser.Math.Linear(this.bgOffset || 0, target, 0.08);
    for (const s of this.bgTiles) {
      s.x = s.bgBaseX + this.bgOffset;
    }
  }

  drawDebugHitboxes() {
    if (!this.hitboxGfx) {
      return;
    }
    this.hitboxGfx.clear();
    if (!this.debugHitboxes || !this.fighter1 || !this.fighter2) {
      return;
    }
    const stroke = (rect, color) => {
      this.hitboxGfx.lineStyle(2, color, 1);
      this.hitboxGfx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    };
    stroke(this.getHitbox(this.fighter1, this.hurtState(this.fighter1)), 0x33ff66);
    stroke(this.getHitbox(this.fighter2, this.hurtState(this.fighter2)), 0x33ff66);
    if (this.punchChar && this.walker) {
      const state =
        this.walker &&
        this.walker.transformed &&
        this.punchChar.transformPunchSheet
          ? 'transformPunch'
          : 'punch';
      stroke(this.getHitbox(this.walker, state), 0xff3366);
    }
    if (this.punchChar && this.fighter2) {
      stroke(this.getHitbox(this.fighter2, 'punch'), 0xff3366);
    }
    if (this.kickChar && this.walker) {
      stroke(this.getHitbox(this.walker, 'kick'), 0xffaa00);
    }
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
      .setDepth(28)
      .setScrollFactor(0);
    this.add
      .text(this.scale.width - 50, 54, p2.name, {
        fontFamily: 'monospace',
        fontSize: '16px',
        fontStyle: 'bold',
        color: '#ffffff'
      })
      .setOrigin(1, 0)
      .setDepth(28)
      .setScrollFactor(0);

    this.updateHealthBars(true);
  }

  makeBar(x, right, y, w, h) {
    const ox = right ? 1 : 0;
    this.add
      .rectangle(x, y, w, h, 0x0d0f16)
      .setOrigin(ox, 0.5)
      .setDepth(25)
      .setScrollFactor(0);
    const ghost = this.add
      .rectangle(x, y, w - 4, h - 4, 0xff8a00)
      .setOrigin(ox, 0.5)
      .setDepth(26)
      .setScrollFactor(0);
    const fill = this.add
      .rectangle(x, y, w - 4, h - 4, 0x3ddc6b)
      .setOrigin(ox, 0.5)
      .setDepth(27)
      .setScrollFactor(0);
    this.add
      .rectangle(x, y, w, h)
      .setStrokeStyle(3, 0xffffff)
      .setOrigin(ox, 0.5)
      .setDepth(28)
      .setScrollFactor(0);
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
      .setDepth(25)
      .setScrollFactor(0);
    this.specialFill = this.add
      .rectangle(x + 2, y, SPECIAL_BAR_W - 4, SPECIAL_BAR_H - 4, 0x00e5ff)
      .setOrigin(0, 0.5)
      .setDepth(27)
      .setScrollFactor(0);
    this.add
      .rectangle(x, y, SPECIAL_BAR_W, SPECIAL_BAR_H)
      .setStrokeStyle(2, 0xffffff)
      .setOrigin(0, 0.5)
      .setDepth(28)
      .setScrollFactor(0);
    this.add
      .text(x, y - 18, 'ESPECIAL (Q)', {
        fontFamily: 'monospace',
        fontSize: '13px',
        fontStyle: 'bold',
        color: '#00e5ff'
      })
      .setOrigin(0, 0)
      .setDepth(28)
      .setScrollFactor(0);
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
    if (!this.specialer || this.gameOver || this.kameActive || this.catActive || this.camelActive || this.transformActive) {
      this.stopChannel();
      return;
    }

    const busy =
      this.kneeling ||
      this.kneelStanding ||
      this.jumping ||
      this.punching ||
      this.kicking ||
      this.taunting ||
      (this.walker && this.walker.guarding) ||
      (this.walker && this.walker.hitPlaying);
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
    const s = this.specialer;
    const c = this.specialChar;
    const color = type === 'special' ? 0x00e5ff : 0x3ddc6b;
    const x = s ? s.x : this.p1X;
    const y = this.groundY - 150;
    const hasChargeAnim = !!(type === 'special' && c && c.chargeSheet);

    if (hasChargeAnim) {
      this.applyCharge(c, s);
    } else if (s && s.anims) {
      s.anims.timeScale =
        type === 'special' ? SPECIAL_CHARGE_ANIM_SCALE : HEAL_ANIM_SCALE;
    }

    this.channelObjects = [];
    this.channelTweens = [];
    this.channelTimers = [];

    const wild = !!(c && c.chargeParticles);
    if (!hasChargeAnim || wild) {
      const emitter = this.add
        .particles(x, y, 'spark', {
          lifespan: 620,
          speed: wild ? { min: 60, max: 300 } : { min: 20, max: 130 },
          angle: type === 'heal' ? { min: 250, max: 290 } : { min: 0, max: 360 },
          scale: { start: 0.7, end: 0 },
          alpha: { start: 0.9, end: 0 },
          blendMode: 'ADD',
          quantity: wild ? 6 : 4,
          frequency: wild ? 14 : 22,
          tint: [0xffffff, color, color],
          emitZone: {
            type: 'random',
            source: new Phaser.Geom.Rectangle(-45, -150, 90, 300)
          }
        })
        .setDepth(20);
      this.channelEmitter = emitter;
      this.channelObjects.push({ obj: emitter, dy: -150 });
    } else {
      this.channelEmitter = null;
    }

    if (type === 'special') {
      if (!wild && !(c && c.chargeGlow === false)) {
        this.buildSuperCharge(x, color, hasChargeAnim);
      }
    }

    if (type === 'special' && c && c.chargeSound) {
      const sfx = this.sound.get(c.chargeSound);
      if (sfx) {
        this.chargeSfx = sfx;
        sfx.setVolume(0);
        if (!sfx.isPlaying) {
          sfx.play();
        }
        this.chargeRamp = this.tweens.addCounter({
          from: 0,
          to: CHARGE_SFX_MAX,
          duration: CHARGE_SFX_RAMP_MS,
          ease: 'Quad.easeIn',
          onUpdate: (tw) => sfx.setVolume(tw.getValue()),
          onComplete: () => {
            this.chargeRamp = null;
          }
        });
      }
    }
  }

  applyCharge(c, sprite) {
    if (!sprite) {
      return;
    }
    if (sprite.texture.key !== c.chargeSheet) {
      sprite.setTexture(c.chargeSheet);
      sprite.setOrigin(0.5, c.chargeOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.chargeSourceH);
    }
    sprite.play(`${c.key}Charge`);
  }

  buildSuperCharge(x, color, light) {
    const feetY = this.groundY;
    const bodyY = feetY - 150;

    const glow = this.add
      .ellipse(x, bodyY, light ? 130 : 170, light ? 300 : 350, color, light ? 0.2 : 0.3)
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

    if (light) {
      return;
    }

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

  fadeOutChargeSound() {
    if (!this.chargeSfx) {
      return;
    }
    if (this.chargeRamp) {
      this.chargeRamp.stop();
      this.chargeRamp = null;
    }
    const sfx = this.chargeSfx;
    this.chargeSfx = null;
    const from = sfx.volume != null ? sfx.volume : CHARGE_SFX_MAX;
    this.tweens.addCounter({
      from,
      to: 0,
      duration: CHARGE_SFX_FADE_MS,
      onUpdate: (tw) => sfx.setVolume(tw.getValue()),
      onComplete: () => sfx.stop()
    });
  }

  stopChannel() {
    this.fadeOutChargeSound();
    if (!this.channel) {
      return;
    }
    const type = this.channel;
    const s = this.specialer;
    const c = this.specialChar;
    if (s && s.anims) {
      s.anims.timeScale = 1;
    }
    if (type === 'special' && c && c.chargeSheet && s) {
      this.applyIdle(c, s);
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
    const s = this.specialer;
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
    return !!sprite.guarding;
  }

  guardCharOf(sprite) {
    const c = sprite === this.fighter1 ? this.p1Char : this.p2Char;
    if (c && c.guardSheet) {
      return c;
    }
    if (
      sprite.transformed &&
      c &&
      c.transformGuardSheet
    ) {
      return c;
    }
    return null;
  }

  holdBack(sprite) {
    if (!this.keys || !this.p2keys) {
      return false;
    }
    if (sprite === this.fighter1) {
      return sprite.mustFaceRight ? this.keys.A.isDown : this.keys.D.isDown;
    }
    if (sprite === this.fighter2) {
      if (TEST_AUTO_GUARD && this.testP2Guard) {
        return true;
      }
      return sprite.mustFaceRight ? this.p2keys.J.isDown : this.p2keys.L.isDown;
    }
    return false;
  }

  isAttacking(sprite) {
    if (sprite === this.fighter1) {
      return this.punching || this.kicking || this.kameActive || this.catActive || this.camelActive || this.transformActive;
    }
    if (sprite === this.fighter2 && this.p2state) {
      return !!(this.p2state.punching || this.p2state.kicking);
    }
    return false;
  }

  wantGuard(sprite) {
    if (!this.controlsEnabled || this.gameOver || sprite.hitPlaying) {
      return false;
    }
    if (sprite === this.fighter1) {
      if (
        this.jumping ||
        this.punching ||
        this.kicking ||
        this.taunting ||
        this.kneeling ||
        this.kneelStanding ||
        this.channel
      ) {
        return false;
      }
    } else {
      const st = this.p2state;
      if (st && (st.jumping || st.kneeling || st.kneelStanding)) {
        return false;
      }
    }
    const opp = this.opponentOf(sprite);
    const lingering =
      sprite.guardHoldUntil != null && this.time.now < sprite.guardHoldUntil;
    if (!lingering && !this.isAttacking(opp)) {
      return false;
    }
    if (Math.abs(sprite.x - opp.x) > GUARD_RANGE) {
      return false;
    }
    return this.holdBack(sprite);
  }

  updateGuard(sprite) {
    const c = this.guardCharOf(sprite);
    if (c && this.wantGuard(sprite)) {
      if (!sprite.guarding) {
        sprite.guarding = true;
        if (sprite === this.walker) {
          this.walkerMoving = false;
        }
        this.applyGuard(c, sprite);
      }
      return true;
    }
    if (sprite.guarding) {
      sprite.guarding = false;
      if (c) {
        this.applyGuardDown(c, sprite);
      }
    }
    return false;
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

  squashHit(sprite) {
    const baseX = sprite.scaleX;
    const baseY = sprite.scaleY;
    const key = sprite.texture.key;
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 100,
      yoyo: true,
      ease: 'Quad.easeOut',
      onUpdate: (tw) => {
        if (sprite.texture.key !== key) {
          tw.stop();
          return;
        }
        const f = tw.getValue();
        sprite.setScale(baseX * (1 + 0.04 * f), baseY * (1 - 0.07 * f));
      }
    });
  }

  blockSparks(x, y) {
    const burst = this.add
      .particles(x, y, 'spark', {
        lifespan: 460,
        speed: { min: 120, max: 340 },
        angle: { min: 200, max: 340 },
        gravityY: 620,
        scale: { start: 0.8, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        tint: [0xffffff, 0xbde0ff, 0x66ccff],
        emitting: false
      })
      .setDepth(23);
    burst.explode(18, x, y);
    this.time.delayedCall(600, () => burst.destroy());
  }

  hitstop(ms) {
    if (!ms || ms <= 0) {
      return;
    }
    if (this.hitstopUntil && this.time.now < this.hitstopUntil) {
      return;
    }
    this.hitstopUntil = this.time.now + ms;
    if (this.tweens) {
      this.tweens.timeScale = 0;
    }
    if (this.anims) {
      this.anims.globalTimeScale = 0;
    }
    this.time.delayedCall(ms, () => {
      this.hitstopUntil = 0;
      if (this.tweens) {
        this.tweens.timeScale = 1;
      }
      if (this.anims) {
        this.anims.globalTimeScale = 1;
      }
    });
  }

  impactSpark(x, y) {
    const burst = this.add
      .particles(x, y, 'spark', {
        lifespan: 380,
        speed: { min: 90, max: 320 },
        scale: { start: 0.9, end: 0 },
        alpha: { start: 1, end: 0 },
        blendMode: 'ADD',
        tint: [0xffffff, 0xffe600, 0xff8a00],
        emitting: false
      })
      .setDepth(24);
    burst.explode(14, x, y);
    this.time.delayedCall(500, () => burst.destroy());
  }

  spawnHitFx(x, y) {
    if (!this.textures.exists(HIT_FX.sheet)) {
      return;
    }
    const key = Phaser.Utils.Array.GetRandom(HIT_FX.colors);
    const fx = this.add.sprite(x, y, HIT_FX.sheet);
    fx.setScale(
      (HIT_FX.targetH / HIT_FX.frameH) * Phaser.Math.FloatBetween(0.85, 1.12)
    );
    fx.setDepth(26);
    fx.setBlendMode(Phaser.BlendModes.ADD);
    fx.setAngle(Phaser.Math.Between(-35, 35));
    fx.play(key);
    fx.once('animationcomplete', () => fx.destroy());
    this.time.delayedCall(400, () => {
      if (fx.active) {
        fx.destroy();
      }
    });
  }

  playHitSound(blocking) {
    const key = Phaser.Utils.Array.GetRandom(HIT_SOUNDS);
    if (!this.cache.audio.exists(key)) {
      return;
    }
    const rate = blocking
      ? Phaser.Math.FloatBetween(0.62, 0.78)
      : Phaser.Math.FloatBetween(0.95, 1.12);
    const detune = blocking
      ? Phaser.Math.Between(-260, -110)
      : Phaser.Math.Between(-130, 130);
    this.sound.play(key, {
      rate,
      detune,
      volume: blocking ? 0.55 : 0.7
    });
  }

  playImpact(attacker, defender, blocking, contact) {
    this.hitstop(blocking ? BLOCK_HITSTOP_MS : HITSTOP_MS);
    if (this.cameras && this.cameras.main) {
      this.cameras.main.shake(blocking ? 55 : 60, blocking ? 0.003 : 0.005);
    }
    const dir =
      Math.sign(defender.x - attacker.x) || (attacker.mustFaceRight ? 1 : -1);
    const x = contact ? contact.x : attacker.x + dir * 100;
    const y = contact ? contact.y : this.groundY - 230;
    this.spawnHitFx(x, y);
    if (blocking) {
      this.blockSparks(x, y);
    } else {
      this.impactSpark(x, y);
    }
    this.playHitSound(blocking);
  }

  blendToIdle(c, sprite) {
    this.applyIdle(c, sprite);
    const baseX = sprite.scaleX;
    const baseY = sprite.scaleY;
    const key = sprite.texture.key;
    sprite.setScale(baseX * 1.03, baseY * 0.97);
    this.tweens.addCounter({
      from: 0,
      to: 1,
      duration: 150,
      ease: 'Quad.easeOut',
      onUpdate: (tw) => {
        if (sprite.texture.key !== key) {
          tw.stop();
          return;
        }
        const f = tw.getValue();
        sprite.setScale(
          baseX * (1 + 0.03 * (1 - f)),
          baseY * (1 - 0.03 * (1 - f))
        );
      }
    });
  }

  damageFighter(sprite, amount, attacker, opts = {}) {
    const isP1 = sprite === this.fighter1;
    const blocking = this.isBlocking(sprite);
    const dmg = blocking
      ? Math.max(1, Math.round(amount * BLOCK_DAMAGE_FACTOR))
      : amount;

    if (isP1) {
      this.health1 = Math.max(0, this.health1 - dmg);
    } else if (!TEST_NO_DAMAGE) {
      this.health2 = Math.max(0, this.health2 - dmg);
    }
    const hp = isP1 ? this.health1 : this.health2;

    const knockback =
      opts.knockback != null
        ? opts.knockback
        : blocking
        ? BLOCK_KNOCKBACK
        : KNOCKBACK_DISTANCE;
    this.applyKnockback(sprite, this.hitDirection(sprite, attacker), knockback);
    sprite.hitstunUntil =
      this.time.now + (blocking ? BLOCK_HITSTUN_MS : HITSTUN_MS);
    if (blocking) {
      sprite.guardHoldUntil = this.time.now + 400;
    }
    this.squashHit(sprite);
    this.updateHealthBars(false);

    if (attacker) {
      this.playImpact(attacker, sprite, blocking, opts.contact);
    }

    if (
      !blocking &&
      hp > 0 &&
      sprite.y >= this.groundY - 8 &&
      !(sprite === this.walker && this.channel)
    ) {
      this.playHitReaction(sprite);
    }

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
      .setDepth(40)
      .setScrollFactor(0);
    this.tweens.add({ targets: dim, alpha: 0.6, duration: 400 });

    const rays = 24;
    for (let i = 0; i < rays; i++) {
      const ang = (i / rays) * Math.PI * 2;
      const len = 300 + (i % 2) * 120;
      const ray = this.add
        .rectangle(cx, cy - 20, 12, len, i % 2 ? 0xff2d95 : 0x00e5ff, 0.85)
        .setOrigin(0.5)
        .setDepth(41)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScrollFactor(0);
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

  punchHitDelay() {
    const c = this.punchChar;
    if (
      this.puncher &&
      this.puncher.transformed &&
      c &&
      c.transformPunchSheet &&
      c.transformPunchHitMs != null
    ) {
      return c.transformPunchHitMs;
    }
    return PUNCH_HIT_MS;
  }

  punchHit(puncher) {
    const opp = this.opponentOf(puncher);
    const state =
      puncher.transformed &&
      this.punchChar &&
      this.punchChar.transformPunchSheet
        ? 'transformPunch'
        : 'punch';
    const hit = this.getHitbox(puncher, state);
    const hurt = this.getHitbox(opp, this.hurtState(opp));
    if (Phaser.Geom.Intersects.RectangleToRectangle(hit, hurt)) {
      this.damageFighter(opp, PUNCH_DAMAGE, puncher, {
        knockback: LIGHT_KNOCKBACK,
        contact: this.contactPoint(hit, hurt)
      });
      if (
        state === 'transformPunch' &&
        this.punchChar &&
        this.punchChar.transformPunchLeftSheet
      ) {
        this.punchComboUntil =
          this.time.now +
          (this.punchChar.transformPunchComboMs || 700);
        this.punchComboNext = this.punchWasLeft ? 'right' : 'left';
      }
    }
  }

  kickHit(kicker) {
    const opp = this.opponentOf(kicker);
    const hit = this.getHitbox(kicker, 'kick');
    const hurt = this.getHitbox(opp, this.hurtState(opp));
    if (Phaser.Geom.Intersects.RectangleToRectangle(hit, hurt)) {
      this.damageFighter(opp, PUNCH_DAMAGE, kicker, {
        contact: this.contactPoint(hit, hurt)
      });
    }
  }

  updateAI(delta) {
    if (
      !this.controlsEnabled ||
      this.gameOver ||
      this.kameActive ||
      this.catActive ||
      this.camelActive ||
      this.transformActive ||
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
      this.damageFighter(opp, PUNCH_DAMAGE, attacker, {
        contact: this.contactPoint(hit, hurt)
      });
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
    this.jumpLanded = false;
        this.kicking = false;
        this.jumping = false;
        this.backflipActive = false;
        this.jumpDir = 0;
        this.blendToIdle(this.kickChar, this.kicker);
      }
    });
  }

  applyIdle(c, sprite) {
    const transform = sprite.transformed && c.transformSheet;
    const sheet = transform ? c.transformSheet : c.sheet;
    const originY = transform ? c.transformOriginY : c.originY;
    const sourceH = transform ? c.transformSourceH : c.sourceH;
    const idleKey = transform ? `${c.key}TransformIdle` : `${c.key}Idle`;
    if (sprite.texture.key !== sheet) {
      sprite.setTexture(sheet);
      sprite.setOrigin(0.5, originY);
      sprite.setScale(FIGHTER_TARGET_H / sourceH);
    }
    if (!sprite.anims.isPlaying || sprite.anims.currentAnim.key !== idleKey) {
      sprite.play(idleKey);
    }
  }

  applyWalk(c, sprite, forward) {
    if (sprite.transformed && (c.transformRunSheet || c.transformWalkSheet)) {
      const backwards = !forward && c.transformWalkSheet;
      const sheet = backwards ? c.transformWalkSheet : c.transformRunSheet;
      const originY = backwards ? c.transformWalkOriginY : c.transformRunOriginY;
      const sourceH = backwards ? c.transformWalkSourceH : c.transformRunSourceH;
      const key = backwards ? `${c.key}TransformWalk` : `${c.key}TransformRun`;
      if (sprite.texture.key !== sheet) {
        sprite.setTexture(sheet);
        sprite.setOrigin(0.5, originY);
        sprite.setScale(FIGHTER_TARGET_H / sourceH);
      }
      if (!sprite.anims.isPlaying || sprite.anims.currentAnim.key !== key) {
        sprite.play(key);
      }
      return;
    }
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
    if (sprite.transformed && c.transformJumpSheet) {
      if (sprite.texture.key !== c.transformJumpSheet) {
        sprite.setTexture(c.transformJumpSheet);
        sprite.setOrigin(0.5, c.transformJumpOriginY);
        sprite.setScale(FIGHTER_TARGET_H / c.transformJumpSourceH);
      }
      sprite.play(`${c.key}TransformJump`);
      return;
    }
    if (sprite.texture.key !== c.jumpSheet) {
      sprite.setTexture(c.jumpSheet);
      sprite.setOrigin(0.5, c.jumpOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.jumpSourceH);
    }
    sprite.play(`${c.key}Jump`);
  }

  applyJumpForward(c, sprite) {
    if (sprite.transformed && c.transformJumpSheet) {
      if (sprite.texture.key !== c.transformJumpSheet) {
        sprite.setTexture(c.transformJumpSheet);
        sprite.setOrigin(0.5, c.transformJumpOriginY);
        sprite.setScale(FIGHTER_TARGET_H / c.transformJumpSourceH);
      }
      sprite.play(`${c.key}TransformJump`);
      return;
    }
    if (sprite.texture.key !== c.jumpForwardSheet) {
      sprite.setTexture(c.jumpForwardSheet);
      sprite.setOrigin(0.5, c.jumpForwardOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.jumpForwardSourceH);
    }
    sprite.play(`${c.key}JumpForward`);
  }

  guardSpec(c, sprite) {
    if (sprite.transformed && c.transformGuardSheet) {
      return {
        sheet: c.transformGuardSheet,
        originY: c.transformGuardOriginY,
        sourceH: c.transformGuardSourceH,
        up: `${c.key}TransformGuard`,
        hold: `${c.key}TransformGuardHold`,
        down: `${c.key}TransformGuardDown`
      };
    }
    return {
      sheet: c.guardSheet,
      originY: c.guardOriginY,
      sourceH: c.guardSourceH,
      up: `${c.key}Guard`,
      hold: `${c.key}GuardHold`,
      down: `${c.key}GuardDown`
    };
  }

  applyGuard(c, sprite) {
    const g = this.guardSpec(c, sprite);
    if (sprite.texture.key !== g.sheet) {
      sprite.setTexture(g.sheet);
      sprite.setOrigin(0.5, g.originY);
      sprite.setScale(FIGHTER_TARGET_H / g.sourceH);
    }
    sprite.play(g.up);
  }

  applyGuardHold(c, sprite) {
    const g = this.guardSpec(c, sprite);
    if (sprite.texture.key !== g.sheet) {
      sprite.setTexture(g.sheet);
      sprite.setOrigin(0.5, g.originY);
      sprite.setScale(FIGHTER_TARGET_H / g.sourceH);
    }
    sprite.play(g.hold);
  }

  applyGuardDown(c, sprite) {
    const g = this.guardSpec(c, sprite);
    if (sprite.texture.key !== g.sheet) {
      sprite.setTexture(g.sheet);
      sprite.setOrigin(0.5, g.originY);
      sprite.setScale(FIGHTER_TARGET_H / g.sourceH);
    }
    sprite.play(g.down);
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

  applyKick(c, sprite, air) {
    if (sprite.transformed && c.transformKickSheet) {
      if (sprite.texture.key !== c.transformKickSheet) {
        sprite.setTexture(c.transformKickSheet);
        sprite.setOrigin(0.5, c.transformKickOriginY);
        sprite.setScale(FIGHTER_TARGET_H / c.transformKickSourceH);
      }
      sprite.play(`${c.key}TransformKick`);
      return;
    }
    if (sprite.texture.key !== c.kickSheet) {
      sprite.setTexture(c.kickSheet);
      sprite.setOrigin(0.5, c.kickOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.kickSourceH);
    }
    sprite.play(
      air && c.airKickEndFrame != null ? `${c.key}AirKick` : `${c.key}Kick`
    );
  }

  applyPunch(c, sprite, combo) {
    const left = combo && sprite.transformed && c.transformPunchLeftSheet;
    const transform = sprite.transformed && (left || c.transformPunchSheet);
    let sheet, originY, sourceH, key;
    if (left) {
      sheet = c.transformPunchLeftSheet;
      originY = c.transformPunchLeftOriginY;
      sourceH = c.transformPunchLeftSourceH;
      key = `${c.key}TransformPunchLeft`;
    } else if (transform) {
      sheet = c.transformPunchSheet;
      originY = c.transformPunchOriginY;
      sourceH = c.transformPunchSourceH;
      key = `${c.key}TransformPunch`;
    } else {
      sheet = c.punchSheet;
      originY = c.punchOriginY;
      sourceH = c.punchSourceH;
      key = `${c.key}Punch`;
    }
    if (sprite.texture.key !== sheet) {
      sprite.setTexture(sheet);
      sprite.setOrigin(0.5, originY);
      sprite.setScale(FIGHTER_TARGET_H / sourceH);
    }
    sprite.play(key);
  }

  applyTaunt(c, sprite) {
    if (sprite.texture.key !== c.tauntSheet) {
      sprite.setTexture(c.tauntSheet);
      sprite.setOrigin(0.5, c.tauntOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.tauntSourceH);
    }
    sprite.play(`${c.key}Taunt`);
  }

  playHitReaction(sprite) {
    const c = sprite === this.fighter1 ? this.p1Char : this.p2Char;
    if (!c || !c.hitSheet || !sprite.anims) {
      return;
    }
    sprite.hitPlaying = true;
    if (sprite === this.walker) {
      this.punching = false;
      this.taunting = false;
      this.walkerMoving = false;
    }
    if (sprite.texture.key !== c.hitSheet) {
      sprite.setTexture(c.hitSheet);
      sprite.setOrigin(0.5, c.hitOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.hitSourceH);
    }
    sprite.play(`${c.key}Hit`);
  }

  playJumpArc(
    total = JUMP_DURATION_MS,
    opts = {},
    sprite = this.walker,
    c = this.walkChar
  ) {
    sprite.y = this.groundY;
    const amount =
      opts.lift != null
        ? opts.lift
        : sprite.transformed && c.transformJumpArcInSheet
        ? 0
        : c.jumpLift != null
        ? c.jumpLift
        : c.jumpArcInSheet
        ? 0
        : JUMP_LIFT;
    if (amount <= 0) {
      return;
    }
    const anticipation =
      opts.anticipationFrac != null ? opts.anticipationFrac : 0;
    const peakFrac =
      opts.peakFrac != null
        ? opts.peakFrac
        : c.jumpPeakFrac != null
        ? c.jumpPeakFrac
        : JUMP_UP_MS / JUMP_DURATION_MS;
    const landFrac =
      opts.landFrac != null ? opts.landFrac : c.jumpLandFrac != null ? c.jumpLandFrac : 1;
    const delay = Math.max(0, total * anticipation);
    const up = Math.max(1, total * (peakFrac - anticipation));
    const down = Math.max(1, total * (landFrac - peakFrac));
    this.tweens.add({
      targets: sprite,
      y: this.groundY - amount,
      delay,
      duration: up,
      ease: 'Quad.easeOut',
      onComplete: () => {
        this.tweens.add({
          targets: sprite,
          y: this.groundY,
          duration: down,
          ease: 'Quad.easeIn',
          onComplete: () => {
            if (sprite === this.walker && this.airKicking) {
              this.airKicking = false;
              this.kicking = false;
              this.jumping = false;
              this.backflipActive = false;
              this.jumpDir = 0;
              this.blendToIdle(this.kickChar, this.kicker);
            }
          }
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

  playGabiAttack() {
    this.catActive = true;
    this.catHitDone = false;
    this.walkerMoving = false;
    this.punching = false;
    this.taunting = false;

    const c = this.catChar;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.cameras.main.flash(200, 140, 255, 180);
    this.cameras.main.shake(340, 0.008);

    if (c.gabiSound && this.sound.get(c.gabiSound)) {
      this.sound.play(c.gabiSound);
    }

    const dim = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x06030f)
      .setOrigin(0)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.7, duration: 160 });

    const rays = this.add.container(cx, cy).setDepth(61);
    const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    g.fillStyle(0x00ff88, 0.45);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.slice(0, 0, 480, a, a + 0.16, false);
      g.fillPath();
    }
    rays.add(g);
    this.tweens.add({
      targets: rays,
      angle: 360,
      duration: 4200,
      repeat: -1
    });

    const img = this.add.image(cx, cy, c.gabiInvocation).setDepth(62);
    const targetScale = Math.min(920 / img.width, 640 / img.height);
    img.setScale(0.1);
    this.tweens.add({
      targets: img,
      scale: targetScale,
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: img,
      angle: { from: -3, to: 3 },
      duration: 60,
      yoyo: true,
      repeat: 12,
      ease: 'Sine.easeInOut'
    });

    const txt = this.add
      .text(cx, cy + 322, 'GABI ATTACK', {
        fontFamily: 'monospace',
        fontSize: '76px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setDepth(65)
      .setLetterSpacing(4)
      .setScale(0.2)
      .setAlpha(0);
    txt.setStroke('#ff2d95', 10);
    this.tweens.add({
      targets: txt,
      scale: 1.12,
      alpha: 1,
      duration: 240,
      delay: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: txt, scale: 1, duration: 180 });
      }
    });

    const parts = [dim, rays, img, txt];
    this.time.delayedCall(CAT_INTRO_MS, () => {
      this.tweens.add({
        targets: parts,
        alpha: 0,
        duration: 260,
        onComplete: () => {
          this.tweens.killTweensOf(rays);
          parts.forEach((o) => o.destroy());
        }
      });
      this.spawnCat();
    });
  }

  spawnCat() {
    const c = this.catChar;
    const dir = this.specialer.mustFaceRight ? 1 : -1;
    const startX = this.specialer.x + dir * 40;
    const cat = this.add.sprite(startX, this.groundY, c.gabiSheet);
    cat.setOrigin(0.5, c.gabiOriginY);
    cat.setScale(CAT_TARGET_H / c.gabiSourceH);
    cat.setFlipX(dir === 1);
    cat.setDepth(16);
    cat.play(`${c.key}Gabi`);

    const endX = dir === 1 ? this.scale.width + 150 : -150;
    const dur = (Math.abs(endX - startX) / CAT_SPEED) * 1000;
    const opp = this.opponentOf(this.specialer);

    let lastX = startX;
    const timer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (!cat.active) {
          timer.remove();
          return;
        }
        const lo = Math.min(lastX, cat.x) - 30;
        const hi = Math.max(lastX, cat.x) + 30;
        lastX = cat.x;
        if (!this.catHitDone && opp.x >= lo && opp.x <= hi) {
          this.catHitDone = true;
          this.damageFighter(opp, KAME_DAMAGE, this.specialer);
          this.cameras.main.shake(220, 0.01);
          const burst = this.add
            .particles(opp.x, this.groundY - 90, 'spark', {
              lifespan: 450,
              speed: { min: 150, max: 420 },
              scale: { start: 1, end: 0 },
              alpha: { start: 1, end: 0 },
              blendMode: 'ADD',
              tint: [0xffffff, 0xff8a00, 0xffe600],
              emitting: false
            })
            .setDepth(23);
          burst.explode(26, opp.x, this.groundY - 90);
          this.time.delayedCall(600, () => burst.destroy());
        }
      }
    });

    this.tweens.add({
      targets: cat,
      x: endX,
      duration: dur,
      ease: 'Linear',
      onComplete: () => {
        timer.remove();
        cat.destroy();
        this.catActive = false;
      }
    });

    this.time.delayedCall(dur + 400, () => {
      timer.remove();
      if (cat.active) {
        cat.destroy();
      }
      this.catActive = false;
    });
  }

  playTravelAttack() {
    this.camelActive = true;
    this.camelHitDone = false;
    this.walkerMoving = false;
    this.punching = false;
    this.taunting = false;

    const c = this.camelChar;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.cameras.main.flash(200, 255, 220, 140);
    this.cameras.main.shake(340, 0.008);

    if (c.specialSound && this.sound.get(c.specialSound)) {
      this.sound.play(c.specialSound);
    }

    const dim = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x06030f)
      .setOrigin(0)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.7, duration: 160 });

    const rays = this.add.container(cx, cy).setDepth(61);
    const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    g.fillStyle(0xffd166, 0.45);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.slice(0, 0, 480, a, a + 0.16, false);
      g.fillPath();
    }
    rays.add(g);
    this.tweens.add({
      targets: rays,
      angle: 360,
      duration: 4200,
      repeat: -1
    });

    const img = this.add.image(cx, cy, c.specialInvocation).setDepth(62);
    const targetScale = Math.min(560 / img.width, 620 / img.height);
    img.setScale(0.1);
    this.tweens.add({
      targets: img,
      scale: targetScale,
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: img,
      angle: { from: -3, to: 3 },
      duration: 60,
      yoyo: true,
      repeat: 12,
      ease: 'Sine.easeInOut'
    });

    const txt = this.add
      .text(cx, cy + 322, c.specialText || 'TRAVEL ATTACK', {
        fontFamily: 'monospace',
        fontSize: '76px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setDepth(65)
      .setLetterSpacing(4)
      .setScale(0.2)
      .setAlpha(0);
    txt.setStroke('#ff8a00', 10);
    this.tweens.add({
      targets: txt,
      scale: 1.12,
      alpha: 1,
      duration: 240,
      delay: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: txt, scale: 1, duration: 180 });
      }
    });

    const parts = [dim, rays, img, txt];
    this.time.delayedCall(CAT_INTRO_MS, () => {
      this.tweens.add({
        targets: parts,
        alpha: 0,
        duration: 260,
        onComplete: () => {
          this.tweens.killTweensOf(rays);
          parts.forEach((o) => o.destroy());
        }
      });
      this.launchCamel();
    });
  }

  launchCamel() {
    const c = this.camelChar;
    const sprite = this.cameler;
    if (!sprite) {
      this.camelActive = false;
      return;
    }

    if (sprite.texture.key !== c.specialSheet) {
      sprite.setTexture(c.specialSheet);
      sprite.setOrigin(0.5, c.specialOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.specialSourceH);
    }
    sprite.play(`${c.key}Special`);

    const opp = this.opponentOf(sprite);
    const dir = opp.x >= sprite.x ? 1 : -1;
    const dist = c.specialDash != null ? c.specialDash : 150;
    const target = Phaser.Math.Clamp(sprite.x + dir * dist, WALK_MIN_X, WALK_MAX_X);

    let lastX = sprite.x;
    const timer = this.time.addEvent({
      delay: 40,
      loop: true,
      callback: () => {
        if (!sprite.active) {
          timer.remove();
          return;
        }
        const lo = Math.min(lastX, sprite.x) - 90;
        const hi = Math.max(lastX, sprite.x) + 90;
        lastX = sprite.x;
        if (!this.camelHitDone && opp.x >= lo && opp.x <= hi) {
          this.camelHitDone = true;
          this.damageFighter(opp, KAME_DAMAGE, sprite);
          this.cameras.main.shake(220, 0.01);
          const burst = this.add
            .particles(opp.x, this.groundY - 90, 'spark', {
              lifespan: 450,
              speed: { min: 150, max: 420 },
              scale: { start: 1, end: 0 },
              alpha: { start: 1, end: 0 },
              blendMode: 'ADD',
              tint: [0xffffff, 0xffd166, 0xff8a00],
              emitting: false
            })
            .setDepth(23);
          burst.explode(26, opp.x, this.groundY - 90);
          this.time.delayedCall(600, () => burst.destroy());
        }
      }
    });

    this.tweens.add({
      targets: sprite,
      x: target,
      duration: CAMEL_DASH_MS,
      ease: 'Quad.easeOut',
      onComplete: () => {
        timer.remove();
        this.time.delayedCall(200, () => {
          this.applyIdle(c, sprite);
          this.camelActive = false;
        });
      }
    });
  }

  playTransformAttack() {
    this.transformActive = true;
    this.walkerMoving = false;
    this.punching = false;
    this.taunting = false;

    const c = this.transformChar;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.cameras.main.flash(220, 180, 0, 0);
    this.cameras.main.shake(360, 0.01);

    const dim = this.add
      .rectangle(0, 0, this.scale.width, this.scale.height, 0x06030f)
      .setOrigin(0)
      .setDepth(60)
      .setAlpha(0);
    this.tweens.add({ targets: dim, alpha: 0.75, duration: 160 });

    const rays = this.add.container(cx, cy).setDepth(61);
    const g = this.add.graphics().setBlendMode(Phaser.BlendModes.ADD);
    g.fillStyle(0xff2d2d, 0.4);
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      g.slice(0, 0, 480, a, a + 0.16, false);
      g.fillPath();
    }
    rays.add(g);
    this.tweens.add({
      targets: rays,
      angle: 360,
      duration: 4200,
      repeat: -1
    });

    const img = this.add.image(cx, cy, c.specialInvocation).setDepth(62);
    const targetScale = Math.min(560 / img.width, 620 / img.height);
    img.setScale(0.1);
    this.tweens.add({
      targets: img,
      scale: targetScale,
      duration: 260,
      ease: 'Back.easeOut'
    });
    this.tweens.add({
      targets: img,
      angle: { from: -3, to: 3 },
      duration: 60,
      yoyo: true,
      repeat: 12,
      ease: 'Sine.easeInOut'
    });

    const txt = this.add
      .text(cx, cy + 322, c.specialText || 'RAGE ATTACK', {
        fontFamily: 'monospace',
        fontSize: '76px',
        fontStyle: 'bold',
        color: '#ffe600'
      })
      .setOrigin(0.5)
      .setDepth(65)
      .setLetterSpacing(4)
      .setScale(0.2)
      .setAlpha(0);
    txt.setStroke('#ff2d2d', 10);
    this.tweens.add({
      targets: txt,
      scale: 1.12,
      alpha: 1,
      duration: 240,
      delay: 160,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.tweens.add({ targets: txt, scale: 1, duration: 180 });
      }
    });

    const parts = [dim, rays, img, txt];
    this.time.delayedCall(CAT_INTRO_MS, () => {
      this.tweens.add({
        targets: parts,
        alpha: 0,
        duration: 260,
        onComplete: () => {
          this.tweens.killTweensOf(rays);
          parts.forEach((o) => o.destroy());
        }
      });
      this.applyTransform();
      this.time.delayedCall(500, () => {
        this.transformActive = false;
      });
    });
  }

  applyTransform() {
    if (this.transformer) {
      this.transformer.transformed = true;
    }
    const c = this.transformChar;
    const sprite = this.transformer;
    if (!sprite) {
      return;
    }
    if (sprite.texture.key !== c.transformSheet) {
      sprite.setTexture(c.transformSheet);
      sprite.setOrigin(0.5, c.transformOriginY);
      sprite.setScale(FIGHTER_TARGET_H / c.transformSourceH);
    }
    sprite.play(`${c.key}TransformIdle`);
    this.cameras.main.flash(200, 120, 0, 0);
    this.cameras.main.shake(300, 0.008);
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

  updateP2(delta) {
    const c = this.p2walkChar;
    const sprite = this.fighter2;
    if (!c || !sprite || this.gameOver || this.kameActive || this.catActive || this.camelActive || this.transformActive) {
      return;
    }
    const st = this.p2state;
    const k = this.p2keys;
    const stunned = this.isInHitstun(sprite) || sprite.hitPlaying;
    const dt = delta / 1000;

    if (st.kneeling) {
      if (!k.K.isDown && !st.kneelStanding) {
        st.kneelStanding = true;
        st.walkMoving = false;
        this.applyKneelUp(c, sprite);
      }
      return;
    }
    if (st.kneelStanding) {
      return;
    }
    if (sprite.hitPlaying) {
      return;
    }

    if (this.updateGuard(sprite)) {
      return;
    }

    const left = !stunned && k.J.isDown;
    const right = !stunned && k.L.isDown;

    if (st.jumping) {
      if (st.backflipActive) {
        sprite.x = Phaser.Math.Clamp(
          sprite.x + st.backflipDir * BACKFLIP_SPEED * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
      } else if (st.jumpDir) {
        sprite.x = Phaser.Math.Clamp(
          sprite.x + st.jumpDir * (c.jumpSpeed || JUMP_SPEED) * dt,
          WALK_MIN_X,
          WALK_MAX_X
        );
      }
      return;
    }

    if (c.kneelSheet && !stunned && k.K.isDown) {
      st.kneeling = true;
      st.walkMoving = false;
      this.applyKneelDown(c, sprite);
      return;
    }

    if (!stunned && Phaser.Input.Keyboard.JustDown(k.I)) {
      const facingRight = sprite.mustFaceRight;
      const goingBack = (facingRight && left) || (!facingRight && right);

      if (c.backflipSheet && goingBack) {
        st.jumping = true;
        st.backflipActive = true;
        st.jumpDir = 0;
        st.backflipDir = right ? 1 : -1;
        st.walkMoving = false;
        this.applyBackflip(c, sprite);
        this.playJumpArc(
          BACKFLIP_DURATION_MS,
          {
            lift: c.backflipLift,
            peakFrac: c.backflipPeakFrac,
            landFrac: c.backflipLandFrac
          },
          sprite,
          c
        );
        this.time.delayedCall(
          BACKFLIP_DURATION_MS * (c.backflipLandFrac || 0.639),
          () => {
            st.backflipActive = false;
          }
        );
        return;
      }

      if (c.jumpSheet || c.jumpForwardSheet) {
        st.jumping = true;
        st.backflipActive = false;
        st.jumpDir = right ? 1 : left ? -1 : 0;
        st.walkMoving = false;
        const forward = facingRight ? right : left;
        if (forward && c.jumpForwardSheet) {
          this.applyJumpForward(c, sprite);
        } else {
          this.applyJump(c, sprite);
        }
        this.playJumpArc(c.jumpDurationMs || JUMP_DURATION_MS, {}, sprite, c);
        return;
      }
    }

    if (left || right) {
      const dir = right ? 1 : -1;
      const facingRight = sprite.mustFaceRight;
      const forward = dir === 1 ? facingRight : !facingRight;
      sprite.x = Phaser.Math.Clamp(
        sprite.x + dir * WALK_SPEED * dt,
        WALK_MIN_X,
        WALK_MAX_X
      );
      if (c.walkSheet) {
        this.applyWalk(c, sprite, forward);
      }
      st.walkMoving = true;
    } else if (st.walkMoving) {
      this.applyIdle(c, sprite);
      st.walkMoving = false;
    }
  }

  update(_, delta) {
    if (Phaser.Input.Keyboard.JustDown(this.keys.G)) {
      this.debugHitboxes = !this.debugHitboxes;
    }
    this.drawDebugHitboxes();
    if (this.camTarget) {
      this.camTarget.x = Phaser.Math.Clamp(
        (this.fighter1.x + this.fighter2.x) / 2,
        -WORLD_PAD,
        1280 + WORLD_PAD
      );
    }
    if (TEST_AUTO_GUARD && this.time.now >= this.testGuardNext) {
      this.testP2Guard = !this.testP2Guard;
      this.testGuardNext = this.time.now + 1600;
    }

    if (!this.controlsEnabled) {
      return;
    }

    if (this.hitstopUntil && this.time.now < this.hitstopUntil) {
      return;
    }

    this.resolveFighterCollision();
    this.updateFacing();
    if (this.aiEnabled) {
      this.updateAI(delta);
    }
    this.updateP2(delta);

    if (!this.walker || this.kameActive || this.catActive || this.camelActive || this.transformActive) {
      return;
    }

    const dt = delta / 1000;
    const walkerStunned = this.isInHitstun(this.walker);
    const puncherStunned = this.puncher ? this.isInHitstun(this.puncher) : false;
    const taunterStunned = this.taunter ? this.isInHitstun(this.taunter) : false;
    const kamerStunned = this.specialer ? this.isInHitstun(this.specialer) : false;

    this.updateSpecial(delta, walkerStunned);
    if (this.channel) {
      return;
    }

    if (this.walker.hitPlaying) {
      return;
    }

    if (this.updateGuard(this.walker)) {
      return;
    }

    const free =
      !walkerStunned &&
      !this.jumping &&
      !this.punching &&
      !this.kicking &&
      !this.taunting &&
      !this.kneeling &&
      !this.kneelStanding;
    if (free) {
      if (this.p1Char.hitSheet && Phaser.Input.Keyboard.JustDown(this.keys.H)) {
        this.walkerMoving = false;
        this.playHitReaction(this.walker);
        return;
      }
      if (this.taunter && Phaser.Input.Keyboard.JustDown(this.keys.B)) {
        this.taunting = true;
        this.walkerMoving = false;
        this.applyTaunt(this.tauntChar, this.taunter);
        return;
      }
    }

    if (this.taunting && this.taunter === this.walker) {
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

    if (
      this.jumping &&
      !this.backflipActive &&
      this.jumpLandAt != null &&
      this.time.now >= this.jumpLandAt
    ) {
      const wasAirKick = this.airKicking;
      this.airKicking = false;
      this.kicking = false;
      this.jumping = false;
      this.jumpDir = 0;
      this.punching = false;
      if (wasAirKick) {
        this.jumpLanded = false;
        this.blendToIdle(this.walkChar, this.walker);
      } else {
        this.jumpLanded = true;
      }
    }

    if (this.jumping) {
      const airborne = this.walker.y < this.groundY - 1;
      if (this.backflipActive) {
        if (airborne) {
          this.walker.x = Phaser.Math.Clamp(
            this.walker.x + this.backflipDir * BACKFLIP_SPEED * dt,
            WALK_MIN_X,
            WALK_MAX_X
          );
        }
      } else if (this.jumpDir && airborne) {
        this.walker.x = Phaser.Math.Clamp(
          this.walker.x +
            this.jumpDir * (this.walkChar.jumpSpeed || JUMP_SPEED) * dt,
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
        this.applyKick(this.kickChar, this.kicker, true);
        const kickHitMs =
          this.kickChar.kickHitMs != null ? this.kickChar.kickHitMs : KICK_HIT_MS;
        this.time.delayedCall(kickHitMs, () => this.kickHit(this.kicker));
      }
      return;
    }

    if (
      !walkerStunned &&
      !walkerBusy &&
      (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) ||
        Phaser.Input.Keyboard.JustDown(this.keys.W))
    ) {
      const facingRight = this.walker.mustFaceRight;
      const goingBack = (facingRight && left) || (!facingRight && right);

      if (
        this.walkChar.backflipSheet &&
        goingBack &&
        !(this.walker.transformed && this.walkChar.transformJumpSheet)
      ) {
        this.punching = false;
        this.taunting = false;
        this.jumping = true;
        this.backflipActive = true;
        this.jumpLanded = false;
        this.jumpDir = 0;
        this.backflipDir = right ? 1 : -1;
        this.walkerMoving = false;
        this.applyBackflip(this.walkChar, this.walker);
        this.playJumpArc(BACKFLIP_DURATION_MS, {
          lift: this.walkChar.backflipLift,
          peakFrac: this.walkChar.backflipPeakFrac,
          landFrac: this.walkChar.backflipLandFrac
        });
        this.jumpLandAt =
          this.time.now +
          BACKFLIP_DURATION_MS * (this.walkChar.backflipLandFrac || 0.639);
        this.time.delayedCall(
          BACKFLIP_DURATION_MS * (this.walkChar.backflipLandFrac || 0.639),
          () => {
            this.backflipActive = false;
          }
        );
        return;
      }

      if (this.walkChar.jumpSheet || this.walkChar.jumpForwardSheet) {
        this.punching = false;
        this.taunting = false;
        this.jumping = true;
        this.backflipActive = false;
        this.jumpLanded = false;
        this.jumpDir = right ? 1 : left ? -1 : 0;
        this.walkerMoving = false;
        const forward = facingRight ? right : left;
        if (forward && this.walkChar.jumpForwardSheet) {
          this.applyJumpForward(this.walkChar, this.walker);
        } else {
          this.applyJump(this.walkChar, this.walker);
        }
        this.playJumpArc(
          this.walker.transformed && this.walkChar.transformJumpSheet
            ? this.walkChar.transformJumpDurationMs || JUMP_DURATION_MS
            : this.walkChar.jumpDurationMs || JUMP_DURATION_MS
        );
        const jumpDur =
          this.walker.transformed && this.walkChar.transformJumpSheet
            ? this.walkChar.transformJumpDurationMs || JUMP_DURATION_MS
            : this.walkChar.jumpDurationMs || JUMP_DURATION_MS;
        this.jumpLandAt =
          this.time.now +
          jumpDur *
            (this.walkChar.jumpLandFrac != null ? this.walkChar.jumpLandFrac : 1);
        return;
      }
    }

    if (
      this.punchChar &&
      !puncherStunned &&
      punchOpen &&
      Phaser.Input.Keyboard.JustDown(this.keys.F)
    ) {
      const comboActive = this.time.now < this.punchComboUntil;
      const comboLeft = comboActive && this.punchComboNext === 'left';
      if (comboActive) {
        this.punchComboUntil = 0;
      }
      this.punchWasLeft = !!comboLeft;
      this.punching = true;
      this.punchStartTime = this.time.now;
      this.applyPunch(this.punchChar, this.puncher, comboLeft);
      this.time.delayedCall(
        comboLeft
          ? this.punchChar.transformPunchLeftHitMs || PUNCH_HIT_MS
          : this.punchHitDelay(),
        () => this.punchHit(this.puncher)
      );
      return;
    }

    if (
      this.specialer &&
      !kamerStunned &&
      Phaser.Input.Keyboard.JustDown(this.keys.T)
    ) {
      if (this.specialCharge >= SPECIAL_MAX) {
        this.specialCharge = 0;
        this.updateSpecialBar();
        this.stopChannel();
        if (this.kameChar) {
          this.playKamehameha();
        } else if (this.catChar) {
          this.playGabiAttack();
        } else if (this.camelChar) {
          this.playTravelAttack();
        } else if (this.transformChar) {
          this.playTransformAttack();
        }
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

      const walkSpeed =
        forward &&
        this.walker.transformed &&
        this.walkChar &&
        this.walkChar.transformSpeed
          ? WALK_SPEED * this.walkChar.transformSpeed
          : WALK_SPEED;
      this.walker.x = Phaser.Math.Clamp(
        this.walker.x + dir * walkSpeed * dt,
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
      .setDepth(29)
      .setScrollFactor(0);

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
      .setScale(2.5)
      .setScrollFactor(0);
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
      .setScale(0.2)
      .setScrollFactor(0);
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
