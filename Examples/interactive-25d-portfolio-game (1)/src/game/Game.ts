// Core game engine: isometric 2.5D platformer with juicy feedback.
// Discrete grid movement with smooth interpolation for tight arcade feel.

import { LEVELS, Level, Tile, Gem, Hazard } from "./levels";

export type GameState = "menu" | "playing" | "paused" | "levelComplete" | "gameover";

export interface HudState {
  score: number;
  gems: number;
  gemsTotal: number;
  lives: number;
  level: number;
  levelName: string;
  levelSubtitle: string;
  time: number;
  parTime: number;
  accent: string;
}

interface Vec { x: number; y: number; }

interface Particle {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number;
  color: string;
  size: number;
  gravity: number;
}

interface FloatingText {
  x: number; y: number; z: number;
  text: string; color: string;
  life: number; maxLife: number;
  vy: number;
}

const TILE_W = 72;
const TILE_H = 40;
const TILE_DEPTH = 28; // visual side depth
const MOVE_DURATION = 115; // ms per tile step
const JUMP_DURATION = 380; // ms for full jump arc
const JUMP_HEIGHT = 28; // pixels above ground at apex

// Isometric projection
const iso = (x: number, y: number, z = 0) => ({
  sx: (x - y) * (TILE_W / 2),
  sy: (x + y) * (TILE_H / 2) - z,
});

export class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  dpr: number;
  width = 0;
  height = 0;

  // Level state
  levelIdx = 0;
  level!: Level;
  tileSet: Set<string> = new Set();

  // Player
  pGrid: Vec = { x: 0, y: 0 }; // logical grid pos
  pFrom: Vec = { x: 0, y: 0 };
  pTo: Vec = { x: 0, y: 0 };
  pMoveT = 1; // 0..1 interpolation
  pFacing: Vec = { x: 1, y: 0 };
  pZ = 0; // visual altitude
  pJumpT = -1; // <0 = not jumping, 0..1 = arc progress
  pSquash = 1; // 1 = normal, <1 = squished
  pSquashV = 0;
  pInvuln = 0; // invulnerability ms after hit

  // Camera
  camX = 0;
  camY = 0;
  camTargetX = 0;
  camTargetY = 0;
  shakeT = 0;
  shakeAmp = 0;

  // Game state
  state: GameState = "menu";
  score = 0;
  lives = 3;
  time = 0;
  collectedGems: Set<string> = new Set();
  hazardsSet: Set<string> = new Set();
  portalPulse = 0;

  // Effects
  particles: Particle[] = [];
  floaters: FloatingText[] = [];
  bgStars: { x: number; y: number; r: number; a: number }[] = [];
  bgParticles: { x: number; y: number; vx: number; vy: number; r: number; color: string }[] = [];
  flashAlpha = 0;
  flashColor = "#fff";
  vignetteAlpha = 0;

  // Input
  keys: Record<string, boolean> = {};
  touchDir: Vec | null = null;
  touchJump = false;
  lastMoveTime = 0;
  jumpBuffered = false;

  // Callbacks
  onStateChange?: (s: GameState) => void;
  onHudUpdate?: (h: HudState) => void;
  onScoreChange?: (score: number) => void;

  raf = 0;
  lastTime = 0;
  running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("No 2d context");
    this.ctx = ctx;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();
    window.addEventListener("resize", this.resize);
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);

    // Generate background stars
    for (let i = 0; i < 80; i++) {
      this.bgStars.push({
        x: Math.random(),
        y: Math.random(),
        r: Math.random() * 1.6 + 0.3,
        a: Math.random() * 0.7 + 0.3,
      });
    }
  }

  resize = () => {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  };

  onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    this.keys[k] = true;
    if (k === " " || k === "spacebar") {
      e.preventDefault();
      this.jumpBuffered = true;
    }
    if (k === "p" || k === "escape") {
      if (this.state === "playing") this.pause();
      else if (this.state === "paused") this.resume();
    }
    if (k === "r") {
      if (this.state === "playing" || this.state === "paused" || this.state === "gameover") {
        this.restartLevel();
      }
    }
  };

  onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.key.toLowerCase()] = false;
  };

  // Touch input from React controls
  setTouchDir(dir: Vec | null) {
    this.touchDir = dir;
  }
  triggerJump() {
    this.jumpBuffered = true;
  }

  loadLevel(idx: number) {
    this.levelIdx = idx;
    this.level = LEVELS[idx];
    this.tileSet = new Set(this.level.tiles.map(t => `${t.x},${t.y}`));
    this.hazardsSet = new Set(this.level.hazards.map(h => `${h.x},${h.y}`));
    this.pGrid = { ...this.level.start };
    this.pFrom = { ...this.level.start };
    this.pTo = { ...this.level.start };
    this.pMoveT = 1;
    this.pZ = 0;
    this.pJumpT = -1;
    this.pSquash = 1;
    this.pSquashV = 0;
    this.pInvuln = 0;
    this.collectedGems = new Set();
    this.time = 0;
    this.particles = [];
    this.floaters = [];
    this.flashAlpha = 0;

    // Center camera on player
    const { sx, sy } = iso(this.pGrid.x, this.pGrid.y);
    this.camX = this.camTargetX = sx;
    this.camY = this.camTargetY = sy;

    // Background particles for this level
    this.bgParticles = [];
    for (let i = 0; i < 30; i++) {
      this.bgParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3 - 0.1,
        r: Math.random() * 3 + 1,
        color: this.level.accent,
      });
    }

    this.updateHud();
  }

  start() {
    this.score = 0;
    this.lives = 3;
    this.loadLevel(0);
    this.state = "playing";
    this.onStateChange?.(this.state);
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  pause() {
    this.state = "paused";
    this.onStateChange?.(this.state);
  }
  resume() {
    this.state = "playing";
    this.lastTime = performance.now();
    this.onStateChange?.(this.state);
  }

  restartLevel() {
    this.lives = 3;
    this.score = 0;
    this.loadLevel(this.levelIdx);
    this.state = "playing";
    this.onStateChange?.(this.state);
    if (!this.running) {
      this.running = true;
      this.lastTime = performance.now();
      this.loop(this.lastTime);
    }
  }

  nextLevel() {
    if (this.levelIdx + 1 < LEVELS.length) {
      this.loadLevel(this.levelIdx + 1);
      this.state = "playing";
      this.onStateChange?.(this.state);
    } else {
      // Finished all levels — treat as game win / game over with final score
      this.state = "gameover";
      this.onStateChange?.(this.state);
    }
  }

  returnToMenu() {
    this.state = "menu";
    this.onStateChange?.(this.state);
  }

  // ---- UPDATE ----
  update(dt: number) {
    // Always animate ambient effects (portal, gems, particles) for polish
    this.portalPulse += dt / 1000;
    this.updateEffects(dt);

    if (this.state !== "playing") return;

    this.time += dt / 1000;

    // Read input direction
    let dir: Vec | null = null;
    if (this.keys["arrowup"] || this.keys["w"]) dir = { x: 0, y: -1 };
    else if (this.keys["arrowdown"] || this.keys["s"]) dir = { x: 0, y: 1 };
    else if (this.keys["arrowleft"] || this.keys["a"]) dir = { x: -1, y: 0 };
    else if (this.keys["arrowright"] || this.keys["d"]) dir = { x: 1, y: 0 };
    else if (this.touchDir) dir = this.touchDir;

    // Movement (only if not already mid-step)
    if (this.pMoveT >= 1 && dir) {
      const nx = this.pGrid.x + dir.x;
      const ny = this.pGrid.y + dir.y;
      if (this.tileSet.has(`${nx},${ny}`)) {
        this.pFrom = { ...this.pGrid };
        this.pTo = { x: nx, y: ny };
        this.pGrid = { x: nx, y: ny };
        this.pMoveT = 0;
        this.pFacing = dir;
        // Small hop on every step for juicy feel
        if (this.pJumpT < 0) {
          this.pSquash = 0.75;
          this.pSquashV = 0.04;
        }
      }
    }

    // Interpolate movement
    if (this.pMoveT < 1) {
      this.pMoveT += dt / MOVE_DURATION;
      if (this.pMoveT >= 1) this.pMoveT = 1;
    }

    // Jump trigger
    if (this.jumpBuffered && this.pJumpT < 0 && this.pMoveT >= 0.9) {
      this.pJumpT = 0;
      this.pSquash = 1.3;
      this.pSquashV = -0.05;
      this.spawnDust(this.getCurrentPos(), this.level.accent, 6);
      this.jumpBuffered = false;
    } else {
      this.jumpBuffered = false;
    }

    // Jump arc
    if (this.pJumpT >= 0) {
      this.pJumpT += dt / JUMP_DURATION;
      // parabolic z: sin curve for smooth arc
      this.pZ = Math.sin(this.pJumpT * Math.PI) * JUMP_HEIGHT;
      if (this.pJumpT >= 1) {
        this.pJumpT = -1;
        this.pZ = 0;
        // Land thud
        this.pSquash = 0.7;
        this.pSquashV = 0.05;
        this.addShake(4, 150);
        this.spawnDust(this.getCurrentPos(), "#ffffff", 8);
      }
    }

    // Squash spring
    this.pSquash += this.pSquashV * dt * 0.1;
    this.pSquashV += (1 - this.pSquash) * 0.02 * dt * 0.1;
    this.pSquashV *= 0.9;
    if (Math.abs(this.pSquash - 1) < 0.01 && Math.abs(this.pSquashV) < 0.01) {
      this.pSquash = 1; this.pSquashV = 0;
    }

    // Invuln countdown
    if (this.pInvuln > 0) this.pInvuln -= dt;

    // Check gem collection (at current grid cell)
    const cur = this.pGrid;
    const gemKey = `${cur.x},${cur.y}`;
    if (!this.collectedGems.has(gemKey)) {
      const gemIdx = this.level.gems.findIndex(g => g.x === cur.x && g.y === cur.y);
      if (gemIdx >= 0) {
        this.collectedGems.add(gemKey);
        this.score += 100;
        this.addFloater(cur.x, cur.y, 20, "+100", this.level.accent);
        this.spawnGemBurst(cur.x, cur.y, this.level.accent);
        this.addShake(3, 120);
        this.flashAlpha = 0.25;
        this.flashColor = this.level.accent;
        this.onScoreChange?.(this.score);
      }
    }

    // Check hazard (only if grounded and not invulnerable)
    if (this.pJumpT < 0 && this.pInvuln <= 0) {
      if (this.hazardsSet.has(`${cur.x},${cur.y}`)) {
        this.hitHazard();
      }
    }

    // Check exit
    if (cur.x === this.level.exit.x && cur.y === this.level.exit.y) {
      this.completeLevel();
    }

    // Camera follow (target = current interpolated player screen pos)
    const pos = this.getCurrentPos();
    const cam = iso(pos.x, pos.y);
    this.camTargetX = cam.sx;
    this.camTargetY = cam.sy;
    this.camX += (this.camTargetX - this.camX) * Math.min(1, dt * 0.008);
    this.camY += (this.camTargetY - this.camY) * Math.min(1, dt * 0.008);

    // Shake decay
    if (this.shakeT > 0) this.shakeT -= dt;

    // Flash decay
    if (this.flashAlpha > 0) this.flashAlpha = Math.max(0, this.flashAlpha - dt * 0.003);

    // Vignette when low lives
    this.vignetteAlpha = this.lives === 1 ? 0.35 : 0;

    this.updateEffects(dt);
    this.updateHud();
  }

  updateEffects(dt: number) {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      p.x += p.vx * dt * 0.06;
      p.y += p.vy * dt * 0.06;
      p.z += p.vz * dt * 0.06;
      p.vz -= p.gravity * dt * 0.06;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
    for (let i = this.floaters.length - 1; i >= 0; i--) {
      const f = this.floaters[i];
      f.life -= dt;
      f.z += f.vy * dt * 0.06;
      if (f.life <= 0) this.floaters.splice(i, 1);
    }
    for (const bp of this.bgParticles) {
      bp.x += bp.vx * dt * 0.06;
      bp.y += bp.vy * dt * 0.06;
      if (bp.x < -20) bp.x = this.width + 20;
      if (bp.x > this.width + 20) bp.x = -20;
      if (bp.y < -20) bp.y = this.height + 20;
      if (bp.y > this.height + 20) bp.y = -20;
    }
  }

  getCurrentPos(): { x: number; y: number } {
    // Smooth interpolation between pFrom and pTo
    const t = this.easeOutCubic(Math.min(1, this.pMoveT));
    return {
      x: this.pFrom.x + (this.pTo.x - this.pFrom.x) * t,
      y: this.pFrom.y + (this.pTo.y - this.pFrom.y) * t,
    };
  }

  easeOutCubic(t: number) { return 1 - Math.pow(1 - t, 3); }

  addShake(amp: number, dur: number) {
    this.shakeAmp = Math.max(this.shakeAmp, amp);
    this.shakeT = Math.max(this.shakeT, dur);
  }

  spawnDust(pos: { x: number; y: number }, color: string, count: number) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 1.5 + 0.5;
      this.particles.push({
        x: pos.x, y: pos.y, z: 2,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        vz: Math.random() * 1.5 + 0.3,
        life: 400, maxLife: 400,
        color, size: Math.random() * 3 + 2, gravity: 0.03,
      });
    }
  }

  spawnGemBurst(gx: number, gy: number, color: string) {
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * Math.PI * 2;
      const s = Math.random() * 2 + 2;
      this.particles.push({
        x: gx, y: gy, z: 14,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        vz: Math.random() * 3 + 1,
        life: 600, maxLife: 600,
        color, size: Math.random() * 4 + 2, gravity: 0.04,
      });
    }
  }

  spawnExplosion(gx: number, gy: number) {
    for (let i = 0; i < 30; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 3 + 1;
      this.particles.push({
        x: gx, y: gy, z: 10,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        vz: Math.random() * 4 + 1,
        life: 700, maxLife: 700,
        color: i % 2 === 0 ? "#ff4757" : "#ff6b35",
        size: Math.random() * 5 + 2, gravity: 0.05,
      });
    }
  }

  addFloater(gx: number, gy: number, z: number, text: string, color: string) {
    this.floaters.push({
      x: gx, y: gy, z, text, color,
      life: 900, maxLife: 900, vy: -1.2,
    });
  }

  hitHazard() {
    this.lives -= 1;
    this.pInvuln = 1500;
    this.spawnExplosion(this.pGrid.x, this.pGrid.y);
    this.addShake(12, 400);
    this.flashAlpha = 0.6;
    this.flashColor = "#ff2e4d";
    this.addFloater(this.pGrid.x, this.pGrid.y, 20, "-1 LIFE", "#ff4757");
    if (this.lives <= 0) {
      // Game over
      this.state = "gameover";
      this.onStateChange?.(this.state);
    } else {
      // Respawn at start
      this.pGrid = { ...this.level.start };
      this.pFrom = { ...this.level.start };
      this.pTo = { ...this.level.start };
      this.pMoveT = 1;
      this.pZ = 0;
      this.pJumpT = -1;
    }
  }

  completeLevel() {
    // Calculate bonus
    const gemBonus = this.collectedGems.size * 50;
    const timeBonus = Math.max(0, Math.floor((this.level.parTime - this.time) * 20));
    const clearBonus = 500;
    const total = gemBonus + timeBonus + clearBonus;
    this.score += total;
    this.onScoreChange?.(this.score);

    // Big celebration burst at exit
    for (let i = 0; i < 60; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = Math.random() * 4 + 2;
      this.particles.push({
        x: this.level.exit.x, y: this.level.exit.y, z: 10,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s,
        vz: Math.random() * 5 + 2,
        life: 1200, maxLife: 1200,
        color: i % 3 === 0 ? this.level.accent : (i % 3 === 1 ? "#fff" : "#ffe066"),
        size: Math.random() * 5 + 3, gravity: 0.04,
      });
    }
    this.addShake(15, 500);
    this.flashAlpha = 0.8;
    this.flashColor = this.level.accent;

    this.state = "levelComplete";
    this.onStateChange?.(this.state);
  }

  updateHud() {
    this.onHudUpdate?.({
      score: this.score,
      gems: this.collectedGems.size,
      gemsTotal: this.level.gems.length,
      lives: this.lives,
      level: this.levelIdx + 1,
      levelName: this.level.name,
      levelSubtitle: this.level.subtitle,
      time: this.time,
      parTime: this.level.parTime,
      accent: this.level.accent,
    });
  }

  // ---- RENDER ----
  render() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Background gradient
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, this.level?.bgFrom || "#1a0730");
    bg.addColorStop(1, this.level?.bgTo || "#3a0a5c");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    // Stars
    ctx.save();
    for (const s of this.bgStars) {
      ctx.globalAlpha = s.a * (0.6 + 0.4 * Math.sin(this.portalPulse * 2 + s.x * 10));
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(s.x * w, s.y * h, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // Background floating particles
    ctx.save();
    for (const bp of this.bgParticles) {
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = bp.color;
      ctx.beginPath();
      ctx.arc(bp.x, bp.y, bp.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // World rendering (isometric)
    ctx.save();
    let shakeX = 0, shakeY = 0;
    if (this.shakeT > 0) {
      const f = this.shakeT / 500;
      shakeX = (Math.random() - 0.5) * this.shakeAmp * f;
      shakeY = (Math.random() - 0.5) * this.shakeAmp * f;
    }
    ctx.translate(w / 2 + shakeX, h / 2 + shakeY);
    ctx.translate(-this.camX, -this.camY - 40);

    if (this.level) {
      this.renderWorld(ctx);
    }
    ctx.restore();

    // Screen-space overlays
    // Flash
    if (this.flashAlpha > 0) {
      ctx.fillStyle = this.flashColor;
      ctx.globalAlpha = this.flashAlpha;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // Vignette
    if (this.vignetteAlpha > 0) {
      const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(255,0,60,1)");
      ctx.fillStyle = vg;
      ctx.globalAlpha = this.vignetteAlpha;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
    }

    // Scanlines (subtle)
    ctx.save();
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#000";
    for (let y = 0; y < h; y += 3) {
      ctx.fillRect(0, y, w, 1);
    }
    ctx.restore();
  }

  renderWorld(ctx: CanvasRenderingContext2D) {
    // Gather renderable objects with their sort keys
    const renderables: { sortKey: number; draw: () => void }[] = [];

    // Tiles
    for (const tile of this.level.tiles) {
      renderables.push({
        sortKey: tile.x + tile.y,
        draw: () => this.drawTile(ctx, tile),
      });
    }

    // Hazards
    for (const hz of this.level.hazards) {
      renderables.push({
        sortKey: hz.x + hz.y + 0.1,
        draw: () => this.drawHazard(ctx, hz),
      });
    }

    // Gems
    for (const gem of this.level.gems) {
      const key = `${gem.x},${gem.y}`;
      if (this.collectedGems.has(key)) continue;
      renderables.push({
        sortKey: gem.x + gem.y + 0.2,
        draw: () => this.drawGem(ctx, gem),
      });
    }

    // Portal
    renderables.push({
      sortKey: this.level.exit.x + this.level.exit.y + 0.15,
      draw: () => this.drawPortal(ctx, this.level.exit),
    });

    // Player shadow
    const pPos = this.getCurrentPos();
    renderables.push({
      sortKey: pPos.x + pPos.y + 0.3,
      draw: () => this.drawPlayer(ctx, pPos),
    });

    // Particles
    for (const p of this.particles) {
      renderables.push({
        sortKey: p.x + p.y + 0.4,
        draw: () => this.drawParticle(ctx, p),
      });
    }

    // Floaters
    for (const f of this.floaters) {
      renderables.push({
        sortKey: f.x + f.y + 0.5,
        draw: () => this.drawFloater(ctx, f),
      });
    }

    renderables.sort((a, b) => a.sortKey - b.sortKey);
    for (const r of renderables) r.draw();
  }

  drawTile(ctx: CanvasRenderingContext2D, tile: Tile) {
    const { sx, sy } = iso(tile.x, tile.y);
    const accent = this.level.accent;
    const accentDark = this.level.accentDark;

    // Top face (diamond)
    ctx.beginPath();
    ctx.moveTo(sx, sy - TILE_H / 2);
    ctx.lineTo(sx + TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx - TILE_W / 2, sy);
    ctx.closePath();

    // Gradient on top
    const grad = ctx.createLinearGradient(sx - TILE_W / 2, sy - TILE_H / 2, sx + TILE_W / 2, sy + TILE_H / 2);
    grad.addColorStop(0, this.shadeColor(accent, 20));
    grad.addColorStop(1, accent);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Left face
    ctx.beginPath();
    ctx.moveTo(sx - TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx, sy + TILE_H / 2 + TILE_DEPTH);
    ctx.lineTo(sx - TILE_W / 2, sy + TILE_DEPTH);
    ctx.closePath();
    ctx.fillStyle = accentDark;
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    // Right face
    ctx.beginPath();
    ctx.moveTo(sx + TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx, sy + TILE_H / 2 + TILE_DEPTH);
    ctx.lineTo(sx + TILE_W / 2, sy + TILE_DEPTH);
    ctx.closePath();
    ctx.fillStyle = this.shadeColor(accentDark, -20);
    ctx.fill();
    ctx.strokeStyle = "rgba(0,0,0,0.3)";
    ctx.stroke();

    // Inner glow lines on top (grid pattern)
    ctx.strokeStyle = "rgba(255,255,255,0.1)";
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy - TILE_H / 2);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.moveTo(sx - TILE_W / 2, sy);
    ctx.lineTo(sx + TILE_W / 2, sy);
    ctx.stroke();
  }

  drawHazard(ctx: CanvasRenderingContext2D, hz: Hazard) {
    const { sx, sy } = iso(hz.x, hz.y);
    const pulse = 0.8 + 0.2 * Math.sin(this.portalPulse * 4);

    // Spikes on top of tile
    ctx.save();
    ctx.translate(sx, sy);
    ctx.fillStyle = "#ff2e4d";
    ctx.strokeStyle = "#ff8899";
    ctx.lineWidth = 1;
    // 4 small spikes
    for (let i = 0; i < 4; i++) {
      const ox = (i % 2 === 0 ? -1 : 1) * 10;
      const oy = (i < 2 ? -1 : 1) * 5;
      ctx.beginPath();
      ctx.moveTo(ox, oy);
      ctx.lineTo(ox - 4 * pulse, oy + 6);
      ctx.lineTo(ox + 4 * pulse, oy + 6);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    // Glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 20);
    glow.addColorStop(0, "rgba(255,46,77,0.4)");
    glow.addColorStop(1, "rgba(255,46,77,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(-25, -25, 50, 50);
    ctx.restore();
  }

  drawGem(ctx: CanvasRenderingContext2D, gem: Gem) {
    const { sx, sy } = iso(gem.x, gem.y);
    const bob = Math.sin(this.portalPulse * 3 + gem.x + gem.y) * 3;
    const rot = this.portalPulse * 2 + gem.x;
    const gx = sx;
    const gy = sy - 18 + bob;

    ctx.save();
    ctx.translate(gx, gy);
    // Glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 18);
    glow.addColorStop(0, this.level.accent + "cc");
    glow.addColorStop(1, this.level.accent + "00");
    ctx.fillStyle = glow;
    ctx.fillRect(-20, -20, 40, 40);

    // Crystal diamond
    ctx.rotate(rot);
    ctx.beginPath();
    ctx.moveTo(0, -9);
    ctx.lineTo(7, 0);
    ctx.lineTo(0, 9);
    ctx.lineTo(-7, 0);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, -9, 0, 9);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.5, this.level.accent);
    grad.addColorStop(1, this.level.accentDark);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // Shadow below
    ctx.save();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 7, 2.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawPortal(ctx: CanvasRenderingContext2D, exit: { x: number; y: number }) {
    const { sx, sy } = iso(exit.x, exit.y);
    const pulse = Math.sin(this.portalPulse * 3) * 0.3 + 1;

    // Outer glow
    ctx.save();
    ctx.translate(sx, sy);
    const glow = ctx.createRadialGradient(0, -10, 0, 0, -10, 35 * pulse);
    glow.addColorStop(0, this.level.accent + "ff");
    glow.addColorStop(0.5, this.level.accent + "66");
    glow.addColorStop(1, this.level.accent + "00");
    ctx.fillStyle = glow;
    ctx.fillRect(-40, -50, 80, 80);

    // Rotating rings
    ctx.strokeStyle = this.level.accent;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const r = 14 + i * 4;
      const a = this.portalPulse * (1.5 - i * 0.3);
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(a);
      ctx.globalAlpha = 0.8 - i * 0.2;
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.4, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Center bright core
    ctx.globalAlpha = 1;
    const core = ctx.createRadialGradient(0, -10, 0, 0, -10, 8);
    core.addColorStop(0, "#ffffff");
    core.addColorStop(1, this.level.accent);
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, -10, 6 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawPlayer(ctx: CanvasRenderingContext2D, pos: { x: number; y: number }) {
    const { sx, sy } = iso(pos.x, pos.y);
    const z = this.pZ;
    const blink = this.pInvuln > 0 && Math.floor(this.pInvuln / 80) % 2 === 0;

    // Shadow on ground
    ctx.save();
    ctx.globalAlpha = Math.max(0.1, 0.4 - z * 0.01);
    ctx.fillStyle = "#000";
    const shadowScale = Math.max(0.4, 1 - z * 0.015);
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 12 * shadowScale, 4 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (blink) return;

    const py = sy - z;
    const sq = this.pSquash;
    const bodyW = 14 * (2 - sq);
    const bodyH = 22 * sq;

    ctx.save();
    ctx.translate(sx, py - bodyH / 2);

    // Body glow
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 22);
    glow.addColorStop(0, this.level.accent + "55");
    glow.addColorStop(1, this.level.accent + "00");
    ctx.fillStyle = glow;
    ctx.fillRect(-25, -25, 50, 50);

    // Body (rounded rectangle)
    const grad = ctx.createLinearGradient(0, -bodyH / 2, 0, bodyH / 2);
    grad.addColorStop(0, "#ffffff");
    grad.addColorStop(0.4, this.level.accent);
    grad.addColorStop(1, this.level.accentDark);
    ctx.fillStyle = grad;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    this.roundRect(ctx, -bodyW / 2, -bodyH / 2, bodyW, bodyH, 5);
    ctx.fill();
    ctx.stroke();

    // Eyes (face direction)
    const faceX = this.pFacing.x * 2;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(-3 + faceX, -bodyH / 2 + 6, 2.5, 0, Math.PI * 2);
    ctx.arc(3 + faceX, -bodyH / 2 + 6, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(-3 + faceX, -bodyH / 2 + 6, 1.2, 0, Math.PI * 2);
    ctx.arc(3 + faceX, -bodyH / 2 + 6, 1.2, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticle(ctx: CanvasRenderingContext2D, p: Particle) {
    const { sx, sy } = iso(p.x, p.y);
    const alpha = Math.max(0, p.life / p.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = p.color;
    const size = p.size * (0.5 + alpha * 0.5);
    ctx.fillRect(sx - size / 2, sy - p.z - size / 2, size, size);
    ctx.restore();
  }

  drawFloater(ctx: CanvasRenderingContext2D, f: FloatingText) {
    const { sx, sy } = iso(f.x, f.y);
    const alpha = Math.max(0, f.life / f.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = "bold 14px system-ui, sans-serif";
    ctx.fillStyle = f.color;
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 3;
    ctx.textAlign = "center";
    const y = sy - f.z;
    ctx.strokeText(f.text, sx, y);
    ctx.fillText(f.text, sx, y);
    ctx.restore();
  }

  roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  shadeColor(hex: string, percent: number) {
    const num = parseInt(hex.slice(1), 16);
    let r = (num >> 16) + percent;
    let g = ((num >> 8) & 0xff) + percent;
    let b = (num & 0xff) + percent;
    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));
    return `#${(r << 16 | g << 8 | b).toString(16).padStart(6, "0")}`;
  }

  // ---- LOOP ----
  loop = (time: number) => {
    if (!this.running) return;
    const dt = Math.min(50, time - this.lastTime);
    this.lastTime = time;
    this.update(dt);
    this.render();
    this.raf = requestAnimationFrame(this.loop);
  };

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    window.removeEventListener("resize", this.resize);
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
  }
}
