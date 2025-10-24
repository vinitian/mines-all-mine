"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, Room } from "@/interface";
import { getRoom } from "@/services/client/roomService";
import RoomSettings from "@/components/RoomSetting";
import Chat from "@/components/Chat";
import RoomName from "@/components/RoomName";
import LoadingModal from "@/components/LoadingModal";
import socket from "@/socket";
import deleteRoom from "@/services/client/deleteRoom";
import { ChatContext } from "@/components/ChatContext";
import updatePlayerList from "@/services/client/updatePlayerList";
import PlayerList from "@/components/PlayerList";
import { Player } from "@/interface";

export default function LobbyPage() {
  const [room, setRoom] = useState<Room | null>(null);
  const [lobbyRoomName, setLobbyRoomName] = useState("Room");
  const { messages, setMessages } = useContext(ChatContext);
  const [loading, setLoading] = useState(true);
  const params = useParams();
  const roomId = params.id as string;
  const [deletedRoomPopup, setDeletedRoomPopup] = useState(false);
  const router = useRouter();
  const [players, setPlayers] = useState<Player[]>([]);

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
    // add players into array when they join
    // may need to leave when socket disconnect
    socket.on("currentPlayers", (currentPlayers: Player[]) => {
      console.log("Received players:", currentPlayers);
      setPlayers(currentPlayers);
    });

    // update player list in database
    socket.emit("joinRoom", parseInt(roomId));
    const updatePlayer = async () => {
      try {
        await updatePlayerList({
          userId: socket.auth.userID,
          roomId: parseInt(roomId),
          addPlayer: true,
        });
      } catch (error) {
        console.error("Error updating room:", error);
      }
    };
    updatePlayer();

    return () => {
      socket.off("message");
      socket.off("kickAllPlayersInRoom");
      socket.off("currentPlayers");
    };
  }, []);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const roomData = await getRoom(parseInt(roomId));
        setRoom(roomData);
        setLobbyRoomName(roomData.name);
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

  if (!socket.auth || !socket.connected) {
    router.push("/");
    return (
      <LoadingModal text={"No socket auth. Redirecting you to home page"} />
    );
  }
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
        <RoomName
          roomName={lobbyRoomName}
          roomCode={room.id}
          trashVisible={room.host_id == socket.auth.userID}
          trashOnClickAction={handleDeleteRoom}
        />
        <div className="flex flex-col md:flex-row gap-[20px] h-10/12 md:h-9/12">
          <div className="flex flex-col gap-[20px] md:h-full md:w-1/2 md:max-w-[315px]">
            <div>
              <PlayerList
                playerLimit={room.player_limit}
                players={players}
                hostID={room.host_id}
              />
            </div>

            <div className="hidden md:block w-full h-full">
              <Chat />
            </div>
          </div>
          <RoomSettings
            room={room}
            isHost={room.host_id == socket.auth.userID}
            setLobbyRoomNameAction={setLobbyRoomName}
          />
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
      {deletedRoomPopup && (
        <LoadingModal
          text={"The host has deleted the room. Redirecting you to home page"}
        />
      )}
    </div>
  );
}
