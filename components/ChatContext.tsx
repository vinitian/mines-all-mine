"use client";

import { Message } from "@/interface";
import React, { createContext, useState } from "react";

export const ChatContext = createContext<{
  messages: Message[];
  setMessages: Function;
}>({
  messages: [],
  setMessages: () => {},
});

export default function ChatContextObj({
  children,
}: {
  children: React.ReactNode;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  return (
    <ChatContext.Provider value={{ messages, setMessages }}>
      {children}
    </ChatContext.Provider>
  );
}
