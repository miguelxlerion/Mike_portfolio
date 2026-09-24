import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { player } from "./playerState";
import { moveAxis, input } from "./input";
import { resolveCircle, STATIC_COLLIDERS, AABB } from "./colliders";
import { PROJECTS, zoneAt } from "./data";
import { frozen, setZone } from "./store";
import { sfx } from "./audio";

const RADIUS = 0.42;
const MAX_SPEED = 6.4;
const ACCEL = 32;
const FRICTION = 22;
const GRAV = 28;
const JUMP_V = 7.4;
const DJUMP_V = 6.4;

const PEDESTALS: AABB[] = PROJECTS.map((p) => ({
  minX: p.position[0] - 0.72,
  maxX: p.position[0] + 0.72,
  minZ: p.position[2] - 0.72,
  maxZ: p.position[2] + 0.72,
}));

const COLLIDERS = [...STATIC_COLLIDERS, ...PEDESTALS];
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _wish = new THREE.Vector3();
const _up = new THREE.Vector3(0, 1, 0);

export function Player() {
  const group = useRef<THREE.Group>(null);
  const lastLand = useRef(false);

  useFrame(({ camera }, dt) => {
    const d = Math.min(dt, 0.05);
    const lock = frozen();

    if (!lock) {
      const axis = moveAxis();
      camera.getWorldDirection(_fwd);
      _fwd.y = 0;
      if (_fwd.lengthSq() < 1e-6) _fwd.set(0, 0, -1);
      else _fwd.normalize();
      _right.crossVectors(_fwd, _up).normalize();
      _wish.set(0, 0, 0).addScaledVector(_right, axis.x).addScaledVector(_fwd, -axis.z);

      const wishLen = _wish.length();
      if (wishLen > 1) _wish.multiplyScalar(1 / wishLen);

      if (wishLen > 0.08) {
        player.vx += _wish.x * ACCEL * d;
        player.vz += _wish.z * ACCEL * d;
        const face = Math.atan2(_wish.x, _wish.z);
        let diff = face - player.facing;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        player.facing += diff * Math.min(1, d * 10);
        player.moving = true;
      } else {
        player.moving = false;
      }

      const spd = Math.hypot(player.vx, player.vz);
      const max = MAX_SPEED;
      if (spd > max) {
        player.vx = (player.vx / spd) * max;
        player.vz = (player.vz / spd) * max;
      }
      const fr = Math.exp(-FRICTION * d);
      if (wishLen < 0.08) {
        player.vx *= fr;
        player.vz *= fr;
      }

      player.x += player.vx * d;
      player.z += player.vz * d;
      const resolved = resolveCircle(player.x, player.z, RADIUS, COLLIDERS);
      player.x = resolved.x;
      player.z = resolved.z;

      if (input.jumpQueued) {
        if (player.grounded || player.coyote > 0) {
          player.vy = JUMP_V;
          player.grounded = false;
          player.jumps = 1;
          player.coyote = 0;
          player.stretch = 1.28;
          sfx.jump(false);
        } else if (player.jumps < 2) {
          player.vy = DJUMP_V;
          player.jumps = 2;
          player.stretch = 1.22;
          sfx.jump(true);
        }
        input.jumpQueued = false;
      }

      player.vy -= GRAV * d;
      player.y += player.vy * d;
      if (player.y <= 0) {
        if (!player.grounded && lastLand.current === false && player.vy < -2) {
          sfx.land();
          player.stretch = 0.72;
        }
        player.y = 0;
        player.vy = 0;
        player.grounded = true;
        player.jumps = 0;
        player.coyote = 0.1;
      } else {
        if (player.grounded) {
          player.grounded = false;
          player.coyote = 0.1;
        }
      }
      if (player.coyote > 0) player.coyote -= d;
      lastLand.current = player.grounded;

      setZone(zoneAt(player.x, player.z));
    } else {
      input.jumpQueued = false;
    }

    if (player.inv > 0) player.inv -= d;
    player.stretch += (1 - player.stretch) * Math.min(1, d * 12);

    if (group.current) {
      group.current.position.set(player.x, player.y, player.z);
      group.current.rotation.y = player.facing;
      const sy = player.stretch;
      group.current.scale.set(1 / Math.sqrt(sy), sy, 1 / Math.sqrt(sy));
      const blink = player.inv > 0 && Math.floor(performance.now() / 70) % 2 === 0;
      group.current.visible = !blink;
    }
  });

  return (
    <group ref={group} position={[player.x, player.y, player.z]}>
      <RobotMesh />
    </group>
  );
}

function RobotMesh() {
  const legs = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!legs.current) return;
    const swing = player.moving && player.grounded ? Math.sin(clock.elapsedTime * 14) * 0.45 : 0;
    const l = legs.current.children[0];
    const r = legs.current.children[1];
    if (l) l.rotation.x = swing;
    if (r) r.rotation.x = -swing;
  });

  const body = "#22d3ee";
  const dark = "#1e293b";

  return (
    <group>
      <pointLight position={[0, 1.1, 0.2]} color="#22d3ee" intensity={2.2} distance={4.5} />
      {/* legs */}
      <group ref={legs} position={[0, 0.28, 0]}>
        <mesh position={[-0.14, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.18]} />
          <meshStandardMaterial color={dark} />
        </mesh>
        <mesh position={[0.14, 0, 0]} castShadow>
          <boxGeometry args={[0.16, 0.42, 0.18]} />
          <meshStandardMaterial color={dark} />
        </mesh>
      </group>
      {/* feet */}
      <mesh position={[-0.14, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.08, 0.28]} />
        <meshStandardMaterial color={body} emissive={body} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0.14, 0.06, 0.04]} castShadow>
        <boxGeometry args={[0.2, 0.08, 0.28]} />
        <meshStandardMaterial color={body} emissive={body} emissiveIntensity={0.3} />
      </mesh>
      {/* body */}
      <mesh position={[0, 0.78, 0]} castShadow>
        <boxGeometry args={[0.56, 0.62, 0.42]} />
        <meshStandardMaterial color={body} metalness={0.35} roughness={0.35} emissive={body} emissiveIntensity={0.25} />
      </mesh>
      {/* visor */}
      <mesh position={[0, 1.18, 0.12]} castShadow>
        <boxGeometry args={[0.5, 0.28, 0.36]} />
        <meshStandardMaterial color="#0b1220" metalness={0.6} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 1.18, 0.32]}>
        <boxGeometry args={[0.16, 0.1, 0.04]} />
        <meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* chest light */}
      <mesh position={[0, 0.72, 0.22]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={2} toneMapped={false} />
      </mesh>
      {/* antenna */}
      <mesh position={[0.12, 1.42, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.28, 6]} />
        <meshStandardMaterial color="#cbd5e1" />
      </mesh>
      <mesh position={[0.12, 1.58, 0]}>
        <sphereGeometry args={[0.055, 8, 8]} />
        <meshStandardMaterial color={body} emissive={body} emissiveIntensity={2} toneMapped={false} />
      </mesh>
    </group>
  );
}
