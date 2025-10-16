"use client";

import React, { useEffect, useState } from "react";
import socket from "@/socket";
import { Player } from "@/interface";

export default function PlayerList({
  playerLimit,
  players,
}: {
  playerLimit: number;
  players: Player[];
}) {
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
          return <div key={player.userID}>- {player.username}</div>;
        })}
      </div>
    </div>
  );
}
