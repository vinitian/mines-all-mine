"use client";

import Image from "next/image";
import { PlayerWithScore } from "@/interface";
import { Bomb, ArrowLeft } from "lucide-react";

export default function InGamePlayerList({
  players,
  myId,
  currentPlayer,
}: {
  players: PlayerWithScore[];
  myId: string;
  currentPlayer: string;
}) {
  return (
    <div className="flex flex-col w-full h-full text-h3 rounded-lg border bg-white p-4 gap-1">
      {players.map((player: PlayerWithScore) => {
        const isCurrentPlayer = player.userID === currentPlayer;
        return (
          <div key={player.username} className="flex items-center gap-2.5">
            <div className="flex items-center w-fit justify-between gap-2 px-2 rounded-md text-white bg-blue">
              <Bomb className="w-6 h-6" />
              <span className="w-7 text-right">{player.score}</span>
            </div>
            <Image
              src="/default-avatar.svg"
              alt={`Profile image of ${player.username}`}
              width={100}
              height={100}
              referrerPolicy="no-referrer"
              className="w-6"
            />

            <div
              className={`flex gap-1 items-center ${
                isCurrentPlayer ? "font-bold text-green" : ""
              }`}
            >
              <span>{player.username}</span>
              {/* {isHost && <span> (Host)</span>} */}
              {myId === player.userID && <span> (You)</span>}
              {isCurrentPlayer && <ArrowLeft />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
