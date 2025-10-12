import RoomSettings from "@/app/roomSetting";
import RoomSetting from "@/app/roomSetting";
import Chat from "@/components/Chat";
import RoomName from "@/components/RoomName";

export default function Page() {
  return (
    <div className="flex flex-col gap-[25px] p-[25px] h-dvh">
      <RoomName roomName="Vinitian's Room" roomCode={1234} />
      <div className="flex gap-[20px] h-[100%] border border-red-500">
        <div className="flex flex-col gap-[20px]">
          <div className="bg-gray-dark">
            Player 6/8 sadfasf asddads asdfasdf
          </div>
          <Chat />
        </div>
        <RoomSettings />
      </div>
    </div>
  );
}
