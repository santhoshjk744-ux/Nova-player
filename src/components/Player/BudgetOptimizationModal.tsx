import React from 'react';
import { Cpu, Zap, ShieldCheck, Activity, X, Gauge, BatteryCharging, AlertTriangle } from 'lucide-react';
import { BudgetOptimizationConfig, PlaybackStats } from '../../types/video';

interface BudgetOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BudgetOptimizationConfig;
  onUpdateConfig: (newConfig: BudgetOptimizationConfig) => void;
  stats: PlaybackStats;
}

export const BudgetOptimizationModal: React.FC<BudgetOptimizationModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  stats,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
              <Cpu className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Budget Device & Playback Engine Lab
              </h3>
              <p className="text-xs text-zinc-400">
                Low-spec chipset optimization (Helio, Unisoc, Snapdragon 6-series, 2GB/3GB RAM)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Diagnostics Cards */}
        <div className="grid grid-cols-3 gap-2.5 my-4">
          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
              <Gauge className="w-3.5 h-3.5 text-emerald-400" />
              Framerate
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {stats.fps} <span className="text-xs font-normal text-zinc-500">FPS</span>
            </div>
            <div className="text-[10px] text-emerald-400 font-medium mt-0.5">
              {stats.droppedFrames === 0 ? '0 dropped frames' : `${stats.droppedFrames} dropped`}
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-cyan-400" />
              Buffer Health
            </div>
            <div className="text-lg font-mono font-bold text-white">
              {stats.bufferHealthSeconds.toFixed(1)} <span className="text-xs font-normal text-zinc-500">sec</span>
            </div>
            <div className="text-[10px] text-cyan-400 font-medium mt-0.5">
              {config.lowRamBufferMode ? 'Safe bounded (15MB)' : 'Standard (60MB+)'}
            </div>
          </div>

          <div className="bg-zinc-900/80 border border-zinc-800/80 p-3 rounded-xl">
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 mb-1">
              <BatteryCharging className="w-3.5 h-3.5 text-amber-400" />
              Thermal Mode
            </div>
            <div className="text-lg font-mono font-bold text-emerald-400">
              Cool & Stable
            </div>
            <div className="text-[10px] text-zinc-500 mt-0.5">
              Direct HW Surface
            </div>
          </div>
        </div>

        {/* Toggles & Strategies */}
        <div className="space-y-3.5 pt-2">
          {/* Strategy 1: MediaCodecSelector Hardware Decoder */}
          <div className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-zinc-200">
                  Hardware Decoder Priority (MediaCodecSelector)
                </span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.2 rounded font-mono">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Prioritizes dedicated silicon hardware decoders (<code className="text-zinc-300 font-mono">c2.android.hardware</code>, Qualcomm Snapdragon, MediaTek APU) with automatic software fallback if unsupported.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={config.hardwareAcceleration}
                onChange={(e) => onUpdateConfig({ ...config, hardwareAcceleration: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>

          {/* Strategy 2: Low-RAM DefaultLoadControl */}
          <div className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-zinc-200">
                  Low-RAM Buffer Strategy (DefaultLoadControl)
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Restricts pre-buffer pool to 12s-25s (15MB cap) instead of standard 100MB+. Eliminates Out-of-Memory (OOM) crashes by Android Low Memory Killer on 2GB, 3GB, and 4GB RAM devices.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={config.lowRamBufferMode}
                onChange={(e) => onUpdateConfig({ ...config, lowRamBufferMode: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>

          {/* Strategy 3: 4K Surface Downscaling */}
          <div className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-zinc-200">
                  Surface Resolution Downscaling (4K to Native Panel)
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Downscales 4K / UHD video decode buffers to match the device's native screen resolution (e.g. 720p/1080p). Eliminates wasted memory bandwidth and stops phone overheating.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={config.surfaceDownsample}
                onChange={(e) => onUpdateConfig({ ...config, surfaceDownsample: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
            </label>
          </div>

          {/* Strategy 4: Show Live Performance HUD */}
          <div className="p-3.5 bg-zinc-900/50 border border-zinc-800/80 rounded-xl flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-zinc-200">
                  On-Screen Performance Diagnostics HUD
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Displays live real-time FPS counter, dropped frames, decoded resolution, and buffer level directly over the player video surface.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer mt-1">
              <input
                type="checkbox"
                checked={config.showPerfHud}
                onChange={(e) => onUpdateConfig({ ...config, showPerfHud: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-[11px] text-zinc-500 font-mono">
            SurfaceView direct composite • Zero GPU copy
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm rounded-xl transition shadow-lg shadow-emerald-500/20"
          >
            Save & Apply
          </button>
        </div>
      </div>
    </div>
  );
};
