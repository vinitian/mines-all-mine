//page.tsx (game page)
"use client";
import { useSearchParams } from "next/navigation";
import GameGrid from "../../components/gameGrid";
import { mineGameLogic } from "../shared/mineGameLogic";
import "./page.css";
import socket from "@/socket";
import Link from "next/link";

export default function GamePage() {
  const searchParams = useSearchParams();
  const raw = searchParams.get("size");
  const n = Number(raw);
  const size = [6, 8, 10].includes(n) ? n : 6;

  const bombCount = Number(searchParams.get("bombCount")) || undefined;
  const tl = Number(searchParams.get("tl")) || 10;

  const {
    started,
    gameOver,
    revealed,
    bombsInfo,
    winners,
    leaderboard,
    turnLimit,
    currentPlayer,
    players,
    timeRemaining,
    myId,
    isMyTurn,
    pickCell,
  
    resetLocal,
  } = mineGameLogic(size);

  //console.log("Turn limit:", turnLimit, "seconds per turn")

  const startBtnLabel = started
    ? "In Progress…"
    : gameOver
    ? "Play Again"
    : "Start Game";

  return (
    <div className="game-div-container">
      <h1 className="game-title"></h1>
      <div id="game-div">
        <Link href="/" className="cta">
          Home
        </Link>
        <div className="bomb-count-div flex items-center gap-2">
          {/* <button
            onClick={() => (gameOver ? resetLocal() : startGame())}
            disabled={started}
            className="start-btn"
          >
            {startBtnLabel}
          </button> */}
          {turnLimit > 0 && <div>Time per turn: {turnLimit} seconds</div>}
          {bombsInfo && (
            <span className="ml-3">
              Bombs: {bombsInfo.found} / {bombsInfo.total}
            </span>
          )}
        </div>

        {started && !gameOver && (
          <div
            className="turn-info"
            style={{
              padding: "10px",
              margin: "10px 0",
              background: isMyTurn ? "#4CAF50" : "#f0f0f0",
              color: isMyTurn ? "white" : "black",
              borderRadius: "5px",
              fontWeight: "bold",
            }}
          >
            {isMyTurn ? (
              <>
                YOUR TURN!
                {turnLimit > 0 && ` (${timeRemaining}s remaining)`}
              </>
            ) : (
              <>
                Waiting for Player {currentPlayer?.slice(-4)}'s turn
                {turnLimit > 0 && ` (${timeRemaining}s remaining)`}
              </>
            )}
          </div>
        )}

        {players.length > 0 && (
          <div style={{ margin: "10px 0", fontSize: "14px" }}>
            <strong>Players ({players.length}):</strong>{" "}
            {players.map((p) => (
              <span
                key={p}
                style={{
                  marginRight: "8px",
                  fontWeight: p === myId ? "bold" : "normal",
                  color: p === currentPlayer ? "#4CAF50" : "inherit",
                }}
              >
                {p.slice(-4)}
                {p === myId ? " (You)" : ""}
                {p === currentPlayer ? " 👈" : ""}
              </span>
            ))}
          </div>
        )}

        <GameGrid size={size} onPick={pickCell} revealed={revealed} />

        {gameOver && (
          <div className="result-div">
            {winners?.length ? (
              winners.length === 1 ? (
                <>
                  Winner: <strong>{winners[0].id.slice(-4)}</strong> with{" "}
                  <strong>{winners[0].score}</strong> bombs!
                </>
              ) : (
                <>
                  Tie:{" "}
                  <strong>
                    {winners.map((w) => w.id.slice(-4)).join(", ")}
                  </strong>{" "}
                  with <strong>{winners[0].score}</strong> bombs!
                </>
              )
            ) : (
              "All bombs found!"
            )}
            {leaderboard.length > 0 && (
              <ul className="score-div list-disc list-inside text-sm">
                {leaderboard.map(([id, score]) => (
                  <li key={id}>
                    {id.slice(-4)} — {score}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
