type AudioCtor = typeof AudioContext;

/** Procedural Web Audio sound effects. No audio assets. */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  muted = false;

  /** Must be called from a user gesture to unlock audio. */
  unlock(): void {
    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : 0.5;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setMuted(m: boolean): void {
    this.muted = m;
    if (this.master) this.master.gain.value = m ? 0 : 0.5;
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType, vol: number, endFreq?: number): void {
    if (!this.ctx || !this.master) return;
    const t0 = this.ctx.currentTime + start;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(this.master);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  private noise(dur: number, vol: number, cutoff: number): void {
    if (!this.ctx || !this.master) return;
    const len = Math.floor(this.ctx.sampleRate * dur);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const f = this.ctx.createBiquadFilter();
    f.type = 'lowpass';
    f.frequency.value = cutoff;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(vol, this.ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    src.connect(f).connect(g).connect(this.master);
    src.start();
  }

  coin(): void { this.tone(988, 0, 0.1, 'square', 0.15); this.tone(1319, 0.08, 0.18, 'square', 0.15); }
  lane(): void { this.tone(300, 0, 0.06, 'triangle', 0.08, 450); }
  helmet(): void { this.tone(440, 0, 0.12, 'sine', 0.2); this.tone(660, 0.1, 0.2, 'sine', 0.2); }
  nitro(): void { this.tone(120, 0, 0.8, 'sawtooth', 0.2, 900); this.noise(0.6, 0.2, 3000); }
  pothole(): void { this.tone(90, 0, 0.18, 'square', 0.25, 50); this.noise(0.15, 0.3, 600); }
  crash(): void { this.noise(0.7, 0.6, 900); this.tone(110, 0, 0.5, 'sine', 0.5, 35); }

  startEngine(): void {
    if (!this.ctx || !this.master || this.engineOsc) return;
    this.engineOsc = this.ctx.createOscillator();
    this.engineGain = this.ctx.createGain();
    this.engineOsc.type = 'sawtooth';
    this.engineOsc.frequency.value = 60;
    this.engineGain.gain.value = 0.04;
    this.engineOsc.connect(this.engineGain).connect(this.master);
    this.engineOsc.start();
  }

  /** Rev pitch tracks world speed. */
  setEngineSpeed(speed: number): void {
    if (this.engineOsc && this.ctx) this.engineOsc.frequency.setTargetAtTime(50 + speed * 0.22, this.ctx.currentTime, 0.1);
  }

  stopEngine(): void {
    if (!this.engineOsc) return;
    try { this.engineOsc.stop(); } catch { /* already stopped */ }
    this.engineOsc.disconnect();
    this.engineGain?.disconnect();
    this.engineOsc = null;
    this.engineGain = null;
  }

  dispose(): void {
    this.stopEngine();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
  }
}
