import React, { useState } from 'react';
import {
  Code,
  Copy,
  Check,
  Download,
  FileCode,
  ShieldCheck,
  Cpu,
  Zap,
  FolderTree,
  ExternalLink,
} from 'lucide-react';
import JSZip from 'jszip';
import { KOTLIN_PROJECT_FILES, KotlinFile } from '../../data/kotlinSourceCode';

export const KotlinCodeViewer: React.FC = () => {
  const [activeFileIndex, setActiveFileIndex] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);

  const activeFile = KOTLIN_PROJECT_FILES[activeFileIndex];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeFile.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard error fallback
    }
  };

  const handleDownloadSingle = () => {
    const blob = new Blob([activeFile.code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeFile.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();

      // Add all project files into zip hierarchy
      KOTLIN_PROJECT_FILES.forEach((f) => {
        zip.file(f.path, f.code);
      });

      // Add README.md
      const readmeContent = `# NovaPlayer - High-Performance Android Video Player
Built with Kotlin, Jetpack Compose, and AndroidX Media3 (ExoPlayer).

## Core Architecture for Low-Spec / Budget Phones:
1. **MediaCodecSelector Hardware Decoders**: Prioritizes silicon decoders (Qualcomm/MediaTek) and gracefully falls back to software decoders if 4K limits are exceeded.
2. **Low-Memory DefaultLoadControl**: Restricts memory buffer to 15MB (instead of 100MB+) to prevent Out-of-Memory (OOM) kills on 2GB/3GB RAM Android phones.
3. **SurfaceView Direct Rendering**: Hardware compositing directly onto screen surface, bypassing TextureView rendering overhead to save battery.
4. **LoudnessEnhancer 200% Super-Boost**: Uses Android's native audiofx LoudnessEnhancer for clean amplification.
5. **Scoped Storage MediaStore**: Android 11 to 15 (API 30-35) compliant storage queries.
`;
      zip.file('README.md', readmeContent);

      const content = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'NovaPlayer-Android-Media3-Kotlin-Source.zip';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // Error
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-4 md:p-8 select-none">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-850">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                <Code className="w-5 h-5" />
              </span>
              <h1 className="text-xl md:text-2xl font-black text-white">
                Android Kotlin & Jetpack Compose Source Studio
              </h1>
            </div>
            <p className="text-xs text-zinc-400 mt-1">
              Production-ready AndroidX Media3 (ExoPlayer) implementation with hardware decoder priority and low-RAM optimization.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadZip}
              disabled={isZipping}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center gap-2 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              {isZipping ? 'Generating ZIP...' : 'Export Android Project (.ZIP)'}
            </button>
          </div>
        </div>

        {/* Technical Architecture Callouts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              MediaCodecSelector Hardware Decoders
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Sorts codecs to favor silicon hardware blocks (<code className="text-zinc-300">c2.android.hardware</code>) with automatic graceful fallback to software if 4K fails.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
              <Cpu className="w-4 h-4" />
              Low-RAM DefaultLoadControl
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Tuned buffer durations (12s-25s, 15MB memory cap) preventing Android LMK (Low Memory Killer) crashes on 2GB/3GB/4GB budget devices.
            </p>
          </div>

          <div className="p-3.5 bg-zinc-950/70 border border-zinc-850 rounded-xl space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-400">
              <Zap className="w-4 h-4" />
              LoudnessEnhancer 200% Boost
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Hooks into the ExoPlayer audioSessionId with <code className="text-zinc-300">LoudnessEnhancer</code> for clean 200% volume boost without speaker blowout.
            </p>
          </div>
        </div>

        {/* File Tabs & Code Box */}
        <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
          {/* File Tab Bar */}
          <div className="flex items-center justify-between bg-zinc-900/90 px-4 py-2 border-b border-zinc-800 overflow-x-auto">
            <div className="flex items-center gap-1">
              {KOTLIN_PROJECT_FILES.map((file, idx) => (
                <button
                  key={file.name}
                  onClick={() => setActiveFileIndex(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-mono transition ${
                    activeFileIndex === idx
                      ? 'bg-zinc-800 text-amber-400 font-bold border border-zinc-700'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-850'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{file.name}</span>
                </button>
              ))}
            </div>

            {/* Actions: Copy & Single Download */}
            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={handleCopy}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition"
                title="Copy code"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>

              <button
                onClick={handleDownloadSingle}
                className="px-2.5 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white rounded-lg text-xs font-medium border border-zinc-700 flex items-center gap-1.5 transition"
                title="Download this file"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* File description banner */}
          <div className="bg-zinc-900/40 px-5 py-2.5 border-b border-zinc-850 flex items-center justify-between text-xs text-zinc-400">
            <div className="flex items-center gap-2">
              <FolderTree className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-mono text-zinc-300">{activeFile.path}</span>
            </div>
            <div className="text-[11px] text-zinc-500 hidden sm:block">
              {activeFile.description}
            </div>
          </div>

          {/* Code Area */}
          <div className="p-4 md:p-6 bg-black/60 overflow-x-auto max-h-[600px] overflow-y-auto">
            <pre className="font-mono text-xs md:text-sm text-zinc-200 leading-relaxed selection:bg-amber-500/30 selection:text-white">
              <code>{activeFile.code}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
