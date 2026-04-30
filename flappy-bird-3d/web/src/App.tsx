import { useEffect, useRef, useState, useCallback } from "react";
import { FlappyBirdGame, type GameState } from "./game/Game";
import { DIFFICULTIES, DIFFICULTY_KEYS, type Difficulty } from "./game/constants";
import { client } from "@/lib/edgespark";
import gsap from "gsap";

interface ScoreEntry {
  id: number;
  player_name: string;
  score: number;
  difficulty: string;
  created_at: string;
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<FlappyBirdGame | null>(null);

  const [gameState, setGameState] = useState<GameState>("idle");
  const [score, setScore] = useState(0);
  const [finalScore, setFinalScore] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>("rookie");
  const [themeName, setThemeName] = useState("");
  const [leaderboards, setLeaderboards] = useState<Record<Difficulty, ScoreEntry[]>>({
    rookie: [], normal: [], master: [],
  });
  const [lbTab, setLbTab] = useState<Difficulty>("rookie");
  const [playerName, setPlayerName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchLeaderboard = useCallback(async (diff?: Difficulty) => {
    const diffs = diff ? [diff] : DIFFICULTY_KEYS;
    const results = await Promise.all(
      diffs.map(async (d) => {
        try {
          const res = await client.api.fetch(`/api/public/leaderboard?difficulty=${d}`);
          const data = await res.json();
          return [d, data.leaderboard] as [Difficulty, ScoreEntry[]];
        } catch { return [d, []] as [Difficulty, ScoreEntry[]]; }
      })
    );
    setLeaderboards((prev) => {
      const next = { ...prev };
      for (const [d, entries] of results) next[d] = entries;
      return next;
    });
  }, []);

  const submitScore = useCallback(
    async (name: string, s: number) => {
      if (!name.trim() || s <= 0) return;
      setLoading(true);
      try {
        await client.api.fetch("/api/public/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ player_name: name.trim(), score: s, difficulty }),
        });
        setSubmitted(true);
        await fetchLeaderboard(difficulty);
      } catch { /* ignore */ }
      setLoading(false);
    },
    [fetchLeaderboard, difficulty]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const game = new FlappyBirdGame(canvas, {
      onScoreChange: setScore,
      onGameOver: (s) => { setFinalScore(s); setSubmitted(false); fetchLeaderboard(); },
      onStateChange: (s) => { setGameState(s); if (s === "playing") setThemeName(""); },
      onThemeChange: (name) => { setThemeName(name); setTimeout(() => setThemeName(""), 3000); },
    });
    gameRef.current = game;
    fetchLeaderboard();
    return () => game.dispose();
  }, [fetchLeaderboard]);

  useEffect(() => {
    gameRef.current?.setDifficulty(difficulty);
    setLbTab(difficulty);
  }, [difficulty]);

  const handleRestart = () => {
    gameRef.current?.restart();
    setScore(0); setSubmitted(false); setPlayerName("");
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full touch-none" />

      {gameState === "playing" && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
          <ScoreDisplay score={score} />
        </div>
      )}

      {themeName && gameState === "playing" && <ThemeNotification name={themeName} />}

      {gameState === "idle" && (
        <IdleOverlay
          leaderboards={leaderboards} lbTab={lbTab} setLbTab={setLbTab}
          difficulty={difficulty} onDifficultyChange={setDifficulty}
        />
      )}

      {gameState === "dead" && (
        <GameOverOverlay
          score={finalScore} difficulty={difficulty}
          leaderboards={leaderboards} lbTab={lbTab} setLbTab={setLbTab}
          playerName={playerName} setPlayerName={setPlayerName}
          submitted={submitted} loading={loading}
          onSubmit={() => submitScore(playerName, finalScore)}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

/* ── Score HUD ─────────────────────────────────────────── */
function ScoreDisplay({ score }: { score: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const prev = useRef(score);
  useEffect(() => {
    if (score > prev.current && ref.current)
      gsap.fromTo(ref.current, { scale: 1.4 }, { scale: 1, duration: 0.25, ease: "back.out(3)" });
    prev.current = score;
  }, [score]);

  return (
    <div
      ref={ref}
      className="text-7xl sm:text-8xl font-black text-white select-none"
      style={{ textShadow: "0 0 12px rgba(255,220,0,0.5), 2px 3px 0 #333" }}
    >
      {score}
    </div>
  );
}

/* ── Theme toast ───────────────────────────────────────── */
function ThemeNotification({ name }: { name: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: -20 }, { opacity: 1, y: 0, duration: 0.4, ease: "back.out(2)" });
    gsap.to(ref.current, { opacity: 0, y: -10, duration: 0.4, delay: 2.2 });
  }, [name]);

  return (
    <div ref={ref} className="absolute top-24 left-1/2 -translate-x-1/2 z-10 px-6 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/15">
      <span className="text-xs font-semibold text-white/80 tracking-widest uppercase">{name}</span>
    </div>
  );
}

/* ── Difficulty Pills ──────────────────────────────────── */
function DifficultyPills({
  value, onChange, size = "md",
}: {
  value: Difficulty;
  onChange: (d: Difficulty) => void;
  size?: "sm" | "md";
}) {
  const px = size === "sm" ? "px-4 py-1.5 text-xs" : "px-5 py-2.5 text-sm";
  return (
    <div className="inline-flex gap-1 rounded-full bg-black/25 backdrop-blur-md p-1 border border-white/10">
      {DIFFICULTY_KEYS.map((d) => {
        const cfg = DIFFICULTIES[d];
        const active = value === d;
        return (
          <button
            key={d}
            onClick={(e) => { e.stopPropagation(); onChange(d); }}
            onTouchEnd={(e) => { e.stopPropagation(); e.preventDefault(); onChange(d); }}
            className={`${px} rounded-full font-bold tracking-wide transition-all duration-200 ${
              active ? "text-black shadow-lg" : "text-white/50 hover:text-white/80"
            }`}
            style={active ? { backgroundColor: cfg.color } : undefined}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Leaderboard Tabs ──────────────────────────────────── */
function LbTabs({ active, onChange }: { active: Difficulty; onChange: (d: Difficulty) => void }) {
  return (
    <div className="flex gap-1 mb-3">
      {DIFFICULTY_KEYS.map((d) => {
        const cfg = DIFFICULTIES[d];
        const isActive = active === d;
        return (
          <button
            key={d}
            onClick={(e) => { e.stopPropagation(); onChange(d); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              isActive ? "text-black" : "text-white/40 bg-white/5 hover:text-white/70"
            }`}
            style={isActive ? { backgroundColor: cfg.color } : undefined}
          >
            {cfg.label}
          </button>
        );
      })}
    </div>
  );
}

/* ── Idle Screen ───────────────────────────────────────── */
function IdleOverlay({
  leaderboards, lbTab, setLbTab, difficulty, onDifficultyChange,
}: {
  leaderboards: Record<Difficulty, ScoreEntry[]>;
  lbTab: Difficulty; setLbTab: (d: Difficulty) => void;
  difficulty: Difficulty; onDifficultyChange: (d: Difficulty) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" });
  }, []);

  return (
    <div ref={ref} className="absolute inset-0 z-10 flex flex-col items-center justify-center pointer-events-none">
      <div className="text-center mb-8">
        <h1
          className="text-5xl sm:text-7xl font-black text-white mb-1.5 tracking-tight"
          style={{ textShadow: "0 0 24px rgba(255,220,0,0.4), 3px 3px 0 #2d7d32" }}
        >
          FLAPPY BIRD
        </h1>
        <div className="text-lg text-yellow-200/80 font-semibold tracking-widest" style={{ textShadow: "1px 1px 2px rgba(0,0,0,0.5)" }}>
          3D EDITION
        </div>
      </div>

      <div className="pointer-events-auto mb-8">
        <DifficultyPills value={difficulty} onChange={onDifficultyChange} />
      </div>

      <div className="text-base text-white/70 font-medium animate-pulse tracking-wide" style={{ textShadow: "1px 1px 3px rgba(0,0,0,0.5)" }}>
        Tap or press Space
      </div>

      {Object.values(leaderboards).some((l) => l.length > 0) && (
        <div className="mt-8 pointer-events-auto w-72">
          <LbTabs active={lbTab} onChange={setLbTab} />
          <LeaderboardTable entries={leaderboards[lbTab]} compact />
        </div>
      )}
    </div>
  );
}

/* ── Game Over ─────────────────────────────────────────── */
function GameOverOverlay({
  score, difficulty, leaderboards, lbTab, setLbTab,
  playerName, setPlayerName, submitted, loading, onSubmit, onRestart,
}: {
  score: number; difficulty: Difficulty;
  leaderboards: Record<Difficulty, ScoreEntry[]>;
  lbTab: Difficulty; setLbTab: (d: Difficulty) => void;
  playerName: string; setPlayerName: (v: string) => void;
  submitted: boolean; loading: boolean;
  onSubmit: () => void; onRestart: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    gsap.fromTo(ref.current, { opacity: 0, scale: 0.92, y: 30 }, { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.5)", delay: 0.3 });
  }, []);
  useEffect(() => { setLbTab(difficulty); }, [difficulty, setLbTab]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        ref={ref}
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        style={{
          background: "linear-gradient(160deg, rgba(28,28,48,0.96), rgba(16,16,32,0.98))",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)",
        }}
      >
        {/* Score */}
        <div className="pt-8 pb-5 text-center">
          <div className="text-sm font-semibold text-red-400/90 tracking-widest uppercase mb-2">Game Over</div>
          <div className="text-6xl font-black text-white leading-none" style={{ textShadow: "0 0 20px rgba(255,220,0,0.4)" }}>
            {score}
          </div>
          <div className="mt-2 inline-block px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide" style={{ backgroundColor: DIFFICULTIES[difficulty].color, color: "#000" }}>
            {DIFFICULTIES[difficulty].label}
          </div>
        </div>

        <div className="border-t border-white/8" />

        {/* Submit */}
        {!submitted && score > 0 && (
          <>
            <div className="px-6 py-5">
              <div className="flex gap-2.5">
                <input
                  type="text" value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  onKeyDown={(e) => { e.stopPropagation(); if (e.key === "Enter") onSubmit(); }}
                  placeholder="Your name" maxLength={20}
                  className="flex-1 px-4 py-2.5 bg-white/8 border border-white/12 rounded-xl text-white placeholder-white/30 text-sm focus:outline-none focus:border-yellow-400/50"
                />
                <button
                  onClick={onSubmit} disabled={loading || !playerName.trim()}
                  className="px-5 py-2.5 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-xl text-sm disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "..." : "Save"}
                </button>
              </div>
            </div>
            <div className="border-t border-white/8" />
          </>
        )}
        {submitted && (
          <>
            <div className="px-6 py-3 text-center text-green-400/90 text-xs font-medium tracking-wide">Saved!</div>
            <div className="border-t border-white/8" />
          </>
        )}

        {/* Leaderboard */}
        <div className="px-6 py-5 max-h-56 overflow-y-auto custom-scrollbar">
          <LbTabs active={lbTab} onChange={setLbTab} />
          <LeaderboardTable entries={leaderboards[lbTab]} highlightScore={submitted && lbTab === difficulty ? score : undefined} />
        </div>

        <div className="border-t border-white/8" />

        {/* Restart */}
        <div className="px-6 py-5">
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl text-sm font-bold text-white/90 bg-white/8 hover:bg-white/15 border border-white/10 hover:border-white/20 transition-all tracking-wide"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Leaderboard Table ─────────────────────────────────── */
function LeaderboardTable({ entries, compact, highlightScore }: {
  entries: ScoreEntry[]; compact?: boolean; highlightScore?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const rows = ref.current.querySelectorAll("[data-row]");
    gsap.fromTo(rows, { opacity: 0, x: -8 }, { opacity: 1, x: 0, duration: 0.25, stagger: 0.03, ease: "power2.out" });
  }, [entries]);

  const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
  const display = compact ? entries.slice(0, 5) : entries;

  if (display.length === 0) {
    return <div className="text-center text-white/25 text-xs py-6 tracking-wide">No scores yet</div>;
  }

  return (
    <div ref={ref} className="space-y-1">
      {display.map((entry, i) => {
        const isHL = highlightScore !== undefined && entry.score === highlightScore;
        return (
          <div
            key={entry.id} data-row
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              isHL ? "bg-yellow-500/15 border border-yellow-500/25" : "bg-white/[0.03]"
            }`}
          >
            <span className="w-5 text-center font-bold text-[11px]" style={{ color: i < 3 ? medals[i] : "rgba(255,255,255,0.3)" }}>
              {i + 1}
            </span>
            <span className="flex-1 text-white/80 truncate font-medium">{entry.player_name}</span>
            <span className="font-bold tabular-nums text-white/60" style={i < 3 ? { color: medals[i] } : undefined}>
              {entry.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default App;
