'use client';

import { useCallback, useEffect, useState } from 'react';
import { socket } from "../../socket";

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
    const [winners, setWinners] = useState<Winner[] | null>(null);
    const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);


    const pickCell = useCallback((i: number) => {
        if (!started || gameOver || revealed[i]) return;
        socket.emit('pickCell', i);
    }, [started, gameOver, revealed]);

    const startGame = useCallback((sz?: number) => {
        const s = sz ?? size;
        setStarted(true);
        const bombCount = s === 6 ? 11 : Math.floor(s * s * 0.3);
        socket.emit('startGame', { size: s, bombCount });
    }, [size]);

    const resetLocal = useCallback(() => {
        setRevealed({});
        setBombsInfo(null);
        setWinners(null);
        setLeaderboard([]);
        setGameOver(false);
    }, []);

    // socket thing
    useEffect(() => {
        if (socket.connected) {
        setIsConnected(true);
        setTransport(socket.io.engine.transport.name);
        }

        const onConnect = () => {
        setIsConnected(true);
        setTransport(socket.io.engine.transport.name);
        socket.io.engine.on('upgrade', (t) => setTransport(t.name));
        };
        const onDisconnect = () => {
        setIsConnected(false);
        setTransport('N/A');
        };

        const onReady = (data: { size: number; bombsTotal: number; bombsFound: number }) => {
        setBombsInfo({ total: data.bombsTotal, found: data.bombsFound });
        setRevealed({});
        setGameOver(false);
        setWinners(null);
        setLeaderboard([]);
        setSize(data.size);
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

        socket.on('connect', onConnect);
        socket.on('disconnect', onDisconnect);
        socket.on('map:ready', onReady);
        socket.on('cellResult', onCell);
        socket.on('gameOver', onOver);

        return () => {
        socket.off('connect', onConnect);
        socket.off('disconnect', onDisconnect);
        socket.off('map:ready', onReady);
        socket.off('cellResult', onCell);
        socket.off('gameOver', onOver);

        };
    }, []);

    return {
        isConnected, transport,

        size, setSize,
        started, gameOver,
        revealed, bombsInfo, winners, leaderboard,

        pickCell, startGame, resetLocal,
    };
}
