interface EditRoomRequest {
  user_id: string;
  name: string;
  size: number;
  bomb_count: number;
  turn_limit: number;
  player_limit: number;
  chat_enabled: boolean;
}

export default async function editRoom(apiRequest: EditRoomRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/room`, {
    method: "PATCH",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to open room");
  }
  return await response.json();
}
