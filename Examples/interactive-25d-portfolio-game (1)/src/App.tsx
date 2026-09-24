import { useEffect, useRef, useState, useCallback } from "react";
import { Game, GameState, HudState } from "./game/Game";
import { LEVELS } from "./game/levels";

const HS_KEY = "portfolio-quest-highscores-v1";

interface HighScore {
  score: number;
  level: number;
  date: string;
}

function loadHighScores(): HighScore[] {
  try {
    const raw = localStorage.getItem(HS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.slice(0, 10);
  } catch { return []; }
}
function saveHighScore(score: number, level: number) {
  const list = loadHighScores();
  list.push({ score, level, date: new Date().toLocaleDateString() });
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 10);
  localStorage.setItem(HS_KEY, JSON.stringify(top));
  return top;
}
function isHighScore(score: number): boolean {
  const list = loadHighScores();
  if (list.length < 10) return true;
  return score > list[list.length - 1].score;
}

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);

  const [gameState, setGameState] = useState<GameState>("menu");
  const [hud, setHud] = useState<HudState | null>(null);
  const [highScores, setHighScores] = useState<HighScore[]>(() => loadHighScores());
  const [finalScore, setFinalScore] = useState(0);
  const [isNewHigh, setIsNewHigh] = useState(false);

  // Initialize game once
  useEffect(() => {
    if (!canvasRef.current) return;
    const game = new Game(canvasRef.current);
    gameRef.current = game;
    game.onStateChange = (s) => {
      setGameState(s);
      if (s === "gameover") {
        const score = game.score;
        setFinalScore(score);
        setIsNewHigh(isHighScore(score));
        const updated = saveHighScore(score, game.levelIdx + 1);
        setHighScores(updated);
      }
    };
    game.onHudUpdate = setHud;
    // Start animation loop so menu has bg animation
    game.level = LEVELS[0];
    game.tileSet = new Set(game.level.tiles.map(t => `${t.x},${t.y}`));
    game.hazardsSet = new Set(game.level.hazards.map(h => `${h.x},${h.y}`));
    game.pGrid = { ...game.level.start };
    game.pFrom = { ...game.level.start };
    game.pTo = { ...game.level.start };
    game.collectedGems = new Set();
    // Center camera on player for menu state
    const { sx, sy } = (function isoInit(x: number, y: number) {
      return { sx: (x - y) * 36, sy: (x + y) * 20 };
    })(game.level.start.x, game.level.start.y);
    game.camX = game.camTargetX = sx;
    game.camY = game.camTargetY = sy;
    game.running = true;
    game.lastTime = performance.now();
    game.loop(game.lastTime);
    return () => game.destroy();
  }, []);

  const startGame = () => {
    gameRef.current?.start();
  };
  const resume = () => gameRef.current?.resume();
  const restart = () => gameRef.current?.restartLevel();
  const nextLevel = () => gameRef.current?.nextLevel();
  const toMenu = () => gameRef.current?.returnToMenu();

  // Touch control handlers
  const touchStart = useCallback((dir: { x: number; y: number }) => {
    gameRef.current?.setTouchDir(dir);
  }, []);
  const touchEnd = useCallback(() => {
    gameRef.current?.setTouchDir(null);
  }, []);
  const touchJump = useCallback(() => {
    gameRef.current?.triggerJump();
  }, []);

  const accent = hud?.accent || "#ff3ea5";

  return (
    <div className="fixed inset-0 overflow-hidden bg-black font-mono select-none" style={{ touchAction: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

      {/* HUD (visible during play) */}
      {(gameState === "playing" || gameState === "paused") && hud && (
        <div className="absolute inset-x-0 top-0 pointer-events-none p-3 sm:p-5 z-10">
          <div className="flex items-start justify-between gap-3">
            {/* Score + Gems */}
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-lg">
              <div className="flex items-center gap-4 text-white">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Score</div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums" style={{ color: accent, textShadow: `0 0 12px ${accent}` }}>
                    {hud.score.toString().padStart(6, "0")}
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Gems</div>
                  <div className="text-xl sm:text-2xl font-bold tabular-nums text-white">
                    {hud.gems}<span className="text-white/40">/{hud.gemsTotal}</span>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Lives</div>
                  <div className="text-xl sm:text-2xl font-bold flex gap-0.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i} className={i < hud.lives ? "text-rose-500" : "text-white/20"}>♥</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Level + Time */}
            <div className="bg-black/50 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2.5 shadow-lg text-right">
              <div className="text-[10px] uppercase tracking-widest text-white/50">Level {hud.level} · {LEVELS.length}</div>
              <div className="text-sm sm:text-base font-bold text-white">{hud.levelName}</div>
              <div className="text-[10px] text-white/60">{hud.levelSubtitle}</div>
              <div className="mt-1 text-xs tabular-nums" style={{ color: hud.time > hud.parTime ? "#ff6b6b" : accent }}>
                ⏱ {hud.time.toFixed(1)}s / {hud.parTime}s
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pause button (top-right, inside hud) */}
      {gameState === "playing" && (
        <button
          onClick={() => gameRef.current?.pause()}
          className="absolute top-3 right-3 sm:top-20 z-20 bg-black/60 backdrop-blur-md border border-white/20 hover:bg-white/10 rounded-xl p-2.5 text-white transition-colors"
          aria-label="Pause"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
        </button>
      )}

      {/* Touch controls */}
      {gameState === "playing" && (
        <TouchControls
          onDirStart={touchStart}
          onDirEnd={touchEnd}
          onJump={touchJump}
          accent={accent}
        />
      )}

      {/* Start menu */}
      {gameState === "menu" && (
        <StartMenu
          onStart={startGame}
          highScores={highScores}
        />
      )}

      {/* Pause */}
      {gameState === "paused" && (
        <Overlay>
          <div className="bg-black/80 backdrop-blur-xl border-2 rounded-2xl px-8 py-8 sm:px-12 sm:py-10 text-center shadow-2xl" style={{ borderColor: accent, boxShadow: `0 0 40px ${accent}66` }}>
            <div className="text-5xl sm:text-6xl font-black text-white mb-2 tracking-tight">PAUSED</div>
            <div className="text-sm text-white/60 mb-8">Press P or ESC to resume · R to restart</div>
            <div className="flex flex-col gap-3">
              <NeonButton onClick={resume} color={accent}>Resume</NeonButton>
              <NeonButton onClick={restart} color="#facc15">Restart Level</NeonButton>
              <NeonButton onClick={toMenu} color="#94a3b8">Main Menu</NeonButton>
            </div>
          </div>
        </Overlay>
      )}

      {/* Level complete */}
      {gameState === "levelComplete" && hud && (
        <Overlay>
          <div className="bg-black/85 backdrop-blur-xl border-2 rounded-2xl px-8 py-8 sm:px-12 sm:py-10 text-center shadow-2xl max-w-md" style={{ borderColor: accent, boxShadow: `0 0 60px ${accent}88` }}>
            <div className="text-4xl sm:text-5xl font-black mb-1" style={{ color: accent, textShadow: `0 0 24px ${accent}` }}>
              LEVEL CLEAR!
            </div>
            <div className="text-lg text-white font-bold mb-1">{hud.levelName}</div>
            <div className="text-sm text-white/60 mb-6">Project completed ✓</div>

            <div className="grid grid-cols-3 gap-2 mb-6 text-white">
              <Stat label="Gems" value={`${hud.gems}/${hud.gemsTotal}`} />
              <Stat label="Time" value={`${hud.time.toFixed(1)}s`} />
              <Stat label="Score" value={hud.score.toString()} />
            </div>

            <div className="flex flex-col gap-3">
              {hud.level < LEVELS.length ? (
                <NeonButton onClick={nextLevel} color={accent}>Next Project →</NeonButton>
              ) : (
                <>
                  <div className="text-xl font-bold text-white mb-2">🏆 Portfolio Complete!</div>
                  <NeonButton onClick={toMenu} color={accent}>Main Menu</NeonButton>
                </>
              )}
              <NeonButton onClick={restart} color="#94a3b8">Replay Level</NeonButton>
            </div>
          </div>
        </Overlay>
      )}

      {/* Game over */}
      {gameState === "gameover" && (
        <Overlay>
          <div className="bg-black/85 backdrop-blur-xl border-2 border-rose-500 rounded-2xl px-8 py-8 sm:px-12 sm:py-10 text-center shadow-2xl max-w-md" style={{ boxShadow: `0 0 60px rgba(244,63,94,0.5)` }}>
            <div className="text-5xl sm:text-6xl font-black mb-2 text-rose-500" style={{ textShadow: `0 0 24px rgba(244,63,94,0.8)` }}>
              GAME OVER
            </div>
            <div className="text-sm text-white/60 mb-6">
              {isNewHigh ? "🌟 NEW HIGH SCORE! 🌟" : "Better luck next time!"}
            </div>
            <div className="text-white mb-6">
              <div className="text-xs uppercase tracking-widest text-white/50">Final Score</div>
              <div className="text-5xl font-black tabular-nums" style={{ color: accent, textShadow: `0 0 20px ${accent}` }}>
                {finalScore.toLocaleString()}
              </div>
            </div>
            <div className="flex flex-col gap-3">
              <NeonButton onClick={restart} color={accent}>Instant Restart (R)</NeonButton>
              <NeonButton onClick={toMenu} color="#94a3b8">Main Menu</NeonButton>
            </div>
          </div>
        </Overlay>
      )}

      {/* Controls hint (bottom) */}
      {gameState === "playing" && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none hidden sm:block">
          <div className="bg-black/40 backdrop-blur-sm border border-white/10 rounded-full px-4 py-1.5 text-xs text-white/70 flex gap-3">
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white">WASD</kbd> Move</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white">SPACE</kbd> Jump</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white">P</kbd> Pause</span>
            <span><kbd className="px-1.5 py-0.5 bg-white/10 rounded text-white">R</kbd> Restart</span>
          </div>
        </div>
      )}
    </div>
  );
}

function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fadeIn">
      {children}
    </div>
  );
}

function NeonButton({ children, onClick, color }: { children: React.ReactNode; onClick: () => void; color: string }) {
  return (
    <button
      onClick={onClick}
      className="relative group px-8 py-3 rounded-xl font-bold text-white uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95"
      style={{
        background: `linear-gradient(135deg, ${color}, ${color}88)`,
        boxShadow: `0 0 20px ${color}66, inset 0 0 20px rgba(255,255,255,0.1)`,
        border: `2px solid ${color}`,
      }}
    >
      {children}
    </button>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-lg py-2 px-1">
      <div className="text-[9px] uppercase tracking-widest text-white/50">{label}</div>
      <div className="text-sm sm:text-base font-bold tabular-nums">{value}</div>
    </div>
  );
}

function StartMenu({ onStart, highScores }: { onStart: () => void; highScores: HighScore[] }) {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8 animate-fadeIn">
          <div className="inline-block mb-4 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs uppercase tracking-[0.3em] text-white/70">
            Interactive Portfolio
          </div>
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-3 bg-gradient-to-br from-fuchsia-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent" style={{ filter: "drop-shadow(0 0 30px rgba(255,62,165,0.5))" }}>
            PORTFOLIO<br />QUEST
          </h1>
          <p className="text-white/70 text-sm sm:text-base max-w-md mx-auto mb-2">
            A playable journey through 4 game projects.
            <br />Collect gems · dodge hazards · clear the levels.
          </p>
          <p className="text-white/40 text-xs">
            Built with tight controls, juicy feedback, and a love of games.
          </p>
        </div>

        <div className="flex justify-center mb-8 animate-fadeIn" style={{ animationDelay: "100ms" }}>
          <button
            onClick={onStart}
            className="px-12 py-4 rounded-2xl font-black text-white uppercase tracking-[0.2em] text-lg transition-all hover:scale-105 active:scale-95 animate-pulse-slow"
            style={{
              background: "linear-gradient(135deg, #ff3ea5, #22d3ee)",
              boxShadow: "0 0 40px rgba(255,62,165,0.6), inset 0 0 30px rgba(255,255,255,0.15)",
              border: "2px solid rgba(255,255,255,0.3)",
            }}
          >
            ▶ Press Start
          </button>
        </div>

        {/* Projects grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 animate-fadeIn" style={{ animationDelay: "200ms" }}>
          {LEVELS.map((lv) => (
            <div key={lv.id} className="bg-black/40 backdrop-blur-md border rounded-xl p-3 text-left" style={{ borderColor: lv.accent + "55" }}>
              <div className="text-[10px] uppercase tracking-widest mb-1" style={{ color: lv.accent }}>Project 0{lv.id}</div>
              <div className="text-white font-bold text-sm mb-1 leading-tight">{lv.name}</div>
              <div className="text-white/50 text-[10px] leading-tight">{lv.subtitle}</div>
            </div>
          ))}
        </div>

        {/* High scores */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-4 animate-fadeIn" style={{ animationDelay: "300ms" }}>
          <div className="text-xs uppercase tracking-widest text-white/50 mb-2 text-center">🏆 High Scores</div>
          {highScores.length === 0 ? (
            <div className="text-center text-white/40 text-xs py-2">No scores yet. Be the first!</div>
          ) : (
            <div className="space-y-1">
              {highScores.slice(0, 5).map((hs, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-white/5">
                  <div className="flex items-center gap-3">
                    <span className="font-bold tabular-nums text-white/50 w-6">#{i + 1}</span>
                    <span className="text-white font-bold tabular-nums">{hs.score.toLocaleString()}</span>
                  </div>
                  <div className="text-white/50">Lv {hs.level} · {hs.date}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="mt-6 text-center text-white/50 text-xs animate-fadeIn" style={{ animationDelay: "400ms" }}>
          <div className="flex flex-wrap justify-center gap-4">
            <span>🎮 WASD / Arrows to move</span>
            <span>⬆ SPACE to jump</span>
            <span>📱 Touch controls on mobile</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function TouchControls({
  onDirStart,
  onDirEnd,
  onJump,
  accent,
}: {
  onDirStart: (dir: { x: number; y: number }) => void;
  onDirEnd: () => void;
  onJump: () => void;
  accent: string;
}) {
  const btnClass = "flex items-center justify-center active:scale-90 transition-transform select-none touch-none";
  const btnStyle = {
    background: "rgba(0,0,0,0.5)",
    border: `2px solid ${accent}55`,
    backdropFilter: "blur(8px)",
    boxShadow: `0 0 12px ${accent}33`,
  };

  return (
    <div className="absolute inset-x-0 bottom-4 z-20 flex justify-between items-end px-4 sm:hidden pointer-events-none">
      {/* D-pad */}
      <div className="relative pointer-events-auto" style={{ width: 160, height: 160 }}>
        <button
          className={btnClass + " absolute left-1/2 top-0 -translate-x-1/2 rounded-t-2xl"}
          style={{ ...btnStyle, width: 56, height: 56 }}
          onTouchStart={(e) => { e.preventDefault(); onDirStart({ x: 0, y: -1 }); }}
          onTouchEnd={(e) => { e.preventDefault(); onDirEnd(); }}
          aria-label="Up"
        >▲</button>
        <button
          className={btnClass + " absolute bottom-0 left-1/2 -translate-x-1/2 rounded-b-2xl"}
          style={{ ...btnStyle, width: 56, height: 56 }}
          onTouchStart={(e) => { e.preventDefault(); onDirStart({ x: 0, y: 1 }); }}
          onTouchEnd={(e) => { e.preventDefault(); onDirEnd(); }}
          aria-label="Down"
        >▼</button>
        <button
          className={btnClass + " absolute left-0 top-1/2 -translate-y-1/2 rounded-l-2xl"}
          style={{ ...btnStyle, width: 56, height: 56 }}
          onTouchStart={(e) => { e.preventDefault(); onDirStart({ x: -1, y: 0 }); }}
          onTouchEnd={(e) => { e.preventDefault(); onDirEnd(); }}
          aria-label="Left"
        >◀</button>
        <button
          className={btnClass + " absolute right-0 top-1/2 -translate-y-1/2 rounded-r-2xl"}
          style={{ ...btnStyle, width: 56, height: 56 }}
          onTouchStart={(e) => { e.preventDefault(); onDirStart({ x: 1, y: 0 }); }}
          onTouchEnd={(e) => { e.preventDefault(); onDirEnd(); }}
          aria-label="Right"
        >▶</button>
      </div>

      {/* Jump button */}
      <button
        className={btnClass + " pointer-events-auto rounded-full font-black text-white"}
        style={{
          width: 84,
          height: 84,
          background: `radial-gradient(circle at 30% 30%, ${accent}, ${accent}88)`,
          border: `3px solid rgba(255,255,255,0.3)`,
          boxShadow: `0 0 24px ${accent}88`,
          fontSize: 14,
        }}
        onTouchStart={(e) => { e.preventDefault(); onJump(); }}
        aria-label="Jump"
      >
        JUMP
      </button>
    </div>
  );
}
