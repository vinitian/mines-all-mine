"use client";

import RoomSettings from "@/components/roomSetting";
import Chat from "@/components/Chat";
import RoomName from "@/components/RoomName";

export default function Page() {
  return (
    <div>
      <div className="flex flex-col gap-[25px] p-[25px] h-dvh">
        <RoomName roomName="Vinitian's Room" roomCode={1234} />
        <div className="flex gap-[20px] h-10/12 md:h-9/12">
          <div className="flex flex-col gap-[20px] h-full w-1/2 max-w-[315px]">
            <div className="bg-gray-dark">
              Player 6/8 sadfasf asddads asdfasdf
            </div>
            <Chat />
          </div>
          <RoomSettings />
        </div>
      </div>
      <div className="md:hidden flex w-full my-6 justify-center">
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
          onClick={() => {}}
          className="lucide lucide-trash-icon lucide-trash
          size-[60px] hover:stroke-red transition-colors duration-200 cursor-pointer
          block md:hidden"
        >
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M3 6h18" />
          <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </div>
    </div>
  );
}
