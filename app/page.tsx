"use client";

import { useEffect, useState } from "react";
import { socket } from "@/socket";
import GameGrid from "./gameGrid";
import { Message } from "@/interface";

export default function Home() {
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState("N/A");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [size, setSize] = useState<number>(6);
  const sizes = [6, 8, 10];

  const [revealed, setRevealed] = useState<Record<number, "hit" | "miss">>({});
  const [bombsInfo, setBombsInfo] = useState<{
    total: number;
    found: number;
  } | null>(null);

  const [gameOver, setGameOver] = useState(false);
  const [winners, setWinners] = useState<
    { id: string; score: number }[] | null
  >(null);
  const [leaderboard, setLeaderboard] = useState<[string, number][]>([]);
  const short = (id: string) => id.slice(-4);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (socket.connected) {
      onConnect();
    }

    function onConnect() {
      setIsConnected(true);
      setTransport(socket.io.engine.transport.name);

      socket.io.engine.on("upgrade", (transport) => {
        setTransport(transport.name);
      });
    }

    function onDisconnect() {
      setIsConnected(false);
      setTransport("N/A");
    }

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  useEffect(() => {
    const onReady = (data: {
      size: number;
      bombsTotal: number;
      bombsFound: number;
    }) => {
      setBombsInfo({ total: data.bombsTotal, found: data.bombsFound });
      setRevealed({});
      setGameOver(false);
      setWinners(null);
      setLeaderboard([]);
      setSize(data.size);
      setStarted(true);
    };

    const onCell = (payload: {
      index: number;
      hit: boolean;
      by: string;
      bombsFound: number;
      bombsTotal: number;
      scores: Record<string, number>;
    }) => {
      console.log("cellResult", payload);
      setBombsInfo({ total: payload.bombsTotal, found: payload.bombsFound });
      setRevealed((prev) => ({
        ...prev,
        [payload.index]: payload.hit ? "hit" : "miss",
      }));
    };

    const onOver = (payload: {
      winners?: { id: string; score: number }[];
      scores: Record<string, number>;
      size: number;
      bombCount: number;
    }) => {
      setGameOver(true);
      setStarted(false);

      let w = Array.isArray(payload.winners) ? payload.winners : [];
      if (w.length === 0) {
        const entries = Object.entries(payload.scores); // [socketId, score][]
        if (entries.length) {
          const max = Math.max(...entries.map(([, s]) => s));
          w = entries
            .filter(([, s]) => s === max)
            .map(([id, score]) => ({ id, score }));
        }
      }

      setWinners(w);
      setLeaderboard(
        Object.entries(payload.scores).sort((a, b) => b[1] - a[1])
      );
    };

    socket.on("map:ready", onReady);
    socket.on("cellResult", onCell);
    socket.on("gameOver", onOver);

    return () => {
      socket.off("map:ready", onReady);
      socket.off("cellResult", onCell);
      socket.off("gameOver", onOver);
    };
  }, []);

  useEffect(() => {
    // Listen for messages from the server
    socket.on("message", (msg: string) => {
      setMessages((prev) => [
        ...prev,
        {
          userID: socket.id!,
          text: msg,
          timestamp: Date(),
        },
      ]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    socket.emit("message", message); // Send message to server
    setMessages((prev) => [
      ...prev,
      {
        userID: socket.id!,
        text: message,
        timestamp: Date(),
      },
    ]); // Add your message to the chat
    setMessage(""); // Clear input field
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };
  const handlePick = (i: number) => {
    if (!started || gameOver) return;
    if (revealed[i]) return;
    socket.emit("pickCell", i);
  };

  {
    /*const startGame = () => {
    setGameOver(false);
    setWinners(null);
    setLeaderboard([]);
    setRevealed({});
    setBombsInfo(null);
    setStarted(true);
    const bombCount = size === 6 ? 11 : Math.floor(size * size * 0.3); 
    socket.emit("startGame", { size, bombCount });
  };*/
  }

  const handleStartClick = () => {
    if (started) return;

    if (gameOver) {
      setRevealed({});
      setBombsInfo(null);
      setWinners(null);
      setLeaderboard([]);
      setGameOver(false);
      return;
    }

    setStarted(true);
    const bombCount = size === 6 ? 11 : Math.floor(size * size * 0.3);
    socket.emit("startGame", { size, bombCount });
  };

  const startBtnLabel = started
    ? "In Progress…"
    : gameOver
    ? "Play Again"
    : "Start Game";

  return (
    // todo: detect dark-light mode of user
    <div className="m-8">
      <h1 className="text-title">Select Map Size</h1>
      {gameOver && (
        <div className="mb-3 p-3 rounded border bg-yellow-100">
          {winners && winners.length > 0 ? (
            winners.length === 1 ? (
              <p>
                Winner: <strong>{short(winners[0].id)}</strong> with{" "}
                <strong>{winners[0].score}</strong> bombs!
              </p>
            ) : (
              <p>
                Tie between{" "}
                <strong>{winners.map((w) => short(w.id)).join(", ")}</strong>{" "}
                with <strong>{winners[0].score}</strong> bombs!
              </p>
            )
          ) : (
            <p>All bombs found! (Awaiting winner data)</p>
          )}

          {leaderboard.length > 0 && (
            <ul className="mt-2 list-disc list-inside text-sm">
              {leaderboard.map(([id, score]) => (
                <li key={id}>
                  {short(id)} — {score}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        {sizes.map((s) => (
          <button
            key={s}
            onClick={() => setSize(s)}
            disabled={started || gameOver} // ← lock while running AND after game over
            className={`px-3 py-1 rounded border ${
              s === size ? "bg-green-300 font-semibold" : "bg-gray-200"
            } ${started || gameOver ? "opacity-60 cursor-not-allowed" : ""}`}
            aria-pressed={s === size}
          >
            {s} × {s}
          </button>
        ))}

        <button
          onClick={handleStartClick}
          disabled={started}
          className={`ml-2 px-3 py-1 rounded border ${
            started ? "bg-blue-2 00 cursor-not-allowed" : "bg-blue-300"
          }`}
        >
          {startBtnLabel}
        </button>

        {bombsInfo && (
          <span className="ml-3">
            Bombs: {bombsInfo.found} / {bombsInfo.total}
          </span>
        )}
      </div>

      <div className="mb-6">
        <GameGrid size={size} onPick={handlePick} revealed={revealed} />
      </div>

      <h1 className="text-title">Real-Time Chat</h1>

      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.userID}: {msg.text} ({msg.timestamp})
          </div>
        ))}
      </div>
      <div className="flex gap-4">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="border-2 rounded-md w-full border-gray-400"
        />
        <button
          onClick={sendMessage}
          type="submit"
          className="bg-green-300 px-4 py-1 rounded-md"
        >
          Send
        </button>
      </div>
      <div>
        <div className="bg-white py-0.5 mt-8" />
        <p>Status: {isConnected ? "connected" : "disconnected"}</p>
        <p>Transport: {transport}</p>
      </div>
    </div>
  );
}

// import Image from "next/image";

// export default function Home() {
//   return (
//     <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
//       <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
//         <Image
//           className="dark:invert"
//           src="/next.svg"
//           alt="Next.js logo"
//           width={180}
//           height={38}
//           priority
//         />
//         <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
//           <li className="mb-2 tracking-[-.01em]">
//             Get started by editing{" "}
//             <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
//               app/page.tsx
//             </code>
//             .
//           </li>
//           <li className="tracking-[-.01em]">
//             Save and see your changes instantly.
//           </li>
//         </ol>

//         <div className="flex gap-4 items-center flex-col sm:flex-row">
//           <a
//             className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
//             href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             <Image
//               className="dark:invert"
//               src="/vercel.svg"
//               alt="Vercel logomark"
//               width={20}
//               height={20}
//             />
//             Deploy now
//           </a>
//           <a
//             className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
//             href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//             target="_blank"
//             rel="noopener noreferrer"
//           >
//             Read our docs
//           </a>
//         </div>
//       </main>
//       <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/file.svg"
//             alt="File icon"
//             width={16}
//             height={16}
//           />
//           Learn
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/window.svg"
//             alt="Window icon"
//             width={16}
//             height={16}
//           />
//           Examples
//         </a>
//         <a
//           className="flex items-center gap-2 hover:underline hover:underline-offset-4"
//           href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           <Image
//             aria-hidden
//             src="/globe.svg"
//             alt="Globe icon"
//             width={16}
//             height={16}
//           />
//           Go to nextjs.org →
//         </a>
//       </footer>
//     </div>
//   );
// }
