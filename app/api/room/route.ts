import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// get all rooms
export async function GET(request: NextRequest) {
  try {
    const rooms = await prisma.room.findMany();

    return NextResponse.json({ success: true, data: rooms });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch all rooms: " + error.message },
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
      `${new Date().toISOString()} : [INFO] Created new room with ID ${
        newRoom.id
      }`
    );

    return NextResponse.json({ success: true, data: newRoom });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to create new room: " + error.message },
      { status: 500 }
    );
  }
}

// update room
export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const {
    user_id,
    name,
    size,
    bomb_count,
    turn_limit,
    player_limit,
    chat_enabled,
  } = data;

  try {
    const updateRoom = await prisma.room.update({
      where: {
        host_id: user_id,
      },
      data: {
        name: name,
        size: size,
        bomb_count: bomb_count,
        timer: turn_limit,
        player_limit: player_limit,
        chat_enabled: chat_enabled,
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
