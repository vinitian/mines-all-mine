'use client';
import React,{useState} from "react";
import { useRouter } from 'next/navigation';
import "../app/roomSetting.css";

const sizes = [6, 8, 10] as const;
type MapSize = typeof sizes[number]| null;

export default function RoomSettings() {
    const [mapSize, setMapSize] = useState<MapSize>(null);
    const router = useRouter();

    return (
        <main className="bg">
        <section className="card">
            <div className="field">
            <label htmlFor="roomName">Room name</label>
            <input id="roomName" placeholder="Room 1" />
            </div>

            <div className="field">
            <span className="label">Map size</span>
            <div className="segmented" role="radiogroup" aria-label="Set the Map size">
                <button type="button" role = "radio" aria-checked={mapSize==6} onClick={() => setMapSize(6)} className={`${mapSize === 6 ? 'active' : ''}`}>6×6</button>
                <button type="button" role = "radio" aria-checked={mapSize==8} onClick={() => setMapSize(8)} className={`${mapSize === 8 ? 'active' : ''}`}>8×8</button>
                <button type="button" role = "radio" aria-checked={mapSize==10} onClick={() => setMapSize(10)} className={`${mapSize === 10 ? 'active' : ''}`}>10×10</button>
            </div>
            </div>

            <div className="field">
            <label htmlFor="timer">Timer</label>
            <div className="select-wrap">
                <select id="timer" defaultValue="unlimited" aria-label="Timer">
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
                <select id="num-player" defaultValue="2" aria-label="Set the maximum number of players for the game.">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
                </select>
                <span className="chev" aria-hidden>▾</span>
            </div>
            </div>

            <div className="field">
            <div className="select-wrap">
            <label htmlFor="num-bombs">Bomb Amount</label>
                <select id="num-player" defaultValue="medium" aria-label="Set the amount of bomb density you want for the game.">
                <option value="low">low</option>
                <option value="medium">medium</option>
                <option value="high">high</option>
                </select>
                <span className="chev" aria-hidden>▾</span>
            </div>
            </div>
        </section>

        <button className="primary" disabled={!mapSize} onClick={()=> mapSize && router.push(`/game?size=${mapSize}`)}>Open Room</button>
        </main>
  );
}
