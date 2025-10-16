interface UpdatePlayerListRequest {
  userId: string;
  roomId: number;
  addPlayer: boolean;
}

export default async function update(apiRequest: UpdatePlayerListRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(
    `${baseUrl}/api/room/${apiRequest.roomId}/update-player`,
    {
      method: "PATCH",
      body: JSON.stringify(apiRequest),
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    return new Error("Failed to open room");
  }
}
