import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

export async function POST(request: NextRequest) {
  try {
    // delete all rooms
    const deleteRooms = await prisma.room.deleteMany();

    // reset win_count to 0
    const resetUsers = await prisma.user.updateMany({
      data: {
        win_count: 0,
      },
    });

    console.log(
      `${new Date().toISOString()} : [INFO] Reset everything - Deleted ${
        deleteRooms.count
      } rooms, Reset ${resetUsers.count} users`
    );

    return NextResponse.json({
      success: true,
      message: `Reset completed: ${deleteRooms.count} rooms deleted, ${resetUsers.count} users reset`,
    });
  } catch (error: any) {
    console.error("Error resetting data:", error);
    return NextResponse.json(
      { error: "Failed to reset data: " + error.message },
      { status: 500 }
    );
  }
}
