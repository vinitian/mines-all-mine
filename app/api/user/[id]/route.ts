import { NextResponse } from "next/server";
import prisma from "@/services/client/prisma";

// get user by ID
export async function GET({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);

  try {
    const user = await prisma.user.findUnique({ where: { id } });

    return NextResponse.json({ success: true, data: user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
