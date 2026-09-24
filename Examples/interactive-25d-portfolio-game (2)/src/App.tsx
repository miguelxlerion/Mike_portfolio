import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { GameCanvas } from "./game/World";
import {
  useGame,
  getState,
  setState,
  startGame,
  togglePause,
  toMenu,
  closeInspect,
  toggleMute,
  doesQualify,
} from "./game/store";
import { PROJECTS, ZONE_META, getProject, type Project } from "./game/data";
import { attachMoveInput, input } from "./game/input";
import { HighScore, loadScores, saveScore } from "./game/storage";
import { sfx } from "./game/audio";

export default function App() {
  const screen = useGame((s) => s.screen);
  const score = useGame((s) => s.score);
  const lives = useGame((s) => s.lives);
  const zone = useGame((s) => s.zone);
  const discovered = useGame((s) => s.discovered);
  const selectedId = useGame((s) => s.selectedId);
  const muted = useGame((s) => s.muted);
  const toast = useGame((s) => s.toast);
  const banner = useGame((s) => s.banner);
  const hint = useGame((s) => s.hint);
  const selected = selectedId ? getProject(selectedId) : null;

  const [scores, setScores] = useState<HighScore[]>(loadScores);
  const [newEntry, setNewEntry] = useState(false);
  const [entrySaved, setEntrySaved] = useState(false);
  const [savedRank, setSavedRank] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  useEffect(() => attachMoveInput(), []);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => {
      if (getState().toast?.key === toast.key) setState({ toast: null });
    }, 950);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    if (!banner) return;
    const t = window.setTimeout(() => {
      if (getState().banner?.key === banner.key) setState({ banner: null });
    }, 2600);
    return () => window.clearTimeout(t);
  }, [banner]);

  useEffect(() => {
    if (screen === "over" || screen === "win") {
      setNewEntry(doesQualify());
      setEntrySaved(false);
      setSavedRank(-1);
    }
  }, [screen]);

  useEffect(() => {
    if (newEntry && !entrySaved && (screen === "over" || screen === "win")) {
      inputRef.current?.focus();
    }
  }, [newEntry, entrySaved, screen]);

  const onStart = useCallback(() => {
    sfx.ensure();
    startGame();
    setNewEntry(false);
    setEntrySaved(false);
  }, []);

  const saveEntry = useCallback(() => {
    const name = (inputRef.current?.value || "ACE").toUpperCase().slice(0, 3);
    const st = getState();
    const entry: HighScore = {
      name: name.padEnd(3, "·"),
      score: st.score,
      level: st.discovered.length,
      date: Date.now(),
    };
    const next = saveScore(entry);
    setScores(next);
    setEntrySaved(true);
    setSavedRank(next.findIndex((s) => s.date === entry.date));
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const scr = getState().screen;
      const inspecting = !!getState().selectedId;

      if (e.code === "KeyM") {
        toggleMute();
        return;
      }

      if (scr === "menu" && (e.code === "Enter" || e.code === "Space")) {
        e.preventDefault();
        onStart();
        return;
      }
      if (scr === "playing" && inspecting && e.code === "Escape") {
        e.preventDefault();
        closeInspect();
        return;
      }
      if (scr === "playing" && (e.code === "KeyP" || e.code === "Escape")) {
        e.preventDefault();
        togglePause();
        return;
      }
      if (scr === "paused") {
        if (e.code === "KeyP" || e.code === "Escape" || e.code === "Enter") {
          e.preventDefault();
          togglePause();
        } else if (e.code === "KeyR") {
          e.preventDefault();
          onStart();
        }
        return;
      }
      if (scr === "over" || scr === "win") {
        if (e.code === "Enter") {
          e.preventDefault();
          if (newEntry && !entrySaved) saveEntry();
          else onStart();
        } else if (e.code === "KeyR") {
          e.preventDefault();
          onStart();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onStart, saveEntry, newEntry, entrySaved]);

  const inGame = screen === "playing" || screen === "paused";
  const zcolor = ZONE_META[zone].color;

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg0 select-none">
      <GameCanvas />

      <div className="scanlines pointer-events-none absolute inset-0 z-10" />
      <div className="vignette pointer-events-none absolute inset-0 z-10" />
      <FlashOverlay />

      {inGame && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
          <div className="flex items-start justify-between p-3 sm:p-4">
            <div>
              <div className="text-[9px] tracking-[0.3em] text-dim">SCORE</div>
              <div
                className="font-arcade text-sm text-gold sm:text-base"
                style={{ textShadow: "0 0 12px rgba(251,191,36,0.5)" }}
              >
                {score.toLocaleString("en-US")}
              </div>
              <div className="mt-1 font-arcade text-[8px] text-dim">
                <PlayTimer />
              </div>
            </div>
            <div className="pt-0.5 text-center">
              <div
                className="font-arcade text-[10px] tracking-[0.35em]"
                style={{ color: zcolor, textShadow: `0 0 12px ${zcolor}` }}
              >
                {ZONE_META[zone].name}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.25em] text-dim">
                {ZONE_META[zone].sub}
              </div>
              <div className="mt-2 font-arcade text-[8px] text-cyan">
                ARCHIVES {discovered.length}/{PROJECTS.length}
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <Hearts n={lives} />
              <IconBtn onClick={toggleMute} label={muted ? "Unmute" : "Mute"}>
                {muted ? <SpeakerOffIcon /> : <SpeakerOnIcon />}
              </IconBtn>
              <IconBtn onClick={togglePause} label="Pause">
                <PauseIcon />
              </IconBtn>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div
          key={toast.key}
          className="pointer-events-none absolute left-1/2 top-24 z-30 -translate-x-1/2 animate-pop-in font-arcade text-sm"
          style={{ color: toast.color, textShadow: `0 0 14px ${toast.color}` }}
        >
          {toast.text}
        </div>
      )}

      {banner && screen === "playing" && !selected && (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center">
          <div key={banner.key} className="animate-banner text-center">
            <div
              className="font-arcade text-[10px] tracking-[0.45em] text-cyan"
              style={{ textShadow: "0 0 14px rgba(34,211,238,0.7)" }}
            >
              ENTERING
            </div>
            <div className="mt-3 font-arcade text-2xl text-text sm:text-4xl">{banner.name}</div>
            <div className="mt-3 text-[10px] tracking-[0.4em] text-dim">{banner.sub}</div>
          </div>
        </div>
      )}

      {screen === "playing" && hint && !selected && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4">
          <div className="animate-float-slow rounded-lg border border-cyan/40 bg-panel/85 px-4 py-2 text-center">
            <span className="font-arcade text-[9px] leading-relaxed text-cyan">
              WALK TO A CABINET · CLICK TO EXPAND
            </span>
          </div>
        </div>
      )}

      {screen === "playing" && isTouch && !selected && <TouchControls />}

      {selected && screen === "playing" && (
        <InspectPanel project={selected} onClose={closeInspect} />
      )}

      {screen === "menu" && (
        <div className="absolute inset-0 z-30 bg-bg0/45">
          <MenuScreen scores={scores} onStart={onStart} />
        </div>
      )}

      {screen === "paused" && (
        <PauseScreen
          zone={ZONE_META[zone].name}
          scores={scores}
          discovered={discovered.length}
          onResume={togglePause}
          onRestart={onStart}
          onMenu={toMenu}
        />
      )}

      {(screen === "over" || screen === "win") && (
        <EndScreen
          win={screen === "win"}
          score={score}
          found={discovered.length}
          scores={scores}
          newEntry={newEntry}
          entrySaved={entrySaved}
          savedRank={savedRank}
          inputRef={inputRef}
          onSave={saveEntry}
          onRestart={onStart}
          onMenu={toMenu}
        />
      )}
    </div>
  );
}

function FlashOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let id = 0;
    const loop = () => {
      const f = getState().flash;
      if (ref.current) ref.current.style.opacity = String(Math.min(1, f * 2.4));
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div
      ref={ref}
      className="pointer-events-none absolute inset-0 z-[15] bg-red-500"
      style={{ opacity: 0 }}
    />
  );
}

function PlayTimer() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    let id = 0;
    const loop = () => {
      const t = getState().elapsed;
      if (ref.current) {
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60);
        ref.current.textContent = `${m}:${s.toString().padStart(2, "0")}`;
      }
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, []);
  return <span ref={ref}>0:00</span>;
}

function InspectPanel({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) {
  const color = project.accent;
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-end p-3 sm:items-stretch sm:p-5">
      <button
        className="absolute inset-0 cursor-default bg-bg0/25"
        aria-label="Close archive"
        onClick={onClose}
      />
      <article className="inspect-panel relative z-10 flex max-h-[92%] w-full max-w-lg flex-col overflow-hidden rounded-2xl border-2 bg-panel/95 shadow-2xl backdrop-blur-md animate-pop-in sm:my-4"
        style={{ borderColor: color, boxShadow: `0 0 40px ${color}33` }}
      >
        <div className="relative h-40 shrink-0 overflow-hidden sm:h-52">
          <img
            src={project.image}
            alt={project.title}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-panel via-transparent to-transparent" />
          <div
            className="absolute left-4 top-4 rounded-md border px-2 py-1 font-arcade text-[8px] tracking-widest"
            style={{ borderColor: color, color, background: "#0e1830cc" }}
          >
            {project.zone}
          </div>
          <button
            onClick={onClose}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-bg0/70 font-arcade text-xs text-dim hover:border-cyan hover:text-cyan"
            aria-label="Close"
          >
            X
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5">
          <div className="text-[10px] tracking-[0.35em] text-dim">
            {project.year} · {project.role}
          </div>
          <h2
            className="mt-2 font-arcade text-lg leading-relaxed sm:text-xl"
            style={{ color, textShadow: `0 0 16px ${color}99` }}
          >
            {project.title}
          </h2>
          <p className="mt-1 text-sm text-cyan/90">{project.subtitle}</p>
          <p className="mt-4 text-sm leading-relaxed text-text/90">{project.blurb}</p>

          <Section title="DESIGN PILLARS">
            <ul className="flex flex-wrap gap-2">
              {project.pillars.map((p) => (
                <li
                  key={p}
                  className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: color, color }}
                >
                  {p}
                </li>
              ))}
            </ul>
          </Section>

          <Section title="SYSTEMS">
            <ul className="space-y-1.5 text-sm text-dim">
              {project.systems.map((s) => (
                <li key={s}>▸ {s}</li>
              ))}
            </ul>
          </Section>

          <Section title="TOOLS">
            <div className="flex flex-wrap gap-2">
              {project.tools.map((t) => (
                <span
                  key={t}
                  className="rounded-md bg-bg0 px-2 py-1 font-arcade text-[8px] tracking-widest text-gold"
                >
                  {t}
                </span>
              ))}
            </div>
          </Section>

          <Section title="WHAT SHIPPED">
            <p className="text-sm leading-relaxed text-text/85">{project.shipped}</p>
          </Section>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
          <span className="font-arcade text-[8px] tracking-widest text-dim">
            ESC / TAP OUTSIDE
          </span>
          <button className="btn btn-primary" onClick={onClose}>
            CLOSE
          </button>
        </div>
      </article>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mt-5">
      <div className="mb-2 font-arcade text-[8px] tracking-[0.28em] text-gold">{title}</div>
      {children}
    </div>
  );
}

function TouchControls() {
  return (
    <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-4 pb-5">
      <Joystick />
      <button
        className="btn-touch btn-primary"
        aria-label="Jump"
        onPointerDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          input.jumpQueued = true;
        }}
      >
        JUMP
      </button>
    </div>
  );
}

function Joystick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const pid = useRef<number | null>(null);

  const setFrom = (clientX: number, clientY: number) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    let dx = clientX - cx;
    let dy = clientY - cy;
    const max = r.width * 0.32;
    const m = Math.hypot(dx, dy);
    if (m > max) {
      dx = (dx / m) * max;
      dy = (dy / m) * max;
    }
    input.joyX = dx / max;
    input.joyZ = dy / max;
    input.joyActive = true;
    if (knob.current) {
      knob.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  };

  const end = () => {
    pid.current = null;
    input.joyActive = false;
    input.joyX = 0;
    input.joyZ = 0;
    if (knob.current) knob.current.style.transform = "translate(-50%, -50%)";
  };

  return (
    <div
      ref={base}
      className="joystick"
      onPointerDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        pid.current = e.pointerId;
        (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
        setFrom(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (pid.current !== e.pointerId) return;
        setFrom(e.clientX, e.clientY);
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="joystick-knob" />
    </div>
  );
}

function HighScores({
  scores,
  highlight = -1,
}: {
  scores: HighScore[];
  highlight?: number;
}) {
  if (!scores.length) {
    return (
      <p className="py-2 text-center text-xs tracking-widest text-dim">
        NO SCORES YET — BE THE FIRST!
      </p>
    );
  }
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="font-arcade text-[8px] tracking-widest text-dim">
          <th className="py-1 pr-3">#</th>
          <th className="py-1 pr-3">NAME</th>
          <th className="py-1 pr-3">SCORE</th>
          <th className="py-1">ARC</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((s, i) => (
          <tr key={i} className={`hs-row ${i === highlight ? "hs-new" : ""}`}>
            <td className="py-1.5 pr-3 font-arcade text-[10px] text-gold">{i + 1}</td>
            <td className="py-1.5 pr-3 font-arcade text-[10px] text-text">{s.name}</td>
            <td className="py-1.5 pr-3 font-arcade text-[10px] text-cyan">
              {s.score.toLocaleString("en-US")}
            </td>
            <td className="py-1.5 font-arcade text-[10px] text-dim">{s.level}/8</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Hearts({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} lives`}>
      {[0, 1, 2].map((i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className={`h-4 w-4 sm:h-5 sm:w-5 ${i < n ? "text-red" : "text-line"}`}
          fill="currentColor"
        >
          <path d="M12 21s-7.5-4.9-10-9.5C.5 8 2 4 6 4c2.5 0 4 1.5 6 3.5C14 5.5 15.5 4 18 4c4 0 5.5 4 4 7.5C19.5 16.1 12 21 12 21z" />
        </svg>
      ))}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void;
  label: string;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-panel/70 text-dim transition-colors hover:border-cyan hover:text-cyan"
    >
      {children}
    </button>
  );
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <rect x="6" y="5" width="4" height="14" rx="1" />
      <rect x="14" y="5" width="4" height="14" rx="1" />
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

function MenuScreen({
  scores,
  onStart,
}: {
  scores: HighScore[];
  onStart: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-auto p-4">
      <div className="w-full max-w-lg py-4 animate-pop-in">
        <div className="mb-6 text-center">
          <div
            className="font-arcade text-4xl text-cyan sm:text-6xl"
            style={{ textShadow: "0 0 24px rgba(34,211,238,0.55), 0 4px 0 #0e7490" }}
          >
            DEVQUEST
          </div>
          <div className="mt-3 text-xs tracking-[0.4em] text-dim sm:text-sm">3D STUDIO ARCHIVE</div>
          <div className="mt-2 text-[9px] tracking-[0.3em] text-gold/70">
            CLICK A PIECE · READ THE WORK · CLEAR THE FLOOR
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3">
          <button className="btn btn-primary w-64 text-sm" onClick={onStart}>
            ENTER STUDIO
          </button>
          <div className="animate-blink font-arcade text-[9px] tracking-widest text-gold">
            PRESS ENTER
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-line bg-panel/60 p-3">
            <div className="mb-2 font-arcade text-[8px] tracking-widest text-cyan">MOVE</div>
            <div className="space-y-1.5 text-dim">
              <div>
                <Kbd>WASD</Kbd> walk
              </div>
              <div>
                <Kbd>SPACE</Kbd> jump ×2
              </div>
              <div>
                <Kbd>P</Kbd> pause · <Kbd>M</Kbd> sound
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel/60 p-3">
            <div className="mb-2 font-arcade text-[8px] tracking-widest text-cyan">INSPECT</div>
            <div className="space-y-1.5 text-dim">
              <div>CLICK / TAP a piece</div>
              <div>It expands with the GDD</div>
              <div>JUMP on bugs to squash</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel/60 p-4">
          <div className="mb-3 font-arcade text-[9px] tracking-widest text-gold">HIGH SCORES</div>
          <HighScores scores={scores} />
        </div>
      </div>
    </div>
  );
}

function PauseScreen({
  zone,
  scores,
  discovered,
  onResume,
  onRestart,
  onMenu,
}: {
  zone: string;
  scores: HighScore[];
  discovered: number;
  onResume: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg0/85 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-pop-in text-center">
        <div
          className="font-arcade text-2xl text-cyan sm:text-3xl"
          style={{ textShadow: "0 0 18px rgba(34,211,238,0.6)" }}
        >
          PAUSED
        </div>
        <div className="mt-2 text-[10px] tracking-[0.3em] text-dim">
          {zone} · {discovered}/8 ARCHIVES
        </div>
        <div className="mt-6 flex flex-col items-center gap-3">
          <button className="btn btn-primary w-60" onClick={onResume}>
            RESUME
          </button>
          <button className="btn btn-ghost w-60" onClick={onRestart}>
            RESTART
          </button>
          <button className="btn btn-ghost w-60" onClick={onMenu}>
            MENU
          </button>
        </div>
        <div className="mt-6 rounded-lg border border-line bg-panel/60 p-3 text-left">
          <div className="mb-2 font-arcade text-[8px] tracking-widest text-gold">HIGH SCORES</div>
          <HighScores scores={scores} />
        </div>
      </div>
    </div>
  );
}

function EndScreen({
  win,
  score,
  found,
  scores,
  newEntry,
  entrySaved,
  savedRank,
  inputRef,
  onSave,
  onRestart,
  onMenu,
}: {
  win: boolean;
  score: number;
  found: number;
  scores: HighScore[];
  newEntry: boolean;
  entrySaved: boolean;
  savedRank: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onSave: () => void;
  onRestart: () => void;
  onMenu: () => void;
}) {
  const accent = win ? "text-gold" : "text-red";
  const glow = win ? "rgba(251,191,36,0.55)" : "rgba(248,113,113,0.5)";
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg0/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-pop-in">
        <div
          className={`text-center font-arcade text-3xl ${accent} sm:text-4xl`}
          style={{ textShadow: `0 0 22px ${glow}` }}
        >
          {win ? "ARCHIVE COMPLETE" : "GAME OVER"}
        </div>
        <div className="mt-3 text-center text-[10px] tracking-[0.3em] text-dim">
          {win ? "ALL 8 WORKS INSPECTED" : `FOUND ${found}/8 ARCHIVES`}
        </div>
        <div className="mt-6 rounded-lg border border-line bg-panel/70 p-5 text-center">
          <div className="text-[9px] tracking-[0.3em] text-dim">FINAL SCORE</div>
          <div
            className="mt-2 font-arcade text-3xl text-gold"
            style={{ textShadow: "0 0 16px rgba(251,191,36,0.5)" }}
          >
            {score.toLocaleString("en-US")}
          </div>
        </div>

        {newEntry && !entrySaved && (
          <div className="mt-4 animate-pop-in rounded-lg border-2 border-gold bg-panel/85 p-4 text-center">
            <div className="animate-blink font-arcade text-[10px] tracking-widest text-gold">
              ★ NEW HIGH SCORE ★
            </div>
            <div className="mt-3 flex items-center justify-center gap-3">
              <input
                ref={inputRef}
                className="arcade-input w-36"
                maxLength={3}
                defaultValue=""
                placeholder="AAA"
                aria-label="Your initials"
              />
              <button className="btn btn-primary" onClick={onSave}>
                SAVE
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-line bg-panel/60 p-3">
          <div className="mb-2 font-arcade text-[8px] tracking-widest text-gold">HIGH SCORES</div>
          <HighScores scores={scores} highlight={savedRank} />
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <button className="btn btn-primary w-64" onClick={onRestart}>
            {win ? "WALK IT AGAIN" : "RESTART"}
          </button>
          <button className="btn btn-ghost w-64" onClick={onMenu}>
            MENU
          </button>
        </div>
      </div>
    </div>
  );
}

function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="mr-1 rounded border border-line bg-bg0 px-1.5 py-0.5 font-arcade text-[8px] text-cyan">
      {children}
    </kbd>
  );
}
