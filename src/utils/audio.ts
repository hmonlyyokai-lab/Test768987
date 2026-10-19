// Web Audio API Synthesizer with cinema-grade Fireworks Acoustics & Celestial Melodies

class AudioManager {
  private ctx: AudioContext | null = null;
  public sfxEnabled: boolean = true;
  public musicEnabled: boolean = false;
  private musicInterval: number | null = null;
  private currentNoteIndex: number = 0;

  private melody = [
    { note: 261.63, dur: 0.35, pause: 0.4 },  // Hap-
    { note: 261.63, dur: 0.35, pause: 0.4 },  // py
    { note: 293.66, dur: 0.6, pause: 0.7 },   // Birth-
    { note: 261.63, dur: 0.6, pause: 0.7 },   // day
    { note: 349.23, dur: 0.6, pause: 0.7 },   // to
    { note: 329.63, dur: 1.1, pause: 1.3 },   // you
    
    { note: 261.63, dur: 0.35, pause: 0.4 },  // Hap-
    { note: 261.63, dur: 0.35, pause: 0.4 },  // py
    { note: 293.66, dur: 0.6, pause: 0.7 },   // Birth-
    { note: 261.63, dur: 0.6, pause: 0.7 },   // day
    { note: 392.00, dur: 0.6, pause: 0.7 },   // to
    { note: 349.23, dur: 1.1, pause: 1.3 },   // you
    
    { note: 261.63, dur: 0.35, pause: 0.4 },  // Hap-
    { note: 261.63, dur: 0.35, pause: 0.4 },  // py
    { note: 523.25, dur: 0.6, pause: 0.7 },   // dear
    { note: 440.00, dur: 0.6, pause: 0.7 },   // Aa-
    { note: 349.23, dur: 0.6, pause: 0.7 },   // dh-
    { note: 329.63, dur: 0.6, pause: 0.7 },   // ya-
    { note: 293.66, dur: 1.1, pause: 1.3 },   // !
    
    { note: 466.16, dur: 0.35, pause: 0.4 },  // Hap-
    { note: 466.16, dur: 0.35, pause: 0.4 },  // py
    { note: 440.00, dur: 0.6, pause: 0.7 },   // Birth-
    { note: 349.23, dur: 0.6, pause: 0.7 },   // day
    { note: 392.00, dur: 0.8, pause: 0.9 },   // to
    { note: 349.23, dur: 1.6, pause: 2.0 },   // you~
  ];

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  // Realistic rocket ascending whoosh & whistle
  public playLaunchSound() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.7 + Math.random() * 0.2;

      // 1. Air rush noise (whoosh)
      const bufferSize = Math.floor(ctx.sampleRate * duration);
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(320, now);
      bandpass.frequency.exponentialRampToValueAtTime(1400, now + duration);
      bandpass.Q.setValueAtTime(3.5, now);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.01, now);
      noiseGain.gain.linearRampToValueAtTime(0.08, now + duration * 0.6);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(ctx.destination);
      noise.start(now);
      noise.stop(now + duration);

      // 2. High ascending whistle tone
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450 + Math.random() * 80, now);
      osc.frequency.exponentialRampToValueAtTime(1100 + Math.random() * 300, now + duration);

      oscGain.gain.setValueAtTime(0.005, now);
      oscGain.gain.linearRampToValueAtTime(0.04, now + duration * 0.5);
      oscGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration);
    } catch {
      // Audio fallback
    }
  }

  // Realistic Fireworks Explosion: Crisp transient + deep sub-boom + stereo body + crackle tail
  public playExplosionSound(pitch = 1) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // 1. Supersonic snap / blast transient (sharp high crack)
      const snapOsc = ctx.createOscillator();
      const snapGain = ctx.createGain();
      snapOsc.type = 'triangle';
      snapOsc.frequency.setValueAtTime(380 * pitch, now);
      snapOsc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

      snapGain.gain.setValueAtTime(0.4, now);
      snapGain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

      snapOsc.connect(snapGain);
      snapGain.connect(ctx.destination);
      snapOsc.start(now);
      snapOsc.stop(now + 0.09);

      // 2. Deep Sub-bass Thump / Boom
      const subOsc = ctx.createOscillator();
      const subGain = ctx.createGain();
      subOsc.type = 'sine';
      subOsc.frequency.setValueAtTime(95 * pitch, now);
      subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.85);

      subGain.gain.setValueAtTime(0.65, now);
      subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      subOsc.connect(subGain);
      subGain.connect(ctx.destination);
      subOsc.start(now);
      subOsc.stop(now + 0.95);

      // 3. Muffled blast blast-body (low-pass filtered noise)
      const blastDur = 0.6;
      const blastBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * blastDur), ctx.sampleRate);
      const bData = blastBuf.getChannelData(0);
      for (let i = 0; i < bData.length; i++) {
        bData[i] = Math.random() * 2 - 1;
      }
      const blastNoise = ctx.createBufferSource();
      blastNoise.buffer = blastBuf;

      const blastFilter = ctx.createBiquadFilter();
      blastFilter.type = 'lowpass';
      blastFilter.frequency.setValueAtTime(1100 * pitch, now);
      blastFilter.frequency.exponentialRampToValueAtTime(160, now + blastDur);

      const blastGain = ctx.createGain();
      blastGain.gain.setValueAtTime(0.45, now);
      blastGain.gain.exponentialRampToValueAtTime(0.001, now + blastDur);

      blastNoise.connect(blastFilter);
      blastFilter.connect(blastGain);
      blastGain.connect(ctx.destination);
      blastNoise.start(now);
      blastNoise.stop(now + blastDur);

      // 4. Staggered Willow streamer crackles
      const crackleDelay = 0.18 + Math.random() * 0.15;
      setTimeout(() => {
        this.playCrackleSound();
        if (Math.random() > 0.4) {
          setTimeout(() => this.playCrackleSound(), 140 + Math.random() * 180);
        }
      }, crackleDelay * 1000);
    } catch {
      // Audio fallback
    }
  }

  // Realistic sizzling crackle pops for falling streamers
  public playCrackleSound() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const popCount = 6 + Math.floor(Math.random() * 8);
      for (let i = 0; i < popCount; i++) {
        const offset = (i * 0.04) + Math.random() * 0.06;
        const now = ctx.currentTime + offset;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = Math.random() > 0.5 ? 'triangle' : 'sawtooth';
        osc.frequency.setValueAtTime(1800 + Math.random() * 2800, now);

        gain.gain.setValueAtTime(0.06 + Math.random() * 0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.04);
      }
    } catch {
      // Audio fallback
    }
  }

  // Pentatonic star chime for Star Maker
  public playStarChime(order = 0) {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const pentatonic = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50, 1174.66, 1318.51];
      const freq = pentatonic[order % pentatonic.length];

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);

      const harmonic = ctx.createOscillator();
      const harmGain = ctx.createGain();
      harmonic.type = 'sine';
      harmonic.frequency.setValueAtTime(freq * 2, now);
      harmGain.gain.setValueAtTime(0.04, now);
      harmGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);
      harmonic.connect(harmGain);
      harmGain.connect(ctx.destination);

      osc.start(now);
      harmonic.start(now);
      osc.stop(now + 0.85);
      harmonic.stop(now + 0.85);
    } catch {
      // Audio fallback
    }
  }

  public playUndoSound() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(260, now + 0.15);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.16);
    } catch {
      // Ignore
    }
  }

  public playClearSound() {
    if (!this.sfxEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(160, now + 0.25);

      gain.gain.setValueAtTime(0.09, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    } catch {
      // Ignore
    }
  }

  // Play peaceful music box "Happy Birthday" melody
  public toggleMusic(enable?: boolean) {
    const nextState = enable !== undefined ? enable : !this.musicEnabled;
    this.musicEnabled = nextState;

    if (this.musicInterval) {
      window.clearInterval(this.musicInterval);
      this.musicInterval = null;
    }

    if (this.musicEnabled) {
      this.getContext();
      this.playNextMusicNote();
    }
    return this.musicEnabled;
  }

  private playNextMusicNote = () => {
    if (!this.musicEnabled) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const noteItem = this.melody[this.currentNoteIndex];
    this.currentNoteIndex = (this.currentNoteIndex + 1) % this.melody.length;

    try {
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(noteItem.note, now);

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(noteItem.note * 2.756, now);

      gainNode.gain.setValueAtTime(0.001, now);
      gainNode.gain.linearRampToValueAtTime(0.07, now + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, now + noteItem.dur);

      osc1.connect(gainNode);
      osc2.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + noteItem.dur);
      osc2.stop(now + noteItem.dur);
    } catch {
      // Ignore
    }

    const nextDelay = noteItem.pause * 1000;
    this.musicInterval = window.setTimeout(this.playNextMusicNote, nextDelay);
  };
}

export const audioManager = new AudioManager();
