import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {Cell, Field} from "@/services/game_logic";

//import socket and emit
//get reply from server then send message for server to update screen

// reveal cell
export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const { id, index} = data;
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
  const field = new Field();
  field.load(toLoad?.placement,[toLoad?.size,toLoad?.size],toLoad?.bomb_count);
  const pos = field.index_to_coordinate(index);
  const result = field.open_cell(pos[0],pos[1]);
  if(!result[1]){
    return NextResponse.json(
      { success: false, error: "Already revealed"},
      { status: 500 }
    );
  }
  const fieldData = field.export();
  try {
    const updateField = await prisma.room.update({
      where: {
        host_id: id,
      },
      data: {
        size:fieldData.size,
        bomb_count:fieldData.bombs,
        placement:fieldData.field,
      },
    });
    return NextResponse.json({ success: true, data: updateField });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
