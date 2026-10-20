import { SubtitleCue } from '../types/video';

function parseTimestamp(timeString: string): number {
  // Supports 00:01:20,500 or 00:01:20.500 or 01:20.500
  const normalized = timeString.trim().replace(',', '.');
  const parts = normalized.split(':');
  if (parts.length === 3) {
    const hours = parseFloat(parts[0]);
    const minutes = parseFloat(parts[1]);
    const seconds = parseFloat(parts[2]);
    return hours * 3600 + minutes * 60 + seconds;
  } else if (parts.length === 2) {
    const minutes = parseFloat(parts[0]);
    const seconds = parseFloat(parts[1]);
    return minutes * 60 + seconds;
  }
  return 0;
}

export function parseSrt(srtContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];
  const normalized = srtContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalized.split(/\n\s*\n/);

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i].trim();
    if (!block) continue;

    const lines = block.split('\n');
    let timeLineIndex = 0;

    // Check if line 0 is numeric index
    if (lines[0].match(/^\d+$/) && lines.length > 1) {
      timeLineIndex = 1;
    }

    const timeLine = lines[timeLineIndex];
    if (!timeLine || !timeLine.includes('-->')) continue;

    const [startStr, endStr] = timeLine.split('-->');
    if (!startStr || !endStr) continue;

    const startTime = parseTimestamp(startStr);
    const endTime = parseTimestamp(endStr);
    const textLines = lines.slice(timeLineIndex + 1);
    const text = textLines
      .join('\n')
      .replace(/<[^>]*>/g, '') // strip HTML formatting tags like <i>, <b>
      .trim();

    if (text && endTime > startTime) {
      cues.push({
        id: `cue-${i}`,
        startTime,
        endTime,
        text,
      });
    }
  }

  return cues;
}

export function parseVtt(vttContent: string): SubtitleCue[] {
  // WebVTT is identical in structure to SRT after stripping WEBVTT header
  const cleaned = vttContent.replace(/^WEBVTT[^\n]*\n+/i, '');
  return parseSrt(cleaned);
}

export function findActiveCue(cues: SubtitleCue[], currentTime: number, offsetMs: number): SubtitleCue | null {
  const adjustedTime = currentTime - offsetMs / 1000;
  // Binary or linear search
  for (let i = 0; i < cues.length; i++) {
    const cue = cues[i];
    if (adjustedTime >= cue.startTime && adjustedTime <= cue.endTime) {
      return cue;
    }
  }
  return null;
}
