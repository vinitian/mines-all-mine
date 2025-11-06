import { Room } from "@/interface";

export default async function deleteRoom(id: number): Promise<Room> {
  const baseUrl =
    typeof window === "undefined"
      ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000"
      : "";

  const response = await fetch(`${baseUrl}/api/room/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error("Room not found");
    }
    throw new Error("Failed to delete room");
  }

  return await response.json();
}
