"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, Room } from "@/interface";
import { getRoom } from "@/services/client/roomService";
import RoomSettings from "@/components/roomSetting";
import Chat from "@/components/Chat";
import RoomName from "@/components/RoomName";
import LoadingModal from "@/components/LoadingModal";
import socket from "@/socket";
import deleteRoom from "@/services/client/deleteRoom";
import { ChatContext } from "@/components/ChatContext";

export default function LobbyPage() {
  const [room, setRoom] = useState<Room | null>(null);
  const { messages, setMessages } = useContext(ChatContext);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const roomId = params.id as string;
  const [deletedRoomPopup, setDeletedRoomPopup] = useState(false);
  const router = useRouter();

  const handleDeleteRoom = async () => {
    if (!socket.auth.userID) {
      return;
    }
    const response = await deleteRoom(parseInt(roomId));
    if (response) {
      handleKickAllPlayersInRoom();
    }
  };

  const handleKickAllPlayersInRoom = () => {
    socket.emit("kickAllPlayersInRoom", parseInt(roomId));
  };

  useEffect(() => {
    // Listen for messages from the server
    socket.on("message", (msg: Message) => {
      setMessages((prev: Message[]) => [
        ...prev,
        {
          userID: msg.userID,
          username: msg.username,
          text: msg.text,
          timestamp: msg.timestamp,
        },
      ]);
    });

    socket.on("kickAllPlayersInRoom", () => {
      socket.emit("leaveRoom");
      setDeletedRoomPopup(true);
      setTimeout(() => {
        setDeletedRoomPopup(false);
        router.replace("/");
      }, 3000);
    });
    return () => {
      socket.off("message");
      socket.off("kickAllPlayersInRoom");
    };
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

  if (loading) {
    return <LoadingModal text={"Loading room information"} />;
  }
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
          trashOnClickAction={handleDeleteRoom}
        />
        <div className="flex flex-col md:flex-row gap-[20px] h-10/12 md:h-9/12">
          <div className="flex flex-col gap-[20px] md:h-full md:w-1/2 md:max-w-[315px]">
            <div className="bg-gray">
              <p>
                Player {room.player_id_list.length}/{room.player_limit} sadfasf
              </p>
              <ul>
                {room.player_id_list.map((playerId: string) => {
                  return <li key={playerId}>- {playerId}</li>;
                  // todo: convert id to username
                })}
              </ul>
            </div>

            <div className="hidden md:block w-full h-full">
              <Chat />
            </div>
          </div>
          <RoomSettings roomId={parseInt(roomId)} />
        </div>
      </div>
      <div className="md:hidden w-full h-[60dvh]">
        <Chat />
      </div>
      <div className="md:hidden flex w-full my-6 justify-center">
        {room.host_id == socket.auth.userID && (
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
            onClick={handleDeleteRoom}
            className="lucide lucide-trash-icon lucide-trash
          size-[60px] hover:stroke-red transition-colors duration-200 cursor-pointer
          block md:hidden"
          >
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
            <path d="M3 6h18" />
            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        )}
      </div>
      {deletedRoomPopup && <LoadingModal text={"The host deleted the room"} />}
    </div>
  );
}
