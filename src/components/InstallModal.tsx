import React, { useState } from 'react';
import { 
  X, 
  Smartphone, 
  Download, 
  Share2, 
  PlusSquare, 
  CheckCircle2, 
  WifiOff, 
  Zap, 
  Copy, 
  Check, 
  ExternalLink,
  QrCode
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } = usePWAInstall();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  const handleInstallClick = async () => {
    if (isInstallable) {
      const outcome = await install();
      if (outcome) {
        onClose();
      }
    }
  };

  const copyShareLink = () => {
    navigator.clipboard?.writeText(currentUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Generate SVG QR code pointing to current URL
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(currentUrl)}&bgcolor=0f172a&color=f8fafc`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-text">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400 shadow-inner">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white flex items-center gap-2">
                Install on Mobile Phone
                {isInstalled && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                    Installed
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Offline-First Progressive Web App (PWA)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-sm">
          {/* App Card Preview */}
          <div className="flex items-center gap-3.5 p-3.5 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl">
            <div className="w-12 h-12 rounded-2xl bg-slate-950 border border-amber-400/30 flex items-center justify-center shadow-lg shrink-0 overflow-hidden">
              <img 
                src="./apple-touch-icon.png" 
                alt="EVERMOTION icon" 
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display font-bold text-white text-sm truncate">EVERMOTION</div>
              <div className="text-xs text-slate-400 truncate">Living Physics Universe · Mo</div>
              <div className="flex items-center gap-2 text-[11px] text-amber-400/90 font-medium mt-0.5">
                <span className="flex items-center gap-1"><WifiOff className="w-3 h-3" /> Works Offline</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> 0 App Store delay</span>
              </div>
            </div>
          </div>

          {/* Primary Action: Direct 1-Click Install if supported (Android / Chromium) */}
          {isInstallable && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                  Ready to Install
                </span>
                <span className="text-xs text-emerald-300 font-mono">1 Tap</span>
              </div>
              <p className="text-xs text-slate-300">
                Your browser supports direct instant installation to your home screen or app drawer.
              </p>
              <button
                onClick={handleInstallClick}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 text-slate-950 font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 active:scale-98 transition-all"
              >
                <Download className="w-4 h-4" /> Install EVERMOTION on Phone
              </button>
            </div>
          )}

          {/* iOS Instructions */}
          {isIOS && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-sky-400">
                <Smartphone className="w-4 h-4" /> iPhone & iPad (Safari) Instructions
              </div>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                    1
                  </div>
                  <div className="leading-relaxed">
                    Tap the <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700"><Share2 className="w-3 h-3 text-sky-400 inline" /> Share</strong> button in Safari's bottom toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                    2
                  </div>
                  <div className="leading-relaxed">
                    Scroll down the menu and tap <strong className="text-white inline-flex items-center gap-1 mx-1 px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700"><PlusSquare className="w-3 h-3 text-emerald-400 inline" /> Add to Home Screen</strong>.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 bg-slate-950/60 rounded-xl border border-slate-800/80">
                  <div className="w-6 h-6 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                    3
                  </div>
                  <div className="leading-relaxed">
                    Tap <strong className="text-amber-300">Add</strong> in the top-right corner. EVERMOTION will launch in full screen right from your phone screen!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Android Manual instructions (if beforeinstallprompt is suppressed or user opened on Chrome) */}
          {!isInstallable && !isIOS && (
            <div className="p-4 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-amber-400">
                <Smartphone className="w-4 h-4" /> Android (Chrome / Samsung / Edge)
              </div>
              <div className="space-y-2 text-xs text-slate-300">
                <p>1. Tap the browser menu <strong className="text-white">⋮</strong> (three dots in top right).</p>
                <p>2. Tap <strong className="text-white">"Install app"</strong> or <strong className="text-white">"Add to Home screen"</strong>.</p>
                <p>3. Confirm install. An app icon with Mo will be pinned to your phone launcher!</p>
              </div>
            </div>
          )}

          {/* If viewing on Desktop / Laptop: Scan QR to open on Phone */}
          <div className="p-4 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <QrCode className="w-3.5 h-3.5 text-amber-400" /> Open on Mobile via QR Code
              </span>
              <button
                onClick={() => setShowQr(!showQr)}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                {showQr ? 'Hide QR' : 'Show QR Code'}
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center justify-center p-3 bg-slate-900 rounded-xl border border-slate-800 text-center gap-2 animate-fade-in">
                <img 
                  src={qrApiUrl} 
                  alt="Scan to open on phone" 
                  className="w-36 h-36 rounded-xl border border-slate-700 shadow-md"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <span className="text-[11px] text-slate-400">
                  Point your phone's camera here to open the game in your mobile browser.
                </span>
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={currentUrl}
                className="flex-1 px-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-300 font-mono select-all focus:outline-none"
              />
              <button
                onClick={copyShareLink}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Benefits Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Fullscreen Mode
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                No browser address bars, URL inputs, or controls taking screen space.
              </p>
            </div>
            <div className="p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl space-y-1">
              <div className="font-bold text-white flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" /> 100% Offline
              </div>
              <p className="text-[11px] text-slate-400 leading-tight">
                Runs completely locally with Web Audio and offline physics simulation.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500 font-mono">PWA v1.0 · Web App Manifest</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
