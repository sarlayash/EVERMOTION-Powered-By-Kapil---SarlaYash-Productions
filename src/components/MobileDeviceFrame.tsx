import React from 'react';

interface MobileDeviceFrameProps {
  isMobileFrame: boolean;
  children: React.ReactNode;
}

export const MobileDeviceFrame: React.FC<MobileDeviceFrameProps> = ({
  isMobileFrame,
  children,
}) => {
  if (!isMobileFrame) {
    return (
      <main className="relative w-full h-screen overflow-hidden bg-slate-950 flex flex-col">
        {children}
      </main>
    );
  }

  return (
    <main className="relative w-full h-screen overflow-hidden bg-slate-950 flex items-center justify-center p-2 sm:p-4">
      {/* Smartphone Device Chassis */}
      <div className="relative w-full max-w-[420px] h-full max-h-[860px] bg-slate-900 border-[8px] sm:border-[10px] border-slate-800 rounded-[44px] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9),0_0_0_1px_rgba(255,255,255,0.08)] flex flex-col overflow-hidden ring-1 ring-slate-700/50">
        {/* Dynamic Island / Speaker Pill */}
        <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-40 w-28 h-4.5 bg-black rounded-full flex items-center justify-between px-3 pointer-events-none">
          <div className="w-2 h-2 rounded-full bg-slate-800" />
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-900/60" />
        </div>

        {/* Inner Screen Display */}
        <div className="relative w-full h-full rounded-[34px] overflow-hidden flex flex-col">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-slate-400/40 rounded-full pointer-events-none z-40" />
      </div>
    </main>
  );
};
