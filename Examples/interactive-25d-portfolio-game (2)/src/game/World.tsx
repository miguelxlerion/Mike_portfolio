import { memo } from "react";
import { Canvas } from "@react-three/fiber";
import { ContactShadows, Stars } from "@react-three/drei";
import { Studio } from "./Studio";
import { Player } from "./Player";
import { Projects } from "./Projects";
import { Bugs } from "./Bugs";
import { Orbs } from "./Orbs";
import { CameraRig } from "./CameraRig";
import { sfx } from "./audio";

export const GameCanvas = memo(function GameCanvas() {
  return (
    <Canvas
      dpr={[1, 1.75]}
      shadows
      gl={{
        antialias: true,
        powerPreference: "high-performance",
        toneMappingExposure: 1.05,
      }}
      camera={{ fov: 50, near: 0.12, far: 90, position: [-16, 6.5, -3] }}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      onPointerDown={() => sfx.ensure()}
    >
      <color attach="background" args={["#070b16"]} />
      <fog attach="fog" args={["#070b16", 18, 56]} />
      <ambientLight intensity={0.18} />
      <hemisphereLight args={["#93c5fd", "#020617", 0.55]} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.05}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-camera-left={-24}
        shadow-camera-right={24}
        shadow-camera-top={24}
        shadow-camera-bottom={-24}
      />
      <Stars radius={70} depth={30} count={500} factor={2.8} fade speed={0.5} />
      <Studio />
      <Projects />
      <Orbs />
      <Bugs />
      <Player />
      <CameraRig />
      <ContactShadows
        position={[0, 0.01, 0]}
        opacity={0.42}
        scale={52}
        blur={2.4}
        far={9}
      />
    </Canvas>
  );
});
