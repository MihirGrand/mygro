import { NextRequest, NextResponse } from "next/server";

// backend api url
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get("merchant_id");

    if (!merchantId) {
      return NextResponse.json(
        { success: false, error: "merchant_id is required" },
        { status: 400 }
      );
    }

    if (!ticketId) {
      return NextResponse.json(
        { success: false, error: "ticketId is required" },
        { status: 400 }
      );
    }

    // fetch ticket from backend
    const response = await fetch(
      `${BACKEND_URL}/api/tickets/${ticketId}?merchant_id=${merchantId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: "Ticket not found" },
          { status: 404 }
        );
      }
      throw new Error(`Backend returned ${response.status}`);
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ticket: data.ticket || data,
    });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}
