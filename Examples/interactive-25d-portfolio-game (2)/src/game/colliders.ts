export interface AABB {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface WallSpec {
  pos: [number, number, number];
  size: [number, number, number];
}

export const WALLS: WallSpec[] = [
  // outer
  { pos: [0, 2, -24], size: [48.8, 4, 0.8] },
  { pos: [0, 2, 24], size: [48.8, 4, 0.8] },
  { pos: [-24, 2, 0], size: [0.8, 4, 48.8] },
  { pos: [24, 2, 0], size: [0.8, 4, 48.8] },
  // inner cross with hub gap
  { pos: [-13.5, 2, 0], size: [21, 4, 0.7] },
  { pos: [13.5, 2, 0], size: [21, 4, 0.7] },
  { pos: [0, 2, -13.5], size: [0.7, 4, 21] },
  { pos: [0, 2, 13.5], size: [0.7, 4, 21] },
  // outer corner pillars
  { pos: [-23.2, 2.2, -23.2], size: [1.4, 4.4, 1.4] },
  { pos: [23.2, 2.2, -23.2], size: [1.4, 4.4, 1.4] },
  { pos: [-23.2, 2.2, 23.2], size: [1.4, 4.4, 1.4] },
  { pos: [23.2, 2.2, 23.2], size: [1.4, 4.4, 1.4] },
  // hub pillars
  { pos: [-3.4, 1.8, -3.4], size: [0.8, 3.6, 0.8] },
  { pos: [3.4, 1.8, -3.4], size: [0.8, 3.6, 0.8] },
  { pos: [-3.4, 1.8, 3.4], size: [0.8, 3.6, 0.8] },
  { pos: [3.4, 1.8, 3.4], size: [0.8, 3.6, 0.8] },
];

function wallAABB(w: WallSpec): AABB {
  return {
    minX: w.pos[0] - w.size[0] / 2,
    maxX: w.pos[0] + w.size[0] / 2,
    minZ: w.pos[2] - w.size[2] / 2,
    maxZ: w.pos[2] + w.size[2] / 2,
  };
}

export const STATIC_COLLIDERS: AABB[] = WALLS.map(wallAABB);

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function resolveCircle(
  x: number,
  z: number,
  r: number,
  boxes: AABB[]
): { x: number; z: number } {
  let px = x;
  let pz = z;
  for (let n = 0; n < 2; n++) {
    for (const b of boxes) {
      const nx = clamp(px, b.minX, b.maxX);
      const nz = clamp(pz, b.minZ, b.maxZ);
      let dx = px - nx;
      let dz = pz - nz;
      const d2 = dx * dx + dz * dz;
      if (d2 < r * r) {
        const d = Math.sqrt(d2);
        if (d < 1e-6) {
          // deepest axis push
          const left = Math.abs(px - b.minX);
          const right = Math.abs(b.maxX - px);
          const up = Math.abs(pz - b.minZ);
          const down = Math.abs(b.maxZ - pz);
          const m = Math.min(left, right, up, down);
          if (m === left) px = b.minX - r;
          else if (m === right) px = b.maxX + r;
          else if (m === up) pz = b.minZ - r;
          else pz = b.maxZ + r;
        } else {
          const o = r - d;
          px += (dx / d) * o;
          pz += (dz / d) * o;
        }
      }
    }
  }
  return { x: px, z: pz };
}
