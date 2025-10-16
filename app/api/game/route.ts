import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {Cell, Field} from "@/services/game_logic";

// get game state
export async function GET(request: NextRequest) {
  const data = await request.json();
  const { room_id } = data;
  let gameState;
  
  try {
    gameState = await prisma.room.findUnique({
      where: {
        id: room_id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, data: gameState})
}

// update game state
export async function PATCH(request: NextRequest){
  const data = await request.json();
  const room_id = data.id
  const toUpdate = Object.fromEntries(
    Object.entries(data).filter(([key, value]) => key !== "id" && value !== undefined)
  );

  try {
    const updateGameState = await prisma.room.update({
      where: {
        id: room_id,
      },
      data: toUpdate,
    });
    return NextResponse.json({ success: true, data: updateGameState });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}