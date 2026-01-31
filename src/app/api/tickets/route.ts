import { NextRequest, NextResponse } from "next/server";

// express backend api url
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchant_id");

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "merchant_id is required" },
        { status: 400 }
      );
    }

    // proxy to express backend
    const response = await fetch(
      `${API_BASE_URL}/api/tickets?merchant_id=${merchantId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[Tickets API Proxy] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to connect to backend" },
      { status: 500 }
    );
  }
}
