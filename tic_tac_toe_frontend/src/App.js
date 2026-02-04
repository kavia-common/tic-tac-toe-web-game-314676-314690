import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const THEME_STORAGE_KEY = "ttt_theme";
const SCORE_STORAGE_KEY = "ttt_scoreboard_v1";

const LINES = [
  // Rows
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  // Cols
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  // Diagonals
  [0, 4, 8],
  [2, 4, 6],
];

function loadScoreboard() {
  try {
    const raw = window.localStorage.getItem(SCORE_STORAGE_KEY);
    if (!raw) return { X: 0, O: 0, draws: 0 };
    const parsed = JSON.parse(raw);
    return {
      X: Number.isFinite(parsed?.X) ? parsed.X : 0,
      O: Number.isFinite(parsed?.O) ? parsed.O : 0,
      draws: Number.isFinite(parsed?.draws) ? parsed.draws : 0,
    };
  } catch {
    return { X: 0, O: 0, draws: 0 };
  }
}

function saveScoreboard(scoreboard) {
  try {
    window.localStorage.setItem(SCORE_STORAGE_KEY, JSON.stringify(scoreboard));
  } catch {
    // Ignore storage errors.
  }
}

// PUBLIC_INTERFACE
function App() {
  /** Tic Tac Toe game UI (3x3), including turn status, win/draw detection, scoreboard, and reset controls. */
  const [board, setBoard] = useState(() => Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

  const [scoreboard, setScoreboard] = useState(() => loadScoreboard());

  // Tracks whether the current round has already been counted into the scoreboard.
  const roundCountedRef = useRef(false);

  const [theme, setTheme] = useState(() => {
    // Prefer saved choice, otherwise follow OS preference.
    try {
      const saved = window.localStorage.getItem(THEME_STORAGE_KEY);
      if (saved === "light" || saved === "dark") return saved;
    } catch {
      // Ignore storage errors (e.g., disabled storage).
    }

    const prefersDark =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;

    return prefersDark ? "dark" : "light";
  });

  useEffect(() => {
    // Bind theme to the root for CSS variable switching and better native form theming.
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // Ignore storage errors.
    }
  }, [theme]);

  useEffect(() => {
    // Persist scoreboard for the session/user.
    saveScoreboard(scoreboard);
  }, [scoreboard]);

  // PUBLIC_INTERFACE
  const setAppTheme = (nextTheme) => {
    /** Set the app theme (light or dark) and persist it locally. */
    setTheme(nextTheme);
  };

  const analysis = useMemo(() => {
    const winnerInfo = calculateWinner(board);
    const winner = winnerInfo?.winner ?? null;
    const isDraw = !winner && board.every((c) => c !== null);

    let status = `Turn: ${xIsNext ? "X" : "O"}`;
    if (winner) status = `Winner: ${winner}`;
    if (isDraw) status = "It's a draw";

    return {
      status,
      winner,
      winningLine: winnerInfo?.line ?? null,
      isDraw,
      isGameOver: Boolean(winner) || isDraw,
      nextPlayer: xIsNext ? "X" : "O",
    };
  }, [board, xIsNext]);

  useEffect(() => {
    // Update scoreboard exactly once per round when the game ends.
    if (!analysis.isGameOver || roundCountedRef.current) return;

    roundCountedRef.current = true;
    setScoreboard((prev) => {
      if (analysis.winner === "X") return { ...prev, X: prev.X + 1 };
      if (analysis.winner === "O") return { ...prev, O: prev.O + 1 };
      if (analysis.isDraw) return { ...prev, draws: prev.draws + 1 };
      return prev;
    });
  }, [analysis.isGameOver, analysis.isDraw, analysis.winner]);

  const handleSquareClick = (idx) => {
    // Ignore clicks on filled squares or after game ends.
    if (analysis.isGameOver || board[idx] !== null) return;

    setBoard((prev) => {
      const next = prev.slice();
      next[idx] = xIsNext ? "X" : "O";
      return next;
    });
    setXIsNext((v) => !v);
  };

  // PUBLIC_INTERFACE
  const resetRound = () => {
    /** Reset the board for a new round while keeping the scoreboard. */
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    roundCountedRef.current = false;
  };

  // PUBLIC_INTERFACE
  const resetScores = () => {
    /** Reset the scoreboard counts back to 0 (also starts a fresh round). */
    setScoreboard({ X: 0, O: 0, draws: 0 });
    setBoard(Array(9).fill(null));
    setXIsNext(true);
    roundCountedRef.current = false;
  };

  const primaryCtaLabel = analysis.isGameOver ? "Next round" : "Reset round";

  return (
    <div className="App">
      <main className="ttt-page">
        <section className="ttt-card" aria-label="Tic Tac Toe">
          <header className="ttt-header">
            <div className="ttt-header-top">
              <h1 className="ttt-title">Tic Tac Toe</h1>

              <div className="ttt-theme" aria-label="Theme selector">
                <label className="ttt-theme-label" htmlFor="ttt-theme-select">
                  Theme
                </label>
                <select
                  id="ttt-theme-select"
                  className="ttt-theme-select"
                  value={theme}
                  onChange={(e) => setAppTheme(e.target.value)}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>

            <p className="ttt-subtitle">A classic 3×3 game for two players</p>
          </header>

          <div className="ttt-scoreboard" aria-label="Scoreboard">
            <div className="ttt-scoreboard-item">
              <div className="ttt-scoreboard-label">X wins</div>
              <div className="ttt-scoreboard-value">{scoreboard.X}</div>
            </div>
            <div className="ttt-scoreboard-item">
              <div className="ttt-scoreboard-label">Draws</div>
              <div className="ttt-scoreboard-value">{scoreboard.draws}</div>
            </div>
            <div className="ttt-scoreboard-item">
              <div className="ttt-scoreboard-label">O wins</div>
              <div className="ttt-scoreboard-value">{scoreboard.O}</div>
            </div>
          </div>

          <div className="ttt-status" role="status" aria-live="polite">
            <span className="ttt-status-pill">{analysis.status}</span>
          </div>

          <div className="ttt-board" role="grid" aria-label="Game board">
            {board.map((value, idx) => {
              const isWinning = analysis.winningLine?.includes(idx) ?? false;

              const ariaLabel = value
                ? `Square ${idx + 1}, ${value}`
                : `Square ${idx + 1}, empty`;

              return (
                <button
                  key={idx}
                  type="button"
                  className={[
                    "ttt-square",
                    value ? "is-filled" : "",
                    isWinning ? "is-winning" : "",
                  ].join(" ")}
                  onClick={() => handleSquareClick(idx)}
                  aria-label={ariaLabel}
                  role="gridcell"
                >
                  <span className="ttt-mark" aria-hidden="true">
                    {value ?? ""}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="ttt-footer">
            <div className="ttt-announcement" aria-live="polite">
              {analysis.isGameOver ? (
                <div className="ttt-result">
                  <div className="ttt-result-title">
                    {analysis.winner ? `${analysis.winner} wins!` : "Draw game"}
                  </div>
                  <div className="ttt-result-subtitle">
                    {analysis.winner
                      ? "Score updated—start the next round when ready."
                      : "Score updated—start the next round when ready."}
                  </div>
                </div>
              ) : (
                <div className="ttt-hint">
                  Click a square to place <strong>{analysis.nextPlayer}</strong>.
                </div>
              )}
            </div>

            <div className="ttt-actions">
              <button
                type="button"
                className="ttt-reset"
                onClick={resetRound}
                aria-label={primaryCtaLabel}
              >
                {primaryCtaLabel}
              </button>

              <button
                type="button"
                className="ttt-reset ttt-reset-secondary"
                onClick={resetScores}
                aria-label="Reset scores"
              >
                Reset scores
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

// PUBLIC_INTERFACE
function calculateWinner(board) {
  /**
   * Determine a winner for the given board.
   * @param {Array<("X"|"O"|null)>} board 9-length board array.
   * @returns {{winner: ("X"|"O"), line: number[]} | null} Winner and winning indices.
   */
  for (const line of LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line };
    }
  }
  return null;
}

export default App;
