import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Grid, Sparkles } from "@react-three/drei";
import { ZONE_META } from "./data";
import { WALLS, WallSpec } from "./colliders";

function Wall({ pos, size }: WallSpec) {
  return (
    <group position={pos}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={size} />
        <meshStandardMaterial color="#141c32" metalness={0.25} roughness={0.62} />
      </mesh>
      <mesh position={[0, size[1] / 2 + 0.02, 0]}>
        <boxGeometry args={[size[0] * 0.995, 0.07, size[2] * 0.995]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Carpet({
  center,
  color,
}: {
  center: [number, number, number];
  color: string;
}) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[center[0], 0.02, center[2]]} receiveShadow>
      <planeGeometry args={[20.5, 20.5]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.09}
        emissive={color}
        emissiveIntensity={0.35}
        roughness={0.9}
      />
    </mesh>
  );
}

function NeonSign({
  position,
  color,
  label,
}: {
  position: [number, number, number];
  color: string;
  label: string;
}) {
  const w = Math.max(4.2, label.length * 0.55);
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[w, 0.7, 0.12]} />
        <meshStandardMaterial color="#0b1220" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.08]}>
        <boxGeometry args={[w - 0.18, 0.5, 0.04]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Bench({ position, rot = 0 }: { position: [number, number, number]; rot?: number }) {
  return (
    <group position={position} rotation-y={rot}>
      <mesh position={[0, 0.28, 0]} castShadow>
        <boxGeometry args={[1.8, 0.12, 0.55]} />
        <meshStandardMaterial color="#1e293b" metalness={0.3} roughness={0.5} />
      </mesh>
      <mesh position={[-0.75, 0.14, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.75, 0.14, 0]}>
        <boxGeometry args={[0.1, 0.28, 0.5]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
    </group>
  );
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.18, 0]}>
        <cylinderGeometry args={[0.18, 0.22, 0.36, 8]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0, 0.7, 0]} castShadow>
        <coneGeometry args={[0.42, 0.9, 7]} />
        <meshStandardMaterial color="#14532d" emissive="#166534" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}

export function Studio() {
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[48, 48]} />
        <meshStandardMaterial color="#0b1020" metalness={0.35} roughness={0.72} />
      </mesh>

      <Grid
        args={[48, 48]}
        cellSize={1}
        cellThickness={0.6}
        cellColor="#1e3a5f"
        sectionSize={4}
        sectionThickness={1.1}
        sectionColor="#164e63"
        fadeDistance={42}
        fadeStrength={1.4}
        infiniteGrid={false}
        position={[0, 0.03, 0]}
      />

      <Carpet center={ZONE_META.CONCEPT.center} color={ZONE_META.CONCEPT.color} />
      <Carpet center={ZONE_META.PROTOTYPE.center} color={ZONE_META.PROTOTYPE.color} />
      <Carpet center={ZONE_META.PRODUCTION.center} color={ZONE_META.PRODUCTION.color} />
      <Carpet center={ZONE_META.LAUNCH.center} color={ZONE_META.LAUNCH.color} />

      {WALLS.map((w, i) => (
        <Wall key={i} {...w} />
      ))}

      {/* corridor neon strips */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.04, 0]}>
        <planeGeometry args={[5.6, 5.6]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={0.25}
          transparent
          opacity={0.16}
        />
      </mesh>

      <NeonSign position={[-12, 3.4, -23.4]} color="#22d3ee" label="CONCEPT" />
      <NeonSign position={[12, 3.4, -23.4]} color="#4ade80" label="PROTOTYPE" />
      <NeonSign position={[-12, 3.4, 23.4]} color="#fb923c" label="PRODUCTION" />
      <NeonSign position={[12, 3.4, 23.4]} color="#e879f9" label="LAUNCH" />

      {/* hub core */}
      <HubCore />

      <pointLight position={[-12, 5.2, -12]} color="#22d3ee" intensity={18} distance={18} />
      <pointLight position={[12, 5.2, -12]} color="#4ade80" intensity={18} distance={18} />
      <pointLight position={[-12, 5.2, 12]} color="#fb923c" intensity={18} distance={18} />
      <pointLight position={[12, 5.2, 12]} color="#e879f9" intensity={18} distance={18} />
      <pointLight position={[0, 6, 0]} color="#e8eefb" intensity={10} distance={14} />

      <Bench position={[-12, 0, -6.5]} />
      <Bench position={[12, 0, -6.5]} />
      <Bench position={[-12, 0, 6.5]} />
      <Bench position={[12, 0, 6.5]} />

      <Plant position={[-21.5, 0, -21.5]} />
      <Plant position={[21.5, 0, -21.5]} />
      <Plant position={[-21.5, 0, 21.5]} />
      <Plant position={[21.5, 0, 21.5]} />

      <Sparkles count={40} scale={[46, 6, 46]} size={2} speed={0.4} opacity={0.45} color="#a5f3fc" />
    </group>
  );
}

function HubCore() {
  const core = useRef<THREE.Mesh>(null);
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (core.current) core.current.rotation.y += dt * 0.45;
    if (ring.current) ring.current.rotation.y -= dt * 0.7;
  });
  return (
    <group position={[0, 0, 0]}>
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[1.6, 1.8, 0.3, 16]} />
        <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={core} position={[0, 1.3, 0]}>
        <icosahedronGeometry args={[0.7, 0]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#22d3ee"
          emissiveIntensity={1.4}
          metalness={0.3}
          roughness={0.2}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={ring} position={[0, 1.3, 0]} rotation={[0, Math.PI / 5, 0.3]}>
        <torusGeometry args={[1.05, 0.04, 8, 32]} />
        <meshStandardMaterial
          color="#e879f9"
          emissive="#e879f9"
          emissiveIntensity={1.2}
          toneMapped={false}
        />
      </mesh>
      <Sparkles count={18} scale={2.4} size={3} speed={0.8} color="#22d3ee" />
    </group>
  );
}
