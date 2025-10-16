"use client";

import React, { useEffect, useState } from "react";
import socket from "@/socket";

export default function PlayerList({
  roomId,
  username,
}: {
  roomId: number;
  username: string | null;
}) {
  const [players, setPlayers] = useState<any[]>([]);

  useEffect(() => {
    const handlePlayerList = (playerList: any[]) => {
      setPlayers(playerList);
    };
    socket.on("player:list", handlePlayerList);
  });
}

// player count
