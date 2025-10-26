"use client";

import { useState, useEffect } from "react";
import socket from "@/socket";
import getRooms from "@/services/client/getRooms";
import resetEverything from "@/services/client/resetEverything";

export default function StatisticsButton() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [serverInfo, setServerInfo] = useState<string>("Loading...");
  const [onlineCount, setOnlineCount] = useState<number>(0);
  const [isHost, setIsHost] = useState<boolean>(false);
  const [totalRooms, setTotalRooms] = useState<number>(0);
  const [resetLoading, setResetLoading] = useState<boolean>(false);
  const [resetMessage, setResetMessage] = useState<string>("");

  const fetchServerInfo = async () => {
    try {
      const response = await fetch("/api/server-info");
      const data = await response.json();
      setServerInfo(data.serverAddress);
    } catch (error) {
      setServerInfo("Unable to fetch server info");
    }
  };

  const fetchTotalRooms = async () => {
    try {
      const response = await getRooms(); // get total room count
      const count = response.length;
      setTotalRooms(count);
    } catch (error) {
      console.error(error);
      setTotalRooms(0);
    }
  };

  const handleResetEverything = async () => {
    if (
      !confirm(
        "Are you sure you want to reset everything? This will delete all rooms and reset all user win counts."
      )
    ) {
      return;
    }

    setResetLoading(true);
    setResetMessage("");

    try {
      const response = await resetEverything();

      if (response.success) {
        setResetMessage(response.message || "Reset completed successfully!");
        // Refresh the room count
        await fetchTotalRooms();
        socket.emit("kickAllPlayersInEveryRoom");
      } else {
        setResetMessage(`Error: ${response.error}`);
      }
    } catch (error) {
      setResetMessage("Error: Failed to reset data");
    } finally {
      setResetLoading(false);

      // Clear the message after 5 seconds
      setTimeout(() => {
        setResetMessage("");
      }, 5000);
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleOnlineCountUpdate = (data: {
      count: number;
      isHost: boolean;
    }) => {
      console.log("Received onlineCountUpdate:", data);
      setOnlineCount(data.count);
      setIsHost(data.isHost);
    };

    socket.on("onlineCountUpdate", handleOnlineCountUpdate);

    return () => {
      socket.off("onlineCountUpdate", handleOnlineCountUpdate);
    };
  }, []);

  const handleOpenPopup = () => {
    setIsPopupOpen(true);
    fetchServerInfo();
    fetchTotalRooms();

    if (socket) {
      console.log("Requesting fresh online count...");
      socket.emit("getOnlineCount");
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
              <span className="text-body font-medium">
                Server IP address & port
              </span>
              <span className="text-body text-gray-600">{serverInfo}</span>
            </div>

            {isHost && (
              <div className="flex justify-between items-center py-2">
                <span className="text-body font-medium">Currently online</span>
                <span className="text-body text-gray-600">
                  {onlineCount} Players
                </span>
              </div>
            )}

            {isHost && (
              <div className="flex justify-between items-center py-2">
                <span className="text-body font-medium">Total rooms</span>
                <span className="text-body text-gray-600">
                  {totalRooms} Rooms
                </span>
              </div>
            )}

            {isHost && (
              <div className="pt-4">
                <button
                  onClick={handleResetEverything}
                  disabled={resetLoading}
                  className={`w-full text-body font-medium border-2 rounded-2xl py-3 transition-colors duration-200 flex justify-center items-center gap-2 ${
                    resetLoading
                      ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                      : "bg-blue text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#7388ee] transition-colors duration-200 cursor-pointer"
                  }`}
                >
                  {resetLoading ? (
                    <>
                      <svg
                        className="animate-spin h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Resetting...
                    </>
                  ) : (
                    <>Reset Everything</>
                  )}
                </button>

                {/* Reset status message */}
                {resetMessage && (
                  <div
                    className={`mt-2 p-2 rounded-lg text-center text-body-small ${
                      resetMessage.includes("Error")
                        ? "bg-red-100 text-red-700 border border-red-200"
                        : "bg-green-100 text-green-700 border border-green-200"
                    }`}
                  >
                    {resetMessage}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
