"use client";

import { useContext, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Message, Room } from "@/interface";
import getRoom from "@/services/client/getRoom";
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
import CheckAuth from "@/components/CheckAuth";
import Button from "@/components/Button";

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
    try {
      handleKickAllPlayersInRoom();
      await deleteRoom(parseInt(roomId));
    } catch (error) {
      console.error(error);
    }
  };

  const handleKickAllPlayersInRoom = () => {
    socket.emit("kickAllPlayersInRoom", parseInt(roomId));
  };

  const handleLeaveRoom = async () => {
    socket.emit("leaveRoom");
    router.push("/");
    if (players.length <= 1) {
      // if player is the only one left, delete the room
      await deleteRoom(+roomId);
      return;
    }
    // TODO: select new host
    if (room && room.host_id == socket.auth.userID) {
      console.log("TODO: select new host");
    }
  };

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

    // player needs to go back to home page when kicked
    socket.on("kickPlayer", (userID: string) => {
      if (socket.auth.userID === userID) {
        socket.emit("leaveRoom");
        router.replace("/");
      }
    });

    // may need to leave when socket disconnect
    socket.on("currentPlayers", (currentPlayers: Player[]) => {
      setPlayers(currentPlayers);
    });

    // update player list in database
    socket.emit("joinRoom", parseInt(roomId));
    if (socket.auth.userID && room) {
      const updatePlayer = async () => {
        try {
          await updatePlayerList({
            userId: socket.auth.userID,
            roomId: parseInt(roomId),
            addPlayer: true,
          });
        } catch (error) {
          console.error(error);
        }
      };
      updatePlayer();
    }
    // update player list in database when a player leaves
    socket.on("playerLeft", (PlayerID: string) => {
      if (socket.auth.userID == room?.host_id) {
        const updatePlayerLeave = async () => {
          try {
            await updatePlayerList({
              userId: PlayerID,
              roomId: parseInt(roomId),
              addPlayer: false,
            });
          } catch (error) {
            console.error(error);
          }
        };
        updatePlayerLeave();
      }
    });

    //ISSUE: when the player is the last in the room and leaves, the database is not updated, "playerLeft" is not received. Use the same behavior of deleteRoom on last leave like in main branch.

    return () => {
      socket.off("message");
      socket.off("kickAllPlayersInRoom");
      socket.off("currentPlayers");
      socket.off("playerLeft");
      socket.off("kickPlayer");
    };
  }, [room]);

  if (loading) {
    return <LoadingModal text={"Loading room information"} />;
  }
  if (!room) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center m-8 gap-8">
        <div className="text-h1">Room not found</div>
        <div className="w-1/2">
          <Button onClick={() => router.push("/")}>Return to Home</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-[25px]">
      <CheckAuth />
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
                players={players}
                isHost={room.host_id == socket.auth.userID}
                room={room}
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
            handleLeaveRoomAction={handleLeaveRoom}
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
