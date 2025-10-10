"use client";

import { useEffect, useState } from "react";
import socket from "../socket";
import GameGrid from "./gameGrid";
import Link from "next/link";
import { Message } from "@/interface";
import Image from "next/image";
import { signIn, signOut, useSession } from "next-auth/react";
import StatisticsButton from "@/components/StatisticsButton";
import { useRouter } from "next/navigation";

interface Message {
  userID: string;
  text: string;
  timestamp: string;
}
export default function Home() {
  const { data: session } = useSession();

  const [nickname, setNickname] = useState("");
  const [showError, setShowError] = useState(false);
  const router = useRouter();

  const handleJoinRoom = () => {
    if (nickname.trim()) {
      setShowError(false);
      router.push(`/room?nickname=${encodeURIComponent(nickname)}`);
    } else {
      setShowError(true);
    }
  };

  const handleCreateRoom = () => {
    if (nickname.trim()) {
      setShowError(false);
      //อย่าลืม router push ตรงนี้ เพื่อ link ไป create room page
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
    setNickname(session?.user?.name ?? "");
  }, [session]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
      <StatisticsButton />
      <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">
        <div className="flex justify-center text-title/16 font-bold text-center my-4">
          Mines, All Mine!
        </div>

        {session && (
          <div className="flex flex-col justify-center items-center my-4">
            <Image
              src={session.user?.image ?? ""}
              alt="Profile image"
              width={100}
              height={100}
              referrerPolicy="no-referrer"
              className="rounded-full size-16"
            />
            <div className="text-h1 text-center">
              Welcome, {session.user?.name}!
            </div>
            <div className="text-gray-dark">{session.user?.email}</div>
          </div>
        )}
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
            <div className="w-[60%] mt-2 p-2 text-red-700 rounded-lg text-center">
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

        <button
          onClick={handleCreateRoom}
          className="w-full bg-purple text-white text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#d68ee7] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
        >
          Create Room
        </button>

        {session ? (
          <button
            className="w-full bg-white text-black text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#f0f0f0] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
            onClick={() => signOut()}
          >
            Sign out
          </button>
        ) : (
          <button
            className="w-full bg-white text-black text-h3 border-2 border-border rounded-2xl py-2 hover:bg-[#f0f0f0] transition-colors duration-200 flex justify-center mt-4 cursor-pointer"
            onClick={() => signIn("google")}
          >
            Sign in with Google
          </button>
        )}
      </div>

      <button onClick={handleCreateRoom}>Create new room!</button>
    </div>
  );
}
