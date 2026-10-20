/**
 * Hardware-grade Web Audio Engine for NovaPlayer
 * Features:
 * - 200% Hardware Volume Boost with DynamicsCompressor soft-knee limiter (prevents speaker distortion)
 * - Multi-track sound profile simulation (Dialogue Clarifier, Bass Boost, Night Mode HDR balancer)
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private source: MediaElementAudioSourceNode | null = null;
  private gainNode: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private vocalFilter: BiquadFilterNode | null = null;
  private bassFilter: BiquadFilterNode | null = null;
  private attachedElement: HTMLMediaElement | null = null;

  public init(mediaElement: HTMLMediaElement) {
    if (this.attachedElement === mediaElement && this.ctx) {
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.source = this.ctx.createMediaElementSource(mediaElement);
      this.attachedElement = mediaElement;

      // 1. Gain Node (supports up to 2.0 = 200% volume boost)
      this.gainNode = this.ctx.createGain();
      this.gainNode.gain.value = 1.0;

      // 2. Soft-knee peak limiter/compressor for 200% boost without clipping distortion
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-4, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(10, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.25, this.ctx.currentTime);

      // 3. Dialogue / Speech enhancer filter (boosts 2.2 kHz for speech clarity in movies)
      this.vocalFilter = this.ctx.createBiquadFilter();
      this.vocalFilter.type = 'peaking';
      this.vocalFilter.frequency.setValueAtTime(2400, this.ctx.currentTime);
      this.vocalFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);
      this.vocalFilter.gain.setValueAtTime(0, this.ctx.currentTime);

      // 4. Bass filter (sub-bass / punch)
      this.bassFilter = this.ctx.createBiquadFilter();
      this.bassFilter.type = 'lowshelf';
      this.bassFilter.frequency.setValueAtTime(120, this.ctx.currentTime);
      this.bassFilter.gain.setValueAtTime(0, this.ctx.currentTime);

      // Chain: Source -> Bass -> Vocal -> Gain -> Compressor -> Destination
      this.source.connect(this.bassFilter);
      this.bassFilter.connect(this.vocalFilter);
      this.vocalFilter.connect(this.gainNode);
      this.gainNode.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    } catch {
      // AudioContext already connected or blocked
    }
  }

  public setVolume(level: number) {
    // level: 0 to 200
    if (!this.gainNode || !this.ctx) return;
    const gainValue = Math.max(0, Math.min(2.0, level / 100));
    try {
      this.gainNode.gain.setTargetAtTime(gainValue, this.ctx.currentTime, 0.01);
    } catch {
      this.gainNode.gain.value = gainValue;
    }
  }

  public setProfile(profile: 'default' | 'vocal_boost' | 'bass_boost' | 'night_mode') {
    if (!this.ctx || !this.vocalFilter || !this.bassFilter || !this.compressor) return;
    const now = this.ctx.currentTime;

    switch (profile) {
      case 'vocal_boost':
        // Boost human voice clarity (Tamil/Hindi/Dialogue enhancement)
        this.vocalFilter.gain.setTargetAtTime(6.0, now, 0.05);
        this.bassFilter.gain.setTargetAtTime(-2.0, now, 0.05);
        this.compressor.threshold.setTargetAtTime(-6, now, 0.05);
        this.compressor.ratio.setTargetAtTime(8, now, 0.05);
        break;

      case 'bass_boost':
        this.vocalFilter.gain.setTargetAtTime(0, now, 0.05);
        this.bassFilter.gain.setTargetAtTime(7.0, now, 0.05);
        this.compressor.threshold.setTargetAtTime(-3, now, 0.05);
        this.compressor.ratio.setTargetAtTime(10, now, 0.05);
        break;

      case 'night_mode':
        // Compresses high dynamic explosions and boosts quiet dialogue
        this.vocalFilter.gain.setTargetAtTime(3.5, now, 0.05);
        this.bassFilter.gain.setTargetAtTime(-4.0, now, 0.05);
        this.compressor.threshold.setTargetAtTime(-14, now, 0.05);
        this.compressor.ratio.setTargetAtTime(16, now, 0.05);
        break;

      case 'default':
      default:
        this.vocalFilter.gain.setTargetAtTime(0, now, 0.05);
        this.bassFilter.gain.setTargetAtTime(0, now, 0.05);
        this.compressor.threshold.setTargetAtTime(-4, now, 0.05);
        this.compressor.ratio.setTargetAtTime(12, now, 0.05);
        break;
    }
  }

  public resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }
}

export const audioEngine = new AudioEngine();
