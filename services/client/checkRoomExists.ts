export default async function checkRoomExists(
  roomId: number
): Promise<boolean> {
  const response = await fetch(`/api/room/${roomId}`);
  if (!response.ok) {
    if (response.status === 404) {
      // room not found
      return false;
    }
    throw new Error("Error checking room existence");
  }

  return true;
}
