import {
  WorldAge,
  VibeMode,
  MoCreature,
  CloudEntity,
  SunEntity,
  RainbowEntity,
  BirdEntity,
  TreeEntity,
  FruitEntity,
  RockEntity,
  FishEntity,
  ChickenEntity,
  CastleBlock,
  VolcanoEntity,
  SpaceshipEntity,
  ParticleEntity,
  ActiveChallenge,
  ActiveTool,
} from '../types';
import { soundEngine } from '../audio/soundEngine';
import { memoryStore } from '../storage/memoryStore';
import confetti from 'canvas-confetti';

interface HistoricalState {
  mo: { x: number; y: number; vx: number; vy: number; rotation: number };
  fruits: { id: string; x: number; y: number; vx: number; vy: number }[];
  blocks: { id: string; x: number; y: number; vx: number; vy: number; rotation: number }[];
  chickens: { id: string; x: number; y: number; vx: number; vy: number }[];
}

export class PhysicsEngine {
  public width: number = 400;
  public height: number = 700;
  public dpr: number = 1;

  public age: WorldAge = 1;
  public vibe: VibeMode = 'RELAX';
  public gravityY: number = 0.45;
  public gravityX: number = 0;
  public timeDilation: number = 1.0;
  public isTimeRewinding: boolean = false;
  public isNight: boolean = false;
  public activeTool: ActiveTool = 'POINTER';

  // Ground elevation points
  public groundPoints: { x: number; y: number; vy: number; baseOffset: number }[] = [];

  // Entities
  public mo: MoCreature;
  public sun: SunEntity;
  public rainbow: RainbowEntity;
  public clouds: CloudEntity[] = [];
  public birds: BirdEntity[] = [];
  public trees: TreeEntity[] = [];
  public fruits: FruitEntity[] = [];
  public rocks: RockEntity[] = [];
  public fish: FishEntity[] = [];
  public chickens: ChickenEntity[] = [];
  public castleBlocks: CastleBlock[] = [];
  public volcanoes: VolcanoEntity[] = [];
  public spaceships: SpaceshipEntity[] = [];
  public particles: ParticleEntity[] = [];

  // Dream World specifics
  public dreamRule: 'NORMAL' | 'ENORMOUS' | 'UPSIDE_DOWN' | 'TINY' = 'NORMAL';
  public giantAnt: { x: number; y: number; vx: number; vy: number; size: number; active: boolean } | null = null;
  public giantHand: { x: number; y: number; targetX: number; targetY: number; grabbing: boolean; active: boolean } = {
    x: 200,
    y: -100,
    targetX: 200,
    targetY: 100,
    grabbing: false,
    active: false,
  };

  // Challenges
  public activeChallenge: ActiveChallenge | null = null;
  public challengeTimer: number = 0;

  // History buffer for rewind mechanic
  private history: HistoricalState[] = [];
  private readonly maxHistory: number = 180;

  // Pointer dragging state
  public isDraggingMo: boolean = false;
  public isDraggingSun: boolean = false;
  public draggedEntity: { type: string; id?: string; offsetX: number; offsetY: number } | null = null;
  public lastPointerX: number = 0;
  public lastPointerY: number = 0;
  public pointerDownTime: number = 0;
  public pointerDownPos: { x: number; y: number } = { x: 0, y: 0 };
  public isSlowMoHold: boolean = false;

  // Stats for the active session
  public sessionTouches: number = 0;
  public sessionLaunches: number = 0;
  public flyingCount: number = 0;

  constructor() {
    this.mo = {
      x: 200,
      y: 400,
      vx: 0,
      vy: 0,
      radius: 26,
      mood: 'happy',
      squishX: 1,
      squishY: 1,
      rotation: 0,
      isGrounded: false,
      tailTrail: [],
      blinkTimer: 120,
      lookTarget: null,
      runningSpeed: 0,
      isEnormous: false,
      isMicro: false,
    };

    this.sun = {
      x: 80,
      y: 90,
      radius: 36,
      isDragging: false,
      pulsePhase: 0,
    };

    this.rainbow = {
      active: false,
      startX: 80,
      startY: 90,
      endX: 320,
      endY: 450,
      controlY: 20,
      alpha: 0,
    };
  }

  public init(width: number, height: number, dpr: number = 1) {
    this.width = width;
    this.height = height;
    this.dpr = dpr;

    this.initGround();
    this.resetWorldForAge(this.age);
  }

  public initGround() {
    const numPoints = 25;
    this.groundPoints = [];
    const step = (this.width + 40) / (numPoints - 1);
    const baseY = this.height - 90;

    for (let i = 0; i < numPoints; i++) {
      const x = -20 + i * step;
      const baseOffset = Math.sin((i / numPoints) * Math.PI * 2) * 15;
      this.groundPoints.push({
        x,
        y: baseY + baseOffset,
        vy: 0,
        baseOffset,
      });
    }
  }

  public resetWorldForAge(age: WorldAge) {
    this.age = age;
    this.clouds = [];
    this.birds = [];
    this.trees = [];
    this.fruits = [];
    this.rocks = [];
    this.fish = [];
    this.chickens = [];
    this.castleBlocks = [];
    this.volcanoes = [];
    this.spaceships = [];
    this.particles = [];
    this.activeChallenge = null;
    this.dreamRule = 'NORMAL';
    this.mo.radius = 26;
    this.mo.mood = 'happy';
    this.mo.isEnormous = false;
    this.mo.isMicro = false;
    this.mo.x = this.width * 0.5;
    this.mo.y = this.height * 0.5;
    this.mo.vx = 0;
    this.mo.vy = 0;

    // Reset sun and rainbow
    this.sun.x = Math.max(70, this.width * 0.2);
    this.sun.y = 80;
    this.rainbow.active = false;
    this.rainbow.alpha = 0;

    // Spawn 2-3 fluffy interactive clouds
    for (let i = 0; i < 3; i++) {
      this.clouds.push(this.createCloud(60 + i * (this.width / 2.5), 80 + (i % 2) * 45));
    }

    // Spawn 2 whimsical trees
    this.trees.push({
      id: 'tree_1',
      x: this.width * 0.2,
      groundY: this.getGroundHeight(this.width * 0.2),
      height: 90,
      foliageRadius: 36,
      bendAngle: 0,
      targetAngle: 0,
      fruitCount: 4,
    });
    this.trees.push({
      id: 'tree_2',
      x: this.width * 0.8,
      groundY: this.getGroundHeight(this.width * 0.8),
      height: 105,
      foliageRadius: 42,
      bendAngle: 0,
      targetAngle: 0,
      fruitCount: 5,
    });

    // Spawn persistent fish in water pond
    const fishCount = Math.max(3, memoryStore.getData().persistentFishCount || 3);
    for (let i = 0; i < fishCount; i++) {
      this.fish.push({
        id: `fish_${i}`,
        x: this.width * 0.4 + (i - 1) * 35,
        y: this.height - 35 + (i % 2) * 12,
        vx: (Math.random() - 0.5) * 1.5,
        vy: 0,
        size: 14 + (i % 2) * 4,
        color: ['#38BDF8', '#F472B6', '#FB923C', '#A78BFA'][i % 4],
        swimPhase: Math.random() * Math.PI * 2,
      });
    }

    // Re-instantiate persistent ruins from past sessions (Mo Remembers!)
    const persistentData = memoryStore.getData();
    if (persistentData.persistentRuins.length > 0) {
      persistentData.persistentRuins.forEach((ruin, idx) => {
        for (let b = 0; b < Math.min(6, ruin.count); b++) {
          this.castleBlocks.push({
            id: `ruin_${idx}_${b}`,
            x: Math.min(this.width - 40, Math.max(40, ruin.x + (b % 3) * 22 - 20)),
            y: this.getGroundHeight(ruin.x) - 15 - Math.floor(b / 3) * 18,
            vx: (Math.random() - 0.5) * 0.2,
            vy: 0,
            width: 22,
            height: 16,
            rotation: (Math.random() - 0.5) * 0.3,
            vRot: 0,
            isRuined: true,
            color: '#64748B',
          });
        }
      });
    }

    // Re-instantiate persistent volcanoes
    if (persistentData.persistentVolcanoes.length > 0) {
      persistentData.persistentVolcanoes.forEach((vol, idx) => {
        this.volcanoes.push({
          id: `vol_${idx}`,
          x: Math.min(this.width - 60, Math.max(60, vol.x)),
          y: this.getGroundHeight(vol.x),
          width: 70,
          height: 65,
          eruptionTimer: 0,
          isErupting: false,
        });
      });
    }

    // Age-specific setups
    if (age === 2) {
      // Chaos mode: trigger initial chaos challenge
      this.startChaosChallenge('DONT_TOUCH_GROUND');
    } else if (age === 4) {
      // Impossible World
      this.dreamRule = 'ENORMOUS';
      this.spawnGiantAnt();
    } else if (age === 5) {
      // Creator Mode
      this.spawnCastle(this.width * 0.65, this.getGroundHeight(this.width * 0.65));
      if (this.volcanoes.length === 0) {
        this.spawnVolcano(this.width * 0.3, this.getGroundHeight(this.width * 0.3));
      }
    }
  }

  private createCloud(x: number, y: number): CloudEntity {
    return {
      id: 'cloud_' + Math.random().toString(36).substring(2, 7),
      x,
      y,
      vx: 0.25 + Math.random() * 0.2,
      vy: 0,
      radius: 34,
      isBurst: false,
      puffs: [
        { offsetX: 0, offsetY: 0, r: 30 },
        { offsetX: -22, offsetY: 6, r: 24 },
        { offsetX: 22, offsetY: 4, r: 26 },
        { offsetX: -10, offsetY: -12, r: 22 },
        { offsetX: 12, offsetY: -10, r: 20 },
      ],
    };
  }

  public setVibe(vibe: VibeMode) {
    this.vibe = vibe;
    soundEngine.setVibe(vibe);
    memoryStore.setVibe(vibe);
  }

  // --- ACTIONS & GESTURES ---

  public handleTap(x: number, y: number) {
    this.sessionTouches++;
    memoryStore.incrementStat('totalTouches');
    memoryStore.unlockAchievement('first_touch');

    // Tool overrides for Age 3 & 5
    if (this.activeTool === 'WATER') {
      this.spawnWaterAt(x, y);
      return;
    }
    if (this.activeTool === 'FIRE') {
      this.spawnFireAt(x, y);
      return;
    }
    if (this.activeTool === 'CASTLE') {
      this.spawnCastle(x, y);
      return;
    }
    if (this.activeTool === 'CHICKEN') {
      this.spawnChicken(x, y, Math.random() < 0.25);
      return;
    }
    if (this.activeTool === 'VOLCANO') {
      this.spawnVolcano(x, y);
      return;
    }
    if (this.activeTool === 'SPACESHIP') {
      this.spawnSpaceship(x, y);
      return;
    }

    // Check tapping Sun
    const dSun = Math.hypot(x - this.sun.x, y - this.sun.y);
    if (dSun < this.sun.radius * 1.5) {
      soundEngine.playSunTouch();
      this.sun.pulsePhase = Math.PI * 2;
      this.spawnSparkles(this.sun.x, this.sun.y, '#FDE047', 15);
      return;
    }

    // Check tapping Rainbow
    if (this.rainbow.active && this.rainbow.alpha > 0.5) {
      const rx = (this.rainbow.startX + this.rainbow.endX) / 2;
      const ry = this.rainbow.controlY + 30;
      if (Math.hypot(x - rx, y - ry) < 80) {
        this.launchMoIntoOrbit();
        return;
      }
    }

    // Check tapping Clouds -> bursts into birds!
    for (const cloud of this.clouds) {
      if (!cloud.isBurst && Math.hypot(x - cloud.x, y - cloud.y) < cloud.radius * 1.4) {
        this.burstCloud(cloud);
        return;
      }
    }

    // Check tapping Trees -> throws fruit!
    for (const tree of this.trees) {
      const foliageY = tree.groundY - tree.height;
      if (Math.hypot(x - tree.x, y - foliageY) < tree.foliageRadius * 1.3) {
        this.shakeTree(tree);
        return;
      }
    }

    // Check tapping Mo
    const dMo = Math.hypot(x - this.mo.x, y - this.mo.y);
    if (dMo < this.mo.radius * 1.5) {
      this.bounceMo();
      return;
    }

    // Check tapping Chickens
    for (const chicken of this.chickens) {
      if (Math.hypot(x - chicken.x, y - chicken.y) < chicken.size * 1.5) {
        soundEngine.playChickenCluck(chicken.isGiant ? 0.6 : 1.2);
        chicken.vy = -7;
        chicken.vx = (Math.random() - 0.5) * 8;
        if (chicken.isBomb && chicken.fuseTimer > 0) {
          chicken.fuseTimer = 10; // accelerate boom!
        }
        return;
      }
    }

    // Check tapping Volcano
    for (const vol of this.volcanoes) {
      if (Math.abs(x - vol.x) < vol.width / 2 && y > vol.y - vol.height && y < vol.y + 10) {
        this.triggerVolcano(vol);
        return;
      }
    }

    // Check tapping Spaceship
    for (const ship of this.spaceships) {
      if (!ship.isLaunched && Math.hypot(x - ship.x, y - ship.y) < 35) {
        ship.isLaunched = true;
        soundEngine.playMoLaunch();
        return;
      }
    }

    // Tap Dream Rule: Enormous
    if (this.dreamRule === 'ENORMOUS') {
      this.enlargeNear(x, y);
    }

    // Otherwise ripple the ground or create splash
    this.impactGround(x, 15);
    this.spawnSparkles(x, y, '#60A5FA', 6);
    soundEngine.playWaterSplash();
  }

  public burstCloud(cloud: CloudEntity) {
    cloud.isBurst = true;
    soundEngine.playCloudBurst();
    memoryStore.unlockAchievement('cloud_burst');

    // Spawn flock of birds
    const count = 5 + Math.floor(Math.random() * 3);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      this.birds.push({
        id: 'bird_' + Math.random().toString(36).substring(2, 7),
        x: cloud.x + Math.cos(angle) * 15,
        y: cloud.y + Math.sin(angle) * 15,
        vx: Math.cos(angle) * (2 + Math.random() * 2),
        vy: Math.sin(angle) * (2 + Math.random() * 2) - 1,
        wingPhase: Math.random() * Math.PI * 2,
        color: ['#38BDF8', '#60A5FA', '#818CF8', '#A78BFA'][i % 4],
      });
    }

    this.spawnSparkles(cloud.x, cloud.y, '#FFFFFF', 20);

    // Slowly respawn a new cloud after a delay
    setTimeout(() => {
      if (this.clouds.includes(cloud)) {
        this.clouds = this.clouds.filter(c => c !== cloud);
        this.clouds.push(this.createCloud(-50, 70 + Math.random() * 50));
      }
    }, 4500);
  }

  public shakeTree(tree: TreeEntity) {
    tree.targetAngle = (Math.random() - 0.5) * 0.4;
    soundEngine.playFruitDrop();

    if (tree.fruitCount > 0) {
      tree.fruitCount--;
      const fruitType: 'apple' | 'pear' | 'cherry' = ['apple', 'pear', 'cherry'][Math.floor(Math.random() * 3)] as 'apple' | 'pear' | 'cherry';
      const colors = { apple: '#EF4444', pear: '#84CC16', cherry: '#DC2626' };
      const foliageY = tree.groundY - tree.height;

      this.fruits.push({
        id: 'fruit_' + Date.now() + Math.random(),
        x: tree.x + (Math.random() - 0.5) * tree.foliageRadius,
        y: foliageY + (Math.random() - 0.5) * 10,
        vx: (Math.random() - 0.5) * 4,
        vy: -2,
        radius: 10,
        type: fruitType,
        color: colors[fruitType],
      });
    }

    // Shake animation reset
    setTimeout(() => {
      tree.targetAngle = 0;
    }, 300);
  }

  public bounceMo() {
    this.mo.vy = -12;
    this.mo.vx += (Math.random() - 0.5) * 6;
    this.mo.squishX = 0.7;
    this.mo.squishY = 1.4;
    this.mo.mood = 'bouncy';
    soundEngine.playMoBounce();

    if (this.activeChallenge && this.activeChallenge.id === 'DONT_TOUCH_GROUND') {
      this.activeChallenge.progress++;
    }
  }

  public launchMoIntoOrbit() {
    this.mo.vy = -24;
    this.mo.vx = (Math.random() - 0.5) * 4;
    this.mo.mood = 'flying';
    soundEngine.playMoLaunch();
    this.sessionLaunches++;
    memoryStore.incrementStat('moLaunches');
    memoryStore.unlockAchievement('rainbow_launch');

    confetti({
      particleCount: 50,
      spread: 70,
      origin: { y: 0.6 },
    });

    for (let i = 0; i < 25; i++) {
      this.particles.push({
        x: this.mo.x,
        y: this.mo.y,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        size: 4 + Math.random() * 6,
        color: ['#F43F5E', '#FB923C', '#FBBF24', '#34D399', '#38BDF8', '#A855F7'][i % 6],
        alpha: 1,
        life: 0,
        maxLife: 40,
        type: 'feather_rainbow',
      });
    }
  }

  public bendGroundAt(x: number, vyDelta: number) {
    for (const pt of this.groundPoints) {
      const dist = Math.abs(pt.x - x);
      if (dist < 100) {
        const falloff = 1 - dist / 100;
        pt.vy += vyDelta * falloff;
      }
    }
  }

  public impactGround(x: number, force: number) {
    this.bendGroundAt(x, force);
  }

  public spawnSparkles(x: number, y: number, color: string, count: number = 8) {
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        size: 3 + Math.random() * 4,
        color,
        alpha: 1,
        life: 0,
        maxLife: 30 + Math.random() * 20,
        type: 'spark',
      });
    }
  }

  // --- BIRDS & RAINBOW ---

  public directBirdsTo(targetX: number, targetY: number) {
    for (const bird of this.birds) {
      bird.targetX = targetX + (Math.random() - 0.5) * 40;
      bird.targetY = targetY + (Math.random() - 0.5) * 40;
    }

    // Check if birds reached the sun
    const dSun = Math.hypot(targetX - this.sun.x, targetY - this.sun.y);
    if (dSun < 60 && this.birds.length >= 3) {
      this.triggerRainbow();
    }
  }

  public triggerRainbow() {
    if (this.rainbow.active) return;
    this.rainbow.active = true;
    this.rainbow.startX = this.sun.x;
    this.rainbow.startY = this.sun.y;
    this.rainbow.endX = this.width - 50;
    this.rainbow.endY = this.height - 120;
    this.rainbow.controlY = 40;
    this.rainbow.alpha = 1;

    soundEngine.playSunTouch();
    soundEngine.playFanfare();

    confetti({
      particleCount: 60,
      spread: 80,
      origin: { x: this.sun.x / this.width, y: this.sun.y / this.height },
    });
  }

  // --- CHAOS LEVEL CHALLENGES ---

  public startChaosChallenge(type: 'DONT_TOUCH_GROUND' | 'MAKE_10_FLY' | 'GIANT_CHICKEN') {
    if (type === 'DONT_TOUCH_GROUND') {
      this.activeChallenge = {
        id: 'DONT_TOUCH_GROUND',
        title: "DON'T LET MO TOUCH THE GROUND!",
        subtext: 'Tap Mo, bounce on clouds, survive the chaos!',
        duration: 30,
        timeRemaining: 30,
        completed: false,
        failed: false,
        progress: 0,
        target: 30,
      };
      this.mo.vy = -12;
      // Spawn falling rocks
      this.spawnFallingRocks();
    } else if (type === 'MAKE_10_FLY') {
      this.activeChallenge = {
        id: 'MAKE_10_FLY',
        title: 'MAKE 10 THINGS FLY!',
        subtext: 'Swipe upward to launch objects into orbit!',
        duration: 25,
        timeRemaining: 25,
        completed: false,
        failed: false,
        progress: 0,
        target: 10,
      };
      this.flyingCount = 0;
    } else if (type === 'GIANT_CHICKEN') {
      this.activeChallenge = {
        id: 'GIANT_CHICKEN',
        title: 'SURVIVE THE GIANT CHICKEN! 🐔',
        subtext: 'A gigantic chicken has entered the world! Dodge the egg bombs!',
        duration: 35,
        timeRemaining: 35,
        completed: false,
        failed: false,
        progress: 0,
        target: 35,
      };
      this.spawnGiantChicken();
    }
  }

  public spawnFallingRocks() {
    for (let i = 0; i < 4; i++) {
      const rockRadius = 14 + Math.random() * 12;
      const pts = [];
      const numPts = 7;
      for (let p = 0; p < numPts; p++) {
        pts.push({
          angle: (p / numPts) * Math.PI * 2,
          dist: rockRadius * (0.8 + Math.random() * 0.4),
        });
      }
      this.rocks.push({
        id: 'rock_' + Math.random(),
        x: 40 + Math.random() * (this.width - 80),
        y: -30 - i * 60,
        vx: (Math.random() - 0.5) * 3,
        vy: 2 + Math.random() * 3,
        radius: rockRadius,
        points: pts,
      });
    }
  }

  public spawnGiantChicken() {
    this.chickens.push({
      id: 'giant_chicken_boss',
      x: this.width * 0.8,
      y: this.getGroundHeight(this.width * 0.8) - 45,
      vx: -1.5,
      vy: 0,
      size: 55,
      isBomb: false,
      fuseTimer: 9999,
      legPhase: 0,
      isGiant: true,
      eggTimer: 90,
    });
    soundEngine.playChickenCluck(0.5);
  }

  public spawnChicken(x: number, y: number, isBomb = false) {
    this.chickens.push({
      id: 'chicken_' + Math.random().toString(36).substring(2, 7),
      x,
      y,
      vx: (Math.random() - 0.5) * 4,
      vy: -4 - Math.random() * 4,
      size: 18 + Math.random() * 6,
      isBomb,
      fuseTimer: isBomb ? 180 : 0,
      legPhase: 0,
    });
    soundEngine.playChickenCluck(isBomb ? 1.5 : 1);
  }

  public release500Chickens() {
    memoryStore.unlockAchievement('chicken_500');
    soundEngine.playChickenCluck(1.3);

    // Spawn 100 physics chickens immediately for extreme lag-free mobile performance
    for (let i = 0; i < 70; i++) {
      setTimeout(() => {
        this.spawnChicken(
          this.width * 0.1 + Math.random() * (this.width * 0.8),
          -10 - Math.random() * 100,
          Math.random() < 0.15
        );
      }, i * 35);
    }
  }

  // --- WORLD POWERS (AGE 3 & 5) ---

  public spawnCastle(x: number, groundY: number) {
    const rows = 4;
    const cols = 4;
    const bW = 24;
    const bH = 18;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.castleBlocks.push({
          id: `castle_${Date.now()}_${r}_${c}`,
          x: x - (cols * bW) / 2 + c * bW + (r % 2 === 1 ? bW / 4 : 0),
          y: groundY - (rows - r) * bH,
          vx: 0,
          vy: 0,
          width: bW,
          height: bH,
          rotation: 0,
          vRot: 0,
          isRuined: false,
          color: ['#64748B', '#475569', '#334155'][r % 3],
        });
      }
    }
    soundEngine.playFruitDrop();
  }

  public spawnVolcano(x: number, y: number) {
    const vol: VolcanoEntity = {
      id: 'volcano_' + Date.now(),
      x,
      y,
      width: 75,
      height: 70,
      eruptionTimer: 0,
      isErupting: false,
    };
    this.volcanoes.push(vol);
    memoryStore.recordPersistentVolcano(x, y);
    soundEngine.playFruitDrop();
  }

  public triggerVolcano(vol: VolcanoEntity) {
    vol.isErupting = true;
    vol.eruptionTimer = 180;
    soundEngine.playBoom();
    memoryStore.incrementStat('volcanoesErupted');

    // Spew fiery rocks & lava
    for (let i = 0; i < 15; i++) {
      this.particles.push({
        x: vol.x,
        y: vol.y - vol.height + 5,
        vx: (Math.random() - 0.5) * 10,
        vy: -8 - Math.random() * 8,
        size: 5 + Math.random() * 6,
        color: ['#EF4444', '#F97316', '#FBBF24'][i % 3],
        alpha: 1,
        life: 0,
        maxLife: 60,
        type: 'fire',
      });
    }

    // Spew an actual projectile rock
    const rockRadius = 14;
    const pts = [];
    for (let p = 0; p < 7; p++) {
      pts.push({ angle: (p / 7) * Math.PI * 2, dist: rockRadius * 0.9 });
    }
    this.rocks.push({
      id: 'lava_rock_' + Date.now(),
      x: vol.x,
      y: vol.y - vol.height,
      vx: (Math.random() - 0.5) * 8,
      vy: -14,
      radius: rockRadius,
      points: pts,
    });
  }

  public spawnSpaceship(x: number, y: number) {
    this.spaceships.push({
      id: 'ship_' + Date.now(),
      x,
      y,
      vx: 0,
      vy: 0,
      isLaunched: false,
      thrustFlame: 0,
    });
  }

  public spawnWaterAt(x: number, y: number) {
    soundEngine.playWaterSplash();
    for (let i = 0; i < 10; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 20,
        y: y + (Math.random() - 0.5) * 20,
        vx: (Math.random() - 0.5) * 4,
        vy: 2 + Math.random() * 4,
        size: 6 + Math.random() * 4,
        color: '#38BDF8',
        alpha: 0.8,
        life: 0,
        maxLife: 90,
        type: 'water',
      });
    }
  }

  public spawnFireAt(x: number, y: number) {
    soundEngine.playFireIgnite();
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 15,
        y: y + (Math.random() - 0.5) * 15,
        vx: (Math.random() - 0.5) * 3,
        vy: -2 - Math.random() * 3,
        size: 5 + Math.random() * 5,
        color: ['#EF4444', '#F97316', '#FBBF24'][i % 3],
        alpha: 1,
        life: 0,
        maxLife: 40,
        type: 'fire',
      });
    }
  }

  // --- DREAM WORLD (AGE 4) ---

  public enlargeNear(x: number, y: number) {
    // Check fruit
    for (const fruit of this.fruits) {
      if (Math.hypot(x - fruit.x, y - fruit.y) < 40 && !fruit.isEnormous) {
        fruit.isEnormous = true;
        fruit.radius *= 3;
        soundEngine.playGiantAntEnormous();
        return;
      }
    }
    // Check fish
    for (const f of this.fish) {
      if (Math.hypot(x - f.x, y - f.y) < 40 && !f.isEnormous) {
        f.isEnormous = true;
        f.size *= 3.5;
        soundEngine.playGiantAntEnormous();
        return;
      }
    }
    // Check Mo
    if (Math.hypot(x - this.mo.x, y - this.mo.y) < 50) {
      this.mo.isEnormous = !this.mo.isEnormous;
      this.mo.radius = this.mo.isEnormous ? 65 : 26;
      soundEngine.playGiantAntEnormous();
    }
  }

  public spawnGiantAnt() {
    this.giantAnt = {
      x: -40,
      y: this.getGroundHeight(0) - 25,
      vx: 2.2,
      vy: 0,
      size: 38,
      active: true,
    };
    memoryStore.unlockAchievement('giant_ant');
  }

  // --- TIME REWIND ENGINE ---

  public rewindTime() {
    this.isTimeRewinding = true;
    soundEngine.playTimeRewind();
    memoryStore.unlockAchievement('time_bender');

    if (this.history.length > 0) {
      const prev = this.history.pop()!;
      this.mo.x = prev.mo.x;
      this.mo.y = prev.mo.y;
      this.mo.vx = -prev.mo.vx * 0.5;
      this.mo.vy = -prev.mo.vy * 0.5;
      this.mo.rotation = prev.mo.rotation;

      // Rewind fruits
      for (const f of prev.fruits) {
        const fruit = this.fruits.find(fr => fr.id === f.id);
        if (fruit) {
          fruit.x = f.x;
          fruit.y = f.y;
          fruit.vx = -f.vx * 0.5;
          fruit.vy = -f.vy * 0.5;
        }
      }

      // Rewind blocks
      for (const b of prev.blocks) {
        const block = this.castleBlocks.find(bl => bl.id === b.id);
        if (block) {
          block.x = b.x;
          block.y = b.y;
          block.vx = -b.vx * 0.5;
          block.vy = -b.vy * 0.5;
          block.rotation = b.rotation;
        }
      }
    }
  }

  private recordHistory() {
    if (this.isTimeRewinding) return;

    this.history.push({
      mo: { x: this.mo.x, y: this.mo.y, vx: this.mo.vx, vy: this.mo.vy, rotation: this.mo.rotation },
      fruits: this.fruits.slice(0, 10).map(f => ({ id: f.id, x: f.x, y: f.y, vx: f.vx, vy: f.vy })),
      blocks: this.castleBlocks.slice(0, 16).map(b => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, rotation: b.rotation })),
      chickens: this.chickens.slice(0, 10).map(c => ({ id: c.id, x: c.x, y: c.y, vx: c.vx, vy: c.vy })),
    });

    if (this.history.length > this.maxHistory) {
      this.history.shift();
    }
  }

  // --- MAIN PHYSICS UPDATE TICK ---

  public update(dt: number) {
    if (this.isTimeRewinding) {
      this.rewindTime();
      return;
    }

    const timeScale = this.isSlowMoHold ? 0.25 : this.timeDilation;
    const effectiveDt = dt * timeScale;

    // Vibe modifications
    const vibeSpeed = this.vibe === 'INSANE' ? 1.4 : this.vibe === 'CRAZY' ? 1.15 : 0.95;
    const actualDt = effectiveDt * vibeSpeed;

    this.recordHistory();

    // 1. Update ground spring physics
    for (const pt of this.groundPoints) {
      const springForce = (this.height - 90 + pt.baseOffset - pt.y) * 0.08;
      pt.vy = (pt.vy + springForce) * 0.88;
      pt.y += pt.vy * actualDt;
    }

    // 2. Update Sun
    this.sun.pulsePhase += 0.04 * actualDt;

    // 3. Update Rainbow
    if (this.rainbow.active) {
      this.rainbow.alpha = Math.min(1, this.rainbow.alpha + 0.02 * actualDt);
    }

    // 4. Update Clouds
    for (const cloud of this.clouds) {
      if (!cloud.isBurst) {
        cloud.x += cloud.vx * actualDt;
        if (cloud.x > this.width + 60) {
          cloud.x = -60;
        }
      }
    }

    // 5. Update Birds
    for (let i = this.birds.length - 1; i >= 0; i--) {
      const bird = this.birds[i];
      bird.wingPhase += 0.25 * actualDt;

      if (bird.targetX !== undefined && bird.targetY !== undefined) {
        const dx = bird.targetX - bird.x;
        const dy = bird.targetY - bird.y;
        bird.vx += dx * 0.02 * actualDt;
        bird.vy += dy * 0.02 * actualDt;
      } else {
        bird.vx += (Math.random() - 0.5) * 0.2;
        bird.vy += (Math.random() - 0.5) * 0.2;
      }

      // Drag
      bird.vx *= 0.94;
      bird.vy *= 0.94;
      bird.x += bird.vx * actualDt;
      bird.y += bird.vy * actualDt;

      // Wrap
      if (bird.x < -30) bird.x = this.width + 20;
      if (bird.x > this.width + 30) bird.x = -20;
    }

    // 6. Update Trees
    for (const tree of this.trees) {
      const angleDiff = tree.targetAngle - tree.bendAngle;
      tree.bendAngle += angleDiff * 0.15 * actualDt;
      tree.groundY = this.getGroundHeight(tree.x);
    }

    // 7. Update Mo
    this.updateMo(actualDt);

    // 8. Update Fruits & Rocks
    this.updateFruitsAndRocks(actualDt);

    // 9. Update Chickens & Bombs
    this.updateChickens(actualDt);

    // 10. Update Castle Blocks
    this.updateCastleBlocks(actualDt);

    // 11. Update Volcanoes & Spaceships
    this.updateVolcanoesAndSpaceships(actualDt);

    // 12. Update Giant Ant & Giant Hand (Dream Mode)
    this.updateDreamEntities(actualDt);

    // 13. Update Fish
    for (const f of this.fish) {
      f.swimPhase += 0.1 * actualDt;
      f.x += f.vx * actualDt;
      f.y += Math.sin(f.swimPhase) * 0.4 * actualDt;

      // Keep in pond
      if (f.x < this.width * 0.25) f.vx = Math.abs(f.vx);
      if (f.x > this.width * 0.75) f.vx = -Math.abs(f.vx);
    }

    // 14. Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * actualDt;
      p.y += p.vy * actualDt;
      p.life += actualDt;
      p.alpha = Math.max(0, 1 - p.life / p.maxLife);
      if (p.type === 'fire') {
        p.vy -= 0.08 * actualDt;
        p.size *= 0.98;
      }
      if (p.life >= p.maxLife) {
        this.particles.splice(i, 1);
      }
    }

    // 15. Update Challenge Progress
    if (this.activeChallenge && !this.activeChallenge.completed && !this.activeChallenge.failed) {
      this.activeChallenge.timeRemaining -= (dt / 60);

      if (this.activeChallenge.id === 'DONT_TOUCH_GROUND') {
        if (this.mo.isGrounded) {
          this.activeChallenge.failed = true;
          soundEngine.playBoom();
        } else if (this.activeChallenge.timeRemaining <= 0) {
          this.activeChallenge.completed = true;
          soundEngine.playFanfare();
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        }
      } else if (this.activeChallenge.id === 'MAKE_10_FLY') {
        this.activeChallenge.progress = this.flyingCount;
        if (this.flyingCount >= this.activeChallenge.target) {
          this.activeChallenge.completed = true;
          soundEngine.playFanfare();
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        } else if (this.activeChallenge.timeRemaining <= 0) {
          this.activeChallenge.failed = true;
        }
      } else if (this.activeChallenge.id === 'GIANT_CHICKEN') {
        if (this.activeChallenge.timeRemaining <= 0) {
          this.activeChallenge.completed = true;
          soundEngine.playFanfare();
          confetti({ particleCount: 70, spread: 80, origin: { y: 0.5 } });
        }
      }
    }

    // Insane mode random meteor falling
    if (this.vibe === 'INSANE' && Math.random() < 0.015) {
      this.spawnMeteor();
    }
  }

  private updateMo(dt: number) {
    if (this.isDraggingMo) {
      this.mo.tailTrail.unshift({ x: this.mo.x, y: this.mo.y, alpha: 0.8 });
      if (this.mo.tailTrail.length > 8) this.mo.tailTrail.pop();
      return;
    }

    // Apply gravity (or invert if Upside-Down world)
    const effectiveGrav = this.dreamRule === 'UPSIDE_DOWN' ? -this.gravityY : this.gravityY;
    this.mo.vy += effectiveGrav * dt;
    this.mo.vx += this.gravityX * dt;

    // Movement damping
    this.mo.vx *= 0.98;
    this.mo.vy *= 0.99;

    this.mo.x += this.mo.vx * dt;
    this.mo.y += this.mo.vy * dt;

    // Ground collision
    const groundY = this.getGroundHeight(this.mo.x);
    const bottomLimit = groundY - this.mo.radius;
    const topLimit = this.dreamRule === 'UPSIDE_DOWN' ? 60 + this.mo.radius : 20 + this.mo.radius;

    if (this.dreamRule !== 'UPSIDE_DOWN') {
      if (this.mo.y >= bottomLimit) {
        this.mo.y = bottomLimit;
        if (this.mo.vy > 3) {
          soundEngine.playMoBounce(Math.min(2, this.mo.vy / 6));
          this.impactGround(this.mo.x, this.mo.vy * 0.8);
          this.mo.squishX = 1.35;
          this.mo.squishY = 0.65;
        }
        this.mo.vy = -this.mo.vy * 0.45;
        this.mo.isGrounded = true;
      } else {
        this.mo.isGrounded = false;
      }
    } else {
      // Upside down ceiling/cloud collision
      if (this.mo.y <= topLimit) {
        this.mo.y = topLimit;
        this.mo.vy = -this.mo.vy * 0.45;
        this.mo.isGrounded = true;
      } else {
        this.mo.isGrounded = false;
      }
    }

    // Screen bounds horizontal bounce
    if (this.mo.x < this.mo.radius) {
      this.mo.x = this.mo.radius;
      this.mo.vx = Math.abs(this.mo.vx) * 0.7;
    } else if (this.mo.x > this.width - this.mo.radius) {
      this.mo.x = this.width - this.mo.radius;
      this.mo.vx = -Math.abs(this.mo.vx) * 0.7;
    }

    // Squish spring return
    this.mo.squishX += (1 - this.mo.squishX) * 0.15 * dt;
    this.mo.squishY += (1 - this.mo.squishY) * 0.15 * dt;

    // Blink timer
    this.mo.blinkTimer -= dt;
    if (this.mo.blinkTimer <= 0) {
      this.mo.blinkTimer = 100 + Math.random() * 120;
    }

    // Tail trail
    if (Math.hypot(this.mo.vx, this.mo.vy) > 4) {
      this.mo.tailTrail.unshift({ x: this.mo.x, y: this.mo.y, alpha: 0.7 });
      if (this.mo.tailTrail.length > 8) this.mo.tailTrail.pop();
    } else if (this.mo.tailTrail.length > 0) {
      this.mo.tailTrail.pop();
    }
  }

  private updateFruitsAndRocks(dt: number) {
    // Fruits
    for (let i = this.fruits.length - 1; i >= 0; i--) {
      const f = this.fruits[i];
      f.vy += this.gravityY * dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;

      const gY = this.getGroundHeight(f.x);
      if (f.y >= gY - f.radius) {
        f.y = gY - f.radius;
        f.vy = -f.vy * 0.55;
        f.vx *= 0.85;
      }

      if (f.y < -100) {
        this.flyingCount++;
      }
    }

    // Rocks
    for (let i = this.rocks.length - 1; i >= 0; i--) {
      const r = this.rocks[i];
      r.vy += this.gravityY * 1.1 * dt;
      r.x += r.vx * dt;
      r.y += r.vy * dt;

      const gY = this.getGroundHeight(r.x);
      if (r.y >= gY - r.radius) {
        r.y = gY - r.radius;
        r.vy = -r.vy * 0.35;
        r.vx *= 0.85;
        this.impactGround(r.x, 8);
      }

      // Check collision with Mo
      if (Math.hypot(this.mo.x - r.x, this.mo.y - r.y) < this.mo.radius + r.radius) {
        soundEngine.playBoom();
        this.mo.vx += r.vx * 1.5;
        this.mo.vy += r.vy * 0.8 - 4;
        this.mo.mood = 'dizzy';
      }
    }
  }

  private updateChickens(dt: number) {
    for (let i = this.chickens.length - 1; i >= 0; i--) {
      const c = this.chickens[i];
      c.vy += this.gravityY * 0.8 * dt;
      c.legPhase += 0.25 * dt;

      c.x += c.vx * dt;
      c.y += c.vy * dt;

      const gY = this.getGroundHeight(c.x);
      if (c.y >= gY - c.size / 2) {
        c.y = gY - c.size / 2;
        c.vy = -c.vy * 0.4;
        c.vx *= 0.95;

        // Occasional hop
        if (Math.random() < 0.02) {
          c.vy = -4 - Math.random() * 3;
          c.vx = (Math.random() - 0.5) * 4;
          soundEngine.playChickenCluck(c.isGiant ? 0.5 : 1.2);
        }
      }

      // Giant chicken logic
      if (c.isGiant) {
        if (c.eggTimer !== undefined) {
          c.eggTimer -= dt;
          if (c.eggTimer <= 0) {
            c.eggTimer = 160 + Math.random() * 80;
            // Lay surprise bomb chicken
            this.spawnChicken(c.x, c.y + 10, true);
          }
        }
        // Patrol screen
        if (c.x < 60) c.vx = Math.abs(c.vx);
        if (c.x > this.width - 60) c.vx = -Math.abs(c.vx);
      }

      // Bomb countdown
      if (c.isBomb) {
        c.fuseTimer -= dt;
        if (c.fuseTimer <= 0) {
          // BOOM!
          soundEngine.playBoom();
          memoryStore.incrementStat('chickensExploded');
          memoryStore.unlockAchievement('chicken_bomb');
          this.impactGround(c.x, 25);

          // Knock back Mo if close
          const dMo = Math.hypot(this.mo.x - c.x, this.mo.y - c.y);
          if (dMo < 140) {
            this.mo.vx += ((this.mo.x - c.x) / dMo) * 16;
            this.mo.vy = -16;
            this.mo.mood = 'scared';
          }

          // Confetti & smoke
          for (let p = 0; p < 18; p++) {
            this.particles.push({
              x: c.x,
              y: c.y,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.5) * 12,
              size: 4 + Math.random() * 6,
              color: ['#EF4444', '#F97316', '#FBBF24', '#FFFFFF'][p % 4],
              alpha: 1,
              life: 0,
              maxLife: 45,
              type: 'feather',
            });
          }

          this.chickens.splice(i, 1);
        }
      }

      // Bounds
      if (c.x < 10) c.x = this.width - 10;
      if (c.x > this.width - 10) c.x = 10;
    }
  }

  private updateCastleBlocks(dt: number) {
    for (const b of this.castleBlocks) {
      b.vy += this.gravityY * dt;
      b.rotation += b.vRot * dt;

      b.x += b.vx * dt;
      b.y += b.vy * dt;

      const gY = this.getGroundHeight(b.x);
      if (b.y >= gY - b.height / 2) {
        b.y = gY - b.height / 2;
        b.vy = -b.vy * 0.25;
        b.vx *= 0.85;
        b.vRot *= 0.85;
      }

      // Collision with Mo to knock towers down
      const dMo = Math.hypot(this.mo.x - b.x, this.mo.y - b.y);
      if (dMo < this.mo.radius + b.width / 2) {
        b.vx += this.mo.vx * 0.9;
        b.vy += this.mo.vy * 0.7 - 2;
        b.vRot = (Math.random() - 0.5) * 0.4;
        if (!b.isRuined) {
          b.isRuined = true;
          memoryStore.incrementStat('blocksKnockedDown');
          memoryStore.recordPersistentRuin(b.x, b.y, this.castleBlocks.length);
          soundEngine.playFruitDrop();
        }
      }
    }
  }

  private updateVolcanoesAndSpaceships(dt: number) {
    for (const vol of this.volcanoes) {
      if (vol.isErupting) {
        vol.eruptionTimer -= dt;
        if (vol.eruptionTimer <= 0) {
          vol.isErupting = false;
        } else if (Math.random() < 0.3) {
          this.particles.push({
            x: vol.x + (Math.random() - 0.5) * 15,
            y: vol.y - vol.height,
            vx: (Math.random() - 0.5) * 4,
            vy: -4 - Math.random() * 4,
            size: 4 + Math.random() * 4,
            color: '#F97316',
            alpha: 1,
            life: 0,
            maxLife: 30,
            type: 'fire',
          });
        }
      }
    }

    for (let i = this.spaceships.length - 1; i >= 0; i--) {
      const ship = this.spaceships[i];
      if (ship.isLaunched) {
        ship.vy -= 0.6 * dt;
        ship.y += ship.vy * dt;
        ship.thrustFlame += 0.3 * dt;

        // Smoke & thrust
        this.particles.push({
          x: ship.x,
          y: ship.y + 25,
          vx: (Math.random() - 0.5) * 3,
          vy: 4 + Math.random() * 3,
          size: 5 + Math.random() * 5,
          color: '#FB923C',
          alpha: 1,
          life: 0,
          maxLife: 25,
          type: 'fire',
        });

        if (ship.y < -150) {
          this.spaceships.splice(i, 1);
        }
      }
    }
  }

  private updateDreamEntities(dt: number) {
    // Giant Ant
    if (this.giantAnt && this.giantAnt.active) {
      const dx = this.mo.x - this.giantAnt.x;
      this.giantAnt.vx = Math.sign(dx) * 2.4;
      this.giantAnt.x += this.giantAnt.vx * dt;
      this.giantAnt.y = this.getGroundHeight(this.giantAnt.x) - this.giantAnt.size / 2;

      // When ant catches Mo, tickles Mo into an enormous bounce!
      if (Math.hypot(this.mo.x - this.giantAnt.x, this.mo.y - this.giantAnt.y) < this.mo.radius + this.giantAnt.size / 2) {
        this.mo.vy = -18;
        this.mo.vx = (Math.random() - 0.5) * 12;
        this.mo.mood = 'scared';
        soundEngine.playGiantAntEnormous();
      }
    }

    // Tiny World Giant Hand
    if (this.dreamRule === 'TINY') {
      this.giantHand.active = true;
      this.giantHand.targetX = this.mo.x;
      this.giantHand.x += (this.giantHand.targetX - this.giantHand.x) * 0.08 * dt;
      this.giantHand.y += (140 - this.giantHand.y) * 0.05 * dt;
    } else {
      this.giantHand.active = false;
    }
  }

  private spawnMeteor() {
    this.rocks.push({
      id: 'meteor_' + Date.now(),
      x: Math.random() * this.width,
      y: -40,
      vx: (Math.random() - 0.5) * 8,
      vy: 10 + Math.random() * 6,
      radius: 20,
      points: [
        { angle: 0, dist: 22 },
        { angle: 1, dist: 18 },
        { angle: 2, dist: 24 },
        { angle: 3, dist: 16 },
        { angle: 4, dist: 20 },
      ],
    });
  }

  // --- HEIGHT MAP HELPER ---

  public getGroundHeight(x: number): number {
    if (this.groundPoints.length === 0) return this.height - 90;
    const step = (this.width + 40) / (this.groundPoints.length - 1);
    const relX = x + 20;
    const index = Math.max(0, Math.min(this.groundPoints.length - 2, Math.floor(relX / step)));
    const t = (relX - index * step) / step;

    const p0 = this.groundPoints[index].y;
    const p1 = this.groundPoints[index + 1].y;
    return p0 + (p1 - p0) * Math.max(0, Math.min(1, t));
  }
}
