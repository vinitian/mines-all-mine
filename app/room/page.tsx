"use client";

import { useEffect, useState } from "react";
import socket from "@/socket";
import StatisticsButton from "@/components/StatisticsButton";
import { useRouter } from "next/navigation";
import { getRooms, checkRoomExists } from "@/services/client/roomService";
import { Room as RoomType } from "@/interface";

export default function Room() {
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomCode, setRoomCode] = useState("");
  const [error, setError] = useState("");
  const [checkingRoom, setCheckingRoom] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("ROOM auth", socket.auth); // FOR TEST
  }, []);

  useEffect(() => {
    const fetchRooms = async () => {
      try {
        setLoading(true);
        const roomsData = await getRooms();
        setRooms(roomsData);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchRooms();
  }, []);

  const handleJoinRoom = (roomId: number) => {
    console.log(`Joining room ${roomId}`);
    router.push(`/lobby/${roomId}`);
  };

  const handleJoinByCode = async () => {
    setError("");

    if (!roomCode.trim()) {
      setError("Please enter a room ID");
      return;
    }

    const roomId = parseInt(roomCode.trim());
    if (isNaN(roomId)) {
      setError("Please enter a valid room ID!");
      return;
    }

    try {
      setCheckingRoom(true);
      const roomExists = await checkRoomExists(roomId);

      if (roomExists) {
        router.push(`/lobby/${roomId}`);
      } else {
        setError(`Room with ID: ${roomId} not found!`);
      }
    } catch (error) {
      console.error("Error checking room:", error);
      setError("Error checking room. Please try again.");
    } finally {
      setCheckingRoom(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleJoinByCode();
    }
  };

  const handleBack = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% bg-fixed">
      <button
        onClick={handleBack}
        className="p-6 text-h4 flex items-center gap-2 cursor-pointer"
      >
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
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back
      </button>

      <StatisticsButton />

      <div className="flex flex-col items-center p-6">
        <div className="flex justify-center text-h1 xl:text-subtitle font-bold text-center mb-2">
          Welcome, {socket.auth.username || "Guest"}!
        </div>

        <div className="p-6 w-full max-w-md md:max-w-3xl xl:max-w-4xl mb-8">
          <div className="mb-2">
            <span className="text-h4 sm:text-h3 xl:text-h2">
              Join by Room Code
            </span>
          </div>

          <div className="flex gap-4 items-center mb-6">
            <input
              type="text"
              placeholder="Enter 3-digit code"
              className="w-full border-2 bg-white border-border rounded-2xl px-4 py-3 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]"
              onChange={(e) => {
                setRoomCode(e.target.value);
              }}
              onKeyUp={handleKeyPress}
            />

            <button
              onClick={handleJoinByCode}
              disabled={checkingRoom}
              className="bg-[#8499FF] text-white text-h3 border-2 border-border rounded-2xl px-6 py-2 hover:bg-[#7388ee] transition-colors duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingRoom ? "Checking..." : "Enter"}
            </button>
          </div>

          {error && (
            <div className="mb-4">
              <span className="text-red text-h4">{error}</span>
            </div>
          )}

          <div className="mb-4">
            <span className="text-h4 sm:text-h3 xl:text-h2">Room List</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-500 text-h4">Loading rooms...</div>
              </div>
            ) : rooms.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-500 text-h4">No rooms available</div>
              </div>
            ) : (
              rooms.map((room) => (
                <div
                  key={room.id}
                  className="bg-white border-1 rounded-2xl p-4 transition-shadow cursor-pointer"
                  onClick={() => handleJoinRoom(room.id)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-h2 font-bold text-gray-800">
                      {room.name}
                    </h3>
                  </div>

                  <div className="text-h4 flex flex-col -space-y-1">
                    <div>
                      <span className="font-regular">Status:</span>{" "}
                      {room.game_started ? (
                        <span className="text-red font-bold">Game ongoing</span>
                      ) : (
                        <span className="text-green font-bold">In lobby</span>
                      )}
                    </div>
                    <div>
                      <span className="font-regular">Map Size:</span>{" "}
                      {room.size}x{room.size}
                    </div>
                    <div>
                      <span className="font-regular">Capacity:</span>{" "}
                      {room.player_id_list.length}/{room.player_limit}
                    </div>
                    <div>
                      <span className="font-regular">Number of mines:</span>{" "}
                      {room.bomb_count}
                    </div>
                    <div>
                      <span className="font-regular">Time Limit:</span>{" "}
                      {room.timer === 0 ? "Unlimited" : `${room.timer} seconds`}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleJoinRoom(room.id);
                      }}
                      className="w-full bg-[#8499FF] text-white text-h3 border-2 border-border rounded-2xl px-6 py-2 hover:bg-[#7388ee] transition-colors duration-200 whitespace-nowrap flex-shrink-0 cursor-pointer"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
