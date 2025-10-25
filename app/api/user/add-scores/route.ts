import prisma from "@/prisma/prisma";
import { NextRequest, NextResponse } from "next/server";

// add scores for winners with user accounts
export async function PATCH(request: NextRequest) {
  const data = await request.json();
  const { user_id_list } = data;

  try {
    const updatedUsers = await prisma.user.updateManyAndReturn({
      where: {
        email: {
          in: user_id_list,
        },
      },
      data: {
        win_count: {
          increment: 1,
        },
      },
    });

    return NextResponse.json({ success: true, data: updatedUsers });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to update add scores for winners: " + error.message },
      { status: 500 }
    );
  }
}
