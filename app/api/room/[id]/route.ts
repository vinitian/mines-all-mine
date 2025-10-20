import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const roomId = parseInt((await params).id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const room = await prisma.room.findUnique({
      where: {
        id: roomId,
      },
    });

    if (!room) {
      return NextResponse.json(
        { success: false, error: "Room not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: room });
  } catch (error: any) {
    console.error("Error fetching room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// Delete room from roomId
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const roomId = parseInt((await params).id);

    if (isNaN(roomId)) {
      return NextResponse.json(
        { success: false, error: "Invalid room ID" },
        { status: 400 }
      );
    }

    const deletedRoom = await prisma.room.delete({
      where: {
        id: roomId,
      },
    });

    if (!deletedRoom) {
      return NextResponse.json(
        { success: false, error: "Error deleting room." },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: deletedRoom });
  } catch (error: any) {
    console.error("Error deleting room:", error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
