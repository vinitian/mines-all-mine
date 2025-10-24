import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// add/remove player to player_id_list
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const data = await request.json();
  const { roomId, userId, addPlayer } = data;
  const id = Number((await params).id);

  try {
    const { player_id_list } = await prisma.room.findUniqueOrThrow({
      where: { id },
      select: {
        player_id_list: true,
      },
    });

    let playerList = player_id_list;
    if (addPlayer) {
      playerList.push(userId);
    } else {
      playerList = playerList.filter((id: string) => id !== userId);
    }

    const updateRoom = await prisma.room.update({
      where: { id },
      data: { player_id_list: playerList },
    });

    return NextResponse.json({ success: true, data: updateRoom });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update player list: " + error.message },
      { status: 500 }
    );
  }
}
