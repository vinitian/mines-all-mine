import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const host = process.env.HOST || "localhost";
    const port = process.env.PORT || "3000";

    const requestHost = request.headers.get("host") || `${host}:${port}`;

    return NextResponse.json({
      serverAddress: requestHost,
      host: host,
      port: port,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch server info: " + error },
      { status: 500 }
    );
  }
}
