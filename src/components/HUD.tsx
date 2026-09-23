import React, { useState } from 'react';
import { WorldAge, VibeMode, ActiveTool } from '../types';
import { PhysicsEngine } from '../physics/engine';
import { soundEngine } from '../audio/soundEngine';
import {
  Volume2,
  VolumeX,
  BookOpen,
  Sparkles,
  Smartphone,
  Maximize2,
  Flame,
  Droplets,
  RotateCcw,
  Moon,
  Sun,
  ShieldAlert,
  Egg,
  Castle,
  Mountain,
  Rocket,
  Compass,
  Zap,
  Github,
  Download,
} from 'lucide-react';

interface HUDProps {
  engine: PhysicsEngine;
  currentAge: WorldAge;
  onSelectAge: (age: WorldAge) => void;
  currentVibe: VibeMode;
  onSelectVibe: (vibe: VibeMode) => void;
  isMobileFrame: boolean;
  onToggleFrame: () => void;
  onOpenJournal: () => void;
  onOpenGitHub?: () => void;
  onOpenInstall?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  engine,
  currentAge,
  onSelectAge,
  currentVibe,
  onSelectVibe,
  isMobileFrame,
  onToggleFrame,
  onOpenJournal,
  onOpenGitHub,
  onOpenInstall,
}) => {
  const [isMuted, setIsMuted] = useState(soundEngine.getMuted());
  const [activeTool, setActiveTool] = useState<ActiveTool>('POINTER');
  const [showChaosMenu, setShowChaosMenu] = useState(false);

  const toggleSound = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (!next) {
      soundEngine.startGenerativeMusic();
    }
  };

  const handleToolSelect = (tool: ActiveTool) => {
    const nextTool = activeTool === tool ? 'POINTER' : tool;
    setActiveTool(nextTool);
    engine.activeTool = nextTool;
    soundEngine.playFruitDrop();
  };

  const handleGravityToggle = () => {
    if (engine.gravityY > 0) {
      engine.gravityY = -0.35; // zero-g / float
      soundEngine.playMoLaunch();
    } else {
      engine.gravityY = 0.45; // normal
      soundEngine.playMoBounce();
    }
  };

  const handleNightToggle = () => {
    engine.isNight = !engine.isNight;
    soundEngine.playSunTouch();
  };

  const ages = [
    { age: 1 as WorldAge, title: 'Curious', icon: '🌱' },
    { age: 2 as WorldAge, title: 'Chaos', icon: '⚡' },
    { age: 3 as WorldAge, title: 'Reality', icon: '🌀' },
    { age: 4 as WorldAge, title: 'Dream', icon: '👑' },
    { age: 5 as WorldAge, title: 'Creator', icon: '✨' },
  ];

  const vibes = [
    { mode: 'RELAX' as VibeMode, label: 'Relax', dot: 'bg-emerald-400' },
    { mode: 'CRAZY' as VibeMode, label: 'Crazy', dot: 'bg-amber-400' },
    { mode: 'INSANE' as VibeMode, label: 'Insane', dot: 'bg-rose-500' },
  ];

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-3 select-none">
      {/* --- TOP BAR --- */}
      <div className="flex flex-col gap-2 pointer-events-auto">
        {/* Main top header bar */}
        <header className="flex items-center justify-between px-3 py-2 bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-lg">
          {/* Brand Wordmark (Single text element complying with Top Bar Contract) */}
          <div className="flex items-center gap-2">
            <span className="font-display font-extrabold text-base tracking-wide bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
              EVERMOTION
            </span>
            <span className="text-slate-500 text-xs hidden sm:inline">· SarlaYash</span>
          </div>

          {/* Vibe Mode Selectors (Functional Segmented Buttons) */}
          <div className="flex items-center p-0.5 bg-slate-950/70 border border-slate-800 rounded-xl">
            {vibes.map(v => (
              <button
                key={v.mode}
                onClick={() => onSelectVibe(v.mode)}
                className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                  currentVibe === v.mode
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className="capitalize">{v.label}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions (Sound, Journal, Mobile Frame) */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={toggleSound}
              title={isMuted ? 'Unmute Sound & Generative Music' : 'Mute Sound'}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 transition-colors"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onOpenJournal}
              title="Mo's Memory Journal (The World Remembers)"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Memories</span>
            </button>

            {onOpenInstall && (
              <button
                onClick={onOpenInstall}
                title="Download / Install on Mobile Phone (PWA)"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 text-amber-300 border border-amber-400/40 text-xs font-bold transition-all shadow-sm shadow-amber-500/10"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Install App</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}

            {onOpenGitHub && (
              <button
                onClick={onOpenGitHub}
                title="GitHub Repository & Source Code"
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/50 text-xs font-bold transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">GitHub</span>
              </button>
            )}

            <button
              onClick={onToggleFrame}
              title={isMobileFrame ? 'Expand to Fullscreen' : 'Switch to Smartphone Bezel'}
              className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition-colors"
            >
              {isMobileFrame ? <Maximize2 className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>
          </div>
        </header>

        {/* World Age Scroller Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-900/80 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-x-auto no-scrollbar">
          {ages.map(a => {
            const active = currentAge === a.age;
            return (
              <button
                key={a.age}
                onClick={() => onSelectAge(a.age)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  active
                    ? 'bg-amber-400 text-slate-950 shadow-md font-extrabold scale-[1.02]'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <span>{a.icon}</span>
                <span>Age {a.age}: {a.title}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* --- ACTIVE CHALLENGE OVERLAY (AGE 2 CHAOS) --- */}
      {engine.activeChallenge && (
        <div className="self-center my-auto pointer-events-auto max-w-sm w-full mx-auto px-2">
          <div className="bg-slate-900/90 backdrop-blur-md border-2 border-amber-400/80 rounded-2xl p-3 shadow-2xl animate-fade-in text-center">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-black tracking-widest text-amber-400 uppercase flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" /> Chaos Challenge
              </span>
              <span className="text-xs font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded-full">
                {Math.max(0, Math.ceil(engine.activeChallenge.timeRemaining))}s
              </span>
            </div>
            <h4 className="font-display font-extrabold text-sm text-white mb-0.5">
              {engine.activeChallenge.title}
            </h4>
            <p className="text-xs text-slate-300 mb-2">
              {engine.activeChallenge.subtext}
            </p>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  engine.activeChallenge.completed
                    ? 'bg-emerald-400'
                    : engine.activeChallenge.failed
                    ? 'bg-rose-500'
                    : 'bg-amber-400'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    ((engine.activeChallenge.duration - engine.activeChallenge.timeRemaining) /
                      engine.activeChallenge.duration) *
                      100
                  )}%`,
                }}
              />
            </div>

            {engine.activeChallenge.completed && (
              <div className="mt-2 text-xs font-bold text-emerald-400">
                🎉 Complete! The chaos was vanquished!
              </div>
            )}
            {engine.activeChallenge.failed && (
              <div className="mt-2 text-xs font-bold text-rose-400">
                💥 Mo touched down! Tap to try again!
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- BOTTOM CONTEXTUAL CONTROLS BAR --- */}
      <div className="flex flex-col gap-2 pointer-events-auto pb-1">
        {/* Age 1: Curious discovery tips */}
        {currentAge === 1 && (
          <div className="mx-auto bg-slate-900/85 backdrop-blur-md border border-slate-700/60 rounded-xl px-4 py-1.5 text-xs text-slate-300 shadow-md text-center max-w-xs">
            <span className="text-amber-400 font-bold">✨ Tap Sun, Clouds & Trees</span> · Drag birds to Sun to summon the Rainbow!
          </div>
        )}

        {/* Age 2: Chaos controls */}
        {currentAge === 2 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => engine.startChaosChallenge('DONT_TOUCH_GROUND')}
              className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Don't Touch Ground (30s)
            </button>
            <button
              onClick={() => engine.startChaosChallenge('GIANT_CHICKEN')}
              className="px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all shadow-md active:scale-95 flex items-center gap-1"
            >
              <Egg className="w-3.5 h-3.5" /> Giant Chicken
            </button>
            <button
              onClick={() => engine.startChaosChallenge('MAKE_10_FLY')}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all shadow-md active:scale-95"
            >
              Make 10 Fly
            </button>
          </div>
        )}

        {/* Age 3: World Breaker Powers */}
        {currentAge === 3 && (
          <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-xl max-w-md mx-auto">
            <button
              onClick={handleGravityToggle}
              title="Toggle Zero-G / Heavy Gravity"
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                engine.gravityY < 0 ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Gravity</span>
            </button>

            <button
              onPointerDown={() => engine.rewindTime()}
              onPointerUp={() => (engine.isTimeRewinding = false)}
              onPointerCancel={() => (engine.isTimeRewinding = false)}
              title="Hold to Rewind Time Backwards"
              className="p-2 rounded-xl text-xs font-bold flex items-center gap-1 text-slate-300 hover:bg-slate-800 active:bg-pink-500 active:text-white transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Rewind</span>
            </button>

            <button
              onClick={() => handleToolSelect('WATER')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                activeTool === 'WATER' ? 'bg-sky-500 text-slate-950 shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Droplets className="w-4 h-4" />
              <span className="hidden sm:inline">Water</span>
            </button>

            <button
              onClick={() => handleToolSelect('FIRE')}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                activeTool === 'FIRE' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Flame className="w-4 h-4" />
              <span className="hidden sm:inline">Fire</span>
            </button>

            <button
              onClick={handleNightToggle}
              title="Toggle Eclipse / Darkness"
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                engine.isNight ? 'bg-indigo-600 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              {engine.isNight ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        )}

        {/* Age 4: Dream / Impossible World Rules */}
        {currentAge === 4 && (
          <div className="flex items-center justify-center gap-1.5 p-1 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-xl max-w-md mx-auto">
            <button
              onClick={() => {
                engine.dreamRule = engine.dreamRule === 'ENORMOUS' ? 'NORMAL' : 'ENORMOUS';
                soundEngine.playFruitDrop();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                engine.dreamRule === 'ENORMOUS'
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              🍎 Enormous
            </button>

            <button
              onClick={() => {
                engine.dreamRule = engine.dreamRule === 'UPSIDE_DOWN' ? 'NORMAL' : 'UPSIDE_DOWN';
                soundEngine.playMoBounce();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                engine.dreamRule === 'UPSIDE_DOWN'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              🙃 Upside Down
            </button>

            <button
              onClick={() => {
                engine.dreamRule = engine.dreamRule === 'TINY' ? 'NORMAL' : 'TINY';
                soundEngine.playMoBounce();
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                engine.dreamRule === 'TINY'
                  ? 'bg-emerald-400 text-slate-950 shadow-md'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              ✋ Tiny World
            </button>
          </div>
        )}

        {/* Age 5: Creator Universe Sandbox */}
        {currentAge === 5 && (
          <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-slate-900/90 backdrop-blur-md border border-slate-700/60 rounded-2xl shadow-xl max-w-lg mx-auto">
            <button
              onClick={() => handleToolSelect('CASTLE')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                activeTool === 'CASTLE' ? 'bg-amber-400 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Castle className="w-3.5 h-3.5" /> Castle
            </button>

            <button
              onClick={() => handleToolSelect('VOLCANO')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                activeTool === 'VOLCANO' ? 'bg-rose-500 text-white' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Mountain className="w-3.5 h-3.5" /> Volcano
            </button>

            <button
              onClick={() => handleToolSelect('SPACESHIP')}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all ${
                activeTool === 'SPACESHIP' ? 'bg-sky-500 text-slate-950' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Rocket className="w-3.5 h-3.5" /> Rocket
            </button>

            <button
              onClick={() => engine.release500Chickens()}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 to-yellow-500 hover:from-amber-300 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              <Egg className="w-3.5 h-3.5" /> Release 500 Chickens! 😂
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
