"use client";
import GameGrid from "@/components/gameGrid";
import MineGameLogic from "../shared/mineGameLogic";
import WelcomeMessage from "@/components/WelcomeMessage";
import RoomName from "@/components/RoomName";
import InGamePlayerList from "@/components/InGamePlayerList";
import { useEffect, useState } from "react";
import socket from "@/socket";
import { PlayerWithScore } from "@/interface";
import Chat from "@/components/Chat";
import { Bomb, Hourglass } from "lucide-react";

export default function GamePage() {
  const {
    roomId,
    roomName,
    size,
    started,
    gameOver,
    revealed,
    bombsInfo,
    winners,
    leaderboard,
    turnLimit,
    chatEnabled,
    currentPlayer,
    players,
    timeRemaining,
    myId,
    isMyTurn,
    pickCell,
    returnCountdown,
    scores,
  } = MineGameLogic();

  const [playerWithUsername, setPlayersWithUsername] = useState<
    PlayerWithScore[]
  >([]);

  useEffect(() => {
    socket.emit("requestPlayerListOnStartGame");
    socket.on("playerListOnStartGame", (players: PlayerWithScore[]) => {
      // console.log("34-Players in room:", players);
      setPlayersWithUsername(players);
    });

    return () => {
      socket.off("requestPlayerListOnStartGame");
      socket.off("playerListOnStartGame");
    };
  }, [players]);

  useEffect(() => {
    const newPlayersWithUserName = playerWithUsername.map((p) => {
      return {
        userID: p.userID,
        username: p.username,
        score: scores.get ? scores.get(p.userID) || p.score : p.score,
      };
    });
    setPlayersWithUsername(newPlayersWithUserName);
  }, [scores]);

  return (
    <div className="h-lvh">
      <div className="md:h-full h-fit flex flex-col md:flex-row items-center justify-center p-4 gap-4">
        {/* left pane */}
        <div className="flex flex-col w-full md:h-full h-fit gap-4">
          <RoomName
            roomName={roomName}
            roomCode={roomId}
            trashVisible={false}
          />
          {/* Main tile with GameGrid */}
          <div className="rounded-lg border bg-white flex flex-col gap-4 p-4 w-full h-full">
            {/* Timer & Bombs found */}
            <div className="w-full h-fit flex items-center justify-center gap-6 text-h3">
              {turnLimit > 0 && (
                <div className="flex items-center gap-2">
                  <Hourglass className="text-gray-dark" />{" "}
                  <span>{timeRemaining}s</span>
                </div>
              )}
              {bombsInfo && (
                <div className="flex items-center gap-2">
                  <Bomb className="text-gray-dark" />
                  <span>
                    {bombsInfo.found} / {bombsInfo.total}
                  </span>
                </div>
              )}
            </div>
            <GameGrid
              size={size!}
              onPickAction={pickCell}
              revealed={revealed}
            />
          </div>
        </div>

        {/* right pane */}
        <div className="flex flex-col gap-4 md:w-fit md:min-w-1/3 w-full h-full">
          <InGamePlayerList
            players={playerWithUsername}
            myId={myId}
            currentPlayer={currentPlayer || ""}
          />
          {chatEnabled && <Chat />}
        </div>
      </div>
    </div>
    // <div className="h-lvh bg-amber-200">
    //   <div className="bg-purple h-full flex-grow m-4 flex flex-col md:flex-row items-center justify-center p-4 gap-6 md:gap-4">
    //     {/* left pane */}
    //     <div className="bg-green h-full w-full flex flex-col gap-4">
    //       <RoomName
    //         roomName={roomName}
    //         roomCode={roomId}
    //         trashVisible={false}
    //       />
    //       <div>
    //         {/* Timer & Bombs found */}
    //         <p>hi</p>
    //         {/* <div className=" h-fit flex items-center justify-center gap-2 text-h3">
    //           {turnLimit > 0 && (
    //             <div>
    //               <Hourglass /> <span>{timeRemaining}s</span>
    //             </div>
    //           )}
    //           {bombsInfo && (
    //             <div className="flex items-center gap-2">
    //               <Bomb className="text-gray-dark" />
    //               <span>
    //                 {bombsInfo.found} / {bombsInfo.total}
    //               </span>
    //             </div>
    //           )}
    //         </div> */}
    //         {/* {started && <WelcomeMessage />} */}

    //         {/* <div className="md:flex md:h--full max-h-[500px] flex-none mb-2 justify-center bg-amber-200 p-5 aspect-square">FOR FLEXBOX SIZING TEST</div> */}
    //         {/* <GameGrid
    //           size={size!}
    //           onPickAction={pickCell}
    //           revealed={revealed}
    //         /> */}
    //       </div>
    //     </div>

    //     {/* right pane */}
    //     <div className="min-w-[370px] h-full flex flex-col gap-4">
    //       <div className="flex-none">
    //         <InGamePlayerList
    //           players={playerWithUsername}
    //           myId={myId}
    //           currentPlayer={currentPlayer || ""}
    //         />
    //       </div>
    //       {chatEnabled && <Chat />}

    //       {gameOver && (
    //         <div className="result-div">
    //           {typeof returnCountdown === "number" && (
    //             <div className="mt-3 text-body font-bold text-white bg-black/65 px-2 py-3 rounded-md ">
    //               Returning to lobby in {returnCountdown}s...
    //             </div>
    //           )}

    //           {winners?.length ? (
    //             winners.length === 1 ? (
    //               <>
    //                 Winner: <strong>{winners[0].id.slice(-4)}</strong> with{" "}
    //                 <strong>{winners[0].score}</strong> bombs!
    //               </>
    //             ) : (
    //               <>
    //                 Tie:{" "}
    //                 <strong>
    //                   {winners.map((w) => w.id.slice(-4)).join(", ")}
    //                 </strong>{" "}
    //                 with <strong>{winners[0].score}</strong> bombs!
    //               </>
    //             )
    //           ) : (
    //             "All bombs found!"
    //           )}
    //           {leaderboard.length > 0 && (
    //             <ul className="score-div list-disc list-inside text-sm">
    //               {leaderboard.map(([id, score]) => (
    //                 <li key={id}>
    //                   {id.slice(-4)} — {score}
    //                 </li>
    //               ))}
    //             </ul>
    //           )}
    //         </div>
    //       )}
    //     </div>
    //   </div>
    // </div>
  );
}
