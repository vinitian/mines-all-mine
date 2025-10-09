import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// get all rooms
export async function GET() {
  try {
    const rooms = await prisma.room.findMany();

    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

// create new room
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { id, username } = data;

  try {
    const newRoom = await prisma.room.create({
      data: {
        name: `${username}'s Room`,
        host_id: id,
        player_id_list: [id],
      },
    });

    console.log(
      `${new Date().toISOString()} : [INFO] Created new room with ID ${newRoom.id
      }`
    );

    return NextResponse.json({ success: true, data: newRoom });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
