// roomSetting.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import socket from "@/socket";
import editRoom from "@/services/client/editRoom";
import CountdownModal from "@/components/CountDownModal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { Room } from "@/interface";

const sizes = [6, 8, 10, 20, 30] as const;
const sizes2 = [2, 3, 4, 5, 6, 7, 8, 9, 10];
type MapSize = (typeof sizes)[number];
type BombDensity = "low" | "medium" | "high";
type PlayerLimit = (typeof sizes2)[number];

function densityToCount(density: BombDensity, size: number) {
  const cells = size * size;
  const ratio = density === "low" ? 0.18 : density === "high" ? 0.42 : 0.3;
  return Math.max(1, Math.floor(cells * ratio));
}
// single global room for testing

export default function RoomSettings({
  room,
  isHost,
}: {
  room: Room;
  isHost: boolean;
}) {
  const [roomname, setRoomname] = useState(room.name);
  const [mapSize, setMapSize] = useState<MapSize>(8);
  const [bombCount, setBombCount] = useState<BombDensity>("medium");
  const [turnLimit, setTurnLimit] = useState<0 | 10 | 20 | 30>(10);
  const [playerLimit, setPlayerLimit] = useState<PlayerLimit>(2);
  const [chatState, setChatState] = useState<boolean>(true);
  const router = useRouter();
  const [showCountdown, setShowCountdown] = useState(false);
  const bombs = densityToCount(bombCount, mapSize);

  useEffect(() => {
    const onReady = (data: any) => {
      console.log("navigating", data);
      router.push("/game");
    };

    socket.once("map:ready", onReady);

    return () => {
      socket.off("map:ready", onReady);
    };
  }, [router]);

  const handleEditRoom = async () => {
    const bombs = densityToCount(bombCount, mapSize);
    const response = await editRoom({
      user_id: socket.auth.userID,
      name: roomname,
      size: mapSize,
      bomb_count: bombs,
      turn_limit: turnLimit,
      player_limit: playerLimit,
      chat_enabled: chatState,
    });

    socket.emit("room:settings-updated", {
      name: roomname,
      size: mapSize,
      bomb_density: bombCount,
      bomb_count: bombs,
      turn_limit: turnLimit,
      player_limit: playerLimit,
      chat_enabled: chatState,
    });
  };

  useEffect(() => {
    const onSettingsUpdated = (newSettings: any) => {
      setRoomname(newSettings.name);
      setMapSize(newSettings.size);
      setTurnLimit(newSettings.turn_limit);
      setPlayerLimit(newSettings.player_limit);
      setBombCount(newSettings.bomb_density);
      setChatState(newSettings.chat_enabled);
    };

    socket.on("room:settings-updated", onSettingsUpdated);

    return () => {
      socket.off("room:settings-updated", onSettingsUpdated);
    };
  }, []);

  const handleStartGame = async () => {
    if (!mapSize) return;
    if (!socket.connected) {
      console.error("Socket not connected!");
      return;
    }
    setShowCountdown(true);
  };

  return (
    <div
      className="bg-white border rounded-lg p-[25px] w-full h-full
    flex flex-col gap-[10px] overflow-y-scroll"
    >
      <div className="flex flex-col">
        <div className="text-h3">Room name</div>
        {isHost ? (
          <Input
            value={roomname}
            onChange={(e) => {
              setRoomname(e.target.value);
              handleEditRoom();
            }}
          />
        ) : (
          <div className="text-xl -mt-2.5">{roomname || "Unnamed"}</div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-h3">Map size</div>
        {isHost ? (
          <div className="flex flex-wrap gap-[6px]">
            <Button
              onClick={() => {
                setMapSize(6);
                handleEditRoom();
              }}
              textColor={mapSize === 6 ? "" : "text-black"}
              className={`w-min ${mapSize === 6 ? "" : "bg-white"}`}
            >
              6×6
            </Button>
            <Button
              onClick={() => {
                setMapSize(8);
                handleEditRoom();
              }}
              textColor={mapSize === 8 ? "" : "text-black"}
              className={`w-min ${mapSize === 8 ? "" : "bg-white"}`}
            >
              8×8
            </Button>
            <Button
              onClick={() => {
                setMapSize(10);
                handleEditRoom();
              }}
              textColor={mapSize === 10 ? "" : "text-black"}
              className={`w-min ${mapSize === 10 ? "" : "bg-white"}`}
            >
              10×10
            </Button>
            <Button
              onClick={() => {
                setMapSize(20);
                handleEditRoom();
              }}
              textColor={mapSize === 20 ? "" : "text-black"}
              className={`w-min ${mapSize === 20 ? "" : "bg-white"}`}
            >
              20×20
            </Button>
            <Button
              onClick={() => {
                setMapSize(30);
                handleEditRoom();
              }}
              textColor={mapSize === 30 ? "" : "text-black"}
              className={`w-min ${mapSize === 30 ? "" : "bg-white"}`}
            >
              30×30
            </Button>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">
            {mapSize}×{mapSize}
          </div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-h3">Player limit</div>
        {isHost ? (
          <div
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]
        max-w-[250px]"
          >
            <select
              value={playerLimit}
              onChange={(e) => {
                setPlayerLimit(Number(e.target.value) as PlayerLimit);
                handleEditRoom();
              }}
              aria-label="Set the maximum number of players for the game."
              className="w-full"
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
              <option value={5}>5</option>
              <option value={6}>6</option>
              <option value={7}>7</option>
              <option value={8}>8</option>
              <option value={9}>9</option>
              <option value={10}>10</option>
            </select>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">{playerLimit}</div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-h3">Number of mines</div>
        {isHost ? (
          <div
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]
        max-w-[250px]"
          >
            <select
              id="num-bombs"
              value={bombCount}
              onChange={(e) => {
                setBombCount(e.target.value as BombDensity);
                handleEditRoom();
              }}
              aria-label="Set the amount of bomb density you want for the game."
              className="w-full"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">{bombs}</div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-h3">Chat</div>
        {isHost ? (
          <div
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]
        max-w-[250px]"
          >
            <select
              id="chat"
              value={chatState ? "enable" : "disable"}
              onChange={(e) => {
                setChatState(e.target.value === "enable");
                handleEditRoom();
              }}
              aria-label="Set to enable/disable chat"
              className="w-full"
            >
              <option value="enable">Enable</option>
              <option value="disable">Disable</option>
            </select>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">
            {chatState === true ? "Enabled" : "Disabled"}
          </div>
        )}
      </div>

      <div className="flex flex-col mb-[10px] ">
        <div className="text-h3">Timer</div>
        {isHost ? (
          <div
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]
        max-w-[250px]"
          >
            <select
              value={turnLimit}
              onChange={(e) => {
                setTurnLimit(Number(e.target.value) as 0 | 10 | 20 | 30);
                handleEditRoom();
              }}
              aria-label="Timer"
              className="w-full"
            >
              <option value={0}>Unlimited</option>
              <option value={10}>10 seconds</option>
              <option value={20}>20 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">
            {turnLimit === 0 ? "Unlimited" : `${turnLimit} seconds`}
          </div>
        )}
      </div>

      <div
        className={`flex gap-5 ${!isHost ? "justify-end" : "justify-between"}`}
      >
        {isHost ? (
          <>
            <Button
              onClick={() => {
                if (!socket.connected) {
                  console.error("Socket not connected!");
                  return;
                }
                router.push("/");
              }}
              className="bg-red"
            >
              Leave Room
            </Button>

            <Button onClick={handleStartGame}>Start Game</Button>
          </>
        ) : (
          <Button
            onClick={() => {
              if (!socket.connected) {
                console.error("Socket not connected!");
                return;
              }
              router.push("/");
            }}
            className="bg-red"
          >
            Leave Room
          </Button>
        )}

        <CountdownModal
          open={showCountdown}
          seconds={3}
          onComplete={() => {
            const bombs = densityToCount(bombCount, mapSize);
            console.log("Starting game with settings:", {
              size: mapSize,
              bombCount: bombs,
              turnLimit,
              playerLimit,
              chatEnabled: chatState,
            });

            socket.emit(
              "settings:update",
              {
                size: mapSize,
                bombCount: bombs,
                turnLimit,
                playerLimit,
                chatEnabled: chatState,
                roomName: roomname,
              },
              (ack: any) => {
                if (!ack?.ok) {
                  console.error("Failed to save settings:", ack?.error);
                  return;
                }

                socket.emit("startGame", {
                  size: mapSize,
                  bombCount: densityToCount(bombCount, mapSize),
                  turnLimit,
                });
              }
            );
          }}
        />
      </div>
    </div>
  );
}
