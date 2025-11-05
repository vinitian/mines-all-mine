import { Room } from "@/interface";

export default async function getRoom(id: number): Promise<Room> {
  const response = await fetch(`/api/room/${id}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch room ID " + id);
  }
  const data = await response.json();

  return data.data;
}
