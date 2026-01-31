import { NextRequest, NextResponse } from "next/server";

// external webhook url (server-side only, not exposed to client)
const WEBHOOK_URL =
  process.env.WEBHOOK_TICKET_URL ||
  "https://abstruse.app.n8n.cloud/webhook-test/ticket";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // validate required fields
    if (!body.merchant_id) {
      return NextResponse.json(
        { success: false, error: "merchant_id is required" },
        { status: 400 }
      );
    }

    if (!body.message?.content) {
      return NextResponse.json(
        { success: false, error: "message.content is required" },
        { status: 400 }
      );
    }

    // forward to external webhook
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        _id: body._id || null,
        merchant_id: body.merchant_id,
        message: {
          content: body.message.content,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Webhook error:", response.status, errorText);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to process request",
          ticket_id: null,
          agent_message:
            "I'm having trouble connecting to the support system. Please try again in a moment.",
          cards: [],
        },
        { status: 200 } // return 200 so client can show the error message
      );
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      ticket_id: data.ticket_id,
      agent_message: data.agent_message,
      cards: data.cards || [],
    });
  } catch (error) {
    console.error("Agent API error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        ticket_id: null,
        agent_message:
          "Something went wrong on our end. Please try again later.",
        cards: [],
      },
      { status: 200 }
    );
  }
}
