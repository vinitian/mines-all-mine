import { NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// get all users
export async function GET() {
  try {
    const users = await prisma.user.findMany();

    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
