import {
  lazy,
  Suspense,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { useVisibilityPause } from "../../lib/useVisibilityPause";

const Scene = lazy(() => import("./Scene"));

type Phase = "idle" | "active";
type Frameloop = "always" | "demand" | "never";

function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export default function Viewer3D() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [paused, setPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const frameRef = useRef<HTMLDivElement>(null);
  const pointer = useRef({ x: 0, y: 0 });

  const visible = useVisibilityPause(frameRef);
  const reduced = useReducedMotion();

  const running = phase === "active" && visible && !paused && !reduced;
  const frameloop: Frameloop =
    phase === "idle" || paused || !visible ? "never" : reduced ? "demand" : "always";

  const status = reduced
    ? "Vista estática"
    : !visible
      ? "Pausado · fuera de vista"
      : paused
        ? "Pausado"
        : "Render activo";

  const start = () => {
    if (!supportsWebGL()) {
      setError("Este navegador no expone WebGL. Puedo mostrarte el caso en una llamada.");
      return;
    }

    setError(null);
    setPhase("active");
    setPaused(false);
  };

  const stop = () => {
    setPhase("idle");
    setPaused(false);
    pointer.current = { x: 0, y: 0 };
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (phase !== "active" || reduced) return;

    const rect = event.currentTarget.getBoundingClientRect();
    pointer.current = {
      x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
      y: ((event.clientY - rect.top) / rect.height) * 2 - 1,
    };
  };

  const onPointerLeave = () => {
    pointer.current = { x: 0, y: 0 };
  };

  return (
    <div
      ref={frameRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className="absolute inset-0 overflow-hidden bg-[#070b0e]"
    >
      {phase === "idle" ? (
        <div className="absolute inset-0 grid place-items-center bg-[radial-gradient(circle_at_50%_42%,rgba(34,211,238,0.14),transparent_58%)]">
          <div className="bg-grid absolute inset-0 opacity-40" aria-hidden="true" />

          <svg
            className="absolute h-[70%] max-h-[340px] w-auto opacity-60"
            viewBox="0 0 400 400"
            aria-hidden="true"
          >
            <circle cx="200" cy="200" r="150" fill="none" stroke="#1b3a43" strokeDasharray="2 8" />
            <circle cx="200" cy="200" r="105" fill="none" stroke="#16313a" />
            <circle cx="200" cy="200" r="60" fill="none" stroke="#1b3a43" strokeDasharray="2 6" />
            <path d="M200 40v320M40 200h320" stroke="#12252c" />
            <circle cx="200" cy="50" r="2.5" fill="#22d3ee" />
            <circle cx="311" cy="262" r="2" fill="#3b82f6" />
            <circle cx="122" cy="307" r="1.6" fill="#22d3ee" />
          </svg>

          <div className="relative z-10 flex flex-col items-center gap-5 px-6 text-center">
            <button
              type="button"
              onClick={start}
              aria-label="Activar visor 3D interactivo"
              className="group flex h-14 w-14 items-center justify-center border border-acid/50 bg-acid/10 text-acid transition-colors duration-200 hover:border-acid hover:bg-acid hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d="M8 5v14l11-7Z" />
              </svg>
            </button>

            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-white">
                {error ? "Reintentar" : "Activar visor 3D"}
              </p>
              <p className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500">
                Geometría generada en tiempo real · 0 assets
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="max-w-xs border border-red-400/20 bg-red-400/5 px-3 py-2 font-mono text-[10px] leading-relaxed text-red-400"
              >
                {error}
              </p>
            )}
          </div>

          <span className="absolute bottom-4 left-4 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
            14 × 14 · instanced mesh
          </span>
          <span className="absolute right-4 top-4 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-600">
            standby
          </span>
        </div>
      ) : (
        <>
          <div className="absolute inset-0" aria-hidden="true">
            <Suspense
              fallback={
                <div className="absolute inset-0 grid place-items-center bg-ink">
                  <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                    <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-acid" />
                    Cargando geometría…
                  </p>
                </div>
              }
            >
              <Scene frameloop={frameloop} pointer={pointer} interactive={!reduced} />
            </Suspense>
          </div>

          <div className="pointer-events-none absolute inset-0 z-10">
            <div className="absolute left-4 top-4 border border-white/10 bg-ink/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-400 backdrop-blur-sm">
              twin_core / render
            </div>

            <div className="absolute right-4 top-4 flex items-center gap-2 border border-white/10 bg-ink/60 px-2 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-300 backdrop-blur-sm">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  running ? "animate-pulse bg-emerald-400" : "bg-amber-400"
                }`}
              />
              {status}
            </div>

            <span className="absolute bottom-4 left-4 hidden font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-500 sm:block">
              {reduced ? "Vista estática · reduced motion" : "Arrastra para orbitar"}
            </span>
          </div>

          <div className="absolute bottom-4 right-4 z-20 flex gap-2">
            {!reduced && (
              <button
                type="button"
                onClick={() => setPaused((value) => !value)}
                className="inline-flex h-8 items-center gap-1.5 border border-white/15 bg-ink/80 px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-300 backdrop-blur transition-colors hover:border-white/40 hover:text-white"
              >
                {paused ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path d="M8 5v14l11-7Z" />
                  </svg>
                ) : (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-3 w-3"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <rect x="7" y="5" width="3.5" height="14" rx="1" />
                    <rect x="13.5" y="5" width="3.5" height="14" rx="1" />
                  </svg>
                )}
                {paused ? "Reanudar" : "Pausar"}
              </button>
            )}

            <button
              type="button"
              onClick={stop}
              className="inline-flex h-8 items-center gap-1.5 border border-white/15 bg-ink/80 px-2.5 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-300 backdrop-blur transition-colors hover:border-red-400/50 hover:text-red-300"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-2.5 w-2.5"
                fill="currentColor"
                aria-hidden="true"
              >
                <rect x="6" y="6" width="12" height="12" rx="1" />
              </svg>
              Detener
            </button>
          </div>
        </>
      )}
    </div>
  );
}
