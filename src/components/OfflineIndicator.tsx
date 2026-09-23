import React, { useEffect, useState } from 'react';
import { WifiOff, Check } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  if (showReconnected) {
    return (
      <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-xl bg-emerald-600/90 backdrop-blur-md border border-emerald-500/40 px-3 py-1.5 text-xs font-semibold text-white shadow-lg animate-fade-in pointer-events-none">
        <Check className="w-3.5 h-3.5 text-emerald-200" />
        <span>Connected back online</span>
      </div>
    );
  }

  return (
    <div className="fixed bottom-3 right-3 z-40 flex items-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-amber-500/40 px-3 py-1.5 text-xs font-semibold text-amber-300 shadow-lg animate-fade-in pointer-events-none">
      <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
      <WifiOff className="w-3.5 h-3.5 text-amber-400" />
      <span>Offline Mode — 100% Physics Active</span>
    </div>
  );
};
