import { NextRequest, NextResponse } from "next/server";

// express backend api url
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // proxy to express backend
    const response = await fetch(`${API_BASE_URL}/api/agent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Agent API Proxy] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to connect to backend",
      },
      { status: 500 }
    );
  }
}
