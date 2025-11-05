export default async function editRoom(roomId, apiRequest) {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/room/${roomId}`, {
    method: "PATCH",
    body: JSON.stringify(apiRequest),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to edit room:");
  }
  return await response.json();
}
