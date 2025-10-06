"use client";

import { useEffect, useState } from "react";
import socket from "@/socket";
import Link from "next/link";
import { Message } from "@/interface";
import Image from 'next/image';
import StatisticsButton from "@/components/StatisticsButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fffff5] from-30% via-[#ddf7ff] via-71% to-[#dde4ff] to-100% flex items-center justify-center p-4">
      <StatisticsButton />
      <div className="bg-white rounded-3xl border border-black p-6 w-full max-w-md md:max-w-lg lg:max-w-xl">

        <div className="flex justify-center text-title font-bold text-center">
          Mines, All Mine!
        </div>

        <div className="flex justify-center items-center gap-4 mt-2">
          <div className="text-h3">
            Nickname
          </div>
          <input
            type="text"
            placeholder="Type your nickname here!"
            className="w-full border-2 border-[#9b94df] rounded-2xl px-4 py-2 placeholder-gray-400 text-h4 focus:outline-none focus:border-[#3728BE]"
          />
        </div>

        <button className="w-full bg-[#8499FF] text-white text-h3 border-2 border-[#9b94df] rounded-2xl py-2 hover:bg-[#7388ee] transition-colors duration-200 flex justify-center mt-4">
          Join Room
        </button>

        <button className="w-full bg-[#E496F5] text-white text-h3 border-2 border-[#9b94df] rounded-2xl py-2 hover:bg-[#d68ee7] transition-colors duration-200 flex justify-center mt-4">
          Create Room
        </button>

        <button className="w-full bg-white text-black text-h3 border-2 border-[#9b94df] rounded-2xl py-2 hover:bg-[#f0f0f0] transition-colors duration-200 flex justify-center mt-4">
          <div>
            Sign in with Google
          </div>
        </button>

      </div>
    </div>
  )
}
