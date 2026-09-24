import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { PROJECTS, Project } from "./projects";
import { Sfx } from "../game/audio";

// ===========================================================================
// DEVQUEST 3D gallery engine
// A neon exhibition hall: 6 project booths arranged in a circle. Click one
// and the camera flies in for a close-up while the DOM panel expands.
// ===========================================================================

const BOOTH_RADIUS = 7;
const OVERVIEW = new THREE.Vector3(0, 3.6, 12.8);
const OVERVIEW_TARGET = new THREE.Vector3(0, 1.5, 0);

export interface GalleryCallbacks {
  onSelect(index: number | null): void;
}

interface Exhibit {
  group: THREE.Group;
  hero: THREE.Group;
  ringMat: THREE.MeshStandardMaterial;
  glowMats: THREE.MeshStandardMaterial[];
  spinners: THREE.Object3D[];
  label: THREE.Sprite;
  data: Project;
  baseY: number;
  facing: number;
  phase: number;
  pop: number; // select pop animation 1 -> 0
  spin: number; // sway while selected
}

interface Tween {
  t: number;
  dur: number;
  fromP: THREE.Vector3;
  toP: THREE.Vector3;
  fromT: THREE.Vector3;
  toT: THREE.Vector3;
  onDone?: () => void;
}

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const easeInOut = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t: number) =>
  1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// ---------------------------------------------------------------------------
// Particle pool (click bursts)
// ---------------------------------------------------------------------------
class ParticlePool {
  private max = 500;
  private pos = new Float32Array(this.max * 3);
  private col = new Float32Array(this.max * 3);
  private base = new Float32Array(this.max * 3);
  private vel = new Float32Array(this.max * 3);
  private life = new Float32Array(this.max);
  private maxLife = new Float32Array(this.max);
  private count = 0;
  private geo = new THREE.BufferGeometry();
  points: THREE.Points;

  constructor() {
    this.geo.setAttribute(
      "position",
      new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage)
    );
    this.geo.setAttribute(
      "color",
      new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage)
    );
    const mat = new THREE.PointsMaterial({
      size: 0.13,
      vertexColors: true,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
      fog: false,
    });
    this.points = new THREE.Points(this.geo, mat);
    this.points.frustumCulled = false;
    this.geo.setDrawRange(0, 0);
  }

  spawn(x: number, y: number, z: number, hex: string, n: number, speed = 4) {
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i++) {
      if (this.count >= this.max) return;
      const idx = this.count++;
      this.pos[idx * 3] = x;
      this.pos[idx * 3 + 1] = y;
      this.pos[idx * 3 + 2] = z;
      const a = Math.random() * Math.PI * 2;
      const b = Math.random() * Math.PI - Math.PI / 2;
      const sp = speed * (0.4 + Math.random() * 0.9);
      this.vel[idx * 3] = Math.cos(a) * Math.cos(b) * sp;
      this.vel[idx * 3 + 1] = Math.sin(b) * sp + 1.6;
      this.vel[idx * 3 + 2] = Math.sin(a) * Math.cos(b) * sp;
      this.base[idx * 3] = c.r;
      this.base[idx * 3 + 1] = c.g;
      this.base[idx * 3 + 2] = c.b;
      this.life[idx] = this.maxLife[idx] = 0.7 + Math.random() * 0.8;
    }
    this.geo.setDrawRange(0, this.count);
  }

  update(dt: number) {
    for (let i = this.count - 1; i >= 0; i--) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        const last = --this.count;
        if (i !== last) {
          for (let k = 0; k < 3; k++) {
            this.pos[i * 3 + k] = this.pos[last * 3 + k];
            this.vel[i * 3 + k] = this.vel[last * 3 + k];
            this.base[i * 3 + k] = this.base[last * 3 + k];
          }
          this.life[i] = this.life[last];
          this.maxLife[i] = this.maxLife[last];
        }
        continue;
      }
      this.vel[i * 3 + 1] -= 5.5 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.col[i * 3] = this.base[i * 3] * f;
      this.col[i * 3 + 1] = this.base[i * 3 + 1] * f;
      this.col[i * 3 + 2] = this.base[i * 3 + 2] * f;
    }
    this.geo.setDrawRange(0, this.count);
    (this.geo.attributes.position as THREE.BufferAttribute).needsUpdate = true;
    (this.geo.attributes.color as THREE.BufferAttribute).needsUpdate = true;
  }
}

// ---------------------------------------------------------------------------
// Label sprite (canvas-drawn, re-rendered when the arcade font is ready)
// ---------------------------------------------------------------------------
interface LabelSprite {
  sprite: THREE.Sprite;
  text: string;
  accent: string;
  big: boolean;
}

function makeLabel(
  text: string,
  accent: string,
  big: boolean
): { sprite: THREE.Sprite; label: LabelSprite } {
  const c = document.createElement("canvas");
  c.width = big ? 1024 : 512;
  c.height = big ? 256 : 128;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({
    map: tex,
    transparent: true,
    depthWrite: false,
  });
  const sprite = new THREE.Sprite(mat);
  if (big) sprite.scale.set(5.6, 1.4, 1);
  else sprite.scale.set(3.3, 0.82, 1);
  const label: LabelSprite = { sprite, text, accent, big };
  drawLabel(label);
  return { sprite, label };
}

function drawLabel(label: LabelSprite) {
  const { sprite } = label;
  const c = (sprite.material.map as THREE.CanvasTexture).image as HTMLCanvasElement;
  const g = c.getContext("2d")!;
  g.clearRect(0, 0, c.width, c.height);
  g.font = `${label.big ? 84 : 42}px "Press Start 2P", monospace`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  g.shadowColor = label.accent;
  g.shadowBlur = label.big ? 40 : 24;
  g.fillStyle = "#ffffff";
  g.fillText(label.text, c.width / 2, c.height / 2 + 4);
  (sprite.material.map as THREE.CanvasTexture).needsUpdate = true;
}

// ---------------------------------------------------------------------------
// Hero object builders — each returns a group whose feet sit at y = 0.
// ---------------------------------------------------------------------------
function std(color = 0x1b2740, rough = 0.55, metal = 0.35) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: rough,
    metalness: metal,
  });
}
function glow(accent: string, intensity = 1.5) {
  return new THREE.MeshStandardMaterial({
    color: 0x0a0f1e,
    emissive: new THREE.Color(accent),
    emissiveIntensity: intensity,
    roughness: 0.4,
    metalness: 0.3,
  });
}
function screen(tex: THREE.Texture) {
  return new THREE.MeshBasicMaterial({ map: tex });
}

function addMesh(
  parent: THREE.Group,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x: number,
  y: number,
  z: number
): THREE.Mesh {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

type BuiltHero = { hero: THREE.Group; glowMats: THREE.MeshStandardMaterial[]; spinners: THREE.Object3D[] };

function buildCabinet(accent: string, tex: THREE.Texture): BuiltHero {
  const hero = new THREE.Group();
  const g: THREE.MeshStandardMaterial[] = [];
  const body = std(0x101a30);
  addMesh(hero, new THREE.BoxGeometry(1.25, 1.85, 0.75), body, 0, 0.95, 0);
  // screen
  addMesh(hero, new THREE.PlaneGeometry(1.0, 0.62), screen(tex), 0, 1.32, 0.381);
  // control deck
  addMesh(hero, new THREE.BoxGeometry(1.0, 0.22, 0.1), std(0x0a1226), 0, 0.68, 0.36);
  // accent strips
  const strip = glow(accent, 2);
  g.push(strip);
  addMesh(hero, new THREE.BoxGeometry(0.07, 1.7, 0.06), strip, -0.56, 0.95, 0.36);
  addMesh(hero, new THREE.BoxGeometry(0.07, 1.7, 0.06), strip, 0.56, 0.95, 0.36);
  // joystick
  addMesh(hero, new THREE.CylinderGeometry(0.02, 0.02, 0.14), std(0xd1d5db), -0.3, 0.82, 0.36);
  addMesh(hero, new THREE.SphereGeometry(0.05, 10, 8), glow("#ff3355", 1.6), -0.3, 0.91, 0.36);
  // marquee
  const mq = glow(accent, 1.1);
  g.push(mq);
  addMesh(hero, new THREE.BoxGeometry(1.25, 0.22, 0.78), mq, 0, 1.98, 0);
  // legs
  addMesh(hero, new THREE.BoxGeometry(0.12, 0.12, 0.6), body, -0.5, 0.06, 0);
  addMesh(hero, new THREE.BoxGeometry(0.12, 0.12, 0.6), body, 0.5, 0.06, 0);
  return { hero, glowMats: g, spinners: [] };
}

function buildTower(accent: string, tex: THREE.Texture): BuiltHero {
  const hero = new THREE.Group();
  const g: THREE.MeshStandardMaterial[] = [];
  const spinners: THREE.Object3D[] = [];
  // island
  addMesh(hero, new THREE.CylinderGeometry(0.95, 0.12, 0.9, 9), std(0x3b2f23, 0.9, 0.1), 0, 0.55, 0);
  addMesh(hero, new THREE.CircleGeometry(0.95, 24), std(0x2f6b3a, 0.95, 0), 0, 1.01, 0).rotation.x = -Math.PI / 2;
  // mini screen on the island edge
  addMesh(hero, new THREE.PlaneGeometry(0.55, 0.34), screen(tex), 0, 0.42, 0.476);
  // turret
  const accentMat = glow(accent, 1.8);
  g.push(accentMat);
  addMesh(hero, new THREE.CylinderGeometry(0.26, 0.34, 0.24, 12), std(0x2a3550), 0, 1.16, 0);
  addMesh(hero, new THREE.BoxGeometry(0.42, 0.3, 0.42), std(0x2a3550), 0, 1.4, 0);
  const head = addMesh(hero, new THREE.BoxGeometry(0.2, 0.16, 0.6), accentMat, 0, 1.44, 0.32);
  head.rotation.x = -0.5;
  // floating rocks
  for (let i = 0; i < 2; i++) {
    const rock = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16 + i * 0.05, 0),
      std(0x3b2f23, 0.9, 0.1)
    );
    rock.castShadow = true;
    rock.position.set(i === 0 ? -1.1 : 1.1, 1.5 + i * 0.25, i === 0 ? -0.4 : 0.5);
    rock.userData.orbit = { r: 1.0 + i * 0.35, speed: 0.5 + i * 0.2, y: 1.5 + i * 0.25, phase: i * 2 };
    hero.add(rock);
    spinners.push(rock);
  }
  return { hero, glowMats: g, spinners };
}

function buildDungeon(accent: string, tex: THREE.Texture): BuiltHero {
  const hero = new THREE.Group();
  const g: THREE.MeshStandardMaterial[] = [];
  const stone = std(0x3a3f52, 0.95, 0.05);
  const stoneDark = std(0x2a2e3e, 0.95, 0.05);
  addMesh(hero, new THREE.BoxGeometry(1.5, 0.12, 1.5), stoneDark, 0, 0.06, 0);
  // walls
  addMesh(hero, new THREE.BoxGeometry(1.5, 1.05, 0.14), stone, 0, 0.6, -0.68);
  addMesh(hero, new THREE.BoxGeometry(0.14, 0.8, 1.5), stone, -0.68, 0.46, 0);
  // bricks
  for (let i = 0; i < 3; i++) {
    addMesh(hero, new THREE.BoxGeometry(0.34, 0.18, 0.04), stoneDark, -0.4 + i * 0.4, 0.35 + (i % 2) * 0.28, -0.59);
  }
  // screen window on back wall
  addMesh(hero, new THREE.PlaneGeometry(0.62, 0.4), screen(tex), 0.3, 0.78, -0.599);
  // chest
  addMesh(hero, new THREE.BoxGeometry(0.42, 0.26, 0.3), std(0x5a3a1e, 0.8, 0.1), 0.15, 0.26, 0.25);
  const trim = glow("#fbbf24", 1.3);
  g.push(trim);
  addMesh(hero, new THREE.BoxGeometry(0.44, 0.05, 0.32), trim, 0.15, 0.36, 0.25);
  // gem
  const gem = addMesh(hero, new THREE.OctahedronGeometry(0.14), glow(accent, 2), -0.35, 0.28, 0.15);
  gem.userData.spinY = 1.6;
  // torch
  addMesh(hero, new THREE.CylinderGeometry(0.025, 0.025, 0.5), std(0x4a3520), -0.55, 0.85, -0.5);
  const flame = addMesh(hero, new THREE.ConeGeometry(0.07, 0.2, 8), glow("#fb923c", 2.2), -0.55, 1.16, -0.5);
  flame.userData.flame = true;
  return { hero, glowMats: g, spinners: [gem, flame] };
}

function buildRocket(accent: string, tex: THREE.Texture): BuiltHero {
  const hero = new THREE.Group();
  const g: THREE.MeshStandardMaterial[] = [];
  const white = std(0xdde3ee, 0.35, 0.5);
  // launchpad
  addMesh(hero, new THREE.CylinderGeometry(1.0, 1.1, 0.14, 24), std(0x2a3550), 0, 0.07, 0);
  addMesh(hero, new THREE.PlaneGeometry(0.6, 0.38), screen(tex), 0, 0.5, 0.55);
  // rocket
  addMesh(hero, new THREE.CylinderGeometry(0.17, 0.2, 0.95, 16), white, 0, 0.72, 0);
  const noseMat = glow(accent, 1.6);
  g.push(noseMat);
  addMesh(hero, new THREE.ConeGeometry(0.17, 0.36, 16), noseMat, 0, 1.38, 0);
  // window
  addMesh(hero, new THREE.SphereGeometry(0.09, 12, 10), glow("#22d3ee", 2), 0, 0.85, 0.16);
  // fins
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const fin = addMesh(
      hero,
      new THREE.BoxGeometry(0.06, 0.3, 0.24),
      glow(accent, 1.4),
      Math.sin(a) * 0.22,
      0.34,
      Math.cos(a) * 0.22
    );
    fin.rotation.y = a;
    g.push(fin.material as THREE.MeshStandardMaterial);
  }
  // flame
  const flame = addMesh(hero, new THREE.ConeGeometry(0.12, 0.42, 10), glow("#fb923c", 2.4), 0, 0.12, 0);
  flame.rotation.x = Math.PI;
  flame.userData.flame = true;
  // greenhouse dome
  const dome = addMesh(hero, new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshStandardMaterial({
    color: 0x0e1830,
    emissive: new THREE.Color("#4ade80"),
    emissiveIntensity: 0.5,
    roughness: 0.2,
    metalness: 0.2,
    transparent: true,
    opacity: 0.8,
  }), 0.62, 0.4, -0.2);
  dome.userData.spinY = 0.5;
  return { hero, glowMats: g, spinners: [flame, dome] };
}

function buildRobot(accent: string, tex: THREE.Texture): BuiltHero {
  const hero = new THREE.Group();
  const g: THREE.MeshStandardMaterial[] = [];
  const body = std(0x182340);
  // legs
  addMesh(hero, new THREE.BoxGeometry(0.13, 0.32, 0.14), body, -0.13, 0.16, 0);
  addMesh(hero, new THREE.BoxGeometry(0.13, 0.32, 0.14), body, 0.13, 0.16, 0);
  addMesh(hero, new THREE.BoxGeometry(0.17, 0.06, 0.2), glow(accent, 1.6), -0.13, 0.03, 0.03);
  addMesh(hero, new THREE.BoxGeometry(0.17, 0.06, 0.2), glow(accent, 1.6), 0.13, 0.03, 0.03);
  // torso
  addMesh(hero, new THREE.BoxGeometry(0.52, 0.52, 0.3), body, 0, 0.58, 0);
  const trim = glow(accent, 1.7);
  g.push(trim);
  addMesh(hero, new THREE.BoxGeometry(0.52, 0.06, 0.32), trim, 0, 0.82, 0);
  // chest light
  addMesh(hero, new THREE.SphereGeometry(0.05, 10, 8), glow("#f0f", 2.2), 0, 0.58, 0.16);
  // arms
  addMesh(hero, new THREE.BoxGeometry(0.08, 0.4, 0.1), body, -0.33, 0.56, 0);
  addMesh(hero, new THREE.BoxGeometry(0.08, 0.4, 0.1), body, 0.33, 0.56, 0);
  // head
  addMesh(hero, new THREE.BoxGeometry(0.36, 0.28, 0.3), body, 0, 1.04, 0);
  const visor = glow("#67e8f9", 2);
  g.push(visor);
  addMesh(hero, new THREE.BoxGeometry(0.26, 0.1, 0.05), visor, 0.03, 1.04, 0.155);
  // antenna
  addMesh(hero, new THREE.CylinderGeometry(0.015, 0.015, 0.2), std(0xdde3ee), 0.12, 1.27, 0);
  addMesh(hero, new THREE.SphereGeometry(0.035, 8, 8), glow(accent, 2.4), 0.12, 1.39, 0);
  // screen backpack
  addMesh(hero, new THREE.PlaneGeometry(0.42, 0.3), screen(tex), 0, 0.58, -0.18);
  return { hero, glowMats: g, spinners: [] };
}

function buildShip(accent: string, tex: THREE.Texture): BuiltHero {
  const hero = new THREE.Group();
  const g: THREE.MeshStandardMaterial[] = [];
  const hull = std(0x2a3550, 0.4, 0.7);
  const ship = new THREE.Group();
  ship.position.y = 0.95;
  hero.add(ship);
  // fuselage (points +Z)
  const fus = addMesh(ship, new THREE.ConeGeometry(0.24, 1.25, 14), hull, 0, 0, 0);
  fus.rotation.x = Math.PI / 2;
  // cockpit
  addMesh(ship, new THREE.SphereGeometry(0.13, 12, 10), glow("#67e8f9", 2), 0, 0.14, 0.22);
  // wings
  const wl = addMesh(ship, new THREE.BoxGeometry(0.62, 0.05, 0.42), hull, -0.36, -0.02, -0.18);
  wl.rotation.z = 0.25;
  const wr = addMesh(ship, new THREE.BoxGeometry(0.62, 0.05, 0.42), hull, 0.36, -0.02, -0.18);
  wr.rotation.z = -0.25;
  // wing tips
  const tipMat = glow(accent, 2.2);
  g.push(tipMat);
  addMesh(ship, new THREE.BoxGeometry(0.07, 0.08, 0.2), tipMat, -0.62, -0.08, -0.18);
  addMesh(ship, new THREE.BoxGeometry(0.07, 0.08, 0.2), tipMat, 0.62, -0.08, -0.18);
  // engine glows
  addMesh(ship, new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), glow("#fb923c", 2.4), -0.14, 0, -0.6).rotation.x = Math.PI / 2;
  addMesh(ship, new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), glow("#fb923c", 2.4), 0.14, 0, -0.6).rotation.x = Math.PI / 2;
  // screen panel floating beside the ship
  const panel = new THREE.Group();
  panel.position.set(0, 0.7, -0.15);
  addMesh(panel, new THREE.PlaneGeometry(0.6, 0.38), screen(tex), 0, 0, 0);
  panel.userData.orbit = { r: 0.95, speed: 0.4, y: 0.7, phase: 0 };
  hero.add(panel);
  // asteroid below
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), std(0x4a4258, 0.95, 0.1));
  rock.castShadow = true;
  rock.position.set(0.4, 0.3, 0.3);
  rock.userData.orbit = { r: 0.9, speed: -0.35, y: 0.32, phase: 2 };
  hero.add(rock);
  return { hero, glowMats: g, spinners: [rock, panel] };
}

// ---------------------------------------------------------------------------
// Grid texture for the floor
// ---------------------------------------------------------------------------
function makeGridTexture(): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#0a1128";
  g.fillRect(0, 0, 256, 256);
  g.strokeStyle = "rgba(34,211,238,0.28)";
  g.lineWidth = 2;
  g.strokeRect(1, 1, 254, 254);
  g.fillStyle = "rgba(34,211,238,0.5)";
  g.fillRect(126, 126, 4, 4);
  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(15, 15);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// ===========================================================================
// Gallery engine
// ===========================================================================
export class Gallery {
  private canvas: HTMLCanvasElement;
  private cb: GalleryCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private sfx = new Sfx();
  private exhibits: Exhibit[] = [];
  private labels: LabelSprite[] = [];
  private particles = new ParticlePool();
  private tween: Tween | null = null;
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2();
  private downPos = { x: 0, y: 0, t: 0 };
  private keys = new Set<string>();
  private vel = new THREE.Vector3();
  private selected = -1;
  private hoverIdx = -1;
  private lastInteract = performance.now();
  private clock = new THREE.Clock();
  private raf = 0;
  private running = false;
  private textures: THREE.Texture[] = [];
  private time = 0;
  private firstResize = true;
  private overview = OVERVIEW.clone();
  private hubSpinners: THREE.Object3D[] = [];
  private envTex: THREE.Texture | null = null;

  constructor(canvas: HTMLCanvasElement, cb: GalleryCallbacks) {
    this.canvas = canvas;
    this.cb = cb;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: "high-performance",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.15;

    this.scene.fog = new THREE.Fog(0x0b1230, 22, 62);

    this.camera = new THREE.PerspectiveCamera(55, 1, 0.1, 220);
    this.camera.position.copy(OVERVIEW);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.target.copy(OVERVIEW_TARGET);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.enablePan = false;
    this.controls.minDistance = 2.2;
    this.controls.maxDistance = 20;
    this.controls.minPolarAngle = 0.15;
    this.controls.maxPolarAngle = 1.52;
    this.controls.autoRotateSpeed = 0.55;
    this.controls.addEventListener("start", () => this.interact());
    this.controls.addEventListener("start", () => {
      this.canvas.style.cursor = "grabbing";
    });
    this.controls.addEventListener("end", () => {
      this.canvas.style.cursor = this.hoverIdx >= 0 ? "pointer" : "grab";
    });

    this.buildEnvironment();
    this.buildLights();
    this.buildSky();
    this.buildFloor();
    this.buildHub();
    this.buildExhibits();
    this.scene.add(this.particles.points);

    this.bindEvents();
  }

  // ---- setup ---------------------------------------------------------------

  private buildEnvironment() {
    // dark neon env for PBR reflections (rendered once into a PMREM)
    const env = new THREE.Scene();
    env.background = new THREE.Color(0x0a1128);
    env.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(20, 16, 8),
        new THREE.MeshBasicMaterial({ color: 0x0a1128, side: THREE.BackSide })
      )
    );
    const addPanel = (color: number, x: number, y: number, z: number, w: number, h: number) => {
      const m = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color })
      );
      m.position.set(x, y, z);
      m.lookAt(0, 0, 0);
      env.add(m);
    };
    addPanel(0x22d3ee, -8, 3, -6, 6, 4);
    addPanel(0xf0f, 8, 3, 6, 6, 4);
    addPanel(0x12224a, 0, 10, 0, 12, 6);
    addPanel(0x1a1030, 4, -2, -8, 6, 3);
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envTex = pmrem.fromScene(env, 0.12).texture;
    this.scene.environment = this.envTex;
    pmrem.dispose();
  }

  private buildLights() {
    this.scene.add(new THREE.AmbientLight(0x8fa3d0, 0.55));
    const dir = new THREE.DirectionalLight(0xcfe4ff, 1.5);
    dir.position.set(9, 16, 7);
    dir.castShadow = true;
    dir.shadow.mapSize.set(1024, 1024);
    dir.shadow.camera.left = -24;
    dir.shadow.camera.right = 24;
    dir.shadow.camera.top = 24;
    dir.shadow.camera.bottom = -24;
    dir.shadow.camera.far = 60;
    dir.shadow.bias = -0.0006;
    this.scene.add(dir);
    const cyan = new THREE.PointLight(0x22d3ee, 90, 55, 2);
    cyan.position.set(-10, 4.5, -10);
    this.scene.add(cyan);
    const mag = new THREE.PointLight(0xf0f, 90, 55, 2);
    mag.position.set(10, 4.5, 10);
    this.scene.add(mag);
  }

  private buildSky() {
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(90, 32, 18),
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: {
          top: { value: new THREE.Color("#0a1030") },
          mid: { value: new THREE.Color("#101a3e") },
          bottom: { value: new THREE.Color("#05080f") },
        },
        vertexShader: `varying vec3 vP;
          void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
        fragmentShader: `varying vec3 vP;
          uniform vec3 top; uniform vec3 mid; uniform vec3 bottom;
          void main(){
            float h = normalize(vP).y;
            vec3 col = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bottom, pow(-h, 0.45));
            gl_FragColor = vec4(col, 1.0);
          }`,
      })
    );
    this.scene.add(sky);
    // stars
    const n = 420;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const b = Math.acos(Math.random() * 0.95); // upper hemisphere bias
      const r = 82;
      pos[i * 3] = Math.sin(b) * Math.cos(a) * r;
      pos[i * 3 + 1] = Math.cos(b) * r * 0.9;
      pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(
      geo,
      new THREE.PointsMaterial({
        color: 0xcfe0ff,
        size: 0.22,
        sizeAttenuation: true,
        transparent: true,
        opacity: 0.85,
        fog: false,
      })
    );
    this.scene.add(stars);
  }

  private buildFloor() {
    const floor = new THREE.Mesh(
      new THREE.CircleGeometry(34, 72),
      new THREE.MeshStandardMaterial({
        map: makeGridTexture(),
        color: 0x93a7d8,
        roughness: 0.4,
        metalness: 0.3,
      })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    // outer rim glow
    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(34, 0.09, 10, 120),
      glow("#22d3ee", 1.6)
    );
    rim.rotation.x = Math.PI / 2;
    rim.position.y = 0.02;
    this.scene.add(rim);
  }

  private buildHub() {
    const hub = new THREE.Group();
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.05, 1),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, wireframe: true, transparent: true, opacity: 0.75 })
    );
    wire.position.y = 2.7;
    wire.userData.spinY = 0.35;
    hub.add(wire);
    this.hubSpinners.push(wire);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.7, 0.03, 8, 80),
      glow("#f0f", 1.4)
    );
    ring.position.y = 2.7;
    ring.rotation.x = Math.PI / 2.4;
    ring.userData.spinZ = 0.5;
    hub.add(ring);
    this.hubSpinners.push(ring);
    // orbiting spheres
    for (let i = 0; i < 4; i++) {
      const s = new THREE.Mesh(
        new THREE.SphereGeometry(0.09, 10, 8),
        glow(i % 2 ? "#f0f" : "#22d3ee", 2)
      );
      s.userData.orbit = { r: 1.9, speed: 0.7, y: 2.7, phase: i * 1.57 };
      hub.add(s);
      this.hubSpinners.push(s);
    }
    const { sprite, label } = makeLabel("DEVQUEST", "#22d3ee", true);
    sprite.position.y = 4.7;
    hub.add(sprite);
    this.labels.push(label);
    const sub = makeLabel("CLICK A PROJECT", "#f0f", false);
    sub.sprite.position.y = 4.0;
    sub.sprite.scale.set(2.6, 0.65, 1);
    hub.add(sub.sprite);
    this.labels.push(sub.label);
    this.scene.add(hub);
  }

  private buildExhibits() {
    const texLoader = new THREE.TextureLoader();
    const n = PROJECTS.length;
    for (let i = 0; i < n; i++) {
      const p = PROJECTS[i];
      const theta = (i / n) * Math.PI * 2 + Math.PI / 6;
      const pos = new THREE.Vector3(
        Math.cos(theta) * BOOTH_RADIUS,
        0,
        Math.sin(theta) * BOOTH_RADIUS
      );
      const group = new THREE.Group();
      group.position.copy(pos);
      // booth faces outward
      group.rotation.y = Math.PI / 2 - theta;
      group.userData.exhibitIndex = i;
      // pedestal
      const ped = new THREE.Mesh(
        new THREE.CylinderGeometry(1.05, 1.15, 0.32, 24),
        std(0x0e1830, 0.4, 0.75)
      );
      ped.position.y = 0.16;
      ped.castShadow = true;
      ped.receiveShadow = true;
      group.add(ped);
      // glow ring
      const ringMat = glow(p.accent, 1.3);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.035, 10, 72), ringMat);
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 0.34;
      group.add(ring);
      // hero
      const tex = texLoader.load(p.image);
      tex.colorSpace = THREE.SRGBColorSpace;
      this.textures.push(tex);
      const built = this.buildHero(p, tex);
      const hero = built.hero;
      hero.position.y = 0.32;
      hero.traverse((o) => (o.userData.exhibitIndex = i));
      group.add(hero);
      // label
      const { sprite, label } = makeLabel(p.title, p.accent, false);
      sprite.position.y = 3.35;
      this.labels.push(label);
      group.add(sprite);

      this.scene.add(group);
      this.exhibits.push({
        group,
        hero,
        ringMat,
        glowMats: built.glowMats,
        spinners: built.spinners,
        label: sprite,
        data: p,
        baseY: 0.32,
        facing: Math.PI / 2 - theta,
        phase: Math.random() * 10,
        pop: 0,
        spin: 0,
      });
    }
  }

  private buildHero(p: Project, tex: THREE.Texture): BuiltHero {
    switch (p.kind) {
      case "cabinet":
        return buildCabinet(p.accent, tex);
      case "tower":
        return buildTower(p.accent, tex);
      case "dungeon":
        return buildDungeon(p.accent, tex);
      case "rocket":
        return buildRocket(p.accent, tex);
      case "robot":
        return buildRobot(p.accent, tex);
      case "ship":
        return buildShip(p.accent, tex);
    }
  }

  // ---- events ----------------------------------------------------------------

  private interact() {
    this.lastInteract = performance.now();
  }

  private bindEvents() {
    this.canvas.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      this.interact();
      this.downPos = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    this.canvas.addEventListener("pointerup", (e) => {
      e.preventDefault();
      const dx = e.clientX - this.downPos.x;
      const dy = e.clientY - this.downPos.y;
      const quick = performance.now() - this.downPos.t < 600;
      if (Math.hypot(dx, dy) < 8 && quick) this.handleClick(e);
    });
    this.canvas.addEventListener("pointermove", (e) => {
      this.updateHover(e);
    });
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", (e) => {
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.code)) {
        e.preventDefault();
        this.keys.add(e.code);
        this.interact();
      }
    });
    window.addEventListener("keyup", (e) => this.keys.delete(e.code));
    window.addEventListener("blur", () => this.keys.clear());

    // re-render labels once the arcade font arrives
    if (document.fonts) {
      document.fonts
        .load('42px "Press Start 2P"')
        .then(() => this.labels.forEach(drawLabel))
        .catch(() => {});
    }
  }

  private setNDC(e: PointerEvent | MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private pickExhibit(e: PointerEvent | MouseEvent): number {
    this.setNDC(e);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const groups = this.exhibits.map((x) => x.group);
    const hits = this.raycaster.intersectObjects(groups, true);
    for (const hit of hits) {
      let o: THREE.Object3D | null = hit.object;
      while (o) {
        if (o.userData.exhibitIndex !== undefined) return o.userData.exhibitIndex as number;
        o = o.parent;
      }
    }
    return -1;
  }

  private updateHover(e: PointerEvent) {
    const idx = this.pickExhibit(e);
    if (idx !== this.hoverIdx) {
      this.hoverIdx = idx;
      this.canvas.style.cursor = idx >= 0 ? "pointer" : "grab";
    }
  }

  private handleClick(e: PointerEvent) {
    const idx = this.pickExhibit(e);
    if (idx >= 0) this.focus(idx);
  }

  // ---- public API ------------------------------------------------------------

  start() {
    if (this.running) return;
    this.running = true;
    this.clock.start();
    const loop = () => {
      if (!this.running) return;
      const dt = Math.min(0.05, this.clock.getDelta());
      this.tick(dt);
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.controls.dispose();
    this.renderer.dispose();
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
      else if (mat) mat.dispose();
    });
    this.textures.forEach((t) => t.dispose());
    if (this.envTex) this.envTex.dispose();
  }

  resize(w: number, h: number) {
    if (w === 0 || h === 0) return;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // portrait screens need a wider overview framing
    if (this.camera.aspect < 1) this.overview.set(0, 4.4, 17);
    else this.overview.set(0, 3.6, 12.8);
    if (this.firstResize) {
      this.firstResize = false;
      this.camera.position.copy(this.overview);
      this.controls.target.copy(OVERVIEW_TARGET);
    }
    this.camera.updateProjectionMatrix();
  }

  setMuted(m: boolean) {
    this.sfx.setMuted(m);
  }

  unlock() {
    this.sfx.ensure();
    this.sfx.goal();
  }

  focus(index: number) {
    if (index < 0 || index >= this.exhibits.length) return;
    const ex = this.exhibits[index];
    this.sfx.ensure();
    this.sfx.coin();
    this.selected = index;
    ex.pop = 1;
    const p = ex.group.position;
    const out = new THREE.Vector3(p.x, 0, p.z).normalize();
    const camPos = new THREE.Vector3(p.x + out.x * 2.8, 2.15, p.z + out.z * 2.8);
    const look = new THREE.Vector3(p.x, 1.45, p.z);
    this.startTween(camPos, look, 1.1);
    // celebration burst
    this.particles.spawn(p.x, 1.6, p.z, ex.data.accent, 46, 4.5);
    this.particles.spawn(p.x, 1.6, p.z, "#ffffff", 14, 2.5);
    this.cb.onSelect(index);
  }

  close() {
    if (this.selected < 0) return;
    this.sfx.click();
    this.selected = -1;
    this.startTween(this.overview.clone(), OVERVIEW_TARGET.clone(), 1.0);
    this.cb.onSelect(null);
  }

  private startTween(toP: THREE.Vector3, toT: THREE.Vector3, dur: number) {
    this.tween = {
      t: 0,
      dur,
      fromP: this.camera.position.clone(),
      toP,
      fromT: this.controls.target.clone(),
      toT,
    };
    this.controls.enabled = false;
  }

  // ---- per-frame --------------------------------------------------------------

  private tick(dt: number) {
    this.time += dt;

    // camera tween
    if (this.tween) {
      const tw = this.tween;
      tw.t += dt;
      const k = easeInOut(clamp(tw.t / tw.dur, 0, 1));
      this.camera.position.lerpVectors(tw.fromP, tw.toP, k);
      this.controls.target.lerpVectors(tw.fromT, tw.toT, k);
      this.camera.lookAt(this.controls.target);
      if (tw.t >= tw.dur) {
        this.tween = null;
        this.controls.enabled = true;
        this.controls.update();
      }
    } else {
      this.handleMovement(dt);
      const idle = performance.now() - this.lastInteract > 6000;
      this.controls.autoRotate = idle && this.selected < 0;
      this.controls.update();
    }

    // exhibits
    for (let i = 0; i < this.exhibits.length; i++) {
      const ex = this.exhibits[i];
      const isSel = i === this.selected;
      const isHover = i === this.hoverIdx;
      // idle bob
      ex.hero.position.y = ex.baseY + Math.sin(this.time * 1.8 + ex.phase) * 0.05;
      // pop + spin
      if (ex.pop > 0) ex.pop = Math.max(0, ex.pop - dt * 1.6);
      const popScale = ex.pop > 0 ? 1 + 0.16 * easeOutBack(1 - ex.pop) : 1;
      if (isSel) {
        ex.spin = Math.min(1, ex.spin + dt * 3);
      } else {
        ex.spin = Math.max(0, ex.spin - dt * 3);
      }
      // gentle sway while selected, always returns to facing the visitor
      ex.hero.rotation.y =
        ex.facing + Math.sin(this.time * 1.1) * 0.38 * ex.spin;
      // selected booth literally grows a little
      const selScale = isSel ? 1.12 : 1;
      ex.hero.scale.setScalar(popScale * selScale);
      // glow intensity
      const target = isSel ? 1.9 : isHover ? 1.4 : 0.55;
      for (const m of ex.glowMats) {
        m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 8);
      }
      ex.ringMat.emissiveIntensity +=
        ((isSel ? 2.6 : isHover ? 1.9 : 1.1) - ex.ringMat.emissiveIntensity) *
        Math.min(1, dt * 8);
      // spinners / orbiters
      for (const s of ex.spinners) {
        if (s.userData.orbit) {
          const o = s.userData.orbit as { r: number; speed: number; y: number; phase: number };
          const a = this.time * o.speed + o.phase;
          s.position.set(Math.cos(a) * o.r, o.y + Math.sin(this.time * 1.4 + o.phase) * 0.08, Math.sin(a) * o.r);
        } else if (s.userData.spinY) {
          s.rotation.y += (s.userData.spinY as number) * dt;
        } else if (s.userData.flame) {
          const f = 1 + Math.sin(this.time * 14 + ex.phase) * 0.18;
          s.scale.set(f, f, 1);
        }
      }
      // label faces the camera (sprites always do) — gentle bob
      ex.label.position.y = 3.35 + Math.sin(this.time * 1.4 + ex.phase) * 0.06;
    }

    // hub spin / orbit
    for (const s of this.hubSpinners) {
      if (s.userData.orbit) {
        const o = s.userData.orbit as { r: number; speed: number; y: number; phase: number };
        const a = this.time * o.speed + o.phase;
        s.position.set(Math.cos(a) * o.r, o.y, Math.sin(a) * o.r);
      } else {
        if (s.userData.spinY) s.rotation.y += (s.userData.spinY as number) * dt;
        if (s.userData.spinZ) s.rotation.z += (s.userData.spinZ as number) * dt;
      }
    }

    this.particles.update(dt);
    this.renderer.render(this.scene, this.camera);
  }

  private handleMovement(dt: number) {
    if (this.keys.size === 0) {
      this.vel.multiplyScalar(Math.max(0, 1 - dt * 8));
      return;
    }
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    fwd.y = 0;
    fwd.normalize();
    const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0));
    const desired = new THREE.Vector3();
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) desired.add(fwd);
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) desired.sub(fwd);
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) desired.add(right);
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) desired.sub(right);
    if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(7.5);
    this.vel.lerp(desired, Math.min(1, dt * 9));
    const delta = this.vel.clone().multiplyScalar(dt);
    this.camera.position.add(delta);
    this.controls.target.add(delta);
    // bounds
    const flat = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z);
    const dist = flat.length();
    if (dist > 25) {
      flat.multiplyScalar(25 / dist);
      this.camera.position.x = flat.x;
      this.camera.position.z = flat.z;
    }
    this.camera.position.y = clamp(this.camera.position.y, 1.2, 11);
    // keep the target glued to the ground plane so orbiting stays sane
    this.controls.target.y = clamp(this.controls.target.y, 0.4, 5);
  }
}
