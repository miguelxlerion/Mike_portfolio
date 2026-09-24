import { genLevel, LevelData, Segment, Obstacle, Theme } from "./levels";
import { Sfx } from "./audio";

// ---------------------------------------------------------------------------
// DEVQUEST engine — 2.5D canvas runner. Fixed-timestep physics, pooled
// particles, parallax layers, procedural rendering, screen shake.
// ---------------------------------------------------------------------------

const GRAV = -3000;
const JUMP_V = 980;
const DJUMP_V = 860;
const BASE_SPEED = 340;
const SPEED_PER_LEVEL = 26;
const SPEED_RAMP = 7;
const MAX_SPEED = 640;
const STEP = 1 / 60;
const LEVEL_COUNT = 4;

const PLAYER_W = 34;
const PLAYER_H = 52;
const SLIDE_W = 42;
const SLIDE_H = 26;

const COIN_SCORE = 100;
const CLEAR_BONUS = 1000;

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const rand = (a: number, b?: number) =>
  b === undefined ? Math.random() * a : a + Math.random() * (b - a);

export interface EngineCallbacks {
  onScore(score: number): void;
  onLives(lives: number): void;
  onLevel(index: number, name: string, sub: string): void;
  onBanner(index: number, name: string, sub: string): void;
  onGameOver(score: number): void;
  onWin(score: number): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  grav: number;
  spin: number;
  rot: number;
  kind: 0 | 1 | 2; // 0 dot, 1 puff, 2 confetti rect
}

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
  color: string;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private cb: EngineCallbacks;
  private sfx = new Sfx();

  private dpr = 1;
  private w = 0;
  private h = 0;
  private groundY = 0;

  mode: "attract" | "play" | "paused" | "over" | "win" = "attract";
  score = 0;
  lives = 3;
  levelIdx = 0;
  level!: LevelData;
  speed = BASE_SPEED;

  private player = {
    x: 60,
    y: 0,
    vy: 0,
    grounded: true,
    jumps: 0,
    coyote: 0,
    buffer: 0,
    sliding: false,
    slideT: 0,
    inv: 0,
    run: 0,
    stretch: 1,
    blink: 0,
    blinkT: 2,
    jetT: 0,
    slidePulse: 0,
  };

  private camX = 0;
  private time = 0;
  private levelTime = 0;
  private freeze = 0;
  private shake = 0;
  private shakeX = 0;
  private shakeY = 0;
  private flash = 0;
  private jumpQueued = false;
  private slideHeld = false;

  private particles: Particle[] = [];
  private popups: Popup[] = [];
  private stars: { x: number; y: number; s: number; tw: number }[] = [];

  private acc = 0;
  private last = 0;
  private raf = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement, cb: EngineCallbacks) {
    this.canvas = canvas;
    this.cb = cb;
    this.ctx = canvas.getContext("2d")!;
    // stars are global (parallax 0.05), generated once
    for (let i = 0; i < 90; i++) {
    this.stars.push({
      x: rand(0, 2200),
      y: rand(0.02, 0.42),
      s: rand(0.6, 1.8),
      tw: rand(0, 10),
    });
    }
    this.level = genLevel(0);
  }

  // ---- input ---------------------------------------------------------------

  attachInput(canvas: HTMLCanvasElement) {
    let sy = 0;
    let st = 0;
    const down = (e: PointerEvent) => {
      e.preventDefault();
      this.sfx.ensure();
      sy = e.clientY;
      st = this.time;
    };
    const up = (e: PointerEvent) => {
      e.preventDefault();
      const dy = e.clientY - sy;
      if (dy > 34) {
        // swipe down = slide
        this.slidePulse();
        this.slideHeld = true;
        window.setTimeout(() => {
          this.slideHeld = false;
        }, 420);
      } else if (this.time - st < 0.6) {
        this.queueJump();
      }
    };
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", () => {});
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  toMenu() {
    this.mode = "attract";
    this.levelIdx = 0;
    this.level = genLevel(0);
    const p = this.player;
    p.x = 60;
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.jumps = 0;
    p.inv = 0;
    p.sliding = false;
    this.score = 0;
    this.lives = 3;
    this.camX = 0;
  }

  // ---- lifecycle ----------------------------------------------------------

  start() {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (ts: number) => {
      if (!this.running) return;
      const dt = Math.min(0.1, (ts - this.last) / 1000);
      this.last = ts;
      this.acc += dt;
      let steps = 0;
      while (this.acc >= STEP && steps < 4) {
        this.update(STEP);
        this.acc -= STEP;
        steps++;
      }
      if (steps === 4) this.acc = 0;
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  resize(w: number, h: number) {
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = w;
    this.h = h;
    this.groundY = Math.round(h * 0.78);
    this.canvas.width = Math.round(w * this.dpr);
    this.canvas.height = Math.round(h * this.dpr);
    this.canvas.style.width = w + "px";
    this.canvas.style.height = h + "px";
  }

  // ---- game control -------------------------------------------------------

  startGame() {
    this.sfx.ensure();
    this.score = 0;
    this.lives = 3;
    this.levelIdx = 0;
    this.cb.onScore(0);
    this.cb.onLives(3);
    this.loadLevel(0);
    this.mode = "play";
  }

  restart() {
    this.startGame();
  }

  togglePause() {
    if (this.mode === "play") {
      this.mode = "paused";
    } else if (this.mode === "paused") {
      this.mode = "play";
      this.last = performance.now();
      this.acc = 0;
    }
  }

  queueJump() {
    this.jumpQueued = true;
  }

  setSlide(down: boolean) {
    this.slideHeld = down;
  }

  slidePulse() {
    this.player.slidePulse = 0.4;
  }

  setMuted(m: boolean) {
    this.sfx.setMuted(m);
  }

  progress() {
    return this.level ? clamp(this.player.x / this.level.goalX, 0, 1) : 0;
  }

  // ---- level management ---------------------------------------------------

  private loadLevel(i: number) {
    this.level = genLevel(i);
    this.levelIdx = i;
    this.levelTime = 0;
    this.freeze = 0.9;
    const p = this.player;
    p.x = 60;
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.jumps = 0;
    p.inv = 0;
    p.sliding = false;
    p.stretch = 1;
    p.jetT = 0;
    this.camX = 0;
    this.cb.onLevel(i, this.level.name, this.level.sub);
    this.cb.onBanner(i, this.level.name, this.level.sub);
  }

  private nextLevel() {
    this.score += CLEAR_BONUS;
    this.cb.onScore(this.score);
    this.addPopup(this.player.x, 120, "SECTION CLEAR +" + CLEAR_BONUS, "#4ade80");
    this.sfx.goal();
    const th = this.level.theme;
    this.spawnConfetti(this.player.x, 40, 60, th);
    this.spawnConfetti(this.player.x + 60, 40, 40, th);
    this.levelIdx++;
    if (this.levelIdx >= LEVEL_COUNT) {
      this.mode = "win";
      this.cb.onWin(this.score);
    } else {
      this.loadLevel(this.levelIdx);
    }
  }

  // ---- update -------------------------------------------------------------

  private update(dt: number) {
    this.time += dt;

    // particles & popups always breathe (except when paused)
    if (this.mode !== "paused") {
      this.updateParticles(dt);
      this.updatePopups(dt);
      if (this.shake > 0.3) {
        this.shake *= 0.86;
        this.shakeX = rand(-this.shake, this.shake);
        this.shakeY = rand(-this.shake, this.shake);
      } else {
        this.shake = 0;
        this.shakeX = 0;
        this.shakeY = 0;
      }
      if (this.flash > 0) this.flash -= dt;
      if (this.freeze > 0) this.freeze -= dt;
    }
    if (this.mode === "paused") return;

    if (this.mode === "play" || this.mode === "attract") {
      this.levelTime += dt;
      this.speed = Math.min(
        BASE_SPEED + this.levelIdx * SPEED_PER_LEVEL + this.levelTime * SPEED_RAMP,
        MAX_SPEED
      );
      if (this.mode === "attract") this.speed = 320;
      this.updatePlayer(dt);
      this.updateObstacles(dt);
      this.collideCoins();
      this.collideHazards();

      if (this.mode === "play") {
        if (this.player.x >= this.level.goalX) this.nextLevel();
      } else {
        // attract mode: loop the level quietly
        if (this.player.x >= this.level.goalX) this.loadLevel(this.levelIdx);
      }

      // camera
      const target = clamp(
        this.player.x - this.w * 0.32,
        0,
        Math.max(0, this.level.length - this.w + 120)
      );
      this.camX += (target - this.camX) * Math.min(1, dt * 7);
    }
  }

  private updatePlayer(dt: number) {
    const p = this.player;
    if (this.freeze > 0) return;

    // ---- run forward ----
    p.x += this.speed * dt;

    // ---- input buffering / coyote time ----
    if (this.jumpQueued) {
      p.buffer = 0.12;
      this.jumpQueued = false;
    }
    if (p.buffer > 0) p.buffer -= dt;
    if (p.coyote > 0) p.coyote -= dt;
    if (p.inv > 0) p.inv -= dt;
    if (p.jetT > 0) p.jetT -= dt;
    if (p.slidePulse > 0) p.slidePulse -= dt;

    // ---- sliding ----
    const wantSlide =
      (this.slideHeld || p.slidePulse > 0) && p.grounded;
    if (wantSlide && !p.sliding) {
      p.sliding = true;
      p.slideT = 0;
      this.sfx.slide();
      this.spawnDust(p.x, 4, 6, "#64748b");
    }
    if (p.sliding) {
      p.slideT += dt;
      if ((!wantSlide && p.slideT > 0.18) || p.slideT > 0.95) p.sliding = false;
    }

    // ---- jump ----
    if (p.buffer > 0) {
      if (p.grounded || p.coyote > 0) {
        p.vy = JUMP_V;
        p.grounded = false;
        p.jumps = 1;
        p.buffer = 0;
        p.coyote = 0;
        p.stretch = 1.22;
        this.spawnDust(p.x, 4, 7, "#94a3b8");
        this.sfx.jump(false);
      } else if (p.jumps < 2) {
        p.vy = DJUMP_V;
        p.jumps = 2;
        p.buffer = 0;
        p.stretch = 1.28;
        p.jetT = 0.18;
        this.spawnRing(p.x, p.y + 10);
        this.sfx.jump(true);
      }
    }

    // ---- physics ----
    const prevY = p.y;
    p.vy += GRAV * dt;
    p.y += p.vy * dt;

    const cx = p.x + PLAYER_W / 2;
    const ground = this.groundAt(cx);

    if (!p.grounded && p.vy <= 0 && ground && prevY >= 0 && p.y <= 0) {
      // land
      p.y = 0;
      p.vy = 0;
      p.grounded = true;
      p.jumps = 0;
      p.stretch = 0.62;
      this.spawnDust(p.x, 4, 8, "#94a3b8");
      this.sfx.land();
    } else if (p.grounded) {
      if (!ground) {
        p.grounded = false;
        p.coyote = 0.1;
        p.jumps = 0;
      } else {
        p.y = 0;
      }
    }

    if (p.grounded && !p.sliding) p.run += this.speed * dt * 0.05;

    // squash spring
    p.stretch += (1 - p.stretch) * Math.min(1, dt * 11);

    // blink
    p.blinkT -= dt;
    if (p.blinkT <= 0) {
      p.blinkT = rand(2.2, 4.5);
      p.blink = 0.12;
    }
    if (p.blink > 0) p.blink -= dt;

    // fell in a pit
    if (p.y < -170) this.damage("pit");

    // run trail (juice at speed)
    if (p.grounded && !p.sliding && this.speed > 430 && Math.random() < 0.4) {
      this.spawnTrail(p.x - 10, 6);
    }

    // attract-mode autopilot
    if (this.mode === "attract") this.attractAI();
  }

  private attractAI() {
    const p = this.player;
    if (!p.grounded && p.jumps >= 2) return;
    // pit lookahead: jump early enough to land past the far edge
    const pitAhead = p.x + 55;
    const g = this.groundAt(pitAhead + 17);
    let danger = !g;
    // obstacle lookahead: ~half a jump arc so the jump clears it
    if (!danger) {
      for (const o of this.level.obstacles) {
        if (o.x > p.x - 20 && o.x < p.x + 120) {
          if (o.type === "spike" || o.type === "wall" || o.type === "bug" || o.type === "drone" || o.type === "barrier") {
            danger = true;
            break;
          }
        }
      }
    }
    if (danger) this.queueJump();
    // coin grabber
    if (!danger && p.grounded && Math.random() < 0.01) this.queueJump();
  }

  private updateObstacles(dt: number) {
    for (const o of this.level.obstacles) {
      if (o.type === "bug") {
        o.vy = (o.vy || 0) + GRAV * 0.55 * dt;
        o.y += o.vy * dt;
        if (o.y <= 0) {
          o.y = 0;
          o.vy = 0;
          o.hopT = (o.hopT || rand(0.6, 1.4)) - dt;
          if (o.hopT <= 0) {
            o.vy = rand(240, 340);
            o.hopT = rand(0.7, 1.5);
          }
        }
        if (o.vx) o.x += o.vx * dt;
        if (o.x < this.player.x - 420) o.x = this.player.x + rand(600, 900);
      }
    }
  }

  private collideCoins() {
    const p = this.player;
    const pw = p.sliding ? SLIDE_W : PLAYER_W;
    const ph = p.sliding ? SLIDE_H : PLAYER_H;
    const pr = { x: p.x - pw / 2, y: p.y, w: pw, h: ph };
    for (const c of this.level.coins) {
      if (c.taken) continue;
      if (Math.abs(c.x - p.x) > 90) continue;
      const ccx = c.x;
      const ccy = c.y;
      // circle vs rect (approx)
      const nx = clamp(ccx, pr.x, pr.x + pr.w);
      const ny = clamp(ccy, pr.y, pr.y + pr.h);
      const dx = ccx - nx;
      const dy = ccy - ny;
      if (dx * dx + dy * dy < 26 * 26) {
        c.taken = true;
        this.score += COIN_SCORE;
        this.cb.onScore(this.score);
        this.addPopup(c.x, ccy + 14, "+" + COIN_SCORE, this.level.theme.coin);
        this.spawnSpark(c.x, ccy, 8, this.level.theme.coin);
        this.sfx.coin();
      }
    }
  }

  private collideHazards() {
    const p = this.player;
    if (p.inv > 0) return;
    const pw = p.sliding ? SLIDE_W : PLAYER_W;
    const ph = p.sliding ? SLIDE_H : PLAYER_H;
    const pr = { x: p.x - pw / 2, y: p.y, w: pw, h: ph };
    for (const o of this.level.obstacles) {
      if (Math.abs(o.x - p.x) > 220) continue;
      const or = this.obstacleRect(o);
      if (
        pr.x < or.x + or.w &&
        pr.x + pr.w > or.x &&
        pr.y < or.y + or.h &&
        pr.y + pr.h > or.y
      ) {
        this.damage(o.type === "bug" ? "bug" : o.type);
        return;
      }
    }
  }

  private obstacleRect(o: Obstacle) {
    switch (o.type) {
      case "bug":
        return { x: o.x - 23, y: o.y, w: 46, h: 30 };
      case "spike":
        return { x: o.x - 30, y: 0, w: 60, h: 34 };
      case "wall":
        return { x: o.x - 19, y: 0, w: 38, h: o.h };
      case "barrier":
        return { x: o.x - 35, y: o.y, w: 70, h: 30 };
      case "drone":
        return { x: o.x - 29, y: o.y, w: 58, h: 28 };
    }
  }

  private damage(cause: string) {
    const p = this.player;
    if (p.inv > 0) return;
    this.lives--;
    this.cb.onLives(this.lives);
    this.shake = 16;
    this.flash = 0.22;
    this.spawnBurst(p.x, 26, 22, "#f87171");
    this.sfx.hit();

    if (this.lives <= 0) {
      this.spawnBurst(p.x, 30, 40, "#ef4444");
      this.spawnConfetti(p.x, 40, 30, this.level.theme);
      if (this.mode === "play") {
        this.mode = "over";
        this.sfx.over();
        this.cb.onGameOver(this.score);
      } else {
        this.respawn();
      }
      return;
    }
    p.inv = 1.6;
    if (cause === "pit") {
      this.respawn();
    } else {
      p.vy = 520;
      p.x -= 80;
      p.stretch = 1.2;
    }
  }

  private respawn() {
    const p = this.player;
    let sx = Math.max(0, p.x - 150);
    let guard = 0;
    while (!this.groundAt(sx + PLAYER_W / 2) && guard++ < 40) sx -= 30;
    p.x = sx;
    p.y = 0;
    p.vy = 0;
    p.grounded = true;
    p.jumps = 0;
    p.inv = 1.6;
    p.sliding = false;
  }

  private groundAt(cx: number): Segment | null {
    for (const s of this.level.segments) {
      if (cx >= s.x0 && cx <= s.x1) return s;
    }
    return null;
  }

  // ---- particles & popups -------------------------------------------------

  private spawn(o: Particle) {
    if (this.particles.length < 260) this.particles.push(o);
  }

  private spawnDust(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      this.spawn({
        x: x + rand(-10, 10),
        y: y + rand(0, 6),
        vx: rand(-70, -10),
        vy: rand(20, 110),
        life: rand(0.25, 0.5),
        maxLife: 0.5,
        size: rand(3, 7),
        color,
        grav: -260,
        spin: 0,
        rot: 0,
        kind: 1,
      });
    }
  }

  private spawnSpark(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(80, 260);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: rand(0.3, 0.55),
        maxLife: 0.55,
        size: rand(2, 4),
        color,
        grav: 500,
        spin: 0,
        rot: 0,
        kind: 0,
      });
    }
  }

  private spawnBurst(x: number, y: number, n: number, color: string) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2);
      const sp = rand(120, 420);
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp * 0.8,
        life: rand(0.35, 0.7),
        maxLife: 0.7,
        size: rand(2.5, 5.5),
        color,
        grav: 850,
        spin: 0,
        rot: 0,
        kind: 0,
      });
    }
  }

  private spawnRing(x: number, y: number) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      this.spawn({
        x,
        y,
        vx: Math.cos(a) * 160,
        vy: Math.sin(a) * 160,
        life: 0.3,
        maxLife: 0.3,
        size: 3,
        color: "#67e8f9",
        grav: 0,
        spin: 0,
        rot: 0,
        kind: 0,
      });
    }
  }

  private spawnConfetti(x: number, y: number, n: number, th: { accent: string; accent2: string; coin: string; edge: string }) {
    const colors = [th.accent, th.accent2, th.coin, th.edge, "#ffffff"];
    for (let i = 0; i < n; i++) {
      this.spawn({
        x: x + rand(-30, 30),
        y: y + rand(0, 40),
        vx: rand(-190, 190),
        vy: rand(120, 480),
        life: rand(0.7, 1.4),
        maxLife: 1.4,
        size: rand(3, 6),
        color: colors[(Math.random() * colors.length) | 0],
        grav: 700,
        spin: rand(-9, 9),
        rot: rand(0, 6),
        kind: 2,
      });
    }
  }

  private spawnTrail(x: number, y: number) {
    this.spawn({
      x,
      y: y + rand(0, 30),
      vx: rand(-30, -10),
      vy: rand(10, 60),
      life: rand(0.2, 0.4),
      maxLife: 0.4,
      size: rand(1.5, 3),
      color: this.level.theme.accent,
      grav: -120,
      spin: 0,
      rot: 0,
      kind: 0,
    });
  }

  private updateParticles(dt: number) {
    const arr = this.particles;
    for (let i = arr.length - 1; i >= 0; i--) {
      const p = arr[i];
      p.life -= dt;
      if (p.life <= 0) {
        arr[i] = arr[arr.length - 1];
        arr.pop();
        continue;
      }
      p.vy += p.grav * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.spin * dt;
    }
  }

  private addPopup(x: number, y: number, text: string, color: string) {
    this.popups.push({ x, y, text, life: 1, color });
  }

  private updatePopups(dt: number) {
    for (let i = this.popups.length - 1; i >= 0; i--) {
      const p = this.popups[i];
      p.life -= dt * 0.9;
      p.y += 46 * dt;
      if (p.life <= 0) this.popups.splice(i, 1);
    }
  }

  // ---- render -------------------------------------------------------------

  private render() {
    const { ctx, w, h, groundY } = this;
    const th = this.level.theme;
    const camX = this.camX;

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, th.bg0);
    sky.addColorStop(1, th.bg1);
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(this.shakeX, this.shakeY);

    this.drawStars();
    this.drawSilhouettes(th.far, 0.18, camX, groundY);
    this.drawSilhouettes(th.mid, 0.42, camX, groundY);
    this.drawBillboards(camX, groundY, th);
    this.drawGround(th, camX, groundY);
    this.drawGoal(camX, groundY, th);
    this.drawCoins(camX, groundY, th);
    this.drawObstacles(camX, groundY, th);
    this.drawParticles(camX, groundY);
    this.drawPlayer(camX, groundY, th);
    this.drawPopups(camX, groundY);

    ctx.restore();

    // damage flash
    if (this.flash > 0) {
      ctx.fillStyle = `rgba(239,68,68,${this.flash * 1.6})`;
      ctx.fillRect(0, 0, w, h);
    }
  }

  private drawStars() {
    const { ctx, w, h } = this;
    ctx.fillStyle = "#cbd5e1";
    for (const s of this.stars) {
      const sx = ((s.x - this.camX * 0.05) % 2200 + 2200) % 2200 - 100;
      if (sx < -10 || sx > w + 10) continue;
      const a = 0.25 + 0.35 * Math.abs(Math.sin(this.time * 0.8 + s.tw));
      ctx.globalAlpha = a;
      ctx.fillRect(sx, s.y * h, s.s, s.s);
    }
    ctx.globalAlpha = 1;
  }

  private drawSilhouettes(color: string, par: number, camX: number, groundY: number) {
    const { ctx, w } = this;
    ctx.fillStyle = color;
    const shapes = par < 0.3 ? this.level.farShapes : this.level.midShapes;
    for (const s of shapes) {
      const sx = s.x - camX * par;
      if (sx < -s.w - 40 || sx > w + s.w + 40) continue;
      const base = groundY;
      ctx.globalAlpha = par < 0.3 ? 0.75 : 0.9;
      if (s.kind === 0) {
        // triangle mountain
        ctx.beginPath();
        ctx.moveTo(sx, base);
        ctx.lineTo(sx + s.w / 2, base - s.h);
        ctx.lineTo(sx + s.w, base);
        ctx.closePath();
        ctx.fill();
      } else if (s.kind === 1) {
        // box building with antenna
        ctx.fillRect(sx, base - s.h, s.w, s.h);
        ctx.fillRect(sx + s.w / 2 - 1, base - s.h - 12, 2, 12);
      } else {
        // rounded hill
        ctx.beginPath();
        ctx.ellipse(sx + s.w / 2, base, s.w / 2, s.h / 2, 0, Math.PI, 0);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawBillboards(camX: number, groundY: number, th: Theme) {
    const { ctx, w } = this;
    for (const b of this.level.billboards) {
      const sx = b.x - camX * 0.55;
      if (sx < -200 || sx > w + 200) continue;
      const top = groundY - 150;
      // pole
      ctx.fillStyle = "#334155";
      ctx.fillRect(sx - 3, top, 6, 150);
      // panel
      ctx.fillStyle = "rgba(10,16,34,0.92)";
      ctx.strokeStyle = th.accent;
      ctx.lineWidth = 2;
      const pw = 132;
      const ph = 42;
      this.roundRect(sx - pw / 2, top - ph, pw, ph, 6);
      ctx.fill();
      ctx.stroke();
      // text
      ctx.fillStyle = th.accent;
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(b.text, sx, top - ph / 2);
      // small glow dot
      ctx.fillStyle = th.accent2;
      ctx.beginPath();
      ctx.arc(sx, top + 150 - 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawGround(th: Theme, camX: number, groundY: number) {
    const { ctx, w, h } = this;
    const bandH = h - groundY;
    const g = ctx.createLinearGradient(0, groundY, 0, h);
    g.addColorStop(0, th.ground);
    g.addColorStop(1, "#05080f");
    ctx.fillStyle = g;
    ctx.fillRect(0, groundY, w, bandH);

    // vertical scrolling grid lines
    ctx.strokeStyle = th.edge;
    ctx.lineWidth = 1;
    const gridGap = 70;
    const startX = Math.floor(camX / gridGap) * gridGap;
    ctx.globalAlpha = 0.14;
    ctx.beginPath();
    for (let wx = startX; wx < camX + w + gridGap; wx += gridGap) {
      const sx = wx - camX;
      ctx.moveTo(sx, groundY);
      ctx.lineTo(sx, h);
    }
    ctx.stroke();

    // horizontal perspective lines
    ctx.globalAlpha = 0.1;
    ctx.beginPath();
    for (let i = 1; i <= 4; i++) {
      const y = groundY + Math.pow(i / 4, 1.6) * bandH;
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;

    // ground top edge + glow
    ctx.strokeStyle = th.edge;
    ctx.lineWidth = 3;
    ctx.shadowColor = th.edge;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // pit warning posts at segment boundaries
    for (const s of this.level.segments) {
      if (s.x0 > -50 && s.x0 < this.level.length) {
        this.drawPitEdge(s.x0 - camX, groundY);
      }
    }
  }

  private drawPitEdge(sx: number, groundY: number) {
    const { ctx } = this;
    if (sx < -40 || sx > this.w + 40) return;
    // striped warning post
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(sx - 2, groundY - 26, 4, 26);
    ctx.fillStyle = "#ef4444";
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(sx - 2, groundY - 24 + i * 9, 4, 4);
    }
    ctx.beginPath();
    ctx.arc(sx, groundY - 30, 3, 0, Math.PI * 2);
    ctx.fillStyle = "#fbbf24";
    ctx.fill();
  }

  private drawCoins(camX: number, groundY: number, th: Theme) {
    const { ctx } = this;
    const t = this.time;
    for (const c of this.level.coins) {
      if (c.taken) continue;
      const sx = c.x - camX;
      if (sx < -40 || sx > this.w + 40) continue;
      const sy = groundY - c.y;
      const spin = Math.cos(t * 5 + c.x * 0.02);
      const sq = Math.abs(spin) * 0.75 + 0.25;
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(sq, 1);
      // outer octagon
      ctx.fillStyle = spin < 0 ? "#d97706" : th.coin;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
        const px = Math.cos(a) * 13;
        const py = Math.sin(a) * 13;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      // inner
      ctx.fillStyle = "#78350f";
      ctx.beginPath();
      ctx.arc(0, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      // shine
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.fillRect(-6, -8, 3, 5);
      ctx.restore();
    }
  }

  private drawObstacles(camX: number, groundY: number, th: Theme) {
    const { ctx } = this;
    const t = this.time;
    for (const o of this.level.obstacles) {
      const sx = o.x - camX;
      if (sx < -120 || sx > this.w + 120) continue;
      const baseY = groundY - o.y;
      switch (o.type) {
        case "bug": {
          const y = groundY - o.y;
          ctx.save();
          ctx.translate(sx, y);
          // legs
          ctx.strokeStyle = "#7f1d1d";
          ctx.lineWidth = 2.5;
          for (let i = 0; i < 3; i++) {
            const ph = Math.sin(t * 16 + i * 2 + o.phase) * 4;
            ctx.beginPath();
            ctx.moveTo(-12 + i * 12, -8);
            ctx.lineTo(-16 + i * 12 + ph, 2);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(-12 + i * 12, -8);
            ctx.lineTo(-8 + i * 12 - ph, 2);
            ctx.stroke();
          }
          // body
          ctx.fillStyle = "#ef4444";
          ctx.beginPath();
          ctx.ellipse(0, -16, 23, 14, 0, 0, Math.PI * 2);
          ctx.fill();
          // shell line
          ctx.strokeStyle = "#991b1b";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -30);
          ctx.lineTo(0, -2);
          ctx.stroke();
          // eyes
          ctx.fillStyle = "#fff";
          ctx.beginPath();
          ctx.arc(-8, -20, 4, 0, Math.PI * 2);
          ctx.arc(8, -20, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#111";
          ctx.beginPath();
          ctx.arc(-8, -20, 2, 0, Math.PI * 2);
          ctx.arc(8, -20, 2, 0, Math.PI * 2);
          ctx.fill();
          // antenna
          ctx.strokeStyle = "#7f1d1d";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(18, -26);
          ctx.lineTo(24, -36);
          ctx.stroke();
          ctx.restore();
          break;
        }
        case "spike": {
          ctx.fillStyle = "#94a3b8";
          for (let i = 0; i < 4; i++) {
            const bx = sx - 30 + i * 15;
            ctx.beginPath();
            ctx.moveTo(bx, groundY);
            ctx.lineTo(bx + 7.5, groundY - 34);
            ctx.lineTo(bx + 15, groundY);
            ctx.closePath();
            ctx.fill();
          }
          ctx.fillStyle = th.accent2;
          for (let i = 0; i < 4; i++) {
            const bx = sx - 30 + i * 15;
            ctx.beginPath();
            ctx.moveTo(bx + 4, groundY - 24);
            ctx.lineTo(bx + 7.5, groundY - 34);
            ctx.lineTo(bx + 11, groundY - 24);
            ctx.closePath();
            ctx.fill();
          }
          break;
        }
        case "wall": {
          ctx.fillStyle = "#334155";
          this.roundRect(sx - 19, groundY - o.h, 38, o.h, 4);
          ctx.fill();
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 3;
          ctx.stroke();
          // hazard stripes
          ctx.save();
          this.roundRect(sx - 19, groundY - o.h, 38, o.h, 4);
          ctx.clip();
          ctx.strokeStyle = th.accent2;
          ctx.lineWidth = 5;
          for (let i = -2; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(sx - 30 + i * 16, groundY);
            ctx.lineTo(sx - 30 + i * 16 + 20, groundY - o.h - 10);
            ctx.stroke();
          }
          ctx.restore();
          break;
        }
        case "barrier": {
          const y = baseY;
          ctx.save();
          ctx.shadowColor = th.accent2;
          ctx.shadowBlur = 12;
          ctx.fillStyle = "#475569";
          this.roundRect(sx - 35, y, 70, 30, 8);
          ctx.fill();
          ctx.shadowBlur = 0;
          // stripes
          ctx.save();
          this.roundRect(sx - 35, y, 70, 30, 8);
          ctx.clip();
          ctx.strokeStyle = th.accent2;
          ctx.lineWidth = 6;
          for (let i = -1; i < 5; i++) {
            ctx.beginPath();
            ctx.moveTo(sx - 40 + i * 20, y + 34);
            ctx.lineTo(sx - 40 + i * 20 + 18, y - 4);
            ctx.stroke();
          }
          ctx.restore();
          // posts
          ctx.fillStyle = "#334155";
          ctx.fillRect(sx - 35, y + 30, 6, groundY - (y + 30));
          ctx.fillRect(sx + 29, y + 30, 6, groundY - (y + 30));
          ctx.restore();
          break;
        }
        case "drone": {
          const bob = Math.sin(t * 3 + o.phase) * 5;
          const y = baseY + bob;
          ctx.save();
          ctx.translate(sx, y);
          // rotors
          ctx.strokeStyle = "#94a3b8";
          ctx.lineWidth = 3;
          const r1 = Math.cos(t * 40 + o.phase) * 16;
          ctx.beginPath();
          ctx.moveTo(-22 - r1, -16);
          ctx.lineTo(-22 + r1, -16);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(22 - r1, -16);
          ctx.lineTo(22 + r1, -16);
          ctx.stroke();
          // body
          ctx.fillStyle = "#475569";
          this.roundRect(-18, -12, 36, 22, 8);
          ctx.fill();
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 2;
          ctx.stroke();
          // eye
          ctx.fillStyle = "#0b1220";
          this.roundRect(-10, -6, 20, 10, 4);
          ctx.fill();
          // blink light
          ctx.fillStyle = Math.floor(t * 3) % 2 === 0 ? "#ef4444" : "#7f1d1d";
          ctx.beginPath();
          ctx.arc(0, 12, 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
          break;
        }
      }
    }
  }

  private drawGoal(camX: number, groundY: number, th: Theme) {
    const { ctx, w } = this;
    const sx = this.level.goalX - camX;
    if (sx < -120 || sx > w + 120) return;
    const t = this.time;
    // pole
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(sx - 2, groundY - 130, 4, 130);
    // checkered flag
    const fw = 46;
    const fh = 30;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = (r + c) % 2 === 0 ? "#f8fafc" : "#0f172a";
        const wave = Math.sin(t * 6 + r * 1.2 + c * 0.6) * 2;
        ctx.fillRect(sx + 2 + c * (fw / 4), groundY - 130 + r * (fh / 3) + wave, fw / 4, fh / 3);
      }
    }
    // glow
    ctx.fillStyle = th.accent;
    ctx.globalAlpha = 0.25 + 0.15 * Math.sin(t * 4);
    ctx.beginPath();
    ctx.arc(sx, groundY - 60, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // label
    ctx.fillStyle = th.accent;
    ctx.font = '9px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.fillText("GOAL", sx, groundY - 142);
  }

  private drawPlayer(camX: number, groundY: number, th: Theme) {
    const { ctx } = this;
    const p = this.player;
    const sx = p.x - camX;

    // shadow
    const hgt = clamp(p.y / 160, 0, 1);
    ctx.globalAlpha = 0.32 * (1 - hgt * 0.55);
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.ellipse(sx, groundY + 4, 22 * (1 - hgt * 0.35), 6 * (1 - hgt * 0.25), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // invincibility blink
    if (p.inv > 0 && Math.floor(this.time * 14) % 2 === 0) ctx.globalAlpha = 0.35;

    ctx.save();
    ctx.translate(sx, groundY - p.y);

    // squash & stretch
    const sy = p.stretch * (1 + clamp(p.vy / 2600, -0.16, 0.2));
    const squashX = 1 / Math.sqrt(sy);
    ctx.scale(squashX, sy);

    if (p.sliding) {
      // ---- slide pose: wide low robot ----
      ctx.rotate(-0.12);
      const grad = ctx.createLinearGradient(0, -34, 0, 0);
      grad.addColorStop(0, th.accent);
      grad.addColorStop(1, "#0e7490");
      ctx.fillStyle = grad;
      this.roundRect(-26, -32, 52, 28, 12);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.35)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // visor
      ctx.fillStyle = "#0b1220";
      this.roundRect(6, -26, 16, 12, 5);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(15, -20, 3, 0, Math.PI * 2);
      ctx.fill();
      // sparks
      ctx.fillStyle = th.accent2;
      ctx.fillRect(-30, -6, 6, 3);
      ctx.fillRect(-36, -12, 5, 3);
    } else {
      // ---- run / air pose ----
      const run = p.grounded ? Math.sin(p.run) : 0;
      // legs
      ctx.fillStyle = "#1e293b";
      this.roundRect(-12 + run * 5, -15, 9, 15, 3);
      ctx.fill();
      this.roundRect(3 - run * 5, -15, 9, 15, 3);
      ctx.fill();
      // feet
      ctx.fillStyle = th.accent;
      this.roundRect(-14 + run * 5, -5, 13, 5, 2);
      ctx.fill();
      this.roundRect(1 - run * 5, -5, 13, 5, 2);
      ctx.fill();
      // body
      const grad = ctx.createLinearGradient(0, -54, 0, -12);
      grad.addColorStop(0, th.accent);
      grad.addColorStop(1, "#155e75");
      ctx.fillStyle = grad;
      this.roundRect(-17, -52, 34, 40, 10);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 2;
      ctx.stroke();
      // chest light
      ctx.fillStyle = th.accent2;
      ctx.beginPath();
      ctx.arc(0, -22, 3.5, 0, Math.PI * 2);
      ctx.fill();
      // arms
      ctx.fillStyle = "#1e293b";
      this.roundRect(-22, -46 - run * 3, 7, 16, 3);
      ctx.fill();
      this.roundRect(15, -46 + run * 3, 7, 16, 3);
      ctx.fill();
      // head visor
      ctx.fillStyle = "#0b1220";
      this.roundRect(-13, -49, 26, 16, 7);
      ctx.fill();
      // eye
      if (p.blink > 0) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -41);
        ctx.lineTo(7, -41);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(3.5, -41, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = th.accent;
        ctx.beginPath();
        ctx.arc(5, -41, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      // antenna
      ctx.strokeStyle = "#cbd5e1";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, -52);
      ctx.lineTo(14, -63);
      ctx.stroke();
      ctx.fillStyle = th.accent;
      ctx.beginPath();
      ctx.arc(14, -65, 2.8, 0, Math.PI * 2);
      ctx.fill();
      // jet flame
      if (p.jetT > 0) {
        const f = p.jetT / 0.18;
        ctx.fillStyle = `rgba(251,146,60,${f})`;
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(0, 16 * f + 6);
        ctx.lineTo(6, 0);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = `rgba(254,240,138,${f})`;
        ctx.beginPath();
        ctx.moveTo(-3, 0);
        ctx.lineTo(0, 9 * f + 3);
        ctx.lineTo(3, 0);
        ctx.closePath();
        ctx.fill();
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  private drawParticles(camX: number, groundY: number) {
    const { ctx } = this;
    for (const p of this.particles) {
      const sx = p.x - camX;
      const sy = groundY - p.y;
      const a = clamp(p.life / p.maxLife, 0, 1);
      ctx.globalAlpha = a;
      if (p.kind === 2) {
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(sx, sy, p.size * (p.kind === 1 ? (2 - a) : 1), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawPopups(camX: number, groundY: number) {
    const { ctx } = this;
    ctx.font = '11px "Press Start 2P", monospace';
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    for (const p of this.popups) {
      ctx.globalAlpha = clamp(p.life, 0, 1);
      ctx.fillStyle = p.color;
      ctx.fillText(p.text, p.x - camX, groundY - p.y);
    }
    ctx.globalAlpha = 1;
  }

  // ---- helpers --------------------------------------------------------------

  private roundRect(x: number, y: number, w: number, h: number, r: number) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
