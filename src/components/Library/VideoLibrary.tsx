import React, { useState, useRef } from 'react';
import {
  Folder,
  Film,
  Search,
  Upload,
  Clock,
  HardDrive,
  Play,
  Sparkles,
  ArrowUpDown,
  CheckCircle2,
  SlidersHorizontal,
} from 'lucide-react';
import { VideoItem } from '../../types/video';
import { formatTime, formatBytes } from '../../utils/formatters';

interface VideoLibraryProps {
  videos: VideoItem[];
  onSelectVideo: (video: VideoItem) => void;
  onImportFiles: (files: FileList) => void;
}

export const VideoLibrary: React.FC<VideoLibraryProps> = ({
  videos,
  onSelectVideo,
  onImportFiles,
}) => {
  const [selectedFolder, setSelectedFolder] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'date' | 'size' | 'duration' | 'name'>('date');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Folder categories
  const folders = [
    { id: 'All', label: 'All Videos', count: videos.length },
    { id: 'Camera', label: 'Camera (DCIM)', count: videos.filter((v) => v.folder === 'Camera').length },
    { id: 'Downloads', label: 'Downloads', count: videos.filter((v) => v.folder === 'Downloads').length },
    { id: 'WhatsApp', label: 'WhatsApp', count: videos.filter((v) => v.folder === 'WhatsApp').length },
    { id: 'Movies', label: 'Movies & Series', count: videos.filter((v) => v.folder === 'Movies').length },
    { id: 'Imported', label: 'Imported Files', count: videos.filter((v) => v.folder === 'Imported').length },
  ];

  // Filter & sort
  const filteredVideos = videos
    .filter((v) => {
      const matchesFolder = selectedFolder === 'All' || v.folder === selectedFolder;
      const matchesSearch =
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.fileName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFolder && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'size') return b.sizeBytes - a.sizeBytes;
      if (sortBy === 'duration') return b.duration - a.duration;
      if (sortBy === 'name') return a.title.localeCompare(b.title);
      return 0; // default order
    });

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImportFiles(e.dataTransfer.files);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`min-h-screen bg-black text-zinc-100 p-4 md:p-8 select-none transition-colors duration-200 ${
        isDragging ? 'bg-amber-950/20' : ''
      }`}
    >
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        multiple
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            onImportFiles(e.target.files);
          }
        }}
      />

      {/* Header Banner */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-850">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-black font-black text-xl shadow-lg shadow-amber-500/20">
                ▶
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  NovaPlayer
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">
                    Media3 Offline Engine
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Ultra-smooth 4K 60fps playback • 200% Loudness Boost • Scoped Storage MediaStore
                </p>
              </div>
            </div>
          </div>

          {/* Quick Import Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs md:text-sm rounded-xl transition shadow-lg shadow-amber-500/25 flex items-center gap-2"
            >
              <Upload className="w-4 h-4" />
              Open Device Videos
            </button>
          </div>
        </div>

        {/* Drag & Drop Alert if dragging */}
        {isDragging && (
          <div className="my-4 p-8 border-2 border-dashed border-amber-400 rounded-2xl bg-amber-500/10 text-center animate-pulse">
            <Film className="w-10 h-10 text-amber-400 mx-auto mb-2" />
            <h3 className="text-base font-bold text-amber-300">Drop video files here</h3>
            <p className="text-xs text-amber-200/80">Immediate offline zero-lag local playback</p>
          </div>
        )}

        {/* Search & Sort Bar */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3 items-center justify-between">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search local videos or folders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs md:text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition"
            />
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <span className="text-xs text-zinc-500 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            <div className="flex bg-zinc-900 border border-zinc-800 rounded-xl p-1 text-xs font-medium">
              {[
                { id: 'date', label: 'Recent' },
                { id: 'size', label: 'Size' },
                { id: 'duration', label: 'Duration' },
                { id: 'name', label: 'Name' },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id as any)}
                  className={`px-3 py-1 rounded-lg transition ${
                    sortBy === s.id
                      ? 'bg-zinc-800 text-amber-400 font-bold shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Smart Folder Pills (Scoped Storage navigation) */}
        <div className="flex items-center gap-2 overflow-x-auto py-4 scrollbar-none">
          {folders.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFolder(f.id)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition border ${
                selectedFolder === f.id
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                  : 'bg-zinc-900/60 border-zinc-800/80 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
              }`}
            >
              <Folder className={`w-3.5 h-3.5 ${selectedFolder === f.id ? 'text-amber-400' : 'text-zinc-500'}`} />
              <span>{f.label}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                selectedFolder === f.id ? 'bg-amber-400 text-black font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}>
                {f.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Video Grid */}
      <div className="max-w-7xl mx-auto">
        {filteredVideos.length === 0 ? (
          <div className="text-center py-16 bg-zinc-950/60 border border-zinc-900 rounded-2xl p-8">
            <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-zinc-300">No videos found</h3>
            <p className="text-xs text-zinc-500 mt-1 mb-4">
              Try selecting a different folder or drop any local MP4, MKV, or WebM video file here.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold rounded-xl border border-zinc-700 transition"
            >
              Select Video from Device
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredVideos.map((video) => (
              <div
                key={video.id}
                onClick={() => onSelectVideo(video)}
                className="group relative bg-zinc-950/80 hover:bg-zinc-900 border border-zinc-800/80 hover:border-amber-500/50 rounded-2xl overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-2xl hover:shadow-amber-500/10 flex flex-col"
              >
                {/* Thumbnail Header with Badges */}
                <div className="relative aspect-video bg-zinc-900 overflow-hidden">
                  <img
                    src={video.thumbnailUri || 'https://images.unsplash.com/photo-1536240478700-b869070f9279?w=600&auto=format&fit=crop&q=80'}
                    alt={video.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                  {/* Play Hover Overlay Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center text-black shadow-xl shadow-amber-500/40 transform group-hover:scale-110 transition">
                      <Play className="w-5 h-5 fill-black ml-0.5" />
                    </div>
                  </div>

                  {/* Resolution & FPS Badges (Top Right) */}
                  <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                    {video.is4K ? (
                      <span className="bg-gradient-to-r from-amber-500 to-yellow-300 text-black font-black text-[10px] px-2 py-0.5 rounded shadow">
                        4K UHD
                      </span>
                    ) : (
                      <span className="bg-emerald-500/90 text-black font-bold text-[10px] px-2 py-0.5 rounded shadow">
                        1080p FHD
                      </span>
                    )}
                    {video.is60fps && (
                      <span className="bg-cyan-500/90 text-black font-bold text-[10px] px-1.5 py-0.5 rounded shadow">
                        60 FPS
                      </span>
                    )}
                  </div>

                  {/* Duration Pill (Bottom Right) */}
                  <div className="absolute bottom-2.5 right-2.5 bg-black/85 backdrop-blur-sm text-white font-mono text-xs px-2 py-0.5 rounded-md font-semibold">
                    {formatTime(video.duration)}
                  </div>

                  {/* Folder Tag (Bottom Left) */}
                  <div className="absolute bottom-2.5 left-2.5 bg-zinc-900/90 backdrop-blur-sm text-zinc-300 text-[10px] px-2 py-0.5 rounded-md font-medium border border-zinc-700/60 flex items-center gap-1">
                    <Folder className="w-3 h-3 text-amber-400" />
                    {video.folder}
                  </div>

                  {/* Resume Watch Progress Bar */}
                  {video.lastPlayedPosition && video.lastPlayedPosition > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                      <div
                        className="h-full bg-amber-500"
                        style={{ width: `${Math.min(100, (video.lastPlayedPosition / video.duration) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Details Footer */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 group-hover:text-amber-400 transition-colors line-clamp-1">
                      {video.title}
                    </h3>
                    <p className="text-[11px] text-zinc-500 font-mono mt-0.5 truncate">
                      {video.fileName}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center justify-between text-xs text-zinc-400">
                    <div className="flex items-center gap-1">
                      <HardDrive className="w-3.5 h-3.5 text-zinc-500" />
                      <span>{video.sizeFormatted}</span>
                    </div>

                    <div className="text-[11px] font-mono text-zinc-500">
                      {video.codec.split(' ')[0]}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
