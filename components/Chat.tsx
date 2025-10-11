import React, { useEffect, useState } from "react";
import socket from "@/socket";
import { Message } from "@/interface";
import Input from "@/components/Input";
import Button from "@/components/Button";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);

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
    <div className="rounded-lg border bg-white flex flex-col p-[10px] gap-[8px] w-full h-full">
      <div className="text-h1/tight">Chat</div>
      <div className="rounded-lg bg-[#efefef] p-2 grow">
        {messages.map((msg, index) => (
          <div key={index}>
            {msg.timestamp.split(" ")[4].slice(0, 5)}{" "}
            <span className="font-semibold text-gray-blue">{msg.userID}</span>:{" "}
            {msg.text}
          </div>
        ))}
      </div>
      <div className="flex gap-[8px]">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
        />
        <Button onClick={sendMessage} className="w-min bg-green">
          Send
        </Button>
      </div>
    </div>
  );
}
