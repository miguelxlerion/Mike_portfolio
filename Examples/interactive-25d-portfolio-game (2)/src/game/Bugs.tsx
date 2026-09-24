import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BUG_SPAWNS } from "./data";
import { player } from "./playerState";
import { frozen, getState, hitPlayer, squashBug } from "./store";
import { resolveCircle, STATIC_COLLIDERS } from "./colliders";

export function Bugs() {
  return (
    <group>
      {BUG_SPAWNS.map((p, i) => (
        <Bug key={i} spawn={p} />
      ))}
    </group>
  );
}

function Bug({ spawn }: { spawn: [number, number, number] }) {
  const group = useRef<THREE.Group>(null);
  const pos = useRef({ x: spawn[0], z: spawn[2], y: 0 });
  const vel = useRef({ x: 0, z: 0 });
  const dead = useRef(0);
  const phase = useRef(Math.random() * 10);
  const wander = useRef({ x: spawn[0], z: spawn[2], t: 0 });
  const run = useRef(-1);

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    const g = group.current;
    if (!g) return;
    const st = getState();
    if (run.current !== st.runId) {
      run.current = st.runId;
      pos.current = { x: spawn[0], z: spawn[2], y: 0 };
      vel.current = { x: 0, z: 0 };
      dead.current = 0;
      g.scale.set(1, 1, 1);
    }

    if (dead.current > 0) {
      dead.current -= d;
      g.scale.set(1.3, 0.15, 1.3);
      g.position.y = 0.05;
      if (dead.current <= 0) {
        pos.current.x = spawn[0] + (Math.random() - 0.5) * 4;
        pos.current.z = spawn[2] + (Math.random() - 0.5) * 4;
        g.scale.set(1, 1, 1);
      }
      g.position.x = pos.current.x;
      g.position.z = pos.current.z;
      return;
    }

    if (frozen() || getState().screen !== "playing") {
      g.position.set(pos.current.x, 0.2 + Math.sin(clock.elapsedTime * 3 + phase.current) * 0.05, pos.current.z);
      return;
    }

    const dx = player.x - pos.current.x;
    const dz = player.z - pos.current.z;
    const dist = Math.hypot(dx, dz);

    let ax = 0;
    let az = 0;
    if (dist < 7.5 && dist > 0.001) {
      ax = dx / dist;
      az = dz / dist;
    } else {
      wander.current.t -= d;
      if (wander.current.t <= 0) {
        wander.current.x = spawn[0] + (Math.random() - 0.5) * 10;
        wander.current.z = spawn[2] + (Math.random() - 0.5) * 10;
        wander.current.t = 1.4 + Math.random() * 1.6;
      }
      const wx = wander.current.x - pos.current.x;
      const wz = wander.current.z - pos.current.z;
      const wd = Math.hypot(wx, wz) || 1;
      ax = wx / wd;
      az = wz / wd;
    }

    const speed = dist < 7.5 ? 3.6 : 1.7;
    vel.current.x += (ax * speed - vel.current.x) * Math.min(1, d * 4);
    vel.current.z += (az * speed - vel.current.z) * Math.min(1, d * 4);
    pos.current.x += vel.current.x * d;
    pos.current.z += vel.current.z * d;
    const r = resolveCircle(pos.current.x, pos.current.z, 0.38, STATIC_COLLIDERS);
    pos.current.x = r.x;
    pos.current.z = r.z;

    const d2 = Math.hypot(player.x - pos.current.x, player.z - pos.current.z);
    if (d2 < 0.95) {
      if (player.y > 0.55 && player.vy < 0.2) {
        dead.current = 4.5;
        squashBug();
        player.vy = 5.6;
        player.stretch = 1.2;
      } else if (player.inv <= 0 && player.y < 0.85) {
        hitPlayer();
        player.inv = 1.55;
        const nd = d2 || 1;
        player.x += ((player.x - pos.current.x) / nd) * 1.4;
        player.z += ((player.z - pos.current.z) / nd) * 1.4;
      }
    }

    const face = Math.atan2(vel.current.x, vel.current.z);
    g.position.set(
      pos.current.x,
      0.18 + Math.sin(clock.elapsedTime * 8 + phase.current) * 0.06,
      pos.current.z
    );
    g.rotation.y = face;
    g.scale.set(1, 1, 1);
  });

  return (
    <group ref={group} position={[spawn[0], 0.2, spawn[2]]}>
      <mesh position={[0, 0.16, 0]} castShadow>
        <sphereGeometry args={[0.28, 10, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#b91c1c" emissiveIntensity={0.55} />
      </mesh>
      <mesh position={[0.12, 0.22, 0.18]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[-0.12, 0.22, 0.18]}>
        <sphereGeometry args={[0.07, 6, 6]} />
        <meshStandardMaterial color="#fff" />
      </mesh>
      <mesh position={[0.12, 0.22, 0.24]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[-0.12, 0.22, 0.24]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh position={[0, 0.32, -0.05]} rotation-x={0.4}>
        <coneGeometry args={[0.16, 0.22, 6]} />
        <meshStandardMaterial color="#7f1d1d" />
      </mesh>
    </group>
  );
}
