//mineGameLogic.ts
'use client';

import { useCallback, useEffect, useState } from 'react';
import socket from "@/socket"

type RevealMap = Record<number, 'hit' | 'miss'>;
type Winner = { id: string; score: number };

export function mineGameLogic(initialSize: number) {

    const [isConnected, setIsConnected] = useState(false);
    const [transport, setTransport] = useState('N/A');

    const [size, setSize] = useState<number>(initialSize);
    const [started, setStarted] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [revealed, setRevealed] = useState<RevealMap>({});
    const [bombsInfo, setBombsInfo] = useState<{ total: number; found: number } | null>(null);
    const [turnLimit, setTurnLimit] = useState<number>(0);
    const [winners, setWinners] = useState<Winner[] | null>(null);
    const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);

    const [currentPlayer, setCurrentPlayer] = useState<string | null>(null);
    const [players, setPlayers] = useState<string[]>([]);
    const [timeRemaining, setTimeRemaining] = useState<number>(10);
    const [myId, setMyId] = useState<string | null>(null);

    const pickCell = useCallback((i: number) => {
        if (!started || gameOver || revealed[i]) return;
        
        if (currentPlayer !== myId) {
            console.log("Not your turn!");
            return;
        }
        
        socket.emit('pickCell', i);
    }, [started, gameOver, revealed, currentPlayer, myId]);

    const startGame = useCallback((opts?: { size?: number; bombCount?: number; tl?: number }) => {
        const payload: any = {};
        if (typeof opts?.size === "number") payload.size = opts.size;
        if (typeof opts?.bombCount === "number") payload.bombCount = opts.bombCount;
        if (typeof opts?.tl === "number") payload.tl = opts.tl;
    
        setStarted(true);
        socket.emit('startGame', payload);
      }, []);

    const resetLocal = useCallback(() => {
        setRevealed({});
        setBombsInfo(null);
        setWinners(null);
        setLeaderboard([]);
        setGameOver(false);
        setStarted(false);
        setTurnLimit(0);
        setCurrentPlayer(null);
        setTimeRemaining(10);
    }, []);

    // socket thing
    useEffect(() => {
        if (socket.connected) {
        setIsConnected(true);
        setTransport(socket.io.engine.transport.name);
        setMyId(socket.id || null);
        }

        const onConnect = () => {
        setIsConnected(true);
        setTransport(socket.io.engine.transport.name);
        setMyId(socket.id||null);
        socket.io.engine.on('upgrade', (t) => setTransport(t.name));
        };

        const onDisconnect = () => {
        setIsConnected(false);
        setTransport('N/A');
        };

        const onReady = (data: { 
            size: number; 
            bombsTotal: number; 
            bombsFound: number;
            turnLimit?: number;
        }) => {
            setBombsInfo({ total: data.bombsTotal, found: data.bombsFound });
            setRevealed({});
            setGameOver(false);
            setWinners(null);
            setLeaderboard([]);
            setSize(data.size);
            setTurnLimit(data.turnLimit ?? 10);
            setStarted(true);
        };

        const onCell = (p: {
            index: number; hit: boolean; by: string;
            bombsFound: number; bombsTotal: number;
            scores: Record<string, number>;
        }) => {
            setBombsInfo({ total: p.bombsTotal, found: p.bombsFound });
            setRevealed(prev => ({ ...prev, [p.index]: p.hit ? 'hit' : 'miss' }));
        };

        const onOver = (p: {
            winners?: Winner[]; scores: Record<string, number>;
            size: number; bombCount: number;
        }) => {
            setGameOver(true);
            setStarted(false);
            setCurrentPlayer(null);

            let w = Array.isArray(p.winners) ? p.winners : [];
            if (w.length === 0) {
                const entries = Object.entries(p.scores);
                if (entries.length) {
                    const max = Math.max(...entries.map(([, s]) => s));
                    w = entries.filter(([, s]) => s === max).map(([id, score]) => ({ id, score }));
                }
            }
            setWinners(w);
            setLeaderboard(Object.entries(p.scores).sort((a, b) => b[1] - a[1]));
        };
        const onTurnChanged = (data: { currentPlayer: string; reason: string }) => {
            console.log(`Turn changed to ${data.currentPlayer} (${data.reason})`);
            setCurrentPlayer(data.currentPlayer);
        };
        const onTurnTime = (data: { currentPlayer: string; timeRemaining: number }) => {
            setTimeRemaining(data.timeRemaining);
        };
        const onPlayersUpdated = (data: { players: string[]; currentPlayer: string | null }) => {
            setPlayers(data.players);
            if (data.currentPlayer) {
                setCurrentPlayer(data.currentPlayer);
            }
        };

        const onError = (data: { message: string }) => {
            console.error("Server error:", data.message);
        };
    

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('map:ready', onReady);
        socket.on('cellResult', onCell);
        socket.on('gameOver', onOver);
        socket.on('turnChanged', onTurnChanged);
        socket.on('turnTime', onTurnTime);
        socket.on('playersUpdated', onPlayersUpdated);
        socket.on('error', onError);

        return () => {
            socket.off('connect', onConnect);
            socket.off('disconnect', onDisconnect);
            socket.off('map:ready', onReady);
            socket.off('cellResult', onCell);
            socket.off('gameOver', onOver);
            socket.off('turnChanged', onTurnChanged);
            socket.off('turnTime', onTurnTime);
            socket.off('playersUpdated', onPlayersUpdated);
            socket.off('error', onError);

        };
    }, []);

    return {
        isConnected, transport,

        size, setSize,
        started, gameOver,
        revealed, bombsInfo, winners, leaderboard,
        turnLimit,
        currentPlayer,
        players,
        timeRemaining,
        myId,
        isMyTurn: currentPlayer === myId,
        pickCell, startGame, resetLocal,
    };
}
