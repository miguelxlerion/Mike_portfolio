type MoveKey = "forward" | "back" | "left" | "right";

export const input = {
  joyX: 0,
  joyZ: 0,
  joyActive: false,
  forward: false,
  back: false,
  left: false,
  right: false,
  jumpHeld: false,
  jumpQueued: false,
};

const CODE: Record<string, MoveKey | "jump"> = {
  KeyW: "forward",
  ArrowUp: "forward",
  KeyS: "back",
  ArrowDown: "back",
  KeyA: "left",
  ArrowLeft: "left",
  KeyD: "right",
  ArrowRight: "right",
  Space: "jump",
};

function down(e: KeyboardEvent) {
  const k = CODE[e.code];
  if (!k) return;
  if (k === "jump") {
    if (!e.repeat) input.jumpQueued = true;
    input.jumpHeld = true;
    e.preventDefault();
    return;
  }
  input[k] = true;
}

function up(e: KeyboardEvent) {
  const k = CODE[e.code];
  if (!k) return;
  if (k === "jump") {
    input.jumpHeld = false;
    return;
  }
  input[k] = false;
}

export function attachMoveInput() {
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
  };
}

export function moveAxis(): { x: number; z: number } {
  if (input.joyActive) {
    return { x: input.joyX, z: input.joyZ };
  }
  let x = 0;
  let z = 0;
  if (input.forward) z -= 1;
  if (input.back) z += 1;
  if (input.left) x -= 1;
  if (input.right) x += 1;
  const m = Math.hypot(x, z);
  if (m > 1) {
    x /= m;
    z /= m;
  }
  return { x, z };
}
