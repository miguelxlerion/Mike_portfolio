import { useCallback, useEffect, useRef, useState } from "react";
import { Gallery } from "./three/gallery";
import { PROJECTS, Project } from "./three/projects";

type Phase = "start" | "gallery";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<Gallery | null>(null);
  const selectedRef = useRef<number | null>(null);
  const helpRef = useRef(false);

  const [phase, setPhase] = useState<Phase>("start");
  const [selected, setSelected] = useState<number | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [muted, setMuted] = useState(false);
  const [showHint, setShowHint] = useState(true);
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  selectedRef.current = selected;
  helpRef.current = helpOpen;

  // ---- engine lifecycle ---------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = new Gallery(canvas, {
      onSelect: (i) => setSelected(i),
    });
    engineRef.current = engine;
    engine.start();

    const parent = canvas.parentElement;
    let ro: ResizeObserver | null = null;
    if (parent) {
      ro = new ResizeObserver(() => {
        engine.resize(parent.clientWidth, parent.clientHeight);
      });
      ro.observe(parent);
      engine.resize(parent.clientWidth, parent.clientHeight);
    }
    return () => {
      ro?.disconnect();
      engine.destroy();
    };
  }, []);

  // ---- hint auto-hide ------------------------------------------------------
  useEffect(() => {
    if (phase !== "gallery") return;
    const id = window.setTimeout(() => setShowHint(false), 11000);
    return () => window.clearTimeout(id);
  }, [phase]);

  // ---- actions -------------------------------------------------------------
  const enter = useCallback(() => {
    engineRef.current?.unlock();
    setPhase("gallery");
    setShowHint(true);
  }, []);

  const closePanel = useCallback(() => engineRef.current?.close(), []);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      engineRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  // ---- keyboard ------------------------------------------------------------
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.code === "Enter" || e.code === "Space") && phase === "start") {
        e.preventDefault();
        enter();
        return;
      }
      if (e.code === "Escape") {
        if (selectedRef.current !== null) {
          e.preventDefault();
          closePanel();
        } else if (helpRef.current) {
          setHelpOpen(false);
        }
      }
      if (e.code === "KeyM") toggleMute();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, enter, closePanel, toggleMute]);

  const project = selected !== null ? PROJECTS[selected] : null;

  return (
    <div className="relative h-[100dvh] w-full overflow-hidden bg-[#05080f] select-none">
      {/* 3D canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ touchAction: "none" }}
      />

      {/* CRT dressing */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10" />
      <div className="vignette pointer-events-none absolute inset-0 z-10" />

      {phase === "gallery" && (
        <>
          {/* HUD top bar */}
          <header className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-5">
            <div>
              <div
                className="font-arcade text-sm text-cyan sm:text-base"
                style={{ textShadow: "0 0 14px rgba(34,211,238,0.6)" }}
              >
                DEVQUEST
              </div>
              <div className="mt-1 text-[9px] tracking-[0.35em] text-dim">
                INTERACTIVE 3D PORTFOLIO
              </div>
            </div>
            <div className="pointer-events-auto flex items-center gap-2">
              <HudButton onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
                {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
              </HudButton>
              <HudButton onClick={() => setHelpOpen(true)} label="Help">
                <HelpIcon />
              </HudButton>
            </div>
          </header>

          {/* bottom hint */}
          {showHint && selected === null && (
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center p-4 sm:p-6">
              <div className="animate-float-slow rounded-full border border-line bg-panel/80 px-5 py-2.5 backdrop-blur-sm">
                <span className="font-arcade text-[8px] tracking-widest text-dim sm:text-[9px]">
                  {isTouch
                    ? "DRAG TO LOOK · PINCH TO ZOOM · TAP A PROJECT"
                    : "DRAG TO LOOK · SCROLL TO ZOOM · WASD TO MOVE · CLICK A PROJECT"}
                </span>
              </div>
            </div>
          )}
        </>
      )}

      {/* start overlay */}
      {phase === "start" && <StartScreen onEnter={enter} isTouch={isTouch} />}

      {/* help modal */}
      {helpOpen && (
        <HelpModal isTouch={isTouch} onClose={() => setHelpOpen(false)} />
      )}

      {/* detail panel */}
      {project && (
        <DetailPanel
          project={project}
          index={selected ?? 0}
          onClose={closePanel}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Start screen
// ===========================================================================
function StartScreen({
  onEnter,
  isTouch,
}: {
  onEnter: () => void;
  isTouch: boolean;
}) {
  return (
    <div className="animate-fade-in absolute inset-0 z-40 flex items-center justify-center overflow-auto bg-gradient-to-b from-[#05080f]/95 via-[#0a1128]/90 to-[#05080f]/95 p-4">
      <div className="w-full max-w-xl py-6 text-center">
        <div
          className="font-arcade text-4xl text-cyan sm:text-6xl"
          style={{
            textShadow: "0 0 28px rgba(34,211,238,0.55), 0 5px 0 #0e7490",
          }}
        >
          DEVQUEST
        </div>
        <div className="mt-4 font-arcade text-[10px] tracking-[0.45em] text-magenta sm:text-xs">
          3D PORTFOLIO GALLERY
        </div>
        <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-dim">
          A floating exhibition hall with six game projects. Walk around,
          orbit the booths, and <span className="text-text">click any
          installation</span> — the camera flies in and the project expands
          with its full story, data, and credits.
        </p>

        <div className="mx-auto mt-7 grid max-w-md grid-cols-2 gap-3 text-left">
          <ControlCard k="DRAG" v="Look around" />
          <ControlCard k="SCROLL / PINCH" v="Zoom" />
          {!isTouch && <ControlCard k="WASD" v="Walk the hall" />}
          <ControlCard k="CLICK / TAP" v="Open a project" />
        </div>

        <div className="mt-8">
          <button
            className="btn btn-primary w-64 text-sm"
            onClick={onEnter}
          >
            ENTER THE GALLERY
          </button>
          <div className="animate-blink mt-4 font-arcade text-[9px] tracking-widest text-gold">
            PRESS ENTER
          </div>
        </div>

        <div className="mt-8 flex items-center justify-center gap-2 text-[9px] tracking-[0.3em] text-dim/70">
          {PROJECTS.map((p, i) => (
            <span key={p.id} className="flex items-center gap-2">
              <span
                className="inline-block h-1.5 w-1.5 rounded-full"
                style={{ background: p.accent, boxShadow: `0 0 8px ${p.accent}` }}
              />
              <span className="hidden sm:inline">{p.title}</span>
              {i < PROJECTS.length - 1 && <span className="text-line">/</span>}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

function ControlCard({ k, v }: { k: string; v: string }) {
  return (
    <div className="rounded-lg border border-line bg-panel/70 px-3 py-2.5">
      <div className="font-arcade text-[8px] tracking-widest text-cyan">{k}</div>
      <div className="mt-1.5 text-xs text-dim">{v}</div>
    </div>
  );
}

// ===========================================================================
// Detail panel
// ===========================================================================
function DetailPanel({
  project,
  index,
  onClose,
}: {
  project: Project;
  index: number;
  onClose: () => void;
}) {
  return (
    <div className="pointer-events-none fixed inset-0 z-30 flex items-end sm:items-stretch sm:justify-end">
      {/* mobile backdrop */}
      <div
        className="animate-fade-in absolute inset-0 bg-bg0/60 sm:hidden"
        onClick={onClose}
      />
      <aside className="pointer-events-auto relative flex max-h-[80vh] w-full flex-col overflow-hidden border-line bg-panel/95 backdrop-blur-md animate-[sheet-in_0.45s_cubic-bezier(0.22,1,0.36,1)] border-t-2 sm:h-full sm:max-h-none sm:w-[470px] sm:border-l-2 sm:border-t-0 sm:animate-[panel-in_0.45s_cubic-bezier(0.22,1,0.36,1)]">
        {/* accent bar */}
        <div
          className="h-1 w-full shrink-0"
          style={{
            background: `linear-gradient(90deg, ${project.accent}, transparent 70%)`,
          }}
        />
        {/* close */}
        <button
          onClick={onClose}
          aria-label="Close details"
          className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-bg0/80 text-dim transition-all hover:scale-105 hover:text-text"
        >
          <CloseIcon />
        </button>

        <div className="scroll-thin overflow-y-auto">
          {/* cover */}
          <div className="relative h-44 shrink-0 sm:h-52">
            <img
              src={project.image}
              alt={project.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/30 to-transparent" />
            <div className="absolute bottom-3 left-5">
              <div className="font-arcade text-[8px] tracking-[0.35em]" style={{ color: project.accent }}>
                PROJECT 0{index + 1}
              </div>
              <h2 className="mt-1.5 font-arcade text-xl text-text sm:text-2xl">
                {project.title}
              </h2>
              <div className="mt-1 text-[11px] tracking-[0.25em] text-dim">
                {project.tagline.toUpperCase()}
              </div>
            </div>
          </div>

          <div className="space-y-6 p-5">
            {/* meta */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
              <MetaRow label="YEAR" value={project.year} />
              <MetaRow label="PLATFORM" value={project.platform} />
              <MetaRow label="ENGINE" value={project.engine} />
              <MetaRow label="ROLE" value={project.role} />
            </div>

            <p className="text-sm leading-relaxed text-dim">
              {project.description}
            </p>

            {/* stats */}
            <div className="grid grid-cols-2 gap-2.5">
              {project.stats.map((s) => (
                <div
                  key={s.label}
                  className="rounded-lg border border-line bg-bg0/60 px-3 py-2.5"
                >
                  <div
                    className="font-arcade text-sm"
                    style={{ color: project.accent }}
                  >
                    {s.value}
                  </div>
                  <div className="mt-1 text-[9px] tracking-[0.25em] text-dim">
                    {s.label.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>

            {/* tech */}
            <div>
              <SectionTitle accent={project.accent}>TECH STACK</SectionTitle>
              <div className="flex flex-wrap gap-1.5">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-line bg-bg0/60 px-2.5 py-1 text-[10px] tracking-wider text-dim"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* features */}
            <div>
              <SectionTitle accent={project.accent}>KEY WORK</SectionTitle>
              <ul className="space-y-2.5">
                {project.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-dim">
                    <CheckIcon color={project.accent} />
                    <span className="leading-snug">{f}</span>
                  </li>
                ))}
              </ul>
            </div>

            <button
              onClick={onClose}
              className="btn btn-ghost w-full"
            >
              ← BACK TO GALLERY
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-2">
      <span className="shrink-0 font-arcade text-[7px] tracking-widest text-dim/70">
        {label}
      </span>
      <span className="truncate text-text">{value}</span>
    </div>
  );
}

function SectionTitle({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div className="mb-2.5 flex items-center gap-2">
      <span
        className="inline-block h-2 w-2 rounded-full"
        style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
      />
      <span className="font-arcade text-[9px] tracking-[0.3em] text-text">
        {children}
      </span>
      <span className="h-px flex-1 bg-line" />
    </div>
  );
}

// ===========================================================================
// Help modal
// ===========================================================================
function HelpModal({
  isTouch,
  onClose,
}: {
  isTouch: boolean;
  onClose: () => void;
}) {
  return (
    <div
      className="animate-fade-in fixed inset-0 z-40 flex items-center justify-center bg-bg0/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-pop-in w-full max-w-md rounded-2xl border border-line bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-arcade text-sm text-cyan">CONTROLS</h3>
          <button
            onClick={onClose}
            aria-label="Close help"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-dim hover:text-text"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-5 space-y-3 text-sm">
          <HelpRow k="DRAG / ONE FINGER" v="Look around the hall" />
          <HelpRow k="SCROLL / PINCH" v="Zoom in and out" />
          {!isTouch && <HelpRow k="W A S D / ARROWS" v="Walk around the gallery" />}
          <HelpRow k="CLICK / TAP BOOTH" v="Open the project details" />
          <HelpRow k="ESC / X BUTTON" v="Close a panel" />
          <HelpRow k="M" v="Toggle sound" />
        </div>
        <p className="mt-5 text-xs leading-relaxed text-dim">
          Six shipped games live in this hall — each booth is a real project
          with data, tech, and takeaways. When you open one, the camera flies
          in for a close-up.
        </p>
      </div>
    </div>
  );
}

function HelpRow({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-line bg-bg0/50 px-3 py-2">
      <span className="font-arcade text-[8px] tracking-widest text-cyan">{k}</span>
      <span className="text-xs text-dim">{v}</span>
    </div>
  );
}

// ===========================================================================
// UI atoms
// ===========================================================================
function HudButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-panel/70 text-dim backdrop-blur-sm transition-all hover:border-cyan hover:text-cyan active:scale-90"
    >
      {children}
    </button>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.2 9a2.8 2.8 0 0 1 5.5.8c0 1.8-2.7 2.2-2.7 3.7" />
      <circle cx="12" cy="17" r="0.4" fill="currentColor" />
    </svg>
  );
}

function SpeakerOnIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 8.5a5 5 0 010 7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function SpeakerOffIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M4 9v6h4l5 4V5L8 9H4z" />
      <path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function CheckIcon({ color }: { color: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className="mt-0.5 h-4 w-4 shrink-0"
      fill="none"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ filter: `drop-shadow(0 0 4px ${color})` }}
    >
      <path d="M4 12.5l5 5L20 6.5" />
    </svg>
  );
}
