interface CreateRoomRequest {
  id: string;
  username: string;
}

export default async function createRoom(apiRequest: CreateRoomRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/room`, {
    method: "POST",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return new Error("Failed to create room");
  }

  const result = await response.json();
  console.log("Room created successfully", result);
  return result;
}
