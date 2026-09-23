export type WorldAge = 1 | 2 | 3 | 4 | 5;

export type VibeMode = 'RELAX' | 'CRAZY' | 'INSANE';

export type MoMood = 'happy' | 'bouncy' | 'flying' | 'dizzy' | 'scared' | 'asleep' | 'enormous' | 'micro';

export interface MoCreature {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mood: MoMood;
  squishX: number;
  squishY: number;
  rotation: number;
  isGrounded: boolean;
  tailTrail: { x: number; y: number; alpha: number }[];
  blinkTimer: number;
  lookTarget: { x: number; y: number } | null;
  runningSpeed: number;
  isEnormous: boolean;
  isMicro: boolean;
}

export interface CloudEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  puffs: { offsetX: number; offsetY: number; r: number }[];
  isBurst: boolean;
}

export interface SunEntity {
  x: number;
  y: number;
  radius: number;
  isDragging: boolean;
  pulsePhase: number;
}

export interface RainbowEntity {
  active: boolean;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  controlY: number;
  alpha: number;
}

export interface BirdEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX?: number;
  targetY?: number;
  wingPhase: number;
  color: string;
}

export interface TreeEntity {
  id: string;
  x: number;
  groundY: number;
  height: number;
  foliageRadius: number;
  bendAngle: number;
  targetAngle: number;
  fruitCount: number;
}

export interface FruitEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  type: 'apple' | 'pear' | 'cherry';
  color: string;
  isEnormous?: boolean;
}

export interface RockEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  points: { angle: number; dist: number }[];
}

export interface FishEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  swimPhase: number;
  isEnormous?: boolean;
}

export interface ChickenEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  isBomb: boolean;
  fuseTimer: number; // counts down when bomb
  legPhase: number;
  isGiant?: boolean;
  eggTimer?: number;
}

export interface CastleBlock {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  rotation: number;
  vRot: number;
  isRuined: boolean;
  color: string;
}

export interface VolcanoEntity {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  eruptionTimer: number;
  isErupting: boolean;
}

export interface SpaceshipEntity {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isLaunched: boolean;
  thrustFlame: number;
}

export interface ParticleEntity {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  type: 'spark' | 'smoke' | 'fire' | 'water' | 'star' | 'feather' | 'feather_rainbow';
}

export interface ActiveChallenge {
  id: string;
  title: string;
  subtext: string;
  duration: number;
  timeRemaining: number;
  completed: boolean;
  failed: boolean;
  progress: number;
  target: number;
}

export interface WorldSnapshot {
  id: string;
  timestamp: number;
  dateStr: string;
  title: string;
  age: WorldAge;
  vibe: VibeMode;
  notes: string[];
  stats: {
    totalTouches: number;
    moLaunches: number;
    chickensExploded: number;
    volcanoesErupted: number;
    blocksKnockedDown: number;
  };
  persistentRuins: { x: number; y: number; count: number }[];
  persistentVolcanoes: { x: number; y: number }[];
  persistentFish: number;
}

export type ActiveTool = 'POINTER' | 'WATER' | 'FIRE' | 'MOUNTAIN' | 'CASTLE' | 'CHICKEN' | 'VOLCANO' | 'SPACESHIP';
