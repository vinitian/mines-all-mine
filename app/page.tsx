"use client";

import { useEffect, useState } from "react";
import socket from "@/socket";
import Link from "next/link";
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
    // Listen for messages from the server
    socket.on("message", (msg: Message) => {
      setMessages((prev) => [
        ...prev,
        {
          userID: msg.userID,
          text: msg.text,
          timestamp: msg.timestamp,
        },
      ]);
    });

    return () => {
      socket.off("message");
    };
  }, []);

  const sendMessage = () => {
    const newMessageObj = {
      userID: socket.id!,
      text: message,
      timestamp: Date(),
    };
    socket.emit("message", newMessageObj); // Send message to server
    setMessages((prev) => [...prev, newMessageObj]); // Add your message to the chat
    setMessage(""); // Clear input field
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  return (
    // todo: detect dark-light mode of user
    <div className="m-8">
      <h1 className="text-title">Temporary Page links</h1>
      <Link href="/room-settings" className="cta">
        Room Setting
      </Link>
      <Link href="/game" className="cta">
        Game Page
      </Link>
      <h1 className="text-title">Real-Time Chat</h1>

      <div>
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.timestamp.split(" ")[4].slice(0, 5)}{" "}
            <span className="font-semibold text-gray-blue">{msg.userID}</span>:{" "}
            {msg.text}
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
