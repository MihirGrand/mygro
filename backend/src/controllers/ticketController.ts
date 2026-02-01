import { Request, Response } from "express";
import prisma from "../config/database.js";
import ApiResponse from "../utils/apiResponse.js";
import {
  createTicketMessageSchema,
  getTicketsSchema,
  getTicketByIdSchema,
  updateTicketStatusSchema,
  updateTicketPrioritySchema,
} from "../schemas/ticketSchema.js";

// webhook url for n8n
const WEBHOOK_URL =
  process.env.WEBHOOK_TICKET_URL ||
  "https://abstruse.app.n8n.cloud/webhook/ticket";

// generates unique ticket id
function generateTicketId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TKT-${timestamp}-${random}`;
}

// send message to agent (webhook proxy + store in db)
export const sendAgentMessage = async (req: Request, res: Response) => {
  try {
    const result = createTicketMessageSchema.safeParse(req.body);
    if (!result.success) {
      return ApiResponse.validationError(res, result.error);
    }

    const { _id, merchant_id, message } = result.data;

    console.log("[Agent] Received message:", { _id, merchant_id, content: message.content });

    let ticket;

    // check if ticket exists or create new one
    if (_id) {
      ticket = await prisma.ticket.findFirst({
        where: {
          id: _id,
          merchantId: merchant_id,
        },
        include: { chatHistory: true },
      });
    }

    if (!ticket) {
      // create new ticket
      const ticketId = generateTicketId();
      const title = message.content.slice(0, 60) + (message.content.length > 60 ? "..." : "");

      ticket = await prisma.ticket.create({
        data: {
          ticketId,
          merchantId: merchant_id,
          title,
          status: "open",
          priority: "medium",
          chatHistory: {
            create: {
              messages: [],
            },
          },
        },
        include: { chatHistory: true },
      });

      console.log("[Agent] Created new ticket:", ticket.id);
    }

    // add user message to chat history
    const userMessageData = {
      role: "user",
      content: message.content,
      timestamp: new Date(),
      cards: null,
      toolsUsed: [],
      isHuman: false,
    };

    await prisma.chatHistory.update({
      where: { sessionId: ticket.id },
      data: {
        messages: {
          push: userMessageData,
        },
      },
    });

    // check if ticket is escalated - if so, skip AI webhook
    if (ticket.isEscalated) {
      console.log("[Agent] Ticket is escalated, skipping AI webhook");

      // update ticket timestamp
      await prisma.ticket.update({
        where: { id: ticket.id },
        data: { updatedAt: new Date() },
      });

      return ApiResponse.success(res, {
        success: true,
        ticket_id: ticket.id,
        agent_message: null,
        cards: [],
        tools_used: [],
        is_escalated: true,
      });
    }

    // forward to webhook (only if not escalated)
    const payload = {
      _id: ticket.id,
      merchant_id,
      message: { content: message.content },
    };

    console.log("[Agent] Sending to webhook:", WEBHOOK_URL);
    console.log("[Agent] Payload:", JSON.stringify(payload));

    let agentMessage = "Your request has been received.";
    let cards: any[] = [];
    let toolsUsed: string[] = [];
    let actionsTaken: string[] = [];
    let reasoning: any = null;
    let confidenceScore: number | null = null;
    let complexityScore: number | null = null;

    try {
      const webhookResponse = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const responseText = await webhookResponse.text();

      // log raw response for debugging
      console.log("[Agent] Webhook status:", webhookResponse.status);
      console.log("[Agent] Webhook response length:", responseText.length);
      console.log("[Agent] Webhook raw response:", responseText || "(empty)");

      if (!webhookResponse.ok) {
        console.error("[Agent] Webhook returned error status:", webhookResponse.status);
        agentMessage = "I'm having trouble connecting to the support system. Please try again.";
      } else if (!responseText || responseText.trim() === "") {
        // empty response from webhook
        console.warn("[Agent] Webhook returned empty response");
        agentMessage = "Your request is being processed. Please wait a moment.";
      } else {
        try {
          const data = JSON.parse(responseText);
          console.log("[Agent] Parsed webhook data:", JSON.stringify(data, null, 2));

          const responseData = data.output || data;

          agentMessage =
            responseData.agent_message ||
            responseData.agentMessage ||
            responseData.message ||
            responseData.response ||
            agentMessage;

          cards = responseData.cards || [];
          toolsUsed = responseData.tools_used || responseData.toolsUsed || [];
          actionsTaken = responseData.actions_taken || responseData.actionsTaken || [];
          reasoning = responseData.reasoning || null;
          confidenceScore = responseData.confidence_score || responseData.confidenceScore || null;
          complexityScore = responseData.complexity_score || responseData.complexityScore || null;

          console.log("[Agent] Extracted - message:", agentMessage.slice(0, 100) + "...");
          console.log("[Agent] Extracted - cards:", cards.length);
          console.log("[Agent] Extracted - tools_used:", toolsUsed);
          console.log("[Agent] Extracted - actions_taken:", actionsTaken);
          console.log("[Agent] Extracted - reasoning:", reasoning);
          console.log("[Agent] Extracted - confidence:", confidenceScore, "complexity:", complexityScore);
        } catch (parseError) {
          console.error("[Agent] Failed to parse webhook response as JSON");
          console.error("[Agent] Parse error:", parseError);
          console.error("[Agent] Response that failed to parse:", responseText.slice(0, 500));
          // use raw text as message if not json
          if (responseText.length > 0 && responseText.length < 2000) {
            agentMessage = responseText;
          }
        }
      }
    } catch (webhookError) {
      console.error("[Agent] Webhook network error:", webhookError);
      agentMessage = "I'm having trouble connecting to the support system. Please try again.";
    }

    // add assistant message to chat history
    const assistantMessageData = {
      role: "assistant",
      content: agentMessage,
      timestamp: new Date(),
      cards: cards.length > 0 ? cards : null,
      toolsUsed: toolsUsed,
      actionsTaken: actionsTaken,
      reasoning: reasoning,
      confidenceScore: confidenceScore,
      complexityScore: complexityScore,
      isHuman: false,
    };

    await prisma.chatHistory.update({
      where: { sessionId: ticket.id },
      data: {
        messages: {
          push: assistantMessageData,
        },
      },
    });

    // update ticket timestamp
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: { updatedAt: new Date() },
    });

    return ApiResponse.success(res, {
      success: true,
      ticket_id: ticket.id,
      agent_message: agentMessage,
      cards,
      tools_used: toolsUsed,
      actions_taken: actionsTaken,
      reasoning,
      confidence_score: confidenceScore,
      complexity_score: complexityScore,
      is_escalated: false,
    });
  } catch (error) {
    console.error("[Agent] Error:", error);
    return ApiResponse.error(res, "Failed to process message", 500);
  }
};

// get all tickets for a merchant
export const getTickets = async (req: Request, res: Response) => {
  try {
    const result = getTicketsSchema.safeParse(req.query);
    if (!result.success) {
      return ApiResponse.validationError(res, result.error);
    }

    const { merchant_id } = result.data;

    const tickets = await prisma.ticket.findMany({
      where: { merchantId: merchant_id },
      include: { chatHistory: true },
      orderBy: { updatedAt: "desc" },
    });

    // normalize response
    const normalizedTickets = tickets.map((ticket) => ({
      _id: ticket.id,
      ticket_id: ticket.ticketId,
      merchant_id: ticket.merchantId,
      status: ticket.status,
      priority: ticket.priority,
      title: ticket.title || "Support Request",
      is_escalated: ticket.isEscalated,
      escalated_at: ticket.escalatedAt,
      chat_history: (ticket.chatHistory?.messages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        cards: msg.cards || [],
        tools_used: msg.toolsUsed || [],
        actions_taken: msg.actionsTaken || [],
        reasoning: msg.reasoning || null,
        confidence_score: msg.confidenceScore || null,
        complexity_score: msg.complexityScore || null,
        is_human: msg.isHuman || false,
      })),
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
    }));

    return ApiResponse.success(res, { tickets: normalizedTickets });
  } catch (error) {
    console.error("[Tickets] Error fetching tickets:", error);
    return ApiResponse.error(res, "Failed to fetch tickets", 500);
  }
};

// get single ticket by id
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const { merchant_id } = req.query;

    const result = getTicketByIdSchema.safeParse({ ticketId, merchant_id });
    if (!result.success) {
      return ApiResponse.validationError(res, result.error);
    }

    const ticket = await prisma.ticket.findFirst({
      where: {
        id: ticketId,
        merchantId: merchant_id as string,
      },
      include: { chatHistory: true },
    });

    if (!ticket) {
      return ApiResponse.notFound(res, "Ticket not found");
    }

    const normalizedTicket = {
      _id: ticket.id,
      ticket_id: ticket.ticketId,
      merchant_id: ticket.merchantId,
      status: ticket.status,
      priority: ticket.priority,
      title: ticket.title || "Support Request",
      is_escalated: ticket.isEscalated,
      escalated_at: ticket.escalatedAt,
      chat_history: (ticket.chatHistory?.messages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp,
        cards: msg.cards || [],
        tools_used: msg.toolsUsed || [],
        actions_taken: msg.actionsTaken || [],
        reasoning: msg.reasoning || null,
        confidence_score: msg.confidenceScore || null,
        complexity_score: msg.complexityScore || null,
        is_human: msg.isHuman || false,
      })),
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
    };

    return ApiResponse.success(res, { ticket: normalizedTicket });
  } catch (error) {
    console.error("[Tickets] Error fetching ticket:", error);
    return ApiResponse.error(res, "Failed to fetch ticket", 500);
  }
};

// get chat history for a ticket
export const getChatHistory = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;

    const chatHistory = await prisma.chatHistory.findUnique({
      where: { sessionId: ticketId },
    });

    if (!chatHistory) {
      return ApiResponse.notFound(res, "Chat history not found");
    }

    const messages = (chatHistory.messages || []).map((msg: any) => ({
      role: msg.role,
      content: msg.content,
      timestamp: msg.timestamp,
      cards: msg.cards || [],
      tools_used: msg.toolsUsed || [],
      actions_taken: msg.actionsTaken || [],
      reasoning: msg.reasoning || null,
      confidence_score: msg.confidenceScore || null,
      complexity_score: msg.complexityScore || null,
      is_human: msg.isHuman || false,
    }));

    return ApiResponse.success(res, { messages });
  } catch (error) {
    console.error("[ChatHistory] Error fetching chat history:", error);
    return ApiResponse.error(res, "Failed to fetch chat history", 500);
  }
};

// update ticket status
export const updateTicketStatus = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const result = updateTicketStatusSchema.safeParse(req.body);

    if (!result.success) {
      return ApiResponse.validationError(res, result.error);
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: result.data.status },
    });

    return ApiResponse.success(res, {
      _id: ticket.id,
      status: ticket.status,
    });
  } catch (error) {
    console.error("[Tickets] Error updating status:", error);
    return ApiResponse.error(res, "Failed to update ticket status", 500);
  }
};

// update ticket priority
export const updateTicketPriority = async (req: Request, res: Response) => {
  try {
    const { ticketId } = req.params;
    const result = updateTicketPrioritySchema.safeParse(req.body);

    if (!result.success) {
      return ApiResponse.validationError(res, result.error);
    }

    const ticket = await prisma.ticket.update({
      where: { id: ticketId },
      data: { priority: result.data.priority },
    });

    return ApiResponse.success(res, {
      _id: ticket.id,
      priority: ticket.priority,
    });
  } catch (error) {
    console.error("[Tickets] Error updating priority:", error);
    return ApiResponse.error(res, "Failed to update ticket priority", 500);
  }
};
