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

export async function getRoom(id: number): Promise<Room | null> {
  try {
    const response = await fetch(`/api/room/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await response.json();

    if (data.success) {
      return data.data;
    } else {
      throw new Error(data.error || "Invalid response format");
    }
  } catch (error) {
    console.error("Error fetching room:", error);
    return null;
  }
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

export const checkRoomExists = async (roomId: number): Promise<boolean> => {
  try {
    const response = await fetch(`/api/room/${roomId}`);
    if (!response.ok) {
      return false;
    }
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error("Error checking room existence:", error);
    return false;
  }
};

export default getRooms;
