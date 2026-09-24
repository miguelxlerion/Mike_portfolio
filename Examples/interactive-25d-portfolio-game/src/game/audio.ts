// Tiny procedural WebAudio synth — no assets, just oscillators.
export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;

  ensure() {
    if (!this.ctx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (AC) this.ctx = new AC();
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
  }

  private tone(
    f0: number,
    f1: number,
    dur: number,
    type: OscillatorType,
    vol: number,
    delay = 0
  ) {
    if (this.muted || !this.ctx) return;
    const t0 = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f0, t0);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, f1), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  jump(dbl = false) {
    this.tone(dbl ? 420 : 300, dbl ? 900 : 640, 0.14, "square", 0.06);
  }
  coin() {
    this.tone(880, 880, 0.06, "square", 0.05);
    this.tone(1320, 1320, 0.1, "square", 0.05, 0.06);
  }
  hit() {
    this.tone(220, 55, 0.28, "sawtooth", 0.09);
  }
  land() {
    this.tone(140, 90, 0.07, "triangle", 0.04);
  }
  slide() {
    this.tone(500, 180, 0.12, "sawtooth", 0.03);
  }
  goal() {
    const seq = [523, 659, 784, 1047];
    seq.forEach((f, i) => this.tone(f, f, 0.12, "square", 0.06, i * 0.09));
  }
  click() {
    this.tone(700, 500, 0.05, "square", 0.04);
  }
  over() {
    const seq = [392, 330, 262, 196];
    seq.forEach((f, i) => this.tone(f, f, 0.16, "sawtooth", 0.06, i * 0.13));
  }
}
