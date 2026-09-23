import { WorldAge, VibeMode, WorldSnapshot } from '../types';

const STORAGE_KEY = 'evermotion_universe_data_v1';

export interface PersistentMemoryData {
  unlockedAge: WorldAge;
  selectedAge: WorldAge;
  vibe: VibeMode;
  totalTouches: number;
  moLaunches: number;
  chickensExploded: number;
  volcanoesErupted: number;
  blocksKnockedDown: number;
  snapshots: WorldSnapshot[];
  persistentRuins: { x: number; y: number; count: number }[];
  persistentVolcanoes: { x: number; y: number }[];
  persistentFishCount: number;
  achievements: {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: number;
  }[];
}

const DEFAULT_ACHIEVEMENTS = [
  { id: 'first_touch', title: 'The Awakening', description: 'Touch anything in the universe for the first time.', icon: '🟡' },
  { id: 'cloud_burst', title: 'Flock Unleashed', description: 'Tap a cloud to release the curious birds.', icon: '☁️' },
  { id: 'rainbow_launch', title: 'Rainbow Astronaut', description: 'Drag birds to the sun and launch Mo to the stratosphere!', icon: '🌈' },
  { id: 'time_bender', title: 'Chrono Weaver', description: 'Rewind time using the time dial or gesture.', icon: '⏰' },
  { id: 'chicken_bomb', title: 'Tick... Boom!', description: 'Witness a chicken turn out to be a hilarious surprise bomb.', icon: '🐔' },
  { id: 'giant_ant', title: 'Gulliver in Reverse', description: 'Make an ant grow enormous and survive the chase.', icon: '🐜' },
  { id: 'chicken_500', title: 'Chicken Apocalypse', description: 'Release 500 chickens in Creator Mode.', icon: '🥚' },
  { id: 'memory_keeper', title: 'The World Remembers', description: 'Return to a world that preserved your previous session.', icon: '📖' },
];

export class MemoryStore {
  private data: PersistentMemoryData;

  constructor() {
    this.data = this.load();
  }

  private load(): PersistentMemoryData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return {
          unlockedAge: parsed.unlockedAge || 1,
          selectedAge: parsed.selectedAge || 1,
          vibe: parsed.vibe || 'RELAX',
          totalTouches: parsed.totalTouches || 0,
          moLaunches: parsed.moLaunches || 0,
          chickensExploded: parsed.chickensExploded || 0,
          volcanoesErupted: parsed.volcanoesErupted || 0,
          blocksKnockedDown: parsed.blocksKnockedDown || 0,
          snapshots: parsed.snapshots || [],
          persistentRuins: parsed.persistentRuins || [],
          persistentVolcanoes: parsed.persistentVolcanoes || [],
          persistentFishCount: parsed.persistentFishCount || 0,
          achievements: DEFAULT_ACHIEVEMENTS.map(def => {
            const found = parsed.achievements?.find((a: { id: string }) => a.id === def.id);
            return found ? { ...def, unlockedAt: found.unlockedAt } : def;
          }),
        };
      }
    } catch {
      // Fallback
    }

    return {
      unlockedAge: 1,
      selectedAge: 1,
      vibe: 'RELAX',
      totalTouches: 0,
      moLaunches: 0,
      chickensExploded: 0,
      volcanoesErupted: 0,
      blocksKnockedDown: 0,
      snapshots: [
        {
          id: 'genesis',
          timestamp: Date.now() - 86400000,
          dateStr: 'Yesterday',
          title: 'The First Spark',
          age: 1,
          vibe: 'RELAX',
          notes: ['Mo awakened in an untouched world of green hills and open sky.'],
          stats: { totalTouches: 12, moLaunches: 1, chickensExploded: 0, volcanoesErupted: 0, blocksKnockedDown: 0 },
          persistentRuins: [],
          persistentVolcanoes: [],
          persistentFish: 2,
        },
      ],
      persistentRuins: [],
      persistentVolcanoes: [],
      persistentFishCount: 3,
      achievements: DEFAULT_ACHIEVEMENTS,
    };
  }

  public save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // storage quota or private mode
    }
  }

  public getData(): PersistentMemoryData {
    return this.data;
  }

  public unlockAge(age: WorldAge) {
    if (age > this.data.unlockedAge) {
      this.data.unlockedAge = age;
      this.save();
    }
  }

  public setSelectedAge(age: WorldAge) {
    this.data.selectedAge = age;
    this.save();
  }

  public setVibe(vibe: VibeMode) {
    this.data.vibe = vibe;
    this.save();
  }

  public incrementStat(key: 'totalTouches' | 'moLaunches' | 'chickensExploded' | 'volcanoesErupted' | 'blocksKnockedDown', amount = 1) {
    if (typeof this.data[key] === 'number') {
      this.data[key] += amount;
      this.save();
    }
  }

  public recordPersistentRuin(x: number, y: number, count: number) {
    this.data.persistentRuins.push({ x, y, count });
    if (this.data.persistentRuins.length > 10) {
      this.data.persistentRuins.shift();
    }
    this.save();
  }

  public recordPersistentVolcano(x: number, y: number) {
    this.data.persistentVolcanoes.push({ x, y });
    if (this.data.persistentVolcanoes.length > 5) {
      this.data.persistentVolcanoes.shift();
    }
    this.save();
  }

  public setPersistentFish(count: number) {
    this.data.persistentFishCount = count;
    this.save();
  }

  public unlockAchievement(id: string): boolean {
    const ach = this.data.achievements.find(a => a.id === id);
    if (ach && !ach.unlockedAt) {
      ach.unlockedAt = Date.now();
      this.save();
      return true;
    }
    return false;
  }

  public createSessionSnapshot(notes: string[]): WorldSnapshot {
    const snap: WorldSnapshot = {
      id: 'snap_' + Date.now(),
      timestamp: Date.now(),
      dateStr: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      title: `Universe Session #${this.data.snapshots.length + 1}`,
      age: this.data.selectedAge,
      vibe: this.data.vibe,
      notes,
      stats: {
        totalTouches: this.data.totalTouches,
        moLaunches: this.data.moLaunches,
        chickensExploded: this.data.chickensExploded,
        volcanoesErupted: this.data.volcanoesErupted,
        blocksKnockedDown: this.data.blocksKnockedDown,
      },
      persistentRuins: [...this.data.persistentRuins],
      persistentVolcanoes: [...this.data.persistentVolcanoes],
      persistentFish: this.data.persistentFishCount,
    };

    this.data.snapshots.unshift(snap);
    if (this.data.snapshots.length > 20) {
      this.data.snapshots.pop();
    }
    this.save();
    return snap;
  }

  public clearAllMemories() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = this.load();
    this.save();
  }
}

export const memoryStore = new MemoryStore();
