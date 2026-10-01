/**
 * Procedural Web Audio API Sound & Ambient BGM Engine
 * Zero external audio files required: 100% synthesized in real-time.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private bgmFilter: BiquadFilterNode | null = null;
  private sfxGain: GainNode | null = null;
  private bgmGain: GainNode | null = null;

  private isBgmPlaying = false;
  private bgmLoopTimer: number | null = null;
  private isUnlocked = false;

  private volume = 0.65;
  private isMuted = false;
  private sfxEnabled = true;
  private bgmEnabled = true;
  private bgmMode: 'LOFI' | 'SYNTHWAVE' = 'LOFI';
  private chordIndex = 0;

  // Chord frequencies (Hz) for atmospheric progression
  // Lo-Fi: Dm9, G13, Cmaj9, Am9
  private readonly lofiChords = [
    [146.83, 220.00, 261.63, 329.63, 392.00], // Dm9 (D3, A3, C4, E4, G4)
    [196.00, 246.94, 293.66, 329.63, 440.00], // G13 (G3, B3, D4, E4, A4)
    [130.81, 196.00, 246.94, 261.63, 329.63], // Cmaj9 (C3, G3, B3, C4, E4)
    [110.00, 164.81, 220.00, 261.63, 329.63], // Am9 (A2, E3, A3, C4, E4)
  ];

  // Synthwave: F#m, D, A, E
  private readonly synthwaveChords = [
    [185.00, 220.00, 277.18, 369.99], // F#m
    [146.83, 220.00, 293.66, 369.99], // D
    [110.00, 220.00, 277.18, 329.63], // A
    [164.81, 246.94, 329.63, 392.00], // E
  ];

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master output node
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // BGM Filter (for dynamic low-pass muffle effect when modals/drawers open)
      this.bgmFilter = this.ctx.createBiquadFilter();
      this.bgmFilter.type = 'lowpass';
      this.bgmFilter.frequency.setValueAtTime(16000, this.ctx.currentTime);
      this.bgmFilter.Q.setValueAtTime(1.0, this.ctx.currentTime);

      // BGM Gain
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.bgmGain.connect(this.bgmFilter);
      this.bgmFilter.connect(this.masterGain);

      // SFX Gain
      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.isUnlocked = this.ctx.state === 'running';
    } catch (e) {
      console.warn('Web Audio API not supported in this environment', e);
    }
  }

  public async unlockAudio(): Promise<boolean> {
    this.init();
    if (!this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (e) {
        console.warn('Audio resume error', e);
      }
    }
    this.isUnlocked = this.ctx.state === 'running';
    return this.isUnlocked;
  }

  public setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (this.masterGain && this.ctx && !this.isMuted) {
      this.masterGain.gain.setTargetAtTime(this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
  }

  public setBgmEnabled(enabled: boolean) {
    this.bgmEnabled = enabled;
    if (!enabled && this.isBgmPlaying) {
      this.stopBGM();
    } else if (enabled && !this.isBgmPlaying) {
      this.startBGM();
    }
  }

  public setSfxEnabled(enabled: boolean) {
    this.sfxEnabled = enabled;
  }

  public setBgmMode(mode: 'LOFI' | 'SYNTHWAVE') {
    this.bgmMode = mode;
  }

  /**
   * Applies the muffled club/modal low-pass filter effect
   */
  public setMuffled(muffled: boolean) {
    if (!this.bgmFilter || !this.ctx) return;
    const targetFreq = muffled ? 650 : 16000;
    const targetQ = muffled ? 2.5 : 1.0;
    this.bgmFilter.frequency.setTargetAtTime(targetFreq, this.ctx.currentTime, 0.2);
    this.bgmFilter.Q.setTargetAtTime(targetQ, this.ctx.currentTime, 0.2);
  }

  /**
   * Starts looping ambient background music
   */
  public startBGM() {
    if (this.isBgmPlaying || !this.bgmEnabled) return;
    this.unlockAudio();
    this.isBgmPlaying = true;
    this.chordIndex = 0;
    this.scheduleChordStep();
  }

  public stopBGM() {
    this.isBgmPlaying = false;
    if (this.bgmLoopTimer !== null) {
      window.clearTimeout(this.bgmLoopTimer);
      this.bgmLoopTimer = null;
    }
  }

  public toggleBGM() {
    if (this.isBgmPlaying) {
      this.stopBGM();
    } else {
      this.startBGM();
    }
    return this.isBgmPlaying;
  }

  private scheduleChordStep() {
    if (!this.isBgmPlaying || !this.ctx || !this.bgmGain) return;

    const chords = this.bgmMode === 'LOFI' ? this.lofiChords : this.synthwaveChords;
    const currentChord = chords[this.chordIndex % chords.length];
    this.chordIndex++;

    const now = this.ctx.currentTime;
    const stepDuration = this.bgmMode === 'LOFI' ? 3.8 : 2.6; // Seconds per chord

    // Synthesize Pad Oscillators
    currentChord.forEach((freq, idx) => {
      if (!this.ctx || !this.bgmGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      // Warm lo-fi triangle & sine blend
      osc.type = idx === 0 ? 'sine' : this.bgmMode === 'LOFI' ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle detune for lush analog chorus warmth
      const detune = (idx - 2) * 5;
      osc.detune.setValueAtTime(detune, now);

      // Envelope
      const peakGain = 0.08 / currentChord.length;
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(peakGain, now + 1.2);
      gain.gain.setValueAtTime(peakGain * 0.8, now + stepDuration - 0.6);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration);

      osc.connect(gain);
      gain.connect(this.bgmGain);

      osc.start(now);
      osc.stop(now + stepDuration + 0.1);
    });

    // Sub Bass Pulse on root note
    const bassFreq = currentChord[0] / 2;
    const bassOsc = this.ctx.createOscillator();
    const bassGain = this.ctx.createGain();
    bassOsc.type = 'sine';
    bassOsc.frequency.setValueAtTime(bassFreq, now);

    bassGain.gain.setValueAtTime(0.001, now);
    bassGain.gain.exponentialRampToValueAtTime(0.09, now + 0.15);
    bassGain.gain.exponentialRampToValueAtTime(0.0001, now + stepDuration * 0.9);

    bassOsc.connect(bassGain);
    bassGain.connect(this.bgmGain);
    bassOsc.start(now);
    bassOsc.stop(now + stepDuration);

    // Lo-Fi Vinyl Crackle / Air hiss
    this.playVinylCrackle(now, stepDuration);

    // Schedule next chord
    this.bgmLoopTimer = window.setTimeout(() => {
      this.scheduleChordStep();
    }, (stepDuration - 0.2) * 1000);
  }

  private playVinylCrackle(time: number, duration: number) {
    if (!this.ctx || !this.bgmGain) return;
    try {
      const bufferSize = this.ctx.sampleRate * 0.5;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        // Sparse gentle noise pops
        data[i] = Math.random() > 0.985 ? (Math.random() * 2 - 1) * 0.12 : (Math.random() * 2 - 1) * 0.01;
      }

      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1400, time);
      bandpass.Q.setValueAtTime(1.5, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.02, time);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(this.bgmGain);

      noise.start(time);
      noise.stop(time + duration);
    } catch {
      // Safe fallback
    }
  }

  // ==========================================
  // SFX Generators (Zero latency, crystal-clear)
  // ==========================================

  public playClick() {
    if (!this.sfxEnabled || !this.masterGain) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(1400, now + 0.04);

    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.05);
  }

  public playDispatch() {
    if (!this.sfxEnabled || !this.masterGain) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;

    // Dual cyber beep sweep
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(440, now);
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12);
    osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.22);

    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(220, now);
    osc2.frequency.exponentialRampToValueAtTime(554.37, now + 0.22);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.sfxGain);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }

  public playTypingKey() {
    if (!this.sfxEnabled || !this.masterGain) return;
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Subtle mechanical switch click (randomized 700Hz - 1100Hz)
    const freq = 750 + Math.random() * 350;
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    gain.gain.setValueAtTime(0.015, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.03);
  }

  public playSuccessChime() {
    if (!this.sfxEnabled || !this.masterGain) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    // Ascending pentatonic chime (E5, G#5, B5, E6)
    const notes = [659.25, 830.61, 987.77, 1318.51];

    notes.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const noteTime = now + idx * 0.08;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.001, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.12, noteTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, noteTime + 0.8);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(noteTime);
      osc.stop(noteTime + 0.85);
    });
  }

  public playErrorBeep() {
    if (!this.sfxEnabled || !this.masterGain) return;
    this.unlockAudio();
    if (!this.ctx || !this.sfxGain) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.setValueAtTime(140, now + 0.1);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.32);
  }

  public getState() {
    return {
      isPlaying: this.isBgmPlaying,
      volume: this.volume,
      isMuted: this.isMuted,
      sfxEnabled: this.sfxEnabled,
      bgmEnabled: this.bgmEnabled,
      mode: this.bgmMode,
      isUnlocked: this.isUnlocked,
    };
  }
}

export const soundEngine = new AudioEngine();
