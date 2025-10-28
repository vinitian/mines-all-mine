"use client";

import { useCallback, useEffect, useState } from "react";
import socket from "@/socket";
import { useRouter } from "next/navigation";

type CellDisplayData = {
  is_open: boolean;
  index: number;
  number: number;
  bomb: boolean;
};

type RevealMap = Record<number, CellDisplayData>;

type Winner = { id: string; score: number };

export default function MineGameLogic() {
  const router = useRouter();
  const [size, setSize] = useState<number | null>(null);
  const [started, setStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [revealed, setRevealed] = useState<RevealMap>({});
  const [bombsInfo, setBombsInfo] = useState<{
    total: number;
    found: number;
  } | null>(null); //total and found
  const [turnLimit, setTurnLimit] = useState<number>(0);
  const [winners, setWinners] = useState<Winner[] | null>(null);
  const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);

  const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
  const [players, setPlayers] = useState<string[]>([]);
  const [timeRemaining, setTimeRemaining] = useState<number>(10);
  const [returnCountdown, setReturnCountdown] = useState<number | null>(null);
  const myId = socket.auth.userID;

  const pickCell = useCallback(
    (i: number) => {
      console.log(`picking cell index ${i}`);
      if (!started || gameOver || revealed[i].is_open) {
        console.log("Conditions not met", !started, gameOver, revealed[i]);
        return;
      }
      if (currentPlayer !== myId) {
        console.log("Not your turn!");
        return;
      }
      console.log(`requesting pickCell ${i}`);
      socket.emit("pickCell", i);
    },
    [started, gameOver, revealed, currentPlayer, myId]
  );

  // const startGame = useCallback((opts?: { size?: number; bombCount?: number; tl?: number }) => {
  //     const payload: any = {};
  //     if (typeof opts?.size === "number") payload.size = opts.size;
  //     if (typeof opts?.bombCount === "number") payload.bombCount = opts.bombCount;
  //     if (typeof opts?.tl === "number") payload.tl = opts.tl;

  //     setStarted(true);
  //     socket.emit('startGame', payload);
  //   }, []);

  const resetLocal = useCallback(() => {
    //setRevealed({}); ?/Todo come back to investigate
    setBombsInfo(null);
    setWinners(null);
    setLeaderboard([]);
    setGameOver(false);
    console.log("set started resetLocal");
    setStarted(false);
    setTurnLimit(0);
    setCurrentPlayer(null);
    setTimeRemaining(10);
  }, []);

  useEffect(() => {
    const onReady = (data: {
      size: number;
      bombsTotal: number;
      bombsFound: number;
      turnLimit?: number;
      currentPlayer?: string;
      revealed: RevealMap;
    }) => {
      setBombsInfo({ total: data.bombsTotal, found: data.bombsFound });
      setRevealed(data.revealed);
      setGameOver(false);
      setWinners(null);
      setLeaderboard([]);
      setSize(data.size);
      setTurnLimit(data.turnLimit ?? 10);
      console.log("setting started to true");
      setStarted(true);
      //console.log(started);
      if (data.currentPlayer) setCurrentPlayer(data.currentPlayer);
    };

    const onCell = (p: {
      revealMap: RevealMap;
      bombsFound: number;
      bombsTotal: number;
      scores: Map<string, number>;
    }) => {
      setBombsInfo({ total: p.bombsTotal, found: p.bombsFound });
      setRevealed(p.revealMap);
    };

    const onOver = (p: {
      winners?: Winner[];
      scores: Array<[string, number]>;
      size: number;
      bombCount: number;
    }) => {
      setGameOver(true);
      console.log("set started onOver");
      setStarted(false);
      setCurrentPlayer(null);
      const scores = new Map(p.scores);

      let w = Array.isArray(p.winners) ? p.winners : [];
      if (w.length === 0) {
        const entries = Array.from(scores.entries());
        if (entries.length) {
          const max = Math.max(...entries.map(([, s]) => s));
          w = entries
            .filter(([, s]) => s === max)
            .map(([id, score]) => ({ id, score }));
        }
      }
      setWinners(w);
      setLeaderboard(Array.from(scores.entries()).sort((a, b) => b[1] - a[1]));
      setReturnCountdown(10);
      const intervalId = setInterval(() => {
        setReturnCountdown((prev) => {
          if (prev === null) return prev;
          if (prev <= 1) {
            clearInterval(intervalId);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      (window as any).__lobbyCountdownInterval = intervalId;
    };

    const onTurnChanged = (data: { currentPlayer: string; reason: string }) => {
      console.log(`Turn changed to ${data.currentPlayer} (${data.reason})`);
      setCurrentPlayer(data.currentPlayer);
    };

    const onTurnTime = (data: {
      currentPlayer: string;
      timeRemaining: number;
    }) => {
      setTimeRemaining(data.timeRemaining);
    };

    const onPlayersUpdated = (data: {
      players: string[];
      currentPlayer: string | null;
    }) => {
      setPlayers(data.players);
      if (data.currentPlayer) {
        setCurrentPlayer(data.currentPlayer);
      }
    };

    const onError = (data: { message: string }) => {
      console.error("Server error:", data.message);
    };

    const onReturnToLobby = (data: { reason: string }) => {
      console.log("ReturnToLobby:", data.reason);

      if ((window as any).__lobbyCountdownInterval) {
        clearInterval((window as any).__lobbyCountdownInterval);
        delete (window as any).__lobbyCountdownInterval;
      }
      resetLocal();
      router.back();
    };

    const resetLocal = () => {
      setRevealed({});
      setBombsInfo(null);
      setWinners(null);
      setLeaderboard([]);
      setGameOver(false);
      setStarted(false);
      setTurnLimit(0);
      setCurrentPlayer(null);
      setTimeRemaining(10);
    };

    socket.on("map:ready", onReady);
    socket.on("cellResult", onCell);
    socket.on("gameOver", onOver);
    socket.on("turnChanged", onTurnChanged);
    socket.on("turnTime", onTurnTime);
    socket.on("playersUpdated", onPlayersUpdated);
    socket.on("error", onError);
    socket.on("returnToLobby", onReturnToLobby);

    socket.emit("requestState");

    return () => {
      socket.off("map:ready", onReady);
      socket.off("cellResult", onCell);
      socket.off("gameOver", onOver);
      socket.off("turnChanged", onTurnChanged);
      socket.off("turnTime", onTurnTime);
      socket.off("playersUpdated", onPlayersUpdated);
      socket.off("error", onError);
      socket.off("returnToLobby", onReturnToLobby);
    };
  }, [router]);

  return {
    size,
    setSize,
    started,
    gameOver,
    revealed,
    bombsInfo,
    winners,
    leaderboard,
    turnLimit,
    currentPlayer,
    players,
    timeRemaining,
    myId,
    isMyTurn: currentPlayer === myId,
    pickCell,
    returnCountdown,
  };
}
