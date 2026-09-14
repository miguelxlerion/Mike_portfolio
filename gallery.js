// ===========================================================================
// DEVQUEST 2.5D Interactive Gallery Engine
// A neon exhibition hall with 6 project booths arranged in a circle.
// Walk around, orbit the booths, click one to fly in and see details.
// ===========================================================================

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

// ---- constants ------------------------------------------------------------
const BOOTH_RADIUS = 7;
const OVERVIEW = new THREE.Vector3(0, 3.6, 12.8);
const OVERVIEW_TARGET = new THREE.Vector3(0, 1.5, 0);

// ---- ease functions -------------------------------------------------------
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const easeInOut = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutBack = (t) => 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2);

// ---- Particle pool (click bursts) ----------------------------------------
class ParticlePool {
  constructor() {
    this.max = 500;
    this.pos = new Float32Array(this.max * 3);
    this.col = new Float32Array(this.max * 3);
    this.base = new Float32Array(this.max * 3);
    this.vel = new Float32Array(this.max * 3);
    this.life = new Float32Array(this.max);
    this.maxLife = new Float32Array(this.max);
    this.count = 0;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(this.pos, 3).setUsage(THREE.DynamicDrawUsage));
    geo.setAttribute("color", new THREE.BufferAttribute(this.col, 3).setUsage(THREE.DynamicDrawUsage));
    const mat = new THREE.PointsMaterial({ size: 0.13, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true, fog: false });
    this.points = new THREE.Points(geo, mat);
    this.points.frustumCulled = false;
    this.geo = geo;
  }
  spawn(x, y, z, hex, n, speed = 4) {
    const c = new THREE.Color(hex);
    for (let i = 0; i < n; i++) {
      if (this.count >= this.max) return;
      const idx = this.count++;
      this.pos[idx * 3] = x; this.pos[idx * 3 + 1] = y; this.pos[idx * 3 + 2] = z;
      const a = Math.random() * Math.PI * 2, b = Math.random() * Math.PI - Math.PI / 2;
      const sp = speed * (0.4 + Math.random() * 0.9);
      this.vel[idx * 3] = Math.cos(a) * Math.cos(b) * sp;
      this.vel[idx * 3 + 1] = Math.sin(b) * sp + 1.6;
      this.vel[idx * 3 + 2] = Math.sin(a) * Math.cos(b) * sp;
      this.base[idx * 3] = c.r; this.base[idx * 3 + 1] = c.g; this.base[idx * 3 + 2] = c.b;
      this.life[idx] = this.maxLife[idx] = 0.7 + Math.random() * 0.8;
    }
    this.geo.setDrawRange(0, this.count);
  }
  update(dt) {
    for (let i = this.count - 1; i >= 0; i--) {
      this.life[i] -= dt;
      if (this.life[i] <= 0) {
        const last = --this.count;
        if (i !== last) {
          for (let k = 0; k < 3; k++) { this.pos[i * 3 + k] = this.pos[last * 3 + k]; this.vel[i * 3 + k] = this.vel[last * 3 + k]; this.base[i * 3 + k] = this.base[last * 3 + k]; }
          this.life[i] = this.life[last]; this.maxLife[i] = this.maxLife[last];
        }
        continue;
      }
      this.vel[i * 3 + 1] -= 5.5 * dt;
      this.pos[i * 3] += this.vel[i * 3] * dt;
      this.pos[i * 3 + 1] += this.vel[i * 3 + 1] * dt;
      this.pos[i * 3 + 2] += this.vel[i * 3 + 2] * dt;
      const f = this.life[i] / this.maxLife[i];
      this.col[i * 3] = this.base[i * 3] * f; this.col[i * 3 + 1] = this.base[i * 3 + 1] * f; this.col[i * 3 + 2] = this.base[i * 3 + 2] * f;
    }
    this.geo.setDrawRange(0, this.count);
    this.geo.attributes.position.needsUpdate = true;
    this.geo.attributes.color.needsUpdate = true;
  }
}

// ---- Label sprite (canvas-drawn) -----------------------------------------
function makeLabel(text, accent, big) {
  const c = document.createElement("canvas");
  c.width = big ? 1024 : 512; c.height = big ? 256 : 128;
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(big ? 5.6 : 3.3, big ? 1.4 : 0.82, 1);
  return { sprite, text, accent, big, canvas: c, ctx: c.getContext("2d") };
}
function drawLabel(label) {
  const { ctx, text, accent, big } = label;
  const g = ctx;
  g.clearRect(0, 0, label.canvas.width, label.canvas.height);
  g.font = `${big ? 84 : 42}px "Press Start 2P", monospace`;
  g.textAlign = "center"; g.textBaseline = "middle";
  g.shadowColor = accent; g.shadowBlur = big ? 40 : 24;
  g.fillStyle = "#ffffff";
  g.fillText(text, label.canvas.width / 2, label.canvas.height / 2 + 4);
  label.sprite.material.map.needsUpdate = true;
}

// ---- Hero builders --------------------------------------------------------
function std(color = 0x1b2740, rough = 0.55, metal = 0.35) {
  return new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal });
}
function glow(accent, intensity = 1.5) {
  return new THREE.MeshStandardMaterial({ color: 0x0a0f1e, emissive: new THREE.Color(accent), emissiveIntensity: intensity, roughness: 0.4, metalness: 0.3 });
}
function screen(tex) { return new THREE.MeshBasicMaterial({ map: tex }); }
function addMesh(parent, geo, mat, x, y, z) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m;
}

function buildCabinet(accent, tex) {
  const hero = new THREE.Group(); const g = [];
  const body = std(0x101a30);
  addMesh(hero, new THREE.BoxGeometry(1.25, 1.85, 0.75), body, 0, 0.95, 0);
  addMesh(hero, new THREE.PlaneGeometry(1.0, 0.62), screen(tex), 0, 1.32, 0.381);
  addMesh(hero, new THREE.BoxGeometry(1.0, 0.22, 0.1), std(0x0a1226), 0, 0.68, 0.36);
  const strip = glow(accent, 2); g.push(strip);
  addMesh(hero, new THREE.BoxGeometry(0.07, 1.7, 0.06), strip, -0.56, 0.95, 0.36);
  addMesh(hero, new THREE.BoxGeometry(0.07, 1.7, 0.06), strip, 0.56, 0.95, 0.36);
  addMesh(hero, new THREE.CylinderGeometry(0.02, 0.02, 0.14), std(0xd1d5db), -0.3, 0.82, 0.36);
  addMesh(hero, new THREE.SphereGeometry(0.05, 10, 8), glow("#ff3355", 1.6), -0.3, 0.91, 0.36);
  const mq = glow(accent, 1.1); g.push(mq);
  addMesh(hero, new THREE.BoxGeometry(1.25, 0.22, 0.78), mq, 0, 1.98, 0);
  addMesh(hero, new THREE.BoxGeometry(0.12, 0.12, 0.6), body, -0.5, 0.06, 0);
  addMesh(hero, new THREE.BoxGeometry(0.12, 0.12, 0.6), body, 0.5, 0.06, 0);
  return { hero, glowMats: g, spinners: [] };
}

function buildTower(accent, tex) {
  const hero = new THREE.Group(); const g = []; const spinners = [];
  addMesh(hero, new THREE.CylinderGeometry(0.95, 0.12, 0.9, 9), std(0x3b2f23, 0.9, 0.1), 0, 0.55, 0);
  addMesh(hero, new THREE.CircleGeometry(0.95, 24), std(0x2f6b3a, 0.95, 0), 0, 1.01, 0).rotation.x = -Math.PI / 2;
  addMesh(hero, new THREE.PlaneGeometry(0.55, 0.34), screen(tex), 0, 0.42, 0.476);
  const accentMat = glow(accent, 1.8); g.push(accentMat);
  addMesh(hero, new THREE.CylinderGeometry(0.26, 0.34, 0.24, 12), std(0x2a3550), 0, 1.16, 0);
  addMesh(hero, new THREE.BoxGeometry(0.42, 0.3, 0.42), std(0x2a3550), 0, 1.4, 0);
  const head = addMesh(hero, new THREE.BoxGeometry(0.2, 0.16, 0.6), accentMat, 0, 1.44, 0.32); head.rotation.x = -0.5;
  for (let i = 0; i < 2; i++) {
    const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.16 + i * 0.05, 0), std(0x3b2f23, 0.9, 0.1));
    rock.castShadow = true; rock.position.set(i === 0 ? -1.1 : 1.1, 1.5 + i * 0.25, i === 0 ? -0.4 : 0.5);
    rock.userData.orbit = { r: 1.0 + i * 0.35, speed: 0.5 + i * 0.2, y: 1.5 + i * 0.25, phase: i * 2 };
    hero.add(rock); spinners.push(rock);
  }
  return { hero, glowMats: g, spinners };
}

function buildDungeon(accent, tex) {
  const hero = new THREE.Group(); const g = [];
  const stone = std(0x3a3f52, 0.95, 0.05); const stoneDark = std(0x2a2e3e, 0.95, 0.05);
  addMesh(hero, new THREE.BoxGeometry(1.5, 0.12, 1.5), stoneDark, 0, 0.06, 0);
  addMesh(hero, new THREE.BoxGeometry(1.5, 1.05, 0.14), stone, 0, 0.6, -0.68);
  addMesh(hero, new THREE.BoxGeometry(0.14, 0.8, 1.5), stone, -0.68, 0.46, 0);
  for (let i = 0; i < 3; i++) addMesh(hero, new THREE.BoxGeometry(0.34, 0.18, 0.04), stoneDark, -0.4 + i * 0.4, 0.35 + (i % 2) * 0.28, -0.59);
  addMesh(hero, new THREE.PlaneGeometry(0.62, 0.4), screen(tex), 0.3, 0.78, -0.599);
  addMesh(hero, new THREE.BoxGeometry(0.42, 0.26, 0.3), std(0x5a3a1e, 0.8, 0.1), 0.15, 0.26, 0.25);
  const trim = glow("#fbbf24", 1.3); g.push(trim);
  addMesh(hero, new THREE.BoxGeometry(0.44, 0.05, 0.32), trim, 0.15, 0.36, 0.25);
  const gem = addMesh(hero, new THREE.OctahedronGeometry(0.14), glow(accent, 2), -0.35, 0.28, 0.15); gem.userData.spinY = 1.6;
  addMesh(hero, new THREE.CylinderGeometry(0.025, 0.025, 0.5), std(0x4a3520), -0.55, 0.85, -0.5);
  const flame = addMesh(hero, new THREE.ConeGeometry(0.07, 0.2, 8), glow("#fb923c", 2.2), -0.55, 1.16, -0.5); flame.userData.flame = true;
  return { hero, glowMats: g, spinners: [gem, flame] };
}

function buildRocket(accent, tex) {
  const hero = new THREE.Group(); const g = []; const white = std(0xdde3ee, 0.35, 0.5);
  addMesh(hero, new THREE.CylinderGeometry(1.0, 1.1, 0.14, 24), std(0x2a3550), 0, 0.07, 0);
  addMesh(hero, new THREE.PlaneGeometry(0.6, 0.38), screen(tex), 0, 0.5, 0.55);
  addMesh(hero, new THREE.CylinderGeometry(0.17, 0.2, 0.95, 16), white, 0, 0.72, 0);
  const noseMat = glow(accent, 1.6); g.push(noseMat);
  addMesh(hero, new THREE.ConeGeometry(0.17, 0.36, 16), noseMat, 0, 1.38, 0);
  addMesh(hero, new THREE.SphereGeometry(0.09, 12, 10), glow("#22d3ee", 2), 0, 0.85, 0.16);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2; const fin = addMesh(hero, new THREE.BoxGeometry(0.06, 0.3, 0.24), glow(accent, 1.4), Math.sin(a) * 0.22, 0.34, Math.cos(a) * 0.22); fin.rotation.y = a; g.push(fin.material); }
  const flame = addMesh(hero, new THREE.ConeGeometry(0.12, 0.42, 10), glow("#fb923c", 2.4), 0, 0.12, 0); flame.rotation.x = Math.PI; flame.userData.flame = true;
  const dome = addMesh(hero, new THREE.IcosahedronGeometry(0.34, 1), new THREE.MeshStandardMaterial({ color: 0x0e1830, emissive: new THREE.Color("#4ade80"), emissiveIntensity: 0.5, roughness: 0.2, metalness: 0.2, transparent: true, opacity: 0.8 }), 0.62, 0.4, -0.2); dome.userData.spinY = 0.5;
  return { hero, glowMats: g, spinners: [flame, dome] };
}

function buildRobot(accent, tex) {
  const hero = new THREE.Group(); const g = []; const body = std(0x182340);
  addMesh(hero, new THREE.BoxGeometry(0.13, 0.32, 0.14), body, -0.13, 0.16, 0);
  addMesh(hero, new THREE.BoxGeometry(0.13, 0.32, 0.14), body, 0.13, 0.16, 0);
  addMesh(hero, new THREE.BoxGeometry(0.17, 0.06, 0.2), glow(accent, 1.6), -0.13, 0.03, 0.03);
  addMesh(hero, new THREE.BoxGeometry(0.17, 0.06, 0.2), glow(accent, 1.6), 0.13, 0.03, 0.03);
  addMesh(hero, new THREE.BoxGeometry(0.52, 0.52, 0.3), body, 0, 0.58, 0);
  const trim = glow(accent, 1.7); g.push(trim);
  addMesh(hero, new THREE.BoxGeometry(0.52, 0.06, 0.32), trim, 0, 0.82, 0);
  addMesh(hero, new THREE.SphereGeometry(0.05, 10, 8), glow("#f0f", 2.2), 0, 0.58, 0.16);
  addMesh(hero, new THREE.BoxGeometry(0.08, 0.4, 0.1), body, -0.33, 0.56, 0); addMesh(hero, new THREE.BoxGeometry(0.08, 0.4, 0.1), body, 0.33, 0.56, 0);
  addMesh(hero, new THREE.BoxGeometry(0.36, 0.28, 0.3), body, 0, 1.04, 0);
  const visor = glow("#67e8f9", 2); g.push(visor);
  addMesh(hero, new THREE.BoxGeometry(0.26, 0.1, 0.05), visor, 0.03, 1.04, 0.155);
  addMesh(hero, new THREE.CylinderGeometry(0.015, 0.015, 0.2), std(0xdde3ee), 0.12, 1.27, 0);
  addMesh(hero, new THREE.SphereGeometry(0.035, 8, 8), glow(accent, 2.4), 0.12, 1.39, 0);
  addMesh(hero, new THREE.PlaneGeometry(0.42, 0.3), screen(tex), 0, 0.58, -0.18);
  return { hero, glowMats: g, spinners: [] };
}

function buildShip(accent, tex) {
  const hero = new THREE.Group(); const g = []; const hull = std(0x2a3550, 0.4, 0.7);
  const ship = new THREE.Group(); ship.position.y = 0.95; hero.add(ship);
  const fus = addMesh(ship, new THREE.ConeGeometry(0.24, 1.25, 14), hull, 0, 0, 0); fus.rotation.x = Math.PI / 2;
  addMesh(ship, new THREE.SphereGeometry(0.13, 12, 10), glow("#67e8f9", 2), 0, 0.14, 0.22);
  const wl = addMesh(ship, new THREE.BoxGeometry(0.62, 0.05, 0.42), hull, -0.36, -0.02, -0.18); wl.rotation.z = 0.25;
  const wr = addMesh(ship, new THREE.BoxGeometry(0.62, 0.05, 0.42), hull, 0.36, -0.02, -0.18); wr.rotation.z = -0.25;
  const tipMat = glow(accent, 2.2); g.push(tipMat);
  addMesh(ship, new THREE.BoxGeometry(0.07, 0.08, 0.2), tipMat, -0.62, -0.08, -0.18);
  addMesh(ship, new THREE.BoxGeometry(0.07, 0.08, 0.2), tipMat, 0.62, -0.08, -0.18);
  addMesh(ship, new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), glow("#fb923c", 2.4), -0.14, 0, -0.6).rotation.x = Math.PI / 2;
  addMesh(ship, new THREE.CylinderGeometry(0.07, 0.07, 0.08, 10), glow("#fb923c", 2.4), 0.14, 0, -0.6).rotation.x = Math.PI / 2;
  const panel = new THREE.Group(); panel.position.set(0, 0.7, -0.15); addMesh(panel, new THREE.PlaneGeometry(0.6, 0.38), screen(tex), 0, 0, 0); panel.userData.orbit = { r: 0.95, speed: 0.4, y: 0.7, phase: 0 }; hero.add(panel);
  const rock = new THREE.Mesh(new THREE.IcosahedronGeometry(0.32, 0), std(0x4a4258, 0.95, 0.1)); rock.castShadow = true; rock.position.set(0.4, 0.3, 0.3); rock.userData.orbit = { r: 0.9, speed: -0.35, y: 0.32, phase: 2 }; hero.add(rock);
  return { hero, glowMats: g, spinners: [rock, panel] };
}

// ---- Gallery class --------------------------------------------------------
export class Gallery {
  constructor(canvas, callbacks = {}, config = {}) {
    this.canvas = canvas;
    this.onSelect = callbacks.onSelect || (() => {});
    this.onClose = callbacks.onClose || (() => {});
    this.config = config;

    const c = this.config;
    const rendererConfig = c.shadow || {};
    const cameraConfig = c.camera || {};
    const colorsConfig = c.colors || {};

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, rendererConfig.pixelRatio || 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE[rendererConfig.type] || THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE[rendererConfig.toneMapping] || THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = rendererConfig.exposure || 1.15;

    this.scene = new THREE.Scene();
    const fogColor = parseInt(colorsConfig.fogColor?.replace('#', '0x') || '0x0b1230');
    const fogNear = colorsConfig.fogNear || 22;
    const fogFar = colorsConfig.fogFar || 62;
    this.scene.fog = new THREE.Fog(fogColor, fogNear, fogFar);

    const fov = cameraConfig.fov || 55;
    const near = cameraConfig.near || 0.1;
    const far = cameraConfig.far || 220;
    this.camera = new THREE.PerspectiveCamera(fov, 1, near, far);

    const camPos = cameraConfig.position || {x:0, y:3.6, z:12.8};
    this.camera.position.set(camPos.x, camPos.y, camPos.z);

    this.controls = new OrbitControls(this.camera, canvas);
    const target = cameraConfig.target || {x:0, y:0, z:0};
    this.controls.target.set(target.x, target.y, target.z);
    this.controls.enableDamping = true; this.controls.dampingFactor = cameraConfig.damping || 0.08;
    this.controls.enablePan = cameraConfig.enablePan || false; 
    this.controls.minDistance = cameraConfig.minDist || 2.2;
    this.controls.maxDistance = cameraConfig.maxDist || 20; 
    this.controls.minPolarAngle = cameraConfig.minPolar || 0.15;
    this.controls.maxPolarAngle = cameraConfig.maxPolar || 1.52; 
    this.controls.autoRotateSpeed = cameraConfig.autoRotSpeed || 0.55;

    this.controls.addEventListener("start", () => this.canvas.style.cursor = "grabbing");
    this.controls.addEventListener("end", () => { this.canvas.style.cursor = "grab"; });

    this.sfx = { _muted: false, _ctx: null };
    this.exhibits = [];
    this.labels = [];
    this.particles = new ParticlePool();
    this.tween = null;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.downPos = { x: 0, y: 0, t: 0 };
    this.keys = new Set();
    this.vel = new THREE.Vector3();
    this.selected = -1;
    this.hoverIdx = -1;
    this.lastInteract = performance.now();
    this.clock = new THREE.Clock();
    this.raf = 0; this.running = false; this.time = 0;
    this.textures = []; this.firstResize = true;
    
    const overviewPos = cameraConfig.position || {x:0, y:3.6, z:12.8};
    this.overview = new THREE.Vector3(overviewPos.x, overviewPos.y, overviewPos.z);
    this.hubSpinners = []; this.envTex = null;
    this._onKeyDown = this._onKeyDown.bind(this);
    this._onKeyUp = this._onKeyUp.bind(this);
    this._onBlur = this._onBlur.bind(this);
    this._onResize = this._onResize.bind(this);

    this.buildEnvironment();
    this.buildLights();
    this.buildSky();
    this.buildFloor();
    this.buildHub();
    this.buildExhibits();
    this.scene.add(this.particles.points);
    this.bindEvents();
  }

  buildEnvironment() {
    const c = this.config.colors || {};
    const sceneBg = parseInt((c.sceneBg || '#0a1128').replace('#', '0x'));
    const env = new THREE.Scene(); env.background = new THREE.Color(sceneBg);
    env.add(new THREE.Mesh(new THREE.SphereGeometry(20, 16, 8), new THREE.MeshBasicMaterial({ color: sceneBg, side: THREE.BackSide })));
    const addPanel = (color, x, y, z, w, h) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color })); m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m); };
    const panelColor1 = parseInt((c.sceneBg || '#22d3ee').replace('#', '0x'));
    const panelColor2 = parseInt((c.hudAccent || '#f0f').replace('#', '0x'));
    const panelColor3 = parseInt((c.fogColor || '#12224a').replace('#', '0x'));
    const panelColor4 = parseInt((c.sceneBg || '#1a1030').replace('#', '0x'));
    addPanel(panelColor1, -8, 3, -6, 6, 4); addPanel(panelColor2, 8, 3, 6, 6, 4); addPanel(panelColor3, 0, 10, 0, 12, 6); addPanel(panelColor4, 4, -2, -8, 6, 3);
    const pmrem = new THREE.PMREMGenerator(this.renderer); this.envTex = pmrem.fromScene(env, 0.12).texture;
    this.scene.environment = this.envTex; pmrem.dispose();
  }

  buildLights() {
    const c = this.config.lighting || [];
    const ambient = c.find(l => l.type === 'Hemisphere');
    if (ambient) {
      const sky = parseInt((ambient.sky || '#cfe0ff').replace('#', '0x'));
      const ground = parseInt((ambient.ground || '#0a1128').replace('#', '0x'));
      const intensity = ambient.intensity || 0.4;
      this.scene.add(new THREE.HemisphereLight(sky, ground, intensity));
    } else {
      this.scene.add(new THREE.HemisphereLight(0xcfe0ff, 0x0a1128, 0.4));
    }

    const directional = c.find(l => l.type === 'Directional');
    if (directional && directional.enabled !== false) {
      const color = parseInt((directional.color || '#ffffff').replace('#', '0x'));
      const intensity = directional.intensity || 1.5;
      const dir = new THREE.DirectionalLight(color, intensity);
      const pos = directional.pos || {x:9, y:16, z:7};
      dir.position.set(pos.x, pos.y, pos.z);
      dir.castShadow = directional.castShadow || true;
      dir.shadow.mapSize.set(1024, 1024);
      dir.shadow.camera.left = -24; dir.shadow.camera.right = 24; 
      dir.shadow.camera.top = 24; dir.shadow.camera.bottom = -24; 
      dir.shadow.camera.far = 60; dir.shadow.bias = -0.0006;
      this.scene.add(dir);
    } else {
      const dir = new THREE.DirectionalLight(0xcfe4ff, 1.5); 
      dir.position.set(9, 16, 7); 
      dir.castShadow = true;
      dir.shadow.mapSize.set(1024, 1024); 
      dir.shadow.camera.left = -24; dir.shadow.camera.right = 24; 
      dir.shadow.camera.top = 24; dir.shadow.camera.bottom = -24; 
      dir.shadow.camera.far = 60; dir.shadow.bias = -0.0006;
      this.scene.add(dir);
    }

    const points = c.filter(l => l.type === 'Point' && l.enabled !== false);
    if (points.length > 0) {
      points.forEach(p => {
        const color = parseInt((p.color || '#22d3ee').replace('#', '0x'));
        const intensity = p.intensity || 1.5;
        const distance = p.distance || 55;
        const decay = p.decay || 2;
        const point = new THREE.PointLight(color, intensity, distance, decay);
        const pos = p.pos || {x:0, y:5, z:0};
        point.position.set(pos.x, pos.y, pos.z);
        this.scene.add(point);
      });
    } else {
      const cyan = new THREE.PointLight(0x22d3ee, 90, 55, 2); cyan.position.set(-10, 4.5, -10); this.scene.add(cyan);
      const mag = new THREE.PointLight(0xf0f, 90, 55, 2); mag.position.set(10, 4.5, 10); this.scene.add(mag);
    }
  }

  buildSky() {
    const c = this.config.colors || {};
    const top = new THREE.Color(c.sceneBg || '#0a1030');
    const mid = new THREE.Color(c.fogColor || '#101a3e');
    const bottom = new THREE.Color(c.sceneBg || '#05080f');
    const sky = new THREE.Mesh(new THREE.SphereGeometry(90, 32, 18), new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, fog: false, uniforms: { top: { value: top }, mid: { value: mid }, bottom: { value: bottom } }, vertexShader: `varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`, fragmentShader: `varying vec3 vP; uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; void main(){ float h = normalize(vP).y; vec3 col = h > 0.0 ? mix(mid, top, pow(h, 0.55)) : mix(mid, bottom, pow(-h, 0.45)); gl_FragColor = vec4(col, 1.0); }` }));
    this.scene.add(sky);
    const pc = this.config.particles || {};
    const n = pc.count || 420; const pos = new Float32Array(n * 3);
    const radius = pc.radius || 82;
    for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, b = Math.acos(Math.random() * 0.95), r = radius; pos[i * 3] = Math.sin(b) * Math.cos(a) * r; pos[i * 3 + 1] = Math.cos(b) * r * 0.9; pos[i * 3 + 2] = Math.sin(b) * Math.sin(a) * r; }
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const stars = new THREE.Points(geo, new THREE.PointsMaterial({ color: parseInt((pc.color || '#cfe0ff').replace('#', '0x')), size: pc.size || 0.22, sizeAttenuation: true, transparent: true, opacity: pc.opacity || 0.85, fog: false }));
    this.scene.add(stars);
  }

  buildFloor() {
    const c = this.config.floor || {};
    const gridC = document.createElement("canvas"); gridC.width = gridC.height = 256;
    const g = gridC.getContext("2d"); 
    const bgColor = c.color || '#0a1128';
    g.fillStyle = bgColor; g.fillRect(0, 0, 256, 256);
    const gridColor = c.gridColor || '#22d3ee';
    const gridOpacity = c.gridOpacity || 0.28;
    g.strokeStyle = `rgba(${parseInt(gridColor.slice(1,3),16)},${parseInt(gridColor.slice(3,5),16)},${parseInt(gridColor.slice(5,7),16)},${gridOpacity})`; 
    g.lineWidth = 2; g.strokeRect(1, 1, 254, 254); 
    const centerDot = c.centerDot || '#22d3ee';
    g.fillStyle = centerDot; g.fillRect(126, 126, 4, 4);
    const gridTex = new THREE.CanvasTexture(gridC); gridTex.wrapS = gridTex.wrapT = THREE.RepeatWrapping; gridTex.repeat.set(15, 15); gridTex.colorSpace = THREE.SRGBColorSpace;
    const floorColor = parseInt((c.color || '#93a7d8').replace('#', '0x'));
    const floor = new THREE.Mesh(new THREE.CircleGeometry(c.radius || 34, c.segments || 72), new THREE.MeshStandardMaterial({ map: gridTex, color: floorColor, roughness: c.roughness || 0.4, metalness: c.metalness || 0.3 }));
    floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; this.scene.add(floor);
    const rimColor = parseInt((c.rimColor || '#22d3ee').replace('#', '0x'));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(c.radius || 34, 0.09, 10, 120), glow(c.rimColor || "#22d3ee", c.rimIntensity || 1.6)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.02; this.scene.add(rim);
  }

  buildHub() {
    const c = this.config.hub || {};
    const hub = new THREE.Group();
    const hubAccent = this.config.colors?.hudAccent || '#22d3ee';
    const pink = this.config.colors?.cursorHover || '#f0f';
    const wire = new THREE.Mesh(new THREE.IcosahedronGeometry(1.05, 1), new THREE.MeshBasicMaterial({ color: parseInt(hubAccent.replace('#', '0x')), wireframe: true, transparent: true, opacity: 0.75 }));
    wire.position.y = c.radius || 2.7; wire.userData.spinY = 0.35; hub.add(wire); this.hubSpinners.push(wire);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.7, 0.03, 8, 80), glow(pink, 1.4)); ring.position.y = c.radius || 2.7; ring.rotation.x = Math.PI / 2.4; ring.userData.spinZ = 0.5; hub.add(ring); this.hubSpinners.push(ring);
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), glow(i % 2 ? pink : hubAccent, 2)); s.userData.orbit = { r: 1.9, speed: 0.7, y: c.radius || 2.7, phase: i * 1.57 }; hub.add(s); this.hubSpinners.push(s); }
    const label = makeLabel(this.config.start?.title || "DEVQUEST", hubAccent, true); const sprite = label.sprite; sprite.position.y = 4.7; hub.add(sprite); this.labels.push(label);
    const subLabel = makeLabel("CLICK A PROJECT", pink, false); const subSprite = subLabel.sprite; subSprite.position.y = 4.0; subSprite.scale.set(2.6, 0.65, 1); hub.add(subSprite); this.labels.push(subLabel);
    this.scene.add(hub);
  }

  buildExhibits() {
    const texLoader = new THREE.TextureLoader(); 
    const projectList = this.config.projects || [];
    const n = projectList.length || 6;
    for (let i = 0; i < n; i++) {
      const p = projectList[i] || {kind:'cabinet', accent:'#22d3ee', image:'images/p1.jpg'};
      const theta = (i / n) * Math.PI * 2 + Math.PI / 6;
      const pos = new THREE.Vector3(Math.cos(theta) * BOOTH_RADIUS, 0, Math.sin(theta) * BOOTH_RADIUS);
      const group = new THREE.Group(); group.position.copy(pos); group.rotation.y = Math.PI / 2 - theta; group.userData.exhibitIndex = i;
      const ped = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.15, 0.32, 24), std(0x0e1830, 0.4, 0.75)); ped.position.y = 0.16; ped.castShadow = true; ped.receiveShadow = true; group.add(ped);
      const ringMat = glow(p.accent, 1.3); const ring = new THREE.Mesh(new THREE.TorusGeometry(1.32, 0.035, 10, 72), ringMat); ring.rotation.x = Math.PI / 2; ring.position.y = 0.34; group.add(ring);
      const tex = texLoader.load(p.image); tex.colorSpace = THREE.SRGBColorSpace; this.textures.push(tex);
      const built = this.buildHero(p, tex); const hero = built.hero; hero.position.y = 0.32; hero.traverse(o => o.userData.exhibitIndex = i); group.add(hero);
      const label = makeLabel(p.title, p.accent, false); const sprite = label.sprite; sprite.position.y = 3.35; this.labels.push(label); group.add(sprite);
      this.scene.add(group);
      this.exhibits.push({ group, hero, ringMat, glowMats: built.glowMats, spinners: built.spinners, label, data: p, baseY: 0.32, facing: Math.PI / 2 - theta, phase: Math.random() * 10, pop: 0, spin: 0 });
    }
  }

  buildHero(p, tex) {
    switch (p.kind) { case "cabinet": return buildCabinet(p.accent, tex); case "tower": return buildTower(p.accent, tex); case "dungeon": return buildDungeon(p.accent, tex); case "rocket": return buildRocket(p.accent, tex); case "robot": return buildRobot(p.accent, tex); case "ship": return buildShip(p.accent, tex); default: return buildCabinet(p.accent, tex); }
  }

  bindEvents() {
    this.canvas.addEventListener("pointerdown", (e) => { e.preventDefault(); this.interact(); this.downPos = { x: e.clientX, y: e.clientY, t: performance.now() }; });
    this.canvas.addEventListener("pointerup", (e) => { e.preventDefault(); const dx = e.clientX - this.downPos.x, dy = e.clientY - this.downPos.y, quick = performance.now() - this.downPos.t < 600; if (Math.hypot(dx, dy) < 8 && quick) this.handleClick(e); });
    this.canvas.addEventListener("pointermove", (e) => this.updateHover(e));
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    window.addEventListener("keydown", this._onKeyDown);
    window.addEventListener("keyup", this._onKeyUp);
    window.addEventListener("blur", this._onBlur);
    if (document.fonts) document.fonts.load('42px "Press Start 2P"').then(() => this.labels.forEach(drawLabel)).catch(() => {});
    window.addEventListener("resize", this._onResize);
  }

  _onKeyDown(e) { if (["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].includes(e.code)) { e.preventDefault(); this.keys.add(e.code); this.interact(); } if (e.code === "KeyM") this.setMuted(!this.sfx._muted); }
  _onKeyUp(e) { this.keys.delete(e.code); }
  _onBlur() { this.keys.clear(); }
  _onResize() { this.resize(window.innerWidth, window.innerHeight); }

  interact() { this.lastInteract = performance.now(); }

  setNDC(e) { const rect = this.canvas.getBoundingClientRect(); this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1; this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1; }

  pickExhibit(e) { this.setNDC(e); this.raycaster.setFromCamera(this.pointer, this.camera); const groups = this.exhibits.map(x => x.group); const hits = this.raycaster.intersectObjects(groups, true); for (const hit of hits) { let o = hit.object; while (o) { if (o.userData.exhibitIndex !== undefined) return o.userData.exhibitIndex; o = o.parent; } } return -1; }

  updateHover(e) { const idx = this.pickExhibit(e); if (idx !== this.hoverIdx) { this.hoverIdx = idx; this.canvas.style.cursor = idx >= 0 ? "pointer" : "grab"; } }

  handleClick(e) { const idx = this.pickExhibit(e); if (idx >= 0) this.focus(idx); }

  setMuted(m) { this.sfx._muted = m; }

  unlock() {}

  focus(index) {
    if (index < 0 || index >= this.exhibits.length) return;
    const ex = this.exhibits[index];
    this.selected = index; ex.pop = 1;
    const p = ex.group.position; const out = new THREE.Vector3(p.x, 0, p.z).normalize();
    const camPos = new THREE.Vector3(p.x + out.x * 2.8, 2.15, p.z + out.z * 2.8); const look = new THREE.Vector3(p.x, 1.45, p.z);
    this.startTween(camPos, look, 1.1); this.particles.spawn(p.x, 1.6, p.z, ex.data.accent, 46, 4.5); this.particles.spawn(p.x, 1.6, p.z, "#ffffff", 14, 2.5); this.onSelect(index);
  }

  close() {
    if (this.selected < 0) return; this.selected = -1; this.startTween(this.overview.clone(), OVERVIEW_TARGET.clone(), 1.0); this.onClose();
  }

  startTween(toP, toT, dur) { this.tween = { t: 0, dur, fromP: this.camera.position.clone(), toP, fromT: this.controls.target.clone(), toT }; this.controls.enabled = false; }

  start() { if (this.running) return; this.running = true; this.clock.start(); const loop = () => { if (!this.running) return; const dt = Math.min(0.05, this.clock.getDelta()); this.tick(dt); this.raf = requestAnimationFrame(loop); }; this.raf = requestAnimationFrame(loop); }

  destroy() { this.running = false; cancelAnimationFrame(this.raf); this.controls.dispose(); this.renderer.dispose(); this.scene.traverse(o => { const m = o; if (m.geometry) m.geometry.dispose(); const mat = m.material; if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else if (mat) mat.dispose(); }); this.textures.forEach(t => t.dispose()); if (this.envTex) this.envTex.dispose(); }

  resize(w, h) { if (w === 0 || h === 0) return; this.renderer.setSize(w, h, false); this.camera.aspect = w / h; if (this.camera.aspect < 1) this.overview.set(0, 4.4, 17); else this.overview.set(0, 3.6, 12.8); if (this.firstResize) { this.firstResize = false; this.camera.position.copy(this.overview); this.controls.target.copy(OVERVIEW_TARGET); } this.camera.updateProjectionMatrix(); }

  tick(dt) {
    this.time += dt;
    if (this.tween) { const tw = this.tween; tw.t += dt; const k = easeInOut(clamp(tw.t / tw.dur, 0, 1)); this.camera.position.lerpVectors(tw.fromP, tw.toP, k); this.controls.target.lerpVectors(tw.fromT, tw.toT, k); this.camera.lookAt(this.controls.target); if (tw.t >= tw.dur) { this.tween = null; this.controls.enabled = true; this.controls.update(); } } else { this.handleMovement(dt); const idle = performance.now() - this.lastInteract > 6000; this.controls.autoRotate = idle && this.selected < 0; this.controls.update(); }
    for (let i = 0; i < this.exhibits.length; i++) { const ex = this.exhibits[i]; if (!ex?.hero) continue; const isSel = i === this.selected, isHover = i === this.hoverIdx; ex.hero.position.y = ex.baseY + Math.sin(this.time * 1.8 + ex.phase) * 0.05; if (ex.pop > 0) ex.pop = Math.max(0, ex.pop - dt * 1.6); const popScale = ex.pop > 0 ? 1 + 0.16 * easeOutBack(1 - ex.pop) : 1; if (isSel) ex.spin = Math.min(1, ex.spin + dt * 3); else ex.spin = Math.max(0, ex.spin - dt * 3); ex.hero.rotation.y = ex.facing + Math.sin(this.time * 1.1) * 0.38 * ex.spin; const selScale = isSel ? 1.12 : 1; ex.hero.scale.setScalar(popScale * selScale); const target = isSel ? 1.9 : isHover ? 1.4 : 1.1; for (const m of ex.glowMats || []) m.emissiveIntensity += (target - m.emissiveIntensity) * Math.min(1, dt * 8); if (ex.ringMat) ex.ringMat.emissiveIntensity += ((isSel ? 2.6 : isHover ? 1.9 : 1.1) - (ex.ringMat.emissiveIntensity || 1.1)) * Math.min(1, dt * 8); for (const s of ex.spinners || []) { if (s.userData?.orbit) { const o = s.userData.orbit; const a = this.time * o.speed + o.phase; s.position.set(Math.cos(a) * o.r, o.y + Math.sin(this.time * 1.4 + o.phase) * 0.08, Math.sin(a) * o.r); } else if (s.userData?.spinY) s.rotation.y += s.userData.spinY * dt; else if (s.userData?.flame) { const f = 1 + Math.sin(this.time * 14 + ex.phase) * 0.18; s.scale.set(f, f, 1); } } if (ex.label?.position) ex.label.position.y = 3.35 + Math.sin(this.time * 1.4 + ex.phase) * 0.06; }
    for (const s of this.hubSpinners || []) { if (s?.userData?.orbit) { const o = s.userData.orbit; const a = this.time * o.speed + o.phase; s.position.set(Math.cos(a) * o.r, o.y, Math.sin(a) * o.r); } else { if (s?.userData?.spinY) s.rotation.y += s.userData.spinY * dt; if (s?.userData?.spinZ) s.rotation.z += s.userData.spinZ * dt; } }
    this.particles?.update?.(dt); this.renderer.render(this.scene, this.camera);
  }

  handleMovement(dt) { if (this.keys.size === 0) { this.vel.multiplyScalar(Math.max(0, 1 - dt * 8)); return; } const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize(); const right = new THREE.Vector3().crossVectors(fwd, new THREE.Vector3(0, 1, 0)); const desired = new THREE.Vector3(); if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) desired.add(fwd); if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) desired.sub(fwd); if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) desired.add(right); if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) desired.sub(right); if (desired.lengthSq() > 0) desired.normalize().multiplyScalar(7.5); this.vel.lerp(desired, Math.min(1, dt * 9)); const delta = this.vel.clone().multiplyScalar(dt); this.camera.position.add(delta); this.controls.target.add(delta); const flat = new THREE.Vector3(this.camera.position.x, 0, this.camera.position.z); const dist = flat.length(); if (dist > 25) { flat.multiplyScalar(25 / dist); this.camera.position.x = flat.x; this.camera.position.z = flat.z; } this.camera.position.y = clamp(this.camera.position.y, 1.2, 11); this.controls.target.y = clamp(this.controls.target.y, 0.4, 5); }
}

// ---- Project data (matching the example) ---------------------------------
export const projects = [
  { id: "neon-racer", title: "NEON RACER", tagline: "Arcade antigravity racing", year: "2025", platform: "PC · Switch", engine: "Unity", role: "Lead Designer & Developer", description: "A synthwave arcade racer about pure speed. I designed the handling model, the 12-track campaign, and a dynamic music system that layers instruments as your boost meter fills. Built from a greybox prototype to a 60fps shipped build in 9 months.", tech: ["Unity", "C#", "HDRP", "Wwise", "Shader Graph"], stats: [{ label: "Plays", value: "120k+" }, { label: "Rating", value: "4.8/5" }, { label: "Tracks", value: "12" }, { label: "Dev time", value: "9 mo" }], features: ["Boost-chaining handling model with slipstream drafting", "Dynamic music layering synced to gameplay intensity", "Split-screen 2P and 8-player online time trials"], accent: "#22d3ee", image: "images/p1.jpg", kind: "cabinet" },
  { id: "skyfall-td", title: "SKYFALL TD", tagline: "Tower defense on floating islands", year: "2024", platform: "Mobile · PC", engine: "Godot", role: "Designer & Developer", description: "A lane-based tower defense set on crumbling sky islands. I built the tower upgrade web, the 40-wave balance sheet, and an editor that lets players design and share islands. Soft-launched in two regions with 40k installs in the first month.", tech: ["Godot", "GDScript", "Aseprite", "Firebase"], stats: [{ label: "Installs", value: "40k+" }, { label: "Waves", value: "40" }, { label: "Towers", value: "9" }, { label: "D1 retention", value: "42%" }], features: ["Player-built islands with online level sharing", "Tower fusion mechanic — merge two towers mid-wave", "Falling island hazards that reshape the battlefield"], accent: "#fb923c", image: "images/p2.jpg", kind: "tower" },
  { id: "pixel-dungeon", title: "PIXEL DUNGEON", tagline: "A roguelike with hand-placed soul", year: "2023", platform: "PC", engine: "Custom (TypeScript)", role: "Solo Developer", description: "A bite-sized roguelike dungeon crawler where every room is hand-designed but the dungeon is procedurally assembled. I wrote a custom ECS engine, a roguelike FOV system, and 120+ items with real combos. Featured in two indie showcases.", tech: ["TypeScript", "Canvas 2D", "ECS", "Web Audio"], stats: [{ label: "Players", value: "25k+" }, { label: "Items", value: "120+" }, { label: "Rooms", value: "300" }, { label: "Showcases", value: "2" }], features: ["Hand-crafted rooms, procedurally woven dungeons", "Item combo system with emergent builds", "Daily seeded runs with global leaderboards"], accent: "#fbbf24", image: "images/p3.jpg", kind: "dungeon" },
  { id: "starfarm-idle", title: "STARFARM IDLE", tagline: "The coziest farm off-world", year: "2024", platform: "Mobile · Web", engine: "React + Three.js", role: "Designer & Developer", description: "An idle farming game on a space station greenhouse. I tuned the 14-day prestige loop, wrote the crop mutation system, and built a layered idle economy that keeps paying out while you sleep. 8k daily active players at peak.", tech: ["React", "Three.js", "Zustand", "Web Workers"], stats: [{ label: "DAU peak", value: "8k" }, { label: "Crops", value: "48" }, { label: "Prestiges", value: "14 days" }, { label: "Avg. rating", value: "4.7/5" }], features: ["Offline progression with smart catch-up pacing", "Crop mutation breeding with rare hybrids", "Seasonal events that reskin the station"], accent: "#4ade80", image: "images/p4.jpg", kind: "rocket" },
  { id: "robo-rush", title: "ROBO RUSH", tagline: "A 2.5D platformer with punch", year: "2025", platform: "PC · Web", engine: "Custom (WebGL)", role: "Game Feel Engineer", description: "A tight, juicy 2.5D platformer about a little robot delivering ideas. I owned the game-feel layer: squash & stretch, particle budgets, screen shake, and an input-buffering system that makes every jump feel forgiving. 30fps-to-60fps feel pass on mobile was my favorite problem.", tech: ["WebGL", "TypeScript", "Web Audio", "Vite"], stats: [{ label: "Plays", value: "60k+" }, { label: "Levels", value: "24" }, { label: "Frame budget", value: "3.2 ms" }, { label: "Mobile", value: "60 fps" }], features: ["Coyote time + input buffering for butter jumps", "Pooled particle system, zero per-frame allocs", "Touch + keyboard controls with haptic feedback"], accent: "#f0f", image: "images/p5.jpg", kind: "robot" },
  { id: "cosmic-defender", title: "COSMIC DEFENDER", tagline: "A love letter to arcade shooters", year: "2023", platform: "Web · PC", engine: "Phaser 3", role: "Developer & Juice Designer", description: "A wave-based arcade shooter with a 4-weapon combo system. I built the enemy AI director, the 30-wave difficulty ramp, and a 200-particle explosion budget. Shipped in 6 weeks for a game jam and kept alive as a live arcade title.", tech: ["Phaser 3", "TypeScript", "Tiled", "Howler"], stats: [{ label: "Plays", value: "90k+" }, { label: "Waves", value: "30" }, { label: "Weapons", value: "4" }, { label: "Jam result", value: "1st" }], features: ["4-weapon combo system with synergies", "AI director that adapts to your skill", "Local co-op and global wave leaderboards"], accent: "#38bdf8", image: "images/p6.jpg", kind: "ship" }
];
