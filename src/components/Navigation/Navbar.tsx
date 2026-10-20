import React from 'react';
import { Film, Code, Sparkles, Upload, Smartphone, Zap } from 'lucide-react';

interface NavbarProps {
  currentTab: 'player' | 'code';
  onTabChange: (tab: 'player' | 'code') => void;
  onOpenLocalFile: () => void;
  isPlayingVideo: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  onOpenLocalFile,
  isPlayingVideo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-black font-black text-base shadow-md shadow-amber-500/20">
            ▶
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base text-white tracking-tight">NovaPlayer</span>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
                Media3 Jetpack
              </span>
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-semibold">
          <button
            onClick={() => onTabChange('player')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              currentTab === 'player'
                ? 'bg-amber-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Player & Library</span>
            {isPlayingVideo && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onTabChange('code')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg transition ${
              currentTab === 'code'
                ? 'bg-emerald-500 text-black shadow-md font-bold'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            <span>Android Kotlin Source</span>
          </button>
        </div>

        {/* Right Actions */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={onOpenLocalFile}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-750 rounded-xl text-xs font-medium transition"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Select Local File</span>
          </button>
        </div>
      </div>
    </header>
  );
};
