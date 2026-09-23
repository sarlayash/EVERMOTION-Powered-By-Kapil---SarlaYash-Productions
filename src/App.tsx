import React, { useState, useMemo, useEffect } from 'react';
import { WorldAge, VibeMode } from './types';
import { PhysicsEngine } from './physics/engine';
import { soundEngine } from './audio/soundEngine';
import { memoryStore } from './storage/memoryStore';
import { GameCanvas } from './components/GameCanvas';
import { HUD } from './components/HUD';
import { MobileDeviceFrame } from './components/MobileDeviceFrame';
import { MemoryJournalModal } from './components/MemoryJournalModal';

export default function App() {
  const engine = useMemo(() => new PhysicsEngine(), []);

  const [currentAge, setCurrentAge] = useState<WorldAge>(memoryStore.getData().selectedAge || 1);
  const [currentVibe, setCurrentVibe] = useState<VibeMode>(memoryStore.getData().vibe || 'RELAX');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth > 640;
    }
    return false;
  });
  const [isJournalOpen, setIsJournalOpen] = useState<boolean>(false);
  const [, setRefreshKey] = useState<number>(0);

  // Initialize engine settings on mount
  useEffect(() => {
    engine.setVibe(currentVibe);
    engine.resetWorldForAge(currentAge);

    // Check achievement for returning to remembered world
    const stored = memoryStore.getData();
    if (stored.snapshots.length > 0) {
      memoryStore.unlockAchievement('memory_keeper');
    }

    // Start audio on first touch
    const startAudio = () => {
      soundEngine.startGenerativeMusic();
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };

    window.addEventListener('pointerdown', startAudio);
    window.addEventListener('keydown', startAudio);

    return () => {
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
    };
  }, [engine, currentAge, currentVibe]);

  const handleSelectAge = (age: WorldAge) => {
    setCurrentAge(age);
    memoryStore.setSelectedAge(age);
    memoryStore.unlockAge(age);
    engine.resetWorldForAge(age);
    soundEngine.playFruitDrop();
  };

  const handleSelectVibe = (vibe: VibeMode) => {
    setCurrentVibe(vibe);
    engine.setVibe(vibe);
  };

  return (
    <MobileDeviceFrame isMobileFrame={isMobileFrame}>
      <div className="relative w-full h-full overflow-hidden bg-slate-950">
        {/* Living Physics Canvas */}
        <GameCanvas engine={engine} />

        {/* Clean Ergonomic HUD */}
        <HUD
          engine={engine}
          currentAge={currentAge}
          onSelectAge={handleSelectAge}
          currentVibe={currentVibe}
          onSelectVibe={handleSelectVibe}
          isMobileFrame={isMobileFrame}
          onToggleFrame={() => setIsMobileFrame(prev => !prev)}
          onOpenJournal={() => setIsJournalOpen(true)}
        />

        {/* Mo Remembers Journal Modal */}
        <MemoryJournalModal
          engine={engine}
          isOpen={isJournalOpen}
          onClose={() => setIsJournalOpen(false)}
          onRefresh={() => setRefreshKey(k => k + 1)}
        />
      </div>
    </MobileDeviceFrame>
  );
}
