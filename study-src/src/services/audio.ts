import { AmbientSoundType } from '../types';

class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private ambientSource: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private ambientFilter: BiquadFilterNode | null = null;
  private currentType: AmbientSoundType = 'none';
  private volume: number = 0.5;

  private initContext() {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.ambientGain && this.ctx) {
      this.ambientGain.gain.setValueAtTime(this.volume * 0.28, this.ctx.currentTime);
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public getCurrentType(): AmbientSoundType {
    return this.currentType;
  }

  public stopAmbient() {
    if (this.ambientSource) {
      try {
        this.ambientSource.stop();
        this.ambientSource.disconnect();
      } catch {
        // ignore if already stopped
      }
      this.ambientSource = null;
    }
    this.currentType = 'none';
  }

  public playAmbient(type: AmbientSoundType) {
    this.initContext();
    if (!this.ctx) return;

    this.stopAmbient();
    this.currentType = type;

    if (type === 'none') return;

    const sampleRate = this.ctx.sampleRate;
    const bufferDuration = 2.5; // 2.5 seconds loop buffer
    const bufferSize = sampleRate * bufferDuration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      if (type === 'white') {
        // Pure soothing white noise
        output[i] = (Math.random() * 2 - 1) * 0.6;
      } else if (type === 'rain') {
        // Pink-filtered steady rainfall with gentle drops
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.025 * white) / 1.025;
        lastOut = output[i];
        output[i] *= 2.6;
        // occasional raindrops
        if (Math.random() < 0.0003) {
          output[i] += (Math.random() - 0.5) * 1.5;
        }
      } else if (type === 'fire') {
        // Cozy campfire with warm low rumble & occasional crackles
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.045 * white) / 1.045;
        lastOut = output[i];
        output[i] *= 2.2;
        // realistic wood pop / crackle
        if (Math.random() < 0.0008) {
          const crackle = (Math.random() - 0.5) * 4.5;
          output[i] += crackle;
          if (i + 1 < bufferSize) output[i + 1] += crackle * -0.6;
        }
      }
    }

    this.ambientSource = this.ctx.createBufferSource();
    this.ambientSource.buffer = noiseBuffer;
    this.ambientSource.loop = true;

    this.ambientFilter = this.ctx.createBiquadFilter();
    if (type === 'rain') {
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.value = 1100;
    } else if (type === 'fire') {
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.value = 750;
    } else {
      this.ambientFilter.type = 'lowpass';
      this.ambientFilter.frequency.value = 4000;
    }

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(this.volume * 0.28, this.ctx.currentTime);

    this.ambientSource.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientSource.start();
  }

  public playChime() {
    this.initContext();
    if (!this.ctx) return;

    // Harmonic pentatonic arpeggio: C5 (523.25), E5 (659.25), G5 (783.99), C6 (1046.50)
    const chords = [523.25, 659.25, 783.99, 1046.5];
    const now = this.ctx.currentTime;

    chords.forEach((freq, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.11);

      gain.gain.setValueAtTime(0, now + idx * 0.11);
      gain.gain.linearRampToValueAtTime(0.18, now + idx * 0.11 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.11 + 1.4);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.11);
      osc.stop(now + idx * 0.11 + 1.45);
    });
  }

  public playTick() {
    this.initContext();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.05);
  }
}

export const audioSynth = new AudioSynthesizer();
