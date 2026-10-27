import { Canvas, useFrame } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";

interface SceneProps {
  frameloop: "always" | "demand" | "never";
  pointer: RefObject<{ x: number; y: number }>;
  interactive: boolean;
}

interface Block {
  x: number;
  z: number;
  h: number;
  accent: boolean;
}

const GRID = 14;

function useBlocks() {
  return useMemo<Block[]>(() => {
    const blocks: Block[] = [];

    for (let i = 0; i < GRID; i += 1) {
      for (let j = 0; j < GRID; j += 1) {
        const di = i - GRID / 2;
        const dj = j - GRID / 2;
        const distance = Math.hypot(di, dj);
        if (distance > GRID * 0.62) continue;

        const h =
          0.14 +
          Math.abs(Math.sin(i * 1.7 + j * 2.3)) * (distance < 2.6 ? 2.1 : 1.15) +
          (i % 5 === 0 ? 0.35 : 0);

        blocks.push({
          x: di * 0.34,
          z: dj * 0.34,
          h,
          accent: (i * 7 + j * 13) % 23 === 0,
        });
      }
    }

    return blocks;
  }, []);
}

function TwinCity({ pointer, interactive }: Omit<SceneProps, "frameloop">) {
  const group = useRef<THREE.Group>(null);
  const mesh = useRef<THREE.InstancedMesh>(null);
  const autoRotation = useRef(0);
  const blocks = useBlocks();

  const dust = useMemo(() => {
    const count = 90;
    const positions = new Float32Array(count * 3);

    for (let i = 0; i < count; i += 1) {
      const angle = (i / count) * Math.PI * 2;
      const radius = 3.15 + (i % 7) * 0.07;
      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = 0.45 + (i % 13) * 0.16;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
    }

    return positions;
  }, []);

  useLayoutEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    blocks.forEach((block, index) => {
      dummy.position.set(block.x, block.h / 2, block.z);
      dummy.scale.set(0.24, block.h, 0.24);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);

      color.set(block.accent ? "#22d3ee" : index % 11 === 0 ? "#3b82f6" : "#22333d");
      instanced.setColorAt(index, color);
    });

    instanced.instanceMatrix.needsUpdate = true;
    if (instanced.instanceColor) instanced.instanceColor.needsUpdate = true;
  }, [blocks]);

  useFrame((_, delta) => {
    const wrapper = group.current;
    if (!wrapper) return;

    const dt = Math.min(delta, 0.05);
    if (interactive) autoRotation.current += dt * 0.12;

    const targetY = autoRotation.current + pointer.current.x * 0.55;
    const targetX = -0.1 + pointer.current.y * 0.18;
    const ease = Math.min(1, dt * 3.2);

    wrapper.rotation.y += (targetY - wrapper.rotation.y) * ease;
    wrapper.rotation.x += (targetX - wrapper.rotation.x) * ease;
  });

  return (
    <group ref={group}>
      <instancedMesh ref={mesh} args={[undefined, undefined, blocks.length]}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color="#ffffff"
          roughness={0.42}
          metalness={0.45}
          emissive="#0b2b33"
          emissiveIntensity={0.35}
        />
      </instancedMesh>

      <gridHelper args={[13, 26, "#1e3b45", "#101b21"]} position={[0, 0, 0]} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[3.55, 3.57, 96]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.3} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <ringGeometry args={[2.25, 2.26, 96]} />
        <meshBasicMaterial color="#3b82f6" transparent opacity={0.22} />
      </mesh>

      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dust, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.038}
          color="#22d3ee"
          transparent
          opacity={0.75}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

export default function Scene({ frameloop, pointer, interactive }: SceneProps) {
  return (
    <Canvas
      frameloop={frameloop}
      dpr={[1, 1.75]}
      camera={{ position: [4.6, 4.1, 5.8], fov: 38, near: 0.1, far: 40 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      onCreated={({ camera }) => camera.lookAt(0, 0.5, 0)}
    >
      <fog attach="fog" args={["#070b0e", 7.5, 16]} />
      <ambientLight intensity={0.78} />
      <directionalLight position={[4, 8, 3]} intensity={1.9} color="#dbeafe" />
      <pointLight position={[-4, 3.5, -3]} intensity={26} distance={16} color="#22d3ee" />
      <TwinCity pointer={pointer} interactive={interactive} />
    </Canvas>
  );
}
