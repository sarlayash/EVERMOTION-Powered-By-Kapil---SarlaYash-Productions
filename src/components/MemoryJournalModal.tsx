import React from 'react';
import { memoryStore } from '../storage/memoryStore';
import { PhysicsEngine } from '../physics/engine';
import { soundEngine } from '../audio/soundEngine';
import { X, Calendar, Sparkles, Trophy, Trash2, Camera, Award } from 'lucide-react';

interface MemoryJournalModalProps {
  engine: PhysicsEngine;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const MemoryJournalModal: React.FC<MemoryJournalModalProps> = ({
  engine,
  isOpen,
  onClose,
  onRefresh,
}) => {
  if (!isOpen) return null;

  const data = memoryStore.getData();

  const handleTakeSnapshot = () => {
    soundEngine.playSunTouch();
    const notes: string[] = [];

    if (engine.sessionLaunches > 0) {
      notes.push(`Mo was propelled ${engine.sessionLaunches} time(s) into the outer atmosphere.`);
    }
    if (engine.volcanoes.length > 0) {
      notes.push(`${engine.volcanoes.length} active volcano(es) are smoking on the mountain ridge.`);
    }
    if (engine.castleBlocks.filter(b => b.isRuined).length > 0) {
      notes.push(`Castle ruins from toppled brick structures stand scattered across the hills.`);
    }
    if (engine.chickens.length > 0) {
      notes.push(`A flock of ${engine.chickens.length} curious chickens wander the terrain.`);
    }
    if (notes.length === 0) {
      notes.push('Peaceful breeze stirred the grass while Mo meditated under the warm sun.');
    }

    memoryStore.createSessionSnapshot(notes);
    onRefresh();
  };

  const handleResetWorld = () => {
    if (window.confirm('Reset the universe memory back to Genesis? All saved ruins and history will be cleared.')) {
      memoryStore.clearAllMemories();
      engine.resetWorldForAge(engine.age);
      onRefresh();
      soundEngine.playBoom();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <span className="text-xl">📖</span>
            <div>
              <h3 className="font-display font-bold text-base text-white">Mo's Memory Journal</h3>
              <p className="text-xs text-slate-400">The world remembers what you did previously</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Action: Take Snapshot */}
          <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-transparent border border-amber-500/30 rounded-2xl">
            <div>
              <div className="font-bold text-sm text-amber-300">Preserve World Memory</div>
              <div className="text-xs text-slate-400">Snapshot this universe session into Mo's memory</div>
            </div>
            <button
              onClick={handleTakeSnapshot}
              className="px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Camera className="w-4 h-4" /> Snapshot
            </button>
          </div>

          {/* Universe Lifetime Stats */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Universe Vital Signs
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-center">
                <div className="text-xl font-black text-amber-400 font-mono tabular-nums">{data.totalTouches}</div>
                <div className="text-[11px] text-slate-400">Touches</div>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-center">
                <div className="text-xl font-black text-sky-400 font-mono tabular-nums">{data.moLaunches}</div>
                <div className="text-[11px] text-slate-400">Mo Launches</div>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-center">
                <div className="text-xl font-black text-rose-400 font-mono tabular-nums">{data.chickensExploded}</div>
                <div className="text-[11px] text-slate-400">Bomb Booms</div>
              </div>
              <div className="p-3 bg-slate-800/60 border border-slate-700/50 rounded-2xl text-center">
                <div className="text-xl font-black text-emerald-400 font-mono tabular-nums">{data.blocksKnockedDown}</div>
                <div className="text-[11px] text-slate-400">Ruined Blocks</div>
              </div>
            </div>
          </div>

          {/* Persistent Landmarks ("Mo Remembers") */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Permanent Remembrances
            </div>
            <div className="p-3.5 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">🌋 Active Volcanoes</span>
                <span className="font-mono font-bold text-amber-400">{data.persistentVolcanoes.length}</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">🏰 Persistent Castle Ruins</span>
                <span className="font-mono font-bold text-amber-400">{data.persistentRuins.length} sites</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-1.5">🐟 Resident Pond Fish</span>
                <span className="font-mono font-bold text-amber-400">{data.persistentFishCount} fish</span>
              </div>
            </div>
          </div>

          {/* Timeline of Historical Sessions */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Session Snapshots ({data.snapshots.length})
            </div>
            <div className="space-y-2.5">
              {data.snapshots.map(snap => (
                <div
                  key={snap.id}
                  className="p-3 bg-slate-800/50 border border-slate-700/40 rounded-2xl space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-white">{snap.title}</span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {snap.dateStr}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 space-y-1">
                    {snap.notes.map((note, nIdx) => (
                      <p key={nIdx} className="leading-relaxed">
                        • {note}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Achievements */}
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5 text-amber-400" /> Milestones & Discoveries
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {data.achievements.map(ach => {
                const unlocked = !!ach.unlockedAt;
                return (
                  <div
                    key={ach.id}
                    className={`p-2.5 rounded-2xl border flex items-start gap-2.5 ${
                      unlocked
                        ? 'bg-amber-500/10 border-amber-500/30 text-white'
                        : 'bg-slate-800/20 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="text-xl shrink-0">{ach.icon}</span>
                    <div>
                      <div className="font-bold text-xs">{ach.title}</div>
                      <div className="text-[11px] text-slate-400">{ach.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleResetWorld}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset World
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition-colors"
          >
            Close Journal
          </button>
        </div>
      </div>
    </div>
  );
};
