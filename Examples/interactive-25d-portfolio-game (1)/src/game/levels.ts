// Level data for each portfolio "project" world.
// Coordinates use grid units. The isometric projection happens at render time.
// Tile format: [x, y, height] — height is visual only (for 2.5D stacked blocks)

export interface Tile {
  x: number;
  y: number;
  h: number; // visual stack height (1 = single block)
}

export interface Gem {
  x: number;
  y: number;
}

export interface Hazard {
  x: number;
  y: number;
}

export interface Level {
  id: number;
  name: string;
  subtitle: string; // portfolio project tagline
  description: string;
  accent: string; // hex
  accentDark: string;
  bgFrom: string;
  bgTo: string;
  gridW: number;
  gridH: number;
  start: { x: number; y: number };
  exit: { x: number; y: number };
  tiles: Tile[];
  gems: Gem[];
  hazards: Hazard[];
  parTime: number; // seconds for bonus
}

// Helper to build a tile
const t = (x: number, y: number, h = 1): Tile => ({ x, y, h });
const g = (x: number, y: number): Gem => ({ x, y });
const h = (x: number, y: number): Hazard => ({ x, y });

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "Pixel Pioneers",
    subtitle: "Arcade Platformer · 2024",
    description: "A retro-styled platformer with tight controls and 40 hand-crafted levels.",
    accent: "#ff3ea5",
    accentDark: "#b01e72",
    bgFrom: "#1a0730",
    bgTo: "#3a0a5c",
    gridW: 10,
    gridH: 8,
    start: { x: 1, y: 6 },
    exit: { x: 8, y: 1 },
    tiles: [
      // Main path
      t(1, 6), t(2, 6), t(3, 6), t(3, 5), t(3, 4), t(4, 4), t(5, 4),
      t(5, 3), t(5, 2), t(6, 2), t(7, 2), t(8, 2), t(8, 1),
      // Side branches
      t(1, 5), t(1, 4), t(2, 4),
      t(6, 4), t(7, 4), t(7, 5),
      t(6, 1), t(7, 1),
      // Stacked decorations (visual only, treated as solid at ground)
    ],
    gems: [g(2, 6), g(3, 5), g(5, 4), g(6, 2), g(8, 2), g(1, 4), g(7, 5)],
    hazards: [h(4, 4), h(6, 4)],
    parTime: 35,
  },
  {
    id: 2,
    name: "Gravity Forge",
    subtitle: "Physics Puzzle · 2024",
    description: "A gravity-flipping puzzle game where you sculpt solutions.",
    accent: "#22d3ee",
    accentDark: "#0e7490",
    bgFrom: "#031a2e",
    bgTo: "#0a3d5c",
    gridW: 11,
    gridH: 9,
    start: { x: 0, y: 8 },
    exit: { x: 10, y: 0 },
    tiles: [
      // Zigzag path
      t(0, 8), t(1, 8), t(2, 8), t(2, 7), t(2, 6),
      t(3, 6), t(4, 6), t(5, 6), t(5, 5), t(5, 4),
      t(6, 4), t(7, 4), t(8, 4), t(8, 3), t(8, 2),
      t(9, 2), t(10, 2), t(10, 1), t(10, 0),
      // Extras
      t(0, 7), t(0, 6), t(1, 6),
      t(3, 8), t(4, 8), t(4, 7),
      t(6, 6), t(7, 6),
      t(6, 2), t(7, 2),
    ],
    gems: [g(1, 8), g(2, 7), g(4, 6), g(5, 5), g(7, 4), g(8, 3), g(10, 1), g(0, 6), g(4, 7)],
    hazards: [h(3, 6), h(5, 4), h(8, 4), h(10, 2)],
    parTime: 45,
  },
  {
    id: 3,
    name: "Neon Drift",
    subtitle: "Arcade Racer · 2025",
    description: "A fast-paced racing game with procedural neon tracks.",
    accent: "#facc15",
    accentDark: "#a16207",
    bgFrom: "#2a1500",
    bgTo: "#5c2e00",
    gridW: 12,
    gridH: 9,
    start: { x: 1, y: 7 },
    exit: { x: 10, y: 1 },
    tiles: [
      // Wide highway
      t(1, 7), t(2, 7), t(3, 7), t(4, 7), t(4, 6), t(4, 5),
      t(5, 5), t(6, 5), t(7, 5), t(7, 4), t(7, 3),
      t(8, 3), t(9, 3), t(10, 3), t(10, 2), t(10, 1),
      // Side paths
      t(1, 6), t(1, 5), t(2, 5), t(2, 4), t(3, 4),
      t(5, 7), t(6, 7), t(6, 6),
      t(8, 5), t(9, 5),
      t(9, 1), t(10, 0),
    ],
    gems: [g(3, 7), g(4, 6), g(5, 5), g(7, 4), g(8, 3), g(10, 2), g(1, 5), g(2, 4), g(6, 6), g(9, 5)],
    hazards: [h(4, 5), h(7, 3), h(10, 3), h(2, 5)],
    parTime: 40,
  },
  {
    id: 4,
    name: "Astral Echo",
    subtitle: "Narrative Adventure · 2025",
    description: "A story-driven adventure across dying star systems.",
    accent: "#a78bfa",
    accentDark: "#6d28d9",
    bgFrom: "#0c0420",
    bgTo: "#2e1065",
    gridW: 12,
    gridH: 10,
    start: { x: 0, y: 9 },
    exit: { x: 11, y: 0 },
    tiles: [
      // Sprawling final path
      t(0, 9), t(1, 9), t(2, 9), t(2, 8), t(2, 7),
      t(3, 7), t(4, 7), t(5, 7), t(5, 6), t(5, 5),
      t(6, 5), t(7, 5), t(7, 4), t(7, 3),
      t(8, 3), t(9, 3), t(9, 2), t(9, 1), t(10, 1), t(11, 1), t(11, 0),
      // Branches with gems
      t(0, 8), t(0, 7), t(1, 7),
      t(3, 9), t(4, 9), t(4, 8),
      t(6, 7), t(7, 7),
      t(5, 4), t(6, 4),
      t(8, 5), t(9, 5), t(10, 5),
      t(8, 1), t(9, 0), t(10, 0),
    ],
    gems: [
      g(1, 9), g(2, 8), g(3, 7), g(5, 6), g(6, 5), g(7, 4),
      g(8, 3), g(9, 2), g(10, 1), g(11, 0),
      g(0, 7), g(4, 8), g(7, 7), g(6, 4), g(9, 5), g(9, 0),
    ],
    hazards: [h(2, 7), h(4, 7), h(5, 5), h(7, 3), h(9, 3), h(11, 1)],
    parTime: 55,
  },
];
