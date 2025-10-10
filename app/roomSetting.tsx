// roomSetting.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import "../app/roomSetting.css";
import socket from "@/socket";
import editRoom from "@/services/client/editRoom";

const sizes = [6, 8, 10] as const;
const sizes2 = [2, 3, 4, 5, 6, 7, 8, 9, 10];
type MapSize = (typeof sizes)[number];
type bombDensity = "low" | "medium" | "high";
type PlayerLimit = (typeof sizes2)[number];

function densityToCount(density: bombDensity, size: number) {
  const cells = size * size;
  const ratio = density === "low" ? 0.18 : density === "high" ? 0.42 : 0.3;
  return Math.max(1, Math.floor(cells * ratio));
}
// single global room for testing

export default function RoomSettings() {
  const [roomname, setRoomname] = useState("");
  const [mapSize, setMapSize] = useState<MapSize>(8);
  const [bombCount, setBombCount] = useState<bombDensity>("medium");
  const [turnLimit, setTurnLimit] = useState<0 | 10 | 20 | 30>(10);
  const [playerLimit, setPlayerLimit] = useState<PlayerLimit>(2);
  const [isConnected, setIsConnected] = useState(false);
  const [chatState, setChatState] = useState<boolean>(true);
  const router = useRouter();

  useEffect(() => {
    // Check if already connected
    if (socket.connected) {
      setIsConnected(true);
    }

    // Connect if not connected
    if (!socket.connected) {
      socket.connect();
    }

    const onConnect = () => {
      console.log("Socket connected!");
      setIsConnected(true);
    };

    const onDisconnect = () => {
      console.log("Socket disconnected!");
      setIsConnected(false);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

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
  
  

  useEffect(() => {
    handleEditRoom();
  }, [roomname, mapSize, bombCount, turnLimit, playerLimit, chatState]);

  const handleEditRoom = async () => {
    if (!socket.id) {
      return;
    }
    const bombs = densityToCount(bombCount, mapSize);
    const response = await editRoom({
      user_id: socket.id,
      name: roomname,
      size: mapSize,
      bomb_count: bombs,
      turn_limit: turnLimit,
      player_limit: playerLimit,
      chat_enabled: chatState,
    });
  };
  //TODO: generate placement

  const handleStartGame = async () => {
    if (!mapSize) return;
    if (!socket.connected) {
      console.error("Socket not connected!");
      return;
    }

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
          turnLimit 
        });
        
      }
    );
  };


  return (
    <main className="bg">
      <section className="card">
        <div className="field">
          <label htmlFor="roomName">Room name</label>
          <input
            id="roomName"
            value={roomname}
            onChange={(e) => setRoomname(e.target.value)}
            aria-label="Room name"
            placeholder="Room 1"
          />
        </div>

        <div className="field">
          <span className="label">Map size</span>
          <div
            className="segmented"
            role="radiogroup"
            aria-label="Set the Map size"
          >
            <button
              type="button"
              role="radio"
              aria-checked={mapSize == 6}
              onClick={() => setMapSize(6)}
              className={`${mapSize === 6 ? "active" : ""}`}
            >
              6×6
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mapSize == 8}
              onClick={() => setMapSize(8)}
              className={`${mapSize === 8 ? "active" : ""}`}
            >
              8×8
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={mapSize == 10}
              onClick={() => setMapSize(10)}
              className={`${mapSize === 10 ? "active" : ""}`}
            >
              10×10
            </button>
          </div>
        </div>

        <div className="field">
          <label htmlFor="timer">Timer</label>
          <div className="select-wrap">
            <select
              id="timer"
              value={turnLimit}
              onChange={(e) =>
                setTurnLimit(Number(e.target.value) as 0 | 10 | 20 | 30)
              }
              aria-label="Timer"
            >
              <option value={0}>Unlimited</option>
              <option value={10}>10 seconds</option>
              <option value={20}>20 seconds</option>
              <option value={30}>30 seconds</option>
            </select>
          </div>
        </div>

        <div className="field">
          <div className="select-wrap">
            <label htmlFor="num-player">Player limit</label>
            <select
              id="num-player"
              value={playerLimit}
              onChange={(e) =>
                setPlayerLimit(Number(e.target.value) as PlayerLimit)
              }
              aria-label="Set the maximum number of players for the game."
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
            <span className="chev" aria-hidden>
              ▾
            </span>
          </div>
        </div>

        <div className="field">
          <div className="select-wrap">
            <label htmlFor="num-bombs">Bomb Amount</label>
            <select
              id="num-bombs"
              value={bombCount}
              onChange={(e) => setBombCount(e.target.value as bombDensity)}
              aria-label="Set the amount of bomb density you want for the game."
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
            <span className="chev" aria-hidden>
              ▾
            </span>
          </div>
        </div>

        <div className="mb-[22px] relative">
          <label htmlFor="chat">Chat</label>
          <select
            id="chat"
            value={chatState ? "enable" : "disable"}
            onChange={(e) => setChatState(e.target.value === "enable")}
            aria-label="Set to enable/disable chat"
          >
            <option value="enable">enable</option>
            <option value="disable">disable</option>
          </select>
          <span
            className="absolute right-[12px] top-[70%] -translate-y-1/2 pointer-events-none text-[#6b7280]"
            aria-hidden
          >
            ▾
          </span>
        </div>

        <div className="flex gap-5">
          <button
            className="primary red"
            disabled={!mapSize}
            onClick={() => {
              if (!socket.connected) {
                console.error("Socket not connected!");
                return;
              }
              router.push("/home");
            }}
          >
            Leave Room
          </button>

          <button
            className = "primary"
            disabled={!mapSize}
            onClick={handleStartGame}
          >
            Start Game
          </button>
        </div>
      </section>
    </main>
  );
}
