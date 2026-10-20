import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Maximize,
  Minimize,
  Sliders,
  Cpu,
  Lock,
  Unlock,
  Volume2,
  VolumeX,
  ArrowLeft,
  Camera,
  PictureInPicture2,
  Sparkles,
  Zap,
} from 'lucide-react';
import { VideoItem, AspectRatioMode, BudgetOptimizationConfig, PlaybackStats, SubtitleTrack } from '../../types/video';
import { audioEngine } from '../../utils/audioEngine';
import { findActiveCue } from '../../utils/subtitleParser';
import { formatTime } from '../../utils/formatters';
import { GestureOverlay } from './GestureOverlay';
import { AudioSubtitleModal } from './AudioSubtitleModal';
import { BudgetOptimizationModal } from './BudgetOptimizationModal';

interface VideoPlayerProps {
  video: VideoItem;
  onBack: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  onUpdateLastPosition: (id: string, position: number) => void;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  video,
  onBack,
  onNext,
  onPrev,
  onUpdateLastPosition,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(video.lastPlayedPosition || 0);
  const [duration, setDuration] = useState<number>(video.duration || 0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatioMode>('fit');
  const [showControls, setShowControls] = useState<boolean>(true);

  // Gesture Controls & MX Style HUD
  const [brightness, setBrightness] = useState<number>(100); // 0% to 100%
  const [volume, setVolume] = useState<number>(100); // 0% to 200%
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [showLockPrompt, setShowLockPrompt] = useState<boolean>(false);
  const [gestureType, setGestureType] = useState<'none' | 'brightness' | 'volume' | 'seek'>('none');
  const [gestureValue, setGestureValue] = useState<number>(0);
  const [seekTargetTime, setSeekTargetTime] = useState<number>(0);
  const [seekDelta, setSeekDelta] = useState<number>(0);
  const [doubleTapFeedback, setDoubleTapFeedback] = useState<'left' | 'right' | null>(null);

  // Modals
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);

  // Audio & Subtitle configurations
  const [audioProfile, setAudioProfile] = useState<'default' | 'vocal_boost' | 'bass_boost' | 'night_mode'>('default');
  const [subtitleTracks, setSubtitleTracks] = useState<SubtitleTrack[]>(video.subtitles);
  const [selectedSubtitleId, setSelectedSubtitleId] = useState<string | null>(
    video.subtitles.length > 0 ? video.subtitles[0].id : null
  );
  const [subtitleOffsetMs, setSubtitleOffsetMs] = useState<number>(0);
  const [subtitleFontSize, setSubtitleFontSize] = useState<'small' | 'medium' | 'large' | 'xlarge'>('medium');

  // Budget Optimization Config
  const [budgetConfig, setBudgetConfig] = useState<BudgetOptimizationConfig>({
    hardwareAcceleration: true,
    lowRamBufferMode: true,
    surfaceDownsample: video.is4K,
    showPerfHud: false,
  });

  // Diagnostics
  const [playbackStats, setPlaybackStats] = useState<PlaybackStats>({
    fps: 60,
    droppedFrames: 0,
    decodedFrames: 0,
    renderResolution: video.is4K ? '3840 x 2160 (Native UHD)' : `${video.width} x ${video.height}`,
    bufferHealthSeconds: 15.0,
    audioGainMultiplier: 1.0,
  });

  // Gesture tracking refs
  const touchStartRef = useRef<{ x: number; y: number; time: number; target: 'left' | 'right' | 'seek' } | null>(null);
  const lastTapRef = useRef<{ time: number; x: number } | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lockPromptTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize AudioEngine on first play
  const initAudio = useCallback(() => {
    if (videoRef.current) {
      audioEngine.init(videoRef.current);
      audioEngine.setVolume(volume);
      audioEngine.setProfile(audioProfile);
    }
  }, [volume, audioProfile]);

  // Volume change handler
  const handleVolumeChange = (newVol: number) => {
    const clamped = Math.max(0, Math.min(200, newVol));
    setVolume(clamped);
    audioEngine.setVolume(clamped);
    if (videoRef.current) {
      videoRef.current.volume = Math.min(1, clamped / 100);
    }
  };

  // Audio Profile change handler
  const handleAudioProfileChange = (profile: 'default' | 'vocal_boost' | 'bass_boost' | 'night_mode') => {
    setAudioProfile(profile);
    audioEngine.setProfile(profile);
  };

  // Controls auto-hide timer
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (isLocked) {
      setShowControls(false);
      return;
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3500);
  }, [isLocked]);

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [resetControlsTimeout]);

  // Sync Video time & Frame metrics
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (video.lastPlayedPosition && video.lastPlayedPosition > 0) {
      videoEl.currentTime = video.lastPlayedPosition;
    }

    const onTimeUpdate = () => {
      setCurrentTime(videoEl.currentTime);
      onUpdateLastPosition(video.id, videoEl.currentTime);

      // Buffer health
      if (videoEl.buffered.length > 0) {
        const bufferedEnd = videoEl.buffered.end(videoEl.buffered.length - 1);
        const health = Math.max(0, bufferedEnd - videoEl.currentTime);
        setPlaybackStats((prev) => ({
          ...prev,
          bufferHealthSeconds: health,
        }));
      }
    };

    const onLoadedMetadata = () => {
      setDuration(videoEl.duration);
      initAudio();
    };

    const onEnded = () => {
      setIsPlaying(false);
      if (onNext) onNext();
    };

    videoEl.addEventListener('timeupdate', onTimeUpdate);
    videoEl.addEventListener('loadedmetadata', onLoadedMetadata);
    videoEl.addEventListener('ended', onEnded);

    return () => {
      videoEl.removeEventListener('timeupdate', onTimeUpdate);
      videoEl.removeEventListener('loadedmetadata', onLoadedMetadata);
      videoEl.removeEventListener('ended', onEnded);
    };
  }, [video, initAudio, onNext, onUpdateLastPosition]);

  // FPS & Frame Dropped monitor
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    let frameCount = 0;

    const checkMetrics = (now: number) => {
      frameCount++;
      if (now - lastTime >= 1000) {
        const measuredFps = Math.min(60, Math.round((frameCount * 1000) / (now - lastTime)));
        frameCount = 0;
        lastTime = now;

        const videoEl = videoRef.current;
        let dropped = 0;
        let decoded = 0;
        if (videoEl && 'getVideoPlaybackQuality' in videoEl) {
          const q = (videoEl as any).getVideoPlaybackQuality();
          dropped = q.droppedVideoFrames;
          decoded = q.totalVideoFrames;
        }

        setPlaybackStats((prev) => ({
          ...prev,
          fps: measuredFps || 60,
          droppedFrames: dropped,
          decodedFrames: decoded,
        }));
      }
      animationFrameId = requestAnimationFrame(checkMetrics);
    };

    animationFrameId = requestAnimationFrame(checkMetrics);
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    initAudio();
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
    resetControlsTimeout();
  };

  // Skip 10s
  const skipTime = (seconds: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + seconds));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetControlsTimeout();
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else {
        await videoRef.current.requestPictureInPicture();
      }
    } catch {
      // PiP not supported or rejected
    }
  };

  // Take Snapshot / Screenshot
  const takeSnapshot = () => {
    if (!videoRef.current) return;
    const videoEl = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = videoEl.videoWidth || 1920;
    canvas.height = videoEl.videoHeight || 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Snapshot_${video.title.replace(/[^a-z0-9]/gi, '_')}_${Math.floor(currentTime)}s.png`;
    a.click();
  };

  // Aspect Ratio Mode Cycle: Fit -> Stretch -> Crop -> 100% -> Fit
  const cycleAspectRatio = () => {
    const modes: AspectRatioMode[] = ['fit', 'crop', 'stretch', '100'];
    const nextIndex = (modes.indexOf(aspectRatio) + 1) % modes.length;
    setAspectRatio(modes[nextIndex]);
    resetControlsTimeout();
  };

  // Screen Lock Toggle
  const toggleScreenLock = () => {
    setIsLocked((prev) => {
      const next = !prev;
      if (next) {
        setShowControls(false);
      } else {
        setShowControls(true);
      }
      return next;
    });
  };

  // Touch & Pointer Gesture Engine (Left: Brightness, Right: Volume, Horizontal: Seek)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked) {
      setShowLockPrompt(true);
      if (lockPromptTimeoutRef.current) clearTimeout(lockPromptTimeoutRef.current);
      lockPromptTimeoutRef.current = setTimeout(() => setShowLockPrompt(false), 2500);
      return;
    }

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const halfWidth = rect.width / 2;
    const now = performance.now();

    // Check for Double Tap (within 280ms)
    if (lastTapRef.current && now - lastTapRef.current.time < 280) {
      const tapX = lastTapRef.current.x;
      if (tapX < halfWidth) {
        skipTime(-10);
        setDoubleTapFeedback('left');
        setTimeout(() => setDoubleTapFeedback(null), 700);
      } else {
        skipTime(10);
        setDoubleTapFeedback('right');
        setTimeout(() => setDoubleTapFeedback(null), 700);
      }
      lastTapRef.current = null;
      touchStartRef.current = null;
      return;
    }

    lastTapRef.current = { time: now, x };
    touchStartRef.current = {
      x,
      y,
      time: now,
      target: x < halfWidth ? 'left' : 'right',
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLocked || !touchStartRef.current) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    const deltaX = currentX - touchStartRef.current.x;
    const deltaY = currentY - touchStartRef.current.y;

    // Detect gesture threshold (12px minimum movement)
    if (Math.abs(deltaX) < 12 && Math.abs(deltaY) < 12) return;

    // Horizontal Seek gesture (if horizontal displacement is greater than vertical)
    if (Math.abs(deltaX) > Math.abs(deltaY) * 1.5) {
      const seekRatio = deltaX / rect.width;
      const targetDelta = seekRatio * Math.min(180, duration); // up to 3 mins drag
      const targetTime = Math.max(0, Math.min(duration, currentTime + targetDelta));
      setGestureType('seek');
      setSeekDelta(targetDelta);
      setSeekTargetTime(targetTime);
      return;
    }

    // Vertical gestures (Left: Brightness, Right: Volume)
    if (touchStartRef.current.target === 'left') {
      const sensitivity = 0.5;
      const change = -deltaY * sensitivity;
      const newBrightness = Math.max(10, Math.min(100, brightness + change));
      setBrightness(newBrightness);
      setGestureType('brightness');
      setGestureValue(newBrightness);
    } else {
      const sensitivity = 0.8;
      const change = -deltaY * sensitivity;
      const newVolume = Math.max(0, Math.min(200, volume + change));
      handleVolumeChange(newVolume);
      setGestureType('volume');
      setGestureValue(newVolume);
    }
  };

  const handlePointerUp = () => {
    if (gestureType === 'seek' && videoRef.current) {
      videoRef.current.currentTime = seekTargetTime;
      setCurrentTime(seekTargetTime);
    }

    // Dismiss HUD overlay after delay
    setTimeout(() => {
      setGestureType('none');
    }, 400);

    touchStartRef.current = null;
  };

  // Find active subtitle cue
  const activeSubtitle = subtitleTracks.find((s) => s.id === selectedSubtitleId);
  const activeCue = activeSubtitle ? findActiveCue(activeSubtitle.cues, currentTime, subtitleOffsetMs) : null;

  // Aspect ratio class calculation
  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case 'stretch':
        return 'w-full h-full object-fill';
      case 'crop':
        return 'w-full h-full object-cover scale-105';
      case '100':
        return 'w-auto h-auto max-w-none object-none';
      case 'fit':
      default:
        return 'w-full h-full object-contain';
    }
  };

  // Subtitle font size class
  const getSubtitleFontClass = () => {
    switch (subtitleFontSize) {
      case 'small':
        return 'text-sm md:text-base py-1 px-3';
      case 'large':
        return 'text-xl md:text-2xl py-2 px-5';
      case 'xlarge':
        return 'text-2xl md:text-3xl py-2.5 px-6 font-bold';
      case 'medium':
      default:
        return 'text-base md:text-lg py-1.5 px-4';
    }
  };

  return (
    <div
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      className="relative w-full h-full bg-black select-none overflow-hidden font-sans flex items-center justify-center cursor-default"
      style={{
        filter: `brightness(${brightness}%)`,
      }}
    >
      {/* 1. Video Element / Surface */}
      <video
        ref={videoRef}
        src={video.uri}
        autoPlay
        playsInline
        className={`${getAspectRatioClass()} transition-transform duration-200`}
        onClick={() => {
          if (!isLocked) resetControlsTimeout();
        }}
      />

      {/* 2. Subtitle Renderer */}
      {activeCue && (
        <div className="absolute bottom-20 md:bottom-24 left-1/2 -translate-x-1/2 max-w-2xl text-center pointer-events-none z-20 px-4">
          <span
            className={`inline-block ${getSubtitleFontClass()} bg-black/80 text-yellow-300 rounded-xl backdrop-blur-sm shadow-xl font-medium tracking-wide leading-relaxed border border-yellow-500/20`}
          >
            {activeCue.text}
          </span>
        </div>
      )}

      {/* 3. MX Player Gesture Overlay HUD */}
      <GestureOverlay
        gestureType={gestureType}
        gestureValue={gestureValue}
        seekTargetTime={seekTargetTime}
        seekDelta={seekDelta}
        doubleTapFeedback={doubleTapFeedback}
        isLocked={isLocked}
        onToggleLock={toggleScreenLock}
        showLockPrompt={showLockPrompt}
      />

      {/* 4. Real-time Diagnostics HUD (If enabled in Budget Lab) */}
      {budgetConfig.showPerfHud && (
        <div className="absolute top-16 left-6 z-25 bg-black/85 backdrop-blur-md border border-emerald-500/40 rounded-xl p-3 text-xs font-mono text-zinc-300 pointer-events-none shadow-2xl space-y-1">
          <div className="text-emerald-400 font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Cpu className="w-3.5 h-3.5" /> Media3 Diagnostics HUD
          </div>
          <div>FPS: <span className="text-emerald-300 font-bold">{playbackStats.fps}</span> (Direct SurfaceView)</div>
          <div>Dropped: <span className={playbackStats.droppedFrames > 0 ? 'text-amber-400' : 'text-emerald-400'}>{playbackStats.droppedFrames} frames</span></div>
          <div>Buffer: <span className="text-cyan-300">{playbackStats.bufferHealthSeconds.toFixed(1)}s</span></div>
          <div>Codec: <span className="text-zinc-200">{video.codec}</span></div>
          <div>Mode: <span className="text-amber-300">{budgetConfig.surfaceDownsample ? 'Downscaled Surface (720p/1080p)' : 'Full Hardware UHD'}</span></div>
        </div>
      )}

      {/* 5. Screen Lock Floating Toggle (Always accessible) */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleScreenLock();
        }}
        title={isLocked ? 'Tap to unlock player controls' : 'Lock screen touches'}
        className={`absolute left-5 top-1/2 -translate-y-1/2 z-40 p-3 rounded-2xl border transition-all duration-200 shadow-2xl ${
          isLocked
            ? 'bg-red-500/20 hover:bg-red-500/30 border-red-500/60 text-red-400 scale-110 animate-pulse'
            : 'bg-black/60 hover:bg-black/90 border-zinc-700/60 text-zinc-300 hover:text-white'
        }`}
      >
        {isLocked ? <Lock className="w-6 h-6" /> : <Unlock className="w-5 h-5 opacity-60 hover:opacity-100" />}
      </button>

      {/* 6. Top Bar (Header) */}
      <div
        className={`absolute top-0 left-0 right-0 z-30 p-4 md:p-6 bg-gradient-to-b from-black/90 via-black/50 to-transparent flex items-center justify-between transition-opacity duration-300 ${
          showControls && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
            title="Return to Video Library"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h2 className="text-sm md:text-base font-bold text-white truncate max-w-xs md:max-w-md">
              {video.title}
            </h2>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-zinc-400">
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-[11px] font-medium text-zinc-300">
                {video.folder}
              </span>
              <span>{video.sizeFormatted}</span>
              {video.is4K && (
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold text-[10px]">
                  4K UHD
                </span>
              )}
              {video.is60fps && (
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold text-[10px]">
                  60 FPS
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Top Right Actions */}
        <div className="flex items-center gap-2">
          {/* Aspect Ratio Toggle */}
          <button
            onClick={cycleAspectRatio}
            className="px-3 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 text-xs font-semibold flex items-center gap-1.5 transition"
            title="Cycle Aspect Ratio (Fit / Crop / Stretch / 100%)"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="uppercase">{aspectRatio}</span>
          </button>

          {/* Budget Device Lab Button */}
          <button
            onClick={() => setIsBudgetModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-emerald-400 hover:text-emerald-300 border border-zinc-800 transition flex items-center gap-1.5"
            title="Budget Phone Optimization Lab (ExoPlayer MediaCodecSelector & Downscaling)"
          >
            <Cpu className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Engine Lab</span>
          </button>

          {/* Audio & Subtitle Modal Trigger */}
          <button
            onClick={() => setIsAudioModalOpen(true)}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-amber-400 hover:text-amber-300 border border-zinc-800 transition flex items-center gap-1.5"
            title="Audio Tracks & Subtitle Settings"
          >
            <Sliders className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Audio/Sub</span>
          </button>

          {/* Screenshot Tool */}
          <button
            onClick={takeSnapshot}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
            title="Capture Screenshot (PNG)"
          >
            <Camera className="w-4 h-4" />
          </button>

          {/* Picture in Picture */}
          <button
            onClick={togglePiP}
            className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
            title="Picture-in-Picture"
          >
            <PictureInPicture2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7. Bottom Transport & Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-30 p-4 md:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent transition-opacity duration-300 ${
          showControls && !isLocked ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Scrubber Seekbar */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-mono text-zinc-400 min-w-[45px]">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 group py-2 cursor-pointer">
            <input
              type="range"
              min="0"
              max={duration || 100}
              step="0.1"
              value={currentTime}
              onChange={(e) => {
                const target = Number(e.target.value);
                if (videoRef.current) videoRef.current.currentTime = target;
                setCurrentTime(target);
                resetControlsTimeout();
              }}
              className="w-full accent-amber-500 h-1.5 group-hover:h-2.5 bg-zinc-800/90 rounded-lg cursor-pointer transition-all"
            />
          </div>
          <span className="text-xs font-mono text-zinc-400 min-w-[45px] text-right">
            {formatTime(duration)}
          </span>
        </div>

        {/* Playback Control Actions */}
        <div className="flex items-center justify-between">
          {/* Left: Skip & Play/Pause */}
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => skipTime(-10)}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Rewind 10 Seconds"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={togglePlay}
              className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black shadow-lg shadow-amber-500/25 transition transform active:scale-95"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black ml-0.5" />}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Fast Forward 10 Seconds"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Quick Volume & Boost Badge */}
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-zinc-800">
              <button
                onClick={() => handleVolumeChange(volume === 0 ? 100 : 0)}
                className="text-zinc-400 hover:text-white transition"
              >
                {volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
              </button>
              <span className={`text-xs font-mono font-bold ${volume > 100 ? 'text-amber-400 flex items-center gap-1' : 'text-zinc-300'}`}>
                {volume}% {volume > 100 && <Zap className="w-3 h-3 text-amber-400" />}
              </span>
            </div>
          </div>

          {/* Right: Speed & Fullscreen */}
          <div className="flex items-center gap-2 md:gap-3">
            {/* Speed Selector */}
            <div className="flex items-center bg-zinc-900/80 border border-zinc-800 rounded-xl p-0.5">
              {[0.5, 1.0, 1.25, 1.5, 2.0].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setPlaybackSpeed(s);
                    if (videoRef.current) videoRef.current.playbackRate = s;
                    resetControlsTimeout();
                  }}
                  className={`px-2 py-1 text-xs rounded-lg font-mono font-medium transition ${
                    playbackSpeed === s
                      ? 'bg-amber-500 text-black font-bold'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition"
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AudioSubtitleModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        volume={volume}
        onVolumeChange={handleVolumeChange}
        audioProfile={audioProfile}
        onAudioProfileChange={handleAudioProfileChange}
        subtitles={subtitleTracks}
        selectedSubtitleId={selectedSubtitleId}
        onSelectSubtitle={setSelectedSubtitleId}
        onAddCustomSubtitle={(newTrack) => {
          setSubtitleTracks((prev) => [...prev, newTrack]);
        }}
        subtitleOffsetMs={subtitleOffsetMs}
        onSubtitleOffsetChange={setSubtitleOffsetMs}
        subtitleFontSize={subtitleFontSize}
        onSubtitleFontSizeChange={setSubtitleFontSize}
      />

      <BudgetOptimizationModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        config={budgetConfig}
        onUpdateConfig={setBudgetConfig}
        stats={playbackStats}
      />
    </div>
  );
};
