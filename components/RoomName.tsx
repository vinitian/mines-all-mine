"use client";

import React, { useEffect, useState } from "react";

export default function RoomName({
  roomName,
  roomCode,
  trashVisible = true,
  trashOnClickAction,
}: {
  roomName: string;
  roomCode: number;
  trashVisible?: boolean;
  trashOnClickAction?: React.MouseEventHandler<SVGSVGElement>;
}) {
  const [serverInfo, setServerInfo] = useState<string>("");

  const fetchServerInfo = async () => {
    try {
      const response = await fetch("/api/server-info");
      const data = await response.json();
      setServerInfo(data.serverAddress);
    } catch (error) {
      setServerInfo("Unable to fetch server info");
    }
  };

  function unsecuredCopyToClipboard(text: string) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand("copy");
    } catch (err) {
      console.error("Unable to copy to clipboard", err);
    }
    document.body.removeChild(textArea);
  }
  const copyToClipboard = (text: string) => {
    if (window.isSecureContext) {
      navigator.clipboard.writeText(text);
    } else {
      unsecuredCopyToClipboard(text);
    }
  };

  useEffect(() => {
    fetchServerInfo();
  }, []);

  return (
    <div className="rounded-lg border bg-white flex p-4 w-full">
      <div className="flex flex-col grow items-center md:items-start">
        <div className="text-h1/tight">{roomName}</div>
        <div className="text-h3/tight  text-gray-dark flex gap-[10px] items-center">
          <div>Code: {roomCode}</div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() => copyToClipboard(roomCode.toString())}
            className="lucide lucide-copy-icon lucide-copy 
            size-[24px] md:size-[30px] cursor-pointer"
          >
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            onClick={() =>
              copyToClipboard(serverInfo + "/invite/" + roomCode.toString())
            }
            className="lucide lucide-link-icon lucide-link 
            size-[24px] md:size-[30px] cursor-pointer"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
        </div>
      </div>
      <div
        className={`flex flex-col justify-center content-center ${
          trashVisible ? "" : "hidden"
        }`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          onClick={trashOnClickAction}
          className="lucide lucide-trash-icon lucide-trash
          size-[60px] hover:stroke-red transition-colors duration-200 cursor-pointer
          hidden md:block"
        >
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </div>
    </div>
  );
}
