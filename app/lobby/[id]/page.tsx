import RoomSettings from "@/app/roomSetting";
import RoomSetting from "@/app/roomSetting";
import Chat from "@/components/Chat";
import RoomName from "@/components/RoomName";

export default function Page() {
  return (
    <div>
      <RoomName roomName="Vinitian's Room" roomCode={1234} />
      <div className="flex">
        <div className="flex flex-col">
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
