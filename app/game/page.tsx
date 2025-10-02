'use client';
import { useSearchParams } from 'next/navigation';
import GameGrid from "../gameGrid";
import { mineGameLogic } from '../shared/mineGameLogic';
import './page.css';



export default function GamePage() {
    const searchParams = useSearchParams();
    const raw = searchParams.get('size');
    const n = Number(raw);
    const size = [6, 8, 10].includes(n) ? n : 6; 

  
    const {
        started, gameOver,
        revealed, bombsInfo, winners, leaderboard,
        pickCell, startGame, resetLocal,
      } = mineGameLogic(size);

    const startBtnLabel = started ? 'In Progress…' : gameOver ? 'Play Again' : 'Start Game';

    return (
      <div className="game-div-container">
        <h1 className="game-title"></h1>
        <div id="game-div">
        <div className="bomb-count-div flex items-center gap-2">
          <button
            onClick={() => (gameOver ? resetLocal() : startGame())}
            disabled={started}
            className="start-btn"
          >
            {startBtnLabel}
          </button>

          {bombsInfo && (
            <span className="ml-3">Bombs: {bombsInfo.found} / {bombsInfo.total}</span>
          )}
        </div>
        <GameGrid size={size} onPick={pickCell} revealed={revealed} />

        {gameOver && (
          <div className="result-div">
            {winners?.length
              ? (winners.length === 1
                  ? <>Winner: <strong>{winners[0].id.slice(-4)}</strong> with <strong>{winners[0].score}</strong> bombs!</>
                  : <>Tie: <strong>{winners.map(w => w.id.slice(-4)).join(', ')}</strong> with <strong>{winners[0].score}</strong> bombs!</>)
              : 'All bombs found!'}
            {leaderboard.length > 0 && (
              <ul className="score-div list-disc list-inside text-sm">
                {leaderboard.map(([id, score]) => (
                  <li key={id}>{id.slice(-4)} — {score}</li>
                ))}
              </ul>
            )}
            </div>
        )}
        </div>
      </div>
    );
}