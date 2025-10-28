"use client";
import GameGrid from "@/components/gameGrid";
import MineGameLogic from "../shared/mineGameLogic";
import "./page.css";
import Link from "next/link";
import WelcomeMessage from "@/components/WelcomeMessage";

export default function GamePage() {
  const {
    size,
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
    returnCountdown,
  } = MineGameLogic();

  // REMOVED duplicate return - fixed syntax error
  return (
    <div className="game-div-container  bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
      {started && <WelcomeMessage />}
      {/* later {started && <WelcomeMessage text={`Welcome to Mines all Mine, ${nickname}!`} />} */}

      <h1 className="absolute text-3xl text-semibold top-[2%] left-[2%]">
        Room 1
      </h1>
      <div id="game-div">
        <Link href="/" className="cta">
          Home
        </Link>

        <div className="bomb-count-div flex items-center gap-2">
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

        <GameGrid size={size!} onPick={pickCell} revealed={revealed} />

        {gameOver && (
          <div className="result-div">
            {typeof returnCountdown === "number" && (
              <div className="mt-3 text-body font-bold text-white bg-black/65 px-2 py-3 rounded-md ">
                Returning to lobby in {returnCountdown}s...
              </div>
            )}

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
