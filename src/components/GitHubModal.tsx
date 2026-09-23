import React, { useState } from 'react';
import { X, Github, Terminal, Copy, Check, ExternalLink, Download } from 'lucide-react';

interface GitHubModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubModal: React.FC<GitHubModalProps> = ({ isOpen, onClose }) => {
  const [copiedStep, setCopiedStep] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (text: string, stepId: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedStep(stepId);
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const repoUrl = 'https://github.com/sarlayash/EVERMOTION-Powered-By-Kapil---SarlaYash-Productions.git';

  const gitCommands = `# Run these commands in your project folder:
git init
git add .
git commit -m "feat: EVERMOTION game release by Kapil - SarlaYash Productions"
git branch -M main
git remote add origin https://github.com/sarlayash/EVERMOTION-Powered-By-Kapil---SarlaYash-Productions.git
git push -u origin main`;

  const webAppUrl = typeof window !== 'undefined' ? window.location.origin : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/75 backdrop-blur-md animate-fade-in select-text">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-white">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-display font-extrabold text-base text-white">
                Upload & Play on GitHub
              </h3>
              <p className="text-xs text-slate-400">
                Evermotion: Living Physics Universe by Kapil (SarlaYash)
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-sm">
          {/* Quick Notice */}
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-start gap-3">
            <span className="text-xl shrink-0">✅</span>
            <div className="text-xs text-emerald-200/90 leading-relaxed">
              <strong className="text-emerald-300">Fix for "404 main.tsx / blank page":</strong> Vite projects must be compiled before browsers can run them. We have set relative base paths (<code>base: './'</code>) and added an automatic <strong>GitHub Actions</strong> deployment workflow!
            </div>
          </div>

          {/* GitHub Pages 1-Click Fix */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
                1. Set GitHub Pages Source to "GitHub Actions"
              </span>
              <a
                href="https://github.com/sarlayash/EVERMOTION-Powered-By-Kapil---SarlaYash-Productions/settings/pages"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-300 hover:text-amber-200 hover:underline"
              >
                Open Repo Pages Settings <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="text-xs text-slate-300 space-y-1">
              <p>• In your repository, go to <strong>Settings → Pages</strong></p>
              <p>• Under <strong>Build and deployment → Source</strong>, switch from <em>"Deploy from a branch"</em> to <strong className="text-amber-300">"GitHub Actions"</strong></p>
            </div>
          </div>

          {/* Step 2: Push Workflow */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> 2. Push Update to Trigger Build
              </span>
              <button
                onClick={() => copyToClipboard(gitCommands, 'git')}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors"
              >
                {copiedStep === 'git' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy commands
                  </>
                )}
              </button>
            </div>
            <pre className="p-3 bg-slate-950/90 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 overflow-x-auto whitespace-pre leading-relaxed">
              {gitCommands}
            </pre>
            <p className="text-[11px] text-slate-400">
              Once pushed, GitHub Actions automatically builds Vite and deploys live in ~45 seconds!
            </p>
          </div>

          {/* Step 3: Run Locally or Deploy */}
          <div className="p-4 bg-slate-800/40 border border-slate-800 rounded-2xl space-y-2">
            <span className="font-bold text-xs uppercase tracking-wider text-amber-400">
              Step 3: Run anywhere offline
            </span>
            <div className="text-xs text-slate-300 space-y-1">
              <p>• <code>npm install</code> to install all packages</p>
              <p>• <code>npm run dev</code> for local development on port 3000</p>
              <p>• <code>npm run build</code> generates standard zero-server static assets in <code>dist/</code></p>
            </div>
          </div>

          {/* Live Link */}
          {webAppUrl && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <span className="text-xs text-slate-400">Live Preview Link:</span>
              <a
                href={webAppUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-mono text-emerald-400 hover:underline flex items-center gap-1"
              >
                {webAppUrl} <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <span className="text-xs text-slate-500 font-mono">MIT Licensed · Open Universe</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all"
          >
            Got it, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
