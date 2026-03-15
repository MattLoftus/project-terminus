import type { BaseType } from '../data/base-registry';

// ---------------------------------------------------------------------------
// Audio Manager — singleton for ambient + UI sounds via Web Audio API
// ---------------------------------------------------------------------------

type AmbientType = 'wind' | 'hum';

const BASE_AMBIENT: Record<BaseType, AmbientType> = {
  moon: 'hum',
  mars: 'wind',
  titan: 'wind',
  europa: 'hum',
  ceres: 'hum',
  venus: 'wind',
  phobos: 'hum',
};

class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private volume = 0.3;
  private muted = false;

  // Ambient state
  private currentAmbientSource: AudioBufferSourceNode | null = null;
  private currentAmbientGain: GainNode | null = null;
  private currentAmbientType: AmbientType | null = null;
  private ambientBuffers = new Map<AmbientType, AudioBuffer>();

  // ---------------------------------------------------------------------------
  // Init (must be called from user gesture)
  // ---------------------------------------------------------------------------

  async init(): Promise<void> {
    if (this.ctx) return;
    this.ctx = new AudioContext();
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.value = this.volume;
    this.masterGain.connect(this.ctx.destination);

    // Generate ambient buffers procedurally
    this.ambientBuffers.set('hum', this.generateHumBuffer());
    this.ambientBuffers.set('wind', this.generateWindBuffer());
  }

  get initialized(): boolean {
    return this.ctx !== null;
  }

  // ---------------------------------------------------------------------------
  // Volume / mute
  // ---------------------------------------------------------------------------

  setVolume(v: number): void {
    this.volume = Math.max(0, Math.min(1, v));
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx!.currentTime, 0.05);
    }
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx!.currentTime, 0.1);
    }
    return this.muted;
  }

  get isMuted(): boolean {
    return this.muted;
  }

  // ---------------------------------------------------------------------------
  // Ambient loops
  // ---------------------------------------------------------------------------

  switchAmbient(baseType: BaseType, crossfadeMs = 1500): void {
    if (!this.ctx || !this.masterGain) return;

    const type = BASE_AMBIENT[baseType];
    if (type === this.currentAmbientType && this.currentAmbientSource) return;

    const crossfade = crossfadeMs / 1000;

    // Fade out old
    if (this.currentAmbientGain && this.currentAmbientSource) {
      const oldGain = this.currentAmbientGain;
      const oldSource = this.currentAmbientSource;
      oldGain.gain.setTargetAtTime(0, this.ctx.currentTime, crossfade / 3);
      setTimeout(() => {
        try { oldSource.stop(); } catch { /* ignore */ }
      }, crossfadeMs + 500);
    }

    // Fade in new
    const buffer = this.ambientBuffers.get(type);
    if (!buffer) return;

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const gain = this.ctx.createGain();
    gain.gain.value = 0;
    gain.gain.setTargetAtTime(1, this.ctx.currentTime, crossfade / 3);

    source.connect(gain);
    gain.connect(this.masterGain);
    source.start();

    this.currentAmbientSource = source;
    this.currentAmbientGain = gain;
    this.currentAmbientType = type;
  }

  // ---------------------------------------------------------------------------
  // UI sounds (one-shot oscillator synthesis)
  // ---------------------------------------------------------------------------

  playUI(type: 'click' | 'alert' | 'switch'): void {
    if (!this.ctx || !this.masterGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.masterGain);

    switch (type) {
      case 'click':
        osc.frequency.value = 800;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
        break;

      case 'alert':
        osc.frequency.value = 440;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.2, now);
        osc.frequency.setValueAtTime(660, now + 0.1);
        osc.frequency.setValueAtTime(440, now + 0.2);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
        break;

      case 'switch':
        osc.frequency.value = 300;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.12, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.15);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
        break;
    }
  }

  // ---------------------------------------------------------------------------
  // Procedural ambient buffer generation
  // ---------------------------------------------------------------------------

  private generateHumBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 4; // 4-second loop
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Low drone with harmonics
      const fundamental = Math.sin(2 * Math.PI * 60 * t) * 0.3;
      const harmonic1 = Math.sin(2 * Math.PI * 120 * t) * 0.15;
      const harmonic2 = Math.sin(2 * Math.PI * 180 * t) * 0.08;
      // Subtle amplitude modulation
      const modulation = 0.85 + 0.15 * Math.sin(2 * Math.PI * 0.3 * t);
      // Filtered noise
      const noise = (Math.random() * 2 - 1) * 0.02;
      data[i] = (fundamental + harmonic1 + harmonic2 + noise) * modulation;
    }

    // Smooth loop crossfade (fade first+last 1000 samples)
    const fade = 1000;
    for (let i = 0; i < fade; i++) {
      const f = i / fade;
      data[i] *= f;
      data[length - 1 - i] *= f;
    }

    return buffer;
  }

  private generateWindBuffer(): AudioBuffer {
    const ctx = this.ctx!;
    const sampleRate = ctx.sampleRate;
    const duration = 6; // 6-second loop
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);

    // Pre-generate multiple noise octaves for wind character
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Shaped noise with slow modulation (wind gusts)
      const gust1 = Math.sin(2 * Math.PI * 0.15 * t) * 0.5 + 0.5;
      const gust2 = Math.sin(2 * Math.PI * 0.4 * t + 1.3) * 0.3 + 0.5;
      const envelope = 0.3 + 0.7 * gust1 * gust2;
      // Band-limited noise (poor man's brownian)
      const noise = (Math.random() * 2 - 1);
      data[i] = noise * envelope * 0.15;
    }

    // Simple lowpass via averaging
    for (let pass = 0; pass < 3; pass++) {
      for (let i = 1; i < length - 1; i++) {
        data[i] = data[i] * 0.5 + data[i - 1] * 0.25 + data[i + 1] * 0.25;
      }
    }

    // Loop crossfade
    const fade = 2000;
    for (let i = 0; i < fade; i++) {
      const f = i / fade;
      data[i] *= f;
      data[length - 1 - i] *= f;
    }

    return buffer;
  }
}

// Singleton
export const audioManager = new AudioManager();
