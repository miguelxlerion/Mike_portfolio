import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { Model3D } from "../data/content";

// ─────────────────────────────────────────────
//  IMPORTANTE RENDIMIENTO:
//  Este módulo (y three.js, ~600 KB) vive en un chunk separado gracias a
//  React.lazy en Viewer3D: no se descarga ni ejecuta hasta que el visitante
//  pulsa "Ver en 3D". Un solo canvas activo, sin sombras, DPR limitado,
//  loop pausado fuera de pantalla y dispose total al salir.
// ─────────────────────────────────────────────

interface Props {
  model: Model3D;
  quality: "auto" | "high" | "low";
  autoRotate: boolean;
  onStats?: (tris: number, fps: number) => void;
}

function buildProcedural(preset: Model3D["preset"]): THREE.Group {
  const g = new THREE.Group();
  const acid = new THREE.Color("#a3e635");

  if (preset === "cristal") {
    const glass = new THREE.MeshPhysicalMaterial({
      color: "#9fd8ff",
      metalness: 0,
      roughness: 0.12,
      transparent: true,
      opacity: 0.82,
      clearcoat: 1,
      emissive: "#1a3a55",
      emissiveIntensity: 0.7,
    });
    const spots: [number, number, number, number][] = [
      [0, 0.4, 0, 1.1],
      [-1.2, -0.3, 0.3, 0.7],
      [1.1, -0.4, -0.2, 0.8],
      [0.2, -0.9, 0.7, 0.5],
      [-0.3, 0.9, -0.7, 0.55],
    ];
    for (const [x, y, z, s] of spots) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(s, 0), glass);
      m.position.set(x, y, z);
      m.rotation.set(x, y, z);
      g.add(m);
    }
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.28, 1),
      new THREE.MeshStandardMaterial({ color: "#0a0a0b", emissive: acid, emissiveIntensity: 2.2 }),
    );
    core.position.y = 0.4;
    g.add(core);
  } else if (preset === "toroide") {
    const m = new THREE.Mesh(
      new THREE.TorusKnotGeometry(1, 0.32, 200, 28),
      new THREE.MeshStandardMaterial({ color: "#2a2d35", metalness: 0.9, roughness: 0.28, emissive: "#111318" }),
    );
    g.add(m);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(1.9, 0.03, 12, 128),
      new THREE.MeshStandardMaterial({ color: "#0a0a0b", emissive: acid, emissiveIntensity: 1.6 }),
    );
    ring.rotation.x = Math.PI / 2.4;
    g.add(ring);
  } else {
    // reactor (y fallback)
    const core = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1, 1),
      new THREE.MeshStandardMaterial({ color: "#1a1d24", metalness: 0.85, roughness: 0.35 }),
    );
    g.add(core);
    const wire = new THREE.Mesh(
      new THREE.IcosahedronGeometry(1.02, 1),
      new THREE.MeshBasicMaterial({ color: acid, wireframe: true, transparent: true, opacity: 0.35 }),
    );
    g.add(wire);
    const glow = new THREE.Mesh(
      new THREE.SphereGeometry(0.45, 24, 24),
      new THREE.MeshStandardMaterial({ color: "#0a0a0b", emissive: acid, emissiveIntensity: 3 }),
    );
    g.add(glow);
    for (const [rx, rz, r] of [[0.4, 0, 1.7], [-0.5, 0.6, 2.1]] as const) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(r, 0.035, 12, 128),
        new THREE.MeshStandardMaterial({ color: "#3a3f4a", metalness: 0.9, roughness: 0.3 }),
      );
      ring.rotation.set(rx, 0, rz);
      g.add(ring);
    }
  }
  return g;
}

export default function ModelCanvas({ model, quality, autoRotate, onStats }: Props) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const autoRef = useRef(autoRotate);
  const statsRef = useRef(onStats);

  useEffect(() => {
    autoRef.current = autoRotate;
  }, [autoRotate]);
  useEffect(() => {
    statsRef.current = onStats;
  }, [onStats]);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    let disposed = false;
    setError(null);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    const dprCap = quality === "low" ? 1 : quality === "high" ? Math.min(window.devicePixelRatio || 1, 2) : Math.min(window.devicePixelRatio || 1, 1.75);
    renderer.setPixelRatio(dprCap);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "pan-y";
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 100);
    camera.position.set(0, 1.2, 8);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x0a0a0b, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 1.4);
    key.position.set(4, 6, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color("#a3e635"), 0.8);
    rim.position.set(-6, -2, -4);
    scene.add(rim);

    const grid = new THREE.GridHelper(14, 28, 0x2a2d35, 0x1a1c22);
    grid.position.y = -2.2;
    scene.add(grid);

    // Rig con inercia: arrastre rota, velocidad decae sola
    const rig = new THREE.Group();
    scene.add(rig);
    const target = { x: 0.15, y: 0.6 };
    const current = { x: 0.15, y: 0.6 };
    const vel = { x: 0, y: 0 };
    let dragging = false;
    let last = { x: 0, y: 0 };
    let dist = 8;

    const el = renderer.domElement;
    const onDown = (e: PointerEvent) => {
      dragging = true;
      last = { x: e.clientX, y: e.clientY };
      el.setPointerCapture(e.pointerId);
      el.style.cursor = "grabbing";
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - last.x;
      const dy = e.clientY - last.y;
      last = { x: e.clientX, y: e.clientY };
      target.y += dx * 0.008;
      target.x += dy * 0.008;
      target.x = Math.max(-1.2, Math.min(1.2, target.x));
      vel.x = dy * 0.008;
      vel.y = dx * 0.008;
    };
    const onUp = () => {
      dragging = false;
      el.style.cursor = "grab";
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      dist = Math.max(3.5, Math.min(14, dist + e.deltaY * 0.005));
    };
    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    el.addEventListener("wheel", onWheel, { passive: false });

    let extraSpin: THREE.Object3D[] = [];

    const fitCamera = () => {
      const box = new THREE.Box3().setFromObject(rig);
      const size = box.getSize(new THREE.Vector3()).length();
      const center = box.getCenter(new THREE.Vector3());
      rig.position.sub(center);
      grid.position.y = -size / 2 - 0.4;
      dist = Math.max(3.5, Math.min(14, size * 1.9));
    };

    const finishLoad = () => {
      if (disposed) return;
      fitCamera();
    };

    if (model.preset === "custom" && model.modelUrl) {
      // GLTFLoader también diferido: solo pesa si hay un .glb que cargar
      import("three/examples/jsm/loaders/GLTFLoader.js")
        .then(({ GLTFLoader }) => {
          if (disposed) return;
          new GLTFLoader().load(
            model.modelUrl!,
            (gltf) => {
              if (disposed) return;
              const obj = gltf.scene;
              // Normalizar escala para encuadre consistente
              const box = new THREE.Box3().setFromObject(obj);
              const size = box.getSize(new THREE.Vector3()).length() || 1;
              obj.scale.multiplyScalar(3.2 / size);
              rig.add(obj);
              finishLoad();
            },
            undefined,
            () => {
              if (!disposed) setError("No se pudo cargar el modelo. Revisa la URL del .glb en el panel.");
            },
          );
        })
        .catch(() => {
          if (!disposed) setError("No se pudo iniciar el cargador 3D.");
        });
    } else {
      const demo = buildProcedural(model.preset);
      extraSpin = [...demo.children];
      rig.add(demo);
      finishLoad();
    }

    const resize = () => {
      const w = mount.clientWidth || 1;
      const h = mount.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    // Pausar el loop fuera de pantalla o con pestaña oculta = 0% GPU en reposo.
    // OJO: document.hidden se consulta en vivo cada frame; no se "engancha"
    // en un flag porque la pestaña puede ocultarse y volver muchas veces.
    let visible = true;
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    io.observe(mount);

    let raf = 0;
    let lastT = performance.now();
    let fps = 60;
    let lastStat = 0;
    const spin = !reduced;

    const loop = (t: number) => {
      raf = requestAnimationFrame(loop);
      if (!visible || document.hidden) {
        lastT = t;
        return;
      }
      const dt = Math.min(0.05, (t - lastT) / 1000);
      lastT = t;
      fps += ((1 / Math.max(dt, 1e-4) - fps) * 0.05);

      if (!dragging) {
        if (autoRef.current && spin) target.y += dt * 0.5;
        // Inercia residual
        target.y += vel.y;
        target.x += vel.x;
        target.x = Math.max(-1.2, Math.min(1.2, target.x));
        vel.x *= 0.93;
        vel.y *= 0.93;
      }
      current.x += (target.x - current.x) * Math.min(1, dt * 10);
      current.y += (target.y - current.y) * Math.min(1, dt * 10);
      rig.rotation.set(current.x, current.y, 0);
      if (spin && model.preset === "toroide" && extraSpin.length > 0) extraSpin[0].rotation.z += dt * 0.4;

      camera.position.set(0, 1.2, dist);
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);

      if (t - lastStat > 600) {
        lastStat = t;
        statsRef.current?.(renderer.info.render.triangles, Math.round(fps));
      }
    };
    raf = requestAnimationFrame(loop);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      el.removeEventListener("wheel", onWheel);
      scene.traverse((o) => {
        const mesh = o as THREE.Mesh;
        if (mesh.geometry) mesh.geometry.dispose();
        const mat = (mesh as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else if (mat) mat.dispose();
      });
      renderer.dispose();
      mount.removeChild(el);
    };
  }, [model.id, model.preset, model.modelUrl, quality]);

  return (
    <div className="relative h-full w-full">
      <div ref={mountRef} className="absolute inset-0" />
      {error && (
        <div className="absolute inset-0 grid place-items-center bg-ink/80 p-6 text-center">
          <p className="max-w-xs text-sm text-amber-200">{error}</p>
        </div>
      )}
    </div>
  );
}
