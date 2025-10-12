import { Room } from "@/interface";

export async function getRooms(): Promise<Room[]> {
  try {
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
  } catch (error) {
    console.error("Error fetching rooms:", error);
    return [];
  }
}

export async function getTotalRooms(): Promise<number> {
  try {
    const rooms = await getRooms();
    return rooms.length;
  } catch (error) {
    console.error("Error fetching room count:", error);
    return 0;
  }
}

export default getRooms;
