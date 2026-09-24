import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { player } from "./playerState";
import { getState, tick } from "./store";
import { getProject } from "./data";

const _desired = new THREE.Vector3();
const _look = new THREE.Vector3();
const _dir = new THREE.Vector3();

export function CameraRig() {
  const { camera } = useThree();
  const look = useRef(new THREE.Vector3(-16, 1.1, -16));

  useFrame(({ clock }, dt) => {
    const d = Math.min(dt, 0.05);
    tick(d);
    const st = getState();

    if (st.screen === "menu") {
      const t = clock.elapsedTime * 0.14;
      _desired.set(Math.sin(t) * 24, 12.5, Math.cos(t) * 24);
      _look.set(0, 1.2, 0);
    } else if (st.selectedId) {
      const p = getProject(st.selectedId);
      if (p) {
        _dir.set(-p.position[0], 0, -p.position[2]);
        if (_dir.lengthSq() < 0.2) _dir.set(0, 0, 1);
        else _dir.normalize();
        _desired.set(
          p.position[0] + _dir.x * 4.4,
          2.45,
          p.position[2] + _dir.z * 4.4
        );
        _look.set(p.position[0], 1.35, p.position[2]);
      }
    } else {
      const back = 5.4;
      const height = 3.15;
      _desired.set(
        player.x - Math.sin(player.facing) * back,
        player.y + height,
        player.z - Math.cos(player.facing) * back
      );
      _look.set(player.x, player.y + 1.15, player.z);
    }

    const k = 1 - Math.exp(-d * (st.selectedId ? 3.2 : 5.5));
    camera.position.lerp(_desired, k);
    look.current.lerp(_look, k);
    camera.lookAt(look.current);

    if (st.shake > 0.25) {
      const s = st.shake * 0.035;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s;
    }
  });

  return null;
}
