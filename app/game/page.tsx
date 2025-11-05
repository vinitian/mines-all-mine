"use client";
import GameGrid from "@/components/gameGrid";
import MineGameLogic from "../shared/mineGameLogic";
import WelcomeMessage from "@/components/WelcomeMessage";
import RoomName from "@/components/RoomName";
import InGamePlayerList from "@/components/InGamePlayerList";
import { useEffect, useState, useContext } from "react";
import socket from "@/socket";
import { PlayerWithScore } from "@/interface";
import Chat from "@/components/Chat";
import { Bomb, Hourglass } from "lucide-react";
import { useRouter } from "next/navigation";
import { ChatContext } from "@/components/ChatContext";

export default function GamePage() {
  const router = useRouter();
  const { messages, setMessages } = useContext(ChatContext);
  const {
    roomId,
    roomName,
    size,
    started,
    gameOver,
    revealed,
    bombsInfo,
    winners,
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

  const [playersWithUsername, setPlayersWithUsername] = useState<
    PlayerWithScore[]
  >([]);

  const [winnersWithUsername, setWinnersWithUsername] = useState<
    PlayerWithScore[]
  >([]);

  // add usernames to players
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
    if (winners) {
      const winnerIdList = winners.map((w) => w.id);
      setWinnersWithUsername(
        playersWithUsername.filter((p) => winnerIdList.includes(p.userID))
      );
    }
  }, [winners]);

  useEffect(() => {
    const newPlayersWithUserName = playersWithUsername.map((p) => {
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
      {started && <WelcomeMessage />}

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
            players={playersWithUsername}
            myId={myId}
            currentPlayer={currentPlayer || ""}
          />

          {chatEnabled && <Chat />}
        </div>
      </div>

      {/* Winners popup */}
      {gameOver && (
        <div className="h-screen flex flex-col items-center justify-center backdrop-blur-sm bg-black/30 fixed inset-0">
          <div className="p-5 w-3/4 max-w-100 h-84 bg-white rounded-2xl shadow flex flex-col gap-5 justify-center text-center whitespace-pre-line">
            <div className="rounded-lg p-4 text-h4 text-center bg-green text-white">
              {winnersWithUsername.length ? (
                winnersWithUsername.length === 1 ? (
                  <>
                    <strong>{winnersWithUsername[0].username}</strong> wins with{" "}
                    <strong>{winnersWithUsername[0].score}</strong> bombs!
                  </>
                ) : (
                  <>
                    Tie between{" "}
                    <strong>
                      {
                        winnersWithUsername
                          .slice(0, -1)
                          .map((w) => w.username)
                          .join(", ")
                          .slice(0, -1)[0] // remove the last space
                      }
                    </strong>
                    {" and "}
                    <strong>
                      {
                        winnersWithUsername[winnersWithUsername.length - 1]
                          .username
                      }
                    </strong>{" "}
                    with <strong>{winnersWithUsername[0].score}</strong> bombs!
                  </>
                )
              ) : (
                "All bombs found!"
              )}
            </div>
            {playersWithUsername.slice().sort((a, b) => b.score - a.score)
              .length > 0 && (
              <ul className="list-disc list-inside text-sm text-left">
                {playersWithUsername
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((p) => (
                    <li key={p.userID}>
                      {p.username} — {p.score}
                    </li>
                  ))}
              </ul>
            )}
            {typeof returnCountdown === "number" && (
              <div className="mt-3 text-body font-bold text-white bg-black/50 px-2 py-3 rounded-md ">
                Returning to lobby in {returnCountdown}s...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
