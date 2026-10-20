import React, { useState, useRef, useEffect } from 'react';
import { VideoItem } from './types/video';
import { SAMPLE_VIDEOS } from './data/sampleVideos';
import { formatBytes } from './utils/formatters';
import { Navbar } from './components/Navigation/Navbar';
import { VideoLibrary } from './components/Library/VideoLibrary';
import { VideoPlayer } from './components/Player/VideoPlayer';
import { KotlinCodeViewer } from './components/SourceCode/KotlinCodeViewer';

export default function App() {
  const [videos, setVideos] = useState<VideoItem[]>(() => {
    // Check if there are saved last positions in localStorage
    try {
      const saved = localStorage.getItem('novaplayer_positions');
      if (saved) {
        const positions = JSON.parse(saved);
        return SAMPLE_VIDEOS.map((v) => ({
          ...v,
          lastPlayedPosition: positions[v.id] || 0,
        }));
      }
    } catch {
      // Fallback
    }
    return SAMPLE_VIDEOS;
  });

  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [currentTab, setCurrentTab] = useState<'player' | 'code'>('player');
  const globalFileInputRef = useRef<HTMLInputElement>(null);

  // Update last played position
  const handleUpdateLastPosition = (id: string, position: number) => {
    setVideos((prev) => {
      const next = prev.map((v) => (v.id === id ? { ...v, lastPlayedPosition: position } : v));
      try {
        const map: Record<string, number> = {};
        next.forEach((item) => {
          if (item.lastPlayedPosition) map[item.id] = item.lastPlayedPosition;
        });
        localStorage.setItem('novaplayer_positions', JSON.stringify(map));
      } catch {
        // Ignored
      }
      return next;
    });
  };

  // Import local user video files
  const handleImportFiles = (files: FileList) => {
    const newItems: VideoItem[] = [];

    Array.from(files).forEach((file, index) => {
      const blobUrl = URL.createObjectURL(file);
      const tempVideo = document.createElement('video');
      tempVideo.src = blobUrl;
      tempVideo.preload = 'metadata';

      tempVideo.onloadedmetadata = () => {
        const width = tempVideo.videoWidth || 1920;
        const height = tempVideo.videoHeight || 1080;
        const duration = tempVideo.duration || 60;
        const is4K = width >= 3840 || height >= 2160;

        const newItem: VideoItem = {
          id: `local-${Date.now()}-${index}`,
          title: file.name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '),
          fileName: file.name,
          uri: blobUrl,
          file,
          folder: 'Imported',
          duration,
          sizeFormatted: formatBytes(file.size),
          sizeBytes: file.size,
          width,
          height,
          is4K,
          is60fps: false,
          codec: file.type || 'Video Stream',
          bitrate: `${Math.round((file.size * 8) / (duration * 1000000))} Mbps`,
          dateAdded: 'Just now',
          subtitles: [],
        };

        setVideos((prev) => [newItem, ...prev]);

        // Auto-play the first imported video
        if (index === 0) {
          setSelectedVideo(newItem);
        }
      };
    });
  };

  // Next & Previous Video
  const handleNextVideo = () => {
    if (!selectedVideo) return;
    const currentIndex = videos.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex !== -1 && currentIndex < videos.length - 1) {
      setSelectedVideo(videos[currentIndex + 1]);
    }
  };

  const handlePrevVideo = () => {
    if (!selectedVideo) return;
    const currentIndex = videos.findIndex((v) => v.id === selectedVideo.id);
    if (currentIndex > 0) {
      setSelectedVideo(videos[currentIndex - 1]);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Hidden file input for Navbar '+ Select Local File' */}
      <input
        type="file"
        ref={globalFileInputRef}
        multiple
        accept="video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImportFiles(e.target.files);
          }
        }}
      />

      {/* Main Player Screen takes entire viewport when a video is selected */}
      {selectedVideo ? (
        <div className="fixed inset-0 z-50 bg-black">
          <VideoPlayer
            video={selectedVideo}
            onBack={() => setSelectedVideo(null)}
            onNext={handleNextVideo}
            onPrev={handlePrevVideo}
            onUpdateLastPosition={handleUpdateLastPosition}
          />
        </div>
      ) : (
        <>
          {/* Navigation Bar */}
          <Navbar
            currentTab={currentTab}
            onTabChange={setCurrentTab}
            onOpenLocalFile={() => globalFileInputRef.current?.click()}
            isPlayingVideo={false}
          />

          {/* Body Content */}
          <main className="flex-1">
            {currentTab === 'player' ? (
              <VideoLibrary
                videos={videos}
                onSelectVideo={setSelectedVideo}
                onImportFiles={handleImportFiles}
              />
            ) : (
              <KotlinCodeViewer />
            )}
          </main>
        </>
      )}
    </div>
  );
}
