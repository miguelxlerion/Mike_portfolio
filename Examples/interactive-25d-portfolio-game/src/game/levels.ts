// Level data: each level is one section of the game-dev portfolio.

export interface Theme {
  name: string; // short name shown in HUD
  sub: string; // flavor text for the banner
  bg0: string; // sky top
  bg1: string; // sky bottom
  far: string; // far silhouettes
  mid: string; // mid silhouettes
  ground: string; // ground band
  edge: string; // ground top line / accent
  fog: string; // depth fog color
  accent: string; // primary accent (robot, coins glow)
  accent2: string; // secondary accent (bugs, hazards)
  coin: string; // coin color
}

const THEMES: Theme[] = [
  {
    name: "CONCEPT",
    sub: "IDEATION & DESIGN",
    bg0: "#0b1030",
    bg1: "#141b45",
    far: "#1c2560",
    mid: "#27317a",
    ground: "#101736",
    edge: "#22d3ee",
    fog: "#141b45",
    accent: "#22d3ee",
    accent2: "#f0f",
    coin: "#fbbf24",
  },
  {
    name: "PROTOTYPE",
    sub: "GREYBOX TO PLAYABLE",
    bg0: "#07180f",
    bg1: "#0c2a1a",
    far: "#12402a",
    mid: "#1a5a38",
    ground: "#0b2016",
    edge: "#4ade80",
    fog: "#0c2a1a",
    accent: "#4ade80",
    accent2: "#fb923c",
    coin: "#fbbf24",
  },
  {
    name: "PRODUCTION",
    sub: "FULL BUILD IN MOTION",
    bg0: "#1c0f04",
    bg1: "#331d08",
    far: "#4a2a0c",
    mid: "#663c10",
    ground: "#1e1206",
    edge: "#fb923c",
    fog: "#331d08",
    accent: "#fb923c",
    accent2: "#f87171",
    coin: "#fbbf24",
  },
  {
    name: "LAUNCH",
    sub: "SHIP IT TO THE WORLD",
    bg0: "#1c0716",
    bg1: "#330a28",
    far: "#4a0f38",
    mid: "#66144c",
    ground: "#200a1a",
    edge: "#f0f",
    fog: "#330a28",
    accent: "#f0f",
    accent2: "#22d3ee",
    coin: "#fbbf24",
  },
];

const PROJECTS = [
  "NEON RACER",
  "SKYFALL TD",
  "PIXEL DUNGEON",
  "STARFARM IDLE",
  "ROBO RUSH",
  "COSMIC DEFENDER",
  "DUNGEON CRAWLER",
  "TURBO DRIFT",
];

export interface Segment {
  x0: number;
  x1: number;
}

export interface Coin {
  x: number;
  y: number;
  taken: boolean;
}

export interface Obstacle {
  type: "bug" | "spike" | "wall" | "barrier" | "drone";
  x: number;
  y: number; // bottom of obstacle (ground = 0)
  w: number;
  h: number;
  vx?: number; // bug crawl speed (negative = toward player)
  vy?: number;
  hopT?: number; // bug hop timer
  phase: number;
}

export interface Billboard {
  x: number;
  text: string;
}

export interface LevelData {
  index: number;
  name: string;
  sub: string;
  theme: Theme;
  length: number;
  goalX: number;
  segments: Segment[];
  coins: Coin[];
  obstacles: Obstacle[];
  billboards: Billboard[];
  farShapes: { x: number; w: number; h: number; kind: number }[];
  midShapes: { x: number; w: number; h: number; kind: number }[];
}

const rand = (a: number, b?: number) =>
  b === undefined ? Math.random() * a : a + Math.random() * (b - a);
const pick = <T>(arr: T[]) => arr[(Math.random() * arr.length) | 0];

export function genLevel(index: number): LevelData {
  const theme = THEMES[index % THEMES.length];
  const length = 3300 + index * 750;
  const diff = index; // 0..3
  const segments: Segment[] = [];
  const coins: Coin[] = [];
  const obstacles: Obstacle[] = [];
  const billboards: Billboard[] = [];
  const farShapes: LevelData["farShapes"] = [];
  const midShapes: LevelData["midShapes"] = [];

  // parallax silhouettes
  for (let x = 0; x < length + 1600; x += rand(150, 340)) {
    farShapes.push({ x, w: rand(70, 170), h: rand(50, 140), kind: (Math.random() * 3) | 0 });
  }
  for (let x = 0; x < length + 1600; x += rand(220, 460)) {
    midShapes.push({ x, w: rand(90, 210), h: rand(36, 100), kind: (Math.random() * 2) | 0 });
  }
  // portfolio billboards floating in the mid layer
  for (let x = 850; x < length - 450; x += rand(820, 1150)) {
    billboards.push({ x: x | 0, text: pick(PROJECTS) });
  }

  // ground: current segment mutates as pits open gaps
  let cur: Segment = { x0: -300, x1: 620 };
  segments.push(cur);

  // starter coin trail — instant gratification in the first seconds
  for (let i = 0; i < 4; i++) coins.push({ x: 270 + i * 48, y: 74, taken: false });

  let x = 620;
  const firstGap = 300;

  while (x < length - 520) {
    const roll = Math.random();
    const gap = x + rand(firstGap - diff * 25, firstGap + 120 - diff * 25);

    if (roll < 0.2) {
      // ---- pit ----
      const pw = rand(80, 92 + diff * 13);
      // reward arc of coins over the pit
      const peak = rand(95, 135);
      const n = 5;
      for (let i = 0; i < n; i++) {
        const t = i / (n - 1);
        coins.push({
          x: x + 20 + t * (pw - 40),
          y: 20 + Math.sin(t * Math.PI) * peak,
          taken: false,
        });
      }
      cur.x1 = x;
      const start = x + pw;
      cur = { x0: start, x1: gap + pw + 320 };
      segments.push(cur);
      x = gap + pw;
    } else if (roll < 0.42) {
      // ---- bug (crawls toward you, hops) ----
      obstacles.push({
        type: "bug",
        x,
        y: 0,
        w: 46,
        h: 30,
        vx: -rand(25, 55 + diff * 22),
        vy: 0,
        phase: Math.random() * 10,
      });
      cur.x1 = Math.max(cur.x1, gap + 80);
      x = gap;
    } else if (roll < 0.58) {
      // ---- spikes ----
      obstacles.push({ type: "spike", x, y: 0, w: 60, h: 34, phase: 0 });
      cur.x1 = Math.max(cur.x1, gap + 80);
      x = gap;
    } else if (roll < 0.72) {
      // ---- wall (jump over) ----
      obstacles.push({
        type: "wall",
        x,
        y: 0,
        w: 38,
        h: rand(48, 66),
        phase: 0,
      });
      cur.x1 = Math.max(cur.x1, gap + 80);
      x = gap;
    } else if (roll < 0.87) {
      // ---- low barrier or drone (slide under / jump over) ----
      if (Math.random() < 0.5) {
        obstacles.push({ type: "barrier", x, y: 32, w: 70, h: 30, phase: 0 });
      } else {
        obstacles.push({ type: "drone", x, y: 34, w: 58, h: 28, phase: Math.random() * 10 });
      }
      cur.x1 = Math.max(cur.x1, gap + 80);
      x = gap;
    } else {
      // ---- coin field on flat ground ----
      const n = 6;
      for (let i = 0; i < n; i++) {
        coins.push({
          x: x + i * 46,
          y: 74 + Math.sin((i / (n - 1)) * Math.PI) * 34,
          taken: false,
        });
      }
      cur.x1 = Math.max(cur.x1, gap + 160);
      x = gap + 160;
    }
  }

  // final stretch + goal trail
  cur.x1 = length + 500;
  for (let i = 0; i < 5; i++) {
    coins.push({ x: length - 320 + i * 48, y: 74, taken: false });
  }

  return {
    index,
    name: theme.name,
    sub: theme.sub,
    theme,
    length,
    goalX: length,
    segments,
    coins,
    obstacles,
    billboards,
    farShapes,
    midShapes,
  };
}
