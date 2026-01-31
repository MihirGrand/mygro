import { NextRequest, NextResponse } from "next/server";

// backend api url
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

    // fetch tickets from backend
    const response = await fetch(
      `${BACKEND_URL}/api/tickets?merchant_id=${merchantId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      // if backend returns error, return empty array for now
      return NextResponse.json({ success: true, tickets: [] });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      tickets: data.tickets || data || [],
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    // return empty array on error for graceful degradation
    return NextResponse.json({ success: true, tickets: [] });
  }
}
