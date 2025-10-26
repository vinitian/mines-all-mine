"use client";

import React, { useEffect, useState } from "react";
import socket from "@/socket";
import { Player } from "@/interface";

export default function PlayerList({
  playerLimit,
  players,
  isHost,
}: {
  playerLimit: number;
  players: Player[];
  isHost: boolean;
}) {
  const handleKickPlayer = (playerID: string) => {
    socket.emit("kick_player", { playerID });
  };

  // remove player from database & remove player from room (forced leave room?)
  // if players get kicked/leave room --> playerlist update real-time?

  return (
    <div className="rounded-lg border bg-white flex flex-col p-[10px] w-full h-full">
      <div className="px-2 flex justify-between items-center">
        <div className="text-h1">Players</div>
        <div className="text-h1">
          {players.length}/{playerLimit}
        </div>
      </div>
      <div className="text-h3">
        {players.map((player: Player) => {
          return (
            <div
              key={player.userID}
              className="flex justify-between items-baseline"
            >
              <span>- {player.username}</span>

              {isHost && player.userID !== socket.auth.userID && (
                <span className="px-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    onClick={() => {}}
                    className="lucide lucide-trash-icon lucide-trash text-red
                  size-[24px] hover:stroke-blue transition-colors duration-200 cursor-pointer"
                  >
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                    <path d="M3 6h18" />
                    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
// ISSUE: the player doesn't see the players that join before them
// update player limit real-time
