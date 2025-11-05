"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import socket from "@/socket";
import CountdownModal from "@/components/CountDownModal";
import Input from "@/components/Input";
import Button from "@/components/Button";
import {
  Room,
  Settings,
  BombDensity,
  MapSize,
  PlayerLimit,
  TurnLimit,
} from "@/interface";
import { Timer } from "lucide-react";

function densityToCount(density: BombDensity, size: number) {
  const cells = size * size;
  const ratio = density === "low" ? 0.18 : density === "high" ? 0.42 : 0.3;
  return Math.max(1, Math.floor(cells * ratio));
}
//check this function later VV

function countToDensity(count: number, size: number): BombDensity {
  const cells = size * size;

  const ratios: Record<BombDensity, number> = {
    low: 0.18,
    medium: 0.3,
    high: 0.42,
  };

  // Find the density whose count is closest to the given count
  let closest: BombDensity = "medium";
  let minDiff = Infinity;

  for (const [density, ratio] of Object.entries(ratios) as [
    BombDensity,
    number
  ][]) {
    const ratioCount = Math.max(1, Math.floor(cells * ratio));
    const diff = Math.abs(count - ratioCount);
    if (diff < minDiff) {
      minDiff = diff;
      closest = density;
    }
  }

  return closest;
}
// ^^
// single global room for testing

export default function RoomSettings({
  room,
  isHost,
  setLobbyRoomNameAction = () => {},
  setLobbyChatEnableAction = () => {},
  handleLeaveRoomAction = () => {},
}: {
  room: Room;
  isHost: boolean;
  setLobbyRoomNameAction?: React.Dispatch<React.SetStateAction<string>>;
  setLobbyChatEnableAction?: React.Dispatch<React.SetStateAction<boolean>>;
  handleLeaveRoomAction?: () => void;
}) {
  const [roomname, setRoomname] = useState(room.name);
  const [mapSize, setMapSize] = useState<MapSize>(room.size as MapSize);
  const [bombCount, setBombCount] = useState<BombDensity>(
    countToDensity(room.bomb_count, room.size)
  );
  const [turnLimit, setTurnLimit] = useState<TurnLimit>(
    room.timer as TurnLimit
  );
  const [playerLimit, setPlayerLimit] = useState<PlayerLimit>(
    room.player_limit as PlayerLimit
  );
  const [chatState, setChatState] = useState<boolean>(true);
  const router = useRouter();
  const [showCountdown, setShowCountdown] = useState(false);
  const bombs = densityToCount(bombCount, mapSize);
  const [countdownSeconds, setCountdownSeconds] = useState(3);
  const [totalSeconds, setTotalSeconds] = useState(3);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const onCountdown = useCallback(
    ({ seconds, startAt }: { seconds: number; startAt: number }) => {
      setTotalSeconds(seconds);

      const tick = () => {
        const msLeft = startAt - Date.now();
        const sLeft = Math.max(0, Math.ceil(msLeft / 1000));
        setCountdownSeconds(sLeft);
        if (sLeft <= 0 && countdownTimerRef.current) {
          clearInterval(countdownTimerRef.current);
          countdownTimerRef.current = null;
        }
      };

      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
      tick();
      countdownTimerRef.current = setInterval(tick, 200);
      setShowCountdown(true);
    },
    []
  );

  useEffect(() => {
    const onToGamePage = () => {
      router.push("/game");
    };

    socket.once("toGamePage", onToGamePage);

    return () => {
      socket.off("toGamePage", onToGamePage);
    };
  }, [router]);

  useEffect(() => {
    socket.on("game:countdown", onCountdown);
    return () => {
      socket.off("game:countdown", onCountdown);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [onCountdown]);
  useEffect(() => {
    if (showCountdown && countdownSeconds <= 0) {
      setShowCountdown(false);
    }
  }, [showCountdown, countdownSeconds]);

  // Send default state to server
  useEffect(() => {
    if (isHost) {
      requestEditRoomSettings(
        {
          size: mapSize,
          bomb_count: bombs,
          turn_limit: turnLimit,
          player_limit: playerLimit,
          chat_enabled: chatState,
          name: roomname,
        },
        false
      );
    }
  }, []);

  const handleStartGame = async () => {
    if (!mapSize) return;
    if (!socket.connected) {
      console.error("Socket not connected!");
      return;
    }
    const seconds = 3;
    socket.emit("game:request-countdown", {
      roomID: room.id,
      seconds,
    });
    //setShowCountdown(true);
  };

  const requestEditRoomSettings = async (payload: object) => {
    console.log("201-room setting change requested consisting of", payload);
    const promise: Promise<object> = new Promise((resolve, reject) => {
      if (!socket.auth.userID) {
        reject({ ok: false, error: "Failed auth" });
      }
      socket.emit("room:update-settings", payload, (response: any) => {
        // callback
        console.log("Updating room setting");
        resolve(response);
      });
    });

    return promise;
  };

  useEffect(() => {
    // listen setting update from server
    socket.on("room:update-settings-success", (state) => {
      console.log("207state", state);
      setRoomname(state.name);
      setLobbyRoomNameAction(state.name);
      setMapSize(state.size);
      setTurnLimit(state.turn_limit);
      setPlayerLimit(state.player_limit);
      setBombCount(state.density);
      setChatState(state.chat_enabled);
      setLobbyChatEnableAction(state.chat_enabled);
    });

    return () => {
      socket.off("room:update-settings-success");
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, []);

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
            }}
            onBlur={() => requestEditRoomSettings({ name: roomname })}
          />
        ) : (
          <div className="text-xl">{roomname || "Unnamed"}</div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-h3">Map size</div>
        {isHost ? (
          <div className="flex flex-wrap gap-[6px]">
            {[6, 8, 10, 20, 30].map((size) => (
              <Button
                onClick={() => requestEditRoomSettings({ size: size })}
                className={`w-min ${
                  mapSize === size ? "text-white" : "bg-white text-black"
                }`}
                key={size}
              >
                {size}×{size}
              </Button>
            ))}
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
              onChange={(e) =>
                requestEditRoomSettings({
                  player_limit: Number(e.target.value),
                })
              }
              aria-label="Set the maximum number of players for the game."
              className="w-full"
            >
              {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">{playerLimit}</div>
        )}
      </div>

      <div className="flex flex-col">
        <div className="text-h3">Amount of mines</div>
        {isHost ? (
          <div
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]
        max-w-[250px]"
          >
            <select
              id="num-bombs"
              value={bombCount}
              onChange={(e) =>
                requestEditRoomSettings({
                  bomb_count: densityToCount(
                    e.target.value as BombDensity,
                    mapSize
                  ),
                  density: e.target.value,
                })
              }
              aria-label="Set the amount of bomb density you want for the game."
              className="w-full"
            >
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
            </select>
          </div>
        ) : (
          <div className="text-xl -mt-2.5">{bombCount}</div>
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
              onChange={(e) =>
                requestEditRoomSettings({
                  chat_enabled: e.target.value == "enable" ? true : false,
                })
              }
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
              onChange={(e) =>
                requestEditRoomSettings({
                  turn_limit: Number(e.target.value) as TurnLimit,
                })
              }
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
        <Button
          onClick={() => handleLeaveRoomAction()}
          className="bg-red text-white"
        >
          Leave Room
        </Button>
        {isHost && (
          <Button onClick={handleStartGame} className="text-white">
            Start Game
          </Button>
        )}

        <CountdownModal
          open={showCountdown}
          totalSeconds={totalSeconds}
          remainingSeconds={countdownSeconds}
          onComplete={async () => {
            // Host starts the game (or move this to server for perfect sync)
            if (isHost) {
              const bombs = densityToCount(bombCount, mapSize);
              const ack: any = await requestEditRoomSettings({
                size: mapSize,
                bomb_count: bombs,
                turn_limit: turnLimit,
                player_limit: playerLimit,
                chat_enabled: chatState,
                name: roomname,
              });
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
          }}
        />
      </div>
    </div>
  );
}
