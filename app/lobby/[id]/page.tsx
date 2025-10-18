"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Room } from "@/interface";
import { getRoom } from "@/services/client/roomService";
import RoomSettings from "@/components/roomSetting";
import Chat from "@/components/Chat";
import RoomName from "@/components/RoomName";
import LoadingModal from "@/components/LoadingModal";
import socket from "@/socket";
import updatePlayerList from "@/services/client/updatePlayerList";
import PlayerList from "@/components/PlayerList";
import { Player } from "@/interface";

export default function LobbyPage() {
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const roomId = params.id as string;
  const [players, setPlayers] = useState<Player[]>([]);

  // add players into array when they join
  useEffect(() => {
    socket.on("playerJoined", ({ userID, username }) => {
      setPlayers((prev: Player[]) => {
        const playerExists = prev.some((player) => player.userID === userID);

        if (playerExists) {
          return prev;
        }

        return [
          ...prev,
          {
            userID: userID,
            username: username,
          },
        ];
      });
      console.log(username);
    });

    socket.on("playerLeft", ({ userID, username }) => {
      setPlayers((prev) => prev.filter((id) => id.userID !== userID));
    });

    return () => {
      socket.off("playerJoined");
      socket.off("playerLeft");
    };
  }, []);

  // update player list in database
  useEffect(() => {
    socket.emit("joinRoom", roomId);
    const updatePlayer = async () => {
      try {
        const roomData = await updatePlayerList({
          userId: socket.auth.userID,
          roomId: parseInt(roomId),
          addPlayer: true,
        });
      } catch (error) {
        console.error("Error updating room:", error);
      }
    };
    updatePlayer();
  }, []);

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

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Room not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-[25px]">
      <div className="flex flex-col gap-[25px] py-[25px] md:h-dvh">
        {/* TODO: change from socket.id to socket.auth.userID */}
        <RoomName
          roomName={room.name}
          roomCode={room.id}
          trashVisible={room.host_id == socket.auth.userID}
        />
        <div className="flex flex-col md:flex-row gap-[20px] h-10/12 md:h-9/12">
          <div className="flex flex-col gap-[20px] md:h-full md:w-1/2 md:max-w-[315px]">
            <div>
              <PlayerList playerLimit={room.player_limit} players={players} />
            </div>

            <div className="hidden md:block w-full h-full">
              <Chat />
            </div>
          </div>
          <RoomSettings roomId={roomId} />
        </div>
      </div>
      <div className="md:hidden w-full h-[60dvh]">
        <Chat />
      </div>
      <div className="md:hidden flex w-full my-6 justify-center">
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
          className="lucide lucide-trash-icon lucide-trash
          size-[60px] hover:stroke-red transition-colors duration-200 cursor-pointer
          block md:hidden"
        >
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </div>
      {loading && <LoadingModal text={"Loading room information"} />}
    </div>
  );
}
