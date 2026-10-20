import React from 'react';
import { Sun, Volume2, VolumeX, Zap, RotateCcw, RotateCw, Lock, Unlock } from 'lucide-react';
import { formatTime } from '../../utils/formatters';

interface GestureOverlayProps {
  gestureType: 'none' | 'brightness' | 'volume' | 'seek';
  gestureValue: number; // 0-100 for brightness, 0-200 for volume, seconds for seek
  seekTargetTime?: number;
  seekDelta?: number;
  doubleTapFeedback: 'left' | 'right' | null;
  isLocked: boolean;
  onToggleLock: () => void;
  showLockPrompt: boolean;
}

export const GestureOverlay: React.FC<GestureOverlayProps> = ({
  gestureType,
  gestureValue,
  seekTargetTime = 0,
  seekDelta = 0,
  doubleTapFeedback,
  isLocked,
  onToggleLock,
  showLockPrompt,
}) => {
  return (
    <div className="absolute inset-0 pointer-events-none select-none z-30 flex items-center justify-center">
      {/* 1. Brightness HUD (Center Left or Center) */}
      {gestureType === 'brightness' && (
        <div className="bg-black/85 backdrop-blur-md border border-zinc-700/80 rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-3 min-w-[130px] animate-in zoom-in-95 duration-100">
          <Sun className="w-8 h-8 text-amber-300 animate-pulse" />
          <div className="w-2.5 h-32 bg-zinc-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className="w-full bg-gradient-to-t from-amber-500 to-amber-300 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(4, Math.min(100, gestureValue))}%` }}
            />
          </div>
          <span className="text-sm font-mono font-bold text-white tracking-wider">
            {Math.round(gestureValue)}%
          </span>
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-semibold">
            Brightness
          </span>
        </div>
      )}

      {/* 2. Volume & 200% Super-Boost HUD */}
      {gestureType === 'volume' && (
        <div className={`bg-black/85 backdrop-blur-md border rounded-2xl p-5 shadow-2xl flex flex-col items-center gap-3 min-w-[140px] animate-in zoom-in-95 duration-100 ${
          gestureValue > 100 ? 'border-amber-500/60 shadow-amber-500/20' : 'border-zinc-700/80'
        }`}>
          {gestureValue === 0 ? (
            <VolumeX className="w-8 h-8 text-red-400" />
          ) : gestureValue > 100 ? (
            <div className="relative">
              <Volume2 className="w-8 h-8 text-amber-400 animate-bounce" />
              <Zap className="w-4 h-4 text-amber-300 absolute -top-1 -right-1" />
            </div>
          ) : (
            <Volume2 className="w-8 h-8 text-cyan-400" />
          )}

          {/* Vertical progress bar */}
          <div className="w-2.5 h-32 bg-zinc-800 rounded-full overflow-hidden flex flex-col justify-end p-0.5">
            <div
              className={`w-full rounded-full transition-all duration-75 ${
                gestureValue > 100
                  ? 'bg-gradient-to-t from-amber-500 via-yellow-400 to-amber-200'
                  : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
              }`}
              style={{ height: `${Math.max(4, Math.min(100, (gestureValue / 200) * 100))}%` }}
            />
          </div>

          <div className="flex flex-col items-center">
            <span className={`text-sm font-mono font-bold tracking-wider ${
              gestureValue > 100 ? 'text-amber-400 text-base' : 'text-white'
            }`}>
              {Math.round(gestureValue)}%
            </span>
            <span className={`text-[10px] uppercase tracking-widest font-bold mt-0.5 ${
              gestureValue > 100 ? 'text-amber-400 flex items-center gap-0.5' : 'text-zinc-400'
            }`}>
              {gestureValue > 100 ? (
                <>
                  <Zap className="w-2.5 h-2.5" /> 200% BOOST
                </>
              ) : (
                'Volume'
              )}
            </span>
          </div>
        </div>
      )}

      {/* 3. Horizontal Seek Scrubber HUD */}
      {gestureType === 'seek' && (
        <div className="bg-black/90 backdrop-blur-md border border-zinc-700 rounded-2xl px-6 py-4 shadow-2xl flex flex-col items-center gap-1.5 animate-in zoom-in-95 duration-100">
          <div className="flex items-center gap-2">
            {seekDelta < 0 ? (
              <RotateCcw className="w-5 h-5 text-amber-400" />
            ) : (
              <RotateCw className="w-5 h-5 text-amber-400" />
            )}
            <span className={`text-base font-mono font-bold ${
              seekDelta >= 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {seekDelta > 0 ? `+${Math.round(seekDelta)}s` : `${Math.round(seekDelta)}s`}
            </span>
          </div>
          <div className="text-xl font-mono font-black text-white">
            {formatTime(seekTargetTime)}
          </div>
          <span className="text-[11px] text-zinc-400">Target playback timestamp</span>
        </div>
      )}

      {/* 4. Double Tap Fast Forward / Rewind Ripples */}
      {doubleTapFeedback === 'left' && (
        <div className="absolute left-12 flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-zinc-700/60 animate-in fade-in zoom-in duration-150">
          <RotateCcw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm font-mono font-bold text-white tracking-wide">-10 SECONDS</span>
        </div>
      )}

      {doubleTapFeedback === 'right' && (
        <div className="absolute right-12 flex flex-col items-center gap-2 bg-black/70 backdrop-blur-md px-6 py-4 rounded-2xl border border-zinc-700/60 animate-in fade-in zoom-in duration-150">
          <RotateCw className="w-8 h-8 text-amber-400 animate-spin" />
          <span className="text-sm font-mono font-bold text-white tracking-wide">+10 SECONDS</span>
        </div>
      )}

      {/* 5. Screen Lock Prompt */}
      {isLocked && showLockPrompt && (
        <div className="absolute bg-zinc-900/90 border border-red-500/50 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <Lock className="w-5 h-5 text-red-400" />
          <div>
            <div className="text-sm font-semibold">Screen is Locked</div>
            <div className="text-xs text-zinc-400">Tap the unlock icon to restore gesture controls</div>
          </div>
          <button
            onClick={onToggleLock}
            className="ml-2 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Unlock className="w-3.5 h-3.5" /> Unlock
          </button>
        </div>
      )}
    </div>
  );
};
