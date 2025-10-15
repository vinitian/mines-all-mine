"use client";

import { useEffect, useState } from "react";
import socket from "@/socket";
import Link from "next/link";
import { Message, Room, User, Placement } from "@/interface";
import Image from "next/image";
import StatisticsButton from "@/components/StatisticsButton";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function InvitePage() {
  const [nickname, setNickname] = useState("");
  const [showError, setShowError] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const router = useRouter();
  const params = useParams();
  const roomId = params.id as string;

  const [username, setUsername] = useState("john");

  const handleJoinRoom = () => {
    if (nickname.trim()) {
      setShowError(false);
      router.push(`/lobby/${roomId}`);
    } else {
      setShowError(true);
    }
  };

  const isNicknameValid = nickname.trim().length > 0;

  // Hide error when user starts typing
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (showError && e.target.value.trim()) {
      setShowError(false);
    }
  };

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/room/${roomId}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Room not found");
          } else {
            setError("Error loading room");
          }
          return;
        }

        const result = await response.json();

        if (result.success && result.data) {
          setRoom(result.data);
        } else {
          setError(result.error || "Error loading room");
        }
      } catch (error) {
        console.error('Error fetching room:', error);
        setError("Error loading room");
      } finally {
        setLoading(false);
      }
    };

    if (roomId) {
      fetchRoom();
    }
  }, [roomId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
          <div className="flex justify-center text-title/16 font-bold text-center my-4">
            Mines, All Mine!
          </div>
          <div className="text-center text-h3">Loading room information...</div>
        </div>
      </div>
    );
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
          <div className="flex justify-center text-title/16 font-bold text-center my-4">
            Mines, All Mine!
          </div>
          <div className="text-center text-h3 text-red mb-4">
            {error || "Room not found!"}
          </div>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-blue text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#7388ee] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
      <StatisticsButton />
      <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="flex justify-center text-title/16 font-bold text-center my-4">
          Mines, All Mine!
        </div>

        <div className="text-center text-h3 text-gray-blue font-bold mb-4">
          You are entering "{room.name}"
        </div>

        <div className="flex justify-center items-center gap-4 mt-2">
          <div className="text-h3">Nickname</div>
          <input
            type="text"
            placeholder="Type your nickname here..."
            className="w-full border-2 border-border rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]"
            value={nickname}
            onChange={handleNicknameChange}
          />
        </div>

        <div className="flex justify-center">
          {showError && (
            <div className="w-[60%] mt-2 p-2 text-red rounded-lg text-center">
              Please enter your nickname first!
            </div>
          )}
        </div>

        <button
          onClick={handleJoinRoom}
          className="w-full bg-blue text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#7388ee] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
        >
          Join Room
        </button>

        {/* Placeholder button that doesn't do anything */}
        <button
          className="w-full bg-white text-black text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#f0f0f0] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}