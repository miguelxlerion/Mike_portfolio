import { useSyncExternalStore } from "react";
import { PROJECTS, ZoneId } from "./data";
import { sfx } from "./audio";
import { resetPlayer } from "./playerState";
import { qualifies } from "./storage";
import { input } from "./input";

export type Screen = "menu" | "playing" | "paused" | "over" | "win";

export interface Toast {
  text: string;
  color: string;
  key: number;
}

export interface Banner {
  name: string;
  sub: string;
  key: number;
}

export interface GameState {
  screen: Screen;
  score: number;
  lives: number;
  discovered: string[];
  collectedOrbs: number[];
  squashed: number;
  selectedId: string | null;
  zone: ZoneId;
  muted: boolean;
  elapsed: number;
  shake: number;
  flash: number;
  toast: Toast | null;
  banner: Banner | null;
  hint: boolean;
  pendingWin: boolean;
  runId: number;
}

const listeners = new Set<() => void>();

const initial = (): GameState => ({
  screen: "menu",
  score: 0,
  lives: 3,
  discovered: [],
  collectedOrbs: [],
  squashed: 0,
  selectedId: null,
  zone: "CONCEPT",
  muted: false,
  elapsed: 0,
  shake: 0,
  flash: 0,
  toast: null,
  banner: null,
  hint: true,
  pendingWin: false,
  runId: 0,
});

let state: GameState = initial();

function emit() {
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

export function setState(patch: Partial<GameState>) {
  state = { ...state, ...patch };
  emit();
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useGame<T>(sel: (s: GameState) => T): T {
  return useSyncExternalStore(
    subscribe,
    () => sel(state),
    () => sel(state)
  );
}

export function frozen() {
  const s = state;
  return (
    s.screen !== "playing" || s.selectedId !== null
  );
}

function toast(text: string, color = "#fbbf24") {
  state = {
    ...state,
    toast: { text, color, key: performance.now() },
  };
  emit();
}

export function addScore(n: number, label?: string, color?: string) {
  state = { ...state, score: state.score + n };
  if (label) toast(label, color);
  else emit();
}

export function startGame() {
  sfx.ensure();
  input.jumpQueued = false;
  input.joyActive = false;
  resetPlayer();
  state = {
    ...initial(),
    screen: "playing",
    muted: state.muted,
    banner: {
      name: "CONCEPT",
      sub: "IDEATION & DESIGN",
      key: performance.now(),
    },
    runId: state.runId + 1,
  };
  emit();
  sfx.goal();
}

export function toMenu() {
  resetPlayer();
  state = { ...initial(), muted: state.muted, screen: "menu" };
  emit();
}

export function togglePause() {
  if (state.screen === "playing") {
    setState({ screen: "paused", selectedId: null });
  } else if (state.screen === "paused") {
    setState({ screen: "playing" });
  }
}

export function inspect(id: string) {
  if (state.screen !== "playing") return;
  sfx.ensure();
  const first = !state.discovered.includes(id);
  const discovered = first ? [...state.discovered, id] : state.discovered;
  let score = state.score;
  if (first) {
    score += 500;
    sfx.discover();
  } else {
    sfx.inspect();
  }
  sfx.whoosh();
  state = {
    ...state,
    selectedId: id,
    discovered,
    score,
    hint: false,
    shake: first ? Math.max(state.shake, 4) : state.shake,
    toast: first
      ? { text: "+500 INSPECT", color: "#22d3ee", key: performance.now() }
      : state.toast,
    pendingWin: discovered.length >= PROJECTS.length,
  };
  emit();
}

export function closeInspect() {
  if (!state.selectedId) return;
  const win = state.pendingWin;
  state = { ...state, selectedId: null };
  emit();
  if (win) triggerWin();
}

export function collectOrb(index: number) {
  if (state.collectedOrbs.includes(index)) return;
  if (state.screen !== "playing") return;
  sfx.orb();
  state = {
    ...state,
    collectedOrbs: [...state.collectedOrbs, index],
    score: state.score + 100,
    toast: { text: "+100 ORB", color: "#fbbf24", key: performance.now() },
  };
  emit();
}

export function squashBug() {
  if (state.screen !== "playing") return;
  sfx.squash();
  state = {
    ...state,
    squashed: state.squashed + 1,
    score: state.score + 200,
    shake: Math.max(state.shake, 6),
    toast: { text: "+200 SQUASH", color: "#4ade80", key: performance.now() },
  };
  emit();
}

export function hitPlayer() {
  if (state.screen !== "playing") return;
  if (state.lives <= 0) return;
  sfx.hit();
  const lives = state.lives - 1;
  state = {
    ...state,
    lives,
    shake: 14,
    flash: 0.28,
    selectedId: null,
  };
  emit();
  if (lives <= 0) {
    sfx.over();
    setState({ screen: "over" });
  }
}

export function setZone(z: ZoneId) {
  if (state.zone === z) return;
  const names: Record<ZoneId, { name: string; sub: string }> = {
    CONCEPT: { name: "CONCEPT", sub: "IDEATION & DESIGN" },
    PROTOTYPE: { name: "PROTOTYPE", sub: "GREYBOX TO PLAYABLE" },
    PRODUCTION: { name: "PRODUCTION", sub: "FULL BUILD IN MOTION" },
    LAUNCH: { name: "LAUNCH", sub: "SHIP IT TO THE WORLD" },
  };
  sfx.zone();
  state = {
    ...state,
    zone: z,
    banner: { ...names[z], key: performance.now() },
  };
  emit();
}

export function tick(dt: number) {
  if (state.screen !== "playing") return;
  let next = state;
  let changed = false;
  if (state.selectedId === null) {
    next = { ...next, elapsed: state.elapsed + dt };
    changed = true;
  }
  if (state.shake > 0.2) {
    next = { ...next, shake: state.shake * Math.exp(-dt * 7) };
    changed = true;
  } else if (state.shake !== 0) {
    next = { ...next, shake: 0 };
    changed = true;
  }
  if (state.flash > 0) {
    next = { ...next, flash: Math.max(0, state.flash - dt) };
    changed = true;
  }
  if (changed) {
    state = next;
    // don't emit every frame — UI reads shake/flash from getState in rAF overlays
  }
}

function triggerWin() {
  const timeBonus = Math.max(0, Math.floor(180 - state.elapsed)) * 5;
  sfx.goal();
  state = {
    ...state,
    screen: "win",
    selectedId: null,
    pendingWin: false,
    score: state.score + 2000 + timeBonus,
    toast: {
      text: `CLEAR +${2000 + timeBonus}`,
      color: "#fbbf24",
      key: performance.now(),
    },
  };
  emit();
}

export function toggleMute() {
  const muted = !state.muted;
  sfx.setMuted(muted);
  setState({ muted });
}

export function doesQualify() {
  return qualifies(state.score);
}
