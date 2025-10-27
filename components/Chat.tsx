"use client";

import React, { useContext, useEffect, useRef, useState } from "react";
import socket from "@/socket";
import { Message } from "@/interface";
import Input from "@/components/Input";
import Button from "@/components/Button";
import { ChatContext } from "@/components/ChatContext";

export default function Chat() {
  const [message, setMessage] = useState("");
  const { messages, setMessages } = useContext(ChatContext);
  const scrollContainerRef = useRef(null);

  const sendMessage = () => {
    if (message.trim() !== "") {
      const newMessageObj = {
        userID: socket.auth.userID,
        username: socket.auth.username,
        text: message,
        timestamp: Date(),
      };

      socket.emit("message", newMessageObj); // Send message to server
      setMessages((prev: Message[]) => [...prev, newMessageObj]); // Add your message to the chat
      setMessage(""); // Clear input field
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop =
        scrollContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="rounded-lg border bg-white flex flex-col p-[10px] gap-[8px] w-full h-full">
      <div className="text-h1/tight">Chat</div>
      <div
        ref={scrollContainerRef}
        className="rounded-lg bg-[#efefef] p-2 grow 
      overflow-y-scroll
      [&::-webkit-scrollbar]:w-2
      [&::-webkit-scrollbar-track]:rounded-full
    [&::-webkit-scrollbar-track]:bg-[#efefef]
      [&::-webkit-scrollbar-thumb]:rounded-full
    [&::-webkit-scrollbar-thumb]:bg-gray"
      >
        {messages.map((msg, index) => (
          <div key={index} className="wrap-anywhere">
            {msg.timestamp.split(" ")[4].slice(0, 5)}{" "}
            <span className="font-semibold text-gray-blue wrap-anywhere">
              {msg.username}
            </span>
            : {msg.text}
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
