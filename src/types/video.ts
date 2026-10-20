export interface SubtitleCue {
  id: string;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface SubtitleTrack {
  id: string;
  label: string;
  language: string;
  isCustom?: boolean;
  cues: SubtitleCue[];
}

export interface AudioTrackOption {
  id: string;
  label: string;
  language: string;
  description: string;
  preset: 'default' | 'vocal_boost' | 'bass_boost' | 'night_mode';
}

export interface VideoItem {
  id: string;
  title: string;
  fileName: string;
  uri: string;
  file?: File;
  folder: 'Camera' | 'Downloads' | 'WhatsApp' | 'Movies' | 'Imported';
  duration: number; // in seconds
  sizeFormatted: string;
  sizeBytes: number;
  width: number;
  height: number;
  is4K: boolean;
  is60fps: boolean;
  codec: string;
  bitrate: string;
  thumbnailUri?: string;
  lastPlayedPosition?: number;
  dateAdded: string;
  subtitles: SubtitleTrack[];
}

export type AspectRatioMode = 'fit' | 'stretch' | '100' | 'crop';

export interface BudgetOptimizationConfig {
  hardwareAcceleration: boolean;
  lowRamBufferMode: boolean; // Simulates ExoPlayer DefaultLoadControl low threshold
  surfaceDownsample: boolean; // Downscales 4K render to 1080p/720p surface to save GPU fillrate
  showPerfHud: boolean;
}

export interface PlaybackStats {
  fps: number;
  droppedFrames: number;
  decodedFrames: number;
  renderResolution: string;
  bufferHealthSeconds: number;
  audioGainMultiplier: number;
}
