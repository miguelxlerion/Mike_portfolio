import { useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { PROJECTS, Project } from "./data";
import { player } from "./playerState";
import { getState, inspect } from "./store";
import { sfx } from "./audio";

export function Projects() {
  return (
    <group>
      {PROJECTS.map((p) => (
        <ProjectNode key={p.id} project={p} />
      ))}
    </group>
  );
}

function ProjectNode({ project }: { project: Project }) {
  const root = useRef<THREE.Group>(null);
  const lift = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);
  const pulse = useRef(0);

  useFrame((_, dt) => {
    const selected = getState().selectedId === project.id;
    const known = getState().discovered.includes(project.id);
    pulse.current += dt;
    if (lift.current) {
      const tY = selected ? 1.15 : 0;
      const tS = selected ? 1.55 : hovered ? 1.1 : 1;
      lift.current.position.y += (tY - lift.current.position.y) * Math.min(1, dt * 6);
      const s = lift.current.scale.x + (tS - lift.current.scale.x) * Math.min(1, dt * 6);
      lift.current.scale.setScalar(s);
      if (selected) lift.current.rotation.y += dt * 0.55;
      else if (!known) lift.current.rotation.y += dt * 0.12;
    }
  });

  const dist = () =>
    Math.hypot(player.x - project.position[0], player.z - project.position[2]);

  return (
    <group ref={root} position={project.position}>
      <Pedestal color={project.accent} />
      <group
        ref={lift}
        onClick={(e) => {
          e.stopPropagation();
          sfx.ensure();
          inspect(project.id);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
          document.body.style.cursor = "pointer";
        }}
        onPointerOut={() => {
          setHovered(false);
          document.body.style.cursor = "auto";
        }}
      >
        <PropMesh project={project} />
        <mesh position={[0, 0.9, 0]}>
          <sphereGeometry args={[1.15, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>
      <NearbyLabel project={project} dist={dist} hovered={hovered} />
      <Ring color={project.accent} />
    </group>
  );
}

function NearbyLabel({
  project,
  dist,
  hovered,
}: {
  project: Project;
  dist: () => number;
  hovered: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (!ref.current) return;
    const d = dist();
    const selected = getState().selectedId === project.id;
    const show = hovered || selected || d < 6.5;
    ref.current.style.opacity = show ? "1" : "0";
  });
  return (
    <Html position={[0, 2.35, 0]} center distanceFactor={10} style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        className="font-arcade whitespace-nowrap text-[9px] tracking-widest"
        style={{
          color: project.accent,
          textShadow: `0 0 10px ${project.accent}`,
          opacity: 0,
          transition: "opacity 0.2s",
        }}
      >
        {project.title}
      </div>
    </Html>
  );
}

function Pedestal({ color }: { color: string }) {
  return (
    <group>
      <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.7, 0.82, 0.24, 10]} />
        <meshStandardMaterial color="#0f172a" metalness={0.45} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.62, 0.62, 0.05, 10]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function Ring({ color }: { color: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const known = false;
    const s = 1 + Math.sin(clock.elapsedTime * 2.4) * 0.06;
    ref.current.scale.set(s, 1, s);
    const mat = ref.current.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity = known ? 0.3 : 0.7 + Math.sin(clock.elapsedTime * 3) * 0.4;
  });
  return (
    <mesh ref={ref} rotation-x={-Math.PI / 2} position={[0, 0.05, 0]}>
      <ringGeometry args={[0.9, 1.05, 24]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={0.8}
        transparent
        opacity={0.85}
        toneMapped={false}
      />
    </mesh>
  );
}

function PropMesh({ project }: { project: Project }) {
  switch (project.kind) {
    case "cabinet":
      return <Cabinet project={project} />;
    case "holo":
      return <Holo project={project} />;
    case "greybox":
      return <Greybox project={project} />;
    case "console":
      return <Console project={project} />;
    case "easel":
      return <Easel project={project} />;
    case "crate":
      return <Crate project={project} />;
    case "trailer":
      return <Trailer project={project} />;
    default:
      return <Cabinet project={project} />;
  }
}

function Screen({ url, w, h }: { url: string; w: number; h: number }) {
  const tex = useTexture(url);
  useMemo(() => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
  }, [tex]);
  return (
    <mesh>
      <planeGeometry args={[w, h]} />
      <meshStandardMaterial map={tex} emissive="#ffffff" emissiveIntensity={0.18} roughness={0.35} />
    </mesh>
  );
}

function Cabinet({ project }: { project: Project }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <boxGeometry args={[0.95, 1.7, 0.7]} />
        <meshStandardMaterial color="#111827" metalness={0.4} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.55, 0.36]}>
        <boxGeometry args={[0.82, 0.18, 0.08]} />
        <meshStandardMaterial
          color={project.accent}
          emissive={project.accent}
          emissiveIntensity={1.5}
          toneMapped={false}
        />
      </mesh>
      <group position={[0, 1.05, 0.37]}>
        <Screen url={project.image} w={0.72} h={0.52} />
      </group>
      <mesh position={[0, 0.42, 0.22]} rotation-x={-0.4} castShadow>
        <boxGeometry args={[0.86, 0.12, 0.4]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[-0.18, 0.46, 0.32]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
      </mesh>
      <mesh position={[0.18, 0.46, 0.32]}>
        <cylinderGeometry args={[0.05, 0.05, 0.04, 8]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Holo({ project }: { project: Project }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (ring.current) ring.current.rotation.y += dt * 1.4;
  });
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.45, 0.4, 10]} />
        <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh ref={ring} position={[0, 1.15, 0]}>
        <torusGeometry args={[0.62, 0.035, 8, 24]} />
        <meshStandardMaterial
          color={project.accent}
          emissive={project.accent}
          emissiveIntensity={1.6}
          toneMapped={false}
        />
      </mesh>
      <group position={[0, 1.15, 0]}>
        <Screen url={project.image} w={0.9} h={0.62} />
      </group>
    </group>
  );
}

function Greybox({ project }: { project: Project }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[-0.25, 0.35, 0.1]} castShadow>
        <boxGeometry args={[0.5, 0.7, 0.5]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.9} />
      </mesh>
      <mesh position={[0.28, 0.22, -0.05]} castShadow>
        <boxGeometry args={[0.4, 0.44, 0.4]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.85} />
      </mesh>
      <mesh position={[0.05, 0.85, 0.05]} castShadow>
        <boxGeometry args={[0.32, 0.32, 0.32]} />
        <meshStandardMaterial color="#64748b" />
      </mesh>
      <group position={[0.05, 1.18, 0.22]}>
        <Screen url={project.image} w={0.55} h={0.36} />
      </group>
    </group>
  );
}

function Console({ project }: { project: Project }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <boxGeometry args={[1.15, 0.28, 0.7]} />
        <meshStandardMaterial color="#1e293b" metalness={0.4} roughness={0.4} />
      </mesh>
      <group position={[0, 0.55, 0]} rotation-x={-0.35}>
        <Screen url={project.image} w={0.85} h={0.5} />
      </group>
      <mesh position={[-0.28, 0.38, 0.22]}>
        <boxGeometry args={[0.12, 0.04, 0.12]} />
        <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={1} />
      </mesh>
      <mesh position={[-0.1, 0.38, 0.22]}>
        <boxGeometry args={[0.12, 0.04, 0.12]} />
        <meshStandardMaterial color="#e879f9" emissive="#e879f9" emissiveIntensity={1} />
      </mesh>
      <mesh position={[0.28, 0.4, 0.2]}>
        <sphereGeometry args={[0.07, 8, 8]} />
        <meshStandardMaterial color={project.accent} emissive={project.accent} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

function Easel({ project }: { project: Project }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[-0.22, 0.7, 0]} rotation-z={0.18} castShadow>
        <boxGeometry args={[0.06, 1.5, 0.06]} />
        <meshStandardMaterial color="#57534e" />
      </mesh>
      <mesh position={[0.22, 0.7, 0]} rotation-z={-0.18} castShadow>
        <boxGeometry args={[0.06, 1.5, 0.06]} />
        <meshStandardMaterial color="#57534e" />
      </mesh>
      <mesh position={[0, 0.95, 0.05]} rotation-x={-0.08}>
        <boxGeometry args={[0.95, 0.72, 0.05]} />
        <meshStandardMaterial color="#1c1917" />
      </mesh>
      <group position={[0, 0.95, 0.09]} rotation-x={-0.08}>
        <Screen url={project.image} w={0.86} h={0.62} />
      </group>
    </group>
  );
}

function Crate({ project }: { project: Project }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.95, 0.9, 0.95]} />
        <meshStandardMaterial color="#7c2d12" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.45, 0.48]}>
        <boxGeometry args={[0.7, 0.08, 0.02]} />
        <meshStandardMaterial color={project.accent} emissive={project.accent} emissiveIntensity={1} />
      </mesh>
      <group position={[0, 1.15, 0.2]} rotation-y={0.2}>
        <Screen url={project.image} w={0.7} h={0.46} />
      </group>
    </group>
  );
}

function Trailer({ project }: { project: Project }) {
  return (
    <group position={[0, 0.28, 0]}>
      <mesh position={[0, 0.9, -0.1]} castShadow>
        <boxGeometry args={[1.35, 0.08, 0.08]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[-0.6, 0.5, -0.1]} castShadow>
        <boxGeometry args={[0.08, 1, 0.08]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <mesh position={[0.6, 0.5, -0.1]} castShadow>
        <boxGeometry args={[0.08, 1, 0.08]} />
        <meshStandardMaterial color="#334155" />
      </mesh>
      <group position={[0, 0.95, -0.04]}>
        <Screen url={project.image} w={1.2} h={0.68} />
      </group>
      <mesh position={[0, 0.2, 0.15]} castShadow>
        <boxGeometry args={[0.35, 0.28, 0.12]} />
        <meshStandardMaterial color="#111827" />
      </mesh>
    </group>
  );
}
