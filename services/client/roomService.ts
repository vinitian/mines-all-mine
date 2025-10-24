import { Room } from "@/interface";

export async function getRooms(): Promise<Room[]> {
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

export async function getRoom(id: number): Promise<Room> {
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

export async function getTotalRooms(): Promise<number> {
  try {
    const rooms = await getRooms();
    return rooms.length;
  } catch (error) {
    console.error("Error fetching room count:", error);
    throw new Error("Error fetching room count");
  }
}

export async function checkRoomExists(roomId: number): Promise<boolean> {
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

export default getRooms;
