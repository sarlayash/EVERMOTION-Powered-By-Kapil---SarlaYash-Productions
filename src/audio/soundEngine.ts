/**
 * EVERMOTION Offline Web Audio Synthesizer
 * 100% Client-Side procedural sound effects & generative ambient music.
 * Zero external network dependencies, instant latency-free feedback.
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private volume: number = 0.7;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMusicPlaying: boolean = false;
  private musicTimer: number | null = null;
  private currentVibe: 'RELAX' | 'CRAZY' | 'INSANE' = 'RELAX';

  constructor() {
    // AudioContext will be initialized on first user interaction
    const savedMute = localStorage.getItem('evermotion_muted');
    if (savedMute !== null) {
      this.isMuted = savedMute === 'true';
    }
  }

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = this.isMuted ? 0 : this.volume;
      this.sfxGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = this.isMuted ? 0 : this.volume * 0.35;
      this.musicGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    localStorage.setItem('evermotion_muted', String(muted));
    if (this.sfxGain && this.musicGain) {
      const targetSfx = muted ? 0 : this.volume;
      const targetMusic = muted ? 0 : this.volume * 0.35;
      this.sfxGain.gain.setValueAtTime(targetSfx, this.ctx?.currentTime || 0);
      this.musicGain.gain.setValueAtTime(targetMusic, this.ctx?.currentTime || 0);
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (!this.isMuted && this.sfxGain && this.musicGain) {
      this.sfxGain.gain.setValueAtTime(this.volume, this.ctx?.currentTime || 0);
      this.musicGain.gain.setValueAtTime(this.volume * 0.35, this.ctx?.currentTime || 0);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  // --- SOUND EFFECTS ---

  public playMoBounce(pitchRatio: number = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;

    osc.type = 'sine';
    const baseFreq = 240 * Math.max(0.5, Math.min(2.5, pitchRatio));
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 2.1, now + 0.08);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.8, now + 0.22);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.25);

    // Haptic feedback
    if (navigator.vibrate) {
      navigator.vibrate(12);
    }
  }

  public playMoLaunch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.6);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.65);

    // Play sparkling harp notes in arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
    notes.forEach((freq, idx) => {
      const harpOsc = this.ctx!.createOscillator();
      const harpGain = this.ctx!.createGain();
      const noteTime = now + 0.15 + idx * 0.09;

      harpOsc.type = 'sine';
      harpOsc.frequency.setValueAtTime(freq, noteTime);

      harpGain.gain.setValueAtTime(0.3, noteTime);
      harpGain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.4);

      harpOsc.connect(harpGain);
      harpGain.connect(this.sfxGain!);

      harpOsc.start(noteTime);
      harpOsc.stop(noteTime + 0.4);
    });

    if (navigator.vibrate) {
      navigator.vibrate([30, 40, 60]);
    }
  }

  public playSunTouch() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const chord = [392.0, 493.88, 587.33, 783.99]; // G major 7 warmth
    chord.forEach((freq, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.04);

      gain.gain.setValueAtTime(0.2, now + i * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + i * 0.04);
      osc.stop(now + 0.7);
    });
  }

  public playCloudBurst() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Pop
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(450, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.12);
    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);

    // Chime flock
    for (let i = 0; i < 4; i++) {
      const birdChirp = this.ctx.createOscillator();
      const chirpGain = this.ctx.createGain();
      const startT = now + 0.05 + i * 0.04;
      birdChirp.type = 'sine';
      birdChirp.frequency.setValueAtTime(1100 + i * 180, startT);
      birdChirp.frequency.linearRampToValueAtTime(1700 + i * 200, startT + 0.08);

      chirpGain.gain.setValueAtTime(0.18, startT);
      chirpGain.gain.exponentialRampToValueAtTime(0.001, startT + 0.12);

      birdChirp.connect(chirpGain);
      chirpGain.connect(this.sfxGain);
      birdChirp.start(startT);
      birdChirp.stop(startT + 0.12);
    }

    if (navigator.vibrate) navigator.vibrate(20);
  }

  public playFruitDrop() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(160, now + 0.09);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.11);
  }

  public playWaterSplash() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = now + i * 0.03;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(300 + Math.random() * 200, t);
      osc.frequency.exponentialRampToValueAtTime(150, t + 0.1);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.005, t + 0.15);

      osc.connect(gain);
      gain.connect(this.sfxGain);
      osc.start(t);
      osc.stop(t + 0.15);
    }
  }

  public playChickenCluck(pitchMod = 1) {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    const base = 480 * pitchMod;
    osc.frequency.setValueAtTime(base, now);
    osc.frequency.linearRampToValueAtTime(base * 1.5, now + 0.06);
    osc.frequency.linearRampToValueAtTime(base * 0.9, now + 0.14);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.16);
  }

  public playBoom() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Low punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.45);

    gain.gain.setValueAtTime(0.8, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);

    // Noise crackle
    const bufferSize = this.ctx.sampleRate * 0.3;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.4));
    }
    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(now);

    if (navigator.vibrate) {
      navigator.vibrate([50, 30, 80]);
    }
  }

  public playTimeRewind() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);

    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.005, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playFireIgnite() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.linearRampToValueAtTime(320, now + 0.08);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  public playGiantAntEnormous() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.4);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playFanfare() {
    if (this.isMuted) return;
    this.initContext();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const melody = [523.25, 659.25, 783.99, 1046.5];
    melody.forEach((f, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      const t = now + idx * 0.1;
      osc.type = 'sine';
      osc.frequency.setValueAtTime(f, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  // --- AMBIENT GENERATIVE MUSIC LOOP ---

  public setVibe(vibe: 'RELAX' | 'CRAZY' | 'INSANE') {
    this.currentVibe = vibe;
  }

  public startGenerativeMusic() {
    if (this.isMusicPlaying) return;
    this.initContext();
    this.isMusicPlaying = true;
    this.scheduleNextAmbientNote();
  }

  public stopGenerativeMusic() {
    this.isMusicPlaying = false;
    if (this.musicTimer !== null) {
      window.clearTimeout(this.musicTimer);
      this.musicTimer = null;
    }
  }

  private scheduleNextAmbientNote = () => {
    if (!this.isMusicPlaying) return;
    this.playAmbientChord();

    let delay = 3200;
    if (this.currentVibe === 'CRAZY') delay = 1400;
    if (this.currentVibe === 'INSANE') delay = 650;

    this.musicTimer = window.setTimeout(this.scheduleNextAmbientNote, delay + Math.random() * 400);
  };

  private playAmbientChord() {
    if (this.isMuted || !this.ctx || !this.musicGain) return;
    const now = this.ctx.currentTime;

    const scales = {
      RELAX: [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25], // C major pentatonic / calm
      CRAZY: [329.63, 392.0, 493.88, 587.33, 659.25, 783.99], // Upbeat Mixolydian
      INSANE: [220.0, 246.94, 261.63, 311.13, 329.63, 392.0, 440.0], // Minor energetic
    };

    const notes = scales[this.currentVibe];
    const pick1 = notes[Math.floor(Math.random() * notes.length)];
    const pick2 = notes[Math.floor(Math.random() * notes.length)];

    [pick1, pick2].forEach((freq) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = this.currentVibe === 'RELAX' ? 'sine' : this.currentVibe === 'CRAZY' ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const duration = this.currentVibe === 'RELAX' ? 3.0 : 1.2;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(now);
      osc.stop(now + duration);
    });
  }
}

export const soundEngine = new SoundEngine();
