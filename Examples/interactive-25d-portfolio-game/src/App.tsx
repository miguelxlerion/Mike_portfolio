import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import { GameEngine } from "./game/engine";
import { HighScore, loadScores, saveScore, qualifies } from "./game/storage";

type Screen = "menu" | "playing" | "paused" | "over" | "win";

interface BannerState {
  i: number;
  name: string;
  sub: string;
  key: number;
}

const LEVEL_HINT = "JUMP: SPACE / TAP · SLIDE: ↓ / SWIPE DOWN";

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const screenRef = useRef<Screen>("menu");
  const inputRef = useRef<HTMLInputElement>(null);

  const [screen, setScreen] = useState<Screen>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState({ i: 0, name: "CONCEPT", sub: "" });
  const [banner, setBanner] = useState<BannerState | null>(null);
  const [scores, setScores] = useState<HighScore[]>(loadScores);
  const [newEntry, setNewEntry] = useState(false);
  const [entrySaved, setEntrySaved] = useState(false);
  const [savedRank, setSavedRank] = useState(-1);
  const [muted, setMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [hint, setHint] = useState(true);
  const [isTouch] = useState(
    () =>
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0)
  );

  screenRef.current = screen;

  // ---- engine lifecycle ---------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new GameEngine(canvas, {
      onScore: setScore,
      onLives: setLives,
      onLevel: (i, name, sub) => setLevel({ i, name, sub }),
      onBanner: (i, name, sub) => {
        setBanner({ i, name, sub, key: Date.now() });
        setHint(i === 0);
        window.setTimeout(() => setBanner(null), 2700);
      },
      onGameOver: (s) => {
        setScreen("over");
        setNewEntry(qualifies(s) && s > 0);
        setEntrySaved(false);
      },
      onWin: (s) => {
        setScreen("win");
        setNewEntry(qualifies(s) && s > 0);
        setEntrySaved(false);
      },
    });
    engineRef.current = engine;
    engine.start();
    engine.attachInput(canvas);

    const parent = canvas.parentElement;
    let ro: ResizeObserver | null = null;
    if (parent) {
      ro = new ResizeObserver(() => {
        engine.resize(parent.clientWidth, parent.clientHeight);
      });
      ro.observe(parent);
      engine.resize(parent.clientWidth, parent.clientHeight);
    }

    if (document.fonts) {
      document.fonts.load('10px "Press Start 2P"').catch(() => {});
    }

    const onVis = () => {
      if (document.hidden && screenRef.current === "playing") {
        engine.togglePause();
        setScreen("paused");
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      ro?.disconnect();
      engine.destroy();
    };
  }, []);

  // ---- progress polling ---------------------------------------------------
  useEffect(() => {
    if (screen !== "playing") return;
    const id = window.setInterval(() => {
      setProgress(engineRef.current?.progress() ?? 0);
    }, 120);
    return () => window.clearInterval(id);
  }, [screen]);

  // ---- focus name input when it appears -----------------------------------
  useEffect(() => {
    if (newEntry && !entrySaved && (screen === "over" || screen === "win")) {
      inputRef.current?.focus();
    }
  }, [newEntry, entrySaved, screen]);

  // ---- actions ------------------------------------------------------------
  const startGame = useCallback(() => {
    engineRef.current?.startGame();
    setScreen("playing");
    setScore(0);
    setLives(3);
    setNewEntry(false);
    setEntrySaved(false);
    setHint(true);
    setBanner(null);
    setProgress(0);
  }, []);

  const togglePause = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    if (screenRef.current === "playing") {
      engine.togglePause();
      setScreen("paused");
    } else if (screenRef.current === "paused") {
      engine.togglePause();
      setScreen("playing");
    }
  }, []);

  const toMenu = useCallback(() => {
    engineRef.current?.toMenu();
    setScreen("menu");
    setBanner(null);
    setNewEntry(false);
    setEntrySaved(false);
  }, []);

  const saveEntry = useCallback(() => {
    const name = (inputRef.current?.value || "ACE").toUpperCase().slice(0, 3);
    const entry: HighScore = {
      name: name.padEnd(3, "·"),
      score,
      level: level.i + 1,
      date: Date.now(),
    };
    const next = saveScore(entry);
    setScores(next);
    setEntrySaved(true);
    setSavedRank(next.findIndex((s) => s.date === entry.date));
  }, [score, level.i]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      engineRef.current?.setMuted(!m);
      return !m;
    });
  }, []);

  // ---- keyboard -----------------------------------------------------------
  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      const engine = engineRef.current;
      const scr = screenRef.current;

      if (e.code === "KeyM") {
        toggleMute();
        return;
      }

      switch (scr) {
        case "menu":
          if (e.code === "Enter" || e.code === "Space") {
            e.preventDefault();
            startGame();
          }
          break;
        case "playing":
          if (e.code === "Space" || e.code === "ArrowUp" || e.code === "KeyW") {
            e.preventDefault();
            engine?.queueJump();
            setHint(false);
          } else if (e.code === "ArrowDown" || e.code === "KeyS") {
            e.preventDefault();
            engine?.setSlide(true);
          } else if (e.code === "KeyP" || e.code === "Escape") {
            e.preventDefault();
            togglePause();
          }
          break;
        case "paused":
          if (e.code === "KeyP" || e.code === "Escape" || e.code === "Enter") {
            e.preventDefault();
            togglePause();
          } else if (e.code === "KeyR") {
            e.preventDefault();
            startGame();
          }
          break;
        case "over":
        case "win":
          if (e.code === "Enter") {
            e.preventDefault();
            if (newEntry && !entrySaved) saveEntry();
            else startGame();
          } else if (e.code === "KeyR") {
            e.preventDefault();
            startGame();
          }
          break;
      }
    };
    const keyUp = (e: KeyboardEvent) => {
      if (e.code === "ArrowDown" || e.code === "KeyS") {
        engineRef.current?.setSlide(false);
      }
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
    };
  }, [startGame, togglePause, toggleMute, saveEntry, newEntry, entrySaved]);

  // ---- render -------------------------------------------------------------
  const inGame = screen === "playing" || screen === "paused";

  return (
    <div className="relative h-full w-full overflow-hidden bg-bg0 select-none">
      {/* game canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block h-full w-full"
        style={{ touchAction: "none" }}
      />

      {/* CRT dressing */}
      <div className="scanlines pointer-events-none absolute inset-0 z-10" />
      <div className="vignette pointer-events-none absolute inset-0 z-10" />

      {/* HUD */}
      {inGame && (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20">
          <div className="flex items-start justify-between p-3 sm:p-4">
            <div>
              <div className="text-[9px] tracking-[0.3em] text-dim">SCORE</div>
              <div
                className="font-arcade text-sm sm:text-base text-gold"
                style={{ textShadow: "0 0 12px rgba(251,191,36,0.5)" }}
              >
                {score.toLocaleString("en-US")}
              </div>
            </div>
            <div className="pt-0.5 text-center">
              <div
                className="font-arcade text-[10px] tracking-[0.35em] text-cyan"
                style={{ textShadow: "0 0 10px rgba(34,211,238,0.6)" }}
              >
                SECTION 0{level.i + 1}
              </div>
              <div className="mt-1 text-[10px] tracking-[0.3em] text-dim">
                {level.name}
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
          {/* progress bar */}
          <div className="mx-3 h-1 rounded bg-line/60 sm:mx-4">
            <div
              className="h-full rounded bg-cyan transition-[width] duration-150 ease-out"
              style={{
                width: `${Math.round(progress * 100)}%`,
                boxShadow: "0 0 8px rgba(34,211,238,0.7)",
              }}
            />
          </div>
        </div>
      )}

      {/* touch controls */}
      {screen === "playing" && isTouch && (
        <div className="absolute inset-x-0 bottom-0 z-30 flex items-end justify-between px-5 pb-6">
          <button
            className="btn-touch btn-ghost pointer-events-auto border-dim/60 text-dim"
            style={{ pointerEvents: "auto" }}
            aria-label="Slide"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              engineRef.current?.setSlide(true);
            }}
            onPointerUp={(e) => {
              e.stopPropagation();
              engineRef.current?.setSlide(false);
            }}
            onPointerLeave={() => engineRef.current?.setSlide(false)}
            onPointerCancel={() => engineRef.current?.setSlide(false)}
          >
            SLIDE
          </button>
          <button
            className="btn-touch btn-primary pointer-events-auto"
            style={{ pointerEvents: "auto" }}
            aria-label="Jump"
            onPointerDown={(e) => {
              e.stopPropagation();
              e.preventDefault();
              engineRef.current?.queueJump();
              setHint(false);
            }}
          >
            JUMP
          </button>
        </div>
      )}

      {/* first-level hint */}
      {screen === "playing" && hint && level.i === 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-28 z-20 flex justify-center px-4">
          <div className="animate-float-slow rounded-lg border border-line bg-panel/85 px-4 py-2 text-center text-xs text-dim">
            <span className="font-arcade text-[9px] text-cyan">
              {LEVEL_HINT}
            </span>
          </div>
        </div>
      )}

      {/* level banner */}
      {banner && (
        <div className="pointer-events-none absolute inset-x-0 top-24 z-20 flex justify-center">
          <div key={banner.key} className="animate-banner text-center">
            <div
              className="font-arcade text-[10px] tracking-[0.45em] text-cyan"
              style={{ textShadow: "0 0 14px rgba(34,211,238,0.7)" }}
            >
              SECTION 0{banner.i + 1}
            </div>
            <div
              className="mt-3 font-arcade text-2xl text-text sm:text-4xl"
              style={{ textShadow: "0 0 22px rgba(255,255,255,0.3)" }}
            >
              {banner.name}
            </div>
            <div className="mt-3 text-[10px] tracking-[0.4em] text-dim">
              {banner.sub}
            </div>
          </div>
        </div>
      )}

      {/* ============ SCREENS ============ */}
      {screen === "menu" && (
        <div className="absolute inset-0 z-30 bg-bg0/55">
          <MenuScreen scores={scores} onStart={startGame} />
        </div>
      )}

      {screen === "paused" && (
        <PauseScreen
          level={level}
          scores={scores}
          onResume={togglePause}
          onRestart={startGame}
          onMenu={toMenu}
        />
      )}

      {(screen === "over" || screen === "win") && (
        <EndScreen
          win={screen === "win"}
          score={score}
          level={level}
          scores={scores}
          newEntry={newEntry}
          entrySaved={entrySaved}
          savedRank={savedRank}
          inputRef={inputRef}
          onSave={saveEntry}
          onRestart={startGame}
          onMenu={toMenu}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Sub-components
// ===========================================================================

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
          <th className="py-1">LVL</th>
        </tr>
      </thead>
      <tbody>
        {scores.map((s, i) => (
          <tr
            key={i}
            className={`hs-row ${i === highlight ? "hs-new" : ""}`}
          >
            <td className="py-1.5 pr-3 font-arcade text-[10px] text-gold">
              {i + 1}
            </td>
            <td className="py-1.5 pr-3 font-arcade text-[10px] text-text">
              {s.name}
            </td>
            <td className="py-1.5 pr-3 font-arcade text-[10px] text-cyan">
              {s.score.toLocaleString("en-US")}
            </td>
            <td className="py-1.5 font-arcade text-[10px] text-dim">
              {s.level}
            </td>
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
          className={`h-4 w-4 sm:h-5 sm:w-5 ${
            i < n ? "text-red" : "text-line"
          }`}
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
      style={{ pointerEvents: "auto" }}
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
            style={{
              textShadow:
                "0 0 24px rgba(34,211,238,0.55), 0 4px 0 #0e7490",
            }}
          >
            DEVQUEST
          </div>
          <div className="mt-4 text-xs tracking-[0.4em] text-dim sm:text-sm">
            A GAME DEV PORTFOLIO RUN
          </div>
          <div className="mt-2 text-[9px] tracking-[0.3em] text-gold/70">
            CONCEPT → PROTOTYPE → PRODUCTION → LAUNCH
          </div>
        </div>

        <div className="mb-6 flex flex-col items-center gap-3">
          <button className="btn btn-primary w-64 text-sm" onClick={onStart}>
            START RUN
          </button>
          <div className="animate-blink font-arcade text-[9px] tracking-widest text-gold">
            PRESS ENTER
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-3 text-xs">
          <div className="rounded-lg border border-line bg-panel/60 p-3">
            <div className="mb-2 font-arcade text-[8px] tracking-widest text-cyan">
              KEYBOARD
            </div>
            <div className="space-y-1.5 text-dim">
              <div>
                <Kbd>SPACE</Kbd> jump ×2
              </div>
              <div>
                <Kbd>↓</Kbd> slide
              </div>
              <div>
                <Kbd>P</Kbd> pause · <Kbd>M</Kbd> sound
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-line bg-panel/60 p-3">
            <div className="mb-2 font-arcade text-[8px] tracking-widest text-cyan">
              TOUCH
            </div>
            <div className="space-y-1.5 text-dim">
              <div>TAP jump ×2</div>
              <div>SWIPE ↓ slide</div>
              <div>On-screen buttons</div>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-line bg-panel/60 p-4">
          <div className="mb-3 font-arcade text-[9px] tracking-widest text-gold">
            HIGH SCORES
          </div>
          <HighScores scores={scores} />
        </div>

        <div className="mt-4 text-center text-[9px] tracking-[0.25em] text-dim/60">
          COLLECT IDEAS · DODGE BUGS · CLEAR ALL 4 SECTIONS
        </div>
      </div>
    </div>
  );
}

function PauseScreen({
  level,
  scores,
  onResume,
  onRestart,
  onMenu,
}: {
  level: { i: number; name: string };
  scores: HighScore[];
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
          SECTION 0{level.i + 1} · {level.name}
        </div>

        <div className="mt-6 flex flex-col gap-3">
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
          <div className="mb-2 font-arcade text-[8px] tracking-widest text-gold">
            HIGH SCORES
          </div>
          <HighScores scores={scores} />
        </div>
      </div>
    </div>
  );
}

function EndScreen({
  win,
  score,
  level,
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
  level: { i: number; name: string };
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
  const accentGlow = win
    ? "rgba(251,191,36,0.55)"
    : "rgba(248,113,113,0.5)";
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg0/80 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-pop-in">
        <div
          className={`text-center font-arcade text-3xl ${accent} sm:text-4xl`}
          style={{ textShadow: `0 0 22px ${accentGlow}` }}
        >
          {win ? "PORTFOLIO COMPLETE!" : "GAME OVER"}
        </div>
        <div className="mt-3 text-center text-[10px] tracking-[0.3em] text-dim">
          {win
            ? "ALL 4 SECTIONS SHIPPED"
            : `FELL IN SECTION 0${level.i + 1} · ${level.name}`}
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
            <div className="mt-2 text-[9px] tracking-widest text-dim">
              3 INITIALS · ENTER TO SAVE
            </div>
          </div>
        )}

        <div className="mt-4 rounded-lg border border-line bg-panel/60 p-3">
          <div className="mb-2 font-arcade text-[8px] tracking-widest text-gold">
            HIGH SCORES
          </div>
          <HighScores scores={scores} highlight={savedRank} />
        </div>

        <div className="mt-5 flex flex-col items-center gap-3">
          <button className="btn btn-primary w-64" onClick={onRestart}>
            {win ? "RUN IT AGAIN" : "RESTART"}
          </button>
          <button className="btn btn-ghost w-64" onClick={onMenu}>
            MENU
          </button>
          <div className="animate-blink font-arcade text-[9px] tracking-widest text-gold">
            PRESS ENTER
          </div>
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
