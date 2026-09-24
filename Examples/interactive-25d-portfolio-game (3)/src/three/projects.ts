import p1 from "../assets/p1.jpg";
import p2 from "../assets/p2.jpg";
import p3 from "../assets/p3.jpg";
import p4 from "../assets/p4.jpg";
import p5 from "../assets/p5.jpg";
import p6 from "../assets/p6.jpg";

export type HeroKind = "cabinet" | "tower" | "dungeon" | "rocket" | "robot" | "ship";

export interface ProjectStat {
  label: string;
  value: string;
}

export interface Project {
  id: string;
  title: string;
  tagline: string;
  year: string;
  platform: string;
  engine: string;
  role: string;
  description: string;
  tech: string[];
  stats: ProjectStat[];
  features: string[];
  accent: string;
  image: string;
  kind: HeroKind;
}

export const PROJECTS: Project[] = [
  {
    id: "neon-racer",
    title: "NEON RACER",
    tagline: "Arcade antigravity racing",
    year: "2025",
    platform: "PC · Switch",
    engine: "Unity",
    role: "Lead Designer & Developer",
    description:
      "A synthwave arcade racer about pure speed. I designed the handling model, the 12-track campaign, and a dynamic music system that layers instruments as your boost meter fills. Built from a greybox prototype to a 60fps shipped build in 9 months.",
    tech: ["Unity", "C#", "HDRP", "Wwise", "Shader Graph"],
    stats: [
      { label: "Plays", value: "120k+" },
      { label: "Rating", value: "4.8/5" },
      { label: "Tracks", value: "12" },
      { label: "Dev time", value: "9 mo" },
    ],
    features: [
      "Boost-chaining handling model with slipstream drafting",
      "Dynamic music layering synced to gameplay intensity",
      "Split-screen 2P and 8-player online time trials",
    ],
    accent: "#22d3ee",
    image: p1,
    kind: "cabinet",
  },
  {
    id: "skyfall-td",
    title: "SKYFALL TD",
    tagline: "Tower defense on floating islands",
    year: "2024",
    platform: "Mobile · PC",
    engine: "Godot",
    role: "Designer & Developer",
    description:
      "A lane-based tower defense set on crumbling sky islands. I built the tower upgrade web, the 40-wave balance sheet, and an editor that lets players design and share islands. Soft-launched in two regions with 40k installs in the first month.",
    tech: ["Godot", "GDScript", "Aseprite", "Firebase"],
    stats: [
      { label: "Installs", value: "40k+" },
      { label: "Waves", value: "40" },
      { label: "Towers", value: "9" },
      { label: "D1 retention", value: "42%" },
    ],
    features: [
      "Player-built islands with online level sharing",
      "Tower fusion mechanic — merge two towers mid-wave",
      "Falling island hazards that reshape the battlefield",
    ],
    accent: "#fb923c",
    image: p2,
    kind: "tower",
  },
  {
    id: "pixel-dungeon",
    title: "PIXEL DUNGEON",
    tagline: "A roguelike with hand-placed soul",
    year: "2023",
    platform: "PC",
    engine: "Custom (TypeScript)",
    role: "Solo Developer",
    description:
      "A bite-sized roguelike dungeon crawler where every room is hand-designed but the dungeon is procedurally assembled. I wrote a custom ECS engine, a roguelike FOV system, and 120+ items with real combos. Featured in two indie showcases.",
    tech: ["TypeScript", "Canvas 2D", "ECS", "Web Audio"],
    stats: [
      { label: "Players", value: "25k+" },
      { label: "Items", value: "120+" },
      { label: "Rooms", value: "300" },
      { label: "Showcases", value: "2" },
    ],
    features: [
      "Hand-crafted rooms, procedurally woven dungeons",
      "Item combo system with emergent builds",
      "Daily seeded runs with global leaderboards",
    ],
    accent: "#fbbf24",
    image: p3,
    kind: "dungeon",
  },
  {
    id: "starfarm-idle",
    title: "STARFARM IDLE",
    tagline: "The coziest farm off-world",
    year: "2024",
    platform: "Mobile · Web",
    engine: "React + Three.js",
    role: "Designer & Developer",
    description:
      "An idle farming game on a space station greenhouse. I tuned the 14-day prestige loop, wrote the crop mutation system, and built a layered idle economy that keeps paying out while you sleep. 8k daily active players at peak.",
    tech: ["React", "Three.js", "Zustand", "Web Workers"],
    stats: [
      { label: "DAU peak", value: "8k" },
      { label: "Crops", value: "48" },
      { label: "Prestiges", value: "14 days" },
      { label: "Avg. rating", value: "4.7/5" },
    ],
    features: [
      "Offline progression with smart catch-up pacing",
      "Crop mutation breeding with rare hybrids",
      "Seasonal events that reskin the station",
    ],
    accent: "#4ade80",
    image: p4,
    kind: "rocket",
  },
  {
    id: "robo-rush",
    title: "ROBO RUSH",
    tagline: "A 2.5D platformer with punch",
    year: "2025",
    platform: "PC · Web",
    engine: "Custom (WebGL)",
    role: "Game Feel Engineer",
    description:
      "A tight, juicy 2.5D platformer about a little robot delivering ideas. I owned the game-feel layer: squash & stretch, particle budgets, screen shake, and an input-buffering system that makes every jump feel forgiving. 30fps-to-60fps feel pass on mobile was my favorite problem.",
    tech: ["WebGL", "TypeScript", "Web Audio", "Vite"],
    stats: [
      { label: "Plays", value: "60k+" },
      { label: "Levels", value: "24" },
      { label: "Frame budget", value: "3.2 ms" },
      { label: "Mobile", value: "60 fps" },
    ],
    features: [
      "Coyote time + input buffering for butter jumps",
      "Pooled particle system, zero per-frame allocs",
      "Touch + keyboard controls with haptic feedback",
    ],
    accent: "#f0f",
    image: p5,
    kind: "robot",
  },
  {
    id: "cosmic-defender",
    title: "COSMIC DEFENDER",
    tagline: "A love letter to arcade shooters",
    year: "2023",
    platform: "Web · PC",
    engine: "Phaser 3",
    role: "Developer & Juice Designer",
    description:
      "A wave-based arcade shooter with a 4-weapon combo system. I built the enemy AI director, the 30-wave difficulty ramp, and a 200-particle explosion budget. Shipped in 6 weeks for a game jam and kept alive as a live arcade title.",
    tech: ["Phaser 3", "TypeScript", "Tiled", "Howler"],
    stats: [
      { label: "Plays", value: "90k+" },
      { label: "Waves", value: "30" },
      { label: "Weapons", value: "4" },
      { label: "Jam result", value: "1st" },
    ],
    features: [
      "4-weapon combo system with synergies",
      "AI director that adapts to your skill",
      "Local co-op and global wave leaderboards",
    ],
    accent: "#38bdf8",
    image: p6,
    kind: "ship",
  },
];
