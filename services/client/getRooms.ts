import { Room } from "@/interface";

export default async function getRooms(): Promise<Room[]> {
  const response = await fetch("/api/room", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch rooms");
  }

  const data = await response.json();

  if (data.success && Array.isArray(data.data)) {
    return data.data;
  } else {
    throw new Error("Invalid response format");
  }
}
