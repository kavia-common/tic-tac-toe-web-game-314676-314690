import React, { useMemo, useState } from "react";
import "./App.css";

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

// PUBLIC_INTERFACE
function App() {
  /** Tic Tac Toe game UI (3x3), including turn status, win/draw detection, result announcement, and reset. */
  const [board, setBoard] = useState(() => Array(9).fill(null));
  const [xIsNext, setXIsNext] = useState(true);

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
  const resetGame = () => {
    /** Reset the game back to the initial empty board with X to play first. */
    setBoard(Array(9).fill(null));
    setXIsNext(true);
  };

  return (
    <div className="App">
      <main className="ttt-page">
        <section className="ttt-card" aria-label="Tic Tac Toe">
          <header className="ttt-header">
            <h1 className="ttt-title">Tic Tac Toe</h1>
            <p className="ttt-subtitle">A classic 3×3 game for two players</p>
          </header>

          <div className="ttt-status" role="status" aria-live="polite">
            <span className="ttt-status-pill">{analysis.status}</span>
          </div>

          <div className="ttt-board" role="grid" aria-label="Game board">
            {board.map((value, idx) => {
              const isWinning =
                analysis.winningLine?.includes(idx) ?? false;

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
                    {analysis.winner
                      ? `${analysis.winner} wins!`
                      : "Draw game"}
                  </div>
                  <div className="ttt-result-subtitle">
                    {analysis.winner
                      ? "Nice play—reset to start a new round."
                      : "No moves left—reset to try again."}
                  </div>
                </div>
              ) : (
                <div className="ttt-hint">
                  Click a square to place{" "}
                  <strong>{analysis.nextPlayer}</strong>.
                </div>
              )}
            </div>

            <div className="ttt-actions">
              <button
                type="button"
                className="ttt-reset"
                onClick={resetGame}
              >
                Reset
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
