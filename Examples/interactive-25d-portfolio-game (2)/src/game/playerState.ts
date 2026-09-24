export const player = {
  x: -16,
  y: 0,
  z: -11,
  facing: Math.PI,
  vx: 0,
  vz: 0,
  vy: 0,
  grounded: true,
  inv: 0,
  moving: false,
  stretch: 1,
  coyote: 0,
  jumps: 0,
};

export function resetPlayer() {
  player.x = -16;
  player.y = 0;
  player.z = -11;
  player.facing = Math.PI;
  player.vx = 0;
  player.vz = 0;
  player.vy = 0;
  player.grounded = true;
  player.inv = 0;
  player.moving = false;
  player.stretch = 1;
  player.coyote = 0;
  player.jumps = 0;
}
