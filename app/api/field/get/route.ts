import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {Cell, Field} from "@/services/game_logic";

// get field
export async function GET(request: NextRequest) {
  const data = await request.json();
  const { id } = data;
  let toLoad;
  
  try {
    toLoad = await prisma.room.findUnique({
      where: {
        host_id: id,
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
  // const field = new Field();
  // field.load(toLoad?.placement,[toLoad?.size,toLoad?.size],toLoad?.bomb_count);
  // const fieldData = field.export();
  return NextResponse.json({ success: true, data: toLoad?.placement })
}