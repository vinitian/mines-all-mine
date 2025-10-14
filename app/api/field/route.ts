import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {Cell, Field} from "@/services/game_logic";

// create field
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { id, sizex, sizey, bombcount} = data;

  const field = new Field();
  field.generate_field([sizex,sizey],bombcount);
  const placement = field.export().field;

  try {
    const newField = await prisma.room.update({
      where: {
        host_id: id,
      },
      data: {
        placement: placement,
      },
    });
    return NextResponse.json({ success: true, data: newField });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

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
