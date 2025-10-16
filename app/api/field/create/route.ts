import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import {Cell, Field} from "@/services/game_logic";

// create field
export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const { id, sizex, sizey, bombcount} = data;

  const field = new Field();
  field.generate_field([sizex,sizey],bombcount);
  const placement = field.export().field;

  try {
    const newField = await prisma.room.update({
      where: {
        id: id,
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
