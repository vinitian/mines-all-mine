import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roomId = parseInt((await params).id);
    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return NextResponse.json({ error: "Room not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { error: "Error fetching room: " + error.message },
      { status: 500 }
    );
  }
}

// update room
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await request.json();
  const {
    name,
    size,
    host_id,
    bomb_count,
    turn_limit,
    player_limit,
    chat_enabled,
    game_started,
  } = data;

  try {
    const roomId = parseInt((await params).id);
    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const updateRoom = await prisma.room.update({
      where: {
        id: roomId,
      },
      data: {
        name: name,
        size: size,
        host_id: host_id,
        bomb_count: bomb_count,
        timer: turn_limit,
        player_limit: player_limit,
        chat_enabled: chat_enabled,
        game_started: game_started,
      },
    });

    return NextResponse.json({ success: true, data: updateRoom });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update room information: " + error.message },
      { status: 500 }
    );
  }
}

// Delete room by room ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const roomId = parseInt((await params).id);

    if (isNaN(roomId)) {
      return NextResponse.json({ error: "Invalid room ID" }, { status: 400 });
    }

    const deletedRoom = await prisma.room.delete({
      where: {
        id: roomId,
      },
    });

    if (!deletedRoom) {
      return NextResponse.json(
        { error: "Error deleting room." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedRoom });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { error: "Failed to delete room: " + error.message },
      { status: 500 }
    );
  }
}
