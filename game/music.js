// Optional music: audio failure never blocks the game or camera.
export class GameMusic {
  constructor({ Context = globalThis.AudioContext || globalThis.webkitAudioContext, fetchAudio = (...args) => globalThis.fetch(...args), storage } = {}) {
    this.Context = Context; this.fetchAudio = fetchAudio;
    try { this.storage = storage ?? globalThis.localStorage; } catch { this.storage = null; }
    this.running = false; this.boosted = false; this.disposed = false;
    this.offset = 0; this.effects = new Set();
    try { this.muted = this.storage?.getItem('mimix-music-muted') === 'true'; } catch { this.muted = false; }
  }
  unlock() {
    if (this.disposed || !this.Context) return;
    try {
      if (!this.context) {
        this.context = new this.Context();
        this.gain = this.context.createGain();
        this.gain.gain.value = this.muted ? 0 : .35;
        this.effectsGain = this.context.createGain();
        this.effectsGain.gain.value = this.muted ? 0 : .3;
        this.effectsGain.connect(this.context.destination);
        this.gain.connect(this.context.destination);
      }
      // Called from a click, before camera permissions or the countdown.
      this.context.resume().catch(() => {});
      if (!this.loading && !this.buffer) {
        this.loading = this.fetchAudio(new URL('./assets/audio/pushing-ahead.mp3', import.meta.url))
          .then(response => { if (!response.ok) throw new Error('Music unavailable'); return response.arrayBuffer(); })
          .then(bytes => this.context.decodeAudioData(bytes))
          .then(buffer => { if (!this.disposed) { this.buffer = buffer; if (this.running) this.ensureSource(); } })
          .catch(error => { console.warn('No se pudo cargar la música:', error); }).finally(() => { this.loading = null; });
      }
    } catch { /* Unsupported or denied audio is silent. */ }
  }
  ensureSource() {
    if (!this.buffer || this.source || this.disposed) return;
    this.source = this.context.createBufferSource();
    this.source.buffer = this.buffer; this.source.loop = true;
    this.source.playbackRate.value = this.boosted ? 1.2 : 1;
    this.source.connect(this.gain); this.source.start(0, this.offset % this.buffer.duration);
    this.rateFrom = this.rateTo = this.boosted ? 1.2 : 1;
    this.rateAt = this.context.currentTime;
  }
  // Integrate the tempo ramp so pausing preserves the exact musical position.
  capturePosition() {
    if (!this.source) return;
    const elapsed = Math.max(0, this.context.currentTime - this.rateAt);
    const ramp = Math.min(elapsed, .7);
    this.offset += this.rateFrom * ramp + (this.rateTo - this.rateFrom) * ramp * ramp / 1.4
      + this.rateTo * Math.max(0, elapsed - .7);
    this.rateFrom += (this.rateTo - this.rateFrom) * Math.min(1, elapsed / .7);
    this.rateAt = this.context.currentTime;
  }
  stopMusic() {
    this.capturePosition();
    this.source?.stop(); this.source?.disconnect(); this.source = null;
  }
  setRunning(running, restart = false) {
    this.running = running;
    if (!this.context || this.disposed) return;
    if (restart || !running) this.stopMusic();
    if (restart) { this.offset = 0; this.boosted = false; }
    if (running) { this.ensureSource(); this.context.resume().catch(() => {}); }
  }
  setBoost(active) {
    if (this.boosted === active) return;
    this.boosted = active;
    if (!this.source || this.disposed) return;
    this.capturePosition();
    const rate = this.source.playbackRate, now = this.context.currentTime;
    this.rateTo = active ? 1.2 : 1;
    rate.cancelScheduledValues(now);
    rate.setValueAtTime(this.rateFrom, now);
    rate.linearRampToValueAtTime(this.rateTo, now + .7);
  }
  playEffect(kind) {
    if (!this.context || this.disposed || this.muted) return;
    const notes = {
      coin: [[1047, 0, .07], [1568, .065, .13]],
      tick: [[660, 0, .12]],
      go: [[880, 0, .12], [1320, .09, .2]],
      lose: [[392, 0, .16], [311, .15, .17], [196, .32, .4]],
    }[kind];
    if (!notes) return;
    this.context.resume().catch(() => {});
    for (const [frequency, delay, duration] of notes) {
      const oscillator = this.context.createOscillator(), envelope = this.context.createGain();
      const at = this.context.currentTime + delay;
      oscillator.type = kind === 'lose' ? 'triangle' : 'sine';
      oscillator.frequency.value = frequency;
      envelope.gain.setValueAtTime(0, at);
      envelope.gain.linearRampToValueAtTime(.45, at + .008);
      envelope.gain.exponentialRampToValueAtTime(.001, at + duration);
      oscillator.connect(envelope); envelope.connect(this.effectsGain);
      this.effects.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); envelope.disconnect(); this.effects.delete(oscillator); };
      oscillator.start(at); oscillator.stop(at + duration + .01);
    }
  }
  toggleMuted() {
    this.muted = !this.muted;
    try { this.storage?.setItem('mimix-music-muted', String(this.muted)); } catch { /* Optional preference. */ }
    if (this.gain) this.gain.gain.setTargetAtTime(this.muted ? 0 : .35, this.context.currentTime, .06);
    if (this.effectsGain) this.effectsGain.gain.setTargetAtTime(this.muted ? 0 : .3, this.context.currentTime, .02);
    this.unlock();
    return this.muted;
  }
  dispose() {
    this.disposed = true; this.source?.stop(); this.source?.disconnect();
    for (const effect of this.effects) effect.stop();
    this.effects.clear();
    this.context?.close().catch(() => {});
  }
}
