"use client";

import { useState, useEffect } from "react";
import socket from "@/socket";
import { getTotalRooms } from "@/services/client/roomService";

export default function StatisticsButton() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [serverInfo, setServerInfo] = useState<string>("Loading...");
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [totalRooms, setTotalRooms] = useState<number>(0);

  const fetchServerInfo = async () => {
    try {
      const response = await fetch('/api/server-info');
      const data = await response.json();
      setServerInfo(data.serverAddress);
    } catch (error) {
      setServerInfo("Unable to fetch server info");
    }
  };

  const fetchTotalRooms = async () => {
    try {
      const count = await getTotalRooms();
      setTotalRooms(count);
    } catch (error) {
      console.error('Failed to fetch total rooms:', error);
      setTotalRooms(0);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleOnlineCountUpdate = (data: { count: number; isHost: boolean }) => {
      console.log('Received onlineCountUpdate:', data);
      setOnlineCount(data.count);
      setIsHost(data.isHost);
    };

    socket.on('onlineCountUpdate', handleOnlineCountUpdate);
    socket.emit('getOnlineCount');

    return () => {
      socket.off('onlineCountUpdate', handleOnlineCountUpdate);
    };
  }, []);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
    fetchServerInfo();
    fetchTotalRooms();

    if (socket) {
      console.log('Requesting fresh online count...');
      socket.emit('getOnlineCount');
    }
  };

  return (
    <>
      <button
        onClick={handleOpenPopup}
        className="fixed top-4 right-4 bg-[#DDF7FF] text-black p-5 rounded-xl hover:bg-[#cdeff7] transition-colors z-50 border-1 border-black cursor-pointer"
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
        >
          <path d="M3 3v16a2 2 0 0 0 2 2h16" />
          <path d="m19 9-5 5-4-4-3 3" />
        </svg>
      </button>

      {isPopupOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-h3 font-bold">Statistics</h2>
              <button
                onClick={() => setIsPopupOpen(false)}
                className="text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-between items-center py-2">
              <span className="text-body font-medium">Server IP address & port</span>
              <span className="text-body text-gray-600">{serverInfo}</span>
            </div>

            {isHost && (
              <div className="flex justify-between items-center py-2">
                <span className="text-body font-medium">Currently online</span>
                <span className="text-body text-gray-600">{onlineCount} Players</span>
              </div>
            )}

            {isHost && (
              <div className="flex justify-between items-center py-2">
                <span className="text-body font-medium">Total rooms</span>
                <span className="text-body text-gray-600">{totalRooms} Rooms</span>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}