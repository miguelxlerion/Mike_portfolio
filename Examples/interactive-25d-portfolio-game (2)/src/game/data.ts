export type ZoneId = "CONCEPT" | "PROTOTYPE" | "PRODUCTION" | "LAUNCH";
export type PropKind =
  | "cabinet"
  | "holo"
  | "greybox"
  | "console"
  | "easel"
  | "crate"
  | "trailer"
  | "trophy";

export interface Project {
  id: string;
  title: string;
  subtitle: string;
  year: string;
  role: string;
  zone: ZoneId;
  tools: string[];
  pillars: string[];
  systems: string[];
  blurb: string;
  shipped: string;
  image: string;
  position: [number, number, number];
  kind: PropKind;
  accent: string;
}

export const ZONE_META: Record<
  ZoneId,
  { name: string; sub: string; color: string; center: [number, number, number] }
> = {
  CONCEPT: {
    name: "CONCEPT",
    sub: "IDEATION & DESIGN",
    color: "#22d3ee",
    center: [-12, 0, -12],
  },
  PROTOTYPE: {
    name: "PROTOTYPE",
    sub: "GREYBOX TO PLAYABLE",
    color: "#4ade80",
    center: [12, 0, -12],
  },
  PRODUCTION: {
    name: "PRODUCTION",
    sub: "FULL BUILD IN MOTION",
    color: "#fb923c",
    center: [-12, 0, 12],
  },
  LAUNCH: {
    name: "LAUNCH",
    sub: "SHIP IT TO THE WORLD",
    color: "#e879f9",
    center: [12, 0, 12],
  },
};

export const PROJECTS: Project[] = [
  {
    id: "neon-racer",
    title: "NEON RACER",
    subtitle: "Handling bible & track flow",
    year: "2023",
    role: "Lead Game Designer",
    zone: "CONCEPT",
    tools: ["Unity", "Cinemachine", "Figma", "Blender"],
    pillars: ["Readable speed", "Fair rubber-band", "Flow over friction"],
    systems: [
      "Tire-slip & weight transfer model",
      "Catch-up AI that never feels cheated",
      "Camera chase rig with speed FOV",
    ],
    blurb:
      "A night-circuit racer designed from the hands first. We prototyped 14 handling curves on paper, then locked a single 'hero feel': the car is heavy, the drift is a choice, and the racing line is a sentence you can read at 200 kph.",
    shipped:
      "Vertical slice of two tracks, AI pack, and a 12-page handling bible used by engineering for the full production.",
    image: "/images/neon-racer.jpg",
    position: [-16, 0, -16.5],
    kind: "cabinet",
    accent: "#22d3ee",
  },
  {
    id: "pixel-dungeon",
    title: "PIXEL DUNGEON",
    subtitle: "Permadeath economy on paper",
    year: "2022",
    role: "Systems Designer",
    zone: "CONCEPT",
    tools: ["Paper", "Tabletop sim", "Godot", "Aseprite"],
    pillars: ["Information is treasure", "Death teaches", "Three verbs only"],
    systems: [
      "Telegraphed enemy tells",
      "Loot-as-language tile set",
      "Risk budget per floor",
    ],
    blurb:
      "Before a single sprite moved, the dungeon was a printed grid and cardboard tokens. We cut the verb list to Strike, Push, and Rest until every room was a readable puzzle — then ported that grammar 1:1 into the digital prototype.",
    shipped:
      "Paper prototype, 40-room grammar, and a combat GDD that survived into production without a rewrite.",
    image: "/images/pixel-dungeon.jpg",
    position: [-8, 0, -16.5],
    kind: "easel",
    accent: "#67e8f9",
  },
  {
    id: "skyfall-td",
    title: "SKYFALL TD",
    subtitle: "Wave director greybox",
    year: "2023",
    role: "Prototype Lead",
    zone: "PROTOTYPE",
    tools: ["Unreal", "Gameplay Ability", "Excel", "Maya"],
    pillars: ["Synergy over DPS", "Readable airspace", "Director, not spawner"],
    systems: [
      "Heatmap pathing & chokepoints",
      "Tower combo matrix (slow × splash × mark)",
      "Adaptive wave director",
    ],
    blurb:
      "A flying-lane tower defense greyboxed in untextured primitives. The wave director reads player coverage and injects pressure where the defense is thin — a boss is just a sentence the director learned to say louder.",
    shipped:
      "Playable greybox, 8 waves, 6 towers, and a director that designers could retune live without a rebuild.",
    image: "/images/skyfall-td.jpg",
    position: [8, 0, -16.5],
    kind: "greybox",
    accent: "#4ade80",
  },
  {
    id: "robo-rush",
    title: "ROBO RUSH",
    subtitle: "Coyote time, juice, vertical slice",
    year: "2024",
    role: "Gameplay Engineer / Designer",
    zone: "PROTOTYPE",
    tools: ["Custom engine", "WebGL", "Tone.js"],
    pillars: ["Feel in 10 seconds", "Forgiving but tight", "Juice as feedback"],
    systems: [
      "Coyote time + jump buffer",
      "Hit-pause, squash, screen shake",
      "Fixed 60 Hz physics step",
    ],
    blurb:
      "A 2.5D runner vertical slice built to prove a feel. Double-jump with a jet flicker, slide under drones, coins that pop. The whole argument of the prototype: if the first ten seconds aren't fun, the rest of the GDD doesn't matter.",
    shipped:
      "Playable slice with particles, SFX, and a juice checklist later reused on two shipped titles.",
    image: "/images/robo-rush.jpg",
    position: [16, 0, -16.5],
    kind: "holo",
    accent: "#86efac",
  },
  {
    id: "cosmic-defender",
    title: "COSMIC DEFENDER",
    subtitle: "Twin-stick juice pass",
    year: "2024",
    role: "Combat Designer",
    zone: "PRODUCTION",
    tools: ["Unity", "URP", "C#", "FMOD"],
    pillars: ["Every shot speaks", "Telegraph then punish", "60 fps sacred"],
    systems: [
      "Screen-shake intensity bible",
      "Hit-stop tables per weapon",
      "Enemy telegraph language",
    ],
    blurb:
      "Production combat pass on a twin-stick shooter. We wrote a shake bible (what may rumble, for how many frames, at what amplitude) so juice never stole readability. Enemies announce, then strike — the player always has a beat to answer.",
    shipped:
      "Full combat loop, 14 enemy types, boss telegraph sheet, and a 60 fps budget signed by engineering.",
    image: "/images/cosmic-defender.jpg",
    position: [-16, 0, 16.5],
    kind: "console",
    accent: "#fb923c",
  },
  {
    id: "turbo-drift",
    title: "TURBO DRIFT",
    subtitle: "Production track & ghost racing",
    year: "2024",
    role: "Race Designer",
    zone: "PRODUCTION",
    tools: ["Unreal", "Chaos Vehicles", "Houdini", "Wwise"],
    pillars: ["Drift is the skill ceiling", "Ghosts as teachers", "Track as sentence"],
    systems: [
      "Drift-score with style multipliers",
      "Ghost racing & line heatmaps",
      "Surface materials → handling",
    ],
    blurb:
      "From greybox hairpins to a production mountain pass. Drift scoring rewards commitment, ghosts teach the racing line without a tutorial dump, and every surface (wet, dust, rumble) is a handling modifier the player can feel in the stick.",
    shipped:
      "Three production tracks, ghost system, VFX pass, and a time-trial mode that became the review hook.",
    image: "/images/turbo-drift.jpg",
    position: [-8, 0, 16.5],
    kind: "cabinet",
    accent: "#fdba74",
  },
  {
    id: "starfarm",
    title: "STARFARM IDLE",
    subtitle: "Live-ops, store page, day-one",
    year: "2025",
    role: "Design Director",
    zone: "LAUNCH",
    tools: ["Unity", "PlayFab", "Amplitude", "Figma"],
    pillars: ["Warm loop", "Honest economy", "Onboarding in 90s"],
    systems: [
      "Prestige loop & dopamine curve",
      "FTUE funnel (90-second harvest)",
      "Live-ops calendar & day-one patch",
    ],
    blurb:
      "A cozy idle about farming a pocket planet — designed for launch, not just content. We instrumented the first 90 seconds, killed a pay-wall that failed playtests, and shipped with a week-one live-ops calendar already on the wall.",
    shipped:
      "Store page, trailer stills, economy spreadsheet, FTUE metrics, and a day-one patch that landed 14 hours after release.",
    image: "/images/starfarm.jpg",
    position: [8, 0, 16.5],
    kind: "crate",
    accent: "#e879f9",
  },
  {
    id: "aether-tales",
    title: "AETHER TALES",
    subtitle: "Trailer cut, loc, postmortem",
    year: "2025",
    role: "Narrative Designer",
    zone: "LAUNCH",
    tools: ["Ink", "Unity", "DaVinci", "Crowdin"],
    pillars: ["Story is a system", "Trailer is a promise", "Ship, then listen"],
    systems: [
      "Barks + quest grammar",
      "Trailer beat sheet (12 shots)",
      "Localization pipeline & review response",
    ],
    blurb:
      "A storybook RPG that had to speak in 12 trailer shots. Narrative systems (barks, quest grammar, fail-forward) were designed so localization could swap lines without breaking flags. After launch we sat with reviews and wrote the postmortem the team still quotes.",
    shipped:
      "Launch trailer, 6-language loc, press kit, and a public postmortem on what the story systems got wrong.",
    image: "/images/aether-tales.jpg",
    position: [16, 0, 16.5],
    kind: "trailer",
    accent: "#f0abfc",
  },
];

export const ORB_POSITIONS: [number, number, number][] = [
  [-12, 0.6, -8],
  [-20, 0.6, -12],
  [12, 0.6, -8],
  [20, 0.6, -12],
  [-12, 0.6, 8],
  [-20, 0.6, 12],
  [12, 0.6, 8],
  [20, 0.6, 12],
  [0, 0.7, -6],
  [0, 0.7, 6],
];

export const BUG_SPAWNS: [number, number, number][] = [
  [-6, 0, -20],
  [18, 0, -10],
  [-18, 0, 10],
  [6, 0, 20],
];

export function zoneAt(x: number, z: number): ZoneId {
  if (x < 0 && z < 0) return "CONCEPT";
  if (x >= 0 && z < 0) return "PROTOTYPE";
  if (x < 0 && z >= 0) return "PRODUCTION";
  return "LAUNCH";
}

export function getProject(id: string) {
  return PROJECTS.find((p) => p.id === id) ?? null;
}
