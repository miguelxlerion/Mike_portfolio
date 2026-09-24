"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Nodes = {
  ctx: AudioContext;
  master: GainNode;
  stop: () => void;
};

/**
 * A small generative ambient bed (no audio files): two detuned drones,
 * a slow filtered-noise "wind" layer and an occasional bell.
 */
export function useAmbientAudio() {
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const nodesRef = useRef<Nodes | null>(null);

  const build = useCallback((): Nodes | null => {
    const Ctor =
      typeof window !== "undefined"
        ? window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext
        : undefined;
    if (!Ctor) return null;

    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);

    const reverb = ctx.createConvolver();
    const len = ctx.sampleRate * 2.4;
    const impulse = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c += 1) {
      const data = impulse.getChannelData(c);
      for (let i = 0; i < len; i += 1) {
        data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
      }
    }
    reverb.buffer = impulse;
    const wet = ctx.createGain();
    wet.gain.value = 0.35;
    reverb.connect(wet);
    wet.connect(master);

    // Drones
    const droneFreqs = [73.42, 110, 164.81, 220];
    const oscs: OscillatorNode[] = [];
    droneFreqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = i % 2 === 0 ? "sine" : "triangle";
      osc.frequency.value = f;
      osc.detune.value = (i - 1.5) * 6;

      const g = ctx.createGain();
      g.gain.value = 0.12 / (i + 1);

      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.03 + i * 0.017;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.05;
      lfo.connect(lfoGain);
      lfoGain.connect(g.gain);

      osc.connect(g);
      g.connect(master);
      g.connect(reverb);
      osc.start();
      lfo.start();
      oscs.push(osc, lfo);
    });

    // Wind / street noise
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 4, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0);
    for (let i = 0; i < nd.length; i += 1) nd[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;
    noise.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 420;
    bp.Q.value = 0.7;
    const ng = ctx.createGain();
    ng.gain.value = 0.05;
    const nlfo = ctx.createOscillator();
    nlfo.frequency.value = 0.05;
    const nlfoGain = ctx.createGain();
    nlfoGain.gain.value = 0.03;
    nlfo.connect(nlfoGain);
    nlfoGain.connect(ng.gain);
    noise.connect(bp);
    bp.connect(ng);
    ng.connect(master);
    ng.connect(reverb);
    noise.start();
    nlfo.start();

    // Sparse bells
    const scale = [329.63, 392, 440, 493.88, 587.33];
    const timer = window.setInterval(() => {
      if (ctx.state !== "running") return;
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = scale[Math.floor(Math.random() * scale.length)];
      const now = ctx.currentTime;
      g.gain.setValueAtTime(0, now);
      g.gain.linearRampToValueAtTime(0.06, now + 0.04);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 3.2);
      osc.connect(g);
      g.connect(reverb);
      g.connect(master);
      osc.start(now);
      osc.stop(now + 3.4);
    }, 6200);

    const stop = () => {
      window.clearInterval(timer);
      oscs.forEach((o) => {
        try {
          o.stop();
        } catch {
          /* already stopped */
        }
      });
      try {
        noise.stop();
        nlfo.stop();
      } catch {
        /* noop */
      }
      void ctx.close();
    };

    return { ctx, master, stop };
  }, []);

  const fade = useCallback((to: number) => {
    const n = nodesRef.current;
    if (!n) return;
    const now = n.ctx.currentTime;
    n.master.gain.cancelScheduledValues(now);
    n.master.gain.setValueAtTime(n.master.gain.value, now);
    n.master.gain.linearRampToValueAtTime(to, now + 1.6);
  }, []);

  const toggle = useCallback(() => {
    if (!nodesRef.current) {
      const built = build();
      if (!built) return;
      nodesRef.current = built;
      setReady(true);
    }
    const n = nodesRef.current;
    if (!n) return;
    if (n.ctx.state === "suspended") void n.ctx.resume();

    setEnabled((prev) => {
      fade(prev ? 0 : 0.55);
      return !prev;
    });
  }, [build, fade]);

  useEffect(() => {
    return () => {
      nodesRef.current?.stop();
      nodesRef.current = null;
    };
  }, []);

  return { enabled, ready, toggle };
}
