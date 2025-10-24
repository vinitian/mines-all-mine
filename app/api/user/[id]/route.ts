import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";

// get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const id = Number((await params).id);

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { error: "Failed to fetch user by ID: " + error },
      { status: 500 }
    );
  }
}
