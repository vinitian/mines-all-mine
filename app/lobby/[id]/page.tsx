"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Room } from "@/interface";
import StatisticsButton from "@/components/StatisticsButton";
import { getRoom } from "@/services/client/roomService";

export default function LobbyPage() {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();

  const roomId = params.id as string;

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const roomData = await getRoom(parseInt(roomId));
        setRoom(roomData);
      } catch (error) {
        console.error("Error fetching room:", error);
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading room...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Room not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <StatisticsButton />
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-4">Room: {room.name}</h1>
        <div className="space-y-2">
          <p>ID: {room.id}</p>
          <p>Host ID: {room.host_id}</p>
          <p>Map Size: {room.size}x{room.size}</p>
          <p>Players: {room.player_id_list.length}/{room.player_limit}</p>
          <p>Mines: {room.bomb_count}</p>
          <p>Time Limit: {room.timer === 0 ? "Unlimited" : `${room.timer}s`}</p>
          <p>Chat: {room.chat_enabled ? "Enabled" : "Disabled"}</p>
          <p>Player IDs: {room.player_id_list.join(", ")}</p>
          <p>Placement: {JSON.stringify(room.placement)}</p>
        </div>
      </div>
    </div>
  );
}