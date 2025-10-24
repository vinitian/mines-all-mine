export default async function checkRoomExists(
  roomId: number
): Promise<boolean> {
  const response = await fetch(`/api/room/${roomId}`);
  if (!response.ok) {
    if (response.status === 404) {
      // room not found
      return false;
    }
    console.log("53-response statusText", response.status);
    throw new Error("Error checking room existence");
  }

  return true;
}
