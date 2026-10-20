import React, { useRef } from 'react';
import { Volume2, VolumeX, Sliders, Type, Clock, Upload, Check, Zap, X } from 'lucide-react';
import { SubtitleTrack } from '../../types/video';
import { parseSrt, parseVtt } from '../../utils/subtitleParser';

interface AudioSubtitleModalProps {
  isOpen: boolean;
  onClose: () => void;
  volume: number; // 0 to 200
  onVolumeChange: (vol: number) => void;
  audioProfile: 'default' | 'vocal_boost' | 'bass_boost' | 'night_mode';
  onAudioProfileChange: (profile: 'default' | 'vocal_boost' | 'bass_boost' | 'night_mode') => void;
  subtitles: SubtitleTrack[];
  selectedSubtitleId: string | null;
  onSelectSubtitle: (id: string | null) => void;
  onAddCustomSubtitle: (track: SubtitleTrack) => void;
  subtitleOffsetMs: number;
  onSubtitleOffsetChange: (offsetMs: number) => void;
  subtitleFontSize: 'small' | 'medium' | 'large' | 'xlarge';
  onSubtitleFontSizeChange: (size: 'small' | 'medium' | 'large' | 'xlarge') => void;
}

export const AudioSubtitleModal: React.FC<AudioSubtitleModalProps> = ({
  isOpen,
  onClose,
  volume,
  onVolumeChange,
  audioProfile,
  onAudioProfileChange,
  subtitles,
  selectedSubtitleId,
  onSelectSubtitle,
  onAddCustomSubtitle,
  subtitleOffsetMs,
  onSubtitleOffsetChange,
  subtitleFontSize,
  onSubtitleFontSizeChange,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const cues = file.name.endsWith('.vtt') ? parseVtt(content) : parseSrt(content);
      const newTrack: SubtitleTrack = {
        id: `custom-${Date.now()}`,
        label: `${file.name.replace(/\.[^/.]+$/, '')} (Custom)`,
        language: 'custom',
        isCustom: true,
        cues,
      };
      onAddCustomSubtitle(newTrack);
      onSelectSubtitle(newTrack.id);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg bg-zinc-950/95 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-bold">Audio & Subtitle Settings</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Volume & 200% Super-Boost */}
        <div className="py-4 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
              {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              Volume Level
            </span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
              volume > 100 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-zinc-800 text-zinc-300'
            }`}>
              {volume}% {volume > 100 && '⚡ 200% BOOST'}
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="200"
            step="1"
            value={volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
          />

          <div className="flex justify-between text-[11px] text-zinc-500 mt-1 font-mono">
            <span>0% (Mute)</span>
            <span>100% (Standard)</span>
            <span className="text-amber-400">200% (Hardware Loudness Boost)</span>
          </div>

          {volume > 100 && (
            <p className="text-[11px] text-amber-300/80 mt-2 bg-amber-950/30 p-2 rounded-lg border border-amber-900/40 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 flex-shrink-0 text-amber-400" />
              Web Audio DynamicsCompressor active: Limiting peaks to preserve fidelity without hardware distortion.
            </p>
          )}
        </div>

        {/* Section 2: Sound Profiles / Equalizer */}
        <div className="py-4 border-b border-zinc-800/80">
          <label className="text-sm font-semibold text-zinc-300 block mb-2.5">
            Cinema Sound Profiles
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'default', title: 'Flat / Original', desc: 'Natural balanced audio mix' },
              { id: 'vocal_boost', title: 'Dialogue Clarifier', desc: 'Boosts Tamil/Hindi/English speech frequencies' },
              { id: 'bass_boost', title: 'Bass Punch', desc: 'Deep low-end rumble for action tracks' },
              { id: 'night_mode', title: 'Night HDR Balancer', desc: 'Compresses loud gunshots, lifts quiet whispers' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => onAudioProfileChange(p.id as any)}
                className={`p-3 rounded-xl text-left border transition text-xs ${
                  audioProfile === p.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-sm'
                    : 'bg-zinc-900/80 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <div className="font-semibold text-zinc-200 flex items-center justify-between">
                  {p.title}
                  {audioProfile === p.id && <Check className="w-3.5 h-3.5 text-amber-400" />}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">{p.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Subtitles Selector & Upload */}
        <div className="py-4 border-b border-zinc-800/80">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-sm font-semibold text-zinc-300">Subtitle Tracks</span>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-xs flex items-center gap-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-2.5 py-1 rounded-lg border border-amber-500/20 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload .SRT / .VTT
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".srt,.vtt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>

          <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
            <button
              onClick={() => onSelectSubtitle(null)}
              className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition border ${
                selectedSubtitleId === null
                  ? 'bg-zinc-800/90 border-zinc-700 text-white font-medium'
                  : 'bg-zinc-900/40 border-zinc-900 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-300'
              }`}
            >
              <span>Subtitles Disabled (Off)</span>
              {selectedSubtitleId === null && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {subtitles.map((sub) => (
              <button
                key={sub.id}
                onClick={() => onSelectSubtitle(sub.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs transition border ${
                  selectedSubtitleId === sub.id
                    ? 'bg-amber-500/15 border-amber-500/50 text-white font-medium'
                    : 'bg-zinc-900/40 border-zinc-900 text-zinc-300 hover:bg-zinc-900 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{sub.label}</span>
                  {sub.isCustom && (
                    <span className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded text-amber-300">User Added</span>
                  )}
                </div>
                {selectedSubtitleId === sub.id && <Check className="w-4 h-4 text-amber-400" />}
              </button>
            ))}
          </div>
        </div>

        {/* Section 4: Subtitle Sync Offset Slider */}
        {selectedSubtitleId !== null && (
          <div className="py-4 border-b border-zinc-800/80">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-zinc-300 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-amber-400" />
                Subtitle Sync / Offset
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {subtitleOffsetMs > 0 ? `+${subtitleOffsetMs} ms` : `${subtitleOffsetMs} ms`}
              </span>
            </div>

            <input
              type="range"
              min="-5000"
              max="5000"
              step="50"
              value={subtitleOffsetMs}
              onChange={(e) => onSubtitleOffsetChange(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-zinc-800 rounded-lg cursor-pointer"
            />

            {/* Quick offset buttons */}
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                onClick={() => onSubtitleOffsetChange(subtitleOffsetMs - 500)}
                className="px-2 py-1 text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white"
              >
                -500ms
              </button>
              <button
                onClick={() => onSubtitleOffsetChange(subtitleOffsetMs - 100)}
                className="px-2 py-1 text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white"
              >
                -100ms
              </button>
              <button
                onClick={() => onSubtitleOffsetChange(0)}
                className="px-2 py-1 text-[11px] bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded text-zinc-200"
              >
                Reset (0ms)
              </button>
              <button
                onClick={() => onSubtitleOffsetChange(subtitleOffsetMs + 100)}
                className="px-2 py-1 text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white"
              >
                +100ms
              </button>
              <button
                onClick={() => onSubtitleOffsetChange(subtitleOffsetMs + 500)}
                className="px-2 py-1 text-[11px] bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded text-zinc-400 hover:text-white"
              >
                +500ms
              </button>
            </div>
          </div>
        )}

        {/* Section 5: Subtitle Font Size */}
        {selectedSubtitleId !== null && (
          <div className="pt-4">
            <span className="text-sm font-semibold text-zinc-300 block mb-2 flex items-center gap-1.5">
              <Type className="w-4 h-4 text-amber-400" />
              Subtitle Display Size
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'small', label: 'Small' },
                { id: 'medium', label: 'Medium' },
                { id: 'large', label: 'Large' },
                { id: 'xlarge', label: 'Huge' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => onSubtitleFontSizeChange(s.id as any)}
                  className={`py-2 text-xs rounded-lg border font-medium transition ${
                    subtitleFontSize === s.id
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Footer Done Button */}
        <div className="mt-6 pt-4 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-xl transition shadow-lg shadow-amber-500/20"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
