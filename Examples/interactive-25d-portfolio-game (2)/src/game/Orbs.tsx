import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import * as THREE from "three";
import { ORB_POSITIONS } from "./data";
import { player } from "./playerState";
import { collectOrb, getState } from "./store";

export function Orbs() {
  return (
    <group>
      {ORB_POSITIONS.map((p, i) => (
        <Orb key={i} index={i} position={p} />
      ))}
    </group>
  );
}

function Orb({
  index,
  position,
}: {
  index: number;
  position: [number, number, number];
}) {
  const ref = useRef<THREE.Group>(null);
  const taken = useRef(false);
  const run = useRef(-1);

  useFrame(({ clock }) => {
    const st = getState();
    if (run.current !== st.runId) {
      run.current = st.runId;
      taken.current = false;
      if (ref.current) ref.current.visible = true;
    }
    if (taken.current) return;
    if (st.collectedOrbs.includes(index)) {
      taken.current = true;
      if (ref.current) ref.current.visible = false;
      return;
    }
    const d = Math.hypot(player.x - position[0], player.z - position[2], player.y - position[1]);
    if (d < 0.95 && getState().screen === "playing") {
      collectOrb(index);
      taken.current = true;
      if (ref.current) ref.current.visible = false;
    }
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 1.6;
    }
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <group ref={ref} position={position}>
        <mesh>
          <octahedronGeometry args={[0.22, 0]} />
          <meshStandardMaterial
            color="#fbbf24"
            emissive="#fbbf24"
            emissiveIntensity={1.6}
            metalness={0.3}
            roughness={0.25}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#fbbf24" intensity={1.6} distance={2.8} />
      </group>
    </Float>
  );
}
